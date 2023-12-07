import { useState, ChangeEvent, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<string[] | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

    // Package Directory
  const [isPackageDirectoryOpen, setIsPackageDirectoryOpen] = useState<boolean>(false);
  const [packageName, setPackageName] = useState<string>('');
  const [packageVersion, setPackageVersion] = useState<string>('');
  const [packageDirectory, setPackageDirectory] = useState<string | null>(null);
    // Open package directory
  const openPackageDirectory = () => {
    setIsPackageDirectoryOpen(true);
  };
    // Close package directory
  const closePackageDirectory = () => {
    setIsPackageDirectoryOpen(false);
    setPackageName('');
    setPackageVersion('');
    setPackageDirectory(null);
  };
    // Package Info
  const submitPackageInfo = () => {
    setPackageDirectory(`/${packageName}/${packageVersion}`);
  };
    // Package Reset
  const resetPackageRegistry = async() => {
    const confirmReset = window.confirm('Are you sure you want to reset the package registry?');
    if (confirmReset) {
      const response = await axios.delete('/reset');
      console.log('Package registry reset successfully.');
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    setSelectedFiles(files || null);
  };

  const uploadZipFile = async (file: File) => {
    const formData = new FormData();
  
    // Convert zip file to base64 encoding
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Content = reader.result?.toString().split(',')[1];
      if (base64Content) {
        formData.append('packageContent', base64Content);
  
        try {
          setUploadStatus(`Uploading ${file.name}...`);
  
          const response = await axios.post('/packages', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
  
          setUploadStatus(`Upload successful for ${file.name}: ${response.data}`);
        } catch (error: any) {
          setUploadStatus(`Error uploading ${file.name}: ${error.message}`);
        }
      }
    };
  
    reader.onerror = () => {
      setUploadStatus(`Error reading ${file.name}`);
    };
  };
  
  const uploadZipFiles = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      setUploadStatus('No files selected');
      return;
    }
  
    try {
      for (const file of selectedFiles) {
        await uploadZipFile(file);
      }
      setUploadStatus('All files uploaded successfully');
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  };
  
  

  const handleSearchTermChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const searchPackages = async () => {
    try {
      const response = await axios.get(`/package/byName/:${searchTerm}`);
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
        const response = await axios.get(`/package/:${selectedPackage}`);
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
    <div className="container">
      <h1>Zip File Uploader</h1>

      <div className="file-upload">
        <input type="file" accept=".zip" multiple onChange={handleFileChange} />
        <button onClick={uploadZipFiles}>Upload Zip Files</button>
        {uploadStatus && <p>{uploadStatus}</p>}
      </div>

      <div className="search-packages">
        <h2>Search Packages</h2>
        <input type="text" placeholder="Enter package name" value={searchTerm} onChange={handleSearchTermChange} />
        <button onClick={searchPackages}>Search</button>

        {searchResults && (
          <div className="search-results">
            <h3>Search Results</h3>
            <ul>
              {searchResults.map((result, index) => (
                <li key={index} onClick={() => handlePackageClick(result)}>
                  {result}
                </li>
              ))}
            </ul>

            {selectedPackage && (
              <div className="selected-package">
                <h3>Selected Package: {selectedPackage}</h3>
                <button onClick={downloadPackage}>Download</button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="package-directory">
        <h2>Package Directory</h2>
        <button onClick={openPackageDirectory}>Open Package Directory</button>

        {isPackageDirectoryOpen && (
          <div className="package-info">
            <h3>Enter Package Information</h3>
            <label>Name:</label>
            <input type="text" value={packageName} onChange={(e) => setPackageName(e.target.value)} />

            <label>Version:</label>
            <input type="text" value={packageVersion} onChange={(e) => setPackageVersion(e.target.value)} />

            <button onClick={submitPackageInfo}>Submit</button>
            <button onClick={closePackageDirectory}>Cancel</button>

            {packageDirectory && (
              <div className="directory-view">
                <h3>Package Directory View</h3>
                <p>Directory: {packageDirectory}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="package-reset">
        <h2>Package Reset</h2>
        <button onClick={resetPackageRegistry}>Reset Package Registry</button>
      </div>
    </div>
  );
}
export default App;