"use client";

import { useParams } from "next/navigation";

export default function ProposalPage() {
  const params = useParams();
  const intentKey = params.key as string;

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Proposal Details</h1>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 mb-2">Intent Key:</p>
          <p className="font-mono text-sm break-all">{intentKey}</p>
        </div>
      </div>
    </div>
  );
}
