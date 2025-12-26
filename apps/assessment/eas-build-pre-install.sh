#!/usr/bin/env bash

set -euo pipefail

if [ -n "${GOOGLE_SERVICES_JSON:-}" ]; then
  echo "Writing google-services.json from secret..."
  echo "$GOOGLE_SERVICES_JSON" > ./google-services.json
else
  echo "Warning: GOOGLE_SERVICES_JSON secret not found"
fi
