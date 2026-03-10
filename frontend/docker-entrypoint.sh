#!/bin/sh
# Generate runtime config from environment variables.
# This runs at container startup so the same image works in any environment.

cat <<EOF > /usr/share/nginx/html/config.js
window.__RUNTIME_CONFIG__ = {
  VITE_GOOGLE_CLIENT_ID: "${VITE_GOOGLE_CLIENT_ID:-}"
};
EOF

exec "$@"
