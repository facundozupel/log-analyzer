use chrono::{DateTime, FixedOffset};
use once_cell::sync::Lazy;
use regex::Regex;
use serde::Serialize;

/// Compiled regex for parsing log lines
/// Format: [server]:::[domain]:::ip1,ip2 - - [dd/Mon/yyyy:HH:MM:SS +0000] "METHOD /path HTTP/1.1" status bytes "referer" "user-agent" "extra-id"
static LOG_REGEX: Lazy<Regex> = Lazy::new(|| {
    Regex::new(
        r#"^\[([^\]]+)\]:::\[([^\]]+)\]:::([^\s]+)\s+-\s+-\s+\[([^\]]+)\]\s+"([A-Z]+)\s+([^\s]+)\s+([^"]+)"\s+(\d+)\s+(\d+)\s+"([^"]*)"\s+"([^"]*)"\s+"([^"]*)""#
    ).expect("Failed to compile log regex")
});

/// Represents a single parsed log entry
#[derive(Debug, Clone, Serialize)]
pub struct LogEntry {
    pub server: String,
    pub domain: String,
    pub ips: Vec<String>,
    pub datetime: Option<DateTime<FixedOffset>>,
    pub datetime_str: String,
    pub method: String,
    pub url: String,
    pub protocol: String,
    pub status_code: u16,
    pub bytes_sent: u64,
    pub referer: String,
    pub user_agent: String,
    pub extra_id: String,
    pub is_bot: bool,
    pub bot_name: String,
    pub bot_category: String,
    pub verified_googlebot: bool,
}

impl LogEntry {
    /// Parse a single log line into a LogEntry
    pub fn parse(line: &str) -> Option<LogEntry> {
        let caps = LOG_REGEX.captures(line)?;

        let server = caps.get(1)?.as_str().to_string();
        let domain = caps.get(2)?.as_str().to_string();
        let ips_str = caps.get(3)?.as_str();
        let datetime_str = caps.get(4)?.as_str().to_string();
        let method = caps.get(5)?.as_str().to_string();
        let url = caps.get(6)?.as_str().to_string();
        let protocol = caps.get(7)?.as_str().to_string();
        let status_str = caps.get(8)?.as_str();
        let bytes_str = caps.get(9)?.as_str();
        let referer = caps.get(10)?.as_str().to_string();
        let user_agent = caps.get(11)?.as_str().to_string();
        let extra_id = caps.get(12)?.as_str().to_string();

        // Parse IPs (comma-separated)
        let ips: Vec<String> = ips_str
            .split(',')
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect();

        // Parse datetime
        let datetime = DateTime::parse_from_str(&datetime_str, "%d/%b/%Y:%H:%M:%S %z").ok();

        // Parse numeric fields
        let status_code = status_str.parse().unwrap_or(0);
        let bytes_sent = bytes_str.parse().unwrap_or(0);

        Some(LogEntry {
            server,
            domain,
            ips,
            datetime,
            datetime_str,
            method,
            url,
            protocol,
            status_code,
            bytes_sent,
            referer,
            user_agent,
            extra_id,
            is_bot: false,
            bot_name: String::new(),
            bot_category: String::new(),
            verified_googlebot: false,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_valid_line() {
        let line = r#"[server1]:::[example.com]:::192.168.1.1,10.0.0.1 - - [01/Jan/2024:12:00:00 +0000] "GET /path/to/page HTTP/1.1" 200 1234 "https://referer.com" "Mozilla/5.0" "extra-123""#;
        let entry = LogEntry::parse(line).unwrap();

        assert_eq!(entry.server, "server1");
        assert_eq!(entry.domain, "example.com");
        assert_eq!(entry.ips, vec!["192.168.1.1", "10.0.0.1"]);
        assert_eq!(entry.method, "GET");
        assert_eq!(entry.url, "/path/to/page");
        assert_eq!(entry.status_code, 200);
        assert_eq!(entry.bytes_sent, 1234);
    }

    #[test]
    fn test_parse_invalid_line() {
        let line = "invalid log line";
        assert!(LogEntry::parse(line).is_none());
    }
}
