import { OwnedData } from "@account.tech/core";
import { formatCoinAmount } from "@/utils/GlobalHelpers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface WalletAssetsProps {
  ownedData: OwnedData | null;
  coinDecimals: Map<string, number>;
  tokenPrices: {
    [key: string]: {
      price: number;
      priceChange24HoursPercentage: number;
    };
  };
}

const BasePlaceholder = () => (
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

const NFTPlaceholder = () => (
  <div className="bg-gray-50 rounded-lg p-4">
    <div className="grid sm:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="w-full">
          <div className="h-72 w-full bg-gray-200 rounded-lg mb-2"></div>
          <div className="h-5 w-3/4 bg-gray-200 rounded mb-1"></div>
          <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

const ObjectPlaceholder = () => (
  <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
    <div className="space-y-2">
      <div className="h-5 w-48 bg-gray-200 rounded"></div>
      <div className="h-4 w-32 bg-gray-200 rounded"></div>
    </div>
  </div>
);

export function WalletAssets({ ownedData, coinDecimals, tokenPrices }: WalletAssetsProps) {
  return (
    <Tabs defaultValue="coins" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="coins" className="data-[state=active]:bg-teal-100 data-[state=active]:text-teal-700">
          Coins ({ownedData?.coins?.length || 0})
        </TabsTrigger>
        <TabsTrigger value="nfts" className="data-[state=active]:bg-teal-100 data-[state=active]:text-teal-700">
          NFTs ({ownedData?.nfts?.length || 0})
        </TabsTrigger>
        <TabsTrigger value="objects" className="data-[state=active]:bg-teal-100 data-[state=active]:text-teal-700">
          Objects ({ownedData?.objects?.length || 0})
        </TabsTrigger>
      </TabsList>

      {/* Coins Tab */}
      <TabsContent value="coins" className="mt-6 space-y-4">
        {ownedData?.coins?.length ? (
          ownedData.coins.map((coin, index) => {
            const decimals = coinDecimals.get(coin.type) || 9;
            const formattedAmount = formatCoinAmount(coin.totalAmount || BigInt(0), decimals, 4);
            const symbol = coin.type.split("::").pop() || "Unknown";
            const price = tokenPrices[coin.type]?.price;
            const displayPrice = price === -1 ? 0 : price || 0;
            const numericAmount = parseFloat(formattedAmount);
            const totalValue = numericAmount * displayPrice;

            return (
              <div 
                key={index} 
                className="bg-gray-50 rounded-lg p-4 flex justify-between items-center hover:bg-gray-100 transition-colors"
              >
                <div>
                  <div className="font-medium">{symbol}</div>
                  <div className="text-sm text-gray-500">{formattedAmount}</div>
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
              <CoinPlaceholder />
              <CoinPlaceholder />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center bg-white px-8 py-5 rounded-xl border border-gray-200/50 shadow-sm backdrop-blur-sm">
                <p className="text-xl font-semibold bg-gradient-to-r from-teal-500 to-teal-700 bg-clip-text text-transparent">No coins yet</p>
                <p className="text-sm text-gray-600 mt-2">Deposit some coins to your wallet</p>
              </div>
            </div>
          </div>
        )}
      </TabsContent>

      {/* NFTs Tab */}
      <TabsContent value="nfts" className="mt-6 space-y-4">
        {ownedData?.nfts?.length ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {ownedData.nfts.map((nft, index) => (
              <div
                key={index}
                className="relative rounded-lg overflow-hidden border border-gray-200 hover:border-teal-300 transition-all hover:shadow-md"
              >
                <img
                  src={nft.image}
                  alt={nft.name || "NFT"}
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
                  <p className="text-white text-sm truncate">
                    {nft.name || nft.type.split('::').pop() || "Unknown NFT"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="relative">
            <div className="opacity-30 space-y-4">
              <NFTPlaceholder />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center bg-white px-8 py-5 rounded-xl border border-gray-200/50 shadow-sm backdrop-blur-sm">
                <p className="text-xl font-semibold bg-gradient-to-r from-teal-500 to-teal-700 bg-clip-text text-transparent">No NFTs yet</p>
                <p className="text-sm text-gray-600 mt-2">Deposit some NFTs to your wallet</p>
              </div>
            </div>
          </div>
        )}
      </TabsContent>

      {/* Objects Tab */}
      <TabsContent value="objects" className="mt-6 space-y-4">
        {ownedData?.objects?.length ? (
          ownedData.objects.map((object, index) => (
            <div 
              key={index} 
              className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
            >
              <div className="font-medium truncate">{object.type.split("::").pop()}</div>
              <div className="text-sm text-gray-500 truncate">ID: {object.ref.objectId}</div>
            </div>
          ))
        ) : (
          <div className="relative">
            <div className="opacity-30 space-y-4">
              <ObjectPlaceholder />
              <ObjectPlaceholder />
              <ObjectPlaceholder />
              <ObjectPlaceholder />
              <ObjectPlaceholder />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center bg-white px-8 py-5 rounded-xl border border-gray-200/50 shadow-sm backdrop-blur-sm">
                <p className="text-xl font-semibold bg-gradient-to-r from-teal-500 to-teal-700 bg-clip-text text-transparent">No objects yet</p>
                <p className="text-sm text-gray-600 mt-2">Deposit some objects to your wallet</p>
              </div>
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
