// src/pages/BookPage.jsx
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getBookName, getTotalChapters } from "../data/bibleStructure";
import { usePageLogger } from "../hooks/usePageLogger";

const BookPage = () => {
  const { bookSlug } = useParams();
  const navigate = useNavigate();

  // Single source of truth: slug -> { name, chapters[] }
  const bookTitle = getBookName(bookSlug);          // null if slug is unknown
  const chaptersTotal = getTotalChapters(bookSlug); // 0 if slug is unknown
  const isValidBook = Boolean(bookTitle) && chaptersTotal > 0;

  useEffect(() => {
    document.title = isValidBook ? `${bookTitle} – Book` : "Book not found";
  }, [bookTitle, isValidBook]);

  // Hooks must run unconditionally — keep this above any early return.
  usePageLogger({
    title: isValidBook ? `${bookTitle} - Book Overview` : "Unknown Book",
    type: "page",
    reference: bookTitle ?? bookSlug ?? "unknown",
    content: `Browsing chapters of ${bookTitle ?? bookSlug ?? "unknown book"}`,
    category: "Bible Study",
  });

  if (!isValidBook) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-[100px] px-4 lg:pl-[224px] lg:pr-6 lg:pb-8">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-1.5 mb-6 rounded-lg bg-white shadow-sm border border-gray-200 text-[#0C2E8A] font-medium transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Book Not Found</h2>
            <p className="text-red-600">
              {bookSlug ? `We couldn't find a book matching "${bookSlug}".` : "No book was specified in the URL."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const chapters = Array.from({ length: chaptersTotal }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-[100px] px-4 lg:pl-[224px] lg:pr-6 lg:pb-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white shadow-sm border border-gray-200 text-[#0C2E8A] font-medium transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-base font-semibold text-[#0C2E8A] text-center truncate">{bookTitle}</h1>
          <div className="text-xs text-gray-500 w-20 text-right">
            {chaptersTotal} {chaptersTotal === 1 ? "chapter" : "chapters"}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.01 }}
          className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-14 xl:grid-cols-16 gap-1 justify-items-center"
        >
          {chapters.map((chapter) => (
            <motion.div key={chapter} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.98 }}>
              <Link to={`/book/${bookSlug}/chapter/${chapter}`} aria-label={`Chapter ${chapter}`}>
                <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 text-[#0C2E8A] font-semibold text-base transition transform hover:-translate-y-0.5 hover:bg-[#0C2E8A] hover:text-white cursor-pointer">
                  {chapter}
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default BookPage;