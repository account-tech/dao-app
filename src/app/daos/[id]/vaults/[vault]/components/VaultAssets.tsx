interface VaultData {
  coins: Record<string, bigint>;
  formattedCoins?: Record<string, { 
    balance: bigint; 
    formattedBalance: string; 
    symbol: string; 
    decimals: number 
  }>;
}

interface VaultAssetsProps {
  vaultData: VaultData | null;
  tokenPrices?: {
    [key: string]: {
      price: number;
      priceChange24HoursPercentage: number;
    };
  } | null;
}

const CoinPlaceholder = () => (
  <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
    <div className="space-y-2">
      <div className="h-5 w-20 bg-gray-200 rounded"></div>
      <div className="h-4 w-24 bg-gray-200 rounded"></div>
    </div>
    <div className="text-right space-y-2">
      <div className="h-4 w-16 bg-gray-200 rounded"></div>
      <div className="h-5 w-20 bg-gray-200 rounded"></div>
    </div>
  </div>
);

export function VaultAssets({ vaultData, tokenPrices }: VaultAssetsProps) {
  if (!vaultData || !vaultData.coins) {
    return (
      <div className="space-y-4">
        <div className="relative">
          <div className="opacity-30 space-y-4">
            <CoinPlaceholder />
            <CoinPlaceholder />
            <CoinPlaceholder />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center bg-white px-8 py-5 rounded-xl border border-gray-200/50 shadow-sm backdrop-blur-sm">
              <p className="text-xl font-semibold bg-gradient-to-r from-teal-500 to-teal-700 bg-clip-text text-transparent">No assets yet</p>
              <p className="text-sm text-gray-600 mt-2">This vault is empty</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Use formatted coins if available, otherwise fall back to raw coins
  const coinsToDisplay = vaultData.formattedCoins || vaultData.coins;
  const coinEntries = Object.entries(coinsToDisplay);

  return (
    <div className="space-y-4">
      {coinEntries.length > 0 ? (
        coinEntries.map(([coinType, coinData], index) => {
          // Handle both formatted and raw coin data
          const isFormatted = vaultData.formattedCoins && coinType in vaultData.formattedCoins;
          const symbol = isFormatted 
            ? (coinData as any).symbol 
            : coinType.split("::").pop() || "Unknown";
          const displayAmount = isFormatted 
            ? (coinData as any).formattedBalance 
            : (coinData as bigint).toString();
          
          // Calculate price and total value
          const normalizedType = coinType.startsWith('0x') ? coinType : `0x${coinType}`;
          const price = tokenPrices?.[normalizedType]?.price;
          const displayPrice = price === -1 ? 0 : price || 0;
          const numericAmount = isFormatted 
            ? parseFloat((coinData as any).formattedBalance) 
            : parseFloat((coinData as bigint).toString());
          const totalValue = numericAmount * displayPrice;
          
          return (
            <div 
              key={index} 
              className="bg-gray-50 rounded-lg p-4 flex justify-between items-center hover:bg-gray-100 transition-colors"
            >
              <div>
                <div className="font-medium">{symbol}</div>
                <div className="text-sm text-gray-500">{displayAmount}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">$ {displayPrice.toFixed(4)}</div>
                <div className="font-medium text-teal-700">$ {totalValue.toFixed(2)}</div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="relative">
          <div className="opacity-30 space-y-4">
            <CoinPlaceholder />
            <CoinPlaceholder />
            <CoinPlaceholder />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center bg-white px-8 py-5 rounded-xl border border-gray-200/50 shadow-sm backdrop-blur-sm">
              <p className="text-xl font-semibold bg-gradient-to-r from-teal-500 to-teal-700 bg-clip-text text-transparent">No assets yet</p>
              <p className="text-sm text-gray-600 mt-2">This vault is empty</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
