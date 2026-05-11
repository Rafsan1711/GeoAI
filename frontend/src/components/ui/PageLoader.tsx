import React from 'react';
import { AtlasCharacter } from '../atlas/AtlasCharacter';

export function PageLoader() {
  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center fixed inset-0 z-50">
      <div className="mb-8">
        <AtlasCharacter size="lg" showLabel={false} animate={true} />
      </div>
      <div className="flex items-center gap-1 text-text-secondary font-mono tracking-wider text-sm uppercase">
        Loading GuessMyPlace
        <span className="inline-flex w-4">
          <span className="animate-[loading-dot_1.5s_infinite] inline-block opacity-0">.</span>
          <span className="animate-[loading-dot_1.5s_0.3s_infinite] inline-block opacity-0">.</span>
          <span className="animate-[loading-dot_1.5s_0.6s_infinite] inline-block opacity-0">.</span>
        </span>
      </div>
    </div>
  );
}
