'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RecipientStepProps {
  recipientAddress: string;
  onRecipientAddressChange: (address: string) => void;
}

export function RecipientStep({
  recipientAddress,
  onRecipientAddressChange
}: RecipientStepProps) {
  const validateSuiAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{64}$/.test(address);
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="recipient-address">
            Enter the recipient's address
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="recipient-address"
            placeholder="@johndoe or 0x123456789abcd..."
            value={recipientAddress}
            onChange={(e) => onRecipientAddressChange(e.target.value)}
            className={!validateSuiAddress(recipientAddress) && recipientAddress ? 'border-red-500' : ''}
          />
          {!validateSuiAddress(recipientAddress) && recipientAddress && (
            <p className="text-sm text-red-500">Please enter a valid Sui address</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 