import React, { useState, useEffect, useRef } from 'react';
import { Play, ShieldAlert, Monitor, Terminal, Eye, Brain, Cog, CheckCircle } from 'lucide-react';
import { AgentStep } from '../types';

interface ResearchViewProps {
  politicianName: string;
  onResearchComplete: (profileId: string) => void;
  onCancel: () => void;
}

export default function ResearchView({ politicianName, onResearchComplete, onCancel }: ResearchViewProps) {
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [sourcesState, setSourcesState] = useState({
    wikidata: 'idle' as 'idle' | 'active' | 'done',
    openSanctions: 'idle' as 'idle' | 'active' | 'done',
    newsArchives: 'idle' as 'idle' | 'done',
    govGazettes: 'idle' as 'idle' | 'done',
    corporateRegistries: 'idle' as 'idle' | 'done',
  });
  
  const [seconds, setSeconds] = useState(0);
  const [researchState, setResearchState] = useState<'connecting' | 'working' | 'completed' | 'errored'>('connecting');
  const [targetId, setTargetId] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Timer interval
  useEffect(() => {
    const timer = setInterval(() => {
      if (researchState === 'working' || researchState === 'connecting') {
        setSeconds(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [researchState]);

  // Connect to SSE Stream
  useEffect(() => {
    setResearchState('working');
    setSteps([]);
    
    const es = new EventSource(`/api/research?name=${encodeURIComponent(politicianName)}`);
    eventSourceRef.current = es;

    // Listen to live agent steps
    es.addEventListener('agent-step', (e: any) => {
      try {
        const step: AgentStep = JSON.parse(e.data);
        
        // Dynamically shift visual source pills based on what the agent is currently doing
        const stepText = step.text.toLowerCase();
        setSourcesState(prev => {
          const next = { ...prev };
          if (stepText.includes('database') || stepText.includes('mongodb')) {
            next.wikidata = 'active';
          } else if (stepText.includes('wikidata')) {
            next.wikidata = 'done';
            next.openSanctions = 'active';
          } else if (stepText.includes('opensanctions') || stepText.includes('corruption') || stepText.includes('legal record') || stepText.includes('flag')) {
            next.openSanctions = 'done';
            next.govGazettes = 'active';
          } else if (stepText.includes('electoral') || stepText.includes('news')) {
            next.govGazettes = 'done';
            next.newsArchives = 'active';
          } else if (stepText.includes('saving') || stepText.includes('dossier saved')) {
            next.newsArchives = 'done';
            next.corporateRegistries = 'done';
          }
          return next;
        });

        if (step.type === 'COMPLETE') {
          setResearchState('completed');
          setTargetId(step.text); // final state text is the compiled ID
          setSourcesState({
            wikidata: 'done',
            openSanctions: 'done',
            newsArchives: 'done',
            govGazettes: 'done',
            corporateRegistries: 'done',
          });
          es.close();
        } else {
          setSteps(prev => [...prev, step]);
        }
      } catch (err) {
        console.error('Error parsing SSE event data', err);
      }
    });

    es.onerror = () => {
      // Ignore initial connections drops or handle if stays in dark
      if (researchState === 'working') {
        setResearchState('errored');
        es.close();
      }
    };

    return () => {
      if (es) {
        es.close();
      }
    };
  }, [politicianName]);

  // Auto scroll to bottom when steps arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [steps]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const secs = (totalSec % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="flex-grow flex flex-col p-6 max-w-7xl mx-auto w-full relative">
      
      {/* Agent Header */}
      <div className="flex justify-between items-center mb-8 border-b border-[#27272a] pb-4 font-mono">
        <div className="flex items-center gap-4">
          <div className={`w-3.5 h-3.5 rounded-full ${researchState === 'completed' ? 'bg-[#34d399]' : 'bg-[#f59e0b]'} animate-pulse`}></div>
          <h1 className="text-lg md:text-2xl font-bold text-[#ffc174]">
            {researchState === 'completed' ? 'Research Complete: ' : 'Researching: '} 
            <span className="text-white">{politicianName}</span>
          </h1>
        </div>
        <div className="text-xs text-[#a1a1aa] flex items-center gap-2 bg-[#131315] border border-[#27272a] py-1.5 px-3">
          <Terminal className="w-3.5 h-3.5 text-[#f59e0b]" />
          <span>ELAPSED: <span className="font-bold text-[#ffc174] font-mono">{formatTimer(seconds)}</span></span>
        </div>
      </div>

      {/* Source Progress Pills */}
      <div className="mb-10 font-mono">
        <h3 className="text-xs font-bold text-[#d8c3ad] mb-4 uppercase tracking-wider">Active Sourcing Feed</h3>
        <div className="flex flex-wrap gap-3 text-xs">
          
          <div className={`border rounded px-4 py-2 flex items-center gap-2 bg-[#131315] transition-all duration-300 ${
            sourcesState.wikidata === 'done' ? 'border-[#34d399]/40 text-white' : 
            sourcesState.wikidata === 'active' ? 'border-[#f59e0b] shadow-[0_0_8px_rgba(245,158,11,0.15)] text-[#f4f4f5]' : 
            'border-[#27272a] opacity-40 text-[#a1a1aa]'
          }`}>
            <span className={`w-2 h-2 rounded-full ${sourcesState.wikidata === 'done' ? 'bg-[#34d399]' : sourcesState.wikidata === 'active' ? 'bg-[#f59e0b] animate-ping' : 'bg-[#a1a1aa]'}`}></span>
            <span>Metadata Registries</span>
          </div>

          <div className={`border rounded px-4 py-2 flex items-center gap-2 bg-[#131315] transition-all duration-300 ${
            sourcesState.openSanctions === 'done' ? 'border-[#34d399]/40 text-white' : 
            sourcesState.openSanctions === 'active' ? 'border-[#f59e0b] shadow-[0_0_8px_rgba(245,158,11,0.15)] text-[#f4f4f5]' : 
            'border-[#27272a] opacity-40 text-[#a1a1aa]'
          }`}>
            <span className={`w-2 h-2 rounded-full ${sourcesState.openSanctions === 'done' ? 'bg-[#34d399]' : sourcesState.openSanctions === 'active' ? 'bg-[#f59e0b] animate-ping' : 'bg-[#a1a1aa]'}`}></span>
            <span>Sourcing Grounds</span>
          </div>

          <div className={`border rounded px-4 py-2 flex items-center gap-2 bg-[#131315] transition-all duration-300 ${
            sourcesState.govGazettes === 'done' ? 'border-[#34d399]/40 text-white' : 
            sourcesState.govGazettes === 'active' ? 'border-[#f59e0b] shadow-[0_0_8px_rgba(245,158,11,0.15)] text-[#f4f4f5]' : 
            'border-[#27272a] opacity-40 text-[#a1a1aa]'
          }`}>
            <span className={`w-2 h-2 rounded-full ${sourcesState.govGazettes === 'done' ? 'bg-[#34d399]' : sourcesState.govGazettes === 'active' ? 'bg-[#f59e0b] animate-ping' : 'bg-[#a1a1aa]'}`}></span>
            <span>Electoral Archives</span>
          </div>

          <div className={`border rounded px-4 py-2 flex items-center gap-2 bg-[#131315] transition-all duration-300 ${
            sourcesState.newsArchives === 'done' ? 'border-[#34d399]/40 text-white' : 
            sourcesState.newsArchives === 'active' ? 'border-[#f59e0b] shadow-[0_0_8px_rgba(245,158,11,0.15)] text-[#f4f4f5]' : 
            'border-[#27272a] opacity-40 text-[#a1a1aa]'
          }`}>
            <span className={`w-2 h-2 rounded-full ${sourcesState.newsArchives === 'done' ? 'bg-[#34d399]' : sourcesState.newsArchives === 'active' ? 'bg-[#f59e0b] animate-ping' : 'bg-[#a1a1aa]'}`}></span>
            <span>State Bulletins</span>
          </div>

          <div className={`border rounded px-4 py-2 flex items-center gap-2 bg-[#131315] transition-all duration-300 ${
            sourcesState.corporateRegistries === 'done' ? 'border-[#34d399]/40 text-white' : 
            'border-[#27272a] opacity-40 text-[#a1a1aa]'
          }`}>
            <span className={`w-2 h-2 rounded-full ${sourcesState.corporateRegistries === 'done' ? 'bg-[#34d399]' : 'bg-[#a1a1aa]'}`}></span>
            <span>Legal Court Registries</span>
          </div>

        </div>
      </div>

      {/* Agent Stream Log Terminal Panel */}
      <div className="bg-[#0e0e10] border border-[#27272a] rounded-md flex-grow flex flex-col mb-16 overflow-hidden min-h-[350px]">
        <div className="bg-[#18181b] border-b border-[#27272a] px-4 py-2 flex items-center justify-between font-mono text-[10px] text-[#a1a1aa] uppercase tracking-wider">
          <span>Execution Stream Log</span>
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#27272a]"></span>
            <span className="w-2 h-2 rounded-full bg-[#27272a]"></span>
            <span className="w-2 h-2 rounded-full bg-[#27272a]"></span>
          </div>
        </div>

        <div className="p-6 font-mono overflow-y-auto max-h-[500px] space-y-6 flex-grow text-xs leading-relaxed text-left">
          {researchState === 'working' && steps.length === 0 && (
            <div className="flex items-center gap-2 text-[#a1a1aa]">
              <span className="w-3.5 h-3.5 bg-[#f59e0b] animate-ping rounded-full inline-block"></span>
              <span>Engaging agent search pipelines...</span>
            </div>
          )}

          {steps.map((step, idx) => {
            const isThought = step.type === 'THOUGHT';
            const isAction = step.type === 'ACTION';
            const isObs = step.type === 'OBSERVATION';

            return (
              <div 
                key={idx} 
                className={`flex gap-4 transition-opacity duration-300 ${isThought ? 'opacity-85' : 'opacity-100'}`}
              >
                <div className="w-8 flex flex-col items-center">
                  <div className={`w-8 h-8 rounded border flex items-center justify-center bg-[#131315] ${
                    isThought ? 'border-[#f59e0b]/40 text-[#f59e0b]' :
                    isAction ? 'border-[#38bdf8]/40 text-[#38bdf8]' :
                    'border-[#34d399]/40 text-[#34d399]'
                  }`}>
                    {isThought && <Brain className="w-4 h-4" />}
                    {isAction && <Cog className="w-4 h-4 className='animate-spin'" />}
                    {isObs && <Eye className="w-4 h-4" />}
                  </div>
                  {idx < steps.length - 1 && <div className="w-px bg-[#27272a] flex-grow my-2 min-h-[30px]" />}
                </div>

                <div className="flex-grow pb-1">
                  <span className={`block uppercase font-bold text-[9px] tracking-widest mb-1 ${
                    isThought ? 'text-[#f59e0b]' :
                    isAction ? 'text-[#38bdf8]' :
                    'text-[#34d399]'
                  }`}>
                    {isThought ? '// thinking' : isAction ? '→ tool call' : '← result'}
                  </span>

                  {isAction ? (
                    <div className="bg-[#131315] border border-[#27272a] p-3.5 rounded text-xs select-all text-[#38bdf8] font-semibold break-all leading-relaxed">
                      {step.text}
                    </div>
                  ) : (
                    <p className={`pl-2 border-l ${
                      isThought ? 'border-[#f59e0b]/20 text-[#a1a1aa]' : 'border-[#34d399]/20 text-[#f4f4f5]'
                    }`}>
                      {step.text}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {researchState === 'errored' && (
            <div className="border border-[#f87171]/30 bg-[#f87171]/5 p-4 rounded text-center text-[#f87171] flex flex-col items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-[#f87171]" />
              <div>
                <p className="font-bold">Investigation Loop Interrupted</p>
                <p className="text-[11px] text-[#a1a1aa] mt-1">Transient network error. Fallback archival baseline is generated in MongoDB.</p>
              </div>
              <button 
                onClick={onCancel}
                className="mt-2 bg-[#f87171]/10 hover:bg-[#f87171]/20 border border-[#f87171]/50 text-white font-mono px-4 py-2 text-xs rounded transition-colors"
              >
                Search Again &larr;
              </button>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </div>

      {/* Connection trigger or completed button */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-0 p-6 bg-gradient-to-t from-[#09090b] to-transparent pointer-events-none flex justify-between max-w-7xl mx-auto w-full z-20 font-mono">
        <button 
          onClick={onCancel}
          className="pointer-events-auto bg-[#131315] hover:bg-[#18181b] text-[#d8c3ad] border border-[#27272a] hover:border-[#ffc174] font-bold py-3 px-6 rounded text-xs transition-colors cursor-pointer"
        >
          Cancel Search &larr;
        </button>

        {researchState === 'completed' && targetId && (
          <button 
            onClick={() => onResearchComplete(targetId)}
            className="pointer-events-auto bg-[#f59e0b] hover:bg-[#ffc174] text-neutral-950 font-bold py-3 px-8 rounded hover:scale-[1.01] transition-all flex items-center gap-2 border border-[#f59e0b] shadow-[0_0_15px_rgba(245,158,11,0.25)] animate-bounce cursor-pointer text-xs uppercase"
          >
            <CheckCircle className="w-4 h-4 text-neutral-950" />
            View Completed Profile &rarr;
          </button>
        )}
      </div>

    </div>
  );
}
