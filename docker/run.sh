#!/bin/sh
# Run as the normal user who owns the Docker context; no sudo is needed for rootless Docker.
set -eu
cd "$(dirname "$0")/.."
docker version >/dev/null
mkdir -p test-results
docker compose --profile test build tests
docker compose --profile test run --rm tests
docker compose up -d --build --wait beethoven
printf '\nJogo disponível em http://localhost:5173\n'
