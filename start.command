#!/bin/bash
cd "$(dirname "$0")"
if lsof -i :3000 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Servidor já rodando em http://localhost:3000"
  open http://localhost:3000
else
  npm run dev
fi
