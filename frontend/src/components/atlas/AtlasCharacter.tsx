import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { getDetailedHealth } from '../../api/health';
import { cn } from '../../lib/utils';
import { Skeleton } from '../ui/Skeleton';

export interface AtlasCharacterProps {
  size?: "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
  animate?: boolean;
}

const getAtlasStage = (totalPlaces: number) => {
  if (totalPlaces < 100)  return { stage: "infant",  emoji: "🍼", label: "Baby Atlas",        message: "I'm just learning..." };
  if (totalPlaces < 500)  return { stage: "child",   emoji: "🧒", label: "Young Atlas",       message: "I know a few places!" };
  if (totalPlaces < 1000) return { stage: "teen",    emoji: "👦", label: "Atlas Jr.",         message: "Getting smarter every day" };
  if (totalPlaces < 3000) return { stage: "adult",   emoji: "🧑‍💻", label: "Atlas",            message: "I know this world well" };
  if (totalPlaces < 8000) return { stage: "expert",  emoji: "🧔", label: "Atlas the Explorer", message: "Ask me anything" };
  return                         { stage: "sage",    emoji: "🧙", label: "Atlas the Sage",    message: "I know every corner of Earth" };
};

const sizeClasses = {
  sm: "w-12 h-12 text-2xl border-2",
  md: "w-20 h-20 text-4xl border-2",
  lg: "w-32 h-32 text-6xl border-[3px]",
  xl: "w-48 h-48 text-8xl border-4"
};

export const AtlasCharacter: React.FC<AtlasCharacterProps> = ({ size = "md", showLabel = true, animate = true }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['health', 'detailed'],
    queryFn: getDetailedHealth,
    staleTime: 5 * 60 * 1000,
  });

  const placesCount = data?.data_stats
    ? Object.values(data.data_stats).reduce((sum, t) => sum + t.count, 0)
    : 0;
  const stageInfo = getAtlasStage(placesCount);

  const containerY = animate ? [0, -8, 0] : 0;

  return (
    <div className="flex flex-col items-center">
      {isLoading ? (
        <Skeleton className={cn("rounded-full animate-pulse", sizeClasses[size])} />
      ) : (
        <motion.div 
          animate={{
            y: containerY,
            boxShadow: [
              "0 0 15px rgba(0, 194, 255, 0.3)",
              "0 0 30px rgba(0, 194, 255, 0.7)",
              "0 0 15px rgba(0, 194, 255, 0.3)",
            ],
            borderColor: [
              "rgba(0, 194, 255, 0.5)",
              "rgba(0, 194, 255, 1)",
              "rgba(0, 194, 255, 0.5)",
            ]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(0, 194, 255, 1)", borderColor: "rgba(0, 194, 255, 1)" }}
          className={cn(
            "relative border-solid flex items-center justify-center rounded-full bg-[#080C14] transition-transform duration-300",
            sizeClasses[size]
          )}
        >
          <span role="img" aria-label={stageInfo.label} className="relative z-10">{stageInfo.emoji}</span>
          <div className="absolute inset-0 rounded-full bg-accent-cyan/10 blur-md pointer-events-none" />
        </motion.div>
      )}
      {showLabel && !isLoading && (
        <div className="mt-3 text-center">
          <p className="font-mono text-xs text-text-muted">{stageInfo.label}</p>
        </div>
      )}
    </div>
  );
};
