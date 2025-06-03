'use client';

import * as React from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Vault, Plus, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDaoClient } from "@/hooks/useDaoClient";
import { useCurrentAccount, useSuiClient, useSignTransaction } from "@mysten/dapp-kit";
import { useParams } from "next/navigation";
import { Transaction } from "@mysten/sui/transactions";
import { signAndExecute, handleTxResult } from "@/utils/tx/Tx";
import { toast } from "sonner";
import { useDaoStore } from "@/store/useDaoStore";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VaultCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function VaultCreationContent({ 
  className, 
  onClose, 
}: { 
  className?: string; 
  onClose: () => void;
}) {
  const [vaultName, setVaultName] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [showInvalidAlert, setShowInvalidAlert] = React.useState(false);
  const { openVault } = useDaoClient();
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const signTransaction = useSignTransaction();
  const params = useParams();
  const daoId = params.id as string;
  const { refreshClient } = useDaoStore();

  const handleVaultNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Replace spaces with hyphens and only allow letters, numbers, and hyphens
    const sanitizedValue = value.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
    
    if (sanitizedValue !== value && value !== '') {
      setShowInvalidAlert(true);
    } else {
      setShowInvalidAlert(false);
    }
    
    setVaultName(sanitizedValue);
  };

  const handleCreateVault = async () => {
    if (!currentAccount?.address || !vaultName.trim() || isLoading) return;

    try {
      setIsLoading(true);
      
      const tx = new Transaction();
      await openVault(currentAccount.address, daoId, tx, vaultName.trim());

      const result = await signAndExecute({
        suiClient,
        currentAccount,
        tx,
        signTransaction,
        options: { showEffects: true },
        toast,
      });

      handleTxResult(result, toast);

      // Reset form and close dialog
      setVaultName("");
      setShowInvalidAlert(false);
      onClose();
      
      // Refresh data and notify parent
      refreshClient();
      
    } catch (error) {
      console.error("Error creating vault:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create vault");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = vaultName.trim().length > 0;

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Vault Icon */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="absolute -inset-2 bg-gradient-to-r from-teal-500/20 to-emerald-500/20 rounded-full blur-sm" />
          <div className="relative bg-gradient-to-br from-teal-500 to-teal-600 p-6 rounded-full">
            <Vault className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="vault-name" className="text-sm font-medium text-gray-700">
            Vault Name
          </Label>
          <Input
            id="vault-name"
            type="text"
            placeholder="Enter vault name (letters, numbers, and hyphens only)..."
            value={vaultName}
            onChange={handleVaultNameChange}
            disabled={isLoading}
            className="w-full"
            maxLength={50}
          />
          {showInvalidAlert && (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription className="flex items-center justify-between">
                <span>Only letters, numbers, and hyphens are allowed. Spaces will be converted to hyphens.</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4"
                  onClick={() => setShowInvalidAlert(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </AlertDescription>
            </Alert>
          )}
          <p className="text-xs text-gray-500">
            Choose a descriptive name for your vault (max 50 characters)
          </p>
        </div>

        <Button
          onClick={handleCreateVault}
          disabled={!isFormValid || isLoading}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Vault...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Create Vault
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export function VaultCreationDialog({ 
  open, 
  onOpenChange, 
}: VaultCreationDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleClose = () => {
    onOpenChange(false);
  };

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[450px] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">Create New Vault</DialogTitle>
            <DialogDescription className="text-base text-gray-500 text-center">
              Create a new treasury vault to organize and manage your DAO's assets.
            </DialogDescription>
          </DialogHeader>
          <VaultCreationContent 
            className="my-6" 
            onClose={handleClose}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-center">
          <DrawerTitle className="text-xl">Create New Vault</DrawerTitle>
          <DrawerDescription className="text-base text-gray-500">
            Create a new treasury vault to organize and manage your DAO's assets.
          </DrawerDescription>
        </DrawerHeader>
        <VaultCreationContent 
          className="px-6 pb-0" 
          onClose={handleClose}
        />
        <DrawerFooter>
          <DrawerClose asChild>
            <Button 
              variant="outline" 
              className="border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
