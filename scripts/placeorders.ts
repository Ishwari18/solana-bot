import { chromium } from 'playwright';
import path from 'path';

const URL = 'https://dexscreener.com/your-pair-url'; // Replace with actual pair URL

async function placeBuyOrder(page: any) {
  // Wait for the "Buy" button to appear
  const buyButtonSelector = 'button.chakra-button.custom-1qqbu53';
  await page.waitForSelector(buyButtonSelector, { timeout: 60000 });

  // Click the "Buy" button
  await page.click(buyButtonSelector);
  console.log('Buy order placed!');
}

async function placeSellOrder(page: any) {
  // Wait for the "Sell" button to appear (replace with the actual selector if different)
  const sellButtonSelector = 'button.chakra-button.custom-1qqbu53'; // Assuming "Sell" button has a similar class
  await page.waitForSelector(sellButtonSelector, { timeout: 60000 });

  // Click the "Sell" button
  await page.click(sellButtonSelector);
  console.log('Sell order placed!');
}

async function automateTrading() {
  const browser = await chromium.launch({ headless: false }); // Set headless: false to see the browser window
  const page = await browser.newPage();
  
  try {
    // Go to the pair URL
    await page.goto(URL, { waitUntil: 'networkidle' });

    // Wait for page to load
    await page.waitForSelector('.your-pair-selector', { timeout: 60000 }); // Adjust this based on your page's content

    // Place a Buy order
    await placeBuyOrder(page);

    // Place a Sell order (you can adjust the timing between actions if needed)
    await page.waitForTimeout(5000); // Wait for 5 seconds before placing the sell order (for demonstration purposes)
    await placeSellOrder(page);
  } catch (error) {
    console.error('Error in trading automation:', error);
  } finally {
    await browser.close();
  }
}

automateTrading().catch((error) => {
  console.error('Error in automation:', error);
});
