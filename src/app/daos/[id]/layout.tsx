'use client';

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

// Custom hook for height-based media queries
const useScreenHeight = () => {
  const [screenState, setScreenState] = useState({
    isSmallHeight: false,
    isLargeHeight: false,
    isMobile: false
  });

  useEffect(() => {
    const checkDimensions = () => {
      const height = window.innerHeight;
      const width = window.innerWidth;
      
      setScreenState({
        isSmallHeight: height < 768,
        isLargeHeight: height > 950 && width > 640,
        isMobile: width <= 640
      });
    };

    // Initial check
    checkDimensions();

    // Add event listener
    window.addEventListener('resize', checkDimensions);

    // Cleanup
    return () => window.removeEventListener('resize', checkDimensions);
  }, []);

  return screenState;
};

export default function DaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSmallHeight, isLargeHeight, isMobile } = useScreenHeight();
  const pathname = usePathname();
  const router = useRouter();

  // Enhanced scroll behavior
  useEffect(() => {
    // Immediate scroll without smooth behavior
    window.scrollTo(0, 0);

    // Backup scroll after a short delay to ensure content is loaded
    const timeoutId = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-pink-100">
      {/* Top Section */}
      <div 
        className={`bg-gradient-to-b from-white to-transparent ${
          isSmallHeight ? 'h-[26vh]' : 
          isLargeHeight ? 'h-[15vh]' : 
          isMobile ? 'h-[20vh]' : 
          'h-[20vh]'
        }`}
      />

      {/* Content */}
      <div 
        className="relative" 
        style={{ 
          marginTop: isSmallHeight ? '-2rem' : 
                    isLargeHeight ? '-2rem' : 
                    isMobile ? '-2.25rem' : 
                    '-2.5rem'
        }}
      >
        <div className="px-4 md:px-20 pb-20 min-h-[90vh] pt-12 bg-white rounded-t-[32px]">
          {children}
        </div>
      </div>
    </div>
  );
}
