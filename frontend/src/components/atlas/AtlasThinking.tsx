import React from 'react';
import { motion } from 'framer-motion';
import { AtlasCharacter } from './AtlasCharacter';

export const AtlasThinking: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center my-8">
      <div className="relative flex items-center justify-center w-32 h-32">
        {/* Rings */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border-t-2 border-l-2 border-accent-cyan/40 rounded-full w-full h-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2 border-r-2 border-b-2 border-accent-cyan/30 rounded-full"
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-4 border-b-2 border-l-2 border-accent-cyan/20 rounded-full"
        />
        
        {/* Character */}
        <div className="absolute inset-0 flex items-center justify-center">
          <AtlasCharacter size="md" showLabel={false} animate={false} />
        </div>
      </div>
      
      <div className="mt-6 flex items-center text-accent-cyan font-mono text-sm uppercase tracking-wider">
        Analyzing
        <span className="inline-flex w-8 ml-1">
          <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0 }}>.</motion.span>
          <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}>.</motion.span>
          <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}>.</motion.span>
        </span>
      </div>
    </div>
  );
};
