import React, { useState, useEffect } from 'react';

function PriceMonitor() {
  const [prices, setPrices] = useState([]);

  const fetchPrices = async () => {
    try {
      const response = await fetch('http://localhost:5000/prices');
      const data = await response.json();
      setPrices(data);
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 10000); // Fetch every 10 seconds
    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  return (
    <div>
      <h1>Live Token Prices</h1>
      <table>
        <thead>
          <tr>
            <th>Base Token</th>
            <th>Quote Token</th>
            <th>Price (USD)</th>
            <th>Liquidity (USD)</th>
            <th>FDV</th>
          </tr>
        </thead>
        <tbody>
          {prices.map((price, index) => (
            <tr key={index}>
              <td>{price.baseToken}</td>
              <td>{price.quoteToken}</td>
              <td>${price.priceUsd}</td>
              <td>${price.liquidityUsd}</td>
              <td>${price.fdv}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PriceMonitor;
