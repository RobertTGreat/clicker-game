import { useState, useEffect } from 'react';

// Define types for our game
export interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  multiplier: number;
  purchased: boolean;
}

export interface AutoClicker {
  id: string;
  name: string;
  description: string;
  cost: number;
  pixelsPerSecond: number;
  count: number;
}

// New Rebirth skill tree system
export interface RebirthSkill {
  id: string;
  name: string;
  description: string;
  cost: number; // Cost in rebirth points
  effect: {
    type: 'clickMultiplier' | 'autoClickerEfficiency' | 'startingPixels' | 'upgradeCostReduction' | 'autoClickerCostReduction';
    value: number;
  };
  maxLevel: number;
  level: number;
  requires?: string[]; // IDs of skills required before this one can be purchased
}

export interface GameState {
  pixels: number;
  clickPower: number;
  upgrades: Upgrade[];
  autoClickers: AutoClicker[];
  lastSaved: number;
  societyLevel: number;
  // Rebirth system properties
  rebirthPoints: number;
  rebirthCount: number;
  rebirthSkills: RebirthSkill[];
  lifetimePixels: number;
}

// Define rebirth skill tree
const initialRebirthSkills: RebirthSkill[] = [
  // Tier 1 - Basic skills (no requirements)
  {
    id: 'click-power',
    name: 'Enhanced Clicking',
    description: 'Increase base click power by 1 per level',
    cost: 1,
    effect: {
      type: 'clickMultiplier',
      value: 1
    },
    maxLevel: 10,
    level: 0
  },
  {
    id: 'auto-efficiency',
    name: 'Automation Mastery',
    description: 'Auto clickers produce 10% more pixels per level',
    cost: 1,
    effect: {
      type: 'autoClickerEfficiency',
      value: 0.1
    },
    maxLevel: 10,
    level: 0
  },
  {
    id: 'starting-pixels',
    name: 'Pixel Cache',
    description: 'Start with 1000 pixels per level after rebirth',
    cost: 1,
    effect: {
      type: 'startingPixels',
      value: 1000
    },
    maxLevel: 10,
    level: 0
  },
  
  // Tier 2 - Advanced skills (require some basic skills)
  {
    id: 'upgrade-discount',
    name: 'Bargain Hunter',
    description: 'Reduce upgrade costs by 5% per level',
    cost: 3,
    effect: {
      type: 'upgradeCostReduction',
      value: 0.05
    },
    maxLevel: 5,
    level: 0,
    requires: ['click-power']
  },
  {
    id: 'autoclicker-discount',
    name: 'Mass Production',
    description: 'Reduce auto clicker costs by 5% per level',
    cost: 3,
    effect: {
      type: 'autoClickerCostReduction',
      value: 0.05
    },
    maxLevel: 5,
    level: 0,
    requires: ['auto-efficiency']
  },
  
  // Tier 3 - Expert skills (require multiple prerequisites)
  {
    id: 'click-mastery',
    name: 'Click Mastery',
    description: 'Multiply click power by 2x per level',
    cost: 5,
    effect: {
      type: 'clickMultiplier',
      value: 2
    },
    maxLevel: 3,
    level: 0,
    requires: ['click-power', 'upgrade-discount']
  },
  {
    id: 'automation-empire',
    name: 'Automation Empire',
    description: 'Multiply auto clicker production by 2x per level',
    cost: 5,
    effect: {
      type: 'autoClickerEfficiency',
      value: 1
    },
    maxLevel: 3,
    level: 0,
    requires: ['auto-efficiency', 'autoclicker-discount']
  },
  
  // Tier 4 - Master skill (requires significant investment)
  {
    id: 'pixel-singularity',
    name: 'Pixel Singularity',
    description: 'All production multiplied by 10x',
    cost: 25,
    effect: {
      type: 'clickMultiplier',
      value: 10
    },
    maxLevel: 1,
    level: 0,
    requires: ['click-mastery', 'automation-empire']
  }
];

// Define themed upgrade categories for initial game state
const pixelGenerationUpgrades = [
  {
    id: 'basic-upgrade',
    name: 'Basic Upgrade',
    description: 'Double your click power',
    cost: 50,
    multiplier: 2,
    purchased: false,
  },
  {
    id: 'advanced-upgrade',
    name: 'Advanced Upgrade',
    description: 'Triple your click power',
    cost: 200,
    multiplier: 3,
    purchased: false,
  },
  {
    id: 'premium-upgrade',
    name: 'Premium Upgrade',
    description: '5x your click power',
    cost: 1000,
    multiplier: 5,
    purchased: false,
  },
  // New upgrades - Digital Age theme
  {
    id: 'elite-upgrade',
    name: 'Elite Upgrade',
    description: '10x your click power',
    cost: 5000,
    multiplier: 10,
    purchased: false,
  },
  {
    id: 'quantum-upgrade',
    name: 'Quantum Upgrade',
    description: '25x your click power',
    cost: 20000,
    multiplier: 25,
    purchased: false,
  }
];

const aiRevolutionUpgrades = [
  {
    id: 'neural-upgrade',
    name: 'Neural Network',
    description: '50x your click power with AI assistance',
    cost: 100000,
    multiplier: 50, 
    purchased: false,
  },
  {
    id: 'deep-learning',
    name: 'Deep Learning',
    description: '75x your click power with advanced pattern recognition',
    cost: 250000,
    multiplier: 75,
    purchased: false,
  },
  {
    id: 'ai-sentience',
    name: 'AI Sentience',
    description: '150x your click power with self-aware algorithms',
    cost: 750000,
    multiplier: 150,
    purchased: false,
  }
];

const multiversalTechUpgrades = [
  {
    id: 'dimensional-upgrade',
    name: 'Dimensional Shift',
    description: '200x your click power by accessing parallel universes',
    cost: 3000000,
    multiplier: 200,
    purchased: false,
  },
  {
    id: 'multiverse-harvester',
    name: 'Multiverse Harvester',
    description: '500x your click power by harvesting resources across realities',
    cost: 10000000,
    multiplier: 500,
    purchased: false,
  },
  {
    id: 'quantum-entanglement',
    name: 'Quantum Entanglement',
    description: '750x your click power by linking all possible outcomes',
    cost: 50000000,
    multiplier: 750,
    purchased: false,
  }
];

const cosmicAscensionUpgrades = [
  {
    id: 'cosmic-upgrade',
    name: 'Cosmic Consciousness',
    description: '1000x your click power with universal awareness',
    cost: 200000000,
    multiplier: 1000,
    purchased: false,
  },
  {
    id: 'galactic-hivemind',
    name: 'Galactic Hivemind',
    description: '2500x your click power by connecting to all sentient life',
    cost: 750000000,
    multiplier: 2500,
    purchased: false,
  },
  {
    id: 'universal-singularity',
    name: 'Universal Singularity',
    description: '5000x your click power by becoming one with the fabric of reality',
    cost: 3000000000,
    multiplier: 5000,
    purchased: false,
  }
];

// Create themed auto clicker groups
const basicAutoClickers = [
  {
    id: 'auto-clicker-1',
    name: 'Auto Clicker I',
    description: 'Generates 1 pixel per second',
    cost: 100,
    pixelsPerSecond: 1,
    count: 0,
  },
  {
    id: 'auto-clicker-2',
    name: 'Auto Clicker II',
    description: 'Generates 5 pixels per second',
    cost: 500,
    pixelsPerSecond: 5,
    count: 0,
  },
  {
    id: 'auto-clicker-3',
    name: 'Auto Clicker III',
    description: 'Generates 20 pixels per second',
    cost: 3000,
    pixelsPerSecond: 20,
    count: 0,
  }
];

const industrialAutoClickers = [
  {
    id: 'auto-clicker-4',
    name: 'Pixel Factory',
    description: 'Generates 100 pixels per second',
    cost: 15000,
    pixelsPerSecond: 100,
    count: 0,
  },
  {
    id: 'pixel-assembly-line',
    name: 'Pixel Assembly Line',
    description: 'Generates 250 pixels per second',
    cost: 40000,
    pixelsPerSecond: 250,
    count: 0,
  },
  {
    id: 'auto-clicker-5',
    name: 'Pixel Reactor',
    description: 'Generates 500 pixels per second',
    cost: 100000,
    pixelsPerSecond: 500,
    count: 0,
  }
];

const futuristicAutoClickers = [
  {
    id: 'nanobot-swarm',
    name: 'Nanobot Swarm',
    description: 'Generates 1,200 pixels per second',
    cost: 250000,
    pixelsPerSecond: 1200,
    count: 0,
  },
  {
    id: 'auto-clicker-6',
    name: 'Quantum Generator',
    description: 'Generates 2,500 pixels per second',
    cost: 750000,
    pixelsPerSecond: 2500,
    count: 0,
  },
  {
    id: 'temporal-duplicator',
    name: 'Temporal Duplicator',
    description: 'Generates 5,000 pixels per second',
    cost: 2000000,
    pixelsPerSecond: 5000,
    count: 0,
  }
];

const cosmicAutoClickers = [
  {
    id: 'auto-clicker-7',
    name: 'Cosmic Harvester',
    description: 'Generates 10,000 pixels per second',
    cost: 5000000,
    pixelsPerSecond: 10000,
    count: 0,
  },
  {
    id: 'nebula-extractor',
    name: 'Nebula Extractor',
    description: 'Generates 25,000 pixels per second',
    cost: 20000000,
    pixelsPerSecond: 25000,
    count: 0,
  },
  {
    id: 'black-hole-compressor',
    name: 'Black Hole Compressor',
    description: 'Generates 100,000 pixels per second',
    cost: 100000000,
    pixelsPerSecond: 100000,
    count: 0,
  }
];

// Combine all upgrades and auto clickers
const allUpgrades = [
  ...pixelGenerationUpgrades,
  ...aiRevolutionUpgrades,
  ...multiversalTechUpgrades,
  ...cosmicAscensionUpgrades
];

const allAutoClickers = [
  ...basicAutoClickers,
  ...industrialAutoClickers,
  ...futuristicAutoClickers,
  ...cosmicAutoClickers
];

// Initial game state
const initialGameState: GameState = {
  pixels: 0,
  clickPower: 1,
  societyLevel: 1,
  lastSaved: Date.now(),
  upgrades: allUpgrades,
  autoClickers: allAutoClickers,
  // Rebirth system initialization
  rebirthPoints: 0,
  rebirthCount: 0,
  rebirthSkills: initialRebirthSkills,
  lifetimePixels: 0
};

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [loaded, setLoaded] = useState(false);

  // Load game state from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('minimalPixelCity');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        
        // Ensure the saved state has all the required properties
        // by merging it with initialGameState for any missing properties
        const mergedState = {
          ...initialGameState,
          ...parsedState,
          // Make sure rebirth properties exist
          rebirthPoints: parsedState.rebirthPoints || 0,
          rebirthCount: parsedState.rebirthCount || 0,
          rebirthSkills: parsedState.rebirthSkills || initialRebirthSkills,
          lifetimePixels: parsedState.lifetimePixels || parsedState.pixels || 0
        };
        
        setGameState(mergedState);
      } catch (e) {
        console.error('Failed to parse saved game state:', e);
        // Use the initial state if parsing fails
        setGameState(initialGameState);
      }
    }
    setLoaded(true);
  }, []);

  // Save game state to localStorage when it changes
  useEffect(() => {
    if (loaded) {
      localStorage.setItem('minimalPixelCity', JSON.stringify({
        ...gameState,
        lastSaved: Date.now()
      }));
    }
  }, [gameState, loaded]);

  // Calculate total effects from rebirth skills
  const getRebirthEffects = () => {
    const effects = {
      clickMultiplier: 1,
      autoClickerEfficiency: 1,
      startingPixels: 0,
      upgradeCostReduction: 0,
      autoClickerCostReduction: 0
    };
    
    // Safely check if rebirthSkills exists before using forEach
    if (gameState.rebirthSkills && Array.isArray(gameState.rebirthSkills)) {
      gameState.rebirthSkills.forEach(skill => {
        if (skill.level > 0) {
          switch (skill.effect.type) {
            case 'clickMultiplier':
              if (skill.id === 'click-power') {
                // This is an additive bonus to base click power
                effects.clickMultiplier += skill.effect.value * skill.level;
              } else {
                // This is a multiplicative bonus
                effects.clickMultiplier *= 1 + (skill.effect.value * skill.level);
              }
              break;
            case 'autoClickerEfficiency':
              effects.autoClickerEfficiency += skill.effect.value * skill.level;
              break;
            case 'startingPixels':
              effects.startingPixels += skill.effect.value * skill.level;
              break;
            case 'upgradeCostReduction':
              effects.upgradeCostReduction += skill.effect.value * skill.level;
              break;
            case 'autoClickerCostReduction':
              effects.autoClickerCostReduction += skill.effect.value * skill.level;
              break;
          }
        }
      });
    }
    
    return effects;
  };

  // Handle auto clickers
  useEffect(() => {
    if (!loaded) return;

    const interval = setInterval(() => {
      setGameState(prevState => {
        // Get rebirth bonuses
        const rebirthEffects = getRebirthEffects();
        
        // Calculate pixels generated by auto clickers with rebirth bonuses
        const pixelsPerSecond = prevState.autoClickers.reduce(
          (total, clicker) => total + (clicker.pixelsPerSecond * clicker.count),
          0
        ) * rebirthEffects.autoClickerEfficiency;
        
        // Calculate new total pixels
        const newPixels = prevState.pixels + pixelsPerSecond;
        const newLifetimePixels = prevState.lifetimePixels + pixelsPerSecond;
        
        // Calculate new society level (every 1000 pixels)
        const newSocietyLevel = Math.max(
          prevState.societyLevel,
          Math.floor(newPixels / 1000) + 1
        );
        
        return {
          ...prevState,
          pixels: newPixels,
          societyLevel: newSocietyLevel,
          lifetimePixels: newLifetimePixels
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loaded]);

  // Click handler
  const handleClick = () => {
    setGameState(prevState => {
      // Apply rebirth bonuses to click power
      const rebirthEffects = getRebirthEffects();
      const boostedClickPower = prevState.clickPower * rebirthEffects.clickMultiplier;
      
      const newPixels = prevState.pixels + boostedClickPower;
      const newLifetimePixels = prevState.lifetimePixels + boostedClickPower;
      const newSocietyLevel = Math.max(
        prevState.societyLevel,
        Math.floor(newPixels / 1000) + 1
      );
      
      return {
        ...prevState,
        pixels: newPixels,
        lifetimePixels: newLifetimePixels,
        societyLevel: newSocietyLevel
      };
    });
  };

  // Buy upgrade
  const buyUpgrade = (upgradeId: string) => {
    setGameState(prevState => {
      const upgrade = prevState.upgrades.find(u => u.id === upgradeId);
      if (!upgrade || upgrade.purchased) {
        return prevState;
      }
      
      // Apply rebirth cost reduction if any
      const rebirthEffects = getRebirthEffects();
      const discountedCost = upgrade.cost * (1 - rebirthEffects.upgradeCostReduction);
      
      if (prevState.pixels < discountedCost) {
        return prevState;
      }

      return {
        ...prevState,
        pixels: prevState.pixels - discountedCost,
        clickPower: prevState.clickPower * upgrade.multiplier,
        upgrades: prevState.upgrades.map(u => 
          u.id === upgradeId ? { ...u, purchased: true } : u
        )
      };
    });
  };

  // Buy auto clicker
  const buyAutoClicker = (clickerId: string) => {
    setGameState(prevState => {
      const clicker = prevState.autoClickers.find(c => c.id === clickerId);
      if (!clicker) {
        return prevState;
      }
      
      // Apply rebirth cost reduction if any
      const rebirthEffects = getRebirthEffects();
      const discountedCost = clicker.cost * (1 - rebirthEffects.autoClickerCostReduction);
      
      if (prevState.pixels < discountedCost) {
        return prevState;
      }

      const newCost = Math.floor(clicker.cost * 1.5);
      
      return {
        ...prevState,
        pixels: prevState.pixels - discountedCost,
        autoClickers: prevState.autoClickers.map(c => 
          c.id === clickerId 
            ? { 
                ...c, 
                count: c.count + 1, 
                cost: newCost 
              } 
            : c
        )
      };
    });
  };

  // Calculate pixels per second
  const getPixelsPerSecond = () => {
    const baseRate = gameState.autoClickers.reduce(
      (total, clicker) => total + (clicker.pixelsPerSecond * clicker.count),
      0
    );
    
    // Apply rebirth efficiency bonus
    const rebirthEffects = getRebirthEffects();
    return baseRate * rebirthEffects.autoClickerEfficiency;
  };

  // Reset game
  const resetGame = () => {
    setGameState(initialGameState);
  };

  // Perform rebirth
  const performRebirth = () => {
    // Calculate rebirth points based on current progress
    // Formula: log10(pixels) rounded down
    const rebirth_points = Math.max(1, Math.floor(Math.log10(gameState.pixels)));
    
    setGameState(prevState => {
      // Apply rebirth bonuses to calculate starting pixels
      const rebirthEffects = getRebirthEffects();
      
      // Make sure rebirthSkills exists
      const currentRebirthSkills = prevState.rebirthSkills || initialRebirthSkills;
      
      return {
        ...initialGameState,
        pixels: rebirthEffects.startingPixels,
        rebirthPoints: prevState.rebirthPoints + rebirth_points,
        rebirthCount: prevState.rebirthCount + 1,
        rebirthSkills: currentRebirthSkills,
        lifetimePixels: prevState.lifetimePixels
      };
    });
  };

  // Buy rebirth skill
  const buyRebirthSkill = (skillId: string) => {
    // Early return if rebirthSkills is not initialized
    if (!gameState.rebirthSkills || !Array.isArray(gameState.rebirthSkills)) {
      console.error("Rebirth skills not properly initialized");
      return;
    }
    
    setGameState(prevState => {
      if (!prevState.rebirthSkills || !Array.isArray(prevState.rebirthSkills)) {
        // Initialize from scratch if missing
        return {
          ...prevState,
          rebirthSkills: initialRebirthSkills
        };
      }
      
      const skill = prevState.rebirthSkills.find(s => s.id === skillId);
      
      if (!skill || skill.level >= skill.maxLevel || prevState.rebirthPoints < skill.cost) {
        return prevState;
      }
      
      // Check if prerequisites are met
      if (skill.requires) {
        const prerequisites = prevState.rebirthSkills.filter(s => 
          skill.requires?.includes(s.id)
        );
        
        if (prerequisites.some(p => p.level === 0)) {
          // Not all prerequisites have been purchased
          return prevState;
        }
      }
      
      return {
        ...prevState,
        rebirthPoints: prevState.rebirthPoints - skill.cost,
        rebirthSkills: prevState.rebirthSkills.map(s =>
          s.id === skillId ? { ...s, level: s.level + 1 } : s
        )
      };
    });
  };

  return {
    gameState,
    handleClick,
    buyUpgrade,
    buyAutoClicker,
    getPixelsPerSecond,
    resetGame,
    performRebirth,
    buyRebirthSkill,
    getRebirthEffects
  };
}