use wasm_bindgen::prelude::*;
use serde_json;

use crate::aggregator::Statistics;
use crate::bot_detector::enrich_entry;
use crate::parser::LogEntry;

/// Parse log content and return JSON statistics
#[wasm_bindgen]
pub fn parse_logs(content: &str, top_n: usize) -> String {
    let mut stats = Statistics::new();

    for line in content.lines() {
        if let Some(mut entry) = LogEntry::parse(line) {
            enrich_entry(&mut entry);
            stats.add_entry(&entry);
        }
    }

    let summary = stats.to_summary(top_n);
    serde_json::to_string_pretty(&summary).unwrap_or_else(|_| "{}".to_string())
}

/// Parse multiple log contents (JSON array of strings) and return combined statistics
#[wasm_bindgen]
pub fn parse_multiple_logs(contents_json: &str, top_n: usize) -> String {
    let contents: Vec<String> = serde_json::from_str(contents_json).unwrap_or_default();

    let stats = contents.iter().fold(Statistics::new(), |mut acc, content| {
        for line in content.lines() {
            if let Some(mut entry) = LogEntry::parse(line) {
                enrich_entry(&mut entry);
                acc.add_entry(&entry);
            }
        }
        acc
    });

    let summary = stats.to_summary(top_n);
    serde_json::to_string_pretty(&summary).unwrap_or_else(|_| "{}".to_string())
}

/// Get parser version info
#[wasm_bindgen]
pub fn get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}
