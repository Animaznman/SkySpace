FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY firehose.py .

COPY start_fire.sh /start_fire.sh
RUN chmod +x /start_fire.sh

ENV PYTHONBUFFERED=1
ENV PYTHONPATH="/app:$PYTHONPATH"

ENTRYPOINT ["/start_fire.sh"]