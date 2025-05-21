import React from 'react';
import { StepProps } from "../helpers/types";
import { Check, AlertCircle, ArrowRight, Calendar, Clock } from "lucide-react";

export const RecapStep: React.FC<StepProps> = ({ formData }) => {
  const formatDate = (date: Date | null): string => {
    if (!date) return "Not set";
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const InfoRowSimple = ({ label, value, isDescription = false, icon }: { 
    label: string, 
    value: any,
    isDescription?: boolean,
    icon?: React.ReactNode
  }) => (
    <div className={`${isDescription ? 'block space-y-2' : 'grid grid-cols-2 gap-4'} py-2 border-b last:border-b-0 border-teal-50`}>
      <span className="text-gray-600 font-medium flex items-center gap-2">
        {icon}
        {label}
      </span>
      {isDescription ? (
        <div className="w-full mt-1 p-3 rounded-md text-gray-900 whitespace-pre-wrap">
          {value}
        </div>
      ) : (
        <span className="text-gray-900">{value}</span>
      )}
    </div>
  );

  const Section = ({ title, children, icon }: { title: string, children: React.ReactNode, icon?: React.ReactNode }) => (
    <div className="bg-white rounded-lg shadow-sm border border-teal-100 p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
        {title}
        {icon}
      </h3>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
          Toggle Unverified Dependencies Summary
        </h2>
        <div className="px-3 py-1 text-sm bg-gray-50 text-gray-700 rounded-full border border-gray-200">
          Final Review
        </div>
      </div>

      <div className="grid gap-6">
        <Section 
          title="Proposal Details"
          icon={formData.proposalName ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <AlertCircle className="w-4 h-4 text-yellow-500" />
          )}
        >
          <InfoRowSimple 
            label="Name"
            value={formData.proposalName}
          />
          <InfoRowSimple 
            label="Description"
            value={formData.proposalDescription || "No description provided"}
            isDescription={true}
          />
        </Section>

        <Section 
          title="Proposal Timeline"
          icon={<Calendar className="w-4 h-4 text-teal-500" />}
        >
          <InfoRowSimple 
            label="Voting Start"
            value={formatDate(formData.votingStartDate)}
            icon={<Clock className="w-4 h-4 text-teal-400" />}
          />
          <InfoRowSimple 
            label="Voting End"
            value={formatDate(formData.votingEndDate)}
            icon={<Clock className="w-4 h-4 text-teal-400" />}
          />
          <InfoRowSimple 
            label="Execution Time"
            value={formatDate(formData.executionDate)}
            icon={<Clock className="w-4 h-4 text-teal-400" />}
          />
          <InfoRowSimple 
            label="Expiration Time"
            value={formatDate(formData.expirationDate)}
            icon={<Clock className="w-4 h-4 text-yellow-400" />}
          />
        </Section>

        <Section title="Unverified Dependencies Configuration">
          <InfoRowSimple 
            label="Allow Unverified Dependencies" 
            value={formData.allowUnverifiedDeps ? "Yes" : "No"}
          />
        </Section>
      </div>

      <div className="mt-8 p-4 bg-gradient-to-r from-yellow-50 to-teal-50 rounded-lg border border-yellow-100">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-yellow-800">
              Important Notice
            </p>
            <p className="text-sm text-yellow-700">
              This change will {formData.allowUnverifiedDeps ? 'allow' : 'disallow'} the use of unverified dependencies in this DAO.
              This modification will need to be approved through the DAO's governance process before taking effect.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              • Voting period: {formatDate(formData.votingStartDate)} → {formatDate(formData.votingEndDate)}<br />
              • If approved, executes at: {formatDate(formData.executionDate)}<br />
              • Expires if not executed by: {formatDate(formData.expirationDate)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 