import { Skeleton } from "@/components/ui/skeleton"
import React from "react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-100 via-80% to-teal-200">
      <div className="container mx-auto py-32 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Stepper skeleton */}
          <div className="flex items-center justify-between gap-3">
            {[...Array(5)].map((_, i) => (
              <React.Fragment key={`step-${i}`}>
                <div className="relative">
                  <Skeleton className="w-10 h-10 rounded-full bg-teal-500/20" />
                </div>
                {i < 7 && (
                  <Skeleton className="w-full h-1 rounded-full bg-teal-200/50" />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Title and description skeleton */}
          <div className="mt-8 text-center">
            <Skeleton className="h-8 w-64 mx-auto mb-2" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>

          {/* Content skeleton */}
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            {/* Radio group skeleton */}
            <div className="space-y-6">
              <div className="space-y-4">
                <Skeleton className="h-4 w-48" />
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="w-4 h-4 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Skeleton className="w-4 h-4 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </div>

              {/* Input field skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>

            {/* Buttons skeleton */}
            <div className="flex justify-end gap-4 mt-6">
              <Skeleton className="h-10 w-24 bg-teal-500/20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}