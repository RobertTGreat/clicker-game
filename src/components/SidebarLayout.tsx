import React, { ReactNode } from 'react';
import { PanelId } from '@/types/gameTypes';

type SidebarLayoutProps = {
  activeTab: PanelId;
  setActiveTab: (tab: PanelId) => void;
  children: ReactNode;
};

export default function SidebarLayout({ activeTab, setActiveTab, children }: SidebarLayoutProps) {
  // Helper function to handle tab toggle
  const toggleTab = (tab: Exclude<PanelId, null>) => {
    setActiveTab(activeTab === tab ? null : tab);
  };

  return (
    <div className="h-full flex pointer-events-auto">
      {/* Main Content Area - Takes up full width when no panel is open */}
      <div className={`flex-grow backdrop-blur-md bg-black/80 transition-all duration-300 ease-in-out ${activeTab ? 'mr-1/3' : ''}`}>
        {children}
      </div>
      
      {/* Tab Content Panel - Slides in from right, takes 1/3 of screen */}
      {activeTab && (
        <div className="w-1/3 h-full absolute right-0 top-0 backdrop-blur-md bg-black/90 border-l border-gray-800 transition-all duration-300 ease-in-out transform-gpu">
          {/* Content rendered here by main component */}
        </div>
      )}
      
      {/* Sidebar - Now on the right with minimal design */}
      <div className="w-12 h-full absolute right-0 top-0 z-50">
        <div className="flex flex-col gap-2 py-4 h-full bg-gray-900/50 backdrop-blur-sm">
          <button 
            className={`h-10 w-10 mx-auto flex items-center justify-center rounded-full transition-all ${activeTab === 'stats' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
            onClick={() => toggleTab('stats')}
            title="Stats"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 3v17a1 1 0 001 1h17v-2H5V3H3z"/>
              <path d="M15 10h2v7h-2v-7zm-4 3h2v4h-2v-4zm-4 2h2v2H7v-2z"/>
            </svg>
          </button>
          <button 
            className={`h-10 w-10 mx-auto flex items-center justify-center rounded-full transition-all ${activeTab === 'upgrades' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
            onClick={() => toggleTab('upgrades')}
            title="Clicker Upgrades"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            </svg>
          </button>
          <button 
            className={`h-10 w-10 mx-auto flex items-center justify-center rounded-full transition-all ${activeTab === 'autoClickers' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
            onClick={() => toggleTab('autoClickers')}
            title="Structures"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
            </svg>
          </button>
          <button 
            className={`h-10 w-10 mx-auto flex items-center justify-center rounded-full transition-all ${activeTab === 'rebirth' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
            onClick={() => toggleTab('rebirth')}
            title="Rebirth"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
            </svg>
          </button>
          <div className="flex-grow"></div>
          <button 
            className={`h-10 w-10 mx-auto flex items-center justify-center rounded-full transition-all ${activeTab === 'settings' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
            onClick={() => toggleTab('settings')}
            title="Settings"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
} 