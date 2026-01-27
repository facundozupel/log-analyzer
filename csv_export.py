import csv
import io


def generate_csv(rows, fieldnames):
    """Generate a CSV string from a list of dicts."""
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    for row in rows:
        writer.writerow(row)
    return output.getvalue()


def raw_csv(entries):
    """Generate a CSV with all LogEntry fields, one row per log line."""
    fieldnames = [
        "server", "domain", "ips", "datetime", "method", "url", "protocol",
        "status_code", "bytes_sent", "referer", "user_agent", "extra_id",
        "is_bot", "bot_name", "bot_category", "verified_googlebot",
    ]
    rows = []
    for e in entries:
        rows.append({
            "server": e.server,
            "domain": e.domain,
            "ips": ", ".join(e.ips),
            "datetime": e.datetime.isoformat() if e.datetime else "",
            "method": e.method,
            "url": e.url,
            "protocol": e.protocol,
            "status_code": e.status_code,
            "bytes_sent": e.bytes_sent,
            "referer": e.referer,
            "user_agent": e.user_agent,
            "extra_id": e.extra_id,
            "is_bot": e.is_bot,
            "bot_name": e.bot_name,
            "bot_category": e.bot_category,
            "verified_googlebot": e.verified_googlebot,
        })
    return generate_csv(rows, fieldnames)
