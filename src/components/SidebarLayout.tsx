import React, { ReactNode, useState } from 'react';
import { PanelId } from '@/types/gameTypes';

// Define tab types
type RightPanelTab = 'structures' | 'rebirth' | 'settings';

type SidebarLayoutProps = {
  activeTab: PanelId;
  setActiveTab: (tab: PanelId) => void;
  children: ReactNode;
  tabContent?: ReactNode;
  structuresContent: ReactNode;
  rebirthContent: ReactNode;
  settingsContent: ReactNode;
  nextUpgradeContent: ReactNode;
  isDarkMode: boolean;
  themeColor: string;
};

export default function SidebarLayout({ 
  activeTab, 
  setActiveTab, 
  children, 
  tabContent,
  structuresContent,
  rebirthContent,
  settingsContent,
  nextUpgradeContent,
  isDarkMode,
  themeColor
}: SidebarLayoutProps) {
  // Track which tab is active in the right panel
  const [activeRightTab, setActiveRightTab] = useState<RightPanelTab>('structures');
  
  // Get the title based on active tab
  const getRightPanelTitle = () => {
    switch (activeRightTab) {
      case 'structures': return 'Structures';
      case 'rebirth': return 'Rebirth';
      case 'settings': return 'Settings';
    }
  };
  
  // Get the content based on active tab
  const getRightPanelContent = () => {
    switch (activeRightTab) {
      case 'structures': return structuresContent;
      case 'rebirth': return rebirthContent;
      case 'settings': return settingsContent;
    }
  };

  // Get theme CSS classes
  const getThemeClasses = () => {
    if (isDarkMode) {
      return {
        mainBg: 'bg-black/40',
        border: 'border-blue-500/20',
        panelBg: 'bg-black/60',
        headerBg: 'bg-black/30',
        panelBorder: 'border-purple-500/20',
        titleColor: 'text-purple-300',
        activeButtonBg: 'bg-purple-700',
        activeButtonShadow: 'shadow-purple-500/30',
        hoverBg: 'hover:bg-purple-900/30'
      };
    } else {
      return {
        mainBg: 'bg-white/40',
        border: 'border-blue-500/20',
        panelBg: 'bg-white/60',
        headerBg: 'bg-white/30',
        panelBorder: 'border-purple-500/20',
        titleColor: 'text-purple-800',
        activeButtonBg: 'bg-purple-500',
        activeButtonShadow: 'shadow-purple-500/30',
        hoverBg: 'hover:bg-purple-200/50'
      };
    }
  };

  const theme = getThemeClasses();

  // Helper function to handle tab toggle
  const toggleTab = (tab: Exclude<PanelId, null>) => {
    setActiveTab(activeTab === tab ? null : tab);
  };

  return (
    <div className="h-full flex relative">
      {/* Main Content Area - Takes up partial width when a panel is open */}
      <div className="h-full transition-all duration-300 ease-in-out flex flex-col w-[calc(100%-350px)]">
        {/* Next Upgrade Area - Always visible at the top */}
        <div className={`w-full backdrop-blur-md border-b p-0 ${theme.mainBg} ${theme.border}`}>
          {nextUpgradeContent}
        </div>
        
        {/* Main Game Area */}
        <div className="flex-grow overflow-auto">
          <div className="h-full w-full p-4">
            {children}
          </div>
        </div>
      </div>
      
      {/* Right Panel - Always visible with tab navigation in header */}
      <div 
        className={`w-[350px] h-full backdrop-blur-xl border-l flex flex-col overflow-hidden pointer-events-auto ${theme.panelBg} ${theme.panelBorder}`}
        style={{
          boxShadow: '0 0 25px rgba(146, 109, 222, 0.15)',
          zIndex: 10
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Panel Header with Tab Navigation */}
        <div className={`p-4 border-b flex items-center justify-between ${theme.headerBg} ${theme.panelBorder}`}>
          <h2 className={`text-xl font-bold ${theme.titleColor}`}>
            {getRightPanelTitle()}
          </h2>
          
          <div className="flex space-x-3">
            {/* Structures Tab Button */}
            <button 
              className={`h-8 w-8 flex items-center justify-center rounded-lg transition-all duration-200 
                ${activeRightTab === 'structures' 
                  ? `text-white ${theme.activeButtonBg} shadow-sm ${theme.activeButtonShadow}` 
                  : `text-gray-400 hover:text-purple-300 ${theme.hoverBg}`}`}
              onClick={() => setActiveRightTab('structures')}
              title="Structures"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
              </svg>
            </button>
            
            {/* Rebirth Tab Button */}
            <button 
              className={`h-8 w-8 flex items-center justify-center rounded-lg transition-all duration-200 
                ${activeRightTab === 'rebirth' 
                  ? `text-white ${theme.activeButtonBg} shadow-sm ${theme.activeButtonShadow}` 
                  : `text-gray-400 hover:text-purple-300 ${theme.hoverBg}`}`}
              onClick={() => setActiveRightTab('rebirth')}
              title="Rebirth"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
              </svg>
            </button>
            
            {/* Settings Tab Button */}
            <button
              className={`h-8 w-8 flex items-center justify-center rounded-lg transition-all duration-200 
                ${activeRightTab === 'settings' 
                  ? `text-white ${theme.activeButtonBg} shadow-sm ${theme.activeButtonShadow}` 
                  : `text-gray-400 hover:text-purple-300 ${theme.hoverBg}`}`}
              onClick={() => setActiveRightTab('settings')}
              title="Settings"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Panel Content - Changes based on active tab */}
        <div className="flex-grow overflow-y-auto custom-scrollbar pointer-events-auto">
          {getRightPanelContent()}
        </div>
      </div>
      
      {/* Tab Content Panel - Fixed width that slides in from the right when active */}
      <div 
        className={`w-[350px] h-full backdrop-blur-xl bg-black/70 border-l border-indigo-500/20 absolute right-16 top-0 overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out transform shadow-2xl pointer-events-auto ${
          activeTab ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
        }`}
        style={{
          boxShadow: activeTab ? '0 0 25px rgba(99, 102, 241, 0.15)' : 'none',
          zIndex: 20
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {tabContent}
      </div>
    </div>
  );
}