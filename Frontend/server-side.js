const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');
const archiver = require('archiver');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname));

app.post('/upload', (req, res) => {
  if (!req.files || !req.files.folder) {
    return res.status(400).send('No folder selected for upload.');
  }

  const folderPath = req.files.folder.path;
  const zipFileName = 'uploaded_folder.zip';

  const output = fs.createWriteStream(zipFileName);
  const archive = archiver('zip', {
    zlib: { level: 9 }, // Set compression level
  });

  output.on('close', () => {
    res.download(zipFileName, () => {
      // Cleanup temporary files after the download is complete
      fs.unlinkSync(folderPath);
      fs.unlinkSync(zipFileName);
    });
  });

  archive.on('error', (err) => {
    res.status(500).send('Error zipping the folder.');
  });

  archive.pipe(output);
  archive.directory(folderPath, false);
  archive.finalize();
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});