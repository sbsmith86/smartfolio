#!/bin/bash

# Test Chat API with PHP Experience Question
# This script tests the chat endpoint to verify search quality improvements

echo "🧪 Testing Chat API - PHP Experience Question"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Configuration
API_URL="http://localhost:3000/api/chat"
USER_ID="cmhi6nmxk0000oaap9cge82q7"
QUESTION="what php experience does the candidate have"

echo "📍 Endpoint: $API_URL"
echo "👤 User ID: $USER_ID"
echo "❓ Question: \"$QUESTION\""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📡 Sending request..."
echo ""

# Make the API call and capture response
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"question\":\"$QUESTION\"}")

# Check if curl succeeded
if [ $? -ne 0 ]; then
  echo "❌ Error: Failed to connect to API"
  exit 1
fi

# Check if response is valid JSON
if ! echo "$RESPONSE" | jq . >/dev/null 2>&1; then
  echo "❌ Error: Invalid JSON response"
  echo ""
  echo "Raw response:"
  echo "$RESPONSE"
  exit 1
fi

# Parse response
ANSWER=$(echo "$RESPONSE" | jq -r '.answer')
CITATIONS_COUNT=$(echo "$RESPONSE" | jq '.citations | length')
RETRIEVED_COUNT=$(echo "$RESPONSE" | jq -r '.retrievedCount')

echo "✅ Response received!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 METRICS:"
echo "  • Retrieved items: $RETRIEVED_COUNT"
echo "  • Citations: $CITATIONS_COUNT"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💬 ANSWER:"
echo ""
echo "$ANSWER"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔗 CITATIONS:"
echo ""

# Display citations
echo "$RESPONSE" | jq -r '.citations[] | "  • \(.title)\n    Type: \(.type)\n    Excerpt: \(.excerpt | .[0:100])...\n"'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔍 QUALITY CHECK:"
echo ""

# Count PHP mentions in answer
PHP_MENTIONS=$(echo "$ANSWER" | grep -io "php" | wc -l | tr -d ' ')
LARAVEL_MENTIONS=$(echo "$ANSWER" | grep -io "laravel" | wc -l | tr -d ' ')
DRUPAL_MENTIONS=$(echo "$ANSWER" | grep -io "drupal" | wc -l | tr -d ' ')

echo "  PHP mentions: $PHP_MENTIONS"
echo "  Laravel mentions: $LARAVEL_MENTIONS"
echo "  Drupal mentions: $DRUPAL_MENTIONS"
echo ""

# Count unique companies/projects mentioned
LANTERN_MENTIONED=$(echo "$ANSWER" | grep -i "lantern" && echo "✅" || echo "❌")
DOSOMETHING_MENTIONED=$(echo "$ANSWER" | grep -i "dosomething\|do something" && echo "✅" || echo "❌")
GITHUB_MENTIONED=$(echo "$ANSWER" | grep -i "github\|rogue\|project" && echo "✅" || echo "❌")

echo "  Lantern mentioned: $LANTERN_MENTIONED"
echo "  DoSomething mentioned: $DOSOMETHING_MENTIONED"
echo "  GitHub projects mentioned: $GITHUB_MENTIONED"
echo ""

# Determine if improvement was successful
if [ "$CITATIONS_COUNT" -gt 2 ] && [ "$RETRIEVED_COUNT" -ge 10 ]; then
  echo "✅ IMPROVEMENT SUCCESSFUL!"
  echo "   - Retrieved $RETRIEVED_COUNT items (target: ≥10)"
  echo "   - Generated $CITATIONS_COUNT citations (target: >2)"
else
  echo "⚠️  NEEDS FURTHER TUNING"
  echo "   - Retrieved: $RETRIEVED_COUNT (expected: ≥10)"
  echo "   - Citations: $CITATIONS_COUNT (expected: >2)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Full JSON Response:"
echo ""
echo "$RESPONSE" | jq .
echo ""
