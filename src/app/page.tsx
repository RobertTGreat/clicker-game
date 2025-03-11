'use client';

import React, { Fragment } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { useEffect, useState, useRef, MouseEvent as ReactMouseEvent, ReactNode, ChangeEvent, useCallback, useMemo } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { PanelId } from '@/types/gameTypes';  // Import updated PanelId type

// Define panel ID type
type UpgradeSubTab = 'upgrades' | 'autoClickers' | 'rebirth';

// Define panel state type
type PanelState = {
  minimized: boolean;
  position: {
    x: number;
    y: number;
  };
};

// Define panel states type
type PanelStates = {
  [key in PanelId]: PanelState;
};

// Define settings type
type ColorScheme = 'rainbow' | 'monochrome' | 'blues' | 'greens';
type AnimationSpeed = 'slow' | 'normal' | 'fast';

type Settings = {
  pixelSize: number;
  colorScheme: ColorScheme;
  animationSpeed: AnimationSpeed;
};

export default function Home() {
  const { 
    gameState, 
    handleClick, 
    buyUpgrade, 
    buyAutoClicker, 
    getPixelsPerSecond,
    resetGame,
    performRebirth,
    buyRebirthSkill,
    getRebirthEffects
  } = useGameState();
  
  const [isClient, setIsClient] = useState(false);
  
  // Active main tab instead of panel states
  const [activeTab, setActiveTab] = useState<PanelId>(null);
  
  // Store scroll positions for scrollable containers
  const [scrollPositions, setScrollPositions] = useState<{[key: string]: number}>({
    upgrades: 0,
    autoClickers: 0,
    rebirth: 0,
    settings: 0
  });
  
  // Refs for scrollable containers
  const scrollRefs = {
    upgrades: useRef<HTMLDivElement | null>(null),
    autoClickers: useRef<HTMLDivElement | null>(null),
    rebirth: useRef<HTMLDivElement | null>(null),
    settings: useRef<HTMLDivElement | null>(null)
  };
  
  // Settings state
  const [settings, setSettings] = useState<Settings>({
    pixelSize: 6,
    colorScheme: 'rainbow',
    animationSpeed: 'normal',
  });

  // Add state for currently selected upgrades sub-tab
  const [activeUpgradeTab, setActiveUpgradeTab] = useState<UpgradeSubTab>('upgrades');
  
  // Function to save scroll position
  const saveScrollPosition = useCallback((containerId: string, scrollTop: number) => {
    setScrollPositions(prev => ({
      ...prev,
      [containerId]: scrollTop
    }));
  }, []);
  
  // Function to restore scroll position on mount/update
  const restoreScrollPositions = useCallback(() => {
    // For each scroll container
    Object.keys(scrollRefs).forEach(key => {
      const element = scrollRefs[key as keyof typeof scrollRefs].current;
      if (element && scrollPositions[key] !== undefined) {
        element.scrollTop = scrollPositions[key];
      }
    });
  }, [scrollPositions]);
  
  // Restore scroll positions after render
  useEffect(() => {
    if (isClient) {
      restoreScrollPositions();
    }
  }, [isClient, activeUpgradeTab, activeTab, restoreScrollPositions]);

  // To prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  const pixelsPerSecond = getPixelsPerSecond();
  
  // Safe formatNumber function that works on both server and client
  const formatNumber = (num: number): string => {
    // Handle undefined, NaN or non-numbers safely
    if (typeof num !== 'number' || isNaN(num)) return '0';
    
    if (num < 1000) return Math.floor(num).toString();
    if (num < 1000000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    if (num < 1000000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
    if (num < 1000000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'b';
    return (num / 1000000000000).toFixed(1).replace(/\.0$/, '') + 't';
  };

  // Pixel pile rendering - only run on client side
  const pixelPileRendering = useMemo(() => {
    // Skip rendering during server-side rendering to prevent hydration mismatch
    if (!isClient) return null;
    
    // Calculate how many pixels to show based on the game state
    const totalPixels = Math.floor(gameState.pixels);
    const safePixels = totalPixels > 0 ? totalPixels : 1;
    
    // Significantly reduce the number of DOM elements for performance
    const maxVisibleColumns = 30;
    const columnsArray = Array.from({ length: maxVisibleColumns }, (_, i) => i);
    const pixelsPerColumn = Math.floor(totalPixels / maxVisibleColumns);
    
    // Adjust column heights based on a logarithmic scale of total pixels
    const baseHeight = Math.log10(safePixels) * 3;
    
    const columnHeights = columnsArray.map((_, i) => {
      // Create bell curve distribution (taller in the middle)
      const distanceFromCenter = Math.abs((i / (maxVisibleColumns - 1)) - 0.5) * 2;
      // Calculate pixel distribution per column
      const columnPixels = pixelsPerColumn * (1 - (distanceFromCenter * 0.7));
      
      return {
        index: i,
        // Cap height at 90% of container height
        heightPercent: Math.min(90, baseHeight + columnPixels / 1000),
        pixelCount: Math.floor(columnPixels),
        color: getAverageColumnColor(columnPixels)
      };
    });
    
    function getAverageColumnColor(pixelCount: number) {
      if (pixelCount < 100) {
        return { hue: 0, saturation: 70, lightness: 45 };
      } else if (pixelCount < 500) {
        return { hue: 30, saturation: 75, lightness: 50 };
      } else if (pixelCount < 1000) {
        return { hue: 60, saturation: 75, lightness: 55 };
      } else if (pixelCount < 5000) {
        return { hue: 120, saturation: 65, lightness: 40 };
      } else if (pixelCount < 10000) {
        return { hue: 180, saturation: 70, lightness: 40 };
      } else if (pixelCount < 50000) {
        return { hue: 240, saturation: 70, lightness: 50 };
      } else {
        return { hue: 270, saturation: 75, lightness: 60 };
      }
    }
    
    // Use a seed for random numbers to keep consistency between renders
    const seedRandom = (seed: number, max: number = 1, min: number = 0) => {
      const x = Math.sin(seed) * 10000;
      const rand = x - Math.floor(x);
      return min + rand * (max - min);
    };
    
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 flex justify-center">
          <div className="relative w-full max-w-screen-lg h-full">
            {columnHeights.map((column) => {
              const columnPosition = (column.index * (100 / maxVisibleColumns)) + (50 / maxVisibleColumns);
              const towerWidth = Math.max(3, settings.pixelSize);
              // Use consistent random offset based on index rather than Math.random()
              const horizOffset = -0.1 + seedRandom(column.index, 0.2); 
              const segmentCount = Math.max(1, Math.min(5, Math.floor(column.heightPercent / 15)));
              const segments = Array.from({ length: segmentCount }, (_, i) => i);
              
              return (
                <div 
                  key={`column-${column.index}`}
                  className="absolute bottom-0"
                  style={{
                    left: `calc(${columnPosition}% + ${horizOffset}%)`,
                    width: `${towerWidth}px`,
                    height: `${column.heightPercent}%`,
                    transition: "height 0.3s ease-out"
                  }}
                >
                  <div 
                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-2 rounded-full"
                    style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                  />
                  
                  {segments.map((segIndex) => {
                    const segHeight = (column.heightPercent / segmentCount);
                    const segPosition = segIndex * segHeight;
                    const heightRatio = segIndex / segments.length;
                    const segmentLightness = column.color.lightness + (heightRatio * 15);
                    // Use seeded random for hue variation
                    const hueVar = -5 + seedRandom(column.index * 100 + segIndex, 10);
                    
                    return (
                      <div
                        key={`seg-${column.index}-${segIndex}`}
                        className="absolute w-full"
                        style={{
                          bottom: `${segPosition}%`, 
                          height: `${segHeight}%`, 
                          backgroundColor: `hsl(${column.color.hue + hueVar}, ${column.color.saturation}%, ${segmentLightness}%)`,
                          borderRadius: segIndex === segments.length - 1 ? '2px 2px 0 0' : '0',
                          boxShadow: segIndex === segments.length - 1 ? `0 0 8px hsla(${column.color.hue}, ${column.color.saturation}%, ${segmentLightness + 10}%, 0.5)` : 'none',
                          opacity: 0.8 + (heightRatio * 0.2)
                        }}
                      >
                        {segIndex === segments.length - 1 && column.heightPercent > 30 && (
                          <div 
                            className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full" 
                            style={{
                              backgroundColor: `hsla(${column.color.hue}, 100%, 80%, 0.8)`,
                              boxShadow: `0 0 4px hsla(${column.color.hue}, 100%, 80%, 0.8)`
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="absolute bottom-2 right-2 bg-black/50 p-2 rounded text-xs pointer-events-auto">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(0, 70%, 45%)' }}></div>
              <span>1-99</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(30, 75%, 50%)' }}></div>
              <span>100-499</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(60, 75%, 55%)' }}></div>
              <span>500-999</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(120, 65%, 40%)' }}></div>
              <span>1K-4.9K</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(180, 70%, 40%)' }}></div>
              <span>5K-9.9K</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(240, 70%, 50%)' }}></div>
              <span>10K-49.9K</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(270, 75%, 60%)' }}></div>
              <span>50K+</span>
            </div>
          </div>
        </div>
      </div>
    );
  }, [gameState.pixels, settings.pixelSize, settings.animationSpeed, isClient]);
  
  // Function to render the selected tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'stats':
        return (
          <div className="p-4 overflow-y-auto max-h-full">
            <h2 className="text-xl font-bold mb-4">Statistics</h2>
            {/* Stats content */}
            <div className="space-y-3">
              <div>
                <div className="text-gray-400 text-sm">Lifetime Pixels</div>
                <div className="text-xl">{formatNumber(gameState.lifetimePixels)}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Total Clicks</div>
                <div className="text-xl">{formatNumber(gameState.totalClicks)}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Click Power</div>
                <div className="text-xl">{formatNumber(gameState.clickPower)}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Pixels per Second</div>
                <div className="text-xl">{formatNumber(getPixelsPerSecond())}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Society Level</div>
                <div className="text-xl">{gameState.societyLevel}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Rebirth Points</div>
                <div className="text-xl">{gameState.rebirthPoints}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Rebirth Count</div>
                <div className="text-xl">{gameState.rebirthCount}</div>
              </div>
            </div>
          </div>
        );
      case 'upgrades':
        return (
          <div className="p-4 overflow-y-auto max-h-full" id="scrollable-upgrades" ref={scrollRefs.upgrades} onScroll={(e) => {
            saveScrollPosition('upgrades', e.currentTarget.scrollTop);
          }}>
            <h2 className="text-xl font-bold mb-4">Clicker Upgrades</h2>
            {/* Render the upgrade tiers */}
            {renderUpgradeTier(
              gameState.upgrades.filter(u => u.multiplier <= 5),
              "Basic Upgrades",
              "bg-blue-600"
            )}
            {renderUpgradeTier(
              gameState.upgrades.filter(u => u.multiplier > 5 && u.multiplier <= 50),
              "Advanced Upgrades",
              "bg-purple-600"
            )}
            {renderUpgradeTier(
              gameState.upgrades.filter(u => u.multiplier > 50),
              "Epic Upgrades",
              "bg-yellow-600"
            )}
          </div>
        );
      case 'autoClickers':
        return (
          <div className="p-4 overflow-y-auto max-h-full" id="scrollable-structures" ref={scrollRefs.autoClickers} onScroll={(e) => {
            saveScrollPosition('autoClickers', e.currentTarget.scrollTop);
          }}>
            <h2 className="text-xl font-bold mb-4">Structures</h2>
            <div className="space-y-4">
              {gameState.autoClickers.map((clicker) => (
                <div key={clicker.id} className="bg-gray-800 rounded-lg p-3 transition-all hover:bg-gray-700">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-lg">{clicker.name}</div>
                      <div className="text-gray-400 text-sm">{clicker.count} owned • {formatNumber(clicker.pixelsPerSecond)} pixels/sec each</div>
                    </div>
                    <button
                      className={`px-3 py-1 rounded text-sm font-semibold ${
                        gameState.pixels >= clicker.cost
                          ? 'bg-green-600 hover:bg-green-500'
                          : 'bg-gray-600 cursor-not-allowed'
                      }`}
                      onClick={() => buyAutoClicker(clicker.id)}
                      disabled={gameState.pixels < clicker.cost}
                    >
                      Buy: {formatNumber(clicker.cost)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'rebirth':
        return (
          <div className="p-4 overflow-y-auto max-h-full">
            <h2 className="text-xl font-bold mb-4">Rebirth</h2>
            
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <div className="mb-2">
                <span className="text-gray-400">Current Rebirth Points:</span>
                <span className="ml-2 font-bold">{gameState.rebirthPoints}</span>
              </div>
              
              <div className="mb-4">
                <span className="text-gray-400">Potential Gain:</span>
                <span className="ml-2 font-bold">{calculateRebirthGain()}</span>
              </div>
              
              <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                <div
                  className="bg-violet-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${calculateRebirthProgress()}%` }}
                />
              </div>
              
              <button
                className="w-full px-4 py-2 bg-violet-700 hover:bg-violet-600 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={performRebirth}
                disabled={calculateRebirthGain() === 0}
              >
                Rebirth
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mt-6">
              {gameState.rebirthSkills.map(skill => {
                const canAfford = gameState.rebirthPoints >= skill.cost;
                const isMaxLevel = skill.level >= skill.maxLevel;
                const dependencies = skill.requires || [];
                const requirementsMet = dependencies.every(dep => {
                  const requiredSkill = gameState.rebirthSkills.find(s => s.id === dep);
                  return requiredSkill && requiredSkill.level > 0;
                });
                
                const connections = getSkillConnections(skill.id);
                
                return (
                  <div key={skill.id} className="relative">
                    {connections.map((conn, idx) => (
                      <div
                        key={`${skill.id}-conn-${idx}`}
                        className={`absolute h-1 bg-gray-700 transform ${
                          conn.direction === 'right' ? 'rotate-0' : 
                          conn.direction === 'down' ? 'rotate-90 origin-top-left' : 
                          conn.direction === 'down-right' ? 'rotate-45 origin-top-left' : 'rotate-135 origin-top-left'
                        }`}
                        style={{
                          top: conn.start.y,
                          left: conn.start.x,
                          width: conn.length,
                          zIndex: 1,
                        }}
                      />
                    ))}
                    
                    <button
                      className={`w-full relative z-10 p-3 rounded-lg flex flex-col items-center text-center
                        ${skill.level > 0 ? 'bg-violet-800 border border-violet-600' : 
                          !requirementsMet ? 'bg-gray-800 opacity-50 cursor-not-allowed' :
                          canAfford ? 'bg-gray-800 hover:bg-gray-700 border border-violet-800' : 
                          'bg-gray-800 border border-gray-700 opacity-75 cursor-not-allowed'
                        }`}
                      onClick={() => skill.level < skill.maxLevel && requirementsMet && canAfford && buyRebirthSkill(skill.id)}
                      disabled={skill.level >= skill.maxLevel || !canAfford || !requirementsMet}
                      title={!requirementsMet ? "Requirements not met" : isMaxLevel ? "Maximum level reached" : ""}
                    >
                      <div className="font-semibold">{skill.name}</div>
                      <div className="text-xs text-gray-400 mt-1">{skill.level}/{skill.maxLevel}</div>
                      
                      {!isMaxLevel && (
                        <div className={`text-xs mt-2 ${canAfford ? 'text-violet-400' : 'text-gray-500'}`}>
                          Cost: {skill.cost} RP
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="p-4 overflow-y-auto max-h-full">
            <h2 className="text-xl font-bold mb-4">Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm text-gray-400">Pixel Size</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={settings.pixelSize}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSettings({...settings, pixelSize: parseInt(e.target.value)})}
                  className="w-full"
                />
                <div className="text-sm text-right">{settings.pixelSize}</div>
              </div>
              
              <div>
                <label className="block mb-2 text-sm text-gray-400">Color Scheme</label>
                <select
                  value={settings.colorScheme}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setSettings({...settings, colorScheme: e.target.value as ColorScheme})}
                  className="w-full bg-gray-800 border border-gray-700 p-2 rounded"
                >
                  <option value="rainbow">Rainbow</option>
                  <option value="monochrome">Monochrome</option>
                  <option value="blues">Blues</option>
                  <option value="greens">Greens</option>
                </select>
              </div>
              
              <div>
                <label className="block mb-2 text-sm text-gray-400">Animation Speed</label>
                <select
                  value={settings.animationSpeed}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setSettings({...settings, animationSpeed: e.target.value as AnimationSpeed})}
                  className="w-full bg-gray-800 border border-gray-700 p-2 rounded"
                >
                  <option value="slow">Slow</option>
                  <option value="normal">Normal</option>
                  <option value="fast">Fast</option>
                </select>
              </div>
              
              <div className="pt-4">
                <button 
                  onClick={resetGame} 
                  className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded font-semibold"
                >
                  Reset Game
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Helper function to render upgrade tiers
  const renderUpgradeTier = (upgradeList: typeof gameState.upgrades, title: string, colorClass: string) => {
    if (upgradeList.length === 0) return null;
    
    return (
      <div className="mb-6">
        <h3 className={`text-md font-semibold ${colorClass} mb-2 sticky top-0 bg-gray-900/90 py-2 z-10`}>{title}</h3>
        <div className="grid gap-3">
          {upgradeList.map(upgrade => (
            <button
              key={upgrade.id}
              onClick={() => buyUpgrade(upgrade.id)}
              disabled={upgrade.purchased || gameState.pixels < upgrade.cost}
              className={`w-full p-3 rounded text-left text-sm border ${
                upgrade.purchased
                  ? 'bg-green-900/20 border-green-800/30 text-green-400'
                  : gameState.pixels >= upgrade.cost
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
                    style={{ width: `${Math.min(100, (gameState.pixels / upgrade.cost) * 100)}%` }}
                  ></div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };
  
  // Calculate progress to next upgrade tier
  const calculateNextTierProgress = () => {
    // Determine current tier based on highest upgrade unlocked
    const highestMultiplier = Math.max(
      ...gameState.upgrades
        .filter(u => gameState.pixels >= u.cost * 0.1 || u.purchased)
        .map(u => u.multiplier),
      1
    );
    
    // Determine next tier threshold
    let nextTierThreshold = 0;
    if (highestMultiplier <= 5) {
      nextTierThreshold = 1000; // Threshold for advanced upgrades
    } else if (highestMultiplier <= 50) {
      nextTierThreshold = 100000; // Threshold for epic upgrades
    } else {
      nextTierThreshold = 10000000; // Next major milestone
    }
    
    // Calculate percentage progress to next tier
    const currentValue = gameState.pixels;
    const previousTierThreshold = nextTierThreshold / 10;
    
    return Math.min(100, ((currentValue - previousTierThreshold) / (nextTierThreshold - previousTierThreshold)) * 100);
  };
  
  // Calculate rebirth potential
  const calculateRebirthGain = () => {
    // Modified formula: sqrt(log10(pixels)) rounded down
    // This makes it harder to get rebirth points at higher levels
    return Math.max(0, Math.floor(Math.sqrt(Math.log10(gameState.pixels))));
  };
  
  // New function to calculate progress toward next rebirth point
  const calculateRebirthProgress = () => {
    const currentLog = Math.log10(gameState.pixels);
    const currentFloor = Math.floor(currentLog);
    const nextThreshold = Math.pow(10, currentFloor + 1);
    
    // Calculate percentage progress to next level (0-100)
    return ((gameState.pixels - Math.pow(10, currentFloor)) / (nextThreshold - Math.pow(10, currentFloor))) * 100;
  };
  
  // Fix the skill connection type
  type SkillConnection = {
    direction: 'right' | 'down' | 'down-right' | 'down-left';
    start: { x: number; y: number };
    length: number;
  };

  // Get skill connections for visualization
  const getSkillConnections = (skillId: string): SkillConnection[] => {
    // Return empty array for now - we'll implement the actual connections elsewhere
    return [];
  };

  // Render main content (stats, pixels count)
  const renderMainContent = () => {
    return (
      <div className="p-4 h-full">
        <h2 className="text-lg font-mono mb-2">{formatNumber(gameState.pixels)} pixels</h2>
        <div className="grid gap-2">
          <p className="text-sm text-gray-300">
            {formatNumber(getPixelsPerSecond())} pixels/sec
          </p>
          <p className="text-sm text-gray-300">Click Power: {formatNumber(gameState.clickPower)}</p>
          <p className="text-sm text-gray-300">Lifetime Pixels: {formatNumber(gameState.lifetimePixels)}</p>
          {gameState.rebirthCount > 0 && (
            <p className="text-sm text-violet-400">Rebirths: {gameState.rebirthCount}</p>
          )}
          
          {/* Game progress section */}
          <div className="mt-4 p-3 bg-gray-800/50 rounded-md">
            <h3 className="text-md font-semibold mb-2">Game Progress</h3>
            <div className="space-y-2">
              {/* Progress to next upgrade tier */}
              <div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Next Tier Progress:</span>
                  <span>{calculateNextTierProgress().toFixed(1)}%</span>
                </div>
                <div className="mt-1 bg-gray-900 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full" 
                    style={{ width: `${calculateNextTierProgress()}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Progress to rebirth */}
              <div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Rebirth Progress:</span>
                  <span>{calculateRebirthProgress().toFixed(1)}%</span>
                </div>
                <div className="mt-1 bg-gray-900 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-violet-600 h-full" 
                    style={{ width: `${calculateRebirthProgress()}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col h-screen bg-gray-900 text-white">
        {/* Game Area */}
        <div 
          className="relative flex-grow overflow-hidden" 
          onClick={handleClick}
        >
          {/* Pixel visualization */}
          {pixelPileRendering}
          
          {/* UI Container */}
          <div className="absolute inset-0 pointer-events-none">
            <SidebarLayout activeTab={activeTab} setActiveTab={setActiveTab}>
              {renderMainContent()}
            </SidebarLayout>
            
            {/* Tab Content (rendered by SidebarLayout) */}
            {activeTab && renderTabContent()}
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        * {
          user-select: none;
        }
        
        .pixel-block {
          transition: transform 0.15s ease, box-shadow 0.15s ease, z-index 0.01s;
        }
        
        .pixel-block:hover {
          transform: scale(1.5) translateY(-5px);
          z-index: 9999 !important;
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.5) !important;
        }
        
        /* Custom scrollbar styles */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        /* Skill tree styles */
        .skill-node {
          transition: all 0.2s ease;
        }
        
        .skill-node:hover {
          transform: scale(1.05);
        }
        
        .skill-connections line {
          transition: stroke 0.3s ease, stroke-width 0.3s ease;
        }
        
        /* Glow effect for maxed skills */
        .skill-node.bg-violet-700 {
          box-shadow: 0 0 15px 5px rgba(139, 92, 246, 0.3);
        }
      `}</style>
    </>
  );
}