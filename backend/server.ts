//express server
import express from "express";
import * as apiPackage from "./apiPackage";
const port = 3000;
const app = express();

//start the express server
app.listen(port, () => {
    console.log(`server started at http://localhost:${port}`);
});

app.get('/', (req, res) => {
    res.send('The sedulous hyena ate the antelope!');
});

app.post('/packages', async (req, res) => {
    try {
        await apiPackage.getPackageMetaData(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});  