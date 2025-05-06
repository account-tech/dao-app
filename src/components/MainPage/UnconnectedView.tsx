"use client";

import { ConnectModal } from '@mysten/dapp-kit';
import { Button } from '@/components/ui/button';
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

// Window size hook
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState<{
    width: number | undefined;
    height: number | undefined;
  }>({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    window.addEventListener("resize", handleResize);
    handleResize();
    
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
};

const GRID_SIZE = 32;
const BEAM_OFFSET = 1;

export function UnconnectedView() {
  const { width } = useWindowSize();
  const numColumns = width ? Math.floor(width / GRID_SIZE) : 0;

  return (
    <section className="relative overflow-hidden bg-white min-h-screen flex items-center justify-center">
      {/* Content */}
      <div className="relative z-20 mx-auto flex max-w-6xl flex-col items-center justify-center px-4 py-12 md:px-8">
        <motion.div
          initial={{ y: 25, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.25, ease: "easeInOut" }}
          className="relative"
        >
          <span className="relative z-10 mb-4 inline-block rounded-full border border-pink-200 bg-pink-50 px-3 py-1.5 text-xs text-pink-600">
            Welcome to DAO Dapp
            <span className="absolute bottom-0 left-3 right-3 h-[1px] bg-gradient-to-r from-pink-500/0 via-pink-500/50 to-pink-500/0" />
          </span>
        </motion.div>

        <motion.h1
          initial={{ y: 25, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.25, delay: 0.25, ease: "easeInOut" }}
          className="mb-3 text-center text-3xl font-bold leading-tight text-gray-900 sm:text-4xl sm:leading-tight md:text-5xl md:leading-tight lg:text-7xl lg:leading-tight"
        >
          Decentralized Governance <br />Made Simple
        </motion.h1>

        <motion.p
          initial={{ y: 25, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.25, delay: 0.5, ease: "easeInOut" }}
          className="mb-9 max-w-2xl text-center text-base leading-relaxed text-gray-600 sm:text-lg md:text-lg md:leading-relaxed"
        >
          Create, manage, and participate in DAOs with an intuitive and powerful platform.
          Connect your wallet to start your decentralized journey.
        </motion.p>

        <motion.div
          initial={{ y: 25, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.25, delay: 0.75, ease: "easeInOut" }}
          className="flex flex-col items-center gap-6 sm:flex-row"
        >
          <ConnectModal
            trigger={
              <Button
                size="lg"
                className="bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-md px-6 py-3 flex items-center gap-2 ring-2 ring-pink-500/50 ring-offset-2 transition-all hover:scale-[1.02] hover:ring-transparent active:scale-[0.98]"
              >
                Connect Wallet
                <ArrowRight className="h-5 w-5" />
              </Button>
            }
          />
        </motion.div>
      </div>

      {/* Beams */}
      {[
        { 
          top: GRID_SIZE * 0,
          left: Math.floor(numColumns * 0.05) * GRID_SIZE,
          transition: { duration: 3.5, repeatDelay: 5, delay: 2 }
        },
        { 
          top: GRID_SIZE * 12,
          left: Math.floor(numColumns * 0.15) * GRID_SIZE,
          transition: { duration: 3.5, repeatDelay: 10, delay: 4 }
        },
        { 
          top: GRID_SIZE * 3,
          left: Math.floor(numColumns * 0.25) * GRID_SIZE,
          transition: { duration: 3, repeatDelay: 5, delay: 0 }
        },
        { 
          top: GRID_SIZE * 9,
          left: Math.floor(numColumns * 0.75) * GRID_SIZE,
          transition: { duration: 2, repeatDelay: 7.5, delay: 3.5 }
        },
        { 
          top: 0,
          left: Math.floor(numColumns * 0.7) * GRID_SIZE,
          transition: { duration: 3, repeatDelay: 2, delay: 1 }
        },
        { 
          top: GRID_SIZE * 2,
          left: Math.floor(numColumns * 1) * GRID_SIZE - GRID_SIZE,
          transition: { duration: 5, repeatDelay: 5, delay: 5 }
        },
      ].map((beam, i) => (
        <motion.div
          key={i}
          initial={{ y: 0, opacity: 0 }}
          animate={{ opacity: [0, 1, 0], y: GRID_SIZE * 8 }}
          transition={{
            ease: "easeInOut",
            duration: beam.transition.duration,
            repeat: Infinity,
            repeatDelay: beam.transition.repeatDelay,
            delay: beam.transition.delay,
          }}
          style={{
            top: beam.top,
            left: beam.left - BEAM_OFFSET,
          }}
          className="absolute z-10 h-[64px] w-[2px] bg-gradient-to-b from-pink-500/0 via-pink-300 to-pink-300"
        />
      ))}

      {/* Background Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2.5, ease: "easeInOut" }}
        className="absolute inset-0 z-0"
      >
        <div
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke-width='1' stroke='rgb(244 114 182 / 0.15)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e")`,
          }}
          className="absolute inset-0 z-0"
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-white/0 via-white/30 to-white" />
      </motion.div>
    </section>
  );
} 