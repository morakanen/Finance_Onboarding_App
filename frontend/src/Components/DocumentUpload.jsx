import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileUploader } from "@/components/ui/file-uploader";

export function DocumentUpload({ applicationId, onUploadComplete }) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleFileUpload = async (files) => {
    setUploading(true);
    setError(null);
    
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('applicationId', applicationId);

        const xhr = new XMLHttpRequest();
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            setUploadProgress(progress);
          }
        };

        const response = await new Promise((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve({
                ok: true,
                json: () => JSON.parse(xhr.responseText)
              });
            } else {
              reject(new Error(`HTTP Error: ${xhr.status}`));
            }
          };
          xhr.onerror = () => reject(new Error('Network Error'));
          
          xhr.open('POST', 'http://localhost:8000/api/upload-document');
          xhr.send(formData);
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        setUploadedFiles(prev => [...prev, {
          name: file.name,
          url: data.url,
          id: data.id
        }]);

        if (onUploadComplete) {
          onUploadComplete(data);
        }
      } catch (err) {
        setError(err.message || 'Failed to upload document');
      }
    }
    
    setUploading(false);
    setUploadProgress(0);
  };

  const removeFile = async (fileId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/delete-document/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    } catch (err) {
      setError(err.message || 'Failed to delete document');
    }
  };

  return (
    <div className="space-y-4">
      <FileUploader
        onFilesSelected={handleFileUpload}
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        multiple
        disabled={uploading}
      />

      {uploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} />
          <p className="text-sm text-muted-foreground">
            Uploading... {Math.round(uploadProgress)}%
          </p>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Uploaded Documents</h4>
          <ul className="space-y-2">
            {uploadedFiles.map((file) => (
              <li key={file.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                <span className="text-sm">{file.name}</span>
                <div className="space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(file.url, '_blank')}
                  >
                    View
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
