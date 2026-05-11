import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageWrapper } from '../components/layout';
import { AtlasCharacter, AtlasBubble } from '../components/atlas';
import { Badge } from '../components/ui/Badge';
import { Progress } from '../components/ui/Progress';
import { CheckCircle2, CircleDashed, Circle, Check } from 'lucide-react';
import { cn } from '../lib/utils';

type Status = 'completed' | 'in-progress' | 'planned';

interface SubTask {
  text: string;
  status: 'completed' | 'in-progress' | 'planned';
}

interface RoadmapItem {
  id: string;
  version: string;
  status: Status;
  title: string;
  desc: string;
  tags: string[];
  date?: string;
  target?: string;
  stats?: string;
  progress?: number;
  subTasks?: SubTask[];
  note?: string;
}

const ROADMAP_DATA: RoadmapItem[] = [
  {
    id: 'v2.0.0',
    version: 'v2.0.0',
    status: 'in-progress',
    title: 'Atlas Engine + Full Rebuild',
    desc: 'Complete rebuild with FastAPI, Supabase, Redis, semantic embeddings, and the AtlasMind data generation system.',
    tags: ['FastAPI', 'Supabase', 'Redis', 'sentence-transformers', 'React', 'TypeScript'],
    progress: 70,
    target: 'Q2 2026',
    subTasks: [
      { text: 'Database schema (Supabase + pgvector)', status: 'completed' },
      { text: 'Atlas Engine v2 (improved probability manager)', status: 'completed' },
      { text: 'Redis session management', status: 'completed' },
      { text: 'Questions migrated to Supabase', status: 'completed' },
      { text: 'Frontend rebuild (in progress)', status: 'in-progress' },
      { text: 'AtlasMind (Gemini data generation)', status: 'planned' },
      { text: 'Admin dashboard', status: 'planned' }
    ]
  },
  {
    id: 'v2.1.0',
    version: 'v2.1.0',
    status: 'planned',
    title: 'Bangladesh Complete Data',
    desc: 'Comprehensive data for every significant place within Bangladesh — all major cities, landmarks, historical sites, natural wonders, and tourist spots.',
    tags: ['AtlasMind', 'Gemini', 'Data'],
    target: 'Q2 2026',
    note: 'This is our next data milestone! Bangladesh will be the first country with complete sub-national data.'
  },
  {
    id: 'v2.2.0',
    version: 'v2.2.0',
    status: 'planned',
    title: 'City Guessing — Major World Cities',
    desc: "Expand Atlas's knowledge to 500+ major world cities with unique attribute questions.",
    tags: ['Data', 'Atlas Engine']
  },
  {
    id: 'v2.3.0',
    version: 'v2.3.0',
    status: 'planned',
    title: 'Landmark & Historical Sites',
    desc: 'Eiffel Tower, Machu Picchu, Colosseum — all iconic world landmarks added.',
    tags: ['Data', 'AtlasMind']
  },
  {
    id: 'v3.0.0',
    version: 'v3.0.0',
    status: 'planned',
    title: 'Natural Wonders & Geography',
    desc: 'Amazon River, Sahara Desert, Mount Everest, Pacific Ocean — full geographic features.',
    tags: ['Data', 'GeoJSON']
  },
  {
    id: 'v3.5.0',
    version: 'v3.5.0',
    status: 'planned',
    title: 'C++ Performance Upgrade',
    desc: 'Hot-path probability calculations moved to C++ via pybind11 for 8× speed improvement. Supports 50,000+ places.',
    tags: ['C++', 'pybind11', 'Performance']
  },
  {
    id: 'v4.0.0',
    version: 'v4.0.0',
    status: 'planned',
    title: 'Atlas Goes Multilingual',
    desc: 'Play GuessMyPlace in Bengali, Spanish, French, Arabic, and more.',
    tags: ['i18n', 'Gemini']
  },
  {
    id: 'v1.1.0',
    version: 'v1.1.0',
    status: 'completed',
    title: 'Bot Test Runner',
    desc: 'Automated accuracy testing system that runs simulated games for every country and generates detailed analytical reports.',
    tags: ['JavaScript', 'Analytics'],
    date: 'Feb 2026'
  },
  {
    id: 'v1.0.0',
    version: 'v1.0.0',
    status: 'completed',
    title: 'Country Guessing Engine',
    desc: 'Launched the core Bayesian AI engine for guessing all world countries. 94.74% accuracy on first bot test.',
    tags: ['Python', 'Flask', 'Bayesian', 'Firebase'],
    date: 'Feb 2026',
    stats: '115 countries · 94.74% accuracy · avg 10.6 questions'
  }
];

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } }
};

export default function Roadmap() {
  const [filter, setFilter] = useState<'all' | 'completed' | 'in-progress' | 'planned'>('all');

  const filteredItems = ROADMAP_DATA.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-8 h-8 text-accent-green" />;
      case 'in-progress': return <CircleDashed className="w-8 h-8 text-accent-cyan animate-[spin_4s_linear_infinite]" />;
      case 'planned': return <Circle className="w-8 h-8 text-border-subtle" />;
    }
  };

  const getSubtaskIcon = (status: 'completed' | 'in-progress' | 'planned') => {
    switch (status) {
      case 'completed': return <span className="text-xl leading-none">✅</span>;
      case 'in-progress': return <span className="text-xl leading-none">🔄</span>;
      case 'planned': return <span className="text-xl leading-none opacity-50">📋</span>;
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-[900px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 pb-32">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between mb-16 gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="w-full text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-black font-sans tracking-tight text-text-primary mb-3">GuessMyPlace Roadmap</h1>
            <p className="text-lg text-text-secondary">Our journey to map the entire Earth 🌍</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="flex min-w-[280px]">
            <AtlasCharacter size="md" showLabel={false} animate={true} />
            <div className="ml-4 -mt-4">
              <AtlasBubble message="Here's everything we're building. Come back often!" side="left" typing={true} />
            </div>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
          <div className="bg-bg-surface border border-border-subtle p-6 rounded-2xl text-center">
            <div className="text-4xl font-mono font-bold text-accent-cyan mb-2">2</div>
            <div className="text-sm text-text-muted uppercase tracking-wider">Versions Released</div>
          </div>
          <div className="bg-bg-surface border border-border-subtle p-6 rounded-2xl text-center">
            <div className="text-4xl font-mono font-bold text-accent-cyan mb-2">115</div>
            <div className="text-sm text-text-muted uppercase tracking-wider">Countries Added</div>
          </div>
          <div className="bg-bg-surface border border-border-subtle p-6 rounded-2xl text-center">
            <div className="text-4xl font-mono font-bold text-accent-cyan mb-2">99%</div>
            <div className="text-sm text-text-muted uppercase tracking-wider">Target Accuracy</div>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="sticky top-16 z-30 bg-[#080C14]/80 backdrop-blur-xl border-b border-border py-4 mb-12 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-2 sm:gap-6 overflow-x-auto hide-scrollbar">
            {[
              { id: 'all', label: 'All' },
              { id: 'completed', label: 'Completed ✅' },
              { id: 'in-progress', label: 'In Progress 🔄' },
              { id: 'planned', label: 'Planned 📋' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={cn(
                  "relative py-2 px-4 rounded-lg font-medium text-sm whitespace-nowrap transition-colors",
                  filter === tab.id ? "text-text-primary bg-bg-surface border border-border" : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                )}
              >
                {tab.label}
                {filter === tab.id && (
                  <motion.div layoutId="roadmap-tab" className="absolute -bottom-[1px] left-2 right-2 h-[2px] bg-accent-cyan" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Roadmap Items */}
        <div className="relative">
          {/* Timeline Line (Desktop) */}
          <div className="hidden md:block absolute left-[27px] top-4 bottom-4 w-[2px] bg-border-subtle" />

          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-8">
            <AnimatePresence mode="popLayout">
              {filteredItems.map(item => (
                <motion.div
                  key={item.id}
                  layout
                  variants={fadeUp}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col md:flex-row relative group"
                >
                  {/* Status Icon (Desktop) */}
                  <div className="hidden md:flex relative z-10 w-14 justify-center pt-6 pr-4">
                    <div className="bg-[#080C14] p-1 rounded-full">{getStatusIcon(item.status)}</div>
                  </div>

                  {/* Card */}
                  <div className={cn(
                    "flex-1 bg-bg-surface border-l-4 border-y border-r rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
                    item.status === 'completed' && "border-l-accent-green hover:border-r-accent-green/30 hover:border-y-accent-green/30 shadow-[0_0_20px_rgba(0,229,160,0.05)] bg-[#0A1211]/50",
                    item.status === 'in-progress' && "border-l-accent-cyan hover:border-r-accent-cyan/30 hover:border-y-accent-cyan/30 shadow-[0_0_20px_rgba(0,194,255,0.05)]",
                    item.status === 'planned' && "border-l-border-subtle border-l-dashed hover:border-border opacity-75 hover:opacity-100"
                  )}>
                    <div className="flex justify-between items-start mb-4 gap-4">
                      <div>
                        {/* Mobile Status + Title */}
                        <div className="flex md:hidden items-center gap-2 mb-2">
                          <span className="scale-75 origin-left">{getStatusIcon(item.status)}</span>
                          <span className="font-mono text-sm text-text-muted">{item.version}</span>
                        </div>
                        <h2 className="text-xl font-bold text-text-primary tracking-tight leading-tight mb-2">{item.title}</h2>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {item.tags.map(tag => (
                            <Badge key={tag} className="bg-bg-elevated text-xs border-border-subtle text-text-secondary">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="hidden md:block">
                        <Badge variant="outline" className="font-mono text-xs border-border-subtle bg-bg-base shadow-sm px-3 py-1 text-text-muted">{item.version}</Badge>
                      </div>
                    </div>

                    <p className="text-[15px] text-text-secondary leading-relaxed mb-4">{item.desc}</p>

                    {item.status === 'in-progress' && typeof item.progress === 'number' && (
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-mono text-text-muted tracking-wider uppercase">Progress</span>
                          <span className="text-xs font-mono text-accent-cyan">{item.progress}%</span>
                        </div>
                        <Progress value={item.progress} className="h-1.5" />
                      </div>
                    )}

                    {item.subTasks && item.subTasks.length > 0 && (
                      <div className="space-y-3 mb-6 bg-bg-base/50 p-4 rounded-xl border border-border-subtle">
                        {item.subTasks.map((task, i) => (
                          <div key={i} className={cn("flex items-start gap-3", task.status === 'planned' && 'opacity-60')}>
                            <div className="mt-0.5">{getSubtaskIcon(task.status)}</div>
                            <span className="text-sm text-text-secondary leading-snug">{task.text}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {item.note && (
                      <div className="mb-6 p-4 rounded-xl bg-accent-amber/5 border border-accent-amber/20 text-accent-amber/90 text-sm leading-relaxed">
                        <span className="font-bold">Note:</span> {item.note}
                      </div>
                    )}

                    {/* Footer Details */}
                    <div className="mt-auto pt-4 border-t border-border-subtle flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-text-muted">
                      {(item.date || item.target) && (
                        <div className="flex border border-[#142030] bg-[#0A0E17] rounded-md px-2 py-1">
                          {item.status === 'planned' ? '🎯 Target: ' : item.status === 'in-progress' ? '🔄 Target: ' : '✅ Completed: '} 
                          <span className="text-text-primary ml-1">{item.date || item.target}</span>
                        </div>
                      )}
                      {item.stats && (
                        <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-text-secondary" /> {item.stats}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>

      </div>
    </PageWrapper>
  );
}
