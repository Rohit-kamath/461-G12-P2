import { useState, ChangeEvent } from 'react';
import axios from 'axios';

function App() {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    setSelectedFiles(files || null);
  };

  const uploadZipFile = async (file: File) => {
    const formData = new FormData();
    formData.append('packageContent', file);

    try {
      setUploadStatus(`Uploading ${file.name}...`);

      const response = await axios.post('/package', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadStatus(`Upload successful for ${file.name}: ${response.data}`);
    } catch (error: any) {
      setUploadStatus(`Error uploading ${file.name}: ${error.message}`);
    }
  };

  const uploadZipFiles = () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      setUploadStatus('No files selected');
      return;
    }

    // Iterate over each file and upload individually
    for (let i = 0; i < selectedFiles.length; i++) {
      uploadZipFile(selectedFiles[i]);
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
