import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    setSelectedFiles(files || null);
  };

  const uploadZipFiles = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      setUploadStatus('No file selected');
      return;
    }

    const formData = new FormData();

    // Append each file to the formData
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append(`zipFiles[${i}]`, selectedFiles[i]);
    }

    try {
      setUploadStatus('Uploading...');

      const response = await axios.post('http://localhost:5000/package', formData, {
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
      <input type="file" accept=".zip" multiple onChange={handleFileChange} />
      <button onClick={uploadZipFiles}>Upload Zip Files</button>

      {uploadStatus && <p>{uploadStatus}</p>}
    </div>
  );
}

export default App;
