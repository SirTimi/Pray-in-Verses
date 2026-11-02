import React from "react";
import toast from "react-hot-toast";
import { api } from "../api";

const TABS = ["PENDING", "HIDDEN", "DISMISSED"];

export default function AdminPrayerReports() {
  const [status, setStatus] = React.useState("PENDING");
  const [reports, setReports] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState("");
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api.listPrayerReports(status);
      if (result?.status !== 200) {
        throw new Error(result?.message || "Could not load the moderation queue.");
      }
      setReports(result?.data || []);
    } catch (err) {
      setError(err.message || "Unable to load reports.");
    } finally {
      setLoading(false);
    }
  }, [status]);

  React.useEffect(() => { void load(); }, [load]);

  async function review(id, decision) {
    if (busy) return;
    if (!window.confirm(decision === "HIDDEN"
      ? "Hide this reported content from the Prayer Wall?"
      : "Dismiss this report without hiding content?")) return;
    setBusy(id);
    try {
      const result = await api.reviewPrayerReport(id, decision);
      if (result?.status !== 200 || !result?.ok) {
        throw new Error(result?.message || "Unable to review report.");
      }
      toast.success(decision === "HIDDEN" ? "Content hidden." : "Report dismissed.");
      await load();
    } catch (err) {
      toast.error(err.message || "Review failed.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-[#0C2E8A]">Prayer Wall Reports</h1>
        <p className="text-sm text-slate-600 mt-1">
          Review community reports, hide inappropriate content or dismiss reports that do not violate the guidelines.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button key={tab} type="button" onClick={() => setStatus(tab)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold border ${status === tab ? "bg-[#0C2E8A] text-white" : "bg-white text-[#0C2E8A]"}`}>
            {tab === "PENDING" ? "Pending" : tab === "HIDDEN" ? "Hidden" : "Dismissed"}
          </button>
        ))}
        <button type="button" onClick={() => void load()} className="ml-auto rounded-lg border px-3 py-2 text-sm">Refresh</button>
      </div>
      {loading ? <p className="text-sm text-slate-500">Loading reports…</p>
        : error ? <p role="alert" className="text-sm text-red-600">{error}</p>
        : reports.length === 0 ? <p className="rounded-xl border bg-slate-50 p-6 text-slate-600">No {status.toLowerCase()} reports.</p>
        : <div className="space-y-3">
          {reports.map((report) => {
            const content = report.content;
            const body = report.targetType === "REQUEST"
              ? [content?.title, content?.description].filter(Boolean).join(" — ")
              : content?.body || "";
            return (
              <article key={report.id} className="rounded-xl border border-slate-200 p-4 space-y-3 bg-white">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <strong>{report.reason.replace(/_/g, " ")}</strong>
                  <span className="text-slate-500">{report.targetType.toLowerCase()}</span>
                  <span className="text-slate-500">{new Date(report.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-xs text-slate-500">Reported by {report.reporter?.displayName || "Community member"}</p>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-sm text-slate-800 whitespace-pre-wrap break-words">
                    {content ? body : "Content is no longer available."}
                  </p>
                </div>
                {report.details && <p className="text-sm text-slate-600"><strong>Reporter notes:</strong> {report.details}</p>}
                {status === "PENDING" && (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={!!busy} onClick={() => void review(report.id, "HIDDEN")}
                      className="rounded-lg bg-red-600 text-white px-4 py-2 text-sm disabled:opacity-50">Hide Content</button>
                    <button type="button" disabled={!!busy} onClick={() => void review(report.id, "DISMISSED")}
                      className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50">Dismiss Report</button>
                  </div>
                )}
              </article>
            );
          })}
        </div>}
    </div>
  );
}
