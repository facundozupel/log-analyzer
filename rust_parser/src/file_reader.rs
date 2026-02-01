use memmap2::Mmap;
use std::fs::{self, File};
use std::io::{BufRead, BufReader};
use std::path::Path;

/// Threshold for using memory mapping (100MB)
const MMAP_THRESHOLD: u64 = 100_000_000;

/// Buffer size for BufReader (64KB)
const BUF_SIZE: usize = 64 * 1024;

/// Iterator over lines from a memory-mapped file
pub struct MmapLines {
    mmap: Mmap,
    position: usize,
}

impl MmapLines {
    pub fn new(path: &Path) -> std::io::Result<Self> {
        let file = File::open(path)?;
        let mmap = unsafe { Mmap::map(&file)? };
        Ok(MmapLines { mmap, position: 0 })
    }
}

impl Iterator for MmapLines {
    type Item = String;

    fn next(&mut self) -> Option<Self::Item> {
        if self.position >= self.mmap.len() {
            return None;
        }

        let start = self.position;
        let bytes = &self.mmap[start..];

        // Find the end of the line
        let end = bytes
            .iter()
            .position(|&b| b == b'\n')
            .map(|pos| start + pos)
            .unwrap_or(self.mmap.len());

        // Update position for next iteration
        self.position = end + 1;

        // Convert bytes to string, handling potential UTF-8 errors
        let line_bytes = &self.mmap[start..end];

        // Handle Windows line endings
        let line_bytes = if line_bytes.last() == Some(&b'\r') {
            &line_bytes[..line_bytes.len() - 1]
        } else {
            line_bytes
        };

        String::from_utf8(line_bytes.to_vec()).ok()
    }
}

/// Iterator over lines from a buffered file reader
pub struct BufReaderLines {
    reader: BufReader<File>,
    buffer: String,
}

impl BufReaderLines {
    pub fn new(path: &Path) -> std::io::Result<Self> {
        let file = File::open(path)?;
        let reader = BufReader::with_capacity(BUF_SIZE, file);
        Ok(BufReaderLines {
            reader,
            buffer: String::with_capacity(1024),
        })
    }
}

impl Iterator for BufReaderLines {
    type Item = String;

    fn next(&mut self) -> Option<Self::Item> {
        self.buffer.clear();
        match self.reader.read_line(&mut self.buffer) {
            Ok(0) => None,
            Ok(_) => {
                // Remove trailing newline characters
                let line = self.buffer.trim_end_matches(&['\n', '\r'][..]);
                Some(line.to_string())
            }
            Err(_) => None,
        }
    }
}

/// Enum to hold either type of line iterator
pub enum LineIterator {
    Mmap(MmapLines),
    BufReader(BufReaderLines),
}

impl Iterator for LineIterator {
    type Item = String;

    fn next(&mut self) -> Option<Self::Item> {
        match self {
            LineIterator::Mmap(iter) => iter.next(),
            LineIterator::BufReader(iter) => iter.next(),
        }
    }
}

/// Read file and return an iterator over lines
/// Uses memory mapping for large files (>100MB), buffered reader for smaller files
pub fn read_file(path: &Path) -> std::io::Result<LineIterator> {
    let metadata = fs::metadata(path)?;

    if metadata.len() > MMAP_THRESHOLD {
        Ok(LineIterator::Mmap(MmapLines::new(path)?))
    } else {
        Ok(LineIterator::BufReader(BufReaderLines::new(path)?))
    }
}

/// Read all lines from a file into a vector
/// Useful for parallel processing with rayon
pub fn read_all_lines(path: &Path) -> std::io::Result<Vec<String>> {
    let lines: Vec<String> = read_file(path)?.collect();
    Ok(lines)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::NamedTempFile;

    #[test]
    fn test_read_small_file() {
        let mut temp = NamedTempFile::new().unwrap();
        writeln!(temp, "line 1").unwrap();
        writeln!(temp, "line 2").unwrap();
        writeln!(temp, "line 3").unwrap();

        let lines: Vec<String> = read_file(temp.path()).unwrap().collect();
        assert_eq!(lines.len(), 3);
        assert_eq!(lines[0], "line 1");
        assert_eq!(lines[1], "line 2");
        assert_eq!(lines[2], "line 3");
    }
}
