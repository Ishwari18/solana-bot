import { RaydiumSwap } from './raydium-swap';
import { CONFIG } from './config';
import {
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction, 
  VersionedTransaction,
} from '@solana/web3.js';

/**
 * This class defines the trader that interacts with RaydiumSwap
 */
class Trader {
  raydiumSwap: RaydiumSwap;

  constructor() {
    this.raydiumSwap = new RaydiumSwap(CONFIG.RPC_URL, CONFIG.WALLET_SECRET_KEY);
  }

  /**
   * Get token balance for the given mint
   * @param mint - The token mint address (e.g., SOL or any SPL token)
   * @returns Promise<number> - The token balance
   */
  async getTokenBalance(mint: string): Promise<number> {
    const balance = await this.raydiumSwap.getTokenBalance(mint);
    return balance;
  }

  /**
   * Check current SOL balance of the trader's wallet
   * @returns Promise<number> - The SOL balance in the wallet
   */
  async getSolBalance(): Promise<number> {
    const balance = await this.raydiumSwap.connection.getBalance(this.raydiumSwap.wallet.publicKey);
    return balance / LAMPORTS_PER_SOL; // Convert lamports to SOL
  }

  /**
   * Check if the trader has enough SOL to perform a swap
   * @param requiredAmount - The amount of SOL required for the swap
   * @returns boolean - Whether the trader has enough SOL
   */
  async hasEnoughSol(requiredAmount: number): Promise<boolean> {
    const solBalance = await this.getSolBalance();
    return solBalance >= requiredAmount;
  }

  /**
   * Perform the swap based on the provided configuration
   * @param amountIn - The amount of the base token to swap (e.g., SOL)
   * @param baseMint - The mint address of the base token (e.g., SOL)
   * @param quoteMint - The mint address of the quote token (e.g., USDT, BONK)
   * @param slippage - The maximum acceptable slippage percentage
   * @returns Promise<string> - The transaction ID
   */
  async executeSwap(
    amountIn: number,
    baseMint: string,
    quoteMint: string,
    slippage: number
  ): Promise<string> {
    try {
      console.log(`Starting swap for ${amountIn} of ${baseMint} to ${quoteMint}`);

      await this.raydiumSwap.loadPoolKeys();

      // Find pool info for the given tokens (baseMint and quoteMint)
      const poolInfo = this.raydiumSwap.findPoolInfoForTokens(baseMint, quoteMint) ||
        await this.raydiumSwap.findRaydiumPoolInfo(baseMint, quoteMint);

      if (!poolInfo) {
        throw new Error("Couldn't find the pool info for the selected tokens.");
      }

      // Create wrapped SOL account for the swap (if required)
      await this.raydiumSwap.createWrappedSolAccountInstruction(amountIn);

      // Get the swap transaction
      const swapTx = await this.raydiumSwap.getSwapTransaction(
        quoteMint,
        amountIn,
        poolInfo,
        CONFIG.USE_VERSIONED_TRANSACTION,
        slippage
      );

      console.log(`Transaction created for swapping ${amountIn} ${baseMint} to ${quoteMint}`);

      // Execute the swap transaction if enabled in the config
      if (CONFIG.EXECUTE_SWAP) {
        const txid = await this.sendTransaction(swapTx);
        console.log(`Transaction sent successfully. Txid: ${txid}`);
        return txid;
      } else {
        console.log("Simulating transaction (dry run)...");
        const simulationResult = await this.simulateTransaction(swapTx);
        console.log("Simulation successful:", simulationResult);
        return simulationResult;
      }
    } catch (error) {
      console.error('Error during swap execution:', error);
      throw error;
    }
  }

  /**
   * Send the transaction to the Solana blockchain (both legacy and versioned supported)
   * @param tx - The transaction to send
   * @returns Promise<string> - The transaction ID
   */
  private async sendTransaction(tx: any): Promise<string> {
    let txid: string;
    // Fetch the latest blockhash and last valid block height
  const { blockhash, lastValidBlockHeight } = await this.raydiumSwap.connection.getLatestBlockhash();

    if (tx instanceof Transaction) {
      txid = await this.raydiumSwap.sendLegacyTransaction(tx);
    } else if (tx instanceof VersionedTransaction) {
      //txid = await this.raydiumSwap.sendVersionedTransaction(tx);
      txid = await this.raydiumSwap.sendVersionedTransaction(tx, blockhash, lastValidBlockHeight);
    } else {
      throw new Error('Invalid transaction type');
    }
    return txid;
  }

  /**
   * Simulate the transaction to check its behavior without actually executing it
   * @param tx - The transaction to simulate
   * @returns Promise<any> - The simulation result
   */
  private async simulateTransaction(tx: any): Promise<any> {
    let simulationResult;
    if (tx instanceof Transaction) {
      simulationResult = await this.raydiumSwap.simulateLegacyTransaction(tx);
    } else if (tx instanceof VersionedTransaction) {
      simulationResult = await this.raydiumSwap.simulateVersionedTransaction(tx);
    } else {
      throw new Error('Invalid transaction type');
    }
    return simulationResult;
  }

  /**
   * Example method for performing a token swap
   */
  async swapExample() {
    const amountIn = 1.0; // Example: Swap 1 SOL
    const baseMint = CONFIG.BASE_MINT; // Base token mint (e.g., SOL)
    const quoteMint = CONFIG.QUOTE_MINT; // Quote token mint (e.g., BONK)
    const slippage = 0.5; // Example: Set slippage tolerance to 0.5%

    // Ensure the trader has enough SOL to perform the swap
    if (await this.hasEnoughSol(amountIn)) {
      const txid = await this.executeSwap(amountIn, baseMint, quoteMint, slippage);
      console.log(`Swap executed successfully. Transaction ID: ${txid}`);
    } else {
      console.log(`Insufficient SOL balance to perform the swap.`);
    }
  }
}

// Example usage:
const trader = new Trader();
trader.swapExample().catch(console.error);
