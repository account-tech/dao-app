import React from "react";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { SUIVISION_TX_LINK } from "@/constants";

interface ToastNotificationProps {
  digest: string;
  isDryRun?: boolean;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ digest, isDryRun = false }) => {
  const explorerUrl = `${SUIVISION_TX_LINK}${digest}`;
  const shortDigest = `${digest.slice(0, 8)}...${digest.slice(-8)}`;
  
  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs">
        {"View on explorer: "}
        <Link
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1"
        >
          <span className="border-b">{shortDigest}</span>
          <ExternalLink size={12} className="ml-1" />
        </Link>
      </div>
      {isDryRun && (
        <div className="text-xs text-amber-500">
          The transaction is being executed.
        </div>
      )}
    </div>
  );
};

export default ToastNotification;
