import { scrapeDexScreener } from './scraper';

(async () => {
  console.log("Starting the scraper...");
  try {
    await scrapeDexScreener();
    console.log("Scraping complete. Check the data folder for results.");
  } catch (error) {
    console.error("An error occurred during scraping:", error);
  }
})();
