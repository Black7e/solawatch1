import { Connection, PublicKey } from '@solana/web3.js';
import { getAllRpcEndpoints } from '../config/network';

// Create connections for all available RPC endpoints
const createConnections = () => {
  const endpoints = getAllRpcEndpoints();
  return endpoints.map(endpoint => new Connection(endpoint, 'confirmed'));
};

// Try multiple RPC endpoints for a given operation
export const tryWithRpcFallback = async <T>(
  operation: (connection: Connection) => Promise<T>,
  operationName: string = 'RPC operation'
): Promise<T> => {
  const connections = createConnections();
  let lastError: Error | null = null;

  for (let i = 0; i < connections.length; i++) {
    try {
      console.log(`Trying ${operationName} with RPC endpoint ${i + 1}/${connections.length}`);
      const result = await operation(connections[i]);
      console.log(`${operationName} successful with endpoint ${i + 1}`);
      return result;
    } catch (error) {
      console.warn(`${operationName} failed with endpoint ${i + 1}:`, error);
      lastError = error as Error;
      
      // If this is the last endpoint, throw the error
      if (i === connections.length - 1) {
        throw new Error(`${operationName} failed on all RPC endpoints. Last error: ${lastError.message}`);
      }
    }
  }

  throw lastError || new Error(`${operationName} failed on all RPC endpoints`);
};

// Specific utility functions for common operations
export const getBalanceWithFallback = async (publicKey: PublicKey): Promise<number> => {
  return tryWithRpcFallback(
    async (connection) => await connection.getBalance(publicKey),
    'getBalance'
  );
};

export const getTokenAccountsWithFallback = async (
  publicKey: PublicKey, 
  mint: PublicKey
): Promise<any> => {
  return tryWithRpcFallback(
    async (connection) => await connection.getParsedTokenAccountsByOwner(publicKey, { mint }),
    'getParsedTokenAccountsByOwner'
  );
};

export const sendTransactionWithFallback = async (
  transaction: any,
  signers: any[],
  options?: any
): Promise<string> => {
  return tryWithRpcFallback(
    async (connection) => await connection.sendTransaction(transaction, signers, options),
    'sendTransaction'
  );
}; 