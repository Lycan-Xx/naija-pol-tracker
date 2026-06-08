import React, { useState, useEffect } from 'react';
import { Search, History, Terminal, CheckSquare } from 'lucide-react';
import { PoliticianProfile } from '../types';

interface HomeViewProps {
  onInitiateResearch: (name: string) => void;
  onSelectProfile: (id: string) => void;
  onNavigate: (view: 'home' | 'research' | 'profile' | 'browse') => void;
}

export default function HomeView({ onInitiateResearch, onSelectProfile, onNavigate }: HomeViewProps) {
  const [searchVal, setSearchInput] = useState('');
  const [allProfiles, setAllProfiles] = useState<PoliticianProfile[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<PoliticianProfile[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [stats, setStats] = useState({ totalProfiles: 12, totalSources: 5 });

  useEffect(() => {
    // Fetch stats
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        if (data.totalProfiles) {
          setStats({ totalProfiles: data.totalProfiles, totalSources: data.totalSources });
        }
      })
      .catch(() => {});

    // Fetch lists
    fetch('/api/profiles')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAllProfiles(data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (searchVal.trim() === '') {
      setFilteredSuggestions([]);
    } else {
      const val = searchVal.toLowerCase();
      const filtered = allProfiles.filter(p => 
        p.fullName.toLowerCase().includes(val) || 
        p.aliases.some(alias => alias.toLowerCase().includes(val)) ||
        p.stateOfOrigin.toLowerCase().includes(val)
      );
      setFilteredSuggestions(filtered.slice(0, 5));
    }
  }, [searchVal, allProfiles]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      onInitiateResearch(searchVal.trim());
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center pt-16 pb-16 px-6 max-w-7xl mx-auto w-full z-10 relative">
      
      {/* Scanline Effect Overlay emulation */}
      <div className="absolute inset-0 bg-transparent pointer-events-none opacity-5 hover:opacity-10 transition-opacity" style={{
        background: `linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)`,
        backgroundSize: '100% 4px'
      }}></div>

      {/* Hero Section */}
      <section className="w-full flex flex-col items-center text-center mb-16 relative">
        <h2 className="text-3xl md:text-5xl font-mono font-bold text-[#f4f4f5] tracking-tight leading-tight max-w-4xl mb-4">
          Research any Nigerian politician in 60 seconds.
        </h2>
        <p className="text-base md:text-lg font-mono text-[#d8c3ad] mb-12 max-w-2xl bg-neutral-950/20 py-1 px-4 rounded-md">
          Every claim, sourced. A modern terminal for political accountability.
        </p>

        {/* Search Bar Terminal Prompt */}
        <div className="w-full max-w-3xl relative mb-12">
          <form onSubmit={handleSubmit} className="relative flex items-center bg-[#131315] border border-[#27272a] rounded p-1.5 focus-within:border-[#f59e0b] focus-within:ring-1 focus-within:ring-[#f59e0b] transition-all duration-200">
            <Search className="w-5 h-5 text-[#d8c3ad] ml-4 absolute pointer-events-none" />
            <input 
              className="w-full bg-transparent border-none text-[#f4f4f5] font-mono text-sm md:text-base pl-12 pr-44 py-4 focus:outline-none focus:ring-0 placeholder:text-[#52525b]" 
              id="search-input" 
              placeholder="Enter a name, e.g., 'Bola Ahmed Tinubu'" 
              type="text"
              value={searchVal}
              onChange={(e) => setSearchInput(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              autoComplete="off"
            />
            {isFocused && searchVal === '' && (
              <span className="absolute left-[345px] top-[25px] w-2.5 h-5 bg-[#f59e0b] animate-[blink_1s_step-end_infinite] pointer-events-none"></span>
            )}

            <button 
              type="submit"
              className="absolute right-2 px-6 py-3 bg-[#f59e0b] text-[#2a1700] hover:bg-[#ffc174] transition-colors rounded font-mono text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Initiate Trace
            </button>
          </form>

          {/* Autocomplete Predictions Panel */}
          {isFocused && filteredSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-[#18181b] border border-[#27272a] rounded-md shadow-2xl overflow-hidden z-30 font-mono text-left max-h-72 overflow-y-auto">
              <div className="px-4 py-2 border-b border-[#27272a] text-[10px] text-[#a1a1aa] uppercase tracking-wider">
                Cached dossiers matches ({filteredSuggestions.length})
              </div>
              {filteredSuggestions.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onSelectProfile(p.id)}
                  type="button"
                  className="w-full px-4 py-3 hover:bg-[#27272a] flex items-center justify-between border-b border-[#27272a]/40 text-sm transition-colors text-left"
                >
                  <span className="text-[#f4f4f5] font-medium">{p.fullName}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-[#a1a1aa]">{p.currentPosition || p.stateOfOrigin}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#201f22] border border-[#27272a] text-[#ffc174] font-bold">
                      {p.currentParty}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Stats Badges */}
        <div className="flex flex-wrap justify-center gap-4 text-xs font-mono">
          <div className="bg-[#1c1b1d] border border-[#27272a] px-4 py-2.5 rounded-sm flex items-center gap-2 text-[#e5e1e4]">
            <span className="w-2 h-2 bg-[#34d399] rounded-full"></span>
            <span>{stats.totalProfiles} POLITICIANS PROFILED</span>
          </div>
          <div className="bg-[#1c1b1d] border border-[#27272a] px-4 py-2.5 rounded-sm flex items-center gap-2 text-[#e5e1e4]">
            <span className="w-2 h-2 bg-[#38bdf8] rounded-full"></span>
            <span>{stats.totalSources} DATA SOURCES</span>
          </div>
          <div className="bg-[#1c1b1d] border border-[#27272a] px-4 py-2.5 rounded-sm flex items-center gap-2 text-[#e5e1e4]">
            <span className="w-2 h-2 bg-[#f59e0b] rounded-full animate-pulse"></span>
            <span>100% SOURCE-GROUNDED</span>
          </div>
        </div>
      </section>

      {/* Recently Profiled Grid (Bento Style) */}
      <section className="w-full mb-20 relative">
        <div className="flex items-center gap-2 mb-8 border-b border-[#27272a] pb-3">
          <History className="text-[#ffc174] w-4 h-4" />
          <h3 className="text-sm font-mono text-[#d8c3ad] uppercase tracking-widest font-semibold">
            Recently Profiled
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {allProfiles.slice(0, 3).map((politician) => (
            <div 
              key={politician.id}
              onClick={() => onSelectProfile(politician.id)}
              className="group block bg-[#131315] border border-[#27272a] rounded overflow-hidden hover:border-[#ffc174] transition-all duration-300 flex flex-col h-full relative cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#131315] via-transparent to-transparent z-10 pointer-events-none"></div>
              
              <div className="h-48 w-full bg-[#1c1b1d] relative overflow-hidden">
                <img 
                  alt={politician.fullName} 
                  className="w-full h-full object-cover object-top opacity-60 mix-blend-luminosity group-hover:opacity-100 group-hover:mix-blend-normal group-hover:scale-105 transition-all duration-500 rounded-t-sm" 
                  src={politician.photoUrl} 
                />
              </div>

              <div className="p-6 flex flex-col flex-grow z-20 bg-[#131315]">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-lg font-mono font-bold text-[#f4f4f5] group-hover:text-[#ffc174] transition-colors">
                    {politician.fullName}
                  </h4>
                  <span className="text-[10px] uppercase font-bold text-[#ffc174] px-2 py-0.5 rounded bg-[#2a1700] border border-[#ffc174]/20">
                    {politician.currentParty}
                  </span>
                </div>
                <p className="text-xs font-mono text-[#a1a1aa] mb-4 min-h-[32px] line-clamp-2">
                  {politician.currentPosition || politician.stateOfOrigin}
                </p>

                <div className="mt-auto pt-4 border-t border-[#27272a]/50">
                  <div className="flex justify-between text-[10px] font-mono text-[#d8c3ad] mb-1.5 uppercase font-medium">
                    <span>DATA COMPLETENESS</span>
                    <span>{politician.completenessPercentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#2a2a2c] rounded-none overflow-hidden">
                    <div 
                      className="h-full bg-[#f59e0b] rounded-none transition-all duration-500" 
                      style={{ width: `${politician.completenessPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <button 
            onClick={() => onNavigate('browse')}
            className="text-xs font-mono text-[#ffc174] border border-[#27272a] hover:border-[#ffc174] py-2 px-6 hover:bg-[#ffc174]/5 transition-colors cursor-pointer"
          >
            Browse All Profiles &rarr;
          </button>
        </div>
      </section>

      {/* How It Works - System Protocol */}
      <section className="w-full max-w-5xl">
        <div className="flex items-center gap-2 mb-8 border-b border-[#27272a] pb-3">
          <Terminal className="text-[#ffc174] w-4 h-4" />
          <h3 className="text-xs font-mono text-[#d8c3ad] uppercase tracking-widest font-semibold">
            System Protocol
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting Line Desktop */}
          <div className="hidden md:block absolute top-6 left-[16%] right-[16%] h-[1px] bg-[#27272a] z-0"></div>

          {/* Step 1 */}
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-[#131315] border border-[#27272a] rounded-full flex items-center justify-center mb-4 transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.05)] hover:border-[#f59e0b]">
              <span className="text-[#ffc174] font-bold text-sm">01</span>
            </div>
            <h4 className="text-sm font-bold text-[#f4f4f5] font-mono mb-2">Query Target</h4>
            <p className="text-xs text-[#a1a1aa] font-mono leading-relaxed px-4">
              Enter the name of any active or historical political figure into our auditing terminal prompt.
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-[#131315] border border-[#27272a] rounded-full flex items-center justify-center mb-4 transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.05)] hover:border-[#f59e0b]">
              <span className="text-[#ffc174] font-bold text-sm">02</span>
            </div>
            <h4 className="text-sm font-bold text-[#f4f4f5] font-mono mb-2">Agent Research</h4>
            <p className="text-xs text-[#a1a1aa] font-mono leading-relaxed px-4">
              The AI Agent crawls active electoral gazettes, verified transcripts, and audit repositories.
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-[#f59e0b] border border-[#ffc174] rounded-full flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <CheckSquare className="text-neutral-950 w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#f4f4f5] font-mono mb-2">Verified Profile</h4>
            <p className="text-xs text-[#a1a1aa] font-mono leading-relaxed px-4">
              Examine the structured dossier compiling timeline evidence, financing bills, and legal files.
            </p>
          </div>
        </div>
      </section>

      {/* CSS blinking styling injection for cursor effect */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>

    </div>
  );
}
