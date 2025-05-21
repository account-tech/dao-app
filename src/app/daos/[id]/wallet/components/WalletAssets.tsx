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

export function WalletAssets({ ownedData, coinDecimals, tokenPrices }: WalletAssetsProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <Tabs defaultValue="coins" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="coins" className="data-[state=active]:bg-teal-100 data-[state=active]:text-teal-700">
            Coins
          </TabsTrigger>
          <TabsTrigger value="nfts" className="data-[state=active]:bg-teal-100 data-[state=active]:text-teal-700">
            NFTs
          </TabsTrigger>
          <TabsTrigger value="objects" className="data-[state=active]:bg-teal-100 data-[state=active]:text-teal-700">
            Objects
          </TabsTrigger>
        </TabsList>

        {/* Coins Tab */}
        <TabsContent value="coins" className="mt-6 space-y-4">
          {ownedData?.coins?.map((coin, index) => {
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
          })}
          {!ownedData?.coins?.length && (
            <div className="text-center text-gray-500 py-8">No coins found</div>
          )}
        </TabsContent>

        {/* NFTs Tab */}
        <TabsContent value="nfts" className="mt-6 space-y-4">
          {ownedData?.nfts?.map((nft, index) => (
            <div 
              key={index} 
              className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
            >
              <div className="font-medium truncate">{nft.name}</div>
              <div className="text-sm text-gray-500 truncate">{nft.type.split("::").pop()}</div>
            </div>
          ))}
          {!ownedData?.nfts?.length && (
            <div className="text-center text-gray-500 py-8">No NFTs found</div>
          )}
        </TabsContent>

        {/* Objects Tab */}
        <TabsContent value="objects" className="mt-6 space-y-4">
          {ownedData?.objects?.map((object, index) => (
            <div 
              key={index} 
              className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
            >
              <div className="font-medium truncate">{object.type.split("::").pop()}</div>
              <div className="text-sm text-gray-500 truncate">ID: {object.ref.objectId}</div>
            </div>
          ))}
          {!ownedData?.objects?.length && (
            <div className="text-center text-gray-500 py-8">No objects found</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
