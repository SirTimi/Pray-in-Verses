# Prisma migration image and Cloud Run recovery

## Why the Prisma-schema error occurs

The serving image built from `api/Dockerfile` intentionally includes `dist/` and the generated Prisma Client, but not `prisma/schema.prisma`, migrations or the Prisma CLI. Its default command is `node dist/main.js`. Running `npx prisma migrate deploy` inside the *serving* image therefore fails; the missing file does **not** prove the database has lost its schema.

The migration target defined in `api/Dockerfile` is a separate one-off image based on the builder stage. It carries the pinned Prisma CLI, `prisma/schema.prisma`, and the migrations. It does not execute migrations during image build or push.

## Identify which Cloud Run workload is failing

Run these commands in a Cloud Shell session with access to the Pray in Verses Google Cloud project:

```bash
gcloud run services describe pray-in-verses-api --project=pray-in-verses --region=europe-west1 --format='yaml(spec.template.spec.containers)'
gcloud run jobs list --project=pray-in-verses --region=europe-west1
```

If the service's container startup command was overridden to run Prisma, return it to the serving command **only after confirming the affected service and its image**:

```bash
gcloud run services update pray-in-verses-api --project=pray-in-verses --region=europe-west1 --command=node --args=dist/main.js
```

If the errors instead come from an existing migration **job**, keep that job separate from the HTTP service; do not run Prisma commands against the serving image.

## Build the one-off migration image

From the repository root, after pulling `main`:

```bash
gcloud builds submit . --project=pray-in-verses --config=cloudbuild.migrator.yaml
```

This produces `gcr.io/pray-in-verses/pray-in-verses-api-migrator`; it does not run a migration. The image's default command is `./node_modules/.bin/prisma migrate deploy --schema=./prisma/schema.prisma`.

## Run migrations as a one-off existing Cloud Run job

Inspect the existing migration job's configuration before updating it:

```bash
gcloud run jobs describe JOB_NAME --project=pray-in-verses --region=europe-west1 --format=yaml
```

Check that the job has the intended service account, `DATABASE_URL` secret or other database credential, network/VPC/Cloud SQL connectivity, and access to the intended database. **Do not print or paste secret values into logs.** Back up the database and review pending migrations before proceeding.

Once those settings are verified, update the *existing* migration job (replace `JOB_NAME` with its real name):

```bash
gcloud run jobs update JOB_NAME --project=pray-in-verses --region=europe-west1 \
  --image=gcr.io/pray-in-verses/pray-in-verses-api-migrator \
  --command=./node_modules/.bin/prisma \
  --args=migrate,deploy,--schema=./prisma/schema.prisma \
  --tasks=1 --max-retries=0
```

Then, with database readiness confirmed, execute it once:

```bash
gcloud run jobs execute JOB_NAME --project=pray-in-verses --region=europe-west1 --wait
```

Prisma's `migrate deploy` applies pending migrations. Run it before deploying an API version that requires the new Prayer Wall safety tables. Do not use `prisma migrate dev` or `prisma db push` against production.

## Validation and release order

1. Check the migration job completes successfully and logs indicate all required migrations applied.
2. Verify the serving API is running `node dist/main.js` and its health endpoint responds.
3. Exercise Prayer Wall reporting, blocking, moderation permissions and visibility with disposable accounts.
4. Confirm root web build and API Jest/build checks independently. Do not treat the schema error as resolving these other gates.

Note: Docker builds and Cloud Run commands cannot be executed from the connected repository tools. The commands above require execution in the authorized Google Cloud project.
