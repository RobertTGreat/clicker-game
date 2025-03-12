import React, { RefObject } from 'react';

type Upgrade = {
  id: string;
  name: string;
  description: string;
  cost: number;
  multiplier: number;
  purchased: boolean;
};

type ClickerUpgradesTabProps = {
  upgrades: Upgrade[];
  buyUpgrade: (id: string) => void;
  formatNumber: (num: number) => string;
  playerPixels: number;
  saveScrollPosition?: (containerId: string, scrollTop: number) => void;
  scrollRef?: RefObject<HTMLDivElement>;
};

export default function ClickerUpgradesTab({
  upgrades,
  buyUpgrade,
  formatNumber,
  playerPixels,
  saveScrollPosition,
  scrollRef
}: ClickerUpgradesTabProps) {
  // Group upgrades by tiers
  const basicUpgrades = upgrades.filter(u => u.multiplier <= 5);
  const advancedUpgrades = upgrades.filter(u => u.multiplier > 5 && u.multiplier <= 50);
  const epicUpgrades = upgrades.filter(u => u.multiplier > 50);
  
  const renderUpgradeList = (upgradeList: Upgrade[], title: string, colorClass: string) => (
    <div className="mb-6">
      <h3 className={`text-md font-semibold ${colorClass} mb-2 py-2`}>{title}</h3>
      <div className="grid gap-3">
        {upgradeList.map(upgrade => (
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
            {!upgrade.purchased && (
              <div className="mt-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full transition-all duration-300" 
                  style={{ width: `${Math.min(100, (playerPixels / upgrade.cost) * 100)}%` }}
                ></div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col p-3">
      <h2 className="text-lg font-semibold text-blue-300 mb-3">Clicker Upgrades</h2>
      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto custom-scrollbar pr-2" 
        onScroll={(e) => {
          if (saveScrollPosition) {
            saveScrollPosition('upgrades', e.currentTarget.scrollTop);
          }
        }}
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-300 mb-4">
            Upgrade your clicking power to generate more pixels per click.
            More powerful upgrades unlock as you progress.
          </p>
          
          {basicUpgrades.length > 0 && renderUpgradeList(basicUpgrades, "Basic Upgrades", "text-blue-300")}
          {advancedUpgrades.length > 0 && renderUpgradeList(advancedUpgrades, "Advanced Upgrades", "text-cyan-300")}
          {epicUpgrades.length > 0 && renderUpgradeList(epicUpgrades, "Epic Upgrades", "text-indigo-300")}
        </div>
      </div>
    </div>
  );
} 