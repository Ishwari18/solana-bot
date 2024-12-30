import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCRAPER_API_KEY = '9920c43e476fe4b8023f191acabdd29c';
const URL = 'https://dexscreener.com/new-pairs/solana?maxAge=0.25&minLiq=1000&order=desc&rankBy=trendingScoreH24';
const MIN_LIQUIDITY = 2000; // Minimum liquidity threshold

interface TokenPair {
  name: string;
  quote: string;
  initialprice: string;
  highestPrice: string;
  currentPrice: string;
  age: string;
  buys: string;
  sells: string;
  volume: string;
  liquidity: number;
  initialLiquidity: number;
  marketCap: string;
  makers: number;
  link: string;
}

const dataFolder = path.join(__dirname, 'data');
const filePath = path.join(dataFolder, 'tokenPairs.json');
const MAX_TOKENS = 25;

export async function scrapeDexScreener(): Promise<void> {
  // Check if 25 tokens are already saved
  if (fs.existsSync(filePath)) {
    const existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as TokenPair[];
    if (existingData.length >= MAX_TOKENS) {
      console.log(`Scraping stopped: Already saved ${MAX_TOKENS} tokens.`);
      return;
    }
  }

  const scraperApiUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(URL)}`;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(scraperApiUrl, { waitUntil: 'networkidle' });
  await page.waitForSelector('.ds-dex-table', { timeout: 60000 });

  const scrapedData: TokenPair[] = await page.$$eval('a.ds-dex-table-row', (rows) =>
    rows.map((row) => {
      const priceText = row.querySelector<HTMLElement>('.ds-table-data-cell.ds-dex-table-row-col-price')?.innerText || 'N/A';
      const liquidityText = row.querySelector<HTMLElement>('.ds-table-data-cell.ds-dex-table-row-col-liquidity')?.innerText || '$0';
      const makersText = row.querySelector<HTMLElement>('.ds-table-data-cell.ds-dex-table-row-col-makers')?.innerText || '0';

      const liquidity = parseFloat(liquidityText.replace(/[^\d.K]/g, '').replace('K', '')) * 1000 || 0;
      const makers = parseInt(makersText.replace(/\D/g, ''), 10) || 0;

      return {
        name: row.querySelector<HTMLElement>('.ds-dex-table-row-base-token-symbol')?.innerText || 'N/A',
        quote: row.querySelector<HTMLElement>('.ds-dex-table-row-quote-token-symbol')?.innerText || 'N/A',
        initialprice: priceText,
        highestPrice: priceText,
        currentPrice: priceText,
        age: row.querySelector<HTMLElement>('.ds-table-data-cell.ds-dex-table-row-col-pair-age span')?.innerText || 'N/A',
        buys: row.querySelector<HTMLElement>('.ds-table-data-cell.ds-dex-table-row-col-buys')?.innerText || 'N/A',
        sells: row.querySelector<HTMLElement>('.ds-table-data-cell.ds-dex-table-row-col-sells')?.innerText || 'N/A',
        volume: row.querySelector<HTMLElement>('.ds-table-data-cell.ds-dex-table-row-col-volume')?.innerText || 'N/A',
        liquidity,
        initialLiquidity: liquidity,
        marketCap: row.querySelector<HTMLElement>('.ds-table-data-cell.ds-dex-table-row-col-market-cap')?.innerText || 'N/A',
        makers,
        link: row.getAttribute('href') || 'N/A',
      };
    })
  );

  if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder);
  }

  let existingData: TokenPair[] = [];
  if (fs.existsSync(filePath)) {
    existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as TokenPair[];
  }

  for (const newToken of scrapedData) {
    if (newToken.liquidity < MIN_LIQUIDITY) {
      console.log(`Skipping token ${newToken.name} with liquidity $${newToken.liquidity}`);
      continue;
    }

    if (existingData.length >= MAX_TOKENS) {
      console.log(`Scraping stopped: Reached ${MAX_TOKENS} tokens.`);
      break;
    }

    const existingToken = existingData.find((token) => token.name === newToken.name);

    if (existingToken) {
      const newPrice = parseFloat(newToken.currentPrice.replace('$', ''));
      const highestPrice = parseFloat(existingToken.highestPrice.replace('$', ''));

      // Update current price
      existingToken.currentPrice = newToken.currentPrice;

      // Update highest price if needed
      if (newPrice > highestPrice) {
        existingToken.highestPrice = newToken.currentPrice;
      }
    } else {
      // Add new token to existing data
      existingData.push(newToken);
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
  console.log('Scraping completed. Data saved to tokenPairs.json.');
  await browser.close();
}

scrapeDexScreener().catch((error) => {
  console.error('Error occurred:', error);
});
