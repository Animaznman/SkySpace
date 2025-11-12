import asyncio
import websockets
import json
import time
import datetime
from google.cloud import storage
from dotenv import load_dotenv
import os

load_dotenv()
PROJECT_ID = os.getenv("PROJECT_ID")
BUCKET_NAME = os.getenv("BUCKET_NAME")
URI ="wss://jetstream2.us-east.bsky.network/subscribe?wantedCollections=app.bsky.feed.post"
print(PROJECT_ID)
print(BUCKET_NAME)

target_dids = {"did:plc:btexzxhepcphnjfh453g2s4y":[], "did:plc:ppsnsbcfgq2x5zevehoiy7ph":[]}

# ---- GCS client (Requester Pays friendly) ----
storage_client = storage.Client(project=PROJECT_ID)
bucket = storage_client.bucket(BUCKET_NAME, user_project=PROJECT_ID)  # keep user_project even if RP off

def flush_minute_to_gcs(minute_key: str, obj: dict, did: str):
    """Upload all collected events for a minute as one JSONL object."""
    blob_name = f"bsky/{did}/{minute_key}.jsonl"  # e.g., 20251103_2134.jsonl
    blob = bucket.blob(blob_name)
    payload = "\n".join(obj[did]) + "\n"  # newline-terminate for JSONL
    blob.upload_from_string(payload, content_type="application/x-ndjson")
    print(f"Uploaded {blob_name} with {len(obj[did])} events")


async def listen_to_websocket(duration_sec: int = 10 * 60):
    start_time = time.time()
    current_minute = None

    async with websockets.connect(URI) as ws:
        cur_minute = int(time.time())//60
        while time.time() - start_time < duration_sec:
            if cur_minute != int(time.time())//60:
                print(f"Currently processing for minute {datetime.datetime.now(datetime.UTC).strftime("%Y%m%d_%H%M")}")
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
                    target_dids[obj['did']].append(json.dumps(obj, ensure_ascii=False, separators=(",", ":")))
                    # buffer_lines.append(json.dumps(obj, ensure_ascii=False, separators=(",", ":")))

            except websockets.ConnectionClosed as e:
                print(f"Connection closed: {e}")
                break
            except Exception as e:
                print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(listen_to_websocket(duration_sec=60))  # set to 60s for quick test; bump as needed
    print("Finished drinking from firehose. 🔥🚨")
    print("Now writing to bucket. 🥫")
    for did in target_dids.keys():
        print(f"Processing did {did}")
        flush_minute_to_gcs(time.time(), target_dids, did)