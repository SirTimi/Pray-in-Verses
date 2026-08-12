// src/utils/bible.js
// Derived from src/data/bibleStructure.js so there is exactly ONE source of
// truth for book names, slugs and chapter/verse counts. Nothing here is
// hand-maintained any more.
import { bibleStructure, getAllBookSlugs } from "../data/bibleStructure";

// Canonical book order, taken straight from the structure's key order.
export const bibleBooks = getAllBookSlugs().map((slug) => bibleStructure[slug].name);

// { "Song of Solomon": 8, ... } — kept for backwards compatibility with any
// display code that still keys by name. Prefer getTotalChapters(slug).
export const chapterCounts = Object.fromEntries(
  getAllBookSlugs().map((slug) => [bibleStructure[slug].name, bibleStructure[slug].chapters.length])
);

// name -> slug. Handles punctuation and collapses repeated separators, so
// "Song of Solomon" -> "song-of-solomon" and "1 Samuel" -> "1-samuel".
export const slugify = (name = "") =>
  String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// slug -> canonical display name. Direct map hit, no title-casing guesswork.
export const findBookBySlug = (slug) => bibleStructure[slug]?.name ?? null;