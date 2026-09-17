# MindLab Production Deployment Guide

This project is configured to run on Render.com with a Supabase PostgreSQL database.

## Environment Variables Needed on Render:
1. `DATABASE_URL` : Your Supabase connection string (Transaction connection).
2. `GEMINI_API_KEY` : Your Google Gemini API Key.
3. `JWT_SECRET` : A random long string for security (e.g., `my-super-secret-key-12345`).

## Start Command:
`uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
