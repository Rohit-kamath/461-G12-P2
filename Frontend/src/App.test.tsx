import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import 'chromedriver'; // Make sure to install the chromedriver package as well

describe('App Selenium Test', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    // Set up the WebDriver (make sure to have ChromeDriver or another appropriate driver installed)
    driver = await new Builder().forBrowser('chrome').build();
  });

  afterAll(async () => {
    // Close the browser after the test
    if (driver) {
      await driver.quit();
    }
  });

  test('uploads zip files successfully', async () => {
    // Open the application in the browser
    await driver.get('http://localhost:5000'); // Update the URL if needed

    // Find the file input element and upload a file
    const fileInput = await driver.findElement(By.css('input[type="file"]'));
    await fileInput.sendKeys('path/to/test.zip'); // Provide the path to a test zip file

    // Click the "Upload Zip Files" button
    const uploadButton = await driver.findElement(By.css('button'));
    await uploadButton.click();

    // Wait for the upload status to appear
    const uploadStatus = await driver.findElement(By.css('p'));
    // You may want to use WebDriverWait to wait for the element to be visible or contain certain text

    // Perform assertions on the upload status
    // For example:
    expect(await uploadStatus.getText()).toContain('Upload successful');

    // Add more assertions as needed
  });
});
