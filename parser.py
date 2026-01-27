import re
from dataclasses import dataclass, field
from datetime import datetime

from bot_detector import classify_user_agent, is_verified_googlebot

LOG_PATTERN = re.compile(
    r'\[([^\]]+)\]:::\[([^\]]+)\]:::'
    r'(.+?) - - '
    r'\[([^\]]+)\] '
    r'"(\w+) (.+?) (HTTP/[\d.]+)" '
    r'(\d+) (\d+) '
    r'"([^"]*)" "([^"]*)" "([^"]*)"'
)


@dataclass
class LogEntry:
    server: str
    domain: str
    ips: list = field(default_factory=list)
    datetime: datetime = None
    method: str = ""
    url: str = ""
    protocol: str = ""
    status_code: int = 0
    bytes_sent: int = 0
    referer: str = ""
    user_agent: str = ""
    extra_id: str = ""
    is_bot: bool = False
    bot_name: str = ""
    bot_category: str = ""
    verified_googlebot: bool = False


def parse_line(line):
    """Parse a single log line into a LogEntry, or return None if it doesn't match."""
    line = line.strip()
    if not line:
        return None
    m = LOG_PATTERN.match(line)
    if not m:
        return None

    server = m.group(1)
    domain = m.group(2)
    ips_raw = m.group(3)
    ips = [ip.strip() for ip in ips_raw.split(",")]
    dt_str = m.group(4)
    try:
        dt = datetime.strptime(dt_str, "%d/%b/%Y:%H:%M:%S %z")
    except ValueError:
        dt = None
    method = m.group(5)
    url = m.group(6)
    protocol = m.group(7)
    status_code = int(m.group(8))
    bytes_sent = int(m.group(9))
    referer = m.group(10)
    user_agent = m.group(11)
    extra_id = m.group(12)

    is_bot, bot_name, bot_category = classify_user_agent(user_agent)

    verified = False
    if bot_name.startswith("Googlebot") or bot_name in (
        "Google-InspectionTool",
        "Storebot-Google",
        "AdsBot-Google",
        "Mediapartners-Google",
        "APIs-Google",
    ):
        verified = is_verified_googlebot(ips[0])

    return LogEntry(
        server=server,
        domain=domain,
        ips=ips,
        datetime=dt,
        method=method,
        url=url,
        protocol=protocol,
        status_code=status_code,
        bytes_sent=bytes_sent,
        referer=referer,
        user_agent=user_agent,
        extra_id=extra_id,
        is_bot=is_bot,
        bot_name=bot_name,
        bot_category=bot_category,
        verified_googlebot=verified,
    )


def parse_file(file_stream):
    """Parse all lines from a file stream.

    Returns (entries, error_count).
    """
    entries = []
    errors = 0
    for line in file_stream:
        if isinstance(line, bytes):
            line = line.decode("utf-8", errors="replace")
        entry = parse_line(line)
        if entry is not None:
            entries.append(entry)
        elif line.strip():
            errors += 1
    return entries, errors
