import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCRAPER_API_KEY = '9920c43e476fe4b8023f191acabdd29c';
const URL = 'https://dexscreener.com/new-pairs/solana?maxAge=0.25&minLiq=1000&order=desc&rankBy=trendingScoreH24';

interface TokenPair {
  name: string;
  quote: string;
  price: string;
  age: string;
  buys: string;
  sells: string;
  volume: string;
  liquidity: number;
  marketCap: string;
  makers: number;
  link: string;
}

export async function scrapeDexScreener(): Promise<void> {
  const scraperApiUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(URL)}`;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(scraperApiUrl, { waitUntil: 'networkidle' });
  await page.waitForSelector('.ds-dex-table', { timeout: 60000 });

  const scrapedData: TokenPair[] = await page.$$eval('a.ds-dex-table-row', (rows) =>
    rows.map((row) => {
      const liquidityText = row.querySelector<HTMLElement>('.ds-table-data-cell.ds-dex-table-row-col-liquidity')?.innerText || '$0';
      const makersText = row.querySelector<HTMLElement>('.ds-table-data-cell.ds-dex-table-row-col-makers')?.innerText || '0';

      // Convert liquidity value
      const liquidity = (() => {
        const cleaned = liquidityText.replace(/[^\d.K]/g, ''); // Keep only digits, decimals, and 'K'
        if (cleaned.includes('K')) {
          return parseFloat(cleaned.replace('K', '')) * 1000; // Remove 'K' and multiply by 1000
        }
        return parseFloat(cleaned) || 0; // Parse as float if no 'K'
      })();

      // Log the raw and converted liquidity values
      console.log(`Raw Liquidity: ${liquidityText}, Converted Liquidity: ${liquidity}`);

      const makers = parseInt(makersText.replace(/\D/g, ''), 10) || 0;

      return {
        name: row.querySelector<HTMLElement>('.ds-dex-table-row-base-token-symbol')?.innerText || 'N/A',
        quote: row.querySelector<HTMLElement>('.ds-dex-table-row-quote-token-symbol')?.innerText || 'N/A',
        price: row.querySelector<HTMLElement>('.ds-table-data-cell.ds-dex-table-row-col-price')?.innerText || 'N/A',
        age: row.querySelector<HTMLElement>('.ds-table-data-cell.ds-dex-table-row-col-pair-age span')?.innerText || 'N/A',
        buys: row.querySelector<HTMLElement>('.ds-table-data-cell.ds-dex-table-row-col-buys')?.innerText || 'N/A',
        sells: row.querySelector<HTMLElement>('.ds-table-data-cell.ds-dex-table-row-col-sells')?.innerText || 'N/A',
        volume: row.querySelector<HTMLElement>('.ds-table-data-cell.ds-dex-table-row-col-volume')?.innerText || 'N/A',
        liquidity,
        marketCap: row.querySelector<HTMLElement>('.ds-table-data-cell.ds-dex-table-row-col-market-cap')?.innerText || 'N/A',
        makers,
        link: row.getAttribute('href') || 'N/A',
      };
    })
  );

  // Filter for tokens with liquidity > 2000
  const filteredData = scrapedData.filter((token) => token.liquidity > 2000);
  console.log(`Filtered ${filteredData.length} tokens with liquidity > 2000.`);

  const dataFolder = path.join(__dirname, 'data');
  const filePath = path.join(dataFolder, 'tokenPairs.json');

  if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder);
  }

  let existingData: TokenPair[] = [];
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    existingData = JSON.parse(fileContent) as TokenPair[];
  }

  // Append new filtered data to the existing file
  const updatedData = [...existingData, ...filteredData];
  fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));

  console.log('Scraping completed. Data saved to tokenPairs.json.');
  await browser.close();
}

scrapeDexScreener().catch((error) => {
  console.error('Error occurred:', error);
});
