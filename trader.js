const fs = require('fs');

// Load the data from the token files
const tokenPairs = require('./data/tokenPairs.json'); // Original price data (price to buy)
const tokenPairs30 = require('./data/tokenPairs30.json'); // Sell price data (price after 30 days)

// Function to calculate profit for each token
function calculateProfit() {
  let totalProfit = 0; // Total profit made by investing $1 in each token
  const result = [];

  // Loop through the tokens in tokenPairs and find the corresponding token in tokenPairs30
  tokenPairs.forEach(pair => {
    const sellTokenData = tokenPairs30.find(token => token.name === pair.name);
    
    if (sellTokenData && pair.price !== "N/A" && sellTokenData.price !== "N/A") {
      // Log token data for debugging
      console.log(`Processing token: ${pair.name}`);
      console.log(`Buy Price: ${pair.price}, Sell Price: ${sellTokenData.price}`);

      const buyPrice = parseFloat(pair.price.replace('$', '').replace(',', ''));
      const sellPrice = parseFloat(sellTokenData.price.replace('$', '').replace(',', ''));

      console.log(`Converted Buy Price: ${buyPrice}, Converted Sell Price: ${sellPrice}`);
      
      if (!isNaN(buyPrice) && !isNaN(sellPrice)) {
        // Calculate profit percentage and money made from $1 investment
        const profitPercentage = ((sellPrice - buyPrice) / buyPrice) * 100;
        const profit = sellPrice - buyPrice; // Profit from $1 invested

        totalProfit += profit;

        result.push({
          name: pair.name,
          profitPercentage: profitPercentage.toFixed(2) + '%',
          profitMade: '$' + profit.toFixed(4),
        });
      }
    }
  });

  // Output results
  console.log("\nToken Profit Results:");
  result.forEach(r => {
    console.log(`${r.name}: Profit Percentage: ${r.profitPercentage}, Money Made: ${r.profitMade}`);
  });

  console.log(`\nTotal Profit Made: $${totalProfit.toFixed(4)}`);
}

// Run the profit calculation
calculateProfit();
