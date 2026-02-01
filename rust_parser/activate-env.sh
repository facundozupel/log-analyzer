#!/bin/bash
# Activate the local Rust environment
# Usage: source activate-env.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUST_LOCAL="$SCRIPT_DIR/.rust"

export RUSTUP_HOME="$RUST_LOCAL/rustup"
export CARGO_HOME="$RUST_LOCAL/cargo"
export PATH="$CARGO_HOME/bin:$PATH"

if [ ! -f "$CARGO_HOME/bin/cargo" ]; then
    echo "⚠ Rust not installed. Run: ./setup-env.sh"
    return 1
fi

echo "✓ Rust environment activated"
echo "  RUSTUP_HOME=$RUSTUP_HOME"
echo "  CARGO_HOME=$CARGO_HOME"
cargo --version
rustc --version
