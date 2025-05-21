import { DaoMetadata } from "@account.tech/dao";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BasicInformationSectionProps {
  dao: DaoMetadata;
}

const formatUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
};

export function BasicInformationSection({ dao }: BasicInformationSectionProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-6 text-gray-900 text-center">DAO Metadata</h2>
      <div className="space-y-6">
        {/* DAO Image */}
        <div className="flex justify-center">
          <div className="relative overflow-hidden border-4 border-white shadow-lg bg-white w-20 h-20 rounded-2xl">
            {dao.image && (dao.image?.startsWith('/') || dao.image?.startsWith('http')) ? (
              <img
                src={dao.image}
                alt={`${dao.name} logo`}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <span className="text-2xl">🏛️</span>
              </div>
            )}
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              DAO Name
            </label>
            <input
              type="text"
              value={dao.name}
              disabled
              className="w-full px-3 py-2 border rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={dao.description}
              disabled
              rows={3}
              className="w-full px-3 py-2 border rounded-lg bg-gray-50"
            />
          </div>
        </div>

        {/* Social Links */}
        <div className="space-y-4 pt-4 border-t">
          <label className="block text-sm font-medium text-gray-700">
            Social Links
          </label>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex gap-2 items-center">
              <TooltipProvider>
                {/* Twitter */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      className={`px-2 rounded-full transition-colors ${dao.twitter ? 'hover:bg-gray-100 text-gray-700' : 'text-gray-300'}`}
                      onClick={() => dao.twitter && window.open(formatUrl(dao.twitter), '_blank')}
                      disabled={!dao.twitter}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {dao.twitter ? 'Twitter' : 'Twitter not set'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <input
                type="text"
                value={dao.twitter || ''}
                disabled
                className="flex-1 px-3 py-2 border rounded-lg bg-gray-50"
              />
            </div>

            <div className="flex gap-2 items-center">
              <TooltipProvider>
                {/* Discord */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      className={`p-2 rounded-full transition-colors ${dao.discord ? 'hover:bg-gray-100 text-gray-700' : 'text-gray-300'}`}
                      onClick={() => dao.discord && window.open(formatUrl(dao.discord), '_blank')}
                      disabled={!dao.discord}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612"/>
                      </svg>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {dao.discord ? 'Discord' : 'Discord not set'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <input
                type="text"
                value={dao.discord || ''}
                disabled
                className="flex-1 px-3 py-2 border rounded-lg bg-gray-50"
              />
            </div>

            <div className="flex gap-2 items-center">
              <TooltipProvider>
                {/* Telegram */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      className={`p-2 rounded-full transition-colors ${dao.telegram ? 'hover:bg-gray-100 text-gray-700' : 'text-gray-300'}`}
                      onClick={() => dao.telegram && window.open(formatUrl(dao.telegram), '_blank')}
                      disabled={!dao.telegram}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2z"/></svg>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {dao.telegram ? 'Telegram' : 'Telegram not set'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <input
                type="text"
                value={dao.telegram || ''}
                disabled
                className="flex-1 px-3 py-2 border rounded-lg bg-gray-50"
              />
            </div>

            <div className="flex gap-2 items-center">
              <TooltipProvider>
                {/* GitHub */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      className={`p-2 rounded-full transition-colors ${dao.github ? 'hover:bg-gray-100 text-gray-700' : 'text-gray-300'}`}
                      onClick={() => dao.github && window.open(formatUrl(dao.github), '_blank')}
                      disabled={!dao.github}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {dao.github ? 'GitHub' : 'GitHub not set'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <input
                type="text"
                value={dao.github || ''}
                disabled
                className="flex-1 px-3 py-2 border rounded-lg bg-gray-50"
              />
            </div>

            <div className="flex gap-2 items-center">
              <TooltipProvider>
                {/* Website */}
                <Tooltip>   
                  <TooltipTrigger asChild>
                    <button 
                      className={`p-2 rounded-full transition-colors ${dao.website ? 'hover:bg-gray-100 text-gray-700' : 'text-gray-300'}`}
                      onClick={() => dao.website && window.open(formatUrl(dao.website), '_blank')}
                      disabled={!dao.website}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {dao.website ? 'Website' : 'Website not set'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <input
                type="text"
                value={dao.website || ''}
                disabled
                className="flex-1 px-3 py-2 border rounded-lg bg-gray-50"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 