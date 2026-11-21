# Briefly

Briefly is a newsletter dashboard built with Next.js and Supabase Auth.

## Supabase setup

Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in your local environment.
Run the SQL in
[`supabase/migrations/202611210001_newsletters.sql`](./supabase/migrations/202611210001_newsletters.sql)
in your Supabase project to create the user-owned newsletters table, row-level
security policies, and thumbnail bucket.
Apply
[`supabase/migrations/202611210002_newsletter_delivery.sql`](./supabase/migrations/202611210002_newsletter_delivery.sql)
to add timezone-aware delivery tracking and schedule the Supabase Cron dispatcher.
Then apply
[`supabase/migrations/202611210003_newsletter_delivery_every_five_minutes.sql`](./supabase/migrations/202611210003_newsletter_delivery_every_five_minutes.sql)
to set its polling interval to five minutes. If migration 002 was already
applied, only migration 003 is needed.

## Scheduled newsletter delivery

The Supabase Cron job runs every five minutes and calls the protected
`/api/cron/newsletters` endpoint. A newsletter is sent at or after its selected
time in the browser's timezone, typically within five minutes, and no more than
once per local calendar day.
Every-other-day delivery is anchored to the newsletter creation date; weekly
delivery uses its creation weekday; monthly delivery uses its creation day
(clamped to the last day of shorter months). The dispatcher processes up to five
newsletters per run and retries failed sends on the next run.

Configure these server-side environment variables on the Next.js host:

- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (server only; never expose the
  service-role key to browser code)
- `OPENROUTER_API_KEY`
- `NEWSLETTER_CRON_SECRET` (a long random secret)
- `SMTP_USERNAME=Brieflynews.ai@gmail.com`
- `SMTP_PASSWORD` (a Google App Password for the sending account)
- Optionally, `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, and
  `EMAIL_SENDER_SCRIPT_PATH` if the Python sender is not at its default path.

The Node host must have Python 3 available as `python3`, and the
`src/lib/send_email.py` file must be present at runtime. Do not put SMTP
credentials or the service-role key in the repository or send them in chat.
OpenRouter's online model is used for web-grounded article research, and
Openverse provides topic-related Creative Commons images with attribution in
each newsletter.

After deploying the Next.js app and setting its environment variables, store
the public cron endpoint and the same cron secret in Supabase Vault:

```sql
select vault.create_secret(
  'https://YOUR_APP_HOST/api/cron/newsletters',
  'briefly_cron_url'
);
select vault.create_secret(
  'YOUR_NEWSLETTER_CRON_SECRET',
  'briefly_cron_secret'
);
```

Replace the example URL and secret before running these statements. The sender
must have Gmail two-step verification and an App Password enabled. Mail is sent
from `Brieflynews.ai@gmail.com`; SMTP credentials are read from the hosting
environment at delivery time.

Create the initial account at `/signup` with `cahove16@gmail.com` and the
desired name. The email is prefilled locally. Use the existing admin password
(`briefly_password`) if you want to keep using it. If email confirmation is
enabled in Supabase, confirm the account from the email before signing in. The
legacy username `admin` remains an alias for this email.

## Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Settings are at
`/settings/account` and `/settings/subscription`; newsletter creation is at
`/create/build`, followed by `/create/deploy`.
