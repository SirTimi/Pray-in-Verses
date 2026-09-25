const { PrismaClient } = require('@prisma/client');
const { createHash } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');

const prisma = new PrismaClient();

const SCHEMA_VERSION = 1;
const OUTPUT_DIR = path.resolve(__dirname, '../../mobile/assets/offline');
const REGISTRY_PATH = path.resolve(
  __dirname,
  '../../mobile/src/generated/offline-packs.ts',
);

function slugifyBook(book) {
  return String(book)
    .normalize('NFKD')
    .replace(/[’']/g, '')
    .replace(/&/g, 'and')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function sha256(text) {
  return createHash('sha256')
    .update(text)
    .digest('hex');
}

function toPublicRecord(row) {
  return {
    id: row.id,
    book: row.book,
    chapter: row.chapter,
    verse: row.verse,
    reference: `${row.book} ${row.chapter}:${row.verse}`,
    theme: row.theme,
    scriptureText: row.scriptureText,
    insight: row.insight,
    prayerPoints: Array.isArray(row.prayerPoints) ? row.prayerPoints : [],
    closing: row.closing,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function registryIdentifier(slug) {
  return `pack_${slug.replace(/[^a-zA-Z0-9_]/g, '_')}`;
}

async function clearPreviousGeneratedFiles() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const entries = await fs.readdir(OUTPUT_DIR, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map((entry) => fs.unlink(path.join(OUTPUT_DIR, entry.name))),
  );

  await fs.mkdir(path.dirname(REGISTRY_PATH), { recursive: true });
  await fs.rm(REGISTRY_PATH, { force: true });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is required. Run this command in an environment that can read the Pray in Verses production database.',
    );
  }

  await clearPreviousGeneratedFiles();

  const groupedBooks = await prisma.curatedPrayer.groupBy({
    by: ['book'],
    where: { state: 'PUBLISHED' },
    _count: { _all: true },
  });

  const books = groupedBooks
    .map((row) => row.book)
    .sort((a, b) => a.localeCompare(b));

  if (books.length === 0) {
    throw new Error(
      'No published CuratedPrayer rows were found. Refusing to generate an empty offline library.',
    );
  }

  const manifestBooks = [];
  let totalPrayers = 0;
  let totalPrayerPoints = 0;
  let totalBytes = 0;
  let latestUpdatedAt = null;

  for (const book of books) {
    const rows = await prisma.curatedPrayer.findMany({
      where: {
        state: 'PUBLISHED',
        book: { equals: book, mode: 'insensitive' },
      },
      orderBy: [
        { chapter: 'asc' },
        { verse: 'asc' },
      ],
      select: {
        id: true,
        book: true,
        chapter: true,
        verse: true,
        theme: true,
        scriptureText: true,
        insight: true,
        prayerPoints: true,
        closing: true,
        updatedAt: true,
      },
    });

    if (rows.length === 0) continue;

    const slug = slugifyBook(book);
    const fileName = `${slug}.json`;
    const chapters = [...new Set(rows.map((row) => row.chapter))];
    const prayerPointCount = rows.reduce(
      (sum, row) =>
        sum + (Array.isArray(row.prayerPoints) ? row.prayerPoints.length : 0),
      0,
    );
    const bookLatestUpdatedAt = rows.reduce(
      (latest, row) =>
        !latest || row.updatedAt > latest
          ? row.updatedAt
          : latest,
      null,
    );

    const pack = {
      schemaVersion: SCHEMA_VERSION,
      book,
      slug,
      contentVersion: bookLatestUpdatedAt
        ? bookLatestUpdatedAt.toISOString()
        : null,
      prayers: rows.map(toPublicRecord),
    };

    const fileContents = `${JSON.stringify(pack)}\n`;
    const bytes = Buffer.byteLength(fileContents);

    await fs.writeFile(
      path.join(OUTPUT_DIR, fileName),
      fileContents,
      'utf8',
    );

    manifestBooks.push({
      book,
      slug,
      file: fileName,
      chapters: chapters.length,
      prayers: rows.length,
      prayerPoints: prayerPointCount,
      bytes,
      sha256: sha256(fileContents),
      contentVersion: pack.contentVersion,
    });

    totalPrayers += rows.length;
    totalPrayerPoints += prayerPointCount;
    totalBytes += bytes;

    if (
      bookLatestUpdatedAt &&
      (!latestUpdatedAt || bookLatestUpdatedAt > latestUpdatedAt)
    ) {
      latestUpdatedAt = bookLatestUpdatedAt;
    }

    console.log(
      `Exported ${book}: ${rows.length.toLocaleString()} verse record(s), ${prayerPointCount.toLocaleString()} prayer point(s), ${(bytes / 1024 / 1024).toFixed(2)} MB`,
    );
  }

  const manifest = {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    contentVersion: latestUpdatedAt
      ? latestUpdatedAt.toISOString()
      : null,
    source: 'CuratedPrayer.PUBLISHED',
    totalBooks: manifestBooks.length,
    totalPrayers,
    totalPrayerPoints,
    totalBytes,
    books: manifestBooks,
  };

  const manifestContents = `${JSON.stringify(manifest, null, 2)}\n`;
  await fs.writeFile(
    path.join(OUTPUT_DIR, 'manifest.json'),
    manifestContents,
    'utf8',
  );

  const imports = manifestBooks
    .map((entry) => {
      const identifier = registryIdentifier(entry.slug);
      return `import ${identifier} from '../../assets/offline/${entry.file}';`;
    })
    .join('\n');

  const mapEntries = manifestBooks
    .map((entry) => {
      const identifier = registryIdentifier(entry.slug);
      return `  ${JSON.stringify(entry.slug)}: ${identifier} as OfflinePrayerPack,`;
    })
    .join('\n');

  const registry = `// AUTO-GENERATED by api/scripts/export-offline-content.cjs.
// Do not edit by hand. Regenerate with: npm run offline:export (from api/)

import manifest from '../../assets/offline/manifest.json';
${imports}

export type OfflinePrayerRecord = {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  reference: string;
  theme: string;
  scriptureText: string;
  insight: string;
  prayerPoints: string[];
  closing: string;
  updatedAt: string;
};

export type OfflinePrayerPack = {
  schemaVersion: number;
  book: string;
  slug: string;
  contentVersion: string | null;
  prayers: OfflinePrayerRecord[];
};

export type OfflineManifestBook = {
  book: string;
  slug: string;
  file: string;
  chapters: number;
  prayers: number;
  prayerPoints: number;
  bytes: number;
  sha256: string;
  contentVersion: string | null;
};

export type OfflineManifest = {
  schemaVersion: number;
  exportedAt: string;
  contentVersion: string | null;
  source: string;
  totalBooks: number;
  totalPrayers: number;
  totalPrayerPoints: number;
  totalBytes: number;
  books: OfflineManifestBook[];
};

export const offlineManifest = manifest as OfflineManifest;

export const offlinePrayerPacks: Record<string, OfflinePrayerPack> = {
${mapEntries}
};
`;

  await fs.writeFile(REGISTRY_PATH, registry, 'utf8');

  console.log('');
  console.log('Offline export complete.');
  console.log(`Books: ${manifest.totalBooks.toLocaleString()}`);
  console.log(`Verse records: ${manifest.totalPrayers.toLocaleString()}`);
  console.log(`Prayer points: ${manifest.totalPrayerPoints.toLocaleString()}`);
  console.log(
    `Pack size: ${(manifest.totalBytes / 1024 / 1024).toFixed(2)} MB`,
  );
  console.log(`Manifest: ${path.join(OUTPUT_DIR, 'manifest.json')}`);
  console.log(`Registry: ${REGISTRY_PATH}`);
  console.log('');
  console.log(
    'Review the generated manifest/size, then commit the offline assets and generated registry so EAS includes them in Android/iOS builds.',
  );
}

main()
  .catch((error) => {
    console.error('');
    console.error('Offline export failed.');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
