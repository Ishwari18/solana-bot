const { chromium } = require('playwright');
const axios = require('axios');
const fs = require('fs');
const path = require('path'); 

// ScraperAPI Key (Replace with your actual API key from ScraperAPI)
const SCRAPER_API_KEY = '9920c43e476fe4b8023f191acabdd29c';
const URL = 'https://dexscreener.com/new-pairs/solana?maxAge=0.25&minLiq=1000&order=desc&rankBy=trendingScoreH24'

async function scrapeDexScreener() {
  // Get the URL with the proxy from ScraperAPI
  const scraperApiUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(URL)}`;

  // Use Playwright to launch the browser
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Navigate to the page through ScraperAPI's proxy (the page URL is passed through ScraperAPI)
  await page.goto(scraperApiUrl, { waitUntil: 'networkidle' });

  // Wait for the table to load
  await page.waitForSelector('.ds-dex-table', { timeout: 60000 });

  // Extract the token pairs information
  const data = await page.$$eval("a.ds-dex-table-row", rows =>
    rows.map(row => {
      const nameElement = row.querySelector(".ds-dex-table-row-base-token-symbol");
      const quoteElement = row.querySelector(".ds-dex-table-row-quote-token-symbol");
      const priceElement = row.querySelector(".ds-table-data-cell.ds-dex-table-row-col-price");
      const ageElement = row.querySelector(".ds-table-data-cell.ds-dex-table-row-col-pair-age span");
      const buysElement = row.querySelector(".ds-table-data-cell.ds-dex-table-row-col-buys");
      const sellsElement = row.querySelector(".ds-table-data-cell.ds-dex-table-row-col-sells");
      const volumeElement = row.querySelector(".ds-table-data-cell.ds-dex-table-row-col-volume");
      const liquidityElement = row.querySelector(".ds-table-data-cell.ds-dex-table-row-col-liquidity");
      const marketCapElement = row.querySelector(".ds-table-data-cell.ds-dex-table-row-col-market-cap");
      const makersElement = row.querySelector(".ds-table-data-cell.ds-dex-table-row-col-makers"); // Add this line

      return {
        name: nameElement?.innerText || "N/A",
        quote: quoteElement?.innerText || "N/A",
        price: priceElement?.innerText || "N/A",
        age: ageElement?.innerText || "N/A",
        buys: buysElement?.innerText || "N/A",
        sells: sellsElement?.innerText || "N/A",
        volume: volumeElement?.innerText || "N/A",
        liquidity: liquidityElement?.innerText || "N/A",
        marketCap: marketCapElement?.innerText || "N/A",
        makers: makersElement?.innerText || "N/A", 
        link: row.getAttribute("href") || "N/A"
      };
    })
  );

  const dataFolder = path.join(__dirname, 'data');
  if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder);
  }
  const filteredData = data.filter(tokenPair => {
    const makersCount = parseInt(tokenPair.makers.replace(/\D/g, ""), 10); // Parse makers as integer
    return makersCount > 120;
  });


  // Define the file path
  const filePath = path.join(dataFolder, 'tokenPairs.json');
  // Write the extracted data to the file
  fs.writeFileSync(filePath, JSON.stringify(filteredData, null, 2));
  // Print the extracted data
  console.log(data);

  // Close the browser
  await browser.close();
}

scrapeDexScreener();
