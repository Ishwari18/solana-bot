import axios from 'axios';
import fs from 'fs';
import path from 'path';

// ScraperAPI Key (replace with your actual API key from ScraperAPI)
const SCRAPER_API_KEY = '9920c43e476fe4b8023f191acabdd29c';

// Define the structure of a TokenPair
interface TokenPair {
  name: string;
  link: string;
  pairAddress?: string;
}

async function fetchPairAddresses(): Promise<void> {
  const dataFilePath = path.join(__dirname, 'data', 'tokenPairs.json');

  // Read the token pairs data from the JSON file
  let tokenPairs: TokenPair[] = [];
  try {
    const fileData = fs.readFileSync(dataFilePath, 'utf-8');
    tokenPairs = JSON.parse(fileData);
  } catch (error) {
    console.error('Error reading tokenPairs.json:', error);
    return;
  }

  for (const tokenPair of tokenPairs) {
    if (tokenPair.link && tokenPair.link !== 'N/A') {
      try {
        // Construct the ScraperAPI URL
        const scraperApiUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(
          `https://dexscreener.com${tokenPair.link}`
        )}`;

        // Fetch the token pair's page
        const response = await axios.get(scraperApiUrl, { timeout: 60000 });
        const html = response.data;

        // Extract the pair address using a regex
        const pairAddressMatch = html.match(/<span class="chakra-text custom-72rvq0".*?title="(.*?)">/);
        const pairAddress = pairAddressMatch ? pairAddressMatch[1] : 'N/A';

        // Update the token pair with the fetched address
        tokenPair.pairAddress = pairAddress;
        console.log(`Fetched pair address for ${tokenPair.name}: ${pairAddress}`);
      } catch (error) {
        console.error(`Failed to fetch pair address for ${tokenPair.name}:`, error);
        tokenPair.pairAddress = 'N/A';
      }
    } else {
      tokenPair.pairAddress = 'N/A';
    }
  }

  // Save the updated token pairs data back to the file
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(tokenPairs, null, 2));
    console.log('Updated token pairs data saved to tokenPairs.json');
  } catch (error) {
    console.error('Error saving updated tokenPairs.json:', error);
  }
}

fetchPairAddresses();
