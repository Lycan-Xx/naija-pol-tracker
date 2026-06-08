import React, { useEffect, useState } from 'react';
import { Share2, FileDown, ExternalLink, Menu } from 'lucide-react';

interface NavbarProps {
  currentView: 'home' | 'research' | 'profile' | 'browse';
  onNavigate: (view: 'home' | 'research' | 'profile' | 'browse') => void;
  onShare?: () => void;
  onExportPDF?: () => void;
}

export default function Navbar({ currentView, onNavigate, onShare, onExportPDF }: NavbarProps) {
  const [stats, setStats] = useState({ totalProfiles: 12, totalSources: 5 });

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        if (data.totalProfiles) {
          setStats({ totalProfiles: data.totalProfiles, totalSources: data.totalSources });
        }
      })
      .catch(() => {});
  }, [currentView]);

  return (
    <nav className="bg-[#0e0e10] border-b border-[#27272a] sticky top-0 z-50">
      <div className="flex justify-between items-center w-full px-6 h-16 max-w-7xl mx-auto">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => onNavigate('home')} 
            className="text-xl font-mono font-bold text-[#ffc174] flex items-center gap-2 hover:opacity-80 transition-opacity"
            id="nav-logo"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] animate-pulse"></span>
            PolitiTrace_
          </button>
          
          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6 ml-8 font-mono text-xs">
            <button 
              onClick={() => onNavigate('home')}
              className={`transition-colors cursor-pointer py-1 ${currentView === 'home' ? 'text-[#ffc174] font-bold border-b border-[#ffc174]' : 'text-[#d8c3ad] hover:text-[#ffc174]'}`}
            >
              Overview
            </button>
            <button 
              onClick={() => onNavigate('browse')}
              className={`transition-colors cursor-pointer py-1 ${currentView === 'browse' ? 'text-[#ffc174] font-bold border-b border-[#ffc174]' : 'text-[#d8c3ad] hover:text-[#ffc174]'}`}
            >
              Browse Profiles
            </button>
            <button 
              onClick={() => onNavigate('browse')}
              className="text-[#d8c3ad] hover:text-[#ffc174] py-1 transition-colors"
            >
              Archives
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          {/* Quick numbers for status */}
          <div className="hidden lg:flex items-center gap-3 text-[10px] text-[#a1a1aa] border-r border-[#27272a] pr-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]"></span>
              {stats.totalProfiles} PROFILED
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]"></span>
              {stats.totalSources} ACTIVE SOURCES
            </span>
          </div>

          <div className="flex gap-4 text-[#ffc174]">
            {onShare && (
              <button 
                onClick={onShare}
                className="hover:text-[#f59e0b] transition-colors p-1" 
                title="Share Profile"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
            {onExportPDF && (
              <button 
                onClick={onExportPDF}
                className="hover:text-[#f59e0b] transition-colors p-1" 
                title="Export PDF Document"
              >
                <FileDown className="w-4 h-4" />
              </button>
            )}
            <a 
              href="/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-[#f59e0b] transition-colors p-1"
              title="View in Standalone Browser"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          
          {/* Mobile menu toggle */}
          <button 
            onClick={() => onNavigate('browse')}
            className="md:hidden text-[#d8c3ad] hover:text-[#ffc174] transition-colors p-1"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}
