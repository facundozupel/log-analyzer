#!/bin/bash
# Setup isolated Rust environment within this project
# Rust will be installed in .rust/ directory, not globally

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUST_LOCAL="$SCRIPT_DIR/.rust"

export RUSTUP_HOME="$RUST_LOCAL/rustup"
export CARGO_HOME="$RUST_LOCAL/cargo"
export PATH="$CARGO_HOME/bin:$PATH"

# Check if already installed
if [ -f "$CARGO_HOME/bin/cargo" ]; then
    echo "✓ Rust environment already set up in $RUST_LOCAL"
    echo "  Run: source activate-env.sh"
    exit 0
fi

echo "Installing Rust locally in $RUST_LOCAL..."
mkdir -p "$RUST_LOCAL"

# Download and run rustup installer
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --no-modify-path

echo ""
echo "✓ Rust installed locally!"
echo ""
echo "To activate the environment, run:"
echo "  source activate-env.sh"
echo ""
echo "Then you can use cargo normally:"
echo "  cargo build --release"
echo "  cargo test"
