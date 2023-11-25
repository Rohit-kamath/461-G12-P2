import React, { useState, ChangeEvent, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<string[] | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    setSelectedFiles(files || null);
  };

  const uploadZipFile = async (file: File) => {
    const formData = new FormData();
    formData.append('zipFile', file);

    try {
      setUploadStatus(`Uploading ${file.name}...`);

      const response = await axios.post('http://localhost:5000/package', formData, {
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

  const handleSearchTermChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const searchPackages = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/search?term=${searchTerm}`);
      setSearchResults(response.data);
    } catch (error: any) {
      console.error(`Error searching for packages: ${error.message}`);
    }
  };

  useEffect(() => {
    if (searchTerm.trim() !== '') {
      searchPackages();
    } else {
      setSearchResults(null);
    }
  }, [searchTerm]);

  return (
    <div>
      <h1>Zip File Uploader</h1>
      <input type="file" accept=".zip" multiple onChange={handleFileChange} />
      <button onClick={uploadZipFiles}>Upload Zip Files</button>

      {uploadStatus && <p>{uploadStatus}</p>}

      <div>
        <h2>Search Packages</h2>
        <input type="text" placeholder="Enter package name" value={searchTerm} onChange={handleSearchTermChange} />
        <button onClick={searchPackages}>Search</button>

        {searchResults && (
          <div>
            <h3>Search Results</h3>
            <ul>
              {searchResults.map((result, index) => (
                <li key={index}>{result}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
