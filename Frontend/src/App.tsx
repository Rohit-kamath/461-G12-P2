import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFile(file || null);
  };

  const uploadZipFile = async () => {
    if (!selectedFile) {
      setUploadStatus('No file selected');
      return;
    }

    const formData = new FormData();
    formData.append('zipFile', selectedFile);

    try {
      setUploadStatus('Uploading...');

      const response = await axios.post(import.meta.env.VITE_API_ENDPOINT, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadStatus('Upload successful: ' + response.data);
    } catch (error: any) {
      setUploadStatus('Error: ' + (error as Error).message);
    }
  };

  return (
    <div>
      <h1>Zip File Uploader</h1>
      <input type="file" accept=".zip" onChange={handleFileChange} />
      <button onClick={uploadZipFile}>Upload Zip File</button>

      {uploadStatus && <p>{uploadStatus}</p>}
    </div>
  );
}

export default App;
