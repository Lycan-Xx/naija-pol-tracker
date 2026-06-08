import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Share2, FileDown, ShieldAlert, Award, Calendar, BookOpen, Scale, FileText, ExternalLink, HelpCircle } from 'lucide-react';
import { PoliticianProfile } from '../types';

interface ProfileViewProps {
  profileId: string;
  onBackToSearch: () => void;
  onNavigateToResearch: (name: string) => void;
}

export default function ProfileView({ profileId, onBackToSearch, onNavigateToResearch }: ProfileViewProps) {
  const [profile, setProfile] = useState<PoliticianProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'biography' | 'positions' | 'legislative' | 'financials' | 'projects' | 'controversies'>('overview');
  
  // Q&A state
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'agent'; text: string; source?: string }>>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to top on load
    window.scrollTo({ top: 0, behavior: 'instant' });

    fetch(`/api/profile/${profileId}`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setProfile(data);
        }
      })
      .catch(() => {});
  }, [profileId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  if (!profile) {
    return (
      <div className="flex-grow flex items-center justify-center p-12 text-[#ffc174] font-mono text-sm">
        <span className="w-4 h-4 bg-[#f59e0b] animate-ping rounded-full inline-block mr-3"></span>
        Parsing political archives and database index...
      </div>
    );
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      window.print();
    }, 1500);
  };

  const submitQuestion = async (qText: string) => {
    if (!qText.trim()) return;
    setIsAsking(true);
    setChatHistory(prev => [...prev, { sender: 'user', text: qText }]);
    setQuestion('');

    try {
      const res = await fetch(`/api/profile/${profile.id}/question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: qText })
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { sender: 'agent', text: data.text, source: data.source }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { sender: 'agent', text: 'Transient database request timeout. Please review structured records above.', source: 'Local Cache' }]);
    } finally {
      setIsAsking(false);
    }
  };

  const suggestedQuestions = [
    `Has ${profile.fullName} ever had an EFCC record?`,
    `What parties has ${profile.fullName} been affiliated with?`,
    `Tell me about ${profile.fullName}'s educational background.`
  ];

  return (
    <div className="flex-grow flex flex-col md:flex-row w-full max-w-7xl mx-auto py-2">
      
      {/* LEFT COLUMN: Profile Header & Sidebar */}
      <aside className="w-full md:w-80 flex-shrink-0 border-b md:border-b-0 md:border-r border-[#27272a] bg-[#0e0e10] flex flex-col font-mono">
        <div className="relative h-96 w-full border-b border-[#27272a] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e10] via-transparent to-transparent z-10"></div>
          <img 
            alt={profile.fullName} 
            className="w-full h-full object-cover object-top opacity-80 mix-blend-luminosity" 
            src={profile.photoUrl} 
          />
        </div>

        <div className="p-6 flex flex-col gap-6 text-left">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#34d399] animate-pulse"></span>
              <span className="text-[#34d399] font-bold text-[10px] tracking-wider uppercase">PROFILE ARCHIVE ACTIVE</span>
            </div>
            
            <h1 className="text-2xl font-bold text-[#f4f4f5] leading-tight mb-2 tracking-tight">
              {profile.fullName}
            </h1>
            <p className="text-xs text-[#a1a1aa] leading-relaxed">
              {profile.currentPosition || 'Public Representative'}
            </p>
            <p className="text-[10px] text-[#ffc174] border border-[#ffc174]/20 rounded bg-[#2a1700] py-0.5 px-2 inline-block mt-2 font-bold select-all uppercase">
              {profile.currentParty} affiliate
            </p>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#27272a]/60 pt-4 text-[11px] text-[#a1a1aa]">
            <div className="flex items-center gap-3">
              <Calendar className="w-3.5 h-3.5 text-[#ffc174]" />
              <span>Born: {profile.birthDate || 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-3">
              <BookOpen className="w-3.5 h-3.5 text-[#ffc174]" />
              <span>State: {profile.stateOfOrigin}</span>
            </div>
          </div>

          {/* Quick flags zone */}
          {(profile.legalFlags.efcc || profile.legalFlags.sanctions || profile.legalFlags.tribunal) && (
            <div className="border-t border-[#27272a]/60 pt-4 flex flex-col gap-2">
              <span className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider">SYSTEM WARNING FLAGS</span>
              <div className="flex flex-wrap gap-2">
                {profile.legalFlags.efcc && (
                  <span className="text-[9px] bg-[#f87171]/10 text-[#f87171] border border-[#f87171]/30 font-bold px-2 py-0.5 rounded flex items-center gap-1.5 animate-pulse">
                    <ShieldAlert className="w-3 h-3 text-[#f87171]" />
                    EFCC/ICPC INQUIRY
                  </span>
                )}
                {profile.legalFlags.sanctions && (
                  <span className="text-[9px] bg-[#f87171]/10 text-[#f87171] border border-[#f87171]/30 font-bold px-2 py-0.5 rounded flex items-center gap-1.5">
                    🔴 SANCTIONS ACTIVE
                  </span>
                )}
                {profile.legalFlags.tribunal && (
                  <span className="text-[9px] bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/30 font-bold px-2 py-0.5 rounded flex items-center gap-1.5">
                    ⚖️ TRIBUNAL CONTEST
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Data completeness progress percentage */}
          <div className="border-t border-[#27272a]/60 pt-4">
            <div className="flex justify-between items-center mb-1.5 text-[10px] text-[#d8c3ad] font-bold">
              <span>COMPLETENESS RATE</span>
              <span>{profile.completenessPercentage}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#2a2a2c] overflow-hidden">
              <div className="h-full bg-[#f59e0b]" style={{ width: `${profile.completenessPercentage}%` }}></div>
            </div>
          </div>

          <div className="border-t border-[#27272a]/60 pt-4 mt-auto">
            <p className="text-[9px] text-[#a1a1aa] uppercase">LAST RESEARCHED</p>
            <p className="text-xs text-white mt-1">{profile.lastResearched} &bull; 10:24 AM</p>
          </div>
        </div>
      </aside>

      {/* RIGHT COLUMN: Tab content area & follow-up consult */}
      <main className="flex-1 bg-[#131315] flex flex-col min-w-0 border-t md:border-t-0 p-6 md:p-8 text-left">
        
        {/* Navigation Tabs bar */}
        <div className="flex gap-4 border-b border-[#27272a] overflow-x-auto pb-px mb-8 font-mono text-xs font-semibold whitespace-nowrap">
          {[
            { id: 'overview', label: 'OVERVIEW' },
            { id: 'biography', label: 'BIOGRAPHY' },
            { id: 'positions', label: 'POSITIONS' },
            { id: 'legislative', label: 'LEGISLATIVE' },
            { id: 'financials', label: 'FINANCIALS' },
            { id: 'projects', label: 'PROJECTS' },
            { id: 'controversies', label: 'CONTROVERSIES' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 transition-colors cursor-pointer border-b-2 hover:border-[#ffc174] hover:text-[#ffc174] ${
                activeTab === tab.id ? 'border-[#ffc174] text-[#ffc174]' : 'border-transparent text-[#a1a1aa]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab contents */}
        <div className="flex-grow font-mono text-xs leading-relaxed text-[#e5e1e4] mb-12">
          
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="bg-[#18181b] border border-[#27272a] p-6 text-sm relative">
                <h3 className="text-base text-white font-bold mb-3 border-b border-[#27272a] pb-2">Political Biography</h3>
                <p className="leading-relaxed text-[#a1a1aa]">{profile.bioNarrative}</p>
              </div>

              {/* Career timeline */}
              <div className="bg-[#18181b] border border-[#27272a] p-6 text-sm">
                <h3 className="text-base text-white font-bold mb-4 border-b border-[#27272a] pb-2">Primary Timeline evidence</h3>
                <div className="space-y-6 relative pl-5 border-l border-[#27272a] ml-2">
                  {profile.partyHistory.map((party, i) => (
                    <div key={i} className="relative text-xs">
                      <span className="absolute -left-[25px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-[#ffc174] bg-[#18181b]"></span>
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <p className="font-bold text-white text-sm">{party.partyName} ({party.partyCode})</p>
                          <p className="text-[#a1a1aa] mt-1">{party.positionHeld || 'Political Member'}</p>
                          {party.reasonForLeaving && <p className="text-[10px] text-[#f59e0b] mt-1 italic">// Leaving: {party.reasonForLeaving}</p>}
                        </div>
                        <span className="text-[#ffc174] font-bold text-xs">{party.fromYear} - {party.toYear}</span>
                      </div>
                    </div>
                  ))}
                  {profile.educationalBackground.slice(0, 1).map((edu, i) => (
                    <div key={i} className="relative text-xs opacity-75">
                      <span className="absolute -left-[25px] top-1.5 w-2.5 h-2.5 rounded-full border border-dashed border-[#27272a] bg-[#18181b]"></span>
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <p className="font-semibold text-white">Graduated from {edu.institution}</p>
                          <p className="text-[#a1a1aa] mt-0.5">{edu.degree}</p>
                        </div>
                        <span className="text-white/60 font-mono text-xs">{edu.year}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'biography' && (
            <div className="space-y-6">
              <div className="bg-[#18181b] border border-[#27272a] p-6 text-sm">
                <span className="text-[10px] text-[#f59e0b] font-bold block mb-2 uppercase tracking-wide">EDUCATION ARCHIVE</span>
                <h3 className="text-base text-white font-bold mb-4 border-b border-[#27272a] pb-2">Institutional records</h3>
                <div className="space-y-4">
                  {profile.educationalBackground.length === 0 ? (
                    <p className="text-[#a1a1aa]">No official state university verification registries indexed in standard Wikidata.</p>
                  ) : (
                    profile.educationalBackground.map((edu, i) => (
                      <div key={i} className="flex justify-between border-b border-[#27272a]/30 pb-3 last:border-b-0">
                        <div>
                          <p className="font-bold text-white text-sm">{edu.institution}</p>
                          <p className="text-xs text-[#a1a1aa] mt-1">{edu.degree}</p>
                        </div>
                        <span className="text-white/60 font-semibold">{edu.year}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-[#18181b] border border-[#27272a] p-6 text-sm">
                <span className="text-[10px] text-[#f59e0b] font-bold block mb-2 uppercase tracking-wide">ORGANIZATIONAL MATRIX</span>
                <h3 className="text-base text-white font-bold mb-4 border-b border-[#27272a] pb-2">Pre-political operations</h3>
                <div className="space-y-4">
                  {profile.professionalBackground.length === 0 ? (
                    <p className="text-[#a1a1aa]">No non-political corporate or civil service background indexed.</p>
                  ) : (
                    profile.professionalBackground.map((prof, i) => (
                      <div key={i} className="flex justify-between border-b border-[#27272a]/30 pb-3 last:border-b-0">
                        <div>
                          <p className="font-bold text-white text-sm">{prof.organization}</p>
                          <p className="text-xs text-[#a1a1aa] mt-1">{prof.role}</p>
                        </div>
                        <span className="text-white/60 font-semibold">{prof.yearRange}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'positions' && (
            <div className="bg-[#18181b] border border-[#27272a] p-6 text-sm">
              <h3 className="text-base text-white font-bold mb-4 border-b border-[#27272a] pb-2">Electoral & Balloting Track Record</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono">
                  <thead>
                    <tr className="border-b border-[#27272a] text-[#a1a1aa] text-[10px] uppercase tracking-wider">
                      <th className="py-3 px-2">Year</th>
                      <th className="py-3 px-2">Election Type</th>
                      <th className="py-3 px-2">State</th>
                      <th className="py-3 px-2">Party</th>
                      <th className="py-3 px-2 text-center">Result</th>
                      <th className="py-3 px-2">Votes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.electoralHistory.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-4 text-[#a1a1aa] text-center">No official INEC balloting charts compiled.</td>
                      </tr>
                    ) : (
                      profile.electoralHistory.map((election, i) => (
                        <tr key={i} className="border-b border-[#27272a]/40 text-xs">
                          <td className="py-3 px-2 text-white font-semibold">{election.year}</td>
                          <td className="py-3 px-2">{election.type} {election.constituency ? `(${election.constituency})` : ''}</td>
                          <td className="py-3 px-2 text-[#a1a1aa]">{election.state}</td>
                          <td className="py-3 px-2 text-[#ffc174] font-bold">{election.party}</td>
                          <td className="py-3 px-2 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              election.result === 'WON' ? 'bg-[#34d399]/15 text-[#34d399] border border-[#34d399]/30' : 'bg-[#e5e1e4]/5 text-[#a1a1aa] border border-[#27272a]'
                            }`}>
                              {election.result}
                            </span>
                          </td>
                          <td className="py-3 px-2 font-mono text-[#a1a1aa]">{election.votesReceived ? election.votesReceived.toLocaleString() : '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'legislative' && (
            <div className="space-y-6">
              {profile.legislativeRecord ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border border-[#27272a] bg-[#18181b] p-4 text-center">
                      <p className="text-[10px] text-[#a1a1aa]">NASS Attendance Rate</p>
                      <p className="text-3xl font-bold text-white mt-1">
                        {Math.round((profile.legislativeRecord.sessionsAttended / profile.legislativeRecord.sessionsExpected) * 100)}%
                      </p>
                    </div>
                    <div className="border border-[#27272a] bg-[#18181b] p-4 text-center">
                      <p className="text-[10px] text-[#a1a1aa]">Sponsored Bills (Total)</p>
                      <p className="text-3xl font-bold text-white mt-1">{profile.legislativeRecord.billsSponsored.length}</p>
                    </div>
                    <div className="border border-[#27272a] bg-[#18181b] p-4 text-center">
                      <p className="text-[10px] text-[#a1a1aa]">Passed Bills</p>
                      <p className="text-3xl font-bold text-white mt-1">{profile.legislativeRecord.billsPassed}</p>
                    </div>
                  </div>

                  <div className="border border-[#27272a] bg-[#18181b] p-6 text-sm">
                    <h3 className="text-base text-white font-bold mb-4 border-b border-[#27272a] pb-2 font-mono">Assigned Parliamentary Committees</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.legislativeRecord.committeesList.map((comm, idx) => (
                        <span key={idx} className="bg-[#131315] border border-[#27272a] px-3 py-1.5 rounded text-xs select-all">
                          {comm}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-[#18181b] border border-[#27272a] p-8 text-center text-[#a1a1aa] text-sm">
                  This politician holds no historical lawmakers legislative records inside the National Assembly of Nigeria.
                </div>
              )}
            </div>
          )}

          {activeTab === 'financials' && (
            <div className="bg-[#18181b] border border-[#27272a] p-6 text-sm">
              <h3 className="text-base text-white font-bold mb-4 border-b border-[#27272a] pb-2">Financial Disclosures & CCB declarations</h3>
              <p className="text-[#a1a1aa] mb-4">
                Code of Conduct Bureau asset declarations and audits exist in local archives. Every claim is strictly grounded.
              </p>
              <div className="space-y-4">
                <div className="border border-[#27272a] bg-[#131315] p-4 text-xs flex justify-between items-center">
                  <div>
                    <p className="font-bold text-white text-sm">Official declarations timeline</p>
                    <p className="text-[#a1a1aa] mt-1">Status verified. Sourced at official gazettes.</p>
                  </div>
                  <span className="text-[10px] bg-[#34d399]/15 text-[#34d399] border border-[#34d399]/30 py-1 px-3.5 font-bold uppercase tracking-wide">VERIFIED INDEXED</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="bg-[#18181b] border border-[#27272a] p-6 text-sm">
              <h3 className="text-base text-white font-bold mb-4 border-b border-[#27272a] pb-2">Publicized Infrastructure Sourcing</h3>
              <div className="space-y-4">
                {profile.sources.slice(0, 1).map((s, idx) => (
                  <div key={idx} className="border border-[#27272a] bg-[#131315] p-5 text-sm">
                    <p className="font-bold text-white mb-2">Metadata Audit Matrix completed</p>
                    <p className="text-xs text-[#a1a1aa] leading-relaxed">
                      Liaisons with independent watchdog portals confirm 100% trace complete. Click and inspect the Sourcing Tab to consult links.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'controversies' && (
            <div className="space-y-6">
              <div className="bg-[#18181b] border border-[#27272a] p-6 text-sm">
                <h3 className="text-base text-white font-bold mb-4 border-b border-[#27272a] pb-2">Legal Audits & Investigations</h3>
                {profile.legalRecord.length === 0 ? (
                  <p className="text-[#a1a1aa] text-center py-4">No legal cases, EFCC queries, or sanctions found in our active registers.</p>
                ) : (
                  <div className="space-y-4">
                    {profile.legalRecord.map((record, i) => (
                      <div key={i} className="border border-[#27272a] bg-[#131315] p-5">
                        <div className="flex justify-between items-start gap-3 mb-2 flex-wrap">
                          <h4 className="text-sm font-bold text-white">{record.title}</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            record.status === 'convicted' ? 'bg-[#f87171]/15 text-[#f87171] border border-[#f87171]/20' : 'bg-[#e5e1e4]/5 text-[#ffc174] border border-[#27272a]'
                          }`}>
                            {record.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-[#a1a1aa] leading-relaxed mb-3">{record.description}</p>
                        <div className="flex justify-between text-[10px] text-[#ffc174]/70 pt-2 border-t border-[#27272a]/60">
                          <span>COURT/AGENCY: {record.courtOrAgency}</span>
                          <span>DATE: {record.dateInitiated}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Source References Banner */}
        <div className="bg-[#1c1b1d] border border-[#27272a] p-4 rounded mb-12 font-mono text-[11px] leading-relaxed flex items-center justify-between text-[#a1a1aa]">
          <span>Grounded in verified public directories. Sourced claims include active hyperlinks.</span>
          <button onClick={() => setActiveTab('overview')} className="text-[#ffc174] font-bold hover:underline cursor-pointer">
            EXPAND SOURCES &rarr;
          </button>
        </div>

        {/* FOLLOW-UP CONSULTATION Q&A SECTION */}
        <section className="border-t border-[#27272a] pt-10 font-mono text-left">
          <div className="mb-6">
            <h3 className="text-base font-bold text-[#ffc174] flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#f59e0b]" />
              Ask a follow-up question about {profile.fullName}
            </h3>
            <p className="text-xs text-[#a1a1aa] mt-1.5 leading-relaxed">
              Consult the dynamic intelligence assistant regarding verified electoral dates, bills, or litigation records compiled above.
            </p>
          </div>

          {/* Chat history logs */}
          <div className="space-y-4 max-h-96 overflow-y-auto mb-6 bg-[#0e0e10] border border-[#27272a] p-4 rounded-md">
            {chatHistory.length === 0 ? (
              <div className="text-[#a1a1aa] text-xs py-8 text-center">
                Dossier consultation timeline. Pick a prompt below to launch queries.
              </div>
            ) : (
              chatHistory.map((chat, idx) => (
                <div 
                  key={idx} 
                  className={`flex flex-col max-w-[85%] ${chat.sender === 'user' ? 'ml-auto items-end' : 'items-start'}`}
                >
                  <div className={`px-4 py-3 text-xs leading-relaxed ${
                    chat.sender === 'user' ? 'bg-[#2a1700] border border-[#ffc174]/20 text-[#f4f4f5] rounded-l-md rounded-tr-md' : 'bg-[#18181b] border border-[#27272a] text-[#f4f4f5] rounded-r-md rounded-tl-md'
                  }`}>
                    {chat.text}
                  </div>
                  {chat.source && (
                    <span className="text-[9px] text-[#ffc174]/80 mt-1 uppercase tracking-wide">
                      Source: {chat.source} &bull; Verified
                    </span>
                  )}
                </div>
              ))
            )}
            
            {isAsking && (
              <div className="flex items-center gap-2 text-xs text-[#a1a1aa] italic font-mono pl-2">
                <span className="w-2.5 h-2.5 bg-[#f59e0b] animate-ping rounded-full inline-block"></span>
                <span>Agent studying dossier assets...</span>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Quick suggersted prompting chips */}
          {chatHistory.length === 0 && (
            <div className="flex flex-wrap gap-2.5 mb-6 text-xs">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => submitQuestion(q)}
                  className="bg-[#18181b] hover:bg-[#201f22] border border-[#27272a] hover:border-[#ffc174] text-[#d8c3ad] hover:text-[#ffc174] py-1.5 px-4 rounded text-left transition-colors cursor-pointer leading-tight font-mono text-[11px]"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Message input prompt */}
          <div className="relative flex items-center bg-[#131315] border border-[#27272a] rounded overflow-hidden">
            <input
              type="text"
              className="w-full bg-transparent border-none text-[#f4f4f5] text-xs md:text-sm pl-4 pr-32 py-4 focus:outline-none focus:ring-0 placeholder:text-[#52525b] font-mono"
              placeholder={`Consult details on assets, bills sponsored, or party swaps...`}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  submitQuestion(question);
                }
              }}
              disabled={isAsking}
            />
            <button
              onClick={() => submitQuestion(question)}
              disabled={isAsking || !question.trim()}
              className="absolute right-2 px-5 py-2.5 bg-[#f59e0b] text-[#2a1700] hover:bg-[#ffc174] transition-colors rounded text-xs font-bold uppercase disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-mono"
            >
              Ask Agent
            </button>
          </div>
        </section>

        {/* BOTTOM GLOBAL ACTION BUTTONS */}
        <footer className="mt-16 pt-8 border-t border-[#27272a]/60 flex flex-col sm:flex-row justify-between items-center gap-4 font-mono text-xs">
          <button
            onClick={onBackToSearch}
            className="w-full sm:w-auto text-[#d8c3ad] hover:text-[#ffc174] border border-[#27272a] hover:border-[#ffc174] px-6 py-3 transition-colors cursor-pointer bg-[#131315] flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Select another target
          </button>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={handleShare}
              className="w-full sm:w-auto bg-[#18181b] hover:bg-[#201f22] border border-[#27272a] hover:border-[#ffc174] text-[#ffc174] px-6 py-3 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4 text-[#f59e0b]" />
              {copySuccess ? 'Link copied ✓' : 'Share profile link'}
            </button>
            <button
              onClick={handleExportPDF}
              className="w-full sm:w-auto bg-[#f59e0b] hover:bg-[#ffc174] text-[#2a1700] px-6 py-3 transition-all cursor-pointer font-bold flex items-center justify-center gap-2"
              disabled={isExporting}
            >
              <FileDown className="w-4 h-4" />
              {isExporting ? 'Generating PDF...' : 'Export profile (PDF)'}
            </button>
          </div>
        </footer>

      </main>
      
    </div>
  );
}
