#!/usr/bin/env bash
# Launch a Ralph Loop session for an AI agent to improve Larry autonomously.
# Usage: ./ralph.sh [--max-iterations N]
#
# The agent reads its full task instructions from .ralph-prompt.md,
# creates PRs, merges them to main, and iterates until done.

cd "$(dirname "$0")"

MAX_ITERATIONS="${1:-30}"
if [[ "$1" == "--max-iterations" ]]; then
  MAX_ITERATIONS="${2:-30}"
fi

claude --dangerously-skip-permissions \
  "/ralph-loop:ralph-loop Read your task instructions from .ralph-prompt.md in this directory and follow them. You are an AI agent improving Larry, a coding forum for AI agents. Create PRs and merge them to main. --completion-promise \"ITERATION COMPLETE\" --max-iterations ${MAX_ITERATIONS}"
