pub mod aggregator;
pub mod bot_detector;
pub mod output;
pub mod parser;

#[cfg(feature = "cli")]
pub mod file_reader;

#[cfg(feature = "wasm")]
pub mod wasm;

#[cfg(feature = "cli")]
use rayon::prelude::*;
#[cfg(feature = "cli")]
use std::path::Path;

pub use aggregator::Statistics;
pub use bot_detector::enrich_entry;
pub use parser::LogEntry;

#[cfg(feature = "cli")]
use file_reader::read_all_lines;

/// Process a single log file and return statistics
#[cfg(feature = "cli")]
pub fn process_file(path: &Path) -> Statistics {
    let mut stats = Statistics::new();

    match read_all_lines(path) {
        Ok(lines) => {
            for line in lines {
                if let Some(mut entry) = LogEntry::parse(&line) {
                    enrich_entry(&mut entry);
                    stats.add_entry(&entry);
                }
            }
        }
        Err(e) => {
            eprintln!("Error reading file {:?}: {}", path, e);
        }
    }

    stats
}

/// Process a single log file in parallel (line-level parallelism)
#[cfg(feature = "cli")]
pub fn process_file_parallel(path: &Path) -> Statistics {
    match read_all_lines(path) {
        Ok(lines) => {
            lines
                .par_iter()
                .filter_map(|line| {
                    LogEntry::parse(line).map(|mut entry| {
                        enrich_entry(&mut entry);
                        entry
                    })
                })
                .fold(Statistics::new, |mut stats, entry| {
                    stats.add_entry(&entry);
                    stats
                })
                .reduce(Statistics::new, Statistics::merge)
        }
        Err(e) => {
            eprintln!("Error reading file {:?}: {}", path, e);
            Statistics::new()
        }
    }
}

/// Process multiple log files in parallel (file-level parallelism)
#[cfg(feature = "cli")]
pub fn process_files(paths: &[&Path]) -> Statistics {
    paths
        .par_iter()
        .map(|path| process_file_parallel(path))
        .reduce(Statistics::new, Statistics::merge)
}

/// Parse a single line and return enriched entry (for testing/debugging)
pub fn parse_line(line: &str) -> Option<LogEntry> {
    LogEntry::parse(line).map(|mut entry| {
        enrich_entry(&mut entry);
        entry
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_line_with_bot() {
        let line = r#"[server1]:::[example.com]:::66.249.66.1 - - [01/Jan/2024:12:00:00 +0000] "GET /page HTTP/1.1" 200 1234 "-" "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" "id123""#;
        let entry = parse_line(line).unwrap();

        assert!(entry.is_bot);
        assert_eq!(entry.bot_name, "Googlebot");
        assert_eq!(entry.bot_category, "Search Engine");
        assert!(entry.verified_googlebot); // IP is in Google range
    }

    #[test]
    fn test_parse_line_human() {
        let line = r#"[server1]:::[example.com]:::192.168.1.1 - - [01/Jan/2024:12:00:00 +0000] "GET /page HTTP/1.1" 200 1234 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0" "id123""#;
        let entry = parse_line(line).unwrap();

        assert!(!entry.is_bot);
        assert!(entry.bot_name.is_empty());
    }
}
