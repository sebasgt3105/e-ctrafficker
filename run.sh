#!/bin/bash
cd /data/.openclaw/workspace/metaemergen-v2/backend
exec python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
