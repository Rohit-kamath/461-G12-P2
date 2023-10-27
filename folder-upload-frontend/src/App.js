import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

function FolderUpload() {
  const [uploadedZip, setUploadedZip] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);

  const onDrop = (acceptedFiles) => {
    const zipFile = acceptedFiles[0];
    setUploadedZip(zipFile);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const uploadAndExtractZip = async () => {
    const formData = new FormData();
    formData.append('zipFile', uploadedZip);

    try {
      // Set the status to "Uploading..." while the request is in progress
      setUploadStatus('Uploading...');

      const response = await axios.post('UPLOAD_ENDPOINT', formData);

      // Set the status to the server's response
      setUploadStatus('Server Response: ' + response.data);
    } catch (error) {
      // Set the status to the error message
      setUploadStatus('Error: ' + error.message);
    }
  };

  return (
    <div>
      <div {...getRootProps()} className="dropzone">
        <input {...getInputProps()} />
        <h1>Zip File Uploader</h1>
        <button>Upload a Zip File (Folder)</button>
      </div>
      {uploadedZip && (
        <div>
          <button onClick={uploadAndExtractZip}>Upload and Extract Zip</button>
          {uploadStatus && <p>{uploadStatus}</p>}
        </div>
      )}
    </div>
  );
}

export default FolderUpload;