use ipnetwork::IpNetwork;
use once_cell::sync::Lazy;
use std::net::IpAddr;

use crate::parser::LogEntry;

/// Bot signature with name and category
struct BotSignature {
    pattern: &'static str,
    name: &'static str,
    category: &'static str,
}

/// All bot signatures organized by category
static BOT_SIGNATURES: &[BotSignature] = &[
    // Search Engines
    BotSignature { pattern: "Googlebot", name: "Googlebot", category: "Search Engine" },
    BotSignature { pattern: "Googlebot-Image", name: "Googlebot-Image", category: "Search Engine" },
    BotSignature { pattern: "Googlebot-Video", name: "Googlebot-Video", category: "Search Engine" },
    BotSignature { pattern: "Googlebot-News", name: "Googlebot-News", category: "Search Engine" },
    BotSignature { pattern: "Storebot-Google", name: "Storebot-Google", category: "Search Engine" },
    BotSignature { pattern: "Google-InspectionTool", name: "Google-InspectionTool", category: "Search Engine" },
    BotSignature { pattern: "GoogleOther", name: "GoogleOther", category: "Search Engine" },
    BotSignature { pattern: "APIs-Google", name: "APIs-Google", category: "Search Engine" },
    BotSignature { pattern: "AdsBot-Google", name: "AdsBot-Google", category: "Search Engine" },
    BotSignature { pattern: "Mediapartners-Google", name: "Mediapartners-Google", category: "Search Engine" },
    BotSignature { pattern: "FeedFetcher-Google", name: "FeedFetcher-Google", category: "Search Engine" },
    BotSignature { pattern: "Google-Read-Aloud", name: "Google-Read-Aloud", category: "Search Engine" },
    BotSignature { pattern: "bingbot", name: "Bingbot", category: "Search Engine" },
    BotSignature { pattern: "msnbot", name: "MSNBot", category: "Search Engine" },
    BotSignature { pattern: "YandexBot", name: "YandexBot", category: "Search Engine" },
    BotSignature { pattern: "YandexImages", name: "YandexImages", category: "Search Engine" },
    BotSignature { pattern: "Baiduspider", name: "Baiduspider", category: "Search Engine" },
    BotSignature { pattern: "DuckDuckBot", name: "DuckDuckBot", category: "Search Engine" },
    BotSignature { pattern: "Slurp", name: "Yahoo! Slurp", category: "Search Engine" },
    BotSignature { pattern: "Sogou", name: "Sogou", category: "Search Engine" },
    BotSignature { pattern: "Exabot", name: "Exabot", category: "Search Engine" },
    BotSignature { pattern: "ia_archiver", name: "Alexa", category: "Search Engine" },

    // LLM/AI Bots
    BotSignature { pattern: "GPTBot", name: "GPTBot", category: "LLM Bot" },
    BotSignature { pattern: "ChatGPT-User", name: "ChatGPT-User", category: "LLM Bot" },
    BotSignature { pattern: "OAI-SearchBot", name: "OAI-SearchBot", category: "LLM Bot" },
    BotSignature { pattern: "ClaudeBot", name: "ClaudeBot", category: "LLM Bot" },
    BotSignature { pattern: "Claude-Web", name: "Claude-Web", category: "LLM Bot" },
    BotSignature { pattern: "anthropic-ai", name: "Anthropic AI", category: "LLM Bot" },
    BotSignature { pattern: "Bytespider", name: "Bytespider", category: "LLM Bot" },
    BotSignature { pattern: "CCBot", name: "CCBot", category: "LLM Bot" },
    BotSignature { pattern: "cohere-ai", name: "Cohere AI", category: "LLM Bot" },
    BotSignature { pattern: "PerplexityBot", name: "PerplexityBot", category: "LLM Bot" },
    BotSignature { pattern: "YouBot", name: "YouBot", category: "LLM Bot" },

    // SEO Tools
    BotSignature { pattern: "AhrefsBot", name: "AhrefsBot", category: "SEO Tool" },
    BotSignature { pattern: "SemrushBot", name: "SemrushBot", category: "SEO Tool" },
    BotSignature { pattern: "MJ12bot", name: "Majestic", category: "SEO Tool" },
    BotSignature { pattern: "DotBot", name: "DotBot (Moz)", category: "SEO Tool" },
    BotSignature { pattern: "Screaming Frog", name: "Screaming Frog", category: "SEO Tool" },
    BotSignature { pattern: "rogerbot", name: "Rogerbot (Moz)", category: "SEO Tool" },
    BotSignature { pattern: "SEOkicks", name: "SEOkicks", category: "SEO Tool" },
    BotSignature { pattern: "sistrix", name: "Sistrix", category: "SEO Tool" },
    BotSignature { pattern: "BLEXBot", name: "BLEXBot", category: "SEO Tool" },

    // Social Media
    BotSignature { pattern: "facebookexternalhit", name: "Facebook", category: "Social Media" },
    BotSignature { pattern: "Facebot", name: "Facebook", category: "Social Media" },
    BotSignature { pattern: "Twitterbot", name: "Twitter", category: "Social Media" },
    BotSignature { pattern: "LinkedInBot", name: "LinkedIn", category: "Social Media" },
    BotSignature { pattern: "Pinterest", name: "Pinterest", category: "Social Media" },
    BotSignature { pattern: "Slackbot", name: "Slack", category: "Social Media" },
    BotSignature { pattern: "TelegramBot", name: "Telegram", category: "Social Media" },
    BotSignature { pattern: "WhatsApp", name: "WhatsApp", category: "Social Media" },
    BotSignature { pattern: "Discordbot", name: "Discord", category: "Social Media" },

    // HTTP Clients / Libraries
    BotSignature { pattern: "python-requests", name: "Python Requests", category: "HTTP Client" },
    BotSignature { pattern: "python-urllib", name: "Python urllib", category: "HTTP Client" },
    BotSignature { pattern: "aiohttp", name: "aiohttp", category: "HTTP Client" },
    BotSignature { pattern: "httpx", name: "httpx", category: "HTTP Client" },
    BotSignature { pattern: "curl/", name: "curl", category: "HTTP Client" },
    BotSignature { pattern: "wget/", name: "wget", category: "HTTP Client" },
    BotSignature { pattern: "libwww-perl", name: "Perl LWP", category: "HTTP Client" },
    BotSignature { pattern: "Go-http-client", name: "Go HTTP", category: "HTTP Client" },
    BotSignature { pattern: "axios/", name: "axios", category: "HTTP Client" },
    BotSignature { pattern: "node-fetch", name: "node-fetch", category: "HTTP Client" },
    BotSignature { pattern: "Java/", name: "Java HTTP", category: "HTTP Client" },
    BotSignature { pattern: "Apache-HttpClient", name: "Apache HttpClient", category: "HTTP Client" },
    BotSignature { pattern: "okhttp", name: "OkHttp", category: "HTTP Client" },

    // Monitoring / Uptime
    BotSignature { pattern: "UptimeRobot", name: "UptimeRobot", category: "Monitoring" },
    BotSignature { pattern: "Pingdom", name: "Pingdom", category: "Monitoring" },
    BotSignature { pattern: "StatusCake", name: "StatusCake", category: "Monitoring" },
    BotSignature { pattern: "Site24x7", name: "Site24x7", category: "Monitoring" },
    BotSignature { pattern: "Datadog", name: "Datadog", category: "Monitoring" },
    BotSignature { pattern: "NewRelicPinger", name: "New Relic", category: "Monitoring" },

    // Generic Bot Indicators
    BotSignature { pattern: "bot", name: "Generic Bot", category: "Other Bot" },
    BotSignature { pattern: "Bot", name: "Generic Bot", category: "Other Bot" },
    BotSignature { pattern: "crawler", name: "Generic Crawler", category: "Other Bot" },
    BotSignature { pattern: "Crawler", name: "Generic Crawler", category: "Other Bot" },
    BotSignature { pattern: "spider", name: "Generic Spider", category: "Other Bot" },
    BotSignature { pattern: "Spider", name: "Generic Spider", category: "Other Bot" },
];

/// Google IP ranges for verification
/// These are well-known Google crawler IP ranges
static GOOGLE_IP_RANGES: Lazy<Vec<IpNetwork>> = Lazy::new(|| {
    let ranges = [
        "66.249.64.0/19",
        "64.233.160.0/19",
        "72.14.192.0/18",
        "209.85.128.0/17",
        "216.239.32.0/19",
        "74.125.0.0/16",
        "108.177.8.0/21",
        "172.217.0.0/16",
        "142.250.0.0/15",
        "35.191.0.0/16",
        "130.211.0.0/22",
        "66.102.0.0/20",
        "173.194.0.0/16",
        "207.126.144.0/20",
        "209.85.128.0/17",
    ];

    ranges
        .iter()
        .filter_map(|r| r.parse().ok())
        .collect()
});

/// Detect if user agent belongs to a bot and identify it
pub fn detect_bot(user_agent: &str) -> Option<(&'static str, &'static str)> {
    for sig in BOT_SIGNATURES {
        if user_agent.contains(sig.pattern) {
            return Some((sig.name, sig.category));
        }
    }
    None
}

/// Check if any IP in the list belongs to Google's IP ranges
pub fn is_google_ip(ips: &[String]) -> bool {
    for ip_str in ips {
        if let Ok(ip) = ip_str.parse::<IpAddr>() {
            for range in GOOGLE_IP_RANGES.iter() {
                if range.contains(ip) {
                    return true;
                }
            }
        }
    }
    false
}

/// Enrich a log entry with bot detection information
pub fn enrich_entry(entry: &mut LogEntry) {
    if let Some((name, category)) = detect_bot(&entry.user_agent) {
        entry.is_bot = true;
        entry.bot_name = name.to_string();
        entry.bot_category = category.to_string();

        // Verify Googlebot IPs
        if name.contains("Google") || name.contains("google") {
            entry.verified_googlebot = is_google_ip(&entry.ips);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_googlebot() {
        let ua = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
        let result = detect_bot(ua);
        assert!(result.is_some());
        let (name, category) = result.unwrap();
        assert_eq!(name, "Googlebot");
        assert_eq!(category, "Search Engine");
    }

    #[test]
    fn test_detect_python_requests() {
        let ua = "python-requests/2.28.0";
        let result = detect_bot(ua);
        assert!(result.is_some());
        let (name, category) = result.unwrap();
        assert_eq!(name, "Python Requests");
        assert_eq!(category, "HTTP Client");
    }

    #[test]
    fn test_detect_human() {
        let ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";
        let result = detect_bot(ua);
        assert!(result.is_none());
    }

    #[test]
    fn test_google_ip_valid() {
        let ips = vec!["66.249.66.1".to_string()];
        assert!(is_google_ip(&ips));
    }

    #[test]
    fn test_google_ip_invalid() {
        let ips = vec!["192.168.1.1".to_string()];
        assert!(!is_google_ip(&ips));
    }
}
