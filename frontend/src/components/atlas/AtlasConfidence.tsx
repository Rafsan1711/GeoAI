import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface AtlasConfidenceProps {
  confidence: number;
  questionsAsked: number;
}

export const AtlasConfidence: React.FC<AtlasConfidenceProps> = ({ confidence, questionsAsked }) => {
  const [animatedConfidence, setAnimatedConfidence] = React.useState(0);

  React.useEffect(() => {
    const from = animatedConfidence;
    const to = confidence;
    const duration = 500;
    const start = performance.now();
    
    let animationFrame: number;
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const easing = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setAnimatedConfidence(Math.round(from + (to - from) * easing));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(tick);
      }
    };
    animationFrame = requestAnimationFrame(tick);
    
    return () => cancelAnimationFrame(animationFrame);
  }, [confidence]); // Note: Do not include animatedConfidence here

  const getColorClass = (val: number) => {
    if (val <= 50) return "text-accent-amber";
    if (val <= 80) return "text-accent-cyan";
    return "text-accent-green";
  };

  const getStrokeClass = (val: number) => {
    if (val <= 50) return "stroke-accent-amber";
    if (val <= 80) return "stroke-accent-cyan";
    return "stroke-accent-green";
  };

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (confidence / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
          <circle
            cx="70"
            cy="70"
            r={radius}
            className="stroke-border-subtle fill-transparent"
            strokeWidth="8"
          />
          <motion.circle
            cx="70"
            cy="70"
            r={radius}
            className={cn("fill-transparent transition-colors duration-500", getStrokeClass(confidence))}
            strokeWidth="8"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-3xl font-mono font-bold transition-colors duration-500", getColorClass(confidence))}>
            {animatedConfidence}%
          </span>
        </div>
      </div>
      
      <div className="mt-4 flex flex-col items-center">
        <span className="text-xs text-text-muted font-mono uppercase tracking-wider mb-1">Questions</span>
        <span className="text-xl font-mono text-text-secondary">{questionsAsked}</span>
      </div>
    </div>
  );
};
