#!/bin/sh
cat > /usr/share/nginx/html/env-config.js << EOF
window.__RUNTIME_CONFIG__ = {
  API_URL: "${API_URL:-http://localhost:8000/api}"
};
EOF
exec nginx -g 'daemon off;'
