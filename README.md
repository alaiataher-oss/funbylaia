# alaia fun

Personal site: **Home · Stories · Games** (Undercover playable).

## Local

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
PYTHONPATH="." python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8787
```

## Deploy

Vercel project: **funbylaia** (GitHub → Vercel, FastAPI via `app/main.py`).
Set `ADMIN_PASSWORD` in Vercel env if using the question bank API.
