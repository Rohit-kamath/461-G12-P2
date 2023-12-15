import { useState, ChangeEvent, useEffect, useRef } from 'react';
import axios from 'axios';
const headers = {"x-authorization": "0"};

interface PackageQueryResult {
    Name: string;
    Version: string;
    ID: string;
}

function App() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadStatus, setUploadStatus] = useState<string | null>(null);
    const [searchResults, setSearchResults] = useState<Array<any>>([]);
    const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
    const [uploadURL, setUploadURL] = useState<string>('');
    const [searchType, setSearchType] = useState('name');
    const [searchInput, setSearchInput] = useState('');
    const [packageId, setPackageId] = useState<string>('');
    const [downloadPackageId, setDownloadPackageId] = useState('');
    const [downloadedPackageMetadata, setDownloadedPackageMetadata] = useState(null);
    const [deleteType, setDeleteType] = useState('id'); // 'id' or 'name'
    const [deleteInput, setDeleteInput] = useState('');
    const [deleteMessage, setDeleteMessage] = useState('');



    // State for package queries
    const [packageNameQuery, setPackageNameQuery] = useState('');
    const [packageVersionQuery, setPackageVersionQuery] = useState('');
    const [packageQueryResults, setPackageQueryResults] = useState<PackageQueryResult[]>([]);

    // Update Fields
    const [updateFields, setUpdateFields] = useState<{ content: string | null, url: string | null }>({ content: '', url: '' });

    // Package Rating
    const [packageRating, setPackageRating] = useState<number | null>(null);

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
        if (!searchInput) {
            setSearchResults([]);
            return;
        }
    
        let response;
    
        if (searchType === 'regex') {
            try {
                new RegExp(searchInput);
            } catch (error) {
                alert('Invalid regular expression');
                setSearchResults([]);
                return;
            }
        }
    
        try {
            if (searchType === 'name') {
                response = await axios.get(`/package/byName/${searchInput}`, { headers });
            } else if (searchType === 'regex') {
                response = await axios.post('/package/byRegEx', { RegEx: searchInput }, { headers });
            }
    
            if (response && response.data) {
                setSearchResults(response.data);
            } else {
                setSearchResults([]);
            }
        } catch (error: any) {
            console.error(`Error searching for packages: ${error.message}`);
            setSearchResults([]); // Reset search results on error
        }
    };

    const fetchPackages = async () => {
        try {
            const response = await axios.post('/packages', [{ Name: packageNameQuery, Version: packageVersionQuery }], { headers });
            setPackageQueryResults(response.data);
        } catch (error) {
            alert('No packages found, failed to fetch packages');
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

    const handleDownloadPackageChange = (e: ChangeEvent<HTMLInputElement>) => {
        setDownloadPackageId(e.target.value);
    };

    const downloadPackage = async () => {
        if (!downloadPackageId) {
            alert('Please enter a package ID');
            return;
        }

        try {
            const response = await axios.get(`/package/${downloadPackageId}`, { headers });
            if (response.data && response.data.data && response.data.metadata) {
                const { Name, Version, ID } = response.data.metadata;
                const base64Content = response.data.data.Content;
                const binaryContent = atob(base64Content);
                const uint8Array = new Uint8Array(binaryContent.length);
                for (let i = 0; i < binaryContent.length; i++) {
                    uint8Array[i] = binaryContent.charCodeAt(i);
                }
                const blob = new Blob([uint8Array], { type: 'application/zip' });
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link.download = `${Name}-${Version}-${ID}.zip`;
                link.click();

                // Optional: Display download confirmation
                alert(`Downloading ${Name} version ${Version}`);
            } else {
                alert('Package data not found');
            }
        } catch (error: any) {
            console.error(`Error downloading package: ${error.message}`);
            alert(`Error: ${error.response?.data.message || error.message}`);
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
    const handleDelete = async () => {
        try {
            let response;
            if (deleteType === 'id') {
                response = await axios.delete(`/package/${deleteInput}`, { headers });
            } else if (deleteType === 'name') {
                response = await axios.delete(`/package/byName/${deleteInput}`, { headers });
            }
    
            if (response.status === 200) {
                setDeleteMessage('Package deleted successfully');
            } else {
                setDeleteMessage('Failed to delete package');
            }
        } catch (error) {
            console.error('Error deleting package:', error);
            setDeleteMessage('Failed to delete package');
        }
    };

    // Rating functionality
    const handleRatingClick = async () => {
        if (!packageId) {
            alert('Please enter a package ID');
            return;
        }
        try {
            const response = await axios.get(`/package/${packageId}/rate`, { headers });
            setPackageRating(response.data);
        } catch (error: any) {
            console.error(`Error checking package ratings: ${error.message}`);
            alert(`Error: ${error.response?.data.message || error.message}`);
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
                    {searchResults.length > 0 && (
                        <div className="search-results">
                        <h3>Search Results:</h3>
                        <ul>
                            {searchResults.map((result, index) => (
                                <li key={index}>
                                    Name: {result.PackageMetadata?.Name || result.Name}, 
                                    Version: {result.PackageMetadata?.Version || result.Version}, 
                                    ID: {result.PackageMetadata?.ID || result.ID}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
                
                {/* Download Package Section */}
                <div className="download-package">
                    <h2>Download Package</h2>
                    <input
                        type="text"
                        placeholder="Enter Package ID"
                        value={downloadPackageId}
                        onChange={handleDownloadPackageChange}
                    />
                    <button
                        type="button"
                        onClick={downloadPackage}
                        disabled={!downloadPackageId}
                    >
                        Download
                    </button>

                    {downloadedPackageMetadata && (
                        <div className="downloaded-package-info">
                            <p>Name: {downloadedPackageMetadata.Name}</p>
                            <p>Version: {downloadedPackageMetadata.Version}</p>
                            <p>ID: {downloadedPackageMetadata.ID}</p>
                        </div>
                    )}
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
                        <label htmlFor="packageIdInput">Package ID:</label>
                        <input
                            id="packageIdInput"
                            type="text"
                            placeholder="Enter Package ID"
                            value={packageId}
                            onChange={(e) => setPackageId(e.target.value)}
                            />
                        <button type="button" onClick={handleRatingClick}>
                            Check Ratings
                        </button>
                        {packageRating !== null && (
                            <div className="package-rating">
                                <h3>Package Ratings:</h3>
                                <ul>
                                    {Object.entries(packageRating).map(([key, value]) => (
                                        <li key={key}>{key}: {value.toFixed(2)}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

            {/* Package Query Section */}
            <div className="package-query">
                <h2>Packages Directory</h2>
                <input
                    type="text"
                    placeholder="Package Name"
                    value={packageNameQuery}
                    onChange={(e) => setPackageNameQuery(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Package Version (optional)"
                    value={packageVersionQuery}
                    onChange={(e) => setPackageVersionQuery(e.target.value)}
                />
                <button onClick={fetchPackages}>Fetch Packages</button>

                {packageQueryResults.length > 0 && (
                    <div className="package-query-results">
                        <h3>Packages Results:</h3>
                        <ul>
                            {packageQueryResults.map((pkg, index) => (
                                <li key={index}>
                                    Name: {pkg.Name}, Version: {pkg.Version}, ID: {pkg.ID}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            
            {/* Package Deletion Section */}
            <div className="package-deletion">
                <h2>Delete Package</h2>
                <select value={deleteType} onChange={(e) => setDeleteType(e.target.value)}>
                    <option value="id">By ID</option>
                    <option value="name">By Name</option>
                </select>
                <input
                    type="text"
                    placeholder={deleteType === 'id' ? 'Enter Package ID' : 'Enter Package Name'}
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                />
                <button onClick={handleDelete}>Delete</button>
                {deleteMessage && <p className="delete-message">{deleteMessage}</p>}
            </div>
            
            {/* Package Reset Section */}
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
