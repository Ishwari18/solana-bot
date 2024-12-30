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

// Event Handlers
function triggerPriceEvent(pair: any, percentage: number) {
  console.log(
    `PRICE INCREASE EVENT: Pair ${pair.name} (${pair.baseToken}/${pair.quoteToken}) has increased by ${percentage}% from its initial price.`
  );
}

function triggerLowLiquidityEvent(pair: any, percentage: number) {
  console.log(
    `LOW LIQUIDITY EVENT: Pair ${pair.name} (${pair.baseToken}/${pair.quoteToken}) has decreased by ${percentage}% in liquidity from its initial liquidity.`
  );
}

function triggerPriceFallEvent(pair: any, percentage: number) {
  console.log(
    `PRICE FALL EVENT: Pair ${pair.name} (${pair.baseToken}/${pair.quoteToken}) has fallen by ${percentage}% from its highest price.`
  );
}

// Function to fetch and update prices in tokenPairs.json
export async function fetchPricesFromJson() {
  try {
    const filePath = './scripts/data/tokenPairs.json';
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const tokenPairs = JSON.parse(fileContent);
    const prices = [];
    const updatedTokenPairs = [];

    for (const pair of tokenPairs) {
      const segments = pair.link.split('/');
      const chainId = segments[1];
      const pairId = segments[2];

      if (chainId && pairId) {
        const priceData = await fetchPairPrice(chainId, pairId);
        if (priceData) {
          prices.push(priceData);

          // Update the token pair with new price and liquidity
          pair.currentPrice = parseFloat(priceData.priceUsd);  // Ensure this is a number
          pair.currentLiquidity = parseFloat(priceData.liquidityUsd);  // Ensure this is a number

          // Check for price increase events
          const initialPrice = parseFloat(pair.initialPrice || '0');  // Ensure this is a number
          if (initialPrice > 0) {
            const priceChange = ((pair.currentPrice - initialPrice) / initialPrice) * 100;

            if (priceChange >= 2 && priceChange < 5) {
              triggerPriceEvent(pair, 2);
            } else if (priceChange >= 5 && priceChange < 10) {
              triggerPriceEvent(pair, 5);
            } else if (priceChange >= 10) {
              triggerPriceEvent(pair, 10);
            }
          }

          // Check for low liquidity event
          const initialLiquidity = parseFloat(pair.initialLiquidity || '0');  // Ensure this is a number
          if (initialLiquidity > 0) {
            const liquidityChange = ((initialLiquidity - pair.currentLiquidity) / initialLiquidity) * 100;

            if (liquidityChange >= 10) {
              triggerLowLiquidityEvent(pair, liquidityChange);
              // Remove pair if liquidity has decreased by 10% or more
              continue; // Skip adding this pair to updatedTokenPairs
            }
          }

          // Check for price fall event
          const highestPrice = parseFloat(pair.highestPrice || '0');  // Ensure this is a number
          if (highestPrice > 0) {
            const priceDrop = ((highestPrice - pair.currentPrice) / highestPrice) * 100;

            if (priceDrop >= 10) {
              triggerPriceFallEvent(pair, priceDrop);
              // Remove pair if price has fallen by 10% or more
              continue; // Skip adding this pair to updatedTokenPairs
            }
          }

          // Retain the pair only if it does not meet the conditions for removal
          updatedTokenPairs.push(pair);
        }
      }
    }

    // Update the latest prices in memory
    latestPrices = prices;

    // Write the updated tokenPairs back to the JSON file
    await fs.writeFile(filePath, JSON.stringify(updatedTokenPairs, null, 2), 'utf-8');
    console.log('Prices updated successfully in tokenPairs.json');
  } catch (error) {
    console.error('Error reading or updating tokenPairs.json:', error);
  }
}
