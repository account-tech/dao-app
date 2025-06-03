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
    // First scroll with a small delay
    const firstScrollId = setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }, 100);

    // Backup scroll after a longer delay to ensure content is loaded
    const secondScrollId = setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }, 100);

    return () => {
      clearTimeout(firstScrollId);
      clearTimeout(secondScrollId);
    };
  }, [pathname]);

  // Special pages that should use simple layout instead of gradient background
  const specialPages = [
    '/settings/requestConfigDao',
    '/settings/requestToggleUnverifiedDeps',
    '/settings/requestConfigDeps',
    '/wallet/requestWithdrawAndTransfer',
    '/wallet/requestWithdrawAndVest',
    '/requestWithdrawAndTransferToVault',
    '/requestSpendAndTransfer',
    '/requestSpendAndVest',
    '/requestSpendAndAirdrop',

  ];
  
  const isSpecialPage = specialPages.some(page => pathname.includes(page));

  if (isSpecialPage) {
    return (
      <div className="min-h-screen">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom,_#2dd4bf_0%,_#128077_10%)]">
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
