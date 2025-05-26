interface VaultData {
  coins: Record<string, bigint>;
}

interface VaultAssetsProps {
  vaultData: VaultData | null;
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

export function VaultAssets({ vaultData }: VaultAssetsProps) {
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

  const coinEntries = Object.entries(vaultData.coins);

  return (
    <div className="space-y-4">
      {coinEntries.length > 0 ? (
        coinEntries.map(([coinType, amount], index) => {
          const symbol = coinType.split("::").pop() || "Unknown";
          // For now, display raw amount - TODO: format with decimals and price
          const displayAmount = amount.toString();
          
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
                <div className="text-sm text-gray-500">$ 0.00</div>
                <div className="font-medium text-teal-700">$ 0.00</div>
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
