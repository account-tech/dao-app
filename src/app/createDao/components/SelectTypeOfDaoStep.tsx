import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StepProps } from "../helpers/types";

export const SelectTypeOfDaoStep: React.FC<StepProps> = ({ formData, updateFormData }) => {

  const handleDaoTypeChange = (value: string) => {
    updateFormData({ 
      daoType: value as 'coin' | 'nft',
      // Reset coinType when switching types
      coinType: value === 'nft' ? undefined : formData.coinType 
    });
  };

  const handleCoinTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData({ coinType: e.target.value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label>What type of DAO do you want to create?</Label>
        <RadioGroup
          value={formData.daoType}
          onValueChange={handleDaoTypeChange}
          className="flex flex-col space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="coin" id="coin" />
            <Label htmlFor="coin">Coin</Label>
          </div>
          <div className="flex items-center space-x-2 opacity-50">
            <RadioGroupItem value="nft" id="nft" disabled />
            <Label htmlFor="nft">NFT (Coming Soon)</Label>
          </div>
        </RadioGroup>
      </div>

      {formData.daoType === 'coin' && (
        <div className="space-y-2">
          <Label htmlFor="coinType">Search or enter coin type</Label>
          <Input
            id="coinType"
            placeholder="Enter coin type..."
            value={formData.coinType || ''}
            onChange={handleCoinTypeChange}
          />
          <p className="text-sm text-gray-500">Balance: -</p>
        </div>
      )}
    </div>
  );
};