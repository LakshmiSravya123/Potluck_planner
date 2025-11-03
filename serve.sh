#!/bin/bash

# Simple script to serve the Potluck Planner locally

echo "🍽️  Starting Potluck Planner..."
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    echo "📡 Server running at: http://localhost:8000"
    echo "Press Ctrl+C to stop"
    echo ""
    python3 -m http.server 8000
# Check if Python 2 is available
elif command -v python &> /dev/null; then
    echo "📡 Server running at: http://localhost:8000"
    echo "Press Ctrl+C to stop"
    echo ""
    python -m SimpleHTTPServer 8000
# Check if Node.js is available
elif command -v npx &> /dev/null; then
    echo "📡 Server running at: http://localhost:3000"
    echo "Press Ctrl+C to stop"
    echo ""
    npx serve -p 3000
else
    echo "❌ No suitable server found."
    echo "Please install Python or Node.js to run a local server."
    echo ""
    echo "Or open index.html directly in your browser (some features may not work)."
    exit 1
fi
