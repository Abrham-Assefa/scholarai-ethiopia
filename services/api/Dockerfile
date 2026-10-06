FROM python:3.12-slim
WORKDIR /app
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
COPY services/ai /app/services/ai
COPY services/api /app/services/api
COPY data/seed /app/data/seed
WORKDIR /app/services/api
RUN uv pip install --system -e ../ai -e .
ENV DATABASE_URL=sqlite:////app/services/api/data/scholarai.db
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
