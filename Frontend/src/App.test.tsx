// app.test.ts
import '@testing-library/jest-dom/extend-expect';
import '@testing-library/jest-dom/jest-globals';
import '@testing-library/jest-dom';
import App from './App';
const { WebDriver, Builder, By, until } = require('selenium-webdriver');
const { render, screen, fireEvent, waitFor } = require('@testing-library/react');
const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const path = require('path');

const mockAxios = new MockAdapter(axios);

beforeEach(() => {
  mockAxios.reset();
});

describe('App', () => {
  let driver: typeof WebDriver;

  beforeAll(async () => {
    // Set up the Selenium WebDriver
    driver = await new Builder().forBrowser('chrome').build();
  });

  afterAll(async () => {
    // Quit the WebDriver after all tests
    await driver.quit();
  });

  it('should upload a file and display upload status', async () => {
    // Mocking the file upload endpoint
    mockAxios.onPost('/package').reply(200, 'Upload successful');

    // Render the React component
    render(<App />);

    // Selecting a file for upload
    const fileInput = await driver.findElement(By.css('input[type="file"]'));
    await fileInput.sendKeys(path.resolve(__dirname, 'dummy.zip'));

    // Clicking the upload button
    const uploadButton = await driver.findElement(By.xpath('//button[text()="Upload Zip Files"]'));
    await uploadButton.click();

    // Asserting that the upload status message is displayed
    await waitFor(() => {
      expect(screen.getByText('Uploading dummy.zip...')).toBeInTheDocument();
    });

    // Asserting that the upload was successful
    await waitFor(() => {
      expect(screen.getByText('Upload successful for dummy.zip: Upload successful')).toBeInTheDocument();
    });
  });

  it('should perform package search and display search results', async () => {
    // Mocking the package search endpoint
    mockAxios.onGet('http://localhost:5000/search').reply(200, ['package1', 'package2']);

    // Render the React component
    render(<App />);

    // Entering a search term
    const searchTermInput = await driver.findElement(By.css('input[type="text"]'));
    await searchTermInput.sendKeys('test');

    // Clicking the search button
    const searchButton = await driver.findElement(By.xpath('//button[text()="Search"]'));
    await searchButton.click();

    // Asserting that search results are displayed
    await waitFor(() => {
      expect(screen.getByText('package1')).toBeInTheDocument();
      expect(screen.getByText('package2')).toBeInTheDocument();
    });
  });
});
