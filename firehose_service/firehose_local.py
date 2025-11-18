import asyncio
import websockets
import os
import json
import datetime
import time

base_dir = "skeets"
os.makedirs(base_dir, exist_ok=True)

start_time = time.time()
# duration = 86400  # 24 hours
duration = 30

uri = "wss://jetstream2.us-east.bsky.network/subscribe?wantedCollections=app.bsky.feed.post"


async def listen_to_websocket():
    async with websockets.connect(uri) as websocket:
        while time.time() - start_time < duration:
            if (time.time()-start_time)%60==0:
                print(f"Currently processing for {minute} minute at filepath {file_path}")
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
                file_path = os.path.join(base_dir, f"data_{minute}.jsonl")
                # # Write compact JSON (no escapes beyond JSON spec)
                with open(file_path, "a", encoding="utf-8") as f:
                    f.write(
                        json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
                        + "\n"
                    )

            except websockets.ConnectionClosed as e:
                print(f"Connection closed: {e}")
                break
            except Exception as e:
                print(f"Error: {e}")


asyncio.get_event_loop().run_until_complete(listen_to_websocket())


