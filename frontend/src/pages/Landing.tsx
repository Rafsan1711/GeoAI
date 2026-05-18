import React, { useEffect, useState } from 'react';
import { motion, useAnimation, useInView, animate } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Brain, MessageCircle, TrendingUp, MapPin } from 'lucide-react';
import { PageWrapper } from '../components/layout';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { AtlasCharacter, AtlasBubble, AtlasStatsBar } from '../components/atlas';
import { useQuery } from '@tanstack/react-query';
import { getDetailedHealth } from '../api/health';

// Animations
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const CountUp = ({ value, duration = 1.5 }: { value: number, duration?: number }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setCount(Math.floor(v))
    });
    return controls.stop;
  }, [value, duration]);

  return <span>{count}</span>;
};

const AnimatedCounter = ({ value, label, icon: Icon, isNumeric = false }: { value: number | string, label: string, icon?: React.ElementType, isNumeric?: boolean }) => {
  return (
    <div className="flex flex-col items-center p-4 bg-bg-surface/50 border border-border-subtle rounded-2xl backdrop-blur-md">
      {Icon && <Icon className="w-6 h-6 text-accent-cyan mb-2" />}
      <span className="font-mono text-xl sm:text-2xl font-bold text-accent-cyan">
        {isNumeric && typeof value === 'number' ? <CountUp value={value} /> : value}
        {isNumeric && typeof value === 'number' ? '+' : ''}
      </span>
      <span className="text-xs sm:text-sm text-text-muted text-center mt-1">{label}</span>
    </div>
  );
};

export default function Landing() {
  const { data: healthData } = useQuery({
    queryKey: ['health', 'detailed'],
    queryFn: getDetailedHealth,
    staleTime: 5 * 60 * 1000,
  });

  const validTypesCount = healthData?.data_stats 
    ? Object.values(healthData.data_stats).filter(v => v.count > 0).length 
    : 0;
    
  const placesCount = healthData?.total_places || '--';
  const countryCount = healthData?.data_stats?.country?.count || '--';
  const displayPlacesCount = validTypesCount > 1 ? placesCount : countryCount;
  const displayPlacesLabel = validTypesCount > 1 ? 'Places Known' : 'Countries';

  return (
    <PageWrapper>
      {/* ━━━ SECTION 2: HERO ━━━ */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-accent-cyan/8 blur-[120px] mix-blend-screen" />
          <div className="absolute -bottom-[20%] -right-[10%] w-[500px] h-[500px] rounded-full bg-accent-green/6 blur-[120px] mix-blend-screen" />
          <div 
            className="absolute inset-0 bg-[radial-gradient(var(--color-border-subtle)_1px,transparent_1px)] [background-size:40px_40px] opacity-10"
            style={{ maskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, #000 70%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, #000 70%, transparent 100%)' }}
          />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col lg:flex-row items-center justify-between gap-12">
          
          {/* Left Content */}
          <motion.div 
            className="w-full lg:w-[60%] flex flex-col items-center lg:items-start text-center lg:text-left"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeUp} className="mb-6 flex flex-col items-center lg:items-start">
              <img src="/logo.png" className="w-24 h-24 mb-6 rounded-[2rem] drop-shadow-[0_0_25px_rgba(0,194,255,0.3)]" alt="GuessMyPlace Logo" />
              <Badge variant="cyan" className="px-4 py-1.5 text-sm">
                ✦ AI-Powered Geography Game
              </Badge>
            </motion.div>
            
            <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl md:text-[72px] font-black tracking-tight leading-[1.1] mb-6 font-sans">
              <span className="text-text-primary">Can You Outsmart</span>
              <br />
              <span className="text-accent-cyan">Atlas?</span>
            </motion.h1>
            
            <motion.p variants={fadeUp} className="text-lg text-text-secondary max-w-2xl leading-relaxed mb-10">
              Atlas learns every place on Earth. Think of any country, city, landmark, or natural wonder — and watch Atlas figure it out through intelligent questions.
            </motion.p>
            
            <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mb-10">
              <AnimatedCounter value={displayPlacesCount} label={displayPlacesLabel} icon={MapPin} isNumeric={typeof displayPlacesCount === 'number'} />
              <AnimatedCounter value="Smart" label="Questions" icon={MessageCircle} />
              <AnimatedCounter value="Daily" label="Gets Smarter" icon={Brain} />
            </motion.div>
            
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center sm:items-start gap-4 w-full">
              <Button asChild size="lg" className="w-full sm:w-auto text-lg h-14 px-8 group">
                <Link to="/game">
                  Play Now 
                  <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto h-14 text-text-primary border-border-subtle hover:bg-bg-elevated hover:text-text-primary hover:border-border">
                <a href="#how-it-works">How It Works</a>
              </Button>
            </motion.div>
            
            <motion.div variants={fadeUp} className="mt-6 text-xs text-text-muted">
              No signup required &middot; Free forever &middot; Open source
            </motion.div>
          </motion.div>

          {/* Right Content - Desktop Only */}
          <motion.div 
            className="hidden lg:flex flex-col items-center w-[40%] relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="relative mb-2">
              <div className="absolute -top-16 -right-12 z-20 transform rotate-2">
                <AtlasBubble message="Think of any place on Earth. I'll figure it out." side="right" typing={true} />
              </div>
              <AtlasCharacter size="xl" showLabel={false} animate={true} />
            </div>
            
            <AtlasStatsBar className="mt-8 bg-bg-surface/50 border border-border-subtle rounded-lg px-4 py-3 backdrop-blur-sm shadow-xl" />
          </motion.div>

        </div>
      </section>

      {/* ━━━ SECTION 3: HOW IT WORKS ━━━ */}
      <section id="how-it-works" className="py-24 bg-bg-surface relative border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">How It Works</h2>
            <div className="w-20 h-1 bg-accent-cyan mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
              className="bg-bg-base border border-border rounded-2xl p-8 hover:border-accent-cyan/50 hover:shadow-[0_0_30px_rgba(0,194,255,0.1)] transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-full bg-accent-cyan/10 flex items-center justify-center mb-6">
                <Brain className="w-6 h-6 text-accent-cyan" />
              </div>
              <h3 className="text-xl font-bold mb-3">Think of a Place</h3>
              <p className="text-text-secondary leading-relaxed">Any country, city, landmark, desert, mountain, river — anything on Earth.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-bg-base border border-border rounded-2xl p-8 hover:border-accent-cyan/50 hover:shadow-[0_0_30px_rgba(0,194,255,0.1)] transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-full bg-accent-cyan/10 flex items-center justify-center mb-6">
                <MessageCircle className="w-6 h-6 text-accent-cyan" />
              </div>
              <h3 className="text-xl font-bold mb-3">Answer Questions</h3>
              <p className="text-text-secondary leading-relaxed">Atlas asks smart yes/no/probably questions. Each answer narrows it down.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -4 }}
              className="bg-bg-base border border-border rounded-2xl p-8 hover:border-accent-cyan/50 hover:shadow-[0_0_30px_rgba(0,194,255,0.1)] transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-full bg-accent-cyan/10 flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-accent-cyan" />
              </div>
              <h3 className="text-xl font-bold mb-3">Atlas Figures It Out</h3>
              <p className="text-text-secondary leading-relaxed">Using Bayesian inference and semantic reasoning, Atlas identifies your place.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ━━━ SECTION 4: PLACE TYPES ━━━ */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Guess Any Kind of Place</h2>
            <p className="text-text-secondary max-w-2xl mx-auto text-lg">Atlas isn't just for countries. Think bigger.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-bg-surface border border-accent-cyan/30 rounded-xl p-6 relative overflow-hidden group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform origin-bottom-left">🌍</div>
              <h4 className="font-bold text-lg mb-1">Countries</h4>
              <p className="text-sm text-text-secondary">193 nations and territories</p>
            </div>
            
            {[
              { emoji: '🏙️', title: 'Cities', desc: 'Major cities worldwide' },
              { emoji: '🗼', title: 'Landmarks', desc: 'Eiffel Tower, Colosseum...' },
              { emoji: '🌊', title: 'Nature', desc: 'Oceans, deserts, forests' },
              { emoji: '🕌', title: 'Heritage', desc: 'Ancient ruins & sites' },
              { emoji: '⛰️', title: 'Geographic', desc: 'Mountains, rivers, islands' },
              { emoji: '🕍', title: 'Religious', desc: 'Sacred sites worldwide' },
              { emoji: '🏖️', title: 'Tourist Spots', desc: 'Famous destinations' },
            ].map((item, i) => (
              <div key={i} className="bg-bg-surface/50 border border-border-subtle rounded-xl p-6 relative overflow-hidden opacity-75">
                <div className="absolute top-4 right-4">
                  <Badge variant="amber" className="text-[10px] px-2 py-0 border-none bg-accent-amber/10 text-accent-amber/80">Soon</Badge>
                </div>
                <div className="text-4xl mb-4 grayscale opacity-80">{item.emoji}</div>
                <h4 className="font-bold text-lg mb-1 text-text-secondary">{item.title}</h4>
                <p className="text-sm text-text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ SECTION 5: ATLAS EVOLUTION ━━━ */}
      <section className="py-24 bg-bg-surface border-y border-border overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Atlas Grows With Data</h2>
            <p className="text-text-secondary">The more places he encounters, the wiser he becomes.</p>
          </div>

          <div className="relative pt-12 pb-8 overflow-x-auto hide-scrollbar">
            {/* Progress line background */}
            <div className="absolute top-[68px] left-[5%] right-[5%] h-1 bg-border rounded-full" />
            
            {/* Active progress line component (mocked to teen stage for visual) */}
             <div className="absolute top-[68px] left-[5%] w-[45%] h-1 bg-accent-cyan rounded-full shadow-[0_0_10px_#00c2ff]" />

            <div className="flex justify-between items-center min-w-[800px] px-[5%] relative z-10 w-full">
              {[
                { emoji: '🍼', label: 'Baby', range: '0 - 99' },
                { emoji: '🧒', label: 'Child', range: '100 - 499' },
                { emoji: '👦', label: 'Teen', range: '500 - 999', active: true },
                { emoji: '🧑‍💻', label: 'Adult', range: '1k - 3k' },
                { emoji: '🧔', label: 'Expert', range: '3k - 8k' },
                { emoji: '🧙', label: 'Sage', range: '8k+' },
              ].map((stage, i) => (
                <div key={i} className="flex flex-col items-center relative group">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl mb-4 bg-bg-base border-4 transition-all duration-300 ${stage.active ? 'border-accent-cyan scale-110 shadow-[0_0_20px_rgba(0,194,255,0.4)]' : 'border-border grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 group-hover:border-border-subtle'}`}>
                    <span role="img" aria-label={stage.label}>{stage.emoji}</span>
                  </div>
                  <span className={`font-bold ${stage.active ? 'text-accent-cyan' : 'text-text-secondary'}`}>{stage.label}</span>
                  <span className="text-xs font-mono text-text-muted mt-1">{stage.range}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ SECTION 6: ROADMAP PREVIEW ━━━ */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="outline" className="mb-6">Development</Badge>
          <h2 className="text-3xl font-bold mb-6">See What's Coming</h2>
          <p className="text-text-secondary mb-8">We're constantly improving the Atlas Engine and adding new place categories.</p>
          <Button asChild variant="outline" size="lg" className="border-border-subtle text-text-secondary hover:text-text-primary">
            <Link to="/roadmap">View Full Roadmap →</Link>
          </Button>
        </div>
      </section>

    </PageWrapper>
  );
}
