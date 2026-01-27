import ipaddress
import requests

BOT_SIGNATURES = [
    # Search engines
    ("Googlebot-Image", "Googlebot-Image", "search_engine"),
    ("Googlebot-Video", "Googlebot-Video", "search_engine"),
    ("Googlebot-News", "Googlebot-News", "search_engine"),
    ("Googlebot", "Googlebot", "search_engine"),
    ("Google-InspectionTool", "Google-InspectionTool", "search_engine"),
    ("Storebot-Google", "Storebot-Google", "search_engine"),
    ("AdsBot-Google", "AdsBot-Google", "search_engine"),
    ("Mediapartners-Google", "Mediapartners-Google", "search_engine"),
    ("APIs-Google", "APIs-Google", "search_engine"),
    ("bingbot", "Bingbot", "search_engine"),
    ("YandexBot", "YandexBot", "search_engine"),
    ("Baiduspider", "Baiduspider", "search_engine"),
    ("DuckDuckBot", "DuckDuckBot", "search_engine"),
    ("Applebot", "Applebot", "search_engine"),
    # LLM bots
    ("GPTBot", "GPTBot", "llm"),
    ("ChatGPT-User", "ChatGPT-User", "llm"),
    ("OAI-SearchBot", "OAI-SearchBot", "llm"),
    ("ClaudeBot", "ClaudeBot", "llm"),
    ("Claude-Web", "Claude-Web", "llm"),
    ("anthropic-ai", "Anthropic", "llm"),
    ("Bytespider", "Bytespider", "llm"),
    ("DeepSeekBot", "DeepSeekBot", "llm"),
    ("PerplexityBot", "PerplexityBot", "llm"),
    ("Meta-ExternalAgent", "Meta AI Bot", "llm"),
    ("Google-Extended", "Google-Extended", "llm"),
    # SEO tools
    ("AhrefsBot", "AhrefsBot", "seo_tool"),
    ("SemrushBot", "SemrushBot", "seo_tool"),
    ("MJ12bot", "MJ12bot", "seo_tool"),
    ("Screaming Frog", "Screaming Frog", "seo_tool"),
    ("DotBot", "DotBot", "seo_tool"),
    # Social
    ("facebookexternalhit", "Facebook", "social"),
    ("Twitterbot", "Twitterbot", "social"),
    ("LinkedInBot", "LinkedInBot", "social"),
    # HTTP clients
    ("python-requests", "python-requests", "http_client"),
    ("Apache-HttpClient", "Apache-HttpClient", "http_client"),
    ("Go-http-client", "Go-http-client", "http_client"),
    ("curl", "curl", "http_client"),
    ("Wget", "Wget", "http_client"),
]

GENERIC_BOT_PATTERNS = ["bot", "crawl", "spider", "scraper"]

_googlebot_networks = None


def fetch_googlebot_ranges():
    """Download and cache Googlebot IP ranges."""
    global _googlebot_networks
    if _googlebot_networks is not None:
        return _googlebot_networks
    try:
        resp = requests.get(
            "https://developers.google.com/search/apis/ipranges/googlebot.json",
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        networks = []
        for prefix in data.get("prefixes", []):
            if "ipv4Prefix" in prefix:
                networks.append(ipaddress.ip_network(prefix["ipv4Prefix"]))
            elif "ipv6Prefix" in prefix:
                networks.append(ipaddress.ip_network(prefix["ipv6Prefix"]))
        _googlebot_networks = networks
    except Exception:
        _googlebot_networks = []
    return _googlebot_networks


def is_verified_googlebot(ip_str):
    """Check if an IP belongs to Google's published Googlebot ranges."""
    networks = fetch_googlebot_ranges()
    if not networks:
        return False
    try:
        addr = ipaddress.ip_address(ip_str)
    except ValueError:
        return False
    return any(addr in net for net in networks)


def classify_user_agent(ua):
    """Classify a User-Agent string.

    Returns (is_bot, bot_name, bot_category).
    """
    if not ua or ua == "-":
        return False, "", ""

    for substring, name, category in BOT_SIGNATURES:
        if substring in ua:
            return True, name, category

    ua_lower = ua.lower()
    for pattern in GENERIC_BOT_PATTERNS:
        if pattern in ua_lower:
            return True, "generic-bot", "generic"

    return False, "", ""
