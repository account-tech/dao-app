'use client';

import { useState, useEffect, useRef } from 'react';
import { useCurrentAccount } from "@mysten/dapp-kit";
import { DaoConfigFormData } from '../helpers/types';
import SteppedProgress from '@/components/CommonProposalSteps/Stepper';
import { ConfigProposalStep } from "@/components/CommonProposalSteps/ConfigProposalStep";
import { Dep } from "@account.tech/core";
import { validateStep } from '../helpers/validation';

const DependencyConfigView = () => {
  const currentAccount = useCurrentAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentDeps, setCurrentDeps] = useState<Dep[]>([]);
  const [formData, setFormData] = useState<DaoConfigFormData>({
    proposalName: '',
    proposalDescription: '',
    executionDate: new Date(),
    expirationDate: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 7 days in milliseconds
  });

  
  const updateFormData = (updates: Partial<DaoConfigFormData>) => {
    setFormData((prev: any) => ({
      ...prev,
      ...updates
    }));
  };

  const handleComplete = () => {
    setIsCompleted(true);
  };

  const steps = [
    {
      title: "Config Proposal",
      description: "Configure your proposal details",
      component: (
        <ConfigProposalStep<DaoConfigFormData> 
          formData={formData} 
          updateFormData={updateFormData} 
        />
      )
    },
  ];

  if (!currentAccount) {
    return (
      <div className="min-h-screen">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please Connect Your Wallet</h1>
            <p className="text-gray-600">You need to connect your wallet to configure dependencies.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && !currentDeps.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-16 px-4">
        <SteppedProgress<DaoConfigFormData>
          steps={steps}
          onComplete={handleComplete}
          isLoading={isLoading}
          isCompleted={isCompleted}
          formData={formData}
          validateStep={validateStep}
        />
      </div>
    </div>
  );
};

export default DependencyConfigView; 