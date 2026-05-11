import React, { useState } from 'react';
import { useAdminStore } from '../../stores/adminStore';
import { Sparkles, CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { InfoBox } from '../../components/ui/InfoBox';

interface PlaceCheck {
  id?: string;
  name: string;
  isDuplicate: boolean;
}

interface GenerationResult {
  name: string;
  status: 'success' | 'failed';
  id?: string;
}

export default function AdminAtlasMind() {
  const token = useAdminStore(s => s.idToken);
  const [inputText, setInputText] = useState('');
  const [placeType, setPlaceType] = useState('All');
  const [isChecking, setIsChecking] = useState(false);
  const [checkResults, setCheckResults] = useState<{ duplicates: PlaceCheck[], new: PlaceCheck[] } | null>(null);
  const [selectedForGen, setSelectedForGen] = useState<Set<string>>(new Set());
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [genResults, setGenResults] = useState<GenerationResult[]>([]);
  const [genProgress, setGenProgress] = useState({ current: 0, total: 0 });

  const numLines = inputText.split('\n').filter(l => l.trim().length > 0).length;

  const handleCheckDuplicates = async () => {
    if (!inputText.trim()) return;
    
    setIsChecking(true);
    setCheckResults(null);
    setSelectedForGen(new Set());
    
    try {
      const places = inputText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      // Mock API call: POST /api/admin/atlasmind/check
      await new Promise(res => setTimeout(res, 1000));
      
      // Mock randomly marking some as duplicates
      const results = places.map((name, i) => ({
        name,
        isDuplicate: name.toLowerCase() === 'mount everest' || i % 4 === 0 
      }));
      
      const duplicates = results.filter(r => r.isDuplicate);
      const newPlaces = results.filter(r => !r.isDuplicate);
      
      setCheckResults({ duplicates, new: newPlaces });
      setSelectedForGen(new Set(newPlaces.map(p => p.name)));
    } catch (e) {
      console.error(e);
    } finally {
      setIsChecking(false);
    }
  };

  const toggleSelection = (name: string) => {
    const next = new Set(selectedForGen);
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    setSelectedForGen(next);
  };

  const toggleAll = () => {
    if (!checkResults) return;
    if (selectedForGen.size === checkResults.new.length) {
      setSelectedForGen(new Set());
    } else {
      setSelectedForGen(new Set(checkResults.new.map(p => p.name)));
    }
  };

  const handleGenerate = async () => {
    if (selectedForGen.size === 0) return;
    
    setIsGenerating(true);
    setGenResults([]);
    const placesToGen = Array.from(selectedForGen);
    setGenProgress({ current: 0, total: placesToGen.length });
    
    try {
      // Mock progressive generation
      for (let i = 0; i < placesToGen.length; i++) {
        // Simulate API call for one place
        await new Promise(res => setTimeout(res, 1200));
        
        const success = Math.random() > 0.1; // 10% fail rate for simulation
        
        setGenResults(prev => [...prev, {
          name: placesToGen[i],
          status: success ? 'success' : 'failed',
          id: success ? `pl_${Math.random().toString(36).substr(2, 6)}` : undefined
        }]);
        
        setGenProgress(prev => ({ ...prev, current: prev.current + 1 }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto pb-32">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-1">AtlasMind — Data Generation</h1>
          <div className="flex items-center gap-2 text-text-secondary">
            <Sparkles className="w-4 h-4 text-accent-cyan" />
            <span>Powered by Gemini 2.5 Pro</span>
          </div>
        </div>
      </div>

      {/* How it works banner */}
      <div className="bg-bg-elevated border border-border-subtle rounded-xl p-4 mb-8 flex flex-col sm:flex-row gap-4 sm:items-center text-sm font-medium text-text-primary">
        <span className="bg-bg-surface px-2 py-1 rounded-md border border-border">1. Enter place names</span>
        <span className="hidden sm:block text-text-muted">→</span>
        <span className="bg-bg-surface px-2 py-1 rounded-md border border-border">2. Check for duplicates</span>
        <span className="hidden sm:block text-text-muted">→</span>
        <span className="bg-bg-surface px-2 py-1 rounded-md border border-border">3. Generate & add to DB</span>
      </div>

      {/* Input Section */}
      <div className="bg-bg-surface border border-border rounded-2xl p-6 mb-8">
        <label className="block text-sm font-medium text-text-primary mb-2">
          Enter place names (one per line)
        </label>
        <textarea 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Mount Everest&#10;Amazon River&#10;Vatican City&#10;Sahara Desert"
          className="w-full h-48 bg-bg-base border border-border-subtle rounded-xl p-4 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition-colors resize-y mb-2 font-mono text-sm leading-relaxed"
          disabled={isChecking || isGenerating}
        />
        <div className="flex justify-between items-center mb-6">
          <span className="text-sm text-text-secondary font-mono">{numLines} names entered</span>
          <select 
            value={placeType}
            onChange={(e) => setPlaceType(e.target.value)}
            disabled={isChecking || isGenerating}
            className="bg-bg-base border border-border-subtle text-text-primary text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-accent-cyan"
          >
            {['All', 'Country', 'City', 'Landmark', 'Natural', 'Historical', 'Religious', 'Geographic'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleCheckDuplicates}
            disabled={isChecking || isGenerating || numLines === 0}
            className="flex items-center gap-2 bg-accent-cyan text-black font-semibold py-2.5 px-6 rounded-lg hover:bg-[#00d0ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isChecking ? <Loader2 className="w-5 h-5 animate-spin" /> : <SearchIcon />}
            Check Duplicates
          </button>
        </div>
      </div>

      {/* Check Results */}
      {checkResults && !isGenerating && genResults.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Duplicates */}
          <div className="bg-bg-surface border border-border rounded-2xl p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center justify-between">
              Already in Database 
              <span className="bg-bg-elevated px-2 py-0.5 rounded-full text-sm font-mono">{checkResults.duplicates.length}</span>
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {checkResults.duplicates.length === 0 ? (
                <p className="text-text-muted text-sm py-4 text-center">No duplicates found.</p>
              ) : (
                checkResults.duplicates.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 px-3 bg-bg-base/50 rounded-lg border border-border-subtle/50 opacity-60">
                    <CheckCircle2 className="w-5 h-5 text-accent-green" />
                    <span className="text-sm font-medium text-text-primary">{p.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* New Places */}
          <div className="bg-bg-surface border border-accent-cyan/30 rounded-2xl p-6 shadow-[0_0_20px_rgba(0,194,255,0.05)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                New Places
                <span className="bg-accent-cyan/10 text-accent-cyan px-2 py-0.5 rounded-full text-sm font-mono">{checkResults.new.length}</span>
              </h3>
              {checkResults.new.length > 0 && (
                <button 
                  onClick={toggleAll}
                  className="text-sm text-text-secondary hover:text-text-primary underline decoration-border-subtle underline-offset-4"
                >
                  {selectedForGen.size === checkResults.new.length ? 'Deselect all' : 'Select all'}
                </button>
              )}
            </div>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar mb-6">
              {checkResults.new.length === 0 ? (
                <p className="text-text-muted text-sm py-4 text-center">No new places to generate.</p>
              ) : (
                checkResults.new.map((p, i) => {
                  const isSelected = selectedForGen.has(p.name);
                  return (
                    <button 
                      key={i}
                      onClick={() => toggleSelection(p.name)}
                      className={cn(
                        "w-full flex items-center gap-3 py-2.5 px-3 rounded-lg border transition-all text-left",
                        isSelected 
                          ? "bg-accent-cyan/10 border-accent-cyan/50 shadow-[0_0_10px_rgba(0,194,255,0.1)]" 
                          : "bg-bg-base border-border-subtle hover:border-border"
                      )}
                    >
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-accent-cyan shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-text-muted shrink-0" />
                      )}
                      <span className={cn("text-sm font-medium", isSelected ? "text-text-primary" : "text-text-secondary")}>
                        {p.name}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <button
              onClick={handleGenerate}
              disabled={selectedForGen.size === 0}
              className="w-full flex items-center justify-center gap-2 bg-accent-green text-black font-semibold py-3 px-6 rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-5 h-5" />
              Generate Selected ({selectedForGen.size} places)
            </button>
          </div>

        </div>
      )}

      {/* Generation Progress */}
      {(isGenerating || genResults.length > 0) && (
        <div className="bg-bg-surface border border-border rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="mb-6">
             <h3 className="text-xl font-bold text-text-primary mb-2">
               Generating Places 
               {isGenerating && <span className="ml-2 inline-block"><Loader2 className="w-5 h-5 animate-spin text-accent-cyan" /></span>}
             </h3>
             <p className="text-text-secondary font-mono text-sm">
                Progress: {genProgress.current} of {genProgress.total} generated...
             </p>
           </div>

           <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar mb-6">
              {genResults.map((result, i) => (
                <div key={i} className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  result.status === 'success' ? "bg-accent-green/5 border-accent-green/20" : "bg-accent-red/5 border-accent-red/20"
                )}>
                  <div className="flex items-center gap-3">
                    {result.status === 'success' ? (
                      <span className="text-lg">✅</span>
                    ) : (
                      <span className="text-lg">❌</span>
                    )}
                    <span className="font-medium text-text-primary">{result.name}</span>
                  </div>
                  <div className="text-xs font-mono">
                    {result.status === 'success' ? (
                      <span className="text-text-secondary">added (id: {result.id})</span>
                    ) : (
                      <span className="text-accent-red/80">generation failed</span>
                    )}
                  </div>
                </div>
              ))}
           </div>

           {!isGenerating && genResults.length > 0 && (
             <div className="pt-6 border-t border-border-subtle border-dashed">
                <InfoBox variant="info" title="Generation Complete">
                  Generated {genResults.filter(r => r.status === 'success').length} places successfully, {genResults.filter(r => r.status === 'failed').length} failed.
                </InfoBox>
                <div className="mt-4 flex justify-end">
                  <a href="/admin/places" className="text-accent-cyan hover:underline font-medium flex items-center gap-1">
                    View in Places <span className="text-lg leading-none">→</span>
                  </a>
                </div>
             </div>
           )}
        </div>
      )}

    </div>
  );
}

function SearchIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  );
}
