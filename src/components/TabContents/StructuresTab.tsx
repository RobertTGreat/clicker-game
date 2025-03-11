import React, { RefObject } from 'react';

type AutoClicker = {
  id: string;
  name: string;
  cost: number;
  pixelsPerSecond: number;
  count: number;
};

type StructuresTabProps = {
  autoClickers: AutoClicker[];
  buyAutoClicker: (id: string) => void;
  formatNumber: (num: number) => string;
  playerPixels: number;
  saveScrollPosition?: (containerId: string, scrollTop: number) => void;
  scrollRef?: RefObject<HTMLDivElement>;
};

export default function StructuresTab({
  autoClickers,
  buyAutoClicker,
  formatNumber,
  playerPixels,
  saveScrollPosition,
  scrollRef
}: StructuresTabProps) {
  return (
    <div className="h-full flex flex-col p-3">
      <h2 className="text-lg font-semibold text-purple-300 mb-3">Structures</h2>
      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto custom-scrollbar pr-2" 
        onScroll={(e) => {
          if (saveScrollPosition) {
            saveScrollPosition('autoClickers', e.currentTarget.scrollTop);
          }
        }}
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-300 mb-3">
            Structures automatically generate pixels for you over time.
            Each structure becomes more efficient the more you own.
          </p>
          <div className="grid gap-3">
            {autoClickers.map(clicker => (
              <button
                key={clicker.id}
                onClick={() => buyAutoClicker(clicker.id)}
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
      </div>
    </div>
  );
} 