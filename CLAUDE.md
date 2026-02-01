# Log Analyzer

High-performance log parser written in Rust with parallel processing and bot detection.

## Log Format

```
[server]:::[domain]:::ip1,ip2 - - [dd/Mon/yyyy:HH:MM:SS +0000] "METHOD /path HTTP/1.1" status bytes "referer" "user-agent" "extra-id"
```

## Setup

```bash
cd rust_parser

# Install Rust locally (first time only)
./setup-env.sh

# Activate environment
source activate-env.sh

# Build
cargo build --release
```

## Usage

```bash
# Parse single file
./target/release/log_parser access.log

# Parse multiple files (parallel)
./target/release/log_parser file1.log file2.log file3.log

# Output to file
./target/release/log_parser access.log -o stats.json

# Limit top items
./target/release/log_parser access.log -n 50
```

## Project Structure

```
rust_parser/
├── Cargo.toml
├── setup-env.sh      # Install Rust locally
├── activate-env.sh   # Activate local environment
├── .rust/            # Local Rust installation (gitignored)
└── src/
    ├── main.rs       # CLI entry point
    ├── lib.rs        # Public API, parallel processing
    ├── parser.rs     # Regex parsing, LogEntry struct
    ├── bot_detector.rs  # 48 bot patterns + Google IP verification
    ├── file_reader.rs   # Memmap for large files (>100MB)
    ├── aggregator.rs    # HashMap-based statistics
    └── output.rs        # JSON serialization
```

## Features

- Parallel file processing with Rayon
- Memory-mapped I/O for large files
- 48 bot signature patterns (Search engines, LLM bots, SEO tools, etc.)
- Googlebot IP verification
- JSON output with aggregated statistics
