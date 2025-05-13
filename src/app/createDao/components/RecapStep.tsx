import { StepProps } from "../helpers/types";
import { ExternalLink, Check, AlertCircle } from "lucide-react";

// Constants for time conversion (matching UnstakingCooldownStep)
const MILLISECONDS_PER_MINUTE = BigInt(60 * 1000);

const formatDuration = (milliseconds: bigint): string => {
  const totalMinutes = Number(milliseconds) / Number(MILLISECONDS_PER_MINUTE);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = Math.floor(totalMinutes % 60);
  
  const parts: string[] = [];
  
  if (days > 0) {
    parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  }
  
  if (hours > 0 || days > 0) {
    parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  }
  
  parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  
  return parts.join(', ');
};

export const RecapStep: React.FC<StepProps> = ({ formData }) => {
  const TruncatedText = ({ text, maxLength = 30 }: { text: string | undefined, maxLength?: number }) => {
    if (!text) return <span className="text-gray-400 italic">Not set</span>;
    if (text.length <= maxLength) return <span>{text}</span>;
    return (
      <div className="group relative cursor-help">
        <span>{text.slice(0, maxLength)}...</span>
        <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-sm rounded-md py-1 px-2 -top-1 left-full ml-2 w-64 break-words">
          {text}
        </div>
      </div>
    );
  };

  const ExternalLinkDisplay = ({ url, text }: { url: string, text: string }) => (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 text-teal-600 hover:text-teal-800 group"
    >
      <TruncatedText text={text} />
      <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
    </a>
  );

  const InfoRow = ({ label, value, important = false }: { label: string, value: React.ReactNode, important?: boolean }) => (
    <div className="grid grid-cols-2 gap-4 py-2 border-b last:border-b-0 border-teal-50">
      <span className="text-gray-600 font-medium">{label}</span>
      <div className={important ? "font-semibold text-teal-700" : ""}>{value}</div>
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
          DAO Configuration Summary
        </h2>
        <div className="px-3 py-1 text-sm bg-gray-50 text-gray-700 rounded-full border border-gray-200">
          Final Review
        </div>
      </div>

      <div className="grid gap-6">
        <Section 
          title="Basic Information"
          icon={formData.name && formData.description ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <AlertCircle className="w-4 h-4 text-yellow-500" />
          )}
        >
          <InfoRow label="Name" value={<TruncatedText text={formData.name} />} important />
          <InfoRow 
            label="Description" 
            value={<TruncatedText text={formData.description} maxLength={50} />} 
          />
          <InfoRow 
            label="Image URL" 
            value={formData.image ? (
              <ExternalLinkDisplay url={formData.image} text={formData.image} />
            ) : (
              <span className="text-gray-400 italic">Not set</span>
            )}
          />
        </Section>

        <Section title="Social Networks">
          {['twitter', 'telegram', 'discord', 'github', 'website'].map((network) => (
            <InfoRow
              key={network}
              label={network.charAt(0).toUpperCase() + network.slice(1)}
              value={
                formData[network as keyof typeof formData] ? (
                  <ExternalLinkDisplay 
                    url={formData[network as keyof typeof formData] as string} 
                    text={formData[network as keyof typeof formData] as string}
                  />
                ) : (
                  <span className="text-gray-400 italic">Not set</span>
                )
              }
            />
          ))}
        </Section>

        <Section title="DAO Type & Asset">
          <InfoRow 
            label="Type" 
            value={<span className="capitalize">{formData.daoType}</span>}
            important
          />
          {formData.daoType === 'coin' && (
            <InfoRow 
              label="Coin Type" 
              value={<TruncatedText text={formData.coinType} maxLength={40} />}
              important
            />
          )}
        </Section>

        <Section title="Voting Configuration">
          <InfoRow 
            label="Voting Rule" 
            value={
              <span className={`px-2 py-0.5 rounded-full text-sm ${
                formData.votingRule === 1 
                  ? "bg-gray-100 text-gray-700 font-medium" 
                  : "bg-gray-50 text-gray-600"
              }`}>
                {formData.votingRule === 1 ? "Quadratic" : "Linear"}
              </span>
            }
            important
          />
          <InfoRow 
            label="Authentication Voting Power" 
            value={formData.authVotingPower.toString()}
            important
          />
          <InfoRow 
            label="Maximum Voting Power" 
            value={formData.maxVotingPower.toString()}
            important
          />
          <InfoRow 
            label="Minimum Votes" 
            value={formData.minimumVotes.toString()}
          />
          <InfoRow 
            label="Voting Quorum" 
            value={formData.votingQuorum.toString()}
          />
          <InfoRow 
            label="Unstaking Cooldown" 
            value={
              formData.unstakingCooldown > BigInt(0) ? (
                <span className="font-medium text-gray-900">
                  {formatDuration(formData.unstakingCooldown)}
                </span>
              ) : (
                <span className="text-gray-400 italic">No cooldown</span>
              )
            }
            important
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
              Please review all settings carefully. Once the DAO is created, these configurations 
              can only be modified through a DAO config proposal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 