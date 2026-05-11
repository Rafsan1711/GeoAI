import React from 'react';
import { Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface InfoBoxProps {
  title?: string;
  children: React.ReactNode;
  variant?: 'info' | 'error' | 'success';
}

export function InfoBox({ title, children, variant = 'info' }: InfoBoxProps) {
  const Icon = variant === 'info' ? Info : variant === 'success' ? CheckCircle2 : AlertCircle;
  
  return (
    <div className={cn(
      "p-4 rounded-xl border flex gap-3 text-sm leading-relaxed",
      variant === 'info' && "bg-[#142030] border-[#2A384C] text-text-secondary",
      variant === 'error' && "bg-accent-red/5 border-accent-red/20 text-accent-red/90",
      variant === 'success' && "bg-accent-green/5 border-accent-green/20 text-accent-green/90",
    )}>
      <Icon className={cn(
        "w-5 h-5 shrink-0 mt-0.5",
        variant === 'info' && "text-accent-cyan",
        variant === 'error' && "text-accent-red",
        variant === 'success' && "text-accent-green"
      )} />
      <div>
        {title && <h4 className={cn(
          "font-bold mb-1",
          variant === 'info' && "text-white",
          variant === 'error' && "text-accent-red",
          variant === 'success' && "text-accent-green"
        )}>{title}</h4>}
        {children}
      </div>
    </div>
  );
}
