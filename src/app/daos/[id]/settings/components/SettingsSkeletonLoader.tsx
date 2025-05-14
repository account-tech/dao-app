import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";

export function SettingsSkeletonLoader() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 text-center">DAO Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Section - DAO Information */}
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-900 text-center">Basic Information</h2>
            <div className="space-y-6">
              {/* DAO Image */}
              <div className="flex justify-center mb-6">
                <Skeleton className="w-20 h-20 rounded-2xl" />
              </div>

              <div>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-900 text-center">Social Links</h2>
            <div className="grid grid-cols-1 gap-4">
              {/* Twitter */}
              <div className="flex gap-2 items-center">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-10 flex-1" />
              </div>
              {/* Discord */}
              <div className="flex gap-2 items-center">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-10 flex-1" />
              </div>
              {/* Telegram */}
              <div className="flex gap-2 items-center">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-10 flex-1" />
              </div>
              {/* GitHub */}
              <div className="flex gap-2 items-center">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-10 flex-1" />
              </div>
              {/* Website */}
              <div className="flex gap-2 items-center">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-10 flex-1" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - DAO Parameters */}
        <div className="bg-white rounded-lg shadow p-6 relative">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 text-center">Governance Parameters</h2>
          <div className="space-y-6 pb-16">
            {/* Asset Type */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Grid Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Auth Voting Power */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>

              {/* Maximum Voting Power */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>

              {/* Minimum Votes Required */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>

              {/* Voting Rule */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>

              {/* Unstaking Cooldown */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            </div>

            {/* Voting Quorum with Slider */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
              <div className="space-y-6 pt-2">
                <Slider
                  value={[0]}
                  max={100}
                  min={0}
                  step={1}
                  disabled
                />
                <div className="text-center">
                  <Skeleton className="h-8 w-16 mx-auto" />
                  <Skeleton className="h-4 w-64 mx-auto mt-2" />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Buttons */}
          <div className="absolute bottom-6 left-6 right-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>

      {/* Dependencies Section */}
      <div className="mt-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-9 w-20" />
          </div>
          
          {/* Tabs */}
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            
            {/* Content */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-9 w-24" />
              </div>
              
              {/* Dependency List */}
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center py-2">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-64" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-24" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
