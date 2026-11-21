import json
import os
import smtplib
import ssl
import sys
from email.message import EmailMessage
from email.utils import formataddr
from typing import Any, Optional


def send_email(
    subject: str,
    text_body: str,
    html_body: Optional[str],
    receiver_email: str,
    sender_name: str = "Briefly",
) -> None:
    sender_email = "Brieflynews.ai@gmail.com"
    smtp_username = os.environ.get("SMTP_USERNAME", sender_email)
    smtp_password = os.environ.get("SMTP_PASSWORD")
    smtp_server = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    port = int(os.environ.get("SMTP_PORT", "587"))

    if not smtp_password:
        raise RuntimeError("SMTP_PASSWORD is not configured.")
    if not smtp_username or not sender_email:
        raise RuntimeError("SMTP_USERNAME is required.")

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = formataddr((sender_name, sender_email))
    message["To"] = receiver_email
    message.set_content(text_body)
    if html_body is not None:
        message.add_alternative(html_body, subtype="html")

    context = ssl.create_default_context()
    with smtplib.SMTP(smtp_server, port, timeout=30) as server:
        server.starttls(context=context)
        server.login(smtp_username, smtp_password)
        server.send_message(message)


def send_simple_email(
    subject: str,
    body: str,
    receiver_email: str,
    sender_name: str = "Briefly",
) -> None:
    send_email(subject, body, None, receiver_email, sender_name)


def main() -> None:
    request: dict[str, Any] = json.load(sys.stdin)
    send_email(
        subject=request["subject"],
        text_body=request["text_body"],
        html_body=request["html_body"],
        receiver_email=request["receiver_email"],
    )
    print(json.dumps({"sent": True}))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Email delivery failed: {error}", file=sys.stderr)
        sys.exit(1)
