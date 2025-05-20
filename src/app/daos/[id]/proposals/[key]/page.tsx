"use client";

import { useParams } from "next/navigation";
import { ProposalInfo } from "./components/ProposalInfo";
import { ProposalDetails } from "./components/ProposalDetails";

export default function ProposalPage() {
  const params = useParams();
  const daoId = params.id as string;
  const intentKey = params.key as string;

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left side - Proposal details */}
        <div>
          <h1 className="text-2xl font-bold mb-4">Proposal Details</h1>
          <ProposalDetails daoId={daoId} intentKey={intentKey} />
        </div>

        {/* Right side - Voting interface */}
        <div>
          <h1 className="text-2xl font-bold mb-4">Voting</h1>
          <ProposalInfo daoId={daoId} intentKey={intentKey} />
        </div>
      </div>
    </div>
  );
}
