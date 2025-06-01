'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Recipient } from '../helpers/types';
import { parseRecipientsCSV } from '@/utils/GlobalHelpers';
import { toast } from 'sonner';

interface RecipientStepProps {
  recipients: Recipient[];
  onRecipientsUpdated: (recipients: Recipient[]) => void;
}

const EXAMPLE_CSV_CONTENT = `0x73c9dcc625ec28521d66ad5cf5652204175e9130782053fffd1d9431f0bbc01d,103245.2342,
0xc23ea8e493616b1510d9405ce05593f8bd1fb30f44f92303ab2c54f6c8680ecb,0.454,
0xf7329336e55281b8aea1ca98d4a700dc83e915f0d253964e96267460cf992817,10000,
0x4783433173fc369416416dceffb373c2394f89bb840db30ce5630b8b25594d05,863409.2,`;

export function RecipientStep({
  recipients,
  onRecipientsUpdated
}: RecipientStepProps) {
  const [inputMethod, setInputMethod] = useState<'manual' | 'csv'>('manual');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [manualAddresses, setManualAddresses] = useState<string>('');

  // Initialize textarea with existing recipients if they don't have amounts (manual mode)
  useEffect(() => {
    if (recipients.length > 0 && recipients.every(r => r.amount === 0)) {
      setManualAddresses(recipients.map(r => r.address).join('\n'));
    }
  }, []);

  const handleManualInputChange = (value: string) => {
    setManualAddresses(value);
    const addresses = value
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(address => ({ 
        address,
        amount: 0 // Initialize with 0, will be set later in the flow
      }));
    
    onRecipientsUpdated(addresses);
  };

  const handleCsvUpload = async (file: File) => {
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsedRecipients = parseRecipientsCSV(text);
        onRecipientsUpdated(parsedRecipients);
        toast.success(`Successfully loaded ${parsedRecipients.length} recipients`);
      } catch (error) {
        console.error('CSV parsing error:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to parse CSV file');
        setCsvFile(null);
      }
    };
    reader.readAsText(file);
  };

  const handleInputMethodChange = (method: 'manual' | 'csv') => {
    setInputMethod(method);
    if (method === 'manual') {
      // Reset to manual mode
      setCsvFile(null);
      const addresses = manualAddresses
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(address => ({
          address,
          amount: 0
        }));
      onRecipientsUpdated(addresses);
    }
  };

  const validateSuiAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{64}$/.test(address);
  };

  const downloadExampleCsv = () => {
    const blob = new Blob([EXAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'airdrop_example.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Add Recipients</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="manual" value={inputMethod} onValueChange={(value) => handleInputMethodChange(value as 'manual' | 'csv')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Input</TabsTrigger>
              <TabsTrigger value="csv">CSV Upload</TabsTrigger>
            </TabsList>
            
            <TabsContent value="manual" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manual-addresses">
                  Enter Separate wallet addresses on a new line
                </Label>
                <Textarea
                  id="manual-addresses"
                  placeholder="0x000000000000000000000000000000000000000000000000000000000000001&#13;&#10;0x000000000000000000000000000000000000000000000000000000000000002&#13;&#10;0x000000000000000000000000000000000000000000000000000000000000003"
                  value={manualAddresses}
                  onChange={(e) => handleManualInputChange(e.target.value)}
                  className="min-h-[150px] font-mono"
                />
                {manualAddresses && manualAddresses.split('\n').some(address => address.trim() && !validateSuiAddress(address.trim())) && (
                  <p className="text-sm text-red-500">Please ensure all addresses are valid Sui addresses</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="csv" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Upload CSV File</Label>
                  <button
                    onClick={downloadExampleCsv}
                    className="text-sm text-blue-500 hover:text-blue-700 underline"
                    type="button"
                  >
                    (download csv example)
                  </button>
                </div>
                <div className="border-2 border-dashed rounded-lg p-6 text-center space-y-4">
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    id="csv-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCsvUpload(file);
                    }}
                  />
                  <Label
                    htmlFor="csv-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {csvFile ? csvFile.name : 'Click to upload CSV'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      CSV should contain address and amount per line
                    </span>
                  </Label>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 