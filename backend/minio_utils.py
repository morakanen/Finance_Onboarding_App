import os
from minio import Minio

MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "minio:9000")
MINIO_ROOT_USER = os.getenv("MINIO_ROOT_USER", "minioadmin")
MINIO_ROOT_PASSWORD = os.getenv("MINIO_ROOT_PASSWORD", "minioadmin")
MINIO_BUCKET = os.getenv("MINIO_BUCKET", "mybucket")

minio_client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ROOT_USER,
    secret_key=MINIO_ROOT_PASSWORD,
    secure=False
)

def ensure_bucket_exists():
    print(f"[DEBUG] ensure_bucket_exists() called. Endpoint={MINIO_ENDPOINT}, Bucket={MINIO_BUCKET}")
    try:
        found = minio_client.bucket_exists(MINIO_BUCKET)
        if not found:
            minio_client.make_bucket(MINIO_BUCKET)
            print(f"Bucket '{MINIO_BUCKET}' created.")
        else:
            print(f"Bucket '{MINIO_BUCKET}' already exists.")
    except Exception as e:
        print("Error creating/checking bucket:", e)