/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface AtlasBubbleProps {
  message: string;
  side?: "left" | "right";
  typing?: boolean;
}

export const AtlasBubble: React.FC<AtlasBubbleProps> = ({ message, side = "right", typing = false }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(typing);
  const [blinkComplete, setBlinkComplete] = useState(false);

  useEffect(() => {
    if (typing) {
      setIsTyping(true);
      setDisplayedText("");
      setBlinkComplete(false);
    } else {
      setIsTyping(false);
      setDisplayedText(message);
      setBlinkComplete(true);
    }
  }, [message, typing]);

  useEffect(() => {
    if (typing && displayedText.length < message.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(message.slice(0, displayedText.length + 1));
      }, 30);
      return () => clearTimeout(timeout);
    } else if (typing && displayedText.length === message.length && isTyping) {
      setIsTyping(false);
      // Wait for 1s of blinking (2 blinks) before removing cursor entirely
      setTimeout(() => {
        setBlinkComplete(true);
      }, 1000);
    }
  }, [displayedText, message, typing, isTyping]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative max-w-sm p-4 bg-bg-surface border border-border-subtle rounded-2xl shadow-lg",
        side === "right" ? "rounded-bl-none" : "rounded-br-none"
      )}
    >
      <div 
        className={cn(
          "absolute w-3 h-3 bg-bg-surface border-b border-l border-border-subtle rotate-45 transform bottom-2",
          side === "right" ? "-left-1.5 border-t-0 border-r-0" : "-right-1.5 border-t-0 border-l-0 border-r"
        )} 
      />
      
      <div className="relative z-10 text-text-primary text-sm font-sans leading-relaxed min-h-[1.25rem]">
        {typing && isTyping && displayedText.length === 0 ? (
          <span className="flex items-center h-5 space-x-1">
            <motion.span className="w-1.5 h-1.5 rounded-full bg-accent-cyan" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} />
            <motion.span className="w-1.5 h-1.5 rounded-full bg-accent-cyan" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} />
            <motion.span className="w-1.5 h-1.5 rounded-full bg-accent-cyan" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} />
          </span>
        ) : (
          <span>
            {displayedText}
            {typing && !isTyping && !blinkComplete && (
              <motion.span 
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                className="inline-block w-1.5 h-4 ml-1 bg-accent-cyan align-middle"
              />
            )}
            {typing && isTyping && (
                <span className="inline-block w-1.5 h-4 ml-1 bg-accent-cyan align-middle" />
            )}
          </span>
        )}
      </div>
    </motion.div>
  );
};
