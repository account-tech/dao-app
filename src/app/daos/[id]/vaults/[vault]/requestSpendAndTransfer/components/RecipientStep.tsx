'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CoinSelection } from '../helpers/types';

interface Recipient {
  address: string;
  amount: number;
}

interface RecipientStepProps {
  selectedCoins: CoinSelection[];
  recipients: Recipient[];
  onRecipientsUpdated: (recipients: Recipient[]) => void;
}

export function RecipientStep({
  selectedCoins,
  recipients,
  onRecipientsUpdated
}: RecipientStepProps) {
  const selectedCoin = selectedCoins[0];
  const coinType = selectedCoin?.coinType;

  const getTotalSelectedAmount = () => {
    return selectedCoin?.amount || 0;
  };

  // Initialize or update recipient with max amount
  useEffect(() => {
    const maxAmount = getTotalSelectedAmount();
    if (recipients.length === 0) {
      onRecipientsUpdated([{
        address: '',
        amount: maxAmount
      }]);
    } else if (recipients[0].amount !== maxAmount) {
      onRecipientsUpdated([{
        ...recipients[0],
        amount: maxAmount
      }]);
    }
  }, [recipients, selectedCoins, onRecipientsUpdated]);

  const updateRecipient = (address: string) => {
    onRecipientsUpdated([{
      address,
      amount: getTotalSelectedAmount()
    }]);
  };

  const validateSuiAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{64}$/.test(address);
  };

  if (!selectedCoin) {
    return null;
  }

  const coinSymbol = coinType?.split('::').pop();
  const recipient = recipients[0] || { address: '', amount: getTotalSelectedAmount() };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Selected Coin</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-1">
            <p className="font-medium">Type: {coinSymbol}</p>
            <p>Amount to Transfer: {getTotalSelectedAmount()}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Recipient Details</CardTitle>
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
              value={recipient.address}
              onChange={(e) => updateRecipient(e.target.value)}
              className={!validateSuiAddress(recipient.address) && recipient.address ? 'border-red-500' : ''}
            />
            {!validateSuiAddress(recipient.address) && recipient.address && (
              <p className="text-sm text-red-500">Please enter a valid Sui address</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="text"
              value={recipient.amount}
              disabled
              className="bg-muted"
            />
            <div className="text-sm text-muted-foreground">
              <p>Full amount will be transferred to the recipient</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 