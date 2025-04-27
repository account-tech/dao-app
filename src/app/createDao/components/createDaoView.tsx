"use client";
import { useState } from "react";
import { Transaction } from "@mysten/sui/transactions";
import {
  useSuiClient,
  useCurrentAccount,
  useSignTransaction,
} from "@mysten/dapp-kit";
import { toast } from "sonner"
import { DaoFormData } from "../helpers/types";
import SteppedProgress from "./Stepper";
import { SelectTypeOfDaoStep } from "./SelectTypeOfDaoStep";
import { signAndExecute, handleTxResult } from "@/utils/tx/Tx";
import { useRouter } from "next/navigation";
import { useDaoClient } from "@/hooks/useDaoClient";


const CreateDaoView = () => {
  const router = useRouter();
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const signTransaction = useSignTransaction();
  const { createDao, getUserDaos } = useDaoClient();
  const [isCreating, setIsCreating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const [formData, setFormData] = useState<DaoFormData>({
    teamName: "",
    members: [],
    threshold: 1,
  });

  const updateFormData = (updates: Partial<DaoFormData>) => {
    setFormData(current => ({
      ...current,
      ...updates
    }));
  };

  const handleCreateDao = async () => {
    if (!currentAccount) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsCreating(true);
    try {
      const tx = new Transaction();

      // Check if user exists by checking if they have any daos ?
      const existingDaos = await getUserDaos(currentAccount.address);
      // If user doesn't exist (no daos), we'll create one along with the dao
      const newAccountConfig = existingDaos.length === 0 ? {
        username: currentAccount.address,
        profilePicture: ""
      } : undefined;

      // call createDao here ?

      const result = await signAndExecute({
        suiClient,
        currentAccount,
        tx,
        signTransaction,
        options: { showEffects: true },
        toast,
      });

      handleTxResult(result, toast);
      setIsCompleted(true);

      setTimeout(() => {
        router.push("/");
      }, 500);
    } catch (error) {
      setIsCompleted(false);
      toast.error(error instanceof Error ? error.message : "Unknown error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  const steps = [
    {
      title: "Select the type of DAO",
      description: "What type of DAO do you want to create?",
      component: <SelectTypeOfDaoStep formData={formData} updateFormData={updateFormData} />
    },
  ];

  if (!currentAccount) {
    return (
      <>
        <div className="min-h-screen bg-gray-50">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Please Connect Your Wallet</h1>
              <p className="text-gray-600">You need to connect your wallet to create a DAO.</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-32 px-4">
          <SteppedProgress
            steps={steps}
            onComplete={handleCreateDao}
            isLoading={isCreating}
            isCompleted={isCompleted}
            formData={formData}
          />
        </div>
      </div>
    </>
  );
};

export default CreateDaoView;