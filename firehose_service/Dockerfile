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

COPY firehose_v3.py .

COPY start_fire.sh .
RUN chmod +x start_fire.sh

ENTRYPOINT ["./start_fire.sh"]