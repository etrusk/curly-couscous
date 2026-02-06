#!/usr/bin/env bash
# Validate session.md against WP requirements (TEMPORARY)
# Usage: bash .tdd/validate-session.sh
# Delete after workflow is validated across 2+ sessions.

set -euo pipefail

SESSION=".tdd/session.md"
PASS=0
FAIL=0

check() {
  local label="$1"
  local result="$2"
  if [ "$result" = "true" ]; then
    echo "  PASS: $label"
    ((PASS++))
  else
    echo "  FAIL: $label"
    ((FAIL++))
  fi
}

if [ ! -f "$SESSION" ]; then
  echo "No session.md found — run /tdd first."
  exit 1
fi

echo "=== WP Validation: $SESSION ==="
echo ""

# WP1: Agent names use tdd- prefix
echo "WP1: Agent Names"
old_agents=$(grep -cP '\| (architect|coder|reviewer|troubleshooter) ' "$SESSION" 2>/dev/null || echo 0)
new_agents=$(grep -cP '\| tdd-' "$SESSION" 2>/dev/null || echo 0)
check "No old agent names in history" "$([ "$old_agents" -eq 0 ] && echo true || echo false)"
check "At least one tdd- agent in history" "$([ "$new_agents" -gt 0 ] && echo true || echo false)"

# WP2: Enhanced Agent History table columns
echo ""
echo "WP2: Enhanced Metrics"
has_tools_col=$(grep -cP 'Tools.*Duration.*Status.*Notes' "$SESSION" 2>/dev/null || echo 0)
check "Agent History has Tools/Duration/Notes columns" "$([ "$has_tools_col" -gt 0 ] && echo true || echo false)"

# WP4: Context budget denominator
echo ""
echo "WP4: Context Budgets"
has_300k=$(grep -cP '/300K' "$SESSION" 2>/dev/null || echo 0)
has_old_budget=$(grep -cP '/(80|100)K' "$SESSION" 2>/dev/null || echo 0)
check "Uses /300K denominator" "$([ "$has_300k" -gt 0 ] && echo true || echo false)"
check "No old /80K or /100K denominator" "$([ "$has_old_budget" -eq 0 ] && echo true || echo false)"

# Summary
echo ""
TOTAL=$((PASS + FAIL))
echo "=== Results: $PASS/$TOTAL passed ==="
if [ "$FAIL" -gt 0 ]; then
  echo "Action: Fix failing checks before considering workflow validated."
  exit 1
else
  echo "All structural checks passed."
fi
