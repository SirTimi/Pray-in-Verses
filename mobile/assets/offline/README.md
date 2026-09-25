# Pray in Verses Offline Content

This directory is the build target for the public offline Scripture/prayer library.

The real content is generated from the production PostgreSQL `CuratedPrayer` table. Do not hand-edit generated JSON packs.

From `api/`, in an environment where `DATABASE_URL` points to the intended Pray in Verses database, run:

```bash
npm run offline:export
```

The exporter:

- reads only `PUBLISHED` `CuratedPrayer` rows;
- writes one minified JSON pack per Bible book;
- writes `manifest.json` with counts, byte sizes, content versions and SHA-256 hashes;
- generates `mobile/src/generated/offline-packs.ts` with static imports so Expo/Metro can include every pack in native builds;
- removes stale generated JSON packs before writing the new export;
- refuses to generate an empty library.

Generated book packs intentionally contain public prayer content only. User saves, journals, Prayer Wall data, account details and other private state are never exported.

## Important

Never commit `.env`, `DATABASE_URL`, database dumps, or credentials. Only the generated public offline packs, manifest, and generated TypeScript registry are intended for the mobile app bundle.

After generating, inspect `manifest.json` before committing. In particular check:

- `totalBooks`
- `totalPrayers`
- `totalPrayerPoints`
- `totalBytes`
- per-book `bytes` and hashes

The mobile reader/import layer is wired in a separate implementation cycle after a real export exists and its size has been reviewed.
