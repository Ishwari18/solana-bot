import { chromium } from 'playwright';
import axios from 'axios';
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
  liquidity: string;
  marketCap: string;
  makers: string;
  link: string;
}

export async function scrapeDexScreener(): Promise<void> {
  const scraperApiUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(URL)}`;

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(scraperApiUrl, { waitUntil: 'networkidle' });

  await page.waitForSelector('.ds-dex-table', { timeout: 60000 });

  const data: TokenPair[] = await page.$$eval("a.ds-dex-table-row", (rows) =>
    rows.map((row) => {
      const nameElement = row.querySelector<HTMLElement>(".ds-dex-table-row-base-token-symbol");
      const quoteElement = row.querySelector<HTMLElement>(".ds-dex-table-row-quote-token-symbol");
      const priceElement = row.querySelector<HTMLElement>(".ds-table-data-cell.ds-dex-table-row-col-price");
      const ageElement = row.querySelector<HTMLElement>(".ds-table-data-cell.ds-dex-table-row-col-pair-age span");
      const buysElement = row.querySelector<HTMLElement>(".ds-table-data-cell.ds-dex-table-row-col-buys");
      const sellsElement = row.querySelector<HTMLElement>(".ds-table-data-cell.ds-dex-table-row-col-sells");
      const volumeElement = row.querySelector<HTMLElement>(".ds-table-data-cell.ds-dex-table-row-col-volume");
      const liquidityElement = row.querySelector<HTMLElement>(".ds-table-data-cell.ds-dex-table-row-col-liquidity");
      const marketCapElement = row.querySelector<HTMLElement>(".ds-table-data-cell.ds-dex-table-row-col-market-cap");
      const makersElement = row.querySelector<HTMLElement>(".ds-table-data-cell.ds-dex-table-row-col-makers");

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
        link: row.getAttribute("href") || "N/A",
      };
    })
  );

  const dataFolder = path.join(__dirname, 'data');
  if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder);
  }

  const filteredData = data.filter((tokenPair) => {
    const makersCount = parseInt(tokenPair.makers.replace(/\D/g, ""), 10);
    return makersCount > 120;
  });

  const filePath = path.join(dataFolder, 'tokenPairs.json');
  fs.writeFileSync(filePath, JSON.stringify(filteredData, null, 2));

  console.log(data);

  await browser.close();
}

scrapeDexScreener().catch((error) => {
  console.error("Error occurred:", error);
});

