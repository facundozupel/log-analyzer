# Log Analyzer

High-performance log parser with parallel processing and bot detection. Available as CLI (Rust) and Web GUI.

**Live:** https://logs.facundogrowth.com

## Log Format

```
[server]:::[domain]:::ip1,ip2 - - [dd/Mon/yyyy:HH:MM:SS +0000] "METHOD /path HTTP/1.1" status bytes "referer" "user-agent" "extra-id"
```

## Project Structure

```
log_analyzer/
├── rust_parser/          # Rust CLI
│   ├── Cargo.toml
│   ├── setup-env.sh      # Install Rust locally
│   ├── activate-env.sh   # Activate local environment
│   └── src/
│       ├── main.rs       # CLI entry point
│       ├── lib.rs        # Public API, parallel processing
│       ├── parser.rs     # Regex parsing, LogEntry struct
│       ├── bot_detector.rs  # 48 bot patterns + Google IP verification
│       ├── file_reader.rs   # Memmap for large files (>100MB)
│       ├── aggregator.rs    # HashMap-based statistics
│       ├── output.rs        # JSON serialization
│       └── wasm.rs       # WebAssembly bindings (optional)
│
├── web/                  # Web GUI (deployed to Vercel)
│   ├── index.html        # Drag & drop interface
│   ├── style.css         # Dark theme
│   ├── script.js         # JS parser (mirrors Rust logic)
│   └── package.json
│
├── vercel.json           # Vercel config (serves web/)
└── .vercelignore         # Excludes rust_parser from deploy
```

## CLI Usage

```bash
cd rust_parser

# First time setup
./setup-env.sh && source activate-env.sh

# Build
cargo build --release --features cli

# Parse files
./target/release/log_parser access.log
./target/release/log_parser *.log -o stats.json -n 50
```

## Web GUI

Drag & drop `.log` files at https://logs.facundogrowth.com

Local development:
```bash
cd web && python3 -m http.server 8080
```

Deploy:
```bash
vercel --prod
```

## Features

- 48+ bot patterns (Search engines, LLM bots, SEO tools, Social media, Monitoring)
- Parallel processing (Rayon) in CLI
- Memory-mapped I/O for large files (>100MB)
- Googlebot IP verification
- Stats: URLs, IPs, status codes, methods, bots by category, traffic by date
- JSON export
