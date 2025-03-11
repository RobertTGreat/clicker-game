'use client';

import React, { Fragment } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { useEffect, useState, useRef, MouseEvent as ReactMouseEvent, ReactNode, ChangeEvent, useCallback, useMemo } from 'react';

// Define panel ID type
type PanelId = 'stats' | 'upgrades' | 'autoClickers' | 'settings' | 'rebirth';

// Define sub-tabs for the upgrades panel
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
  
  // Panel states - initialize with safe defaults
  const [panelStates, setPanelStates] = useState<PanelStates>({
    stats: { minimized: false, position: { x: 20, y: 80 } },
    upgrades: { minimized: false, position: { x: 20, y: 80 } },
    autoClickers: { minimized: false, position: { x: 20, y: 400 } },
    settings: { minimized: false, position: { x: 20, y: 400 } },
    rebirth: { minimized: false, position: { x: 300, y: 200 } }
  });
  
  // Refs for dragging
  const dragRefs = {
    stats: useRef<HTMLDivElement | null>(null),
    upgrades: useRef<HTMLDivElement | null>(null),
    autoClickers: useRef<HTMLDivElement | null>(null),
    settings: useRef<HTMLDivElement | null>(null),
    rebirth: useRef<HTMLDivElement | null>(null)
  };
  
  // Settings state
  const [settings, setSettings] = useState<Settings>({
    pixelSize: 6,
    colorScheme: 'rainbow',
    animationSpeed: 'normal',
  });

  // Add state for currently selected upgrades sub-tab
  const [activeUpgradeTab, setActiveUpgradeTab] = useState<UpgradeSubTab>('upgrades');

  // To prevent hydration mismatch and set panel positions based on window size
  useEffect(() => {
    setIsClient(true);
    
    // Update panel positions based on window dimensions after client-side rendering
    setPanelStates({
      stats: { minimized: false, position: { x: 20, y: 80 } },
      upgrades: { minimized: false, position: { x: window.innerWidth - 300, y: 80 } },
      autoClickers: { minimized: false, position: { x: window.innerWidth - 300, y: window.innerHeight - 300 } },
      settings: { minimized: false, position: { x: 20, y: window.innerHeight - 300 } },
      rebirth: { minimized: true, position: { x: Math.max(300, window.innerWidth / 2 - 200), y: 150 } }
    });
  }, []);

  const pixelsPerSecond = getPixelsPerSecond();
  
  // Create a draggable component
  const Draggable = ({ id, children, minimized, onMinimize }: { id: PanelId, children: ReactNode, minimized: boolean, onMinimize: () => void }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const animationFrameRef = useRef<number | null>(null);
    const mousePosRef = useRef({ x: 0, y: 0 });
    
    const handleMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target.closest('.panel-body') || target.closest('.minimize-btn')) return;
      
      setIsDragging(true);
      const rect = dragRefs[id].current?.getBoundingClientRect() || { left: 0, top: 0 };
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      
      // Capture initial mouse position
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };
    
    const updatePanelPosition = useCallback(() => {
      if (!isDragging) return;
      const { x, y } = mousePosRef.current;
      const newX = Math.max(0, Math.min(window.innerWidth - 250, x - dragOffset.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 100, y - dragOffset.y));
      if (dragRefs[id].current) {
        dragRefs[id].current.style.left = newX + 'px';
        dragRefs[id].current.style.top = newY + 'px';
      }
      if (isDragging) {
        animationFrameRef.current = requestAnimationFrame(updatePanelPosition);
      }
    }, [isDragging, dragOffset, id]);
    
    const handleMouseMove = useCallback((e: globalThis.MouseEvent) => {
      if (!isDragging) return;
      // Update mouse position; DOM updates happen in requestAnimationFrame
      mousePosRef.current = { x: e.clientX, y: e.clientY };
      if (!animationFrameRef.current) {
        animationFrameRef.current = requestAnimationFrame(updatePanelPosition);
      }
    }, [isDragging, updatePanelPosition]);
    
    const handleMouseUp = useCallback(() => {
      setIsDragging(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (dragRefs[id].current) {
        const rect = dragRefs[id].current.getBoundingClientRect();
        setPanelStates(prev => ({
          ...prev,
          [id]: {
            ...prev[id],
            position: { x: rect.left, y: rect.top }
          }
        }));
      }
    }, [id, dragRefs, setPanelStates]);
    
    useEffect(() => {
      if (isDragging) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        animationFrameRef.current = requestAnimationFrame(updatePanelPosition);
      } else {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      }
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      };
    }, [isDragging, handleMouseMove, handleMouseUp, updatePanelPosition]);
    
    // Memoize panel style with explicit typing to fix linter error
    const panelStyle = useMemo<React.CSSProperties>(() => ({
      position: 'absolute',
      left: `${panelStates[id].position.x}px`,
      top: `${panelStates[id].position.y}px`,
      zIndex: isDragging ? 100 : 10,
      userSelect: 'none',
      transform: isDragging ? 'translateZ(0)' : undefined,
      willChange: isDragging ? 'transform, left, top' : undefined
    }), [id, isDragging, panelStates]);
    
    const panelClassName = `backdrop-blur-md bg-black/80 rounded-md border border-gray-800 shadow-lg overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`;
    
    return (
      <div 
        ref={dragRefs[id]}
        style={panelStyle}
        className={panelClassName}
        onMouseDown={handleMouseDown}
      >
        <div className="flex justify-between items-center p-2 border-b border-gray-800">
          <div className="w-24"></div> {/* Spacer */}
          <div className="font-mono text-xs text-gray-400 uppercase">{id}</div>
          <button 
            className="minimize-btn w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white"
            onClick={onMinimize}
          >
            {minimized ? '+' : '-'}
          </button>
        </div>
        
        {!minimized && (
          // Add onMouseDown stopPropagation so that scrolling inside doesn't trigger dragging
          <div className="panel-body" onMouseDown={(e) => e.stopPropagation()}>
            {children}
          </div>
        )}
      </div>
    );
  };
  
  // Move the entire pixel pile rendering logic into a useMemo at the component level
  const pixelPileRendering = useMemo(() => {
    // Calculate how many pixels to show based on the game state
    const totalPixels = Math.min(20000, Math.floor(gameState.pixels));
    
    // Significantly reduce the number of DOM elements to fix lag
    // Instead of rendering thousands of individual pixels, we'll render columns
    const maxVisibleColumns = 30; // Fixed number of columns for better performance
    
    // Create array of column indexes
    const columnsArray = Array.from({ length: maxVisibleColumns }, (_, i) => i);
    
    // Calculate value per column
    const pixelsPerColumn = Math.floor(totalPixels / maxVisibleColumns);
    
    // Create array of column heights based on total pixels
    const columnHeights = columnsArray.map((_, i) => {
      // Distribute pixels to create an interesting skyline 
      // Some random variation but taller in the middle to create a city-like appearance
      const distanceFromCenter = Math.abs((i / (maxVisibleColumns - 1)) - 0.5) * 2; // 0-1 value, 0 at center, 1 at edges
      const baseHeight = Math.log10(totalPixels) * 3; // Base height scales with total pixels
      const columnPixels = pixelsPerColumn * (1 - (distanceFromCenter * 0.7)); // Taller in the middle
      
      return {
        index: i,
        heightPercent: Math.min(90, baseHeight + columnPixels / 1000), // Height percentage (max 90%)
        pixelCount: Math.floor(columnPixels),
        color: getAverageColumnColor(columnPixels)
      };
    });
    
    // Determine color based on pixel value
    function getAverageColumnColor(pixelCount: number) {
      // Create a gradient based on the pixel count
      if (pixelCount < 100) {
        return { hue: 0, saturation: 70, lightness: 45 }; // Red
      } else if (pixelCount < 500) {
        return { hue: 30, saturation: 75, lightness: 50 }; // Orange
      } else if (pixelCount < 1000) {
        return { hue: 60, saturation: 75, lightness: 55 }; // Yellow
      } else if (pixelCount < 5000) {
        return { hue: 120, saturation: 65, lightness: 40 }; // Green
      } else if (pixelCount < 10000) {
        return { hue: 180, saturation: 70, lightness: 40 }; // Cyan
      } else if (pixelCount < 50000) {
        return { hue: 240, saturation: 70, lightness: 50 }; // Blue
      } else {
        return { hue: 270, saturation: 75, lightness: 60 }; // Purple
      }
    }
    
    // Create pile effect
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 flex justify-center">
          <div className="relative w-full max-w-screen-lg h-full">
            {/* Render columns instead of individual pixels */}
            {columnHeights.map((column) => {
              // Calculate position within layout
              const columnPosition = (column.index * (100 / maxVisibleColumns)) + (50 / maxVisibleColumns);
              
              // Vertical tower size (width based on pixel size setting)
              const towerWidth = Math.max(3, settings.pixelSize);
              
              // Random slight horizontal offset for the tower (very minimal)
              const horizOffset = -0.1 + Math.random() * 0.2; // Very minor offset
              
              // Generate segment count - each tower will have 1-5 segments for visual interest
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
                  {/* Render tower base */}
                  <div 
                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-2 rounded-full"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.2)'
                    }}
                  />
                  
                  {/* Render tower segments */}
                  {segments.map((segIndex) => {
                    const segHeight = (column.heightPercent / segmentCount);
                    const segPosition = segIndex * segHeight;
                    
                    // Segment brightness increases with height
                    const heightRatio = segIndex / segments.length;
                    const segmentLightness = column.color.lightness + (heightRatio * 15);
                    
                    // Add slight color variation between segments
                    const hueVar = -5 + Math.random() * 10;
                    
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
                        {/* Add lights effect to tops of tall buildings */}
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
        
        {/* Color legend */}
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
  }, [gameState.pixels, settings.pixelSize, settings.animationSpeed]); // Only recalculate when these values change

  // Toggle panel minimized state
  const toggleMinimize = (panelId: PanelId) => {
    setPanelStates(prev => ({
      ...prev,
      [panelId]: {
        ...prev[panelId],
        minimized: !prev[panelId].minimized
      }
    }));
  };

  // Calculate rebirth potential
  const calculateRebirthGain = () => {
    // Formula: log10(pixels) rounded down
    return Math.max(1, Math.floor(Math.log10(gameState.pixels)));
  };
  
  // New function to calculate progress toward next rebirth point
  const calculateRebirthProgress = () => {
    const currentLog = Math.log10(gameState.pixels);
    const currentFloor = Math.floor(currentLog);
    const nextThreshold = Math.pow(10, currentFloor + 1);
    
    // Calculate percentage progress to next level (0-100)
    return {
      current: gameState.pixels,
      next: nextThreshold,
      percentage: ((gameState.pixels - Math.pow(10, currentFloor)) / (nextThreshold - Math.pow(10, currentFloor))) * 100
    };
  };
  
  // Get skill connections for visualization
  const getSkillConnections = () => {
    const connections: Array<{from: string, to: string}> = [];
    
    if (!gameState.rebirthSkills || !Array.isArray(gameState.rebirthSkills)) {
      return connections;
    }
    
    gameState.rebirthSkills.forEach(skill => {
      if (skill.requires) {
        skill.requires.forEach(requiredId => {
          connections.push({
            from: requiredId,
            to: skill.id
          });
        });
      }
    });
    
    return connections;
  };

  // Check if a skill is available based on prerequisites
  const isSkillAvailable = (skillId: string) => {
    if (!gameState.rebirthSkills || !Array.isArray(gameState.rebirthSkills)) {
      return false;
    }
    
    const skill = gameState.rebirthSkills.find(s => s.id === skillId);
    if (!skill || skill.level >= skill.maxLevel) return false;
    
    // Check prerequisites
    if (skill.requires) {
      const prerequisites = gameState.rebirthSkills.filter(s => 
        skill.requires?.includes(s.id)
      );
      
      if (prerequisites.some(p => p.level === 0)) {
        return false;
      }
    }
    
    return true;
  };
  
  // Render the rebirth skill tree
  const renderSkillTree = () => {
    // Handle case where rebirth skills aren't loaded yet
    if (!gameState.rebirthSkills || !Array.isArray(gameState.rebirthSkills)) {
      return (
        <div className="p-4 relative">
          <div className="mb-6 text-center">
            <h3 className="text-lg font-semibold text-red-300">Missing Rebirth System</h3>
            <div className="text-sm text-gray-200 mb-4">
              You need to reach 1,000 pixels to unlock the rebirth system.
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('The rebirth system appears to be missing. Would you like to reset your game to fix this issue?')) {
                  resetGame();
                }
              }}
              className="bg-red-700/50 hover:bg-red-700/70 transition-colors px-4 py-2 rounded-md text-xs font-semibold"
            >
              Reset Game to Fix
            </button>
          </div>
        </div>
      );
    }
    
    try {
      const connections = getSkillConnections();
      const rebirthEffects = getRebirthEffects();
      
      return (
        <div className="relative">
          {/* Sticky Header with Rebirth Points and Basic Info */}
          <div className="sticky top-0 bg-gray-900/95 p-2 z-20 backdrop-blur-sm mb-4 border-b border-violet-900/30">
            <h3 className="text-lg font-semibold text-violet-300">Rebirth System</h3>
            <div className="text-sm text-violet-200">
              <span className="font-bold text-violet-100">{gameState.rebirthPoints}</span> rebirth points
            </div>
            <div className="text-xs text-violet-300/70">
              Rebirth Count: {gameState.rebirthCount}
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="px-4 pb-4">
            {gameState.pixels >= 1000 && (
              <div className="bg-violet-900/30 p-3 rounded-md border border-violet-800/50 mb-6">
                <div className="text-sm mb-1">You will gain <span className="font-bold text-violet-100">{calculateRebirthGain()}</span> rebirth points</div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to rebirth? You will lose all your pixels and upgrades, but gain permanent bonuses!')) {
                      performRebirth();
                    }
                  }}
                  className="bg-violet-700/50 hover:bg-violet-700/70 transition-colors px-4 py-2 rounded-md text-xs font-semibold w-full"
                >
                  Rebirth Now
                </button>
              </div>
            )}
            
            {/* Active Effects */}
            <div className="text-xs text-left bg-black/30 p-2 rounded-md mb-6">
              <div className="font-semibold text-violet-200 mb-1">Active Bonuses:</div>
              <div className="grid grid-cols-1 gap-1">
                <div>Click Power: x{rebirthEffects.clickMultiplier.toFixed(2)}</div>
                <div>Auto Clicker Efficiency: x{rebirthEffects.autoClickerEfficiency.toFixed(2)}</div>
                <div>Starting Pixels: {rebirthEffects.startingPixels.toLocaleString()}</div>
                <div>Upgrade Cost Reduction: {(rebirthEffects.upgradeCostReduction * 100).toFixed(0)}%</div>
                <div>Auto Clicker Cost Reduction: {(rebirthEffects.autoClickerCostReduction * 100).toFixed(0)}%</div>
              </div>
            </div>
            
            {/* Skill Tree */}
            <div className="relative">
              {/* Tier 1 - Basic Skills */}
              <div className="flex justify-around mb-16">
                {gameState.rebirthSkills.slice(0, 3).map(skill => (
                  <div key={skill.id} className="relative z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        buyRebirthSkill(skill.id);
                      }}
                      disabled={!isSkillAvailable(skill.id) || gameState.rebirthPoints < skill.cost}
                      className={`skill-node w-16 h-16 rounded-full flex items-center justify-center relative ${
                        skill.level >= skill.maxLevel
                          ? 'bg-violet-700 border-2 border-violet-300'
                          : skill.level > 0
                          ? 'bg-violet-900/70 border border-violet-600'
                          : gameState.rebirthPoints >= skill.cost
                          ? 'bg-violet-900/40 border border-violet-800/70 hover:bg-violet-900/60'
                          : 'bg-gray-900/40 border border-gray-800/60 opacity-60'
                      }`}
                    >
                      <div className="absolute -top-7 whitespace-nowrap text-xs font-medium">
                        {skill.name}
                      </div>
                      <div className="text-sm font-bold">{skill.level}/{skill.maxLevel}</div>
                      {skill.level < skill.maxLevel && (
                        <div className="absolute -bottom-6 text-xs">
                          Cost: {skill.cost}
                        </div>
                      )}
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Tier 2 - Advanced Skills */}
              <div className="flex justify-around mb-16">
                {gameState.rebirthSkills.slice(3, 5).map(skill => (
                  <div key={skill.id} className="relative z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        buyRebirthSkill(skill.id);
                      }}
                      disabled={!isSkillAvailable(skill.id) || gameState.rebirthPoints < skill.cost}
                      className={`skill-node w-16 h-16 rounded-full flex items-center justify-center relative ${
                        skill.level >= skill.maxLevel
                          ? 'bg-violet-700 border-2 border-violet-300'
                          : skill.level > 0
                          ? 'bg-violet-900/70 border border-violet-600'
                          : gameState.rebirthPoints >= skill.cost && isSkillAvailable(skill.id)
                          ? 'bg-violet-900/40 border border-violet-800/70 hover:bg-violet-900/60'
                          : 'bg-gray-900/40 border border-gray-800/60 opacity-60'
                      }`}
                    >
                      <div className="absolute -top-7 whitespace-nowrap text-xs font-medium">
                        {skill.name}
                      </div>
                      <div className="text-sm font-bold">{skill.level}/{skill.maxLevel}</div>
                      {skill.level < skill.maxLevel && (
                        <div className="absolute -bottom-6 text-xs">
                          Cost: {skill.cost}
                        </div>
                      )}
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Tier 3 - Expert Skills */}
              <div className="flex justify-around mb-16">
                {gameState.rebirthSkills.slice(5, 7).map(skill => (
                  <div key={skill.id} className="relative z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        buyRebirthSkill(skill.id);
                      }}
                      disabled={!isSkillAvailable(skill.id) || gameState.rebirthPoints < skill.cost}
                      className={`skill-node w-16 h-16 rounded-full flex items-center justify-center relative ${
                        skill.level >= skill.maxLevel
                          ? 'bg-violet-700 border-2 border-violet-300'
                          : skill.level > 0
                          ? 'bg-violet-900/70 border border-violet-600'
                          : gameState.rebirthPoints >= skill.cost && isSkillAvailable(skill.id)
                          ? 'bg-violet-900/40 border border-violet-800/70 hover:bg-violet-900/60'
                          : 'bg-gray-900/40 border border-gray-800/60 opacity-60'
                      }`}
                    >
                      <div className="absolute -top-7 whitespace-nowrap text-xs font-medium">
                        {skill.name}
                      </div>
                      <div className="text-sm font-bold">{skill.level}/{skill.maxLevel}</div>
                      {skill.level < skill.maxLevel && (
                        <div className="absolute -bottom-6 text-xs">
                          Cost: {skill.cost}
                        </div>
                      )}
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Tier 4 - Master Skill */}
              <div className="flex justify-center">
                {gameState.rebirthSkills.slice(7, 8).map(skill => (
                  <div key={skill.id} className="relative z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        buyRebirthSkill(skill.id);
                      }}
                      disabled={!isSkillAvailable(skill.id) || gameState.rebirthPoints < skill.cost}
                      className={`skill-node w-20 h-20 rounded-full flex items-center justify-center relative ${
                        skill.level >= skill.maxLevel
                          ? 'bg-violet-700 border-4 border-violet-300 shadow-lg shadow-violet-500/20'
                          : skill.level > 0
                          ? 'bg-violet-900/70 border-2 border-violet-600'
                          : gameState.rebirthPoints >= skill.cost && isSkillAvailable(skill.id)
                          ? 'bg-violet-900/40 border border-violet-800/70 hover:bg-violet-900/60'
                          : 'bg-gray-900/40 border border-gray-800/60 opacity-60'
                      }`}
                    >
                      <div className="absolute -top-7 whitespace-nowrap text-xs font-medium">
                        {skill.name}
                      </div>
                      <div className="text-sm font-bold">{skill.level}/{skill.maxLevel}</div>
                      {skill.level < skill.maxLevel && (
                        <div className="absolute -bottom-6 text-xs">
                          Cost: {skill.cost}
                        </div>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Connection lines for skill tree */}
            <svg className="absolute top-0 left-0 w-full h-full z-0 skill-connections">
              {connections.map((connection, index) => {
                // Default positions for skill connections if DOM not ready
                let x1 = connection.from.includes('click') ? "25%" : connection.from.includes('auto') ? "75%" : "50%";
                let y1 = "15%"; 
                let x2 = connection.to.includes('click') ? "25%" : connection.to.includes('auto') ? "75%" : "50%";
                let y2 = connection.to.includes('mastery') ? "40%" : connection.to.includes('empire') ? "40%" : "65%";
                
                // Special case for final skill
                if (connection.to === 'pixel-singularity') {
                  y2 = "80%";
                  x2 = "50%";
                }
                
                return (
                  <line 
                    key={`connection-${index}`}
                    x1={x1} 
                    y1={y1} 
                    x2={x2} 
                    y2={y2}
                    stroke={
                      gameState.rebirthSkills.find(s => s.id === connection.from)?.level! > 0 &&
                      gameState.rebirthSkills.find(s => s.id === connection.to)?.level! > 0
                        ? "#8b5cf6" // Bright violet for active connections
                        : "rgba(139, 92, 246, 0.3)" // Dim violet for inactive
                    }
                    strokeWidth={
                      gameState.rebirthSkills.find(s => s.id === connection.from)?.level! > 0 &&
                      gameState.rebirthSkills.find(s => s.id === connection.to)?.level! > 0
                        ? "3" // Thicker for active connections
                        : "1" // Thinner for inactive
                    }
                  />
                );
              })}
            </svg>
          </div>
        </div>
      );
    } catch (error) {
      console.error("Error rendering skill tree:", error);
      return (
        <div className="p-4 relative">
          <div className="mb-6 text-center">
            <h3 className="text-lg font-semibold text-red-300">Error Loading Rebirth System</h3>
            <div className="text-sm text-gray-200 mb-4">
              There was an error loading the rebirth system. Please try resetting your game.
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetGame();
              }}
              className="bg-red-700/50 hover:bg-red-700/70 transition-colors px-4 py-2 rounded-md text-xs font-semibold"
            >
              Reset Game
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black text-white overflow-hidden"
      onClick={handleClick}
    >
      {/* Always render both loading and main content to preserve hook order */}
      <div style={{ display: isClient ? 'none' : 'flex' }} className="min-h-screen bg-black flex items-center justify-center text-white">
        Loading...
      </div>
      <div style={{ display: isClient ? 'block' : 'none' }}>
        {/* Main game area */}
        <div className="relative min-h-screen overflow-hidden">
          {pixelPileRendering}
          
          {/* Floating title */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
            <h1 className="text-xl font-mono text-center">Pixel City</h1>
            <p className="text-xs text-gray-400 text-center">
              Click anywhere to generate pixels
            </p>
          </div>

          {/* Quick access rebirth button (shown after 1000 pixels) */}
          {gameState.pixels >= 1000 && (
            <div 
              className="absolute top-4 right-4 z-10 bg-violet-900/50 rounded-md px-3 py-1 cursor-pointer hover:bg-violet-900/70 transition-colors border border-violet-800/50"
              onClick={(e) => {
                e.stopPropagation();
                setPanelStates(prev => ({
                  ...prev,
                  rebirth: {
                    ...prev.rebirth,
                    minimized: false
                  }
                }));
              }}
            >
              <div className="text-xs font-semibold text-violet-200">Rebirth</div>
              <div className="text-xs text-violet-300/80">+{calculateRebirthGain()} points</div>
            </div>
          )}
          
          {/* Stats Panel */}
          <Draggable 
            id="stats" 
            minimized={panelStates.stats.minimized}
            onMinimize={() => toggleMinimize('stats')}
          >
            <div className="p-3">
              <div className="flex flex-col gap-1">
                <h2 className="text-md font-mono">{Math.floor(gameState.pixels)} pixels</h2>
                <p className="text-xs text-gray-400">
                  {pixelsPerSecond.toLocaleString()} pixels/sec
                </p>
                <p className="text-xs text-gray-400">Click Power: {gameState.clickPower.toLocaleString()}</p>
                <p className="text-xs text-gray-400">Lifetime Pixels: {gameState.lifetimePixels.toLocaleString()}</p>
                {gameState.rebirthCount > 0 && (
                  <p className="text-xs text-violet-400">Rebirths: {gameState.rebirthCount}</p>
                )}
              </div>
            </div>
          </Draggable>
          
          {/* Upgrades Panel with Sub-tabs */}
          <Draggable 
            id="upgrades" 
            minimized={panelStates.upgrades.minimized}
            onMinimize={() => toggleMinimize('upgrades')}
          >
            <div className="p-3 max-w-96">
              {/* Sub-tabs navigation */}
              <div className="flex space-x-1 mb-2 border-b border-gray-700 pb-1">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveUpgradeTab('upgrades');
                  }}
                  className={`px-3 py-1 text-xs rounded-t-md transition-colors ${
                    activeUpgradeTab === 'upgrades' 
                      ? 'bg-blue-900/50 text-blue-300 font-semibold' 
                      : 'bg-gray-800/30 text-gray-400 hover:bg-gray-800/50'
                  }`}
                >
                  Upgrades
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveUpgradeTab('autoClickers');
                  }}
                  className={`px-3 py-1 text-xs rounded-t-md transition-colors ${
                    activeUpgradeTab === 'autoClickers' 
                      ? 'bg-purple-900/50 text-purple-300 font-semibold' 
                      : 'bg-gray-800/30 text-gray-400 hover:bg-gray-800/50'
                  }`}
                >
                  Auto Clickers
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveUpgradeTab('rebirth');
                  }}
                  className={`px-3 py-1 text-xs rounded-t-md transition-colors ${
                    activeUpgradeTab === 'rebirth' 
                      ? 'bg-violet-900/50 text-violet-300 font-semibold' 
                      : 'bg-gray-800/30 text-gray-400 hover:bg-gray-800/50'
                  }`}
                >
                  Rebirth
                </button>
              </div>
              
              {/* Content based on active tab */}
              <div className="max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
                {/* Upgrades content */}
                {activeUpgradeTab === 'upgrades' && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-blue-300 mb-2 sticky top-0 bg-gray-900/90 py-1 z-10">Upgrades</h3>
                    {gameState.upgrades.map(upgrade => (
                      <button
                        key={upgrade.id}
                        onClick={(e: ReactMouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation();
                          buyUpgrade(upgrade.id);
                        }}
                        disabled={upgrade.purchased || gameState.pixels < upgrade.cost}
                        className={`w-full p-2 rounded text-left text-xs border ${
                          upgrade.purchased
                            ? 'bg-green-900/20 border-green-800/30 text-green-400'
                            : gameState.pixels >= upgrade.cost
                            ? 'bg-blue-900/20 border-blue-800/30 text-blue-300 hover:bg-blue-900/40'
                            : 'bg-gray-900/30 border-gray-800/30 text-gray-500 cursor-not-allowed'
                        } transition-colors duration-200`}
                      >
                        <div className="font-semibold flex justify-between">
                          <span>{upgrade.name}</span>
                          <span>{upgrade.purchased ? 'Purchased' : `${upgrade.cost.toLocaleString()} pixels`}</span>
                        </div>
                        <div className="text-xs opacity-80">{upgrade.description}</div>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Auto Clickers content */}
                {activeUpgradeTab === 'autoClickers' && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-purple-300 mb-2 sticky top-0 bg-gray-900/90 py-1 z-10">Auto Clickers</h3>
                    {gameState.autoClickers.map(clicker => (
                      <button
                        key={clicker.id}
                        onClick={(e: ReactMouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation();
                          buyAutoClicker(clicker.id);
                        }}
                        disabled={gameState.pixels < clicker.cost}
                        className={`w-full p-2 rounded text-left text-xs border ${
                          gameState.pixels >= clicker.cost
                            ? 'bg-purple-900/20 border-purple-800/30 text-purple-300 hover:bg-purple-900/40'
                            : 'bg-gray-900/30 border-gray-800/30 text-gray-500 cursor-not-allowed'
                        } transition-colors duration-200`}
                      >
                        <div className="font-semibold flex justify-between">
                          <span>
                            {clicker.name} ({clicker.count || 0})
                          </span>
                          <span>{clicker.cost.toLocaleString()} pixels</span>
                        </div>
                        <div className="text-xs opacity-80">
                          +{clicker.pixelsPerSecond.toFixed(1)} pixels/sec
                          {clicker.count > 0 && ` (Total: ${(clicker.pixelsPerSecond * clicker.count).toFixed(1)} pixels/sec)`}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Rebirth content */}
                {activeUpgradeTab === 'rebirth' && renderSkillTree()}
              </div>
            </div>
          </Draggable>
          
          {/* Settings Panel */}
          <Draggable 
            id="settings" 
            minimized={panelStates.settings.minimized}
            onMinimize={() => toggleMinimize('settings')}
          >
            <div className="p-3 max-w-72">
              <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1" onMouseDown={(e) => e.stopPropagation()}>
                <h3 className="text-sm font-semibold text-gray-300 mb-2 sticky top-0 bg-gray-900/90 py-1 z-10">Settings</h3>
                {/* Pixel Size Setting */}
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Pixel Size</label>
                  <input 
                    type="range" 
                    min="2" 
                    max="12" 
                    value={settings.pixelSize} 
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSettings({...settings, pixelSize: parseInt(e.target.value)})}
                    className="w-full h-2 rounded-lg appearance-none bg-gray-700 outline-none" 
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Small</span>
                    <span>Large</span>
                  </div>
                </div>
                
                {/* Color Scheme Setting */}
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Color Scheme</label>
                  <select 
                    value={settings.colorScheme} 
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => 
                      setSettings({...settings, colorScheme: e.target.value as ColorScheme})}
                    onMouseDown={(e: ReactMouseEvent<HTMLSelectElement>) => e.stopPropagation()}
                    className="w-full p-1 bg-gray-900 border border-gray-700 rounded text-xs"
                  >
                    <option value="rainbow">Rainbow</option>
                    <option value="monochrome">Monochrome</option>
                    <option value="blues">Blues</option>
                    <option value="greens">Greens</option>
                  </select>
                </div>
                
                {/* Animation Speed Setting */}
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Animation Speed</label>
                  <select 
                    value={settings.animationSpeed} 
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => 
                      setSettings({...settings, animationSpeed: e.target.value as AnimationSpeed})}
                    onMouseDown={(e: ReactMouseEvent<HTMLSelectElement>) => e.stopPropagation()}
                    className="w-full p-1 bg-gray-900 border border-gray-700 rounded text-xs"
                  >
                    <option value="slow">Slow</option>
                    <option value="normal">Normal</option>
                    <option value="fast">Fast</option>
                  </select>
                </div>
                
                {/* Reset Button */}
                <button
                  onClick={(e: ReactMouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to reset your progress?')) {
                      resetGame();
                    }
                  }}
                  className="w-full p-2 bg-red-900/20 border border-red-800/30 text-red-400 hover:bg-red-900/40 rounded text-xs font-mono mt-2"
                >
                  Reset Game
                </button>
              </div>
            </div>
          </Draggable>
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
    </div>
  );
}