import React, { RefObject, useEffect, useRef } from 'react';
import { UpgradeSubTab } from '@/types/gameTypes';

// Type definitions for upgrades and auto clickers
type Upgrade = {
  id: string;
  name: string;
  description: string;
  cost: number;
  purchased: boolean;
};

type AutoClicker = {
  id: string;
  name: string;
  cost: number;
  pixelsPerSecond: number;
  count: number;
};

type UpgradesTabProps = {
  upgrades: Upgrade[];
  autoClickers: AutoClicker[];
  buyUpgrade: (id: string) => void;
  buyAutoClicker: (id: string) => void;
  formatNumber: (num: number) => string;
  activeUpgradeTab: UpgradeSubTab;
  setActiveUpgradeTab: (tab: UpgradeSubTab) => void;
  saveScrollPosition: (containerId: string, scrollTop: number) => void;
  scrollRefs: {
    [key: string]: RefObject<HTMLDivElement>;
  };
  renderSkillTree: () => React.ReactNode;
  playerPixels: number; // Add player pixels to check affordability
};

export default function UpgradesTab({
  upgrades,
  autoClickers,
  buyUpgrade,
  buyAutoClicker,
  formatNumber,
  activeUpgradeTab,
  setActiveUpgradeTab,
  saveScrollPosition,
  scrollRefs,
  renderSkillTree,
  playerPixels
}: UpgradesTabProps) {
  return (
    <div className="h-full flex flex-col p-3">
      {/* Sub-tabs navigation */}
      <div className="flex space-x-1 mb-3 border-b border-gray-700 pb-2">
        <button 
          onClick={() => {
            // Save current scroll position before switching tab
            if (scrollRefs[activeUpgradeTab].current) {
              saveScrollPosition(activeUpgradeTab, scrollRefs[activeUpgradeTab].current!.scrollTop);
            }
            setActiveUpgradeTab('upgrades');
          }}
          className={`px-3 py-1 text-sm rounded-t-md transition-colors ${
            activeUpgradeTab === 'upgrades' 
              ? 'bg-blue-900/50 text-blue-300 font-semibold' 
              : 'bg-gray-800/30 text-gray-400 hover:bg-gray-800/50'
          }`}
        >
          Upgrades
        </button>
        <button 
          onClick={() => {
            // Save current scroll position before switching tab
            if (scrollRefs[activeUpgradeTab].current) {
              saveScrollPosition(activeUpgradeTab, scrollRefs[activeUpgradeTab].current!.scrollTop);
            }
            setActiveUpgradeTab('autoClickers');
          }}
          className={`px-3 py-1 text-sm rounded-t-md transition-colors ${
            activeUpgradeTab === 'autoClickers' 
              ? 'bg-purple-900/50 text-purple-300 font-semibold' 
              : 'bg-gray-800/30 text-gray-400 hover:bg-gray-800/50'
          }`}
        >
          Auto Clickers
        </button>
        <button 
          onClick={() => {
            // Save current scroll position before switching tab
            if (scrollRefs[activeUpgradeTab].current) {
              saveScrollPosition(activeUpgradeTab, scrollRefs[activeUpgradeTab].current!.scrollTop);
            }
            setActiveUpgradeTab('rebirth');
          }}
          className={`px-3 py-1 text-sm rounded-t-md transition-colors ${
            activeUpgradeTab === 'rebirth' 
              ? 'bg-violet-900/50 text-violet-300 font-semibold' 
              : 'bg-gray-800/30 text-gray-400 hover:bg-gray-800/50'
          }`}
        >
          Rebirth Skills
        </button>
      </div>
      
      {/* Content based on active subtab */}
      <div 
        ref={scrollRefs[activeUpgradeTab]}
        className="flex-grow overflow-y-auto custom-scrollbar pr-2" 
        onScroll={(e) => {
          // Save scroll position when user scrolls
          saveScrollPosition(activeUpgradeTab, e.currentTarget.scrollTop);
        }}
      >
        {/* Upgrades content */}
        {activeUpgradeTab === 'upgrades' && (
          <div className="space-y-3">
            <h3 className="text-md font-semibold text-blue-300 mb-2 py-2">Upgrades</h3>
            <div className="grid gap-3">
              {upgrades.map(upgrade => (
                <button
                  key={upgrade.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!upgrade.purchased && playerPixels >= upgrade.cost) {
                      buyUpgrade(upgrade.id);
                    }
                  }}
                  disabled={upgrade.purchased || playerPixels < upgrade.cost}
                  className={`w-full p-3 rounded text-left text-sm border ${
                    upgrade.purchased
                      ? 'bg-green-900/20 border-green-800/30 text-green-400'
                      : playerPixels >= upgrade.cost
                      ? 'bg-blue-900/20 border-blue-800/30 text-blue-300 hover:bg-blue-900/40'
                      : 'bg-gray-900/30 border-gray-800/30 text-gray-500 cursor-not-allowed'
                  } transition-colors duration-200`}
                >
                  <div className="font-semibold flex justify-between">
                    <span>{upgrade.name}</span>
                    <span>{upgrade.purchased ? 'Purchased' : `${formatNumber(upgrade.cost)} pixels`}</span>
                  </div>
                  <div className="text-sm opacity-80 mt-1">{upgrade.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Auto Clickers content */}
        {activeUpgradeTab === 'autoClickers' && (
          <div className="space-y-3">
            <h3 className="text-md font-semibold text-purple-300 mb-2 py-2">Auto Clickers</h3>
            <div className="grid gap-3">
              {autoClickers.map(clicker => (
                <button
                  key={clicker.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (playerPixels >= clicker.cost) {
                      buyAutoClicker(clicker.id);
                    }
                  }}
                  disabled={playerPixels < clicker.cost}
                  className={`w-full p-3 rounded text-left text-sm border ${
                    playerPixels >= clicker.cost
                      ? 'bg-purple-900/20 border-purple-800/30 text-purple-300 hover:bg-purple-900/40'
                      : 'bg-gray-900/30 border-gray-800/30 text-gray-500 cursor-not-allowed'
                  } transition-colors duration-200`}
                >
                  <div className="font-semibold flex justify-between">
                    <span>
                      {clicker.name} ({clicker.count || 0})
                    </span>
                    <span>{formatNumber(clicker.cost)} pixels</span>
                  </div>
                  <div className="text-sm opacity-80 mt-1">
                    +{clicker.pixelsPerSecond.toFixed(1)} pixels/sec
                    {clicker.count > 0 && ` (Total: ${formatNumber(clicker.pixelsPerSecond * clicker.count)} pixels/sec)`}
                  </div>
                  <div className="mt-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-purple-600 h-full transition-all duration-300" 
                      style={{ width: `${Math.min(100, (playerPixels / clicker.cost) * 100)}%` }}
                    ></div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Rebirth content */}
        {activeUpgradeTab === 'rebirth' && renderSkillTree()}
      </div>
    </div>
  );
} 