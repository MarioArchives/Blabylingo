#!/bin/sh
# Serves the site to your phone over the home Wi-Fi.
# Stop it with Ctrl+C. The laptop must stay awake while you practise.
PORT=8000
IP=$(hostname -I | awk '{print $1}')
cd "$(dirname "$(readlink -f "$0")")" || exit 1
echo "On your phone, on the same Wi-Fi, open:"
echo "  http://$IP:$PORT/"
exec python3 -m http.server "$PORT" --bind 0.0.0.0
