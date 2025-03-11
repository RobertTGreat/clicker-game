'use client';

import React, { Fragment } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { useEffect, useState, useRef, MouseEvent as ReactMouseEvent, ReactNode, ChangeEvent, useCallback, useMemo } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { PanelId, NonNullPanelId } from '@/types/gameTypes';
import SimpleRain from '@/components/SimpleRain';

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
  [key in NonNullPanelId]: PanelState;
};

// Define settings type
type ColorScheme = 'rainbow' | 'monochrome' | 'blues' | 'greens';
type AnimationSpeed = 'slow' | 'normal' | 'fast';

type Settings = {
  pixelSize: number;
  colorScheme: ColorScheme;
  animationSpeed: AnimationSpeed;
};

// Theme helper functions
const themeColors = {
  blue: {
    primary: 'rgb(59, 130, 246)',
    light: 'rgb(96, 165, 250)',
    dark: 'rgb(29, 78, 216)'
  },
  purple: {
    primary: 'rgb(168, 85, 247)',
    light: 'rgb(192, 132, 252)',
    dark: 'rgb(126, 34, 206)'
  },
  green: {
    primary: 'rgb(34, 197, 94)',
    light: 'rgb(74, 222, 128)',
    dark: 'rgb(21, 128, 61)'
  },
  amber: {
    primary: 'rgb(245, 158, 11)',
    light: 'rgb(251, 191, 36)',
    dark: 'rgb(180, 83, 9)'
  },
  rose: {
    primary: 'rgb(244, 63, 94)',
    light: 'rgb(251, 113, 133)',
    dark: 'rgb(190, 18, 60)'
  }
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
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [themeColor, setThemeColor] = useState('blue');
  
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

  // Init theme from localStorage if available
  useEffect(() => {
    if (isClient) {
      const savedDarkMode = localStorage.getItem('isDarkMode');
      const savedThemeColor = localStorage.getItem('themeColor');
      
      if (savedDarkMode !== null) {
        setIsDarkMode(savedDarkMode === 'true');
      }
      
      if (savedThemeColor) {
        setThemeColor(savedThemeColor);
      }
    }
  }, [isClient]);
  
  // Save theme preferences
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('isDarkMode', String(isDarkMode));
      localStorage.setItem('themeColor', themeColor);
    }
  }, [isDarkMode, themeColor, isClient]);

  const pixelsPerSecond = getPixelsPerSecond();
  
  // Safe formatNumber function that works on both server and client
  const formatNumber = (num: number): string => {
    // Handle undefined, NaN or non-numbers safely
    if (typeof num !== 'number' || isNaN(num)) return '0';
    
    // Define suffixes for very large numbers
    const suffixes = [
      '', 'k', 'm', 'b', 't', 'qd', 'qt', 'sx', 'sp', 'oc', 'nn', 
      'dc', 'ud', 'dd', 'td', 'qad', 'qid', 'sxd', 'spd', 'ocd', 'nnd',
      'vg', 'uvg', 'dvg', 'tvg', 'qdvg', 'qtvg', 'sxvg', 'spvg', 'ocvg', 'nnvg',
      'tg', 'utg', 'dtg', 'ttg', 'qdtg', 'qttg', 'sxtg', 'sptg', 'octg', 'nntg'
    ];
    
    // Determine the appropriate suffix and value
    const tier = Math.log10(Math.abs(num)) / 3 | 0;
    
    // If zero or less than 1000, no suffix
    if (tier === 0) return Math.floor(num).toString();
    
    // Get the suffix and determine the scale factor
    const suffix = suffixes[tier];
    const scale = Math.pow(10, tier * 3);
    
    // Format the number with the appropriate scale and suffix
    const scaled = num / scale;
    
    // Return the formatted number with suffix
    return scaled.toFixed(1).replace(/\.0$/, '') + suffix;
  };

  // Calculate progress toward next rebirth tier (0-100%)
  const calculateRebirthProgress = () => {
    // Base is 10 million pixels for 100%
    const baseRequirement = 10000000;
    return Math.min(100, (gameState.lifetimePixels / baseRequirement) * 100);
  };
  
  // Calculate how many rebirth points would be gained
  const calculateRebirthGain = () => {
    // Only allow rebirth if progress is at 100%
    if (calculateRebirthProgress() < 100) {
      return 0;
    }
    
    // Base on cube root of lifetime pixels / 1000
    return Math.floor(Math.pow(gameState.lifetimePixels / 1000, 1/3));
  };
  
  // Calculate progress to next upgrade tier (0-100%)
  const calculateNextTierProgress = () => {
    const tierThresholds = [
      100,          // Tier 0 -> 1
      10000,        // Tier 1 -> 2
      1000000,      // Tier 2 -> 3
      100000000,    // Tier 3 -> 4
      10000000000,  // Tier 4 -> 5
    ];
    
    // Determine current tier based on lifetime pixels
    let currentTier = 0;
    for (let i = 0; i < tierThresholds.length; i++) {
      if (gameState.lifetimePixels >= tierThresholds[i]) {
        currentTier = i + 1;
      } else {
        break;
      }
    }
    
    // If at max tier, return 100%
    if (currentTier >= tierThresholds.length) {
      return 100;
    }
    
    // Calculate progress to next tier
    const prevThreshold = currentTier > 0 ? tierThresholds[currentTier - 1] : 0;
    const nextThreshold = tierThresholds[currentTier];
    const progress = ((gameState.lifetimePixels - prevThreshold) / (nextThreshold - prevThreshold)) * 100;
    
    return Math.min(100, Math.max(0, progress));
  };
  
  // Get connections for skill tree visualization
  const getSkillConnections = (skillId: string) => {
    // Define skill positions
    const skillPositions: { [key: string]: { x: number, y: number } } = {
      'click-power': { x: 60, y: 80 },
      'auto-efficiency': { x: 180, y: 80 },
      'starting-pixels': { x: 300, y: 80 },
      'upgrade-discount': { x: 60, y: 200 },
      'autoclicker-discount': { x: 180, y: 200 },
      'click-mastery': { x: 60, y: 320 },
      'automation-empire': { x: 180, y: 320 },
      'pixel-singularity': { x: 120, y: 440 }
    };
    
    // Define connections
    const connections: { [key: string]: Array<{ start: { x: number, y: number }, length: number, direction: string }> } = {
      'upgrade-discount': [{ start: { x: 60, y: 130 }, length: 60, direction: 'down' }],
      'autoclicker-discount': [{ start: { x: 180, y: 130 }, length: 60, direction: 'down' }],
      'click-mastery': [{ start: { x: 60, y: 250 }, length: 60, direction: 'down' }],
      'automation-empire': [{ start: { x: 180, y: 250 }, length: 60, direction: 'down' }],
      'pixel-singularity': [
        { start: { x: 60, y: 370 }, length: 90, direction: 'down-right' },
        { start: { x: 180, y: 370 }, length: 90, direction: 'down-left' }
      ]
    };
    
    return connections[skillId] || [];
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
                            className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-3 opacity-70 text-center whitespace-nowrap text-xs"
                            style={{ 
                              textShadow: '0 0 3px rgba(0,0,0,0.8)',
                              fontSize: '0.6rem',
                              color: 'white'
                            }}
                          >
                            {column.pixelCount > 1000 ? formatNumber(column.pixelCount) : ''}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }, [isClient, gameState.pixels, settings.pixelSize, formatNumber]);

  // Function to render the next purchasable upgrade
  const renderNextPurchasableUpgrade = () => {
    // Find the first unpurchased upgrade that the player can afford
    const nextUpgrade = gameState.upgrades
      .filter(u => !u.purchased)
      .sort((a, b) => a.cost - b.cost)[0];

    if (!nextUpgrade) return <div className="text-gray-400 text-center p-4">All upgrades purchased!</div>;

    const rebirthEffects = getRebirthEffects();
    const discountedCost = Math.floor(nextUpgrade.cost * (1 - rebirthEffects.upgradeCostReduction));
    const canAfford = gameState.pixels >= discountedCost;
    
    // Calculate progress percentage toward being able to afford
    const progressPercent = Math.min(100, (gameState.pixels / discountedCost) * 100);

    return (
      <div 
        className="relative overflow-hidden rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glowing progress bar background */}
        <div 
          className="absolute inset-0 bg-blue-600/20 transition-all duration-300"
          style={{ 
            width: `${progressPercent}%`,
            boxShadow: canAfford ? '0 0 20px rgba(37, 99, 235, 0.5)' : 'none',
            backgroundColor: themeColors[themeColor as keyof typeof themeColors].primary.replace('rgb', 'rgba').replace(')', ', 0.2)')
          }}
        />
        
        <div className="relative z-10 flex items-center justify-between p-3">
          <div>
            <h3 className={`font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>Next Upgrade:</h3>
            <div className={isDarkMode ? 'text-white' : 'text-gray-800'}>{nextUpgrade.name}</div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{nextUpgrade.description}</div>
          </div>
          <button
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              canAfford
                ? 'bg-gradient-to-br from-blue-600/80 to-blue-800/80 hover:from-blue-500/80 hover:to-blue-700/80 shadow-lg shadow-blue-700/20 text-white'
                : 'bg-gray-700/50 cursor-not-allowed opacity-60 text-gray-300'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (canAfford) {
                buyUpgrade(nextUpgrade.id);
              }
            }}
            disabled={!canAfford}
            style={{
              background: canAfford 
                ? `linear-gradient(to bottom right, ${themeColors[themeColor as keyof typeof themeColors].light}cc, ${themeColors[themeColor as keyof typeof themeColors].dark}cc)`
                : ''
            }}
          >
            {formatNumber(discountedCost)} pixels
          </button>
        </div>
        
        {/* Progress indicator at the bottom */}
        <div className="h-1 bg-gray-800 absolute bottom-0 left-0 right-0">
          <div 
            className={`h-full transition-all duration-300`}
            style={{ 
              width: `${progressPercent}%`,
              backgroundColor: themeColors[themeColor as keyof typeof themeColors][canAfford ? 'light' : 'primary']
            }}
          />
        </div>
      </div>
    );
  };

  // Helper function to render upgrade tiers
  const renderUpgradeTier = (upgrades: any[], title: string, textColorClass: string) => {
    const availableUpgrades = upgrades.filter(u => !u.purchased);
    if (availableUpgrades.length === 0) return null;
    
    return (
      <div>
        <h3 className={`text-md font-semibold mb-2 ${textColorClass}`}>{title}</h3>
        <div className="space-y-2">
          {availableUpgrades.map((upgrade) => {
            const rebirthEffects = getRebirthEffects();
            const discountedCost = Math.floor(upgrade.cost * (1 - rebirthEffects.upgradeCostReduction));
            const canAfford = gameState.pixels >= discountedCost;
            
            return (
              <div 
                key={upgrade.id} 
                className="backdrop-blur-md bg-blue-900/20 rounded-xl p-4 transition-all hover:bg-blue-900/30 border border-blue-500/20 shadow-lg shadow-blue-500/5"
              >
                <div className="flex justify-between">
                  <div>
                    <div className="font-semibold">{upgrade.name}</div>
                    <div className="text-sm text-gray-300">{upgrade.description}</div>
                    <div className="text-xs text-gray-400 mt-1">{formatNumber(gameState.clickPower)} → {formatNumber(gameState.clickPower * upgrade.multiplier)}</div>
                  </div>
                  <button
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      canAfford
                        ? 'bg-gradient-to-br from-blue-600/80 to-blue-800/80 hover:from-blue-500/80 hover:to-blue-700/80 shadow-lg shadow-blue-700/20'
                        : 'bg-gray-700/50 cursor-not-allowed'
                    }`}
                    onClick={() => buyUpgrade(upgrade.id)}
                    disabled={!canAfford}
                  >
                    {formatNumber(discountedCost)}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // Tab content rendering
  const renderStructuresContent = () => (
    <div className="p-4">
      <div className="space-y-4">
        {gameState.autoClickers.map((clicker) => {
          const rebirthEffects = getRebirthEffects();
          const discountedCost = Math.floor(clicker.cost * (1 - rebirthEffects.autoClickerCostReduction));
          return (
            <div key={clicker.id} className={`backdrop-blur-md rounded-xl p-4 transition-all hover:bg-purple-900/30 border shadow-lg ${
              isDarkMode ? 'bg-purple-900/20 border-purple-500/20 shadow-purple-500/5' : 'bg-purple-100/60 border-purple-300/30 shadow-purple-300/10'
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className={`font-semibold text-lg ${isDarkMode ? 'text-purple-300' : 'text-purple-800'}`}>{clicker.name}</div>
                  <div className={`text-sm ${isDarkMode ? 'text-purple-200/80' : 'text-purple-700/90'}`}>{clicker.count} owned • {formatNumber(clicker.pixelsPerSecond)} pixels/sec each</div>
                </div>
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    gameState.pixels >= discountedCost
                      ? 'bg-gradient-to-br from-purple-600/80 to-purple-800/80 hover:from-purple-500/80 hover:to-purple-700/80 shadow-lg shadow-purple-700/20 text-white'
                      : 'bg-gray-700/50 cursor-not-allowed text-gray-300'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    buyAutoClicker(clicker.id);
                  }}
                  disabled={gameState.pixels < discountedCost}
                  style={{
                    background: gameState.pixels >= discountedCost 
                      ? `linear-gradient(to bottom right, ${themeColors[themeColor as keyof typeof themeColors].light}cc, ${themeColors[themeColor as keyof typeof themeColors].dark}cc)`
                      : ''
                  }}
                >
                  Buy: {formatNumber(discountedCost)}
                  <div className="w-full mt-1 bg-gray-900/50 rounded-full h-1 overflow-hidden">
                    <div 
                      className="bg-purple-600 h-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(100, (gameState.pixels / discountedCost) * 100)}%`,
                        backgroundColor: themeColors[themeColor as keyof typeof themeColors].primary
                      }}
                    ></div>
                  </div>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderRebirthContent = () => (
    <div className="p-4">
      <div className={`backdrop-blur-md rounded-xl p-6 mb-6 border shadow-lg ${
        isDarkMode ? 'bg-violet-900/20 border-violet-500/20 shadow-violet-500/5' : 'bg-violet-100/60 border-violet-300/30 shadow-violet-300/10'
      }`}>
        <div className="mb-2">
          <span className={isDarkMode ? 'text-violet-300' : 'text-violet-800'}>Current Rebirth Points:</span>
          <span className="ml-2 font-bold">{gameState.rebirthPoints}</span>
        </div>
        
        <div className="mb-4">
          <span className={isDarkMode ? 'text-violet-300' : 'text-violet-800'}>Potential Gain:</span>
          <span className="ml-2 font-bold">{calculateRebirthGain()}</span>
        </div>
        
        <div className="w-full bg-violet-950/50 rounded-full h-2 mb-4">
          <div
            className="bg-violet-600 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${calculateRebirthProgress()}%`,
              backgroundColor: themeColors[themeColor as keyof typeof themeColors].primary
            }}
          />
        </div>
        
        <button
          className={`w-full px-4 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-violet-700/20 text-white
            ${calculateRebirthGain() <= 0 || isNaN(calculateRebirthGain()) ? 'bg-gray-700/50' : 'bg-gradient-to-br from-violet-600/80 to-violet-800/80 hover:from-violet-500/80 hover:to-violet-700/80'}
          `}
          onClick={performRebirth}
          disabled={calculateRebirthGain() <= 0 || isNaN(calculateRebirthGain())}
          style={{
            background: calculateRebirthGain() > 0 && !isNaN(calculateRebirthGain())
              ? `linear-gradient(to bottom right, ${themeColors[themeColor as keyof typeof themeColors].light}cc, ${themeColors[themeColor as keyof typeof themeColors].dark}cc)`
              : ''
          }}
        >
          Rebirth
        </button>
      </div>
      
      <div className={`p-2 rounded-xl backdrop-blur-md border-violet-500/10 ${isDarkMode ? 'bg-gray-900/30' : 'bg-white/30 border'}`}>
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
            <div className="relative mb-6" key={skill.id}>
              {connections.map((conn, idx) => (
                <div
                  key={`${skill.id}-conn-${idx}`}
                  className={`absolute h-1 transform ${
                    conn.direction === 'right' ? 'rotate-0' : 
                    conn.direction === 'down' ? 'rotate-90 origin-top-left' : 
                    conn.direction === 'down-right' ? 'rotate-45 origin-top-left' : 'rotate-135 origin-top-left'
                  }`}
                  style={{
                    top: conn.start.y,
                    left: conn.start.x,
                    width: conn.length,
                    zIndex: 1,
                    backgroundColor: isDarkMode ? 'rgb(75, 85, 99)' : 'rgb(156, 163, 175)'
                  }}
                />
              ))}
              
              <button
                className={`w-full relative z-10 p-3 rounded-lg flex flex-col items-center text-center
                  ${skill.level > 0 
                    ? isDarkMode ? 'bg-violet-800 border border-violet-600' : 'bg-violet-300 border border-violet-400' 
                    : !requirementsMet 
                      ? 'bg-gray-800 opacity-50 cursor-not-allowed' 
                      : canAfford 
                        ? isDarkMode ? 'bg-gray-800 hover:bg-gray-700 border border-violet-800' : 'bg-gray-200 hover:bg-gray-100 border border-violet-400'
                        : isDarkMode ? 'bg-gray-800 border border-gray-700 opacity-75 cursor-not-allowed' : 'bg-gray-200 border border-gray-300 opacity-75 cursor-not-allowed'
                  }`}
                onClick={() => skill.level < skill.maxLevel && requirementsMet && canAfford && buyRebirthSkill(skill.id)}
                disabled={skill.level >= skill.maxLevel || !canAfford || !requirementsMet}
                title={!requirementsMet ? "Requirements not met" : isMaxLevel ? "Maximum level reached" : ""}
              >
                <div className="font-semibold">{skill.name}</div>
                <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{skill.level}/{skill.maxLevel}</div>
                
                {!isMaxLevel && (
                  <div className={`text-xs mt-2 ${canAfford ? (isDarkMode ? 'text-violet-400' : 'text-violet-700') : (isDarkMode ? 'text-gray-500' : 'text-gray-600')}`}>
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

  const renderSettingsContent = () => {
    return (
      <div className="p-4">
        <div className="space-y-6">
          {/* Theme Settings */}
          <div className={`backdrop-blur-md p-4 rounded-xl border shadow-lg ${
            isDarkMode ? 'bg-gray-800/30 border-gray-500/20 shadow-gray-500/5' : 'bg-white/30 border-gray-300/30 shadow-gray-300/10'
          }`}>
            <h3 className={`text-md font-semibold mb-3 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>Theme Settings</h3>
            
            {/* Light/Dark Mode Toggle */}
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm">Dark Mode</label>
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isDarkMode ? 'bg-blue-700' : 'bg-gray-400'
                }`}
              >
                <span
                  className={`${
                    isDarkMode ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
                <span className="absolute left-1 text-xs text-white opacity-70">
                  {isDarkMode ? '🌙' : '☀️'}
                </span>
              </button>
            </div>
            
            {/* Color Theme Selector */}
            <div className="mb-2">
              <label className="text-sm block mb-2">Color Theme</label>
              <div className="flex space-x-2 mb-4">
                {Object.keys(themeColors).map((color) => (
                  <button
                    key={color}
                    onClick={() => setThemeColor(color)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      themeColor === color ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ 
                      backgroundColor: themeColors[color as keyof typeof themeColors].primary,
                      boxShadow: themeColor === color ? `0 0 12px ${themeColors[color as keyof typeof themeColors].primary}` : 'none'
                    }}
                    aria-label={`${color} theme`}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* Pixel Size */}
          <div className={`backdrop-blur-md p-4 rounded-xl border shadow-lg ${
            isDarkMode ? 'bg-gray-800/30 border-gray-500/20 shadow-gray-500/5' : 'bg-white/30 border-gray-300/30 shadow-gray-300/10'
          }`}>
            <label className={`block mb-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Pixel Size</label>
            <input
              type="range"
              min="1"
              max="10"
              value={settings.pixelSize}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSettings({...settings, pixelSize: parseInt(e.target.value)})}
              className="w-full"
              style={{ accentColor: themeColors[themeColor as keyof typeof themeColors].primary }}
            />
            <div className="text-sm text-right">{settings.pixelSize}</div>
          </div>
          
                    {/* Animation Speed */}
                    <div className={`backdrop-blur-md p-4 rounded-xl border shadow-lg ${
            isDarkMode ? 'bg-gray-800/30 border-gray-500/20 shadow-gray-500/5' : 'bg-white/30 border-gray-300/30 shadow-gray-300/10'
          }`}>
            <label className={`block mb-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Animation Speed</label>
            <select
              value={settings.animationSpeed}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setSettings({...settings, animationSpeed: e.target.value as AnimationSpeed})}
              className={`w-full p-2 rounded-lg ${
                isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-white border-gray-300'
              }`}
            >
              <option value="slow">Slow</option>
              <option value="normal">Normal</option>
              <option value="fast">Fast</option>
            </select>
          </div>
          
          {/* Reset Game Button */}
          <div className={`backdrop-blur-md p-4 rounded-xl border shadow-lg ${
            isDarkMode ? 'bg-gray-800/30 border-gray-500/20 shadow-gray-500/5' : 'bg-white/30 border-gray-300/30 shadow-gray-300/10'
          }`}>
            <button 
              onClick={resetGame} 
              className="bg-gradient-to-br from-red-600/80 to-red-800/80 hover:from-red-500/80 hover:to-red-700/80 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg shadow-red-700/20"
            >
              Reset Game
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderMainContent = () => {
    return (
      <div className="p-4 h-full">
        <h2 className={`text-xl font-mono mb-4 text-center py-2 rounded-lg shadow-inner ${
          isDarkMode ? 'bg-indigo-900/30' : 'bg-indigo-100/70'
        }`}>
          {formatNumber(gameState.pixels)} <span className={isDarkMode ? 'text-indigo-300' : 'text-indigo-700'}>pixels</span>
        </h2>
        
        {/* Main stats and progress in a flex layout */}
        <div className="flex flex-wrap gap-4">
          {/* Basic stats section */}
          <div className={`rounded-md p-3 flex-1 min-w-[200px] border shadow-md ${
            isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/80 border-gray-300/50'
          }`}>
            <h3 className={`text-md font-semibold mb-2 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>Stats</h3>
            <div className="space-y-2">
              <p className={`text-sm flex justify-between ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <span>Pixels/sec:</span> <span className="font-mono">{formatNumber(getPixelsPerSecond())}</span>
              </p>
              <p className={`text-sm flex justify-between ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <span>Click Power:</span> <span className="font-mono">{formatNumber(gameState.clickPower)}</span>
              </p>
              <p className={`text-sm flex justify-between ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <span>Lifetime Pixels:</span> <span className="font-mono">{formatNumber(gameState.lifetimePixels)}</span>
              </p>
              {gameState.rebirthCount > 0 && (
                <p className={`text-sm flex justify-between ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`}>
                  <span>Rebirths:</span> <span className="font-mono">{gameState.rebirthCount}</span>
                </p>
              )}
            </div>
          </div>
          
          {/* Game progress section */}
          <div className={`rounded-md p-3 flex-1 min-w-[200px] border shadow-md ${
            isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/80 border-gray-300/50'
          }`}>
            <h3 className={`text-md font-semibold mb-2 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>Game Progress</h3>
            <div className="space-y-2">
              {/* Progress to next upgrade tier */}
              <div>
                <div className={`flex justify-between text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <span>Next Tier Progress:</span>
                  <span>{calculateNextTierProgress().toFixed(1)}%</span>
                </div>
                <div className={`mt-1 rounded-full h-2 overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-200'}`}>
                  <div 
                    className="h-full" 
                    style={{ 
                      width: `${calculateNextTierProgress()}%`,
                      backgroundColor: themeColors[themeColor as keyof typeof themeColors].primary
                    }}
                  ></div>
                </div>
              </div>
              
              {/* Progress to rebirth */}
              <div>
                <div className={`flex justify-between text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <span>Rebirth Progress:</span>
                  <span>{calculateRebirthProgress().toFixed(1)}%</span>
                </div>
                <div className={`mt-1 rounded-full h-2 overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-200'}`}>
                  <div 
                    className="h-full" 
                    style={{ 
                      width: `${calculateRebirthProgress()}%`,
                      backgroundColor: themeColors[themeColor as keyof typeof themeColors].primary
                    }}
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
      <div className={`flex flex-col h-screen text-white transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-100 text-gray-900'
      }`}>
        {/* Game Area */}
        <div 
          className="relative flex-grow overflow-hidden backdrop-blur-md cursor-pointer"
          style={{ backgroundColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)' }}
          onClick={() => handleClick()}
        >
          {/* Pixel Rain Effect - direct child of game area */}
          <div className="absolute inset-0 z-[5] overflow-hidden">
            <SimpleRain pixelsPerSecond={getPixelsPerSecond()} />
          </div>
          
          {/* Pixel visualization */}
          <div className="relative z-[10]">
            {pixelPileRendering}
          </div>

          {/* UI Container - highest z-index */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            <div className="h-full w-full pointer-events-none">
              <SidebarLayout 
                nextUpgradeContent={renderNextPurchasableUpgrade()}
                structuresContent={renderStructuresContent()}
                rebirthContent={renderRebirthContent()}
                settingsContent={renderSettingsContent()}
                isDarkMode={isDarkMode}
                themeColor={themeColor}
              >
                {renderMainContent()}
              </SidebarLayout>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes rainFall {
          0% {
            transform: translateY(0) rotate(10deg);
          }
          100% {
            transform: translateY(calc(100vh + 50px)) rotate(10deg);
          }
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${isDarkMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'};
        }
      `}</style>
    </>
  );
}