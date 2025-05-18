'use client';

import { useState, useEffect, useRef } from 'react';
import { useCurrentAccount } from "@mysten/dapp-kit";
import { ConfigProposalStep } from '@/components/CommonProposalSteps/ConfigProposalStep';
import { ToggleUnverifiedFormData } from '../helpers/types';
import SteppedProgress from '@/components/CommonProposalSteps/Stepper';
import { useDaoStore } from "@/store/useDaoStore";
import { validateStep } from '../helpers/validation';

const ToggleUnverifiedDepsView = () => {
  const currentAccount = useCurrentAccount();
  const client = useDaoStore(state => state.client);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [formData, setFormData] = useState<ToggleUnverifiedFormData>({
    proposalName: '',
    proposalDescription: '',
    executionDate: new Date(),
    expirationDate: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 7 days in milliseconds
    allowUnverifiedDeps: false
  });

  useEffect(() => {
    if (client) {
      const currentStatus = client.account.unverifiedDepsAllowed;
      setFormData(prev => ({
        ...prev,
        allowUnverifiedDeps: !currentStatus // We want to toggle the current status
      }));
    }
  }, [client]);

  const updateFormData = (updates: Partial<ToggleUnverifiedFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  };

  const handleComplete = async () => {
    
  };

  const validateStepWrapper = (stepIndex: number) => {
    return validateStep(stepIndex, formData);
  };

  const steps = [
    {
      title: "Config Proposal",
      description: "Configure your proposal details",
      component: (
        <ConfigProposalStep 
          formData={formData} 
          updateFormData={updateFormData} 
        />
      )
    },
  ];

  if (!currentAccount) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please Connect Your Wallet</h1>
            <p className="text-gray-600">You need to connect your wallet to toggle unverified dependencies.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-16 px-4">
        <SteppedProgress<ToggleUnverifiedFormData>
          steps={steps}
          onComplete={handleComplete}
          isLoading={isLoading}
          isCompleted={isCompleted}
          formData={formData}
          validateStep={validateStepWrapper}
        />
      </div>
    </div>
  );
};

export default ToggleUnverifiedDepsView; 