import { DaoMetadata } from "@account.tech/dao";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface DaoCardProps {
  dao: DaoMetadata;
  isFollowed?: boolean;
  width?: string;
}

export function DaoCard({ dao, isFollowed = false, width = "265px" }: DaoCardProps) {
  const router = useRouter();

  // Helper function to validate image URL
  const isValidImageUrl = (url: string | undefined) => {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
  };

  const truncateText = (text: string | undefined, maxLength: number) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  const handleClick = async () => {
    router.push(`/daos/${dao.id}`);
  };

  return (
    <div 
      onClick={handleClick}
      className="group relative bg-white rounded-t-2xl rounded-br-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
      style={{ width }}
    >
      <div className="p-6">
        {/* Top Section with Image and Follow Button */}
        <div className="flex justify-between items-start">
          {/* Large Square Image */}
          <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center">
            {isValidImageUrl(dao.image) ? (
              <Image
                src={dao.image}
                alt={dao.name}
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl text-gray-400">
                {dao.name?.charAt(0)?.toUpperCase() || 'D'}
              </span>
            )}
          </div>

          {/* Follow Button */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
            }}
            className={`px-4 py-1.5 text-sm font-medium rounded-full border ${
              isFollowed 
                ? 'border-gray-200 text-gray-600 bg-gray-50' 
                : 'border-blue-500 text-blue-500 hover:bg-blue-50'
            }`}
          >
            {isFollowed ? 'Followed' : 'Follow'}
          </button>
        </div>

        {/* DAO Info - Fixed Height */}
        <div className="min-h-[75px] mt-5">
          <h3 className="font-semibold text-lg" title={dao.name}>
            {truncateText(dao.name, 30)}
          </h3>
          <p className="text-sm text-gray-600 mt-2 line-clamp-2" title={dao.description}>
            {dao.description || "No description available"}
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="px-6 py-4 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm font-medium">0</div>
            <div className="text-sm text-gray-500">followers</div>
          </div>
          <div>
            <div className="text-sm font-medium">0</div>
            <div className="text-sm text-gray-500">proposals</div>
          </div>
          <div>
            <div className="text-sm font-medium">0</div>
            <div className="text-sm text-gray-500">votes</div>
          </div>
        </div>
      </div>

      {/* Pink Gradient Line */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-200 to-transparent"></div>
    </div>
  );
} 