import React, { useState } from 'react';
import { Check, AlertCircle, CalendarIcon, Wallet, Send, Users, ChevronDown, ChevronUp } from "lucide-react";
import { useParams } from 'next/navigation';
import { WithdrawFormData, CoinSelection, Recipient } from '../helpers/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const formatCoinType = (coinType: string) => {
  if (!coinType) return "Not set";
  const match = coinType.match(/::([^:]+)$/);
  return match ? match[1] : coinType;
};

interface RecapStepProps {
  formData: WithdrawFormData;
  updateFormData: (updates: Partial<WithdrawFormData>) => void;
}

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

const InfoRow = ({ label, value, isDescription = false }: { 
  label: string, 
  value: any,
  isDescription?: boolean
}) => (
  <div className={`${isDescription ? 'block space-y-2' : 'grid grid-cols-2 gap-4'} py-2 border-b last:border-b-0 border-teal-50`}>
    <span className="text-gray-600 font-medium">{label}</span>
    {isDescription ? (
      <div className="w-full mt-1 p-3 rounded-md text-gray-900 whitespace-pre-wrap">
        {value}
      </div>
    ) : (
      <span className="text-gray-900">
        {label === "Type" ? formatCoinType(value) : value}
      </span>
    )}
  </div>
);

const formatAddress = (address: string) => {
  if (!address) return "Not set";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const RecipientsList = ({ recipients, selectedCoin }: { recipients: Recipient[], selectedCoin: any }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const recipientsPerPage = 10;

  const visibleRecipients = recipients.slice(0, 3);
  const remainingRecipients = recipients.slice(3);
  const totalPages = Math.ceil(remainingRecipients.length / recipientsPerPage);
  
  const paginatedRecipients = remainingRecipients.slice(
    (currentPage - 1) * recipientsPerPage,
    currentPage * recipientsPerPage
  );

  const RecipientItem = ({ recipient, index }: { recipient: Recipient, index: number }) => (
    <div key={index} className="pl-4 py-2 border-l-2 border-blue-100 bg-blue-50/30 rounded-r-md">
      <div className="flex justify-between items-center">
        <span className="text-sm font-mono text-gray-700">
          {formatAddress(recipient.address)}
        </span>
        <span className="text-sm font-medium text-blue-700">
          {recipient.amount} {selectedCoin ? formatCoinType(selectedCoin.coinType) : 'tokens'}
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Always show first 3 recipients */}
      <div className="space-y-2">
        {visibleRecipients.map((recipient, index) => (
          <RecipientItem key={index} recipient={recipient} index={index} />
        ))}
      </div>

      {/* Show expandable section if there are more than 3 recipients */}
      {remainingRecipients.length > 0 && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="additional-recipients">
            <AccordionTrigger className="text-sm">
              {remainingRecipients.length} more recipient{remainingRecipients.length > 1 ? 's' : ''}
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              {/* Paginated recipients */}
              <div className="space-y-2">
                {paginatedRecipients.map((recipient, index) => (
                  <RecipientItem 
                    key={3 + (currentPage - 1) * recipientsPerPage + index} 
                    recipient={recipient} 
                    index={3 + (currentPage - 1) * recipientsPerPage + index} 
                  />
                ))}
              </div>

              {/* Pagination if needed */}
              {totalPages > 1 && (
                <div className="flex justify-center pt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}

              {/* Show current page info if paginated */}
              {totalPages > 1 && (
                <div className="text-center text-sm text-gray-600">
                  Showing {((currentPage - 1) * recipientsPerPage) + 1}-{Math.min(currentPage * recipientsPerPage, remainingRecipients.length)} of {remainingRecipients.length} additional recipients
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
};

export const RecapStep: React.FC<RecapStepProps> = ({ formData }) => {
  const params = useParams();
  const vaultName = params.vault as string;
  const hasSelectedCoins = formData.selectedCoins.length > 0 && formData.selectedCoins[0].coinType !== '';
  const hasRecipients = formData.recipients.length > 0 && formData.recipients[0].address !== '';

  const totalAirdropAmount = formData.recipients.reduce((total, recipient) => total + recipient.amount, 0);
  const selectedCoin = formData.selectedCoins[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
          Airdrop Request Summary
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
          <InfoRow 
            label="Name"
            value={formData.proposalName || "Not set"}
          />
          <InfoRow 
            label="Description"
            value={formData.proposalDescription || "Not set"}
            isDescription={true}
          />
        </Section>

        <Section 
          title="Airdrop Details"
          icon={<Send className="w-4 h-4 text-teal-500" />}
        >
          <InfoRow 
            label="Source"
            value={`${vaultName} Vault`}
          />
          <InfoRow 
            label="Destination"
            value="Multiple Recipients"
          />
          <InfoRow 
            label="Distribution Type"
            value="Token Airdrop"
          />
          <InfoRow 
            label="Total Recipients"
            value={`${formData.recipients.length} address${formData.recipients.length > 1 ? 'es' : ''}`}
          />
          <InfoRow 
            label="Total Amount"
            value={`${totalAirdropAmount} ${selectedCoin ? formatCoinType(selectedCoin.coinType) : 'tokens'}`}
          />
        </Section>

        <Section 
          title="Selected Coin"
          icon={<Wallet className="w-4 h-4 text-teal-500" />}
        >
          {hasSelectedCoins ? (
            <div className="pl-4 py-2 border-l-2 border-teal-100">
              <InfoRow 
                label="Coin Type"
                value={formatCoinType(selectedCoin.coinType)}
              />
              <InfoRow 
                label="Total to Distribute"
                value={`${totalAirdropAmount} ${formatCoinType(selectedCoin.coinType)}`}
              />
              {selectedCoin.balance !== undefined && (
                <InfoRow 
                  label="Available Balance"
                  value={`${selectedCoin.balance} ${formatCoinType(selectedCoin.coinType)}`}
                />
              )}
            </div>
          ) : (
            <div className="pl-4 py-2 border-l-2 border-yellow-100 bg-yellow-50 rounded-r-md">
              <span className="text-yellow-700">No coin selected</span>
            </div>
          )}
        </Section>

        <Section 
          title="Recipients & Amounts"
          icon={<Users className="w-4 h-4 text-teal-500" />}
        >
          {hasRecipients ? (
            <div className="space-y-3">
              <RecipientsList recipients={formData.recipients} selectedCoin={selectedCoin} />
              
              <div className="pt-2 border-t border-gray-200">
                <InfoRow 
                  label="Total Recipients"
                  value={`${formData.recipients.length} address${formData.recipients.length > 1 ? 'es' : ''}`}
                />
                <InfoRow 
                  label="Total Distribution"
                  value={`${totalAirdropAmount} ${selectedCoin ? formatCoinType(selectedCoin.coinType) : 'tokens'}`}
                />
              </div>
            </div>
          ) : (
            <div className="pl-4 py-2 border-l-2 border-yellow-100 bg-yellow-50 rounded-r-md">
              <span className="text-yellow-700">No recipients added</span>
            </div>
          )}
        </Section>

        <Section 
          title="Proposal Timeline"
          icon={<CalendarIcon className="w-4 h-4 text-teal-500" />}
        >
          <InfoRow 
            label="Voting Start"
            value={formData.votingStartDate ? formatDate(formData.votingStartDate) : "Not set"}
          />
          <InfoRow 
            label="Voting End"
            value={formData.votingEndDate ? formatDate(formData.votingEndDate) : "Not set"}
          />
          <InfoRow 
            label="Execution Date"
            value={formData.executionDate ? formatDate(formData.executionDate) : "Not set"}
          />
          <InfoRow 
            label="Expiration Date"
            value={formData.expirationDate ? formatDate(formData.expirationDate) : "Not set"}
          />
        </Section>
      </div>

      {(!hasSelectedCoins || !hasRecipients) && (
        <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">
                Incomplete Airdrop Setup
              </p>
              <div className="text-sm text-yellow-700 mt-1 space-y-1">
                {!hasSelectedCoins && (
                  <p>• You haven't selected a coin for the airdrop.</p>
                )}
                {!hasRecipients && (
                  <p>• You haven't added any recipients.</p>
                )}
                <p className="mt-2">
                  Go back to the previous steps to complete your airdrop setup.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {hasSelectedCoins && selectedCoin.balance !== undefined && totalAirdropAmount > selectedCoin.balance && (
        <div className="mt-8 p-4 bg-red-50 rounded-lg border border-red-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">
                Insufficient Balance
              </p>
              <p className="text-sm text-red-700 mt-1">
                Total airdrop amount ({totalAirdropAmount} {formatCoinType(selectedCoin.coinType)}) exceeds available balance ({selectedCoin.balance} {formatCoinType(selectedCoin.coinType)}). 
                Please adjust the amounts or select a different coin.
              </p>
            </div>
          </div>
        </div>
      )}

      {hasSelectedCoins && hasRecipients && (selectedCoin.balance === undefined || totalAirdropAmount <= selectedCoin.balance) && (
        <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg border border-blue-100">
          <div className="flex items-start gap-3">
            <Send className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-blue-800">
                Airdrop Ready for Submission
              </p>
              <p className="text-sm text-blue-700">
                This request will airdrop a total of {totalAirdropAmount} {selectedCoin ? formatCoinType(selectedCoin.coinType) : 'tokens'} from the <strong>{vaultName}</strong> vault 
                to {formData.recipients.length} recipient{formData.recipients.length > 1 ? 's' : ''} through the governance process.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                • Voting period: {formData.votingStartDate ? formatDate(formData.votingStartDate) : "Not set"} → {formData.votingEndDate ? formatDate(formData.votingEndDate) : "Not set"}<br />
                • If approved, executes at: {formData.executionDate ? formatDate(formData.executionDate) : "Not set"}<br />
                • Expires if not executed by: {formData.expirationDate ? formatDate(formData.expirationDate) : "Not set"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
