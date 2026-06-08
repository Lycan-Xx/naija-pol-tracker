import React, { useState } from 'react';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import BrowseView from './components/BrowseView';
import ResearchView from './components/ResearchView';
import ProfileView from './components/ProfileView';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'research' | 'profile' | 'browse'>('home');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [researchingName, setResearchingName] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleInitiateResearch = (name: string) => {
    setResearchingName(name);
    setCurrentView('research');
  };

  const handleSelectProfile = (id: string) => {
    setSelectedProfileId(id);
    setCurrentView('profile');
  };

  const handleResearchComplete = (profileId: string) => {
    if (profileId === 'error') {
      setCurrentView('home');
    } else {
      setSelectedProfileId(profileId);
      setCurrentView('profile');
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex flex-col font-sans selection:bg-[#f59e0b] selection:text-neutral-950">
      
      {/* Dynamic Navigation Header */}
      <Navbar 
        currentView={currentView} 
        onNavigate={(view) => {
          setCurrentView(view);
          if (view === 'home') {
            setResearchingName('');
            setSelectedProfileId('');
          }
        }}
        onShare={currentView === 'profile' ? () => {
          navigator.clipboard.writeText(window.location.href);
          showToast('Dossier link compiled and copied to clipboard.');
        } : undefined}
        onExportPDF={currentView === 'profile' ? () => {
          window.print();
        } : undefined}
      />

      {/* Primary Central Workspace Render Frame */}
      <main className="flex-grow flex flex-col w-full relative">
        {currentView === 'home' && (
          <HomeView 
            onInitiateResearch={handleInitiateResearch} 
            onSelectProfile={handleSelectProfile}
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'browse' && (
          <BrowseView 
            onSelectProfile={handleSelectProfile}
            onInitiateResearch={handleInitiateResearch}
          />
        )}

        {currentView === 'research' && (
          <ResearchView 
            politicianName={researchingName}
            onResearchComplete={handleResearchComplete}
            onCancel={() => setCurrentView('home')}
          />
        )}

        {currentView === 'profile' && (
          <ProfileView 
            profileId={selectedProfileId}
            onBackToSearch={() => setCurrentView('home')}
            onNavigateToResearch={handleInitiateResearch}
          />
        )}
      </main>

      {/* Global Terminal Footer */}
      <footer className="bg-[#0e0e10] border-t border-[#27272a] py-6 px-6 font-mono text-[10px] text-[#52525b] text-center max-w-7xl mx-auto w-full flex flex-col sm:flex-row justify-between items-center gap-2">
        <span>POLITITRACE AUDITING SYSTEMS &bull; SECURE MULTI-DATABASE PIPELINE ACTIVE</span>
        <span>Independent, non-partisan, source-grounded terminal. Every claim, 100% sourced.</span>
      </footer>

      {/* Compact Toast Feedback */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-[#131315] border border-[#ffc174]/40 text-[#ffc174] py-3 px-6 rounded shadow-2xl z-50 font-mono text-xs select-none animate-fade-in animate-slide-up">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-ping inline-block mr-2"></span>
          {toastMsg}
        </div>
      )}

    </div>
  );
}
