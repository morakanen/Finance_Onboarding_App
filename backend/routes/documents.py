from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from minio import Minio
from minio.error import S3Error
import os
from typing import List
import uuid
from fastapi.responses import JSONResponse, StreamingResponse
import io

router = APIRouter(prefix="/api")

# Initialize MinIO client
minio_client = Minio(
    "minio:9000",
    access_key="minioadmin",
    secret_key="minioadmin",
    secure=False
)

BUCKET_NAME = "client-documents"

# Ensure bucket exists
try:
    if not minio_client.bucket_exists(BUCKET_NAME):
        minio_client.make_bucket(BUCKET_NAME)
except S3Error as err:
    print(f"Error creating bucket: {err}")

@router.post('/upload-document')
async def upload_document(file: UploadFile = File(...), applicationId: str = Form(...)):
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")

        if not applicationId:
            raise HTTPException(status_code=400, detail="Application ID is required")

        # Generate a unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{applicationId}/{str(uuid.uuid4())}{file_extension}"

        # Save file to MinIO using the file's SpooledTemporaryFile
        minio_client.put_object(
            BUCKET_NAME,
            unique_filename,
            file.file,
            file.size,
            content_type=file.content_type or 'application/octet-stream'
        )

        # Generate a presigned URL for viewing the file
        url = minio_client.presigned_get_object(BUCKET_NAME, unique_filename)

        # Reset file cursor for potential reuse
        await file.seek(0)

        return {
            'message': 'File uploaded successfully',
            'id': unique_filename,
            'url': url,
            'name': file.filename
        }

    except S3Error as err:
        raise HTTPException(status_code=500, detail=f"MinIO error: {str(err)}")
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Server error: {str(err)}")

@router.delete('/delete-document/{file_id}')
async def delete_document(file_id: str):
    try:
        minio_client.remove_object(BUCKET_NAME, file_id)
        return {'message': 'File deleted successfully'}
    except S3Error as err:
        raise HTTPException(status_code=500, detail=f"MinIO error: {str(err)}")
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Server error: {str(err)}")

@router.get('/download-document/{application_id}/{file_id}')
async def download_document(application_id: str, file_id: str):
    try:
        # Construct the full object path
        object_path = f"{application_id}/{file_id}"
        
        # Get object data and info
        data = minio_client.get_object(BUCKET_NAME, object_path)
        stats = minio_client.stat_object(BUCKET_NAME, object_path)
        
        # Create an async generator to stream the file
        async def iterfile():
            while True:
                chunk = data.read(8192)  # Read in 8KB chunks
                if not chunk:
                    break
                yield chunk
            data.close()
        
        # Get the original filename from the object name
        filename = os.path.basename(file_id)
        
        # Set up the response headers for download
        headers = {
            'Content-Disposition': f'attachment; filename="{filename}"',
            'Content-Type': stats.content_type or 'application/octet-stream',
            'Content-Length': str(stats.size)
        }
        
        return StreamingResponse(iterfile(), headers=headers)
    except S3Error as err:
        raise HTTPException(status_code=404, detail=f"File not found: {str(err)}")
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Error downloading file: {str(err)}")

@router.get('/list-documents/{application_id}')
async def list_documents(application_id: str):
    try:
        objects = minio_client.list_objects(BUCKET_NAME, prefix=f"{application_id}/")
        documents = []
        
        for obj in objects:
            url = minio_client.presigned_get_object(BUCKET_NAME, obj.object_name)
            # Remove the application_id prefix from the file ID
            file_id = obj.object_name.replace(f"{application_id}/", "", 1)
            documents.append({
                'id': file_id,
                'name': os.path.basename(obj.object_name),
                'url': url,
                'size': obj.size,
                'last_modified': obj.last_modified.isoformat()
            })
            
        return documents
    except S3Error as err:
        raise HTTPException(status_code=500, detail=f"MinIO error: {str(err)}")
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Server error: {str(err)}")
