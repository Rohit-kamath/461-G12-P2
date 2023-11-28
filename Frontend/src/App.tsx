import { useState, ChangeEvent, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<string[] | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

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

  const handleSearchTermChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const searchPackages = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/search?term=${searchTerm}`);
      setSearchResults(response.data);
      setSelectedPackage(null); // Reset selected package when a new search is performed
    } catch (error: any) {
      console.error(`Error searching for packages: ${error.message}`);
    }
  };

  const handlePackageClick = (packageName: string) => {
    setSelectedPackage(packageName);
  };

  const downloadPackage = async () => {
    if (selectedPackage) {
      try {
        // Perform the download logic using the selected package name
        // You may need to adjust the URL or API endpoint based on your backend implementation
        const response = await axios.get(`http://localhost:5000/download?package=${selectedPackage}`);
        
        // Add logic to handle the downloaded package, for example, trigger a download in the browser
        // You can use libraries like FileSaver.js for this purpose.
        // Example: FileSaver.saveAs(new Blob([response.data]), 'downloaded-package.zip');

      } catch (error: any) {
        console.error(`Error downloading package: ${error.message}`);
      }
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
                <li key={index} onClick={() => handlePackageClick(result)}>
                  {result}
                </li>
              ))}
            </ul>
            {selectedPackage && (
              <div>
                <h3>Selected Package: {selectedPackage}</h3>
                <button onClick={downloadPackage}>Download</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
