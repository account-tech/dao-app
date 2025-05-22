'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RecipientStepProps {
  recipientAddress: string;
  onRecipientAddressUpdated: (address: string) => void;
}

export function RecipientStep({
  recipientAddress,
  onRecipientAddressUpdated
}: RecipientStepProps) {

  const validateSuiAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{64}$/.test(address);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Recipient Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient-address">
              Recipient Address
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="recipient-address"
              placeholder="Enter recipient address (0x...)"
              value={recipientAddress}
              onChange={(e) => onRecipientAddressUpdated(e.target.value)}
              className={!validateSuiAddress(recipientAddress) && recipientAddress ? 'border-red-500' : ''}
            />
            {!validateSuiAddress(recipientAddress) && recipientAddress && (
              <p className="text-sm text-red-500">Please enter a valid Sui address</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 