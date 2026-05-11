import React from 'react';
import { PageWrapper } from '../components/layout';
import { AtlasCharacter, AtlasBubble } from '../components/atlas';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <PageWrapper>
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Question Marks */}
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <motion.div animate={{ y: [0, 20, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="absolute top-20 left-[20%] text-8xl font-black font-sans rotate-12">?</motion.div>
          <motion.div animate={{ y: [0, -30, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }} className="absolute bottom-40 left-[15%] text-6xl font-black font-sans -rotate-12">?</motion.div>
          <motion.div animate={{ y: [0, 25, 0] }} transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 2 }} className="absolute top-40 right-[20%] text-9xl font-black font-sans -rotate-12">?</motion.div>
          <motion.div animate={{ y: [0, -20, 0] }} transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 0.5 }} className="absolute bottom-32 right-[25%] text-7xl font-black font-sans rotate-6">?</motion.div>
        </div>

        <div className="relative z-10 flex flex-col items-center max-w-md text-center">
          <div className="mb-10 relative pr-[120px]">
            <AtlasCharacter size="lg" showLabel={false} animate={true} />
            <div className="absolute top-4 right-0">
              <AtlasBubble message="I've searched the whole Earth but can't find this page." side="right" typing={true} />
            </div>
          </div>

          <h1 className="text-4xl font-black font-sans tracking-tight text-text-primary mb-3">
            404 — Page Not Found
          </h1>
          
          <p className="text-text-secondary mb-8 text-lg">
            Looks like you've ventured off the map.
          </p>

          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-6 py-3 bg-text-primary text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Home
          </button>
        </div>
      </div>
    </PageWrapper>
  );
}
