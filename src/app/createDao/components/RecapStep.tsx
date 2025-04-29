import { StepProps } from "../helpers/types";

export const RecapStep: React.FC<StepProps> = ({ formData }) => {
  const formatBigInt = (value: bigint) => value.toString();
  const formatDays = (seconds: bigint) => (Number(seconds) / 86400).toString();

  const TruncatedText = ({ text, maxLength = 30 }: { text: string | undefined, maxLength?: number }) => {
    if (!text) return <span>Not set</span>;
    if (text.length <= maxLength) return <span>{text}</span>;
    return <span title={text}>{text.slice(0, maxLength)}...</span>;
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">DAO Configuration Summary</h2>

      <div className="space-y-6">
        <section className="space-y-2">
          <h3 className="text-lg font-semibold">Basic Information</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-500">Name:</span>
            <TruncatedText text={formData.name} />
            <span className="text-gray-500">Description:</span>
            <TruncatedText text={formData.description} maxLength={50} />
            <span className="text-gray-500">Image URL:</span>
            {formData.image ? (
              <a 
                href={formData.image} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:text-blue-800 truncate"
                title={formData.image}
              >
                <TruncatedText text={formData.image} />
              </a>
            ) : (
              <span>Not set</span>
            )}
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-lg font-semibold">Social Networks</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-500">Twitter:</span>
            <TruncatedText text={formData.twitter} />
            <span className="text-gray-500">Telegram:</span>
            <TruncatedText text={formData.telegram} />
            <span className="text-gray-500">Discord:</span>
            <TruncatedText text={formData.discord} />
            <span className="text-gray-500">GitHub:</span>
            <TruncatedText text={formData.github} />
            <span className="text-gray-500">Website:</span>
            <TruncatedText text={formData.website} />
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-lg font-semibold">DAO Type & Asset</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-500">Type:</span>
            <span className="capitalize">{formData.daoType}</span>
            {formData.daoType === 'coin' && (
              <>
                <span className="text-gray-500">Coin Type:</span>
                <TruncatedText text={formData.coinType} maxLength={40} />
              </>
            )}
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-lg font-semibold">Voting Configuration</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-500">Minimum Voting Power:</span>
            <span>{formatBigInt(formData.authVotingPower)}</span>
            <span className="text-gray-500">Maximum Voting Power:</span>
            <span>{formatBigInt(formData.maxVotingPower)}</span>
            <span className="text-gray-500">Minimum Votes:</span>
            <span>{formatBigInt(formData.minimumVotes)}</span>
            <span className="text-gray-500">Voting Quorum:</span>
            <span>{formatBigInt(formData.votingQuorum)}</span>
            <span className="text-gray-500">Voting Rule:</span>
            <span>{formData.votingRule === 1 ? "Quadratic" : "Linear"}</span>
            <span className="text-gray-500">Unstaking Cooldown:</span>
            <span>
              {formData.unstakingCooldown > BigInt(0)
                ? `${formatDays(formData.unstakingCooldown)} days`
                : "No cooldown"}
            </span>
          </div>
        </section>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-600">
          Please review all settings carefully before proceeding with DAO creation.
          These settings cannot be changed after the DAO is created.
        </p>
      </div>
    </div>
  );
}; 