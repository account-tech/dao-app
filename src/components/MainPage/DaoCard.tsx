import { DaoMetadata } from "@account.tech/dao";
import Image from "next/image";

interface DaoCardProps {
  dao: DaoMetadata;
  isFollowed?: boolean;
}

export function DaoCard({ dao, isFollowed = false }: DaoCardProps) {
  // Helper function to validate image URL
  const isValidImageUrl = (url: string | undefined) => {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
  };

  return (
    <div className="relative bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between gap-3">
        {/* Avatar and Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
            {isValidImageUrl(dao.image) ? (
              <Image
                src={dao.image}
                alt={dao.name}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl text-gray-400">
                {dao.name?.charAt(0)?.toUpperCase() || 'D'}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-medium text-base">{dao.name}</h3>
            <p className="text-sm text-gray-500">{dao.description}</p>
          </div>
        </div>

        {/* Follow Button */}
        <button 
          className={`px-3 py-1 text-xs rounded-full border ${
            isFollowed 
              ? 'border-gray-200 text-gray-600 bg-gray-50' 
              : 'border-blue-500 text-blue-500 hover:bg-blue-50'
          }`}
        >
          {isFollowed ? 'Followed' : 'Follow'}
        </button>
      </div>

      {/* Pink Gradient Line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-200 to-transparent rounded-b-lg"></div>
    </div>
  );
} 