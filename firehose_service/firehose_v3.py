import asyncio
import websockets
import json
import time
import datetime
import pandas as pd
from google.cloud import storage
from dotenv import load_dotenv
import os
import pandas as pd
from google.cloud import bigquery

client = bigquery.Client(project="skyspace-476120")

df = client.query("""
    SELECT did
    FROM `skyspace-476120.skyspace.users`
    LIMIT 200
""").to_dataframe()

load_dotenv()
PROJECT_ID = os.getenv("PROJECT_ID")
BUCKET_NAME = os.getenv("BUCKET_NAME")
URI ="wss://jetstream2.us-east.bsky.network/subscribe?wantedCollections=app.bsky.feed.post"
print(f"Project ID: {PROJECT_ID}")
print(f"Bucket: {BUCKET_NAME}")

top_100_dids = df.to_dict()['did'].values()
target_dids = {did: [] for did in top_100_dids}
target_dids["did:plc:btexzxhepcphnjfh453g2s4y"] = []
target_dids["did:plc:ppsnsbcfgq2x5zevehoiy7ph"] = []

# target_dids = {"did:plc:btexzxhepcphnjfh453g2s4y":[], "did:plc:ppsnsbcfgq2x5zevehoiy7ph":[]}

# ---- GCS client (Requester Pays friendly) ----
storage_client = storage.Client(project=PROJECT_ID)
bucket = storage_client.bucket(BUCKET_NAME, user_project=PROJECT_ID)  # keep user_project even if RP off

def flush_to_gcs(minute_key: int = int(time.time()), dids: dict = target_dids):
    """Upload all collected events for a minute as one JSONL object."""
    print("Flushing 🚽 to bucket 🪣")
    for did in dids.keys():
        print(f"Processing did {did} 🪪")
        stripped_did = did.split(":")[2] # This will be a problem further down the line
        blob_name = f"bsky/{stripped_did}/{minute_key}.jsonl"  # e.g., 20251103_2134.jsonl
        blob = bucket.blob(blob_name)
        if len(dids[did]) <= 1:
            print(f"No events for did:{stripped_did} ⏭️")
            continue
        payload = "\n".join(dids[did]) + "\n"  # newline-terminate for JSONL
        blob.upload_from_string(payload, content_type="application/x-ndjson")
        print(f"Uploaded {blob_name} with {len(dids[did])} events 🛜 💾")


async def listen_to_websocket(duration_sec: int = 10 * 60):
    print("Drinking from the firehose 🥤")
    print(f"😋 Slurping for {duration_sec} seconds")
    start_time = time.time()
    current_minute = None

    async with websockets.connect(URI) as ws:
        cur_minute = int(time.time())//60
        events_logged = 0
        while time.time() - start_time < duration_sec:
            if cur_minute != int(time.time())//60:
                print(f'Currently processing for minute {datetime.datetime.now(datetime.UTC).strftime("%Y%m%d_%H%M")}')
                cur_minute= int(time.time())//60
            try:
                msg = await ws.recv()

                # Decode if binary
                if isinstance(msg, (bytes, bytearray)):
                    msg = msg.decode("utf-8", "replace")

                # Validate JSON once
                try:
                    obj = json.loads(msg)
                except json.JSONDecodeError:
                    # Skip non-JSON frames
                    continue

                # now_minute = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M") # Deprecated
                now_minute = datetime.datetime.now(datetime.UTC).strftime("%Y%m%d_%H%M")
                
                # print(f"Message received from {obj['did']} at time {obj['time_us']}.")
                
                # On minute rollover, flush the previous minute's buffer
                if current_minute is None:
                    current_minute = now_minute
                elif now_minute != current_minute:
                    current_minute = now_minute

                # Add compact JSON line to in-memory buffer
                if obj['did'] in target_dids:
                    events_logged += 1
                    cid = obj['commit']['cid']
                    did = obj['did']
                    rkey = obj['commit']['rkey']
                    created_at = obj['time_us']
                    record = obj['commit']['record']
                    text = obj['commit']['record']['text']
                    dump = {'cid': cid, 'did': did, 'rkey': rkey,
                                  'created_at': created_at, 'record': record,
                                  'text': text}
                    target_dids[obj['did']].append(json.dumps(dump, ensure_ascii=False, separators=(",", ":")))
                    # buffer_lines.append(json.dumps(obj, ensure_ascii=False, separators=(",", ":")))

            except websockets.ConnectionClosed as e:
                print(f"Connection closed: {e}")
                break
            except Exception as e:
                print(f"Error: {e}")
    print("Finished drinking from firehose. 🔥🚨")
    print(f"Events logged: {events_logged} 🪵")


if __name__ == "__main__":
    asyncio.run(listen_to_websocket(duration_sec=60))  # set to 60s for quick test; bump as needed
    flush_to_gcs()