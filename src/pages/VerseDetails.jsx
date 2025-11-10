// src/pages/VerseDetails.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Bookmark, Check, ArrowRight, ArrowLeftCircle } from "lucide-react";
import banner from "../assets/images/suggest/two-lovers-studying-the-bible-it-is-god-s-love-for-2022-06-18-20-18-08-utc.jpg";
import { usePageLogger } from "../hooks/usePageLogger";
import { logPrayer } from "../utils/historyLogger";
import VERSE_COUNTS from "../constants/verse-counts.json";

const API_BASE = import.meta.env.VITE_API_BASE || "";
function apiURL(path) {
  if (!API_BASE) return path;
  const base = API_BASE.replace(/\/$/, "");
  return path.startsWith("/") ? base + path : base + "/" + path;
}
async function request(path, { method = "GET", body, headers = {}, allow401 = false } = {}) {
  const res = await fetch(apiURL(path), {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text().catch(() => "");
  let payload = {};
  try { payload = text ? JSON.parse(text) : {}; } catch {}
  if (!res.ok) {
    if (allow401 && res.status === 401) return null;
    const err = new Error(payload?.message || res.statusText || "Request failed");
    err.status = res.status;
    err.payload = payload;
    throw err;
  }
  return payload;
}

const CANONICAL_BOOKS = [
  "Genesis","Exodus","Leviticus","Numbers","Deuteronomy",
  "Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles",
  "Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon",
  "Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel",
  "Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah",
  "Haggai","Zechariah","Malachi",
  "Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians",
  "Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy",
  "Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation",
];

const BOOK_ALIASES = { "Song of Solomon": ["Song of Songs", "Canticles"], Psalms: ["Psalm"] };

function slugifyBook(name) {
  return String(name)
    .normalize("NFKD")
    .replace(/[’']/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/gi, "")
    .toLowerCase();
}
function resolveBookName(slugOrName) {
  if (!slugOrName) return "";
  const lower = slugOrName.toLowerCase();
  const exact = CANONICAL_BOOKS.find((b) => b.toLowerCase() === lower);
  if (exact) return exact;
  const bySlug = CANONICAL_BOOKS.find((b) => slugifyBook(b) === lower);
  if (bySlug) return bySlug;
  for (const [canon, aliases] of Object.entries(BOOK_ALIASES)) {
    if (aliases.some((a) => a.toLowerCase() === lower || slugifyBook(a) === lower)) return canon;
  }
  return String(slugOrName)
    .split("-")
    .map((t) => (t.length ? t[0].toUpperCase() + t.slice(1).toLowerCase() : ""))
    .join(" ");
}

/** Next reference (book/chapter/verse) */
function getNextRef(bookName, chapter, verse) {
  const chapters = VERSE_COUNTS?.[bookName];
  const bookIndex = CANONICAL_BOOKS.indexOf(bookName);
  if (!Array.isArray(chapters) || bookIndex === -1) return null;

  const versesInThisChapter = Number(chapters[chapter - 1] || 0);
  if (versesInThisChapter <= 0) return null;

  if (verse < versesInThisChapter) return { book: bookName, chapter, verse: verse + 1 };
  if (chapter < chapters.length)  return { book: bookName, chapter: chapter + 1, verse: 1 };

  const nextBook = CANONICAL_BOOKS[bookIndex + 1];
  const nextChapters = nextBook ? VERSE_COUNTS?.[nextBook] : null;
  if (!nextBook || !Array.isArray(nextChapters) || nextChapters.length === 0) return null;
  return { book: nextBook, chapter: 1, verse: 1 };
}

/** Previous reference (book/chapter/verse) */
function getPrevRef(bookName, chapter, verse) {
  const chapters = VERSE_COUNTS?.[bookName];
  const bookIndex = CANONICAL_BOOKS.indexOf(bookName);
  if (!Array.isArray(chapters) || bookIndex === -1) return null;

  if (verse > 1) return { book: bookName, chapter, verse: verse - 1 };

  if (chapter > 1) {
    const prevChapterVerses = Number(chapters[chapter - 2] || 0);
    if (prevChapterVerses > 0) {
      return { book: bookName, chapter: chapter - 1, verse: prevChapterVerses };
    }
    return null;
  }

  const prevBook = CANONICAL_BOOKS[bookIndex - 1];
  const prevChapters = prevBook ? VERSE_COUNTS?.[prevBook] : null;
  if (!prevBook || !Array.isArray(prevChapters) || prevChapters.length === 0) return null;

  const lastChapter = prevChapters.length;
  const lastVerse   = Number(prevChapters[lastChapter - 1] || 0);
  if (lastVerse <= 0) return null;

  return { book: prevBook, chapter: lastChapter, verse: lastVerse };
}

const VerseDetails = () => {
  const { bookSlug, chapterNumber, verseNumber } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [curated, setCurated] = useState(null);
  const [error, setError] = useState("");
  const [needsAuth, setNeedsAuth] = useState(false);

  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const [savedPointKeys, setSavedPointKeys] = useState(() => new Set());
  const [busyPointKeys, setBusyPointKeys] = useState(() => new Set());

  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const showToast = (msg) => { setToastMessage(msg); setToastVisible(true); setTimeout(() => setToastVisible(false), 3000); };

  const bookNameFromRoute = useMemo(() => resolveBookName(bookSlug), [bookSlug]);
  const chapterFromRoute = useMemo(() => Number(chapterNumber), [chapterNumber]);
  const verseFromRoute   = useMemo(() => Number(verseNumber), [verseNumber]);
  const apiBookParam     = useMemo(() => resolveBookName(bookSlug) || String(bookSlug || ""), [bookSlug]);

  const displayBook    = bookNameFromRoute || curated?.book || "";
  const displayChapter = Number.isFinite(chapterFromRoute) ? chapterFromRoute : Number(curated?.chapter);
  const displayVerse   = Number.isFinite(verseFromRoute)   ? verseFromRoute   : Number(curated?.verse);

  const nextRef = useMemo(() => {
    if (!displayBook || !Number.isFinite(displayChapter) || !Number.isFinite(displayVerse)) return null;
    return getNextRef(displayBook, displayChapter, displayVerse);
  }, [displayBook, displayChapter, displayVerse]);

  const prevRef = useMemo(() => {
    if (!displayBook || !Number.isFinite(displayChapter) || !Number.isFinite(displayVerse)) return null;
    return getPrevRef(displayBook, displayChapter, displayVerse);
  }, [displayBook, displayChapter, displayVerse]);

  const pointKey = (text, index) => `${index}::${String(text || "").trim()}`;
  const allPointKeysFrom = (entry) => {
    const s = new Set();
    if (entry?.prayerPoints && Array.isArray(entry.prayerPoints)) {
      entry.prayerPoints.forEach((t, i) => { if (typeof t === "string") s.add(pointKey(t, i)); });
    }
    return s;
  };

  const refreshSavedState = async (entry) => {
    try {
      const savedRes = await request(`/saved-prayers`);
      const list = savedRes?.data || savedRes || [];

      const wholeSaved = Array.isArray(list) &&
        list.some((it) => it.curatedPrayerId === entry.id && (it.pointIndex === null || typeof it.pointIndex === "undefined"));
      setIsSaved(wholeSaved);

      if (wholeSaved) {
        setSavedPointKeys(allPointKeysFrom(entry));
      } else {
        const keys = new Set();
        if (Array.isArray(list) && Array.isArray(entry.prayerPoints)) {
          for (const it of list) {
            if (it.curatedPrayerId === entry.id) {
              const idx = Number(it.pointIndex);
              if (Number.isFinite(idx) && idx >= 0 && idx < entry.prayerPoints.length) {
                const t = entry.prayerPoints[idx];
                if (typeof t === "string") keys.add(pointKey(t, idx));
              }
            }
          }
        }
        setSavedPointKeys(keys);
      }
    } catch (err) {
      if (err?.status === 401) setNeedsAuth(true);
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setNeedsAuth(false); setError(""); setCurated(null); setIsSaved(false);
      setSavedPointKeys(new Set());

      try {
        const chStr = String(chapterNumber || "").trim();
        const vsStr = String(verseNumber || "").trim();
        if (!/^\d+$/.test(chStr) || !/^\d+$/.test(vsStr)) throw new Error("Invalid reference.");

        const verseRes = await request(`/browse/verse/${encodeURIComponent(apiBookParam)}/${chStr}/${vsStr}`);
        const data = verseRes?.data || verseRes;
        if (!alive) return;
        if (!data) throw new Error("No curated content for this verse yet.");
        setCurated(data);

        await refreshSavedState(data);
      } catch (err) {
        if (!alive) return;
        if (err?.status === 401) { setNeedsAuth(true); setError(""); }
        else setError(err?.message || "Could not load verse content.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [apiBookParam, chapterNumber, verseNumber]);

  const refLabel = useMemo(() => {
    const ch = Number.isFinite(displayChapter) ? displayChapter : "?";
    const vs = Number.isFinite(displayVerse) ? displayVerse : "?";
    return `${displayBook} ${ch}:${vs}`;
  }, [displayBook, displayChapter, displayVerse]);

  useEffect(() => { if (refLabel) document.title = refLabel; }, [refLabel]);

  usePageLogger({
    title: refLabel,
    type: "verse",
    reference: refLabel,
    content: "Viewed Bible verse details and reflections",
    category: "Bible Study",
  });

  async function onToggleSaveWhole(pointTextForLog) {
    if (!curated?.id) return;
    setSaving(true);
    try {
      if (isSaved) {
        await request(`/saved-prayers/${curated.id}`, { method: "DELETE" });
        setIsSaved(false);
        setSavedPointKeys(new Set());
        showToast("Removed from Saved ✅");
      } else {
        await request(`/saved-prayers/${curated.id}`, { method: "POST" });
        setIsSaved(true);
        setSavedPointKeys(allPointKeysFrom(curated));
        showToast("Saved ✅");
        if (pointTextForLog) logPrayer("Prayer Point Saved", pointTextForLog, refLabel);
        else if (Array.isArray(curated.prayerPoints) && curated.prayerPoints[0]) {
          logPrayer("Prayer Point Saved", curated.prayerPoints[0], refLabel);
        }
      }
      await refreshSavedState(curated);
    } catch (err) {
      if (err.status === 401) { setNeedsAuth(true); showToast("Please sign in to save."); }
      else showToast(err?.message || "Action failed");
    } finally { setSaving(false); }
  }

  async function onToggleSavePoint(e, pointText, index) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!curated?.id) return;

    const key = pointKey(pointText, index);
    const willSave = !savedPointKeys.has(key);

    setSavedPointKeys((prev) => {
      const next = new Set(prev);
      if (willSave) next.add(key); else next.delete(key);
      return next;
    });
    setBusyPointKeys((s) => new Set(s).add(key));

    try {
      const url = `/saved-prayers/${encodeURIComponent(curated.id)}/points/${encodeURIComponent(index)}`;
      if (willSave) {
        await request(url, { method: "POST", body: { text: pointText } });
        logPrayer("Prayer Point Saved", pointText, refLabel);
      } else {
        await request(url, { method: "DELETE" });
      }
      await refreshSavedState(curated);
    } catch (err) {
      setSavedPointKeys((prev) => {
        const next = new Set(prev);
        if (willSave) next.delete(key); else next.add(key);
        return next;
      });
      if (err?.status === 401) { setNeedsAuth(true); showToast("Please sign in to save."); }
      else showToast(err?.message || "Action failed");
    } finally {
      setBusyPointKeys((s) => { const n = new Set(s); n.delete(key); return n; });
    }
  }

  function goNext() {
    if (!nextRef) return;
    navigate(`/book/${slugifyBook(nextRef.book)}/chapter/${nextRef.chapter}/verse/${nextRef.verse}`);
  }
  function goPrev() {
    if (!prevRef) return;
    navigate(`/book/${slugifyBook(prevRef.book)}/chapter/${prevRef.chapter}/verse/${prevRef.verse}`);
  }

  // Arrow key navigation (Right → next, Left → prev). Ignores typing in inputs.
  useEffect(() => {
    function onKey(e) {
      const tag = (e.target?.tagName || "").toLowerCase();
      if (e.defaultPrevented) return;
      if (["input", "textarea", "select"].includes(tag)) return;
      if (e.target?.isContentEditable) return;

      if (e.key === "ArrowRight" && nextRef) {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft" && prevRef) {
        e.preventDefault();
        goPrev();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nextRef, prevRef]); // keep it simple; no visual changes

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-20 lg:pl-[224px] pb-12">
        <div className="relative w-full h-48 md:h-64"><div className="absolute inset-0 bg-gray-200 animate-pulse" /></div>
        <div className="max-w-3xl mx-auto px-6 -mt-12">
          <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-100">
            <div className="h-6 w-1/2 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse mb-6" />
            <div className="h-24 w-full bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if ((error && !needsAuth) || !curated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-20 lg:pl-[224px] pb-12">
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-100">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-6 text-[#0C2E8A] hover:underline">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            {error ? (
              <>
                <div className="text-red-600 mb-2">{error}</div>
                <div className="text-sm text-gray-600">Try another verse or check back later after it’s curated.</div>
              </>
            ) : (
              <div className="text-sm text-gray-600">No content.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const bannerBook = displayBook;
  const bannerChapter = Number.isFinite(displayChapter) ? displayChapter : "?";
  const bannerVerse = Number.isFinite(displayVerse) ? displayVerse : "?";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-20 lg:pl-[224px] pb-12">
      {toastVisible && (
        <div className="fixed top-24 right-6 bg-white shadow-lg rounded-lg px-4 py-3 border-l-4 border-green-500 z-50 animate-slide-in">
          <span className="text-gray-800 font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Banner */}
      <div className="relative w-full h-48 md:h-64 flex items-center justify-center text-white">
        <img src={banner} alt="Bible Banner" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50" />
        <h1 className="relative z-10 text-2xl md:text-3xl font-bold text-center px-4">
          {bannerBook} – Chapter {bannerChapter}, Verse {bannerVerse}
        </h1>
      </div>

      <div className="max-w-3xl mx-auto px-6 -mt-12 relative z-10">
        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-100">
          {/* Back + breadcrumb */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#0C2E8A] hover:underline">
              <ArrowLeft className="w-4 h-4" /> Back to Chapter
            </button>
            <div className="text-xs text-gray-500">
              <Link to={`/book/${encodeURIComponent(bookSlug)}`} className="hover:underline">{bannerBook}</Link>
              <span className="mx-1">›</span>
              <Link to={`/book/${encodeURIComponent(bookSlug)}/chapter/${bannerChapter}`} className="hover:underline">Chapter {bannerChapter}</Link>
              <span className="mx-1">›</span>
              <span>Verse {bannerVerse}</span>
            </div>
          </div>

          {needsAuth && (
            <div className="mb-4 p-3 rounded border border-yellow-300 bg-yellow-50 text-sm text-yellow-900">
              You’re not signed in. <Link to="/login" className="underline">Sign in</Link> to save prayer points and see your saved list.
            </div>
          )}

          {curated.theme ? (<h2 className="text-xl font-bold text-[#0C2E8A] mb-2">{curated.theme}</h2>) : null}

          {curated.scriptureText ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
              <h3 className="text-sm font-semibold text-[#0C2E8A] mb-2 mt-9 uppercase tracking-wide">Scripture Reference</h3>
              <p className="text-gray-700 leading-relaxed bg-gray-50 border rounded-md p-3">{curated.scriptureText}</p>
            </motion.div>
          ) : null}

          {curated.insight ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mt-6">
              <h3 className="text-lg font-semibold text-[#0C2E8A] mb-2">Short Insight</h3>
              <p className="text-gray-700 leading-relaxed">{curated.insight}</p>
            </motion.div>
          ) : null}

          {/* PRAYER POINTS */}
          {Array.isArray(curated.prayerPoints) && curated.prayerPoints.length > 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#0C2E8A] mb-2 flex items-center gap-2">Prayer Points</h3>
                <div className="text-xs text-gray-500">
                  {Array.from(savedPointKeys).length}/{curated.prayerPoints.length} saved
                </div>
              </div>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                {curated.prayerPoints.map((point, i) => {
                  const k = pointKey(point, i);
                  const saved = savedPointKeys.has(k);
                  const busy = busyPointKeys.has(k);
                  return (
                    <li key={i} className="flex justify-between items-start gap-3">
                      <span className="pr-2">{point}</span>
                      <button
                        type="button"
                        onClick={(e) => onToggleSavePoint(e, point, i)}
                        disabled={busy}
                        className={`flex items-center gap-2 px-2 py-1 rounded-md border text-sm transition ${
                          saved ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-yellow-50"
                        } ${busy ? "opacity-60 cursor-not-allowed" : ""}`}
                        title={saved ? "Unsave prayer point" : "Save prayer point"}
                        aria-pressed={saved}
                      >
                        {saved ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                        <span>{saved ? "Saved" : "Save"}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          ) : null}

          {curated.closing ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-6">
              <h3 className="text-lg font-semibold text-[#0C2E8A] mb-2">Closing Prayer / Confession</h3>
              <p className="text-gray-700 italic leading-relaxed">{curated.closing}</p>
            </motion.div>
          ) : null}

          {/* Actions layout */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-6">
            {/* Prev */}
            <button
              type="button"
              onClick={goPrev}
              disabled={!prevRef}
              className={`px-3 py-2 rounded-md border flex items-center justify-center gap-2 ${
                prevRef ? "bg-white text-[#0C2E8A] hover:bg-blue-50" : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
              title={prevRef ? `Go to ${prevRef.book} ${prevRef.chapter}:${prevRef.verse}` : "Start of Bible"}
            >
              <ArrowLeftCircle className="w-4 h-4" />
              Previous
            </button>

            {/* Next */}
            <button
              type="button"
              onClick={goNext}
              disabled={!nextRef}
              className={`px-3 py-2 rounded-md border flex items-center justify-center gap-2 ${
                nextRef ? "bg-[#0C2E8A] text-white hover:opacity-95" : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
              title={nextRef ? `Go to ${nextRef.book} ${nextRef.chapter}:${nextRef.verse}` : "End of Bible"}
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Journal */}
            <Link
              to={`/journal?ref=${encodeURIComponent(refLabel)}&curatedId=${encodeURIComponent(curated.id)}`}
              className="px-3 py-2 rounded-md border bg-white text-gray-900 text-center col-span-2 sm:col-span-1"
            >
              Open Journal
            </Link>

            {/* Save/Unsave */}
            <div className="col-span-2 sm:col-span-3">
              <button
                onClick={() => onToggleSaveWhole()}
                disabled={!curated?.id || saving}
                className={`w-full mt-3 px-3 py-2 rounded-md border ${
                  isSaved ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-900"
                }`}
              >
                {saving ? "…" : isSaved ? "Unsave" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default VerseDetails;
