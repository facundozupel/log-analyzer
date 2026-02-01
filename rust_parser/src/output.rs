use serde_json;
use std::fs::File;
use std::io::{self, BufWriter, Write};
use std::path::Path;

use crate::aggregator::StatisticsSummary;

/// Write statistics to JSON file
pub fn write_json_file(stats: &StatisticsSummary, path: &Path) -> io::Result<()> {
    let file = File::create(path)?;
    let writer = BufWriter::new(file);
    serde_json::to_writer_pretty(writer, stats)?;
    Ok(())
}

/// Write statistics to stdout as JSON
pub fn write_json_stdout(stats: &StatisticsSummary) -> io::Result<()> {
    let stdout = io::stdout();
    let handle = stdout.lock();
    let mut writer = BufWriter::new(handle);
    serde_json::to_writer_pretty(&mut writer, stats)?;
    writeln!(writer)?;
    writer.flush()?;
    Ok(())
}

/// Serialize statistics to JSON string
pub fn to_json_string(stats: &StatisticsSummary) -> serde_json::Result<String> {
    serde_json::to_string_pretty(stats)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::aggregator::Statistics;
    use tempfile::NamedTempFile;

    #[test]
    fn test_json_serialization() {
        let stats = Statistics::new();
        let summary = stats.to_summary(10);
        let json = to_json_string(&summary).unwrap();
        assert!(json.contains("total_requests"));
        assert!(json.contains("bot_requests"));
    }

    #[test]
    fn test_write_json_file() {
        let stats = Statistics::new();
        let summary = stats.to_summary(10);
        let temp = NamedTempFile::new().unwrap();
        write_json_file(&summary, temp.path()).unwrap();

        let content = std::fs::read_to_string(temp.path()).unwrap();
        assert!(content.contains("total_requests"));
    }
}
