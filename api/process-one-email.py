from http.server import BaseHTTPRequestHandler
import os
import json
from datetime import datetime, timezone
from supabase import create_client
from croniter import croniter
import resend

supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_ROLE_KEY"],
)
resend.api_key = os.environ["RESEND_API_KEY"]


def generate_email_html(schedule) -> str:
    # Your slow HTML-generation logic goes here
    # (call an LLM, pull data, render a template, etc.)
    return schedule["body_html"]


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.headers.get("Authorization") != f"Bearer {os.environ.get('INTERNAL_SECRET')}":
            self.send_response(401)
            self.end_headers()
            return

        length = int(self.headers.get("Content-Length", 0))
        schedule_id = json.loads(self.rfile.read(length))["schedule_id"]

        schedule = supabase.table("email_schedules") \
            .select("*") \
            .eq("id", schedule_id) \
            .single() \
            .execute().data

        try:
            html = generate_email_html(schedule)

            resend.Emails.send({
                "from": "you@yourdomain.com",  # must be a domain verified in Resend
                "to": schedule["to_email"],
                "subject": schedule["subject"],
                "html": html,
            })

            now = datetime.now(timezone.utc)
            next_run = croniter(schedule["cron_expression"], now).get_next(datetime)

            supabase.table("email_schedules").update({
                "status": "idle",
                "last_run_at": now.isoformat(),
                "next_run_at": next_run.isoformat(),
            }).eq("id", schedule_id).execute()

        except Exception as e:
            print(f"Failed schedule {schedule_id}: {e}")
            supabase.table("email_schedules") \
                .update({"status": "failed"}) \
                .eq("id", schedule_id).execute()

        self.send_response(200)
        self.end_headers()