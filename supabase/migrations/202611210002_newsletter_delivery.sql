alter table public.newsletters
  add column if not exists timezone text not null default 'UTC',
  add column if not exists last_sent_at timestamptz,
  add column if not exists delivery_claimed_at timestamptz;

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select cron.unschedule(jobid)
from cron.job
where jobname = 'briefly-newsletter-dispatch';

select cron.schedule(
  'briefly-newsletter-dispatch',
  '* * * * *',
  $cron$
    select net.http_post(
      url := (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'briefly_cron_url'
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'briefly_cron_secret'
        )
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 300000
    )
    where exists (
      select 1 from vault.decrypted_secrets where name = 'briefly_cron_url'
    )
    and exists (
      select 1 from vault.decrypted_secrets where name = 'briefly_cron_secret'
    );
  $cron$
);
