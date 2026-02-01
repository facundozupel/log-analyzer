use clap::Parser;
use std::path::PathBuf;

use log_parser::{output, process_files};

/// High-performance log parser with parallel processing and bot detection
#[derive(Parser)]
#[command(name = "log_parser")]
#[command(about = "Parse server logs and output aggregated statistics as JSON")]
#[command(version)]
struct Args {
    /// Log files to process
    #[arg(required = true)]
    files: Vec<PathBuf>,

    /// Output file (stdout if not specified)
    #[arg(short, long)]
    output: Option<PathBuf>,

    /// Number of top items to include in output (default: 100)
    #[arg(short = 'n', long, default_value = "100")]
    top: usize,

    /// Pretty print JSON output
    #[arg(short, long, default_value = "true")]
    pretty: bool,
}

fn main() {
    let args = Args::parse();

    // Validate input files exist
    let mut valid_paths: Vec<PathBuf> = Vec::new();
    for path in &args.files {
        if path.exists() {
            valid_paths.push(path.clone());
        } else {
            eprintln!("Warning: File not found: {:?}", path);
        }
    }

    if valid_paths.is_empty() {
        eprintln!("Error: No valid input files provided");
        std::process::exit(1);
    }

    // Convert to path references for processing
    let path_refs: Vec<&std::path::Path> = valid_paths.iter().map(|p| p.as_path()).collect();

    // Process all files in parallel
    eprintln!("Processing {} file(s)...", path_refs.len());
    let stats = process_files(&path_refs);

    // Convert to summary
    let summary = stats.to_summary(args.top);

    // Output results
    let result = if let Some(output_path) = args.output {
        output::write_json_file(&summary, &output_path)
            .map(|_| eprintln!("Output written to {:?}", output_path))
    } else {
        output::write_json_stdout(&summary)
    };

    if let Err(e) = result {
        eprintln!("Error writing output: {}", e);
        std::process::exit(1);
    }

    // Print summary to stderr
    eprintln!("\nSummary:");
    eprintln!("  Total requests: {}", summary.total_requests);
    eprintln!("  Unique URLs: {}", summary.unique_urls_count);
    eprintln!("  Unique IPs: {}", summary.unique_ips_count);
    eprintln!("  Bot requests: {} ({:.1}%)", summary.bot_requests, summary.bot_percentage);
    eprintln!("  Human requests: {}", summary.human_requests);
    eprintln!("  Verified Googlebot: {}", summary.verified_googlebot_requests);
}
