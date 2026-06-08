import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, UserCheck, Terminal, HelpCircle } from 'lucide-react';
import { PoliticianProfile } from '../types';

interface BrowseViewProps {
  onSelectProfile: (id: string) => void;
  onInitiateResearch: (name: string) => void;
}

export default function BrowseView({ onSelectProfile, onInitiateResearch }: BrowseViewProps) {
  const [profiles, setProfiles] = useState<PoliticianProfile[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [parties, setParties] = useState<string[]>([]);
  
  // Filtering and sorting state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('State: All');
  const [selectedParty, setSelectedParty] = useState('Party: All');
  const [sortBy, setSortBy] = useState('alphabetical');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch filters on load
  useEffect(() => {
    Promise.all([
      fetch('/api/states').then(res => res.json()).catch(() => []),
      fetch('/api/parties').then(res => res.json()).catch(() => [])
    ]).then(([statesData, partiesData]) => {
      setStates(statesData);
      setParties(partiesData);
    });
  }, []);

  // Fetch profiles based on filters
  useEffect(() => {
    setIsLoading(true);
    const queryParams = new URLSearchParams({
      query: searchTerm,
      state: selectedState,
      party: selectedParty,
      sort: sortBy
    });

    fetch(`/api/profiles?${queryParams.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProfiles(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false);
      });
  }, [searchTerm, selectedState, selectedParty, sortBy]);

  return (
    <div className="flex-grow flex flex-col p-6 max-w-7xl mx-auto w-full text-left font-mono relative">
      
      {/* Page Title */}
      <div className="border-b border-[#27272a] pb-4 mb-8 flex justify-between items-baseline flex-wrap gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Terminal className="text-[#ffc174] w-5 h-5 animate-pulse" />
            Profiles directory
          </h2>
          <p className="text-xs text-[#a1a1aa] mt-1">
            Browse compiled, verified dossiers from the simulated MongoDB registry index.
          </p>
        </div>
        <div className="text-xs text-[#ffc174] border border-[#ffc174]/20 bg-[#2a1700] py-1 px-3.5 font-bold uppercase select-none">
          {profiles.length} politicians loaded
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <section className="bg-[#131315] border border-[#27272a] p-4 rounded-md mb-8 flex flex-col md:flex-row gap-4 justify-between items-center z-20">
        <div className="relative flex-grow w-full md:max-w-md">
          <Search className="w-4 h-4 text-[#a1a1aa] absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            className="w-full bg-[#18181b] border border-[#27272a] rounded text-xs pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#ffc174] placeholder:text-[#52525b] text-[#f4f4f5] font-mono"
            placeholder="Search by name, position..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto text-xs">
          {/* State Dropdown */}
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="bg-[#18181b] border border-[#27272a] hover:border-[#ffc174] text-[#d8c3ad] hover:text-[#ffc174] px-3.5 py-2 rounded focus:outline-none focus:ring-0 cursor-pointer font-mono"
          >
            <option>State: All</option>
            {states.map((state, idx) => (
              <option key={idx} value={state}>{state}</option>
            ))}
          </select>

          {/* Party Dropdown */}
          <select
            value={selectedParty}
            onChange={(e) => setSelectedParty(e.target.value)}
            className="bg-[#18181b] border border-[#27272a] hover:border-[#ffc174] text-[#d8c3ad] hover:text-[#ffc174] px-3.5 py-2 rounded focus:outline-none focus:ring-0 cursor-pointer font-mono"
          >
            <option>Party: All</option>
            {parties.map((party, idx) => (
              <option key={idx} value={party}>{party}</option>
            ))}
          </select>

          {/* Sorter */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#18181b] border border-[#27272a] hover:border-[#ffc174] text-[#d8c3ad] hover:text-[#ffc174] px-3.5 py-2 rounded focus:outline-none focus:ring-0 cursor-pointer font-mono"
          >
            <option value="alphabetical">Relevance / Alpha</option>
            <option value="Recent Updates">Recent Updates</option>
            <option value="Data Completeness">Data Completeness Highest</option>
            <option value="least-complete">Data Completeness Lowest</option>
          </select>
        </div>
      </section>

      {/* PROFILES GRID */}
      {isLoading ? (
        <div className="py-20 text-center text-[#ffc174] text-xs font-mono">
          <span className="w-3.5 h-3.5 bg-[#f59e0b] animate-ping rounded-full inline-block mr-3"></span>
          Querying collection index...
        </div>
      ) : profiles.length === 0 ? (
        <div className="border border-[#27272a] bg-[#131315] p-12 text-center rounded">
          <SlidersHorizontal className="w-8 h-8 text-[#ffc174] mx-auto mb-4" />
          <p className="text-sm font-bold text-white">No cached records match instructions</p>
          <p className="text-xs text-[#a1a1aa] mt-2 max-w-md mx-auto">
            You can dynamically initiate a fresh research investigation track on this politician to compile standard web grounding evidence!
          </p>
          {searchTerm && (
            <button
              onClick={() => onInitiateResearch(searchTerm)}
              className="mt-6 bg-[#f59e0b] hover:bg-[#ffc174] text-neutral-950 font-bold py-2.5 px-6 rounded text-xs select-none uppercase tracking-wider cursor-pointer"
            >
              CRAWL "{searchTerm}" &rarr;
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {profiles.map((politician) => (
            <div
              key={politician.id}
              onClick={() => onSelectProfile(politician.id)}
              className="hover:shadow-[0_0_15px_rgba(245,158,11,0.03)] group bg-[#131315] border border-[#27272a] rounded hover:border-[#ffc174] transition-all duration-300 flex flex-col h-full cursor-pointer overflow-hidden p-6 text-left relative"
            >
              {/* Card Title Header info */}
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] uppercase font-bold text-[#ffc174] px-1.5 py-0.5 rounded bg-[#2a1700] border border-[#ffc174]/20 select-all">
                  {politician.currentParty} CODE
                </span>
                <span className="text-[9px] text-[#a1a1aa] font-mono flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-[#34d399]" />
                  ACTIVE REGISTRY
                </span>
              </div>

              <h4 className="text-base font-bold text-[#f4f4f5] group-hover:text-[#ffc174] transition-colors leading-snug">
                {politician.fullName}
              </h4>
              <p className="text-xs text-[#a1a1aa] mt-1.5 min-h-[32px] line-clamp-2">
                {politician.currentPosition || `Political Figure of origin ${politician.stateOfOrigin}`}
              </p>

              {/* Completeness rate */}
              <div className="mt-8 pt-4 border-t border-[#27272a]/40">
                <div className="flex justify-between text-[9px] text-[#d8c3ad] font-bold mb-1.5">
                  <span>GROUNDING RATE</span>
                  <span>{politician.completenessPercentage}%</span>
                </div>
                <div className="w-full h-1 bg-[#2a2a2c] relative overflow-hidden mb-1">
                  <div
                    className="h-full bg-[#f59e0b]"
                    style={{ width: `${politician.completenessPercentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[9px] text-[#a1a1aa] mt-2 pt-0.5 font-mono">
                  <span>ORIGIN: {politician.stateOfOrigin.replace(' State', '')}</span>
                  <span className="text-white hover:underline">Inspect Profile &rarr;</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
