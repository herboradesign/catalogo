#!/bin/bash
cd "$(dirname "$0")"
PORT=8765
URL="http://127.0.0.1:${PORT}/#/entrada"
if command -v python3 >/dev/null 2>&1; then
  (sleep 1; open "$URL") &
  exec python3 -m http.server "$PORT" --bind 127.0.0.1
else
  echo "No se ha encontrado Python 3 en este Mac."
  echo "Abre Terminal en esta carpeta y ejecuta un servidor local, o sube la carpeta a GitHub Pages."
  read -n 1 -s -r -p "Pulsa una tecla para cerrar..."
fi
