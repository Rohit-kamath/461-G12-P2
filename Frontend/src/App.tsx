import { useState, ChangeEvent, useEffect, useRef } from 'react';
import axios from 'axios';
const headers = {"x-authorization": "0"};

function App() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadStatus, setUploadStatus] = useState<string | null>(null);
    const [searchResults, setSearchResults] = useState<string[] | null>(null);
    const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
    const [uploadURL, setUploadURL] = useState<string>('');
    const [searchType, setSearchType] = useState('name');
    const [searchInput, setSearchInput] = useState('');

    // Package Directory
    const [isPackageDirectoryOpen, setIsPackageDirectoryOpen] = useState<boolean>(false);
    const [packageName, setPackageName] = useState<string>('');
    const [packageVersion, setPackageVersion] = useState<string>('');
    const [packageDirectory, setPackageDirectory] = useState<string | null>(null);

    // Update Fields
    const [updateFields, setUpdateFields] = useState<{ content: string | null, url: string | null }>({ content: '', url: '' });

    // Package Rating
    const [packageRating, setPackageRating] = useState<number | null>(null);

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
    const submitPackageInfo = async () => {
        // Validate package version consists of only numbers
        if (!/^(\d+(\.\d+)*)?$/.test(packageVersion)) {
            alert('Error: Version must contain only numbers.');
            return;
        }
        setPackageDirectory(`/${packageName}/${packageVersion}`);
        const response = await axios.get(`/package/byName/${packageName}`, {headers});
        if (response.status === 200) {
            console.log('Success')
            return;
        }
        else if (response.status === 404) {
            axios.post('/package', { name: packageName, version: packageVersion }, {headers});
        }
        else {
            alert('Error: Package does not exist.');
        }
    };

    // Package Reset
    const resetPackageRegistry = async () => {
        const confirmReset = window.confirm('Are you sure you want to reset the package registry?');
        if (confirmReset) {
            await axios.delete('/reset', {headers});
            console.log('Package registry reset successfully.');
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files ? e.target.files[0] : null;
        setSelectedFile(file);
        setUploadURL('');
    };

    const uploadZipFile = async () => {
        if (selectedFile) {
            const reader = new FileReader();
            reader.readAsDataURL(selectedFile);
            reader.onload = async () => {
                const base64Content = reader.result?.toString().split(',')[1];
                if (base64Content) {
                    try {
                        setUploadStatus(`Uploading ${selectedFile.name}...`);

                        const response = await axios.post('/package', { Content: base64Content }, {
                            headers: {
                                'Content-Type': 'application/json',
                                "x-authorization": "0"
                            },
                        });

                        const metadata = response.data.metadata;
                        const metadataMessage = `Name: ${metadata.Name}, Version: ${metadata.Version}, ID: ${metadata.ID}`;
                        setUploadStatus(`Upload successful for ${selectedFile.name}: ${metadataMessage}`);
                    } catch (error: any) {
                        setUploadStatus(`Error uploading ${selectedFile.name}: ${error.response?.data.message || error.message}`);
                    }
                }
            };

            reader.onerror = () => {
                setUploadStatus(`Error reading ${selectedFile.name}`);
            };
        } else {
            setUploadStatus('No file selected');
        }
    };

    const uploadURLPackage = async () => {
        if (!uploadURL) {
            alert('Please enter a URL');
            return;
        }

        setUploadStatus('Uploading package from URL...');

        try {
            const response = await axios.post('/package', { URL: uploadURL }, {headers});
            const metadata = response.data.metadata;
            const metadataMessage = `Name: ${metadata.Name}, Version: ${metadata.Version}, ID: ${metadata.ID}`;
            setUploadStatus(`Upload successful: ${metadataMessage}`);
            setUploadURL(''); // Reset the URL input
        } catch (error: any) {
            setUploadStatus(`Error uploading package: ${error.response?.data.message || error.message}`);
        }
    };

    const handleUpload = () => {
        if (selectedFile) {
            uploadZipFile();
        } else if (uploadURL) {
            uploadURLPackage();
        } else {
            setUploadStatus('No file or URL selected');
        }
    };

    const handleURLChange = (e: ChangeEvent<HTMLInputElement>) => {
        setUploadURL(e.target.value);
        setSelectedFile(null);
    };

    const searchPackages = async () => {
        try {
            let response;
            if (searchType === 'name') {
                response = await axios.get(`/package/byName/${searchInput}`, {headers});
            } else if (searchType === 'regex') {
                response = await axios.post('/package/byRegEx', { RegEx: searchInput }, {headers});
            } else {
                setSearchResults(null);
                return;
            }

            setSearchResults(response.data);
            setSelectedPackage(null); // Reset selected package when a new search is performed
        } catch (error: any) {
            console.error(`Error searching for packages: ${error.message}`);
        }
    };

    const handleSearchTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setSearchType(e.target.value);
    };

    const handleSearchInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchInput(e.target.value);
    };

    const handlePackageClick = (packageName: string) => {
        setSelectedPackage(packageName);
    };

    const downloadPackage = async () => {
        if (selectedPackage) {
            try {
                const response = await axios.get(`/package/${selectedPackage}`, {headers});
                const base64Content = response.data;
                // Convert base64 to binary
                const binaryContent = atob(base64Content);
                // Create a Uint8Array from the binary data
                const uint8Array = new Uint8Array(binaryContent.length);
                for (let i = 0; i < binaryContent.length; i++) {
                    uint8Array[i] = binaryContent.charCodeAt(i);
                }
                // Create a blob from the Uint8Array
                const blob = new Blob([uint8Array], { type: 'application/zip' });
                // Create a link element and simulate a click to trigger the download
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link.download = `${selectedPackage}.zip`; // Set the desired file name
                link.click();
            } catch (error: any) {
                console.error(`Error downloading package: ${error.message}`);
            }
        }
    };

    const handleUpdateClick = () => {
        const content = prompt('Enter new content:');
        const url = prompt('Or enter update url:');

        if ((content || url) && !(content && url)) {
            setUpdateFields({ content, url });
            if (url) {
                axios.put(`/package/${selectedPackage}`, { url }, {headers});
            }
            else {
                axios.put(`/package/${selectedPackage}`, { content }, {headers});
            }
        }
        else {
            alert('Please enter either content or url, not both');
        }
    };

    // Rating functionality
    const handleRatingClick = async () => {
        const packageId = prompt('Enter package ID:');

        if (packageId) {
            const response = await axios.get(`/package/${packageId}/rate`, {headers});

            if ((response).status === 200) {
                const ratings = response.data;
                setPackageRating(ratings);
                console.log('Package ratings:', ratings);
            }
            else if ((response).status === 404) {
                alert('Error: Package does not exist.');
            }
            else {
                alert('Error: Request did not fail as expected.');
            }
        }
    };

    return (
        <div className="container">
            <h1>Package Registry</h1>
            <div className="upload-section">
                <h2>Upload Package</h2>
                <div className="file-upload">
                    <label htmlFor="fileInput">Select a Zip File:</label>
                    <input
                        id="fileInput"
                        type="file"
                        accept=".zip"
                        onChange={handleFileChange}
                    />
                    <span>OR</span>
                    <label htmlFor="urlInput" className="url-label">Enter Package URL:</label>
                    <input
                        id="urlInput"
                        type="text"
                        placeholder="NPM or GitHub URL"
                        value={uploadURL}
                        onChange={handleURLChange}
                    />
                </div>
                <button type="button" onClick={handleUpload}>
                    Upload
                </button>
                {uploadStatus && <p className="upload-status">{uploadStatus}</p>}
            </div>

            <div className="search-packages">
                <h2>Search Packages</h2>
                <select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
                    <option value="name">By Name</option>
                    <option value="regex">By Regex</option>
                </select>
                <input
                    type="text"
                    id="searchInput"
                    placeholder={`Search by ${searchType}`}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                />
                <button type="button" onClick={searchPackages} disabled={!searchInput}>
                    Search
                </button>
                {/* Download Package Section */}
                <div className="download-package">
                    <h2>Download Package</h2>
                    <button type="button" onClick={downloadPackage} disabled={!selectedPackage}>
                        Download
                    </button>
                </div>

                {/* Update Section */}
                <div className="update-package">
                    <h2>Update Package</h2>
                    <button type="button" onClick={handleUpdateClick} disabled={!selectedPackage}>
                        Update
                    </button>
                </div>

                {/* Ratings Section */}
                <div className="check-ratings">
                    <h2>Check Ratings</h2>
                    <button type="button" onClick={handleRatingClick}>
                        Check Ratings
                    </button>
                    {packageRating !== null && (
                        <div className="package-rating">
                            <h3>Package Ratings</h3>
                            <p>
                                Ratings for {selectedPackage || 'selected package'}: {packageRating}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="package-directory">
                <h2>Package Directory</h2>
                <button type="button" onClick={openPackageDirectory}>
                    Open Package Directory
                </button>

                {isPackageDirectoryOpen && (
                    <div className="package-info">
                        <h3>Enter Package Information</h3>
                        <label htmlFor="packageName">Name:</label>
                        <input
                            type="text"
                            id="packageName"
                            value={packageName}
                            onChange={(e) => setPackageName(e.target.value)}
                        />

                        <label htmlFor="packageVersion">Version:</label>
                        <input
                            type="text"
                            id="packageVersion"
                            value={packageVersion}
                            onChange={(e) => setPackageVersion(e.target.value)}
                        />
                        <button type="button" onClick={submitPackageInfo}>
                            Submit
                        </button>
                        <button type="button" onClick={closePackageDirectory}>
                            Cancel
                        </button>

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
                <button type="button" onClick={resetPackageRegistry}>
                    Reset Package Registry
                </button>
            </div>
        </div>
    );
}

export default App;
