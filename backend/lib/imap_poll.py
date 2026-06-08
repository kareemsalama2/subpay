import email
import imaplib
import json
import sys
from email.header import decode_header
from email.utils import parsedate_to_datetime

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")


def decode_value(value):
    if not value:
        return ""
    chunks = decode_header(value)
    parts = []
    for chunk, charset in chunks:
        if isinstance(chunk, bytes):
            parts.append(chunk.decode(charset or "utf-8", errors="replace"))
        else:
            parts.append(chunk)
    return "".join(parts)


def message_body(msg):
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            disposition = part.get("Content-Disposition", "")
            if content_type == "text/plain" and "attachment" not in disposition:
                payload = part.get_payload(decode=True) or b""
                return payload.decode(part.get_content_charset() or "utf-8", errors="replace")
        for part in msg.walk():
            if part.get_content_type() == "text/html":
                payload = part.get_payload(decode=True) or b""
                return payload.decode(part.get_content_charset() or "utf-8", errors="replace")
    payload = msg.get_payload(decode=True) or b""
    return payload.decode(msg.get_content_charset() or "utf-8", errors="replace")


def date_ms(msg):
    try:
        parsed = parsedate_to_datetime(msg.get("Date"))
        return int(parsed.timestamp() * 1000)
    except Exception:
        return None


def main():
    cfg = json.loads(sys.stdin.read() or "{}")
    host = cfg.get("host", "imap.gmail.com")
    port = int(cfg.get("port", 993))
    user = cfg["email"]
    password = cfg["appPassword"]
    last_uid = int(cfg.get("lastUid") or 0)
    limit = int(cfg.get("limit") or 20)

    client = imaplib.IMAP4_SSL(host, port)
    try:
        client.login(user, password)
        client.select("INBOX")
        search_criteria = f"UID {last_uid + 1}:*" if last_uid else "ALL"
        typ, data = client.uid("search", None, search_criteria)
        if typ != "OK":
            raise RuntimeError("IMAP search failed")
        uids = data[0].split()
        selected = uids[-limit:]
        messages = []
        max_uid = last_uid
        for uid_bytes in selected:
            uid = int(uid_bytes.decode())
            max_uid = max(max_uid, uid)
            typ, msg_data = client.uid("fetch", uid_bytes, "(RFC822)")
            if typ != "OK" or not msg_data:
                continue
            raw = msg_data[0][1]
            msg = email.message_from_bytes(raw)
            messages.append({
                "uid": uid,
                "subject": decode_value(msg.get("Subject")),
                "from": decode_value(msg.get("From")),
                "body": message_body(msg),
                "dateMs": date_ms(msg)
            })
        print(json.dumps({"messages": messages, "lastUid": max_uid}, ensure_ascii=False))
    finally:
        try:
            client.logout()
        except Exception:
            pass


if __name__ == "__main__":
    main()
