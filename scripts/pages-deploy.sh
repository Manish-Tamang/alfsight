#!/usr/bin/env bash
# Deploy a static build to Cloudflare Pages, creating the project on first run.
# Usage: scripts/pages-deploy.sh <project-name> <dist-dir>
set -euo pipefail

project="$1"
dir="$2"

if ! pnpm exec wrangler pages project list | grep -q "│ ${project} │"; then
  echo "Creating Pages project ${project}"
  pnpm exec wrangler pages project create "$project" --production-branch main
fi

pnpm exec wrangler pages deploy "$dir" --project-name "$project" --branch main
