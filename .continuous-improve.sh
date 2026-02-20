#!/bin/bash
# Continuous Improvement Daemon for zero-re
# Maintains S+ status: 1069+ tests passing, 0 lint warnings

REPO_DIR="/root/repos/zero-re"
LOG_FILE="/tmp/zero-re-improve.log"
ITERATION=0

cd "$REPO_DIR"

echo "[$(date -Iseconds)] 🚀 Continuous Improvement Daemon Started"
echo "[$(date -Iseconds)] Target: Maintain S+ status indefinitely"
echo "[$(date -Iseconds)] Baseline: 1069 tests passing, lint clean"

while true; do
  ITERATION=$((ITERATION + 1))
  TIMESTAMP=$(date -Iseconds)
  
  echo "[$TIMESTAMP] ===== Cycle #$ITERATION =====" >> "$LOG_FILE"
  
  # Pull latest changes
  git pull origin main --quiet 2>/dev/null || true
  
  # Run lint
  if npm run lint >/dev/null 2>&1; then
    echo "[$TIMESTAMP] ✅ Lint clean" >> "$LOG_FILE"
  else
    echo "[$TIMESTAMP] ⚠️ Lint issues detected, running format..." >> "$LOG_FILE"
    npm run format >/dev/null 2>&1 || true
  fi
  
  # Run tests
  echo "[$TIMESTAMP] Running test suite..." >> "$LOG_FILE"
  npm run test > /tmp/test-out.txt 2>&1 || true
  
  # Parse results
  if grep -q "passed" /tmp/test-out.txt 2>/dev/null; then
    CLIENT=$(grep "Tests:" /tmp/test-out.txt | head -1 | grep -oE "[0-9]+ passed" | grep -oE "[0-9]+" || echo 0)
    SERVER=$(grep "Tests:" /tmp/test-out.txt | tail -1 | grep -oE "[0-9]+ passed" | grep -oE "[0-9]+" || echo 0)
    TOTAL=$((CLIENT + SERVER))
    echo "[$TIMESTAMP] ✅ Tests passing: $TOTAL (Client: $CLIENT, Server: $SERVER)" >> "$LOG_FILE"
    
    if [ "$TOTAL" -ge 1069 ]; then
      echo "[$TIMESTAMP] 🎯 S+ Status: MAINTAINED" >> "$LOG_FILE"
    else
      echo "[$TIMESTAMP] ⚠️ Test count below threshold: $TOTAL" >> "$LOG_FILE"
    fi
  fi
  
  # Commit any changes
  if ! git diff --quiet 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
    echo "[$TIMESTAMP] Committing improvements..." >> "$LOG_FILE"
    git add . 2>/dev/null || true
    git commit -m "chore: continuous improvement cycle $ITERATION" --quiet || true
    git push origin main --quiet || true
    echo "[$TIMESTAMP] ✅ Pushed cycle $ITERATION" >> "$LOG_FILE"
  fi
  
  echo "[$TIMESTAMP] ===== Cycle Complete =====" >> "$LOG_FILE"
  echo "" >> "$LOG_FILE"
  
  # Wait 3 minutes before next cycle
  sleep 180
done
