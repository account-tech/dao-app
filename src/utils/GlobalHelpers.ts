import { CoinMeta } from "@polymedia/suitcase-core";
import { CoinMetaFetcher } from "@polymedia/suitcase-core";
import { Coin } from "@account.tech/core";
import { balanceToString } from "@polymedia/suitcase-core";

// Constants for SUI token addresses and defaults
const DEFAULT_DECIMALS = 9;
const FULL_SUI_TYPE = '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI';
const SUI_IDENTIFIER = 'sui::SUI';

// Efficient cache using Map
const coinMetaCache = new Map<string, CoinMeta>();

/**
 * Interface for recipient data from CSV
 */
export interface Recipient {
  address: string;
  amount: number;
  objectId?: string; // Optional field for object airdrops
}

/**
 * Parses CSV content into an array of Recipients
 * @param csvContent The raw CSV content as string
 * @returns Array of Recipients with validated addresses and amounts/objectIds
 * @throws Error if CSV format is invalid
 */
export function parseRecipientsCSV(csvContent: string): Recipient[] {
  if (!csvContent.trim()) {
    throw new Error('CSV content is empty');
  }

  const lines = csvContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length < 1) {
    throw new Error('CSV must contain at least one line');
  }

  const recipients: Recipient[] = [];
  const errors: string[] = [];

  // Get first line's second value to determine format
  const firstLine = lines[0].split(',').map(part => part.trim());
  const isObjectFormat = firstLine[1]?.startsWith('0x');

  lines.forEach((line, index) => {
    // Split and clean the line, removing empty parts (handles trailing commas)
    const parts = line.split(',')
      .map(part => part.trim())
      .filter(part => part.length > 0);
    
    if (parts.length !== 2) {
      errors.push(`Line ${index + 1}: Each line must have exactly two values (address and ${isObjectFormat ? 'objectId' : 'amount'})`);
      return;
    }

    const [address, secondValue] = parts;

    // Validate address format
    if (!address || !address.match(/^0x[a-fA-F0-9]{64}$/)) {
      errors.push(`Line ${index + 1}: Invalid address format - ${address}`);
      return;
    }

    if (isObjectFormat) {
      // Validate objectId format
      if (!secondValue.match(/^0x[a-fA-F0-9]{64}$/)) {
        errors.push(`Line ${index + 1}: Invalid objectId format - ${secondValue}`);
        return;
      }
      recipients.push({ address, amount: 0, objectId: secondValue });
    } else {
      // Parse and validate amount
      const amount = parseFloat(secondValue);
      if (isNaN(amount) || amount <= 0) {
        errors.push(`Line ${index + 1}: Invalid amount - ${secondValue}`);
        return;
      }
      recipients.push({ address, amount });
    }
  });

  if (errors.length > 0) {
    throw new Error('CSV parsing failed:\n' + errors.join('\n'));
  }

  return recipients;
}

/**
 * Fast normalization of SUI token addresses to full format
 * @param coinType The coin type address to normalize
 */
function normalizeSuiAddress(coinType: string): string {
  // Quick return if not a SUI token
  if (!coinType.includes(SUI_IDENTIFIER)) return coinType;
  
  // Handle all SUI variants
  return coinType === FULL_SUI_TYPE ? coinType : FULL_SUI_TYPE;
}

/**
 * Gets coin decimals with efficient caching
 * @param coinType The coin type address
 * @param client Optional RPC client
 */
export async function getCoinDecimals(
  coinType: string,
  client?: any
): Promise<number> {
  const normalizedType = normalizeSuiAddress(coinType);
  
  // Fast cache lookup
  const cached = coinMetaCache.get(normalizedType);
  if (cached) return cached.decimals;

  // Fetch metadata if client available
  if (client) {
    try {
      const meta = await new CoinMetaFetcher({ client }).getCoinMeta(normalizedType);
      if (meta) {
        coinMetaCache.set(normalizedType, meta);
        return meta.decimals;
      }
    } catch (error) {
      console.warn(`[getCoinDecimals] Failed to fetch metadata for ${normalizedType}`);
    }
  }

  return DEFAULT_DECIMALS;
}

/**
 * Efficiently gets decimals for multiple coin types
 * @param coinTypes Array of coin type addresses
 * @param client RPC client
 */
export async function getMultipleCoinDecimals(
  coinTypes: string[],
  client: any
): Promise<Map<string, number>> {
  if (!coinTypes.length) return new Map();

  // Pre-allocate result map
  const result = new Map<string, number>();
  
  // Create normalized type mapping and identify unique uncached types
  const normalizedMap = new Map<string, string>();
  const uncachedTypes = new Set<string>();
  
  for (const type of coinTypes) {
    const normalizedType = normalizeSuiAddress(type);
    normalizedMap.set(type, normalizedType);
    
    if (!coinMetaCache.has(normalizedType)) {
      uncachedTypes.add(normalizedType);
    }
  }

  // Bulk fetch uncached metadata
  if (uncachedTypes.size && client) {
    try {
      const metas = await new CoinMetaFetcher({ client })
        .getCoinMetas(Array.from(uncachedTypes));
      
      metas.forEach((meta, type) => {
        if (meta) coinMetaCache.set(type, meta);
      });
    } catch (error) {
      console.warn('[getMultipleCoinDecimals] Batch metadata fetch failed');
    }
  }

  // Map results using normalized addresses
  for (const [originalType, normalizedType] of normalizedMap) {
    const decimals = coinMetaCache.get(normalizedType)?.decimals ?? DEFAULT_DECIMALS;
    result.set(originalType, decimals);
  }

  return result;
}

/**
 * High-performance coin amount formatting
 * @param amount The amount to format
 * @param decimals Number of decimal places
 */
export function formatCoinAmount(amount: string | bigint, decimals: number, decimalsToShow: number = 2): string {
  const amountStr = typeof amount === 'string' 
    ? BigInt(amount.replace('n', '')).toString()
    : amount.toString();

  if (amountStr === '0') return '0.00';

  const len = amountStr.length;
  if (len <= decimals) {
    const paddedAmount = amountStr.padStart(decimals, '0');
    const decimalStr = `0.${paddedAmount}`;
    // Truncate without rounding
    const parts = decimalStr.split('.');
    return parts[0] + '.' + (parts[1] || '').padEnd(decimalsToShow, '0').slice(0, decimalsToShow);
  }

  const intPart = amountStr.slice(0, len - decimals);
  const decPart = amountStr.slice(len - decimals);
  // Truncate without rounding and ensure we have at least decimalsToShow digits
  return intPart + '.' + decPart.padEnd(decimalsToShow, '0').slice(0, decimalsToShow);
}

/**
 * Formats a value in USD with $ prefix and 2 decimal places
 */
export function formatUSD(value: number): string {
  return `$ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Calculates the total value of a coin in USD
 * Uses the correct decimals from coin metadata
 */
export function calculateCoinValue(amount: bigint, price: number, decimals: number): number {
  // Convert to proper decimal places before multiplying by price
  const balanceAsString = balanceToString(amount, decimals);
  return parseFloat(balanceAsString) * price;
}

/**
 * Formats IPFS URLs for image loading
 */
export function formatImageUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${url.replace('ipfs://', '')}`;
  }
  return url;
}

/**
 * Calculates the total USD value of a list of coins using a pre-fetched price map and coin metadata.
 */
export function calculateTotalValue(
  coins: Coin[],
  prices: Record<string, number>,
  formatTypeForPriceLookup: (type: string) => string,
  coinMetas?: Map<string, CoinMeta>
): number {
  return coins.reduce((total, coin) => {
    const priceKey = formatTypeForPriceLookup(coin.type);
    const price = prices[priceKey];
    if (price === undefined || price === null) return total;

    const metadata = coinMetas?.get(coin.type);
    const decimals = metadata?.decimals ?? 9; // Default to 9 decimals if not found (SUI default)
    
    const value = calculateCoinValue(coin.totalAmount, price, decimals);
    return total + value;
  }, 0);
}

