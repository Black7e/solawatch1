import { getFeePercentage, isFeeEnabled } from '../config/network';

export interface FeeCalculation {
  feeAmount: number;
  netAmount: number;
  originalAmount: number;
  feePercentage: number;
}

/**
 * Calculate fee for a given amount
 * @param amount - The original amount
 * @returns Fee calculation object
 */
export const calculateFee = (amount: number): FeeCalculation => {
  if (!isFeeEnabled() || amount <= 0) {
    return {
      feeAmount: 0,
      netAmount: amount,
      originalAmount: amount,
      feePercentage: 0
    };
  }
  
  const feePercentage = getFeePercentage();
  const feeAmount = amount * (feePercentage / 100);
  const netAmount = amount - feeAmount;
  
  return {
    feeAmount,
    netAmount,
    originalAmount: amount,
    feePercentage
  };
};

/**
 * Format fee information for display
 * @param amount - The original amount
 * @param currency - The currency symbol (e.g., 'SOL', 'USDC')
 * @returns Formatted fee information
 */
export const formatFeeInfo = (amount: number, currency: string) => {
  const feeCalc = calculateFee(amount);
  
  return {
    originalAmount: `${feeCalc.originalAmount.toFixed(4)} ${currency}`,
    feeAmount: `${feeCalc.feeAmount.toFixed(4)} ${currency}`,
    netAmount: `${feeCalc.netAmount.toFixed(4)} ${currency}`,
    feePercentage: feeCalc.feePercentage
  };
};

/**
 * Check if fees are enabled
 * @returns boolean
 */
export const feesEnabled = (): boolean => {
  return isFeeEnabled();
};

/**
 * Get fee percentage
 * @returns number
 */
export const getFeePercent = (): number => {
  return getFeePercentage();
}; 