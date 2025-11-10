import asyncio
import websockets
import os
import json
import datetime
import time
from google.cloud import storage

bucket_name = "skyspace-bucket"

def upload_json_to_gcs(bucket_name, blob_name, data):
    """Uploads JSON data to a GCS blob."""
    project_id = 'skyspace-476120'
    storage_client = storage.Client(project=project_id)
    bucket = storage_client.bucket(bucket_name, user_project=project_id)
    blob = bucket.blob(blob_name)

    # Serialize the Python dictionary to a JSON string
    json_string = json.dumps(data, ensure_ascii=False, separators=(",", ":"))

    # Upload the JSON string to the blob
    blob.upload_from_string(json_string, content_type='application/json')
    print(f"Uploaded {blob_name} to {bucket_name}.")

# base_dir = "skeets"
# os.makedirs(base_dir, exist_ok=True)

start_time = time.time()
duration = 1 * 60  # 10 minutes

uri = "wss://jetstream2.us-east.bsky.network/subscribe?wantedCollections=app.bsky.feed.post"


async def listen_to_websocket():
    async with websockets.connect(uri) as websocket:
        while time.time() - start_time < duration:
            try:

                message = await websocket.recv()

                # Decode binary messages safely
                if isinstance(message, (bytes, bytearray)):
                    message = message.decode("utf-8", "replace")

                # Parse once (to ensure valid JSON)
                try:
                    obj = json.loads(message)
                except json.JSONDecodeError:
                    print("Invalid JSON, skipping")
                    continue

                # File per minute (UTC)
                minute = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M")
                # file_path = os.path.join(base_dir, f"data_{minute}.jsonl")

                # # Write compact JSON (no escapes beyond JSON spec)
                # with open(file_path, "a", encoding="utf-8") as f:
                #     f.write(
                #         json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
                #         + "\n"
                #     )
                
                # Upload JSON to GCS
                upload_json_to_gcs(bucket_name, f'{minute}.json', obj)


            except websockets.ConnectionClosed as e:
                print(f"Connection closed: {e}")
                break
            except Exception as e:
                print(f"Error: {e}")


asyncio.get_event_loop().run_until_complete(listen_to_websocket())


