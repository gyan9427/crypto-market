#!/usr/bin/env bash
# Optional staging startup budget check against a captured baseline JSON.
set -euo pipefail

BASELINE="${1:-docs/perf/baseline-template.json}"

if [[ ! -f "$BASELINE" ]]; then
  echo "Baseline file not found: $BASELINE" >&2
  exit 1
fi

node <<EOF
const fs = require('fs');
const baseline = JSON.parse(fs.readFileSync('${BASELINE}', 'utf8'));
const failures = [];

if (baseline.startupTier1Ms != null && baseline.startupTier1Ms > 3000) {
  failures.push('startupTier1Ms exceeds 3000ms: ' + baseline.startupTier1Ms);
}
if (baseline.backgroundSyncCount != null && baseline.backgroundSyncCount > 2) {
  failures.push('backgroundSyncCount exceeds budget: ' + baseline.backgroundSyncCount);
}
if (baseline.feedOrchestrationCount != null && baseline.feedOrchestrationCount > 8) {
  failures.push('feedOrchestrationCount exceeds budget: ' + baseline.feedOrchestrationCount);
}

if (failures.length) {
  console.error('Startup budget check FAILED:');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}

console.log('Startup budget check OK:', '${BASELINE}');
EOF
