import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { getDetailedHealth } from '../../api/health';
import { cn } from '../../lib/utils';

export interface AtlasCharacterProps {
  size?: "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
  animate?: boolean;
}

const getAtlasStage = (placesCount: number) => {
  if (placesCount < 100) return { stage: "infant", emoji: "🍼", label: "Baby Atlas", message: "I'm just learning..." };
  if (placesCount < 500) return { stage: "child", emoji: "🧒", label: "Young Atlas", message: "I know a few places!" };
  if (placesCount < 1000) return { stage: "teen", emoji: "👦", label: "Atlas Jr.", message: "Getting smarter every day" };
  if (placesCount < 3000) return { stage: "adult", emoji: "🧑‍💻", label: "Atlas", message: "I know this world well" };
  if (placesCount < 8000) return { stage: "expert", emoji: "🧔", label: "Atlas the Explorer", message: "Ask me anything" };
  return { stage: "sage", emoji: "🧙", label: "Atlas the Sage", message: "I know every corner of Earth" };
};

const sizeClasses = {
  sm: "w-12 h-12 text-2xl",
  md: "w-20 h-20 text-4xl",
  lg: "w-32 h-32 text-6xl",
  xl: "w-48 h-48 text-8xl"
};

export const AtlasCharacter: React.FC<AtlasCharacterProps> = ({ size = "md", showLabel = true, animate = true }) => {
  const { data } = useQuery({
    queryKey: ['health', 'detailed'],
    queryFn: getDetailedHealth,
    staleTime: 5 * 60 * 1000,
  });

  const placesCount = data
    ? (data.data_stats?.country?.count || 0) + 
      (data.data_stats?.city?.count || 0) + 
      (data.data_stats?.place?.count || 0)
    : 0;
  const stageInfo = getAtlasStage(placesCount);

  const containerAnimation = animate ? {
    y: [0, -8, 0],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const }
  } : {};

  return (
    <div className="flex flex-col items-center">
      <motion.div 
        animate={containerAnimation}
        whileHover={{ scale: 1.05 }}
        className={cn(
          "relative flex items-center justify-center rounded-full bg-bg-surface border border-accent-cyan shadow-[0_0_15px_rgba(0,194,255,0.3)] hover:shadow-[0_0_25px_rgba(0,194,255,0.6)] transition-shadow duration-300",
          sizeClasses[size]
        )}
      >
        <span role="img" aria-label={stageInfo.label}>{stageInfo.emoji}</span>
      </motion.div>
      {showLabel && (
        <div className="mt-3 text-center">
          <p className="font-mono text-sm text-text-muted">{stageInfo.label}</p>
        </div>
      )}
    </div>
  );
};
