from collections import Counter, defaultdict


def summary(entries):
    """Generate a summary with KPIs and top lists."""
    if not entries:
        return {}

    total = len(entries)
    unique_urls = len({e.url for e in entries})
    all_ips = set()
    for e in entries:
        all_ips.update(e.ips)
    unique_ips = len(all_ips)

    bot_entries = [e for e in entries if e.is_bot]
    human_entries = [e for e in entries if not e.is_bot]
    bot_count = len(bot_entries)
    human_count = len(human_entries)
    unique_bots = len({e.bot_name for e in bot_entries if e.bot_name})

    status_dist = Counter(e.status_code for e in entries)
    status_distribution = [
        {"code": code, "count": count}
        for code, count in status_dist.most_common()
    ]

    url_counter = Counter(e.url for e in entries)
    top_urls = [
        {"url": url, "hits": count}
        for url, count in url_counter.most_common(10)
    ]

    bot_counter = Counter(e.bot_name for e in bot_entries if e.bot_name)
    top_bots = [
        {"bot_name": name, "hits": count}
        for name, count in bot_counter.most_common(10)
    ]

    hits_by_day = Counter()
    for e in entries:
        if e.datetime:
            hits_by_day[e.datetime.date().isoformat()] += 1
    hits_per_day = [
        {"date": date, "hits": count}
        for date, count in sorted(hits_by_day.items())
    ]

    return {
        "total_requests": total,
        "unique_urls": unique_urls,
        "unique_ips": unique_ips,
        "bot_requests": bot_count,
        "human_requests": human_count,
        "unique_bots": unique_bots,
        "status_distribution": status_distribution,
        "top_urls": top_urls,
        "top_bots": top_bots,
        "hits_per_day": hits_per_day,
    }


def urls_report(entries):
    """Per-URL breakdown."""
    data = defaultdict(lambda: {
        "hits": 0,
        "bot_hits": 0,
        "human_hits": 0,
        "status_codes": Counter(),
        "total_bytes": 0,
        "timestamps": [],
        "last_access": None,
    })
    for e in entries:
        d = data[e.url]
        d["hits"] += 1
        if e.is_bot:
            d["bot_hits"] += 1
        else:
            d["human_hits"] += 1
        d["status_codes"][e.status_code] += 1
        d["total_bytes"] += e.bytes_sent
        if e.datetime:
            d["timestamps"].append(e.datetime)
            if d["last_access"] is None or e.datetime > d["last_access"]:
                d["last_access"] = e.datetime

    result = []
    for url, d in sorted(data.items(), key=lambda x: x[1]["hits"], reverse=True):
        avg_bytes = d["total_bytes"] // d["hits"] if d["hits"] else 0
        avg_interval = _avg_interval(d["timestamps"])
        status_str = ", ".join(
            f"{code}:{count}" for code, count in d["status_codes"].most_common()
        )
        result.append({
            "url": url,
            "hits": d["hits"],
            "bot_hits": d["bot_hits"],
            "human_hits": d["human_hits"],
            "status_codes": status_str,
            "avg_bytes": avg_bytes,
            "avg_interval": avg_interval,
            "last_access": d["last_access"].isoformat() if d["last_access"] else "",
        })
    return result


def bots_report(entries):
    """Per-bot breakdown."""
    bot_entries = [e for e in entries if e.is_bot and e.bot_name]
    data = defaultdict(lambda: {
        "category": "",
        "hits": 0,
        "unique_urls": set(),
        "status_codes": Counter(),
        "total_bytes": 0,
        "first_seen": None,
        "last_seen": None,
        "verified_googlebot": False,
    })
    for e in bot_entries:
        d = data[e.bot_name]
        d["category"] = e.bot_category
        d["hits"] += 1
        d["unique_urls"].add(e.url)
        d["status_codes"][e.status_code] += 1
        d["total_bytes"] += e.bytes_sent
        if e.verified_googlebot:
            d["verified_googlebot"] = True
        if e.datetime:
            if d["first_seen"] is None or e.datetime < d["first_seen"]:
                d["first_seen"] = e.datetime
            if d["last_seen"] is None or e.datetime > d["last_seen"]:
                d["last_seen"] = e.datetime

    result = []
    for name, d in sorted(data.items(), key=lambda x: x[1]["hits"], reverse=True):
        avg_bytes = d["total_bytes"] // d["hits"] if d["hits"] else 0
        status_str = ", ".join(
            f"{code}:{count}" for code, count in d["status_codes"].most_common()
        )
        result.append({
            "bot_name": name,
            "bot_category": d["category"],
            "hits": d["hits"],
            "unique_urls": len(d["unique_urls"]),
            "status_codes": status_str,
            "avg_bytes": avg_bytes,
            "first_seen": d["first_seen"].isoformat() if d["first_seen"] else "",
            "last_seen": d["last_seen"].isoformat() if d["last_seen"] else "",
            "verified_googlebot": d["verified_googlebot"],
        })
    return result


def status_codes_report(entries):
    """Per-status-code breakdown."""
    total = len(entries)
    code_data = defaultdict(lambda: {"count": 0, "urls": Counter()})
    for e in entries:
        d = code_data[e.status_code]
        d["count"] += 1
        d["urls"][e.url] += 1

    result = []
    for code, d in sorted(code_data.items()):
        pct = round(d["count"] / total * 100, 2) if total else 0
        top_urls = ", ".join(
            f"{url} ({count})" for url, count in d["urls"].most_common(5)
        )
        result.append({
            "code": code,
            "count": d["count"],
            "percentage": pct,
            "top_urls": top_urls,
        })
    return result


def ips_report(entries):
    """Per-IP breakdown."""
    data = defaultdict(lambda: {
        "hits": 0,
        "is_bot": False,
        "bot_name": "",
        "unique_urls": set(),
    })
    for e in entries:
        for ip in e.ips:
            d = data[ip]
            d["hits"] += 1
            if e.is_bot:
                d["is_bot"] = True
                d["bot_name"] = e.bot_name
            d["unique_urls"].add(e.url)

    result = []
    for ip, d in sorted(data.items(), key=lambda x: x[1]["hits"], reverse=True):
        result.append({
            "ip": ip,
            "hits": d["hits"],
            "is_bot": d["is_bot"],
            "bot_name": d["bot_name"],
            "unique_urls": len(d["unique_urls"]),
        })
    return result


def urls_detail_report(entries):
    """Per-URL breakdown with nested bot details."""
    url_data = defaultdict(lambda: {
        "hits": 0,
        "bot_hits": 0,
        "human_hits": 0,
        "status_codes": Counter(),
        "total_bytes": 0,
        "last_access": None,
        "bots": defaultdict(lambda: {
            "category": "",
            "hits": 0,
            "status_codes": Counter(),
            "total_bytes": 0,
            "first_seen": None,
            "last_seen": None,
            "verified_googlebot": False,
        }),
    })
    for e in entries:
        d = url_data[e.url]
        d["hits"] += 1
        d["status_codes"][e.status_code] += 1
        d["total_bytes"] += e.bytes_sent
        if e.is_bot:
            d["bot_hits"] += 1
            if e.bot_name:
                b = d["bots"][e.bot_name]
                b["category"] = e.bot_category
                b["hits"] += 1
                b["status_codes"][e.status_code] += 1
                b["total_bytes"] += e.bytes_sent
                if e.verified_googlebot:
                    b["verified_googlebot"] = True
                if e.datetime:
                    if b["first_seen"] is None or e.datetime < b["first_seen"]:
                        b["first_seen"] = e.datetime
                    if b["last_seen"] is None or e.datetime > b["last_seen"]:
                        b["last_seen"] = e.datetime
        else:
            d["human_hits"] += 1
        if e.datetime:
            if d["last_access"] is None or e.datetime > d["last_access"]:
                d["last_access"] = e.datetime

    result = []
    for url, d in sorted(url_data.items(), key=lambda x: x[1]["hits"], reverse=True):
        avg_bytes = d["total_bytes"] // d["hits"] if d["hits"] else 0
        status_str = ", ".join(
            f"{code}:{count}" for code, count in d["status_codes"].most_common()
        )
        bots_list = []
        for bot_name, b in sorted(d["bots"].items(), key=lambda x: x[1]["hits"], reverse=True):
            bot_avg_bytes = b["total_bytes"] // b["hits"] if b["hits"] else 0
            bot_status_str = ", ".join(
                f"{code}:{count}" for code, count in b["status_codes"].most_common()
            )
            bots_list.append({
                "bot_name": bot_name,
                "bot_category": b["category"],
                "hits": b["hits"],
                "status_codes": bot_status_str,
                "avg_bytes": bot_avg_bytes,
                "first_seen": b["first_seen"].isoformat() if b["first_seen"] else "",
                "last_seen": b["last_seen"].isoformat() if b["last_seen"] else "",
                "verified_googlebot": b["verified_googlebot"],
            })
        result.append({
            "url": url,
            "hits": d["hits"],
            "bot_hits": d["bot_hits"],
            "human_hits": d["human_hits"],
            "status_codes": status_str,
            "avg_bytes": avg_bytes,
            "last_access": d["last_access"].isoformat() if d["last_access"] else "",
            "bot_count": len(bots_list),
            "bots": bots_list,
        })
    return result


def crawl_frequency_report(entries):
    """Per-URL crawl frequency (bot traffic only)."""
    bot_entries = [e for e in entries if e.is_bot]
    data = defaultdict(lambda: {"timestamps": [], "last_crawl": None})
    for e in bot_entries:
        d = data[e.url]
        if e.datetime:
            d["timestamps"].append(e.datetime)
            if d["last_crawl"] is None or e.datetime > d["last_crawl"]:
                d["last_crawl"] = e.datetime

    result = []
    for url, d in sorted(data.items(), key=lambda x: len(x[1]["timestamps"]), reverse=True):
        crawl_count = len(d["timestamps"])
        avg_interval = _avg_interval(d["timestamps"])
        result.append({
            "url": url,
            "crawl_count": crawl_count,
            "avg_interval": avg_interval,
            "last_crawl": d["last_crawl"].isoformat() if d["last_crawl"] else "",
        })
    return result


def _avg_interval(timestamps):
    """Calculate average interval between sorted timestamps as a human-readable string."""
    if len(timestamps) < 2:
        return ""
    ts = sorted(timestamps)
    deltas = [(ts[i + 1] - ts[i]).total_seconds() for i in range(len(ts) - 1)]
    avg_secs = sum(deltas) / len(deltas)
    if avg_secs < 60:
        return f"{avg_secs:.0f}s"
    if avg_secs < 3600:
        return f"{avg_secs / 60:.1f}m"
    if avg_secs < 86400:
        return f"{avg_secs / 3600:.1f}h"
    return f"{avg_secs / 86400:.1f}d"
