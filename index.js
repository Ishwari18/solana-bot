const { scrapeDexScreener } = require('./scraper');

(async () => {
  console.log("Starting the scraper...");
  await scrapeDexScreener();
  console.log("Scraping complete. Check the data folder for results.");
})();