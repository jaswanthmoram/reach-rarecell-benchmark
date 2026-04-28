#!/usr/bin/bash
# Render Mermaid diagrams if Node/npx is available
set -e
MMD_FILE="${1:-docs/assets/architecture.mmd}"
OUT_DIR="${2:-docs/assets}"

if command -v npx &> /dev/null; then
    npx -y @mermaid-js/mermaid-cli -i "$MMD_FILE" -o "$OUT_DIR/architecture.svg"
    npx -y @mermaid-js/mermaid-cli -i "$MMD_FILE" -o "$OUT_DIR/architecture.png"
    echo "Rendered $OUT_DIR/architecture.svg and .png"
else
    echo "npx not found. Install Node.js to render Mermaid diagrams, or use the Mermaid Live Editor."
    echo "https://mermaid.live/"
    exit 1
fi
