import express from 'express';
import cors from 'cors';
import { fetchPricesFromJson, latestPrices } from './scripts/priceMonitor';
import { scrapeDexScreener } from './scripts/scraper'; // Import the scraper function

const app = express();
const port = 5000;

app.use(cors());

// Periodically fetch token prices
setInterval(fetchPricesFromJson, 3000); // Fetch prices every 5 seconds

// Periodically scrape tokens
// setInterval(() => {
//   scrapeDexScreener()
//     .then(() => console.log('Scraping completed successfully.'))
//     .catch((error) => console.error('Error during scraping:', error));
// }, 60000); // Run scraping every 1 minute

// API Endpoint to get the latest prices
app.get('/prices', (req, res) => {
  res.json(latestPrices);
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
