#!/bin/bash

# Test GitHub Import API
# Usage: ./scripts/test-github-import.sh

API_URL="http://localhost:3000/api/github/import"
GITHUB_USERNAME="sbsmith86"
USER_ID="cmhi6nmxk0000oaap9cge82q7"

echo "=== TESTING GITHUB IMPORT ==="
echo ""
echo "Username: $GITHUB_USERNAME"
echo "User ID: $USER_ID"
echo ""

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ ERROR: Development server not running"
    echo "Start server with: npm run dev"
    exit 1
fi

echo "Sending import request..."
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$GITHUB_USERNAME\",\"userId\":\"$USER_ID\"}")

echo ""
echo "Response:"
echo "$RESPONSE" | jq '.'

# Check for success
if echo "$RESPONSE" | jq -e '.success' > /dev/null; then
    echo ""
    echo "✅ IMPORT SUCCESSFUL"
    echo ""
    echo "Next steps:"
    echo "1. Run: node scripts/check-profile-data.js"
    echo "2. Verify new experiences with company=\"GitHub\""
    echo "3. Check browser console for import details"
else
    echo ""
    echo "❌ IMPORT FAILED"
    echo "Check error message above"
fi
