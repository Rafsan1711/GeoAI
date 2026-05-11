import React, { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Menu, X, ChevronDown } from 'lucide-react';
import { PageWrapper } from '../components/layout';
import { Badge } from '../components/ui/Badge';
import { cn } from '../lib/utils';

// Docs Navigation Data
const DOCS_NAV = [
  {
    category: "📖 Introduction",
    links: [
      { label: "What is GuessMyPlace?", id: "what-is" },
    ]
  },
  {
    category: "🧠 Atlas Engine",
    links: [
      { label: "Engine Architecture", id: "architecture" },
    ]
  },
  {
    category: "🎮 Game",
    links: [
      { label: "Answer Types Explained", id: "answer-types" },
      { label: "Keyboard Shortcuts", id: "keyboard-shortcuts" },
    ]
  },
  {
    category: "🔌 API Reference",
    links: [
      { label: "Overview", id: "api-overview" },
      { label: "Game Endpoints", id: "api-game" },
    ]
  }
];

// Helper Components
const ColoredCodeBlock = ({ language, code }: { language: string, code: string }) => {
  const renderJSON = (str: string) => {
    return str.split('\n').map((line, i) => {
      let coloredLine = line
        .replace(/"([^"]+)":/g, '<span class="text-accent-cyan">"$1"</span>:')
        .replace(/: "([^"]+)"/g, ': <span class="text-accent-green">"$1"</span>')
        .replace(/: (true|false|null)/g, ': <span class="text-accent-amber">$1</span>')
        .replace(/: ([0-9.-]+)/g, ': <span class="text-accent-amber">$1</span>');
      return <div key={i} dangerouslySetInnerHTML={{ __html: coloredLine || ' ' }} />;
    });
  };

  return (
    <div className="bg-[#0a0e17] rounded-xl overflow-hidden border border-border-subtle my-6 shadow-xl">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#142030] bg-bg-surface text-xs font-mono text-text-muted select-none">
        <span>{language}</span>
      </div>
      <div className="p-4 overflow-x-auto min-w-[300px]">
        <pre className="font-mono text-sm leading-relaxed text-text-primary">
          {language.toLowerCase() === 'json' ? renderJSON(code) : code}
        </pre>
      </div>
    </div>
  );
};

const Accordion = ({ title, children }: { title: string, children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-border-subtle rounded-xl mb-4 bg-bg-surface overflow-hidden transition-all duration-300">
      <button 
        className="w-full flex items-center justify-between p-5 font-semibold text-text-primary hover:bg-bg-elevated transition-colors text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{title}</span>
        <ChevronDown className={cn("w-5 h-5 transition-transform flex-shrink-0 ml-2 text-text-muted", isOpen && "rotate-180")} />
      </button>
      {isOpen && (
        <div className="p-6 pt-2 border-t-0 text-text-secondary leading-relaxed bg-bg-surface text-[15px]">
          {children}
        </div>
      )}
    </div>
  );
};

const Endpoint = ({ method, path, desc, body, response }: { method: string, path: string, desc: string, body?: string, response?: string }) => (
  <div className="my-10 bg-bg-surface border border-border-subtle rounded-2xl p-6 md:p-8">
    <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-4">
      <Badge className={cn(
        "font-mono text-xs px-2.5 py-1 uppercase rounded-md flex-shrink-0", 
        method === 'POST' ? 'bg-accent-green/10 text-accent-green border-accent-green/20' : 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20'
      )}>
        {method}
      </Badge>
      <span className="font-mono text-text-primary text-sm sm:text-base break-all bg-bg-base px-3 py-1 rounded-md border border-border-subtle">{path}</span>
    </div>
    <p className="text-text-secondary mb-6 leading-relaxed text-[15px]">{desc}</p>
    
    {body && (
      <div>
        <h4 className="text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider">Request Body</h4>
        <ColoredCodeBlock language="JSON" code={body} />
      </div>
    )}
    
    {response && (
      <div className="mt-6">
        <h4 className="text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider">Response Example</h4>
        <ColoredCodeBlock language="JSON" code={response} />
      </div>
    )}
  </div>
);

export default function Docs() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const [activeId, setActiveId] = useState("what-is");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const callback = (entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
          break;
        }
      }
    };
    const observer = new IntersectionObserver(callback, { rootMargin: "-10% 0px -80% 0px" });
    document.querySelectorAll('.doc-section').forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
      setTimeout(() => setActiveId(id), 500); 
    }
  };

  return (
    <PageWrapper>
      <motion.div className="fixed top-16 left-0 right-0 h-[2px] bg-accent-cyan z-50 origin-left" style={{ scaleX }} />
      <div className="flex w-full max-w-[1400px] mx-auto min-h-[calc(100vh-4rem)] relative layout-container">
        
        <button 
          className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-[#080C14] border border-border-subtle text-accent-cyan rounded-full shadow-2xl flex items-center justify-center z-50"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
           {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        <aside className="hidden lg:block w-[260px] flex-shrink-0 border-r border-border sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto bg-bg-base py-10 px-4 xl:pl-8">
          <nav className="space-y-8 pb-12">
            {DOCS_NAV.map((section, idx) => (
              <div key={idx}>
                <h3 className="font-semibold text-text-primary text-sm tracking-wide mb-3 pl-3">{section.category}</h3>
                <ul className="space-y-1">
                  {section.links.map(link => {
                    const isActive = activeId === link.id;
                    return (
                      <li key={link.id}>
                        <button 
                          onClick={() => scrollToSection(link.id)}
                          className={cn(
                            "w-full text-left px-3 py-2 text-sm rounded-lg border-l-2 transition-all duration-200",
                            isActive 
                              ? "border-accent-cyan text-accent-cyan bg-accent-cyan/10 font-medium" 
                              : "border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                          )}
                        >
                          {link.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div className="absolute inset-0 bg-[#080C14]/80 backdrop-blur-md" onClick={() => setMobileMenuOpen(false)} />
            <aside className="w-[280px] h-full bg-bg-base border-r border-border overflow-y-auto pt-24 pb-8 px-4 relative z-50 shadow-2xl">
              <nav className="space-y-8 pb-12">
                {DOCS_NAV.map((section, idx) => (
                  <div key={idx}>
                    <h3 className="font-semibold text-text-primary text-sm tracking-wide mb-3 pl-3">{section.category}</h3>
                    <ul className="space-y-1">
                      {section.links.map(link => {
                        const isActive = activeId === link.id;
                        return (
                          <li key={link.id}>
                            <button 
                              onClick={() => scrollToSection(link.id)}
                              className={cn(
                                "w-full text-left px-3 py-2 text-sm rounded-lg border-l-2 transition-all duration-200",
                                isActive 
                                  ? "border-accent-cyan text-accent-cyan bg-accent-cyan/10 font-medium" 
                                  : "border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                              )}
                            >
                              {link.label}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </nav>
            </aside>
          </div>
        )}

        <main className="flex-1 w-full max-w-[800px] mx-auto px-4 sm:px-8 lg:px-16 py-12 lg:py-16 pb-32">
          
          <div id="what-is" className="doc-section scroll-mt-24 mb-24">
            <Badge variant="cyan" className="mb-4">Introduction</Badge>
            <h1 className="text-4xl md:text-5xl font-black mb-6 text-text-primary tracking-tight">What is GuessMyPlace?</h1>
            <p className="text-lg text-text-secondary leading-[1.8] mb-8">
              GuessMyPlace is an AI-powered geography game where you think of any place on Earth — a country, city, landmark, or natural wonder — and Atlas, our intelligent engine, figures it out through smart questions.
            </p>

            <div className="border-l-4 border-accent-cyan bg-accent-cyan/5 p-6 rounded-r-2xl mb-12 shadow-sm">
              <p className="text-text-primary leading-relaxed">
                Unlike traditional Akinator-style games that cover pop culture, GuessMyPlace specializes exclusively in geography — giving Atlas deep, focused intelligence about places.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-12 mb-12">
              <div className="bg-bg-surface border border-border-subtle p-6 rounded-2xl hover:border-accent-cyan/50 transition-colors">
                <h3 className="text-accent-cyan font-bold mb-2">Bayesian Intelligence</h3>
                <p className="text-text-muted text-sm leading-relaxed">Uses probabilities and semantic embeddings to narrow down predictions efficiently.</p>
              </div>
              <div className="bg-bg-surface border border-border-subtle p-6 rounded-2xl hover:border-accent-cyan/50 transition-colors">
                <h3 className="text-accent-cyan font-bold mb-2">Learns From Mistakes</h3>
                <p className="text-text-muted text-sm leading-relaxed">Every time you defeat Atlas, he learns the place for future games, getting smarter daily.</p>
              </div>
              <div className="bg-bg-surface border border-border-subtle p-6 rounded-2xl hover:border-accent-cyan/50 transition-colors">
                <h3 className="text-accent-cyan font-bold mb-2">All Place Types</h3>
                <p className="text-text-muted text-sm leading-relaxed">Supports countries, capital cities, historical monuments, bodies of water, and more.</p>
              </div>
              <div className="bg-bg-surface border border-border-subtle p-6 rounded-2xl hover:border-accent-cyan/50 transition-colors">
                <h3 className="text-accent-cyan font-bold mb-2">Open Source</h3>
                <p className="text-text-muted text-sm leading-relaxed">The frontend, prompts, and inference logic are fully documented and available on GitHub.</p>
              </div>
            </div>
          </div>

          <div id="architecture" className="doc-section scroll-mt-24 mb-24">
            <h2 className="text-3xl font-black mb-3 text-text-primary">Atlas Engine Architecture</h2>
            <p className="text-lg text-text-secondary mb-8">A multi-layered AI system designed for geographic intelligence.</p>
              
            <pre className="text-accent-cyan font-mono text-[11px] sm:text-[13px] bg-[#0a0e17] p-6 lg:p-8 rounded-2xl overflow-x-auto border border-border-subtle shadow-xl my-10 leading-loose">
{`User Answer → Probability Manager → Bayesian Network → Question Selector → Next Question
                    ↓                                         ↑
            Confidence Calculator                    Feature Importance
                    ↓
            Inference Engine ──→ Prediction`}
            </pre>

            <div className="mt-10 space-y-4">
              <Accordion title="Probability Manager">
                Updates the probability of each place being correct after every answer. Uses likelihood multipliers: Yes=×10 match, No=×0.001 match. Soft filters eliminate near-zero probability places.
              </Accordion>
              <Accordion title="Bayesian Network">
                Propagates belief changes across related attributes. If you answer 'Yes, it's in Scandinavia', the network increases probabilities for Christianity, cold climate, and Germanic language attributes.
              </Accordion>
              <Accordion title="Question Selector">
                Picks the optimal next question using a weighted score: 40% information gain, 35% stage appropriateness, 10% balance, 10% Bayesian belief, 5% feature importance.
              </Accordion>
              <Accordion title="Confidence Calculator">
                Computes a 0-100 confidence score from 4 signals: probability gap between top two places, normalized top probability, item count, and entropy.
              </Accordion>
            </div>
          </div>

          <div id="answer-types" className="doc-section scroll-mt-24 mb-24">
            <h2 className="text-3xl font-black mb-4 text-text-primary">Answer Types Explained</h2>
            <p className="text-lg text-text-secondary mb-8">
              How your responses influence Atlas's Bayesian belief state.
            </p>
            <div className="overflow-x-auto rounded-xl border border-border-subtle bg-bg-surface w-full shadow-lg">
              <table className="w-full text-left text-[14px]">
                <thead className="bg-[#0a0e17] border-b border-border-subtle text-text-muted">
                  <tr>
                    <th className="p-4 font-semibold w-1/4">Answer</th>
                    <th className="p-4 font-semibold w-1/4">When to use</th>
                    <th className="p-4 font-semibold w-1/2">Effect on probabilities</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle text-text-primary">
                  <tr className="hover:bg-bg-elevated transition-colors">
                    <td className="p-4"><Badge className="bg-accent-green/10 text-accent-green border-accent-green/30">Yes</Badge></td>
                    <td className="p-4">Definitely true</td>
                    <td className="p-4 font-mono text-xs">Match: ×10, Mismatch: ×0.001</td>
                  </tr>
                  <tr className="hover:bg-bg-elevated transition-colors">
                    <td className="p-4"><Badge className="bg-accent-cyan/10 text-accent-cyan border-accent-cyan/30">Probably</Badge></td>
                    <td className="p-4">Likely true</td>
                    <td className="p-4 font-mono text-xs">Match: ×3.5, Mismatch: ×0.15</td>
                  </tr>
                  <tr className="hover:bg-bg-elevated transition-colors">
                    <td className="p-4"><Badge variant="outline" className="border-border">Don't Know</Badge></td>
                    <td className="p-4">Unsure</td>
                    <td className="p-4 font-mono text-xs">No change (×1.0)</td>
                  </tr>
                  <tr className="hover:bg-bg-elevated transition-colors">
                    <td className="p-4"><Badge className="bg-accent-amber/10 text-accent-amber border-accent-amber/30">Probably Not</Badge></td>
                    <td className="p-4">Likely false</td>
                    <td className="p-4 font-mono text-xs">Match: ×0.15, Mismatch: ×3.5</td>
                  </tr>
                  <tr className="hover:bg-bg-elevated transition-colors">
                    <td className="p-4"><Badge className="bg-accent-red/10 text-accent-red border-accent-red/30">No</Badge></td>
                    <td className="p-4">Definitely false</td>
                    <td className="p-4 font-mono text-xs">Match: ×0.001, Mismatch: ×10</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div id="keyboard-shortcuts" className="doc-section scroll-mt-24 mb-24">
            <h2 className="text-3xl font-black mb-4 text-text-primary">Keyboard Shortcuts</h2>
            <p className="text-lg text-text-secondary mb-8">
              Power users can play the game entirely without a mouse using these shortcuts.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
               {['1', '2', '3', '4', '5'].map((key, i) => {
                 const labels = ['Yes', 'Probably', "Don't Know", 'Probably Not', 'No'];
                 return (
                   <div key={key} className="flex items-center space-x-4 bg-bg-surface p-4 rounded-xl border border-border-subtle shadow-sm hover:border-accent-cyan/30 transition-colors">
                     <kbd className="w-[38px] h-[38px] flex items-center justify-center font-mono text-sm bg-[#080C14] border-b-2 border-border border border-t-0 rounded-lg text-accent-cyan">{key}</kbd>
                     <span className="text-[15px] font-medium text-text-primary">{labels[i]}</span>
                   </div>
                 );
               })}
            </div>
          </div>

          <div id="api-overview" className="doc-section scroll-mt-24 mb-16">
            <h2 className="text-3xl font-black mb-6 text-text-primary">API Reference</h2>
            <p className="text-lg text-text-secondary mb-8 leading-[1.8]">
              Our REST API is built to be consumed by client applications cleanly and securely. The current production version is <code>v2</code>.
            </p>
            <div className="bg-[#0a0e17] border border-border-subtle px-5 py-4 rounded-xl font-mono text-sm inline-flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-10 shadow-lg">
              <span className="text-text-muted uppercase tracking-wider text-xs">Base URL</span>
              <div className="hidden sm:block text-border-subtle">|</div>
              <span className="text-accent-cyan break-all">https://Rafs-an09002-geoai-backend.hf.space</span>
            </div>
          </div>

          <div id="api-game" className="doc-section scroll-mt-24 mb-24">
            <h3 className="text-2xl font-bold mb-8 text-text-primary border-b border-border-subtle pb-4">Game Endpoints</h3>

            <Endpoint 
              method="POST" 
              path="/api/v2/game/start" 
              desc="Initializes a new game session and returns the first question. Generates a unique session_id to maintain state."
              body={`{
  "place_type": "country" // Optional. Defaults to mixed.
}`}
              response={`{
  "session_id": "game_123abc",
  "question": {
    "id": "q_population",
    "text": "Is the population greater than 10 million?",
    "type": "boolean"
  },
  "candidates": [
    { "id": "1", "name": "China", "confidence": 0.5 }
  ]
}`}
            />

            <Endpoint 
              method="POST" 
              path="/api/v2/game/answer" 
              desc="Submits an answer to the current question and progresses the game state. Automatically triggers prediction phase if confidence threshold is met."
              body={`{
  "session_id": "game_123abc",
  "answer": "YES" // YES, NO, PROBABLY, PROBABLY_NOT, DONT_KNOW
}`}
              response={`{
  "next_question": {
    "id": "q_europe",
    "text": "Is it located in Europe?"
  },
  "candidates": [
    { "id": "4", "name": "Germany", "confidence": 12.5 },
    { "id": "5", "name": "France", "confidence": 11.2 }
  ],
  "is_final": false,
  "confidence": 12.5,
  "active_count": 42
}`}
            />

            <Endpoint 
              method="POST" 
              path="/api/v2/game/predict" 
              desc="Forces the engine to make a final prediction for the current session based on current inference state."
              body={`{
  "session_id": "game_123abc"
}`}
              response={`{
  "prediction": {
    "id": "4",
    "name": "Germany",
    "emoji": "🇩🇪",
    "confidence": 98.5,
    "description": "A country in Central Europe..."
  },
  "alternatives": [
    { "id": "5", "name": "France", "emoji": "🇫🇷" }
  ],
  "correct": false
}`}
            />
            
            <Endpoint 
              method="POST" 
              path="/api/v2/game/feedback" 
              desc="Submits failure feedback so Atlas can recalibrate and learn from its mistakes out of band."
              body={`{
  "session_id": "game_123abc",
  "place_name": "New Zealand",
  "place_id": null
}`}
            />
          </div>

        </main>
      </div>
    </PageWrapper>
  );
}
