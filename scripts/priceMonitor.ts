import fetch from 'node-fetch';
import { promises as fs } from 'fs';

// Store latest prices in memory
export let latestPrices: any[] = [];

// Function to fetch price details for a given pair
export async function fetchPairPrice(chainId: string, pairId: string): Promise<any> {
  const url = `https://api.dexscreener.com/latest/dex/pairs/${chainId}/${pairId}`;
  try {
    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) throw new Error(`API returned status ${response.status}`);
    const data = await response.json();
    const pair = data.pairs[0];
    if (pair) {
      return {
        pairAddress: pair.pairAddress,
        baseToken: `${pair.baseToken.name} (${pair.baseToken.symbol})`,
        quoteToken: `${pair.quoteToken.name} (${pair.quoteToken.symbol})`,
        priceUsd: pair.priceUsd,
        liquidityUsd: pair.liquidity.usd,
        fdv: pair.fdv,
      };
    }
  } catch (error) {
    console.error(`Error fetching price for pair ${pairId}:`, error);
    return null;
  }
}

// Function to fetch all prices from the JSON file
export async function fetchPricesFromJson() {
  try {
    const fileContent = await fs.readFile('./scripts/data/tokenPairs.json', 'utf-8');
    const tokenPairs = JSON.parse(fileContent);
    const prices = [];

    for (const pair of tokenPairs) {
      const segments = pair.link.split('/');
      const chainId = segments[1];
      const pairId = segments[2];
      if (chainId && pairId) {
        const priceData = await fetchPairPrice(chainId, pairId);
        if (priceData) prices.push(priceData);
      }
    }

    latestPrices = prices;
  } catch (error) {
    console.error('Error reading tokenPairs.json:', error);
  }
}
