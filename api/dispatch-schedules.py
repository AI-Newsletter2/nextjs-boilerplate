# dispatch-schedules.py probably not needed
from http.server import BaseHTTPRequestHandler
from concurrent.futures import ThreadPoolExecutor
import os
import json
import requests
from datetime import datetime, timezone
from supabase import create_client

supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_ROLE_KEY"],
)


def fire_worker(schedule_id):
    """Fire-and-forget: send the request, don't wait for the worker to finish."""
    try:
        requests.post(
            f"{os.environ['BASE_URL']}/api/process-one-email",
            json={"schedule_id": schedule_id},
            headers={"Authorization": f"Bearer {os.environ['INTERNAL_SECRET']}"},
            timeout=2,  # intentionally short
        )
    except requests.exceptions.ReadTimeout:
        pass  # expected: the request was sent and the worker is running on its own
    except Exception as e:
        # Request never went out, so release the claim for the next cycle
        print(f"Failed to dispatch {schedule_id}: {e}")
        supabase.table("email_schedules") \
            .update({"status": "idle"}) \
            .eq("id", schedule_id).execute()


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.headers.get("Authorization") != f"Bearer {os.environ.get('CRON_SECRET')}":
            self.send_response(401)
            self.end_headers()
            return

        now = datetime.now(timezone.utc).isoformat()

        due = supabase.table("email_schedules") \
            .select("id") \
            .eq("status", "idle") \
            .eq("is_active", True) \
            .lte("next_run_at", now) \
            .execute()

        claimed_ids = []
        for row in due.data:
            # Claim the row. The .eq("status", "idle") makes this atomic,
            # so an overlapping run can't claim the same schedule.
            claim = supabase.table("email_schedules") \
                .update({"status": "processing"}) \
                .eq("id", row["id"]) \
                .eq("status", "idle") \
                .execute()
            if claim.data:
                claimed_ids.append(row["id"])

        with ThreadPoolExecutor(max_workers=10) as pool:
            list(pool.map(fire_worker, claimed_ids))

        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"dispatched": len(claimed_ids)}).encode())