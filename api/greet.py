from http.server import BaseHTTPRequestHandler
import json


def make_greeting(name: str) -> str:
    # This is "the function in the Python script"
    return f"Hello, {name}, from Python!"


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length) or b"{}")

        result = make_greeting(body.get("name", "stranger"))
        print("greet called with:", body)  # shows in Vercel logs

        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"greeting": result}).encode())