use serde::Serialize;
use std::collections::{HashMap, HashSet};

use crate::parser::LogEntry;

/// Statistics for a specific URL
#[derive(Debug, Clone, Default, Serialize)]
pub struct UrlStats {
    pub hits: u64,
    pub bot_hits: u64,
    pub human_hits: u64,
    pub bytes_total: u64,
    pub status_codes: HashMap<u16, u64>,
}

impl UrlStats {
    pub fn merge(&mut self, other: &UrlStats) {
        self.hits += other.hits;
        self.bot_hits += other.bot_hits;
        self.human_hits += other.human_hits;
        self.bytes_total += other.bytes_total;
        for (code, count) in &other.status_codes {
            *self.status_codes.entry(*code).or_insert(0) += count;
        }
    }
}

/// Statistics for a specific bot
#[derive(Debug, Clone, Default, Serialize)]
pub struct BotStats {
    pub hits: u64,
    pub category: String,
    pub unique_urls: HashSet<String>,
    pub verified_count: u64,
    pub unverified_count: u64,
}

impl BotStats {
    pub fn merge(&mut self, other: &BotStats) {
        self.hits += other.hits;
        if self.category.is_empty() {
            self.category = other.category.clone();
        }
        self.unique_urls.extend(other.unique_urls.iter().cloned());
        self.verified_count += other.verified_count;
        self.unverified_count += other.unverified_count;
    }
}

/// Aggregated statistics from log analysis
#[derive(Debug, Clone, Default, Serialize)]
pub struct Statistics {
    pub total_requests: u64,
    pub total_bytes: u64,
    pub unique_urls: HashSet<String>,
    pub unique_ips: HashSet<String>,
    pub bot_requests: u64,
    pub human_requests: u64,
    pub verified_googlebot_requests: u64,
    pub status_distribution: HashMap<u16, u64>,
    pub hits_by_url: HashMap<String, UrlStats>,
    pub hits_by_bot: HashMap<String, BotStats>,
    pub hits_by_category: HashMap<String, u64>,
    pub hits_by_hour: HashMap<String, u64>,
    pub hits_by_date: HashMap<String, u64>,
    pub hits_by_method: HashMap<String, u64>,
    pub hits_by_domain: HashMap<String, u64>,
    pub hits_by_server: HashMap<String, u64>,
}

impl Statistics {
    /// Create new empty statistics
    pub fn new() -> Self {
        Self::default()
    }

    /// Add a single log entry to the statistics
    pub fn add_entry(&mut self, entry: &LogEntry) {
        self.total_requests += 1;
        self.total_bytes += entry.bytes_sent;

        // Track unique URLs and IPs
        self.unique_urls.insert(entry.url.clone());
        for ip in &entry.ips {
            self.unique_ips.insert(ip.clone());
        }

        // Bot vs human
        if entry.is_bot {
            self.bot_requests += 1;
            if entry.verified_googlebot {
                self.verified_googlebot_requests += 1;
            }
        } else {
            self.human_requests += 1;
        }

        // Status codes
        *self.status_distribution.entry(entry.status_code).or_insert(0) += 1;

        // URL stats
        let url_stats = self.hits_by_url.entry(entry.url.clone()).or_default();
        url_stats.hits += 1;
        url_stats.bytes_total += entry.bytes_sent;
        *url_stats.status_codes.entry(entry.status_code).or_insert(0) += 1;
        if entry.is_bot {
            url_stats.bot_hits += 1;
        } else {
            url_stats.human_hits += 1;
        }

        // Bot stats
        if entry.is_bot && !entry.bot_name.is_empty() {
            let bot_stats = self.hits_by_bot.entry(entry.bot_name.clone()).or_default();
            bot_stats.hits += 1;
            bot_stats.category = entry.bot_category.clone();
            bot_stats.unique_urls.insert(entry.url.clone());
            if entry.verified_googlebot {
                bot_stats.verified_count += 1;
            } else if entry.bot_name.contains("Google") || entry.bot_name.contains("google") {
                bot_stats.unverified_count += 1;
            }

            // Category stats
            *self.hits_by_category.entry(entry.bot_category.clone()).or_insert(0) += 1;
        }

        // Time-based stats
        if let Some(dt) = entry.datetime {
            let hour_key = dt.format("%Y-%m-%d %H:00").to_string();
            let date_key = dt.format("%Y-%m-%d").to_string();
            *self.hits_by_hour.entry(hour_key).or_insert(0) += 1;
            *self.hits_by_date.entry(date_key).or_insert(0) += 1;
        }

        // Method stats
        *self.hits_by_method.entry(entry.method.clone()).or_insert(0) += 1;

        // Domain stats
        *self.hits_by_domain.entry(entry.domain.clone()).or_insert(0) += 1;

        // Server stats
        *self.hits_by_server.entry(entry.server.clone()).or_insert(0) += 1;
    }

    /// Merge two Statistics objects (for parallel processing)
    pub fn merge(mut self, other: Self) -> Self {
        self.total_requests += other.total_requests;
        self.total_bytes += other.total_bytes;
        self.bot_requests += other.bot_requests;
        self.human_requests += other.human_requests;
        self.verified_googlebot_requests += other.verified_googlebot_requests;

        // Merge sets
        self.unique_urls.extend(other.unique_urls);
        self.unique_ips.extend(other.unique_ips);

        // Merge status distribution
        for (code, count) in other.status_distribution {
            *self.status_distribution.entry(code).or_insert(0) += count;
        }

        // Merge URL stats
        for (url, stats) in other.hits_by_url {
            self.hits_by_url.entry(url).or_default().merge(&stats);
        }

        // Merge bot stats
        for (bot, stats) in other.hits_by_bot {
            self.hits_by_bot.entry(bot).or_default().merge(&stats);
        }

        // Merge category stats
        for (category, count) in other.hits_by_category {
            *self.hits_by_category.entry(category).or_insert(0) += count;
        }

        // Merge time-based stats
        for (hour, count) in other.hits_by_hour {
            *self.hits_by_hour.entry(hour).or_insert(0) += count;
        }
        for (date, count) in other.hits_by_date {
            *self.hits_by_date.entry(date).or_insert(0) += count;
        }

        // Merge method stats
        for (method, count) in other.hits_by_method {
            *self.hits_by_method.entry(method).or_insert(0) += count;
        }

        // Merge domain stats
        for (domain, count) in other.hits_by_domain {
            *self.hits_by_domain.entry(domain).or_insert(0) += count;
        }

        // Merge server stats
        for (server, count) in other.hits_by_server {
            *self.hits_by_server.entry(server).or_insert(0) += count;
        }

        self
    }
}

/// Summary statistics for JSON output (without large HashSets serialized as arrays)
#[derive(Debug, Serialize)]
pub struct StatisticsSummary {
    pub total_requests: u64,
    pub total_bytes: u64,
    pub unique_urls_count: usize,
    pub unique_ips_count: usize,
    pub bot_requests: u64,
    pub human_requests: u64,
    pub verified_googlebot_requests: u64,
    pub bot_percentage: f64,
    pub status_distribution: HashMap<u16, u64>,
    pub top_urls: Vec<(String, UrlStats)>,
    pub top_bots: Vec<(String, BotStatsSummary)>,
    pub hits_by_category: HashMap<String, u64>,
    pub hits_by_hour: HashMap<String, u64>,
    pub hits_by_date: HashMap<String, u64>,
    pub hits_by_method: HashMap<String, u64>,
    pub hits_by_domain: HashMap<String, u64>,
    pub hits_by_server: HashMap<String, u64>,
}

/// Bot stats summary without HashSet for serialization
#[derive(Debug, Serialize)]
pub struct BotStatsSummary {
    pub hits: u64,
    pub category: String,
    pub unique_urls_count: usize,
    pub verified_count: u64,
    pub unverified_count: u64,
}

impl Statistics {
    /// Convert to summary for JSON output with top N items
    pub fn to_summary(&self, top_n: usize) -> StatisticsSummary {
        // Sort URLs by hits
        let mut url_vec: Vec<_> = self.hits_by_url.iter().collect();
        url_vec.sort_by(|a, b| b.1.hits.cmp(&a.1.hits));
        let top_urls: Vec<(String, UrlStats)> = url_vec
            .into_iter()
            .take(top_n)
            .map(|(k, v)| (k.clone(), v.clone()))
            .collect();

        // Sort bots by hits
        let mut bot_vec: Vec<_> = self.hits_by_bot.iter().collect();
        bot_vec.sort_by(|a, b| b.1.hits.cmp(&a.1.hits));
        let top_bots: Vec<(String, BotStatsSummary)> = bot_vec
            .into_iter()
            .take(top_n)
            .map(|(k, v)| {
                (
                    k.clone(),
                    BotStatsSummary {
                        hits: v.hits,
                        category: v.category.clone(),
                        unique_urls_count: v.unique_urls.len(),
                        verified_count: v.verified_count,
                        unverified_count: v.unverified_count,
                    },
                )
            })
            .collect();

        let bot_percentage = if self.total_requests > 0 {
            (self.bot_requests as f64 / self.total_requests as f64) * 100.0
        } else {
            0.0
        };

        StatisticsSummary {
            total_requests: self.total_requests,
            total_bytes: self.total_bytes,
            unique_urls_count: self.unique_urls.len(),
            unique_ips_count: self.unique_ips.len(),
            bot_requests: self.bot_requests,
            human_requests: self.human_requests,
            verified_googlebot_requests: self.verified_googlebot_requests,
            bot_percentage,
            status_distribution: self.status_distribution.clone(),
            top_urls,
            top_bots,
            hits_by_category: self.hits_by_category.clone(),
            hits_by_hour: self.hits_by_hour.clone(),
            hits_by_date: self.hits_by_date.clone(),
            hits_by_method: self.hits_by_method.clone(),
            hits_by_domain: self.hits_by_domain.clone(),
            hits_by_server: self.hits_by_server.clone(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_statistics_merge() {
        let mut stats1 = Statistics::new();
        stats1.total_requests = 100;
        stats1.bot_requests = 30;
        stats1.unique_urls.insert("/page1".to_string());

        let mut stats2 = Statistics::new();
        stats2.total_requests = 50;
        stats2.bot_requests = 20;
        stats2.unique_urls.insert("/page2".to_string());

        let merged = stats1.merge(stats2);
        assert_eq!(merged.total_requests, 150);
        assert_eq!(merged.bot_requests, 50);
        assert_eq!(merged.unique_urls.len(), 2);
    }
}
