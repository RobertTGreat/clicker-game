import { useState, useEffect } from 'react';

// Define types for our game
export interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  multiplier: number;
  purchased: boolean;
  autoBoost?: number; // Optional property for upgrades that boost auto clickers
}

// Define a special effect type for prestige upgrades
export type SpecialEffectType = 'criticalClicks' | 'autoClickSpeed' | 'comboMultiplier' | 'passiveIncome' | 'rebirth';

// Extend the Upgrade interface for special prestige upgrades
export interface PrestigeUpgrade extends Upgrade {
  specialEffect?: {
    type: SpecialEffectType;
    value: number;
  };
  requiresRebirth?: number; // Minimum rebirth level to unlock
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
  totalClicks: number;
  // Special effects from prestige upgrades
  specialEffects: {
    criticalClickChance: number;
    autoClickSpeedBoost: number;
    comboMultiplier: number;
    currentCombo: number;
    passiveIncomeRate: number;
    rebirthBonus: number;
  }
}

// Define rebirth skill tree
const initialRebirthSkills: RebirthSkill[] = [
  // Tier 1 - Basic skills (no requirements)
  {
    id: 'click-power',
    name: 'Enhanced Clicking',
    description: 'Increase base click power by 1 per level',
    cost: 3,
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
    cost: 3,
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
    cost: 3,
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
    cost: 8,
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
    cost: 8,
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
    cost: 15,
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
    cost: 15,
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
    cost: 50,
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
    description: 'Increase your click power by 50%',
    cost: 200,
    multiplier: 1.4,
    purchased: false,
  },
  {
    id: 'advanced-upgrade',
    name: 'Advanced Upgrade',
    description: 'Double your click power',
    cost: 1600,
    multiplier: 1.8,
    purchased: false,
  },
  {
    id: 'premium-upgrade',
    name: 'Premium Upgrade',
    description: 'Increase your click power by 150%',
    cost: 18000,
    multiplier: 2.2,
    purchased: false,
  },
  // New upgrades - Digital Age theme
  {
    id: 'elite-upgrade',
    name: 'Elite Upgrade',
    description: 'Triple your click power',
    cost: 200000,
    multiplier: 2.6,
    purchased: false,
  },
  {
    id: 'quantum-upgrade',
    name: 'Quantum Upgrade',
    description: 'Quadruple your click power',
    cost: 2100000,
    multiplier: 3.2,
    purchased: false,
  },
  {
    id: 'pixel-synergy',
    name: 'Pixel Synergy',
    description: '5x your click power and 20% more pixels from auto clickers',
    cost: 12000000,
    multiplier: 3.8,
    autoBoost: 0.15,
    purchased: false,
  }
];

const aiRevolutionUpgrades = [
  {
    id: 'neural-upgrade',
    name: 'Neural Network',
    description: '7x your click power with AI assistance',
    cost: 80000000,
    multiplier: 6.5, 
    purchased: false,
  },
  {
    id: 'deep-learning',
    name: 'Deep Learning',
    description: '10x your click power with advanced pattern recognition',
    cost: 600000000,
    multiplier: 9,
    purchased: false,
  },
  {
    id: 'ai-sentience',
    name: 'AI Sentience',
    description: '15x your click power with self-aware algorithms',
    cost: 2500000000,
    multiplier: 15,
    purchased: false,
  },
  {
    id: 'distributed-computing',
    name: 'Distributed Computing',
    description: '8x your click power and 30% more pixels from auto clickers',
    cost: 10000000000,
    multiplier: 8,
    autoBoost: 0.3,
    purchased: false,
  }
];

const multiversalTechUpgrades = [
  {
    id: 'dimensional-upgrade',
    name: 'Dimensional Shift',
    description: '20x your click power by accessing parallel universes',
    cost: 50000000000,
    multiplier: 20,
    purchased: false,
  },
  {
    id: 'multiverse-harvester',
    name: 'Multiverse Harvester',
    description: '25x your click power by harvesting resources across realities',
    cost: 250000000000,
    multiplier: 25,
    purchased: false,
  },
  {
    id: 'quantum-entanglement',
    name: 'Quantum Entanglement',
    description: '35x your click power by linking all possible outcomes',
    cost: 1000000000000,
    multiplier: 35,
    purchased: false,
  },
  {
    id: 'reality-merger',
    name: 'Reality Merger',
    description: '30x your click power and 40% more pixels from auto clickers',
    cost: 5000000000000,
    multiplier: 30,
    autoBoost: 0.4,
    purchased: false,
  }
];

const cosmicAscensionUpgrades = [
  {
    id: 'cosmic-upgrade',
    name: 'Cosmic Consciousness',
    description: '50x your click power with universal awareness',
    cost: 20000000000000,
    multiplier: 50,
    purchased: false,
  },
  {
    id: 'galactic-hivemind',
    name: 'Galactic Hivemind',
    description: '75x your click power by connecting to all sentient life',
    cost: 100000000000000,
    multiplier: 75,
    purchased: false,
  },
  {
    id: 'universal-singularity',
    name: 'Universal Singularity',
    description: '100x your click power by becoming one with the fabric of reality',
    cost: 500000000000000,
    multiplier: 100,
    purchased: false,
  },
  {
    id: 'omnipresent-intelligence',
    name: 'Omnipresent Intelligence',
    description: '85x your click power and 60% more from auto clickers',
    cost: 2000000000000000,
    multiplier: 85,
    autoBoost: 0.6,
    purchased: false,
  }
];

// New upgrade category for even higher progression
const transcendenceUpgrades = [
  {
    id: 'pixel-transcendence',
    name: 'Pixel Transcendence',
    description: '150x your click power as you transcend physical limitations',
    cost: 10000000000000000,
    multiplier: 150,
    purchased: false,
  },
  {
    id: 'reality-architect',
    name: 'Reality Architect',
    description: '250x your click power by rewriting the laws of physics',
    cost: 50000000000000000,
    multiplier: 250,
    purchased: false,
  },
  {
    id: 'cosmic-omnipotence',
    name: 'Cosmic Omnipotence',
    description: '500x your click power with absolute mastery of all existence',
    cost: 200000000000000000,
    multiplier: 500,
    purchased: false,
  },
  {
    id: 'creator-of-worlds',
    name: 'Creator of Worlds',
    description: '400x your click power and double all auto clicker production',
    cost: 1000000000000000000,
    multiplier: 400,
    autoBoost: 1.0,
    purchased: false,
  }
];

// Special prestige upgrades that unlock after rebirths
const prestigeUpgrades: PrestigeUpgrade[] = [
  {
    id: 'critical-pixel',
    name: 'Critical Pixels',
    description: '15x your click power and 10% chance for clicks to be critical (2x pixels)',
    cost: 250000000000,
    multiplier: 12,
    purchased: false,
    specialEffect: {
      type: 'criticalClicks',
      value: 0.1 // 10% chance
    },
    requiresRebirth: 1
  },
  {
    id: 'time-warp',
    name: 'Time Warp',
    description: '20x your click power and auto clickers activate 15% faster',
    cost: 1100000000000,
    multiplier: 18,
    purchased: false,
    specialEffect: {
      type: 'autoClickSpeed',
      value: 0.12 // 12% faster
    },
    requiresRebirth: 2
  },
  {
    id: 'combo-master',
    name: 'Combo Master',
    description: '25x your click power and clicks build up combo multiplier (up to 2x)',
    cost: 5000000000000,
    multiplier: 25,
    purchased: false,
    specialEffect: {
      type: 'comboMultiplier',
      value: 0.01 // Each click adds 1% to combo up to 100% (2x)
    },
    requiresRebirth: 3
  },
  {
    id: 'pixel-generator',
    name: 'Pixel Generator',
    description: '30x your click power and generate 1% of your click power as passive income',
    cost: 20000000000000,
    multiplier: 30,
    purchased: false,
    specialEffect: {
      type: 'passiveIncome',
      value: 0.01 // 1% of click power as passive income
    },
    requiresRebirth: 4
  },
  {
    id: 'rebirth-mastery',
    name: 'Rebirth Mastery',
    description: '40x your click power and +20% more rebirth points when rebirthing',
    cost: 100000000000000,
    multiplier: 40,
    purchased: false,
    specialEffect: {
      type: 'rebirth',
      value: 0.2 // 20% more rebirth points
    },
    requiresRebirth: 5
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
    cost: 750,
    pixelsPerSecond: 5,
    count: 0,
  },
  {
    id: 'auto-clicker-3',
    name: 'Auto Clicker III',
    description: 'Generates 20 pixels per second',
    cost: 5000,
    pixelsPerSecond: 20,
    count: 0,
  }
];

const industrialAutoClickers = [
  {
    id: 'auto-clicker-4',
    name: 'Pixel Factory',
    description: 'Generates 100 pixels per second',
    cost: 30000,
    pixelsPerSecond: 100,
    count: 0,
  },
  {
    id: 'pixel-assembly-line',
    name: 'Pixel Assembly Line',
    description: 'Generates 250 pixels per second',
    cost: 100000,
    pixelsPerSecond: 250,
    count: 0,
  },
  {
    id: 'auto-clicker-5',
    name: 'Pixel Reactor',
    description: 'Generates 500 pixels per second',
    cost: 350000,
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
  ...cosmicAscensionUpgrades,
  ...transcendenceUpgrades,
  ...prestigeUpgrades
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
  lifetimePixels: 0,
  totalClicks: 0,
  // Initialize special effects
  specialEffects: {
    criticalClickChance: 0,
    autoClickSpeedBoost: 0,
    comboMultiplier: 0,
    currentCombo: 0,
    passiveIncomeRate: 0,
    rebirthBonus: 0
  }
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

  // Game update timer for auto clickers
  useEffect(() => {
    if (!loaded) return;
    
    // Only run auto clicker mechanism on client
    const timer = setInterval(() => {
      setGameState(prevState => {
        // Calculate auto-clicker pixels per second
        const rebirthEffects = getRebirthEffects();
        
        // Sum up all auto clicker production with efficiency bonus
        const autoClickerOutput = prevState.autoClickers.reduce((total, clicker) => {
          const baseProduction = clicker.pixelsPerSecond * clicker.count;
          // Apply auto clicker speed boost from special effects
          const speedBoost = 1 + prevState.specialEffects.autoClickSpeedBoost;
          return total + (baseProduction * rebirthEffects.autoClickerEfficiency * speedBoost);
        }, 0);
        
        // Calculate passive income from click power if unlocked
        let passiveIncome = 0;
        if (prevState.specialEffects.passiveIncomeRate > 0) {
          // Generate passive income based on click power
          passiveIncome = prevState.clickPower * prevState.specialEffects.passiveIncomeRate;
        }
        
        // Total production per second
        const totalProduction = autoClickerOutput + passiveIncome;
        
        // Adjust for elapsed time (1 second intervals)
        const pixelGain = totalProduction;
        
        const newPixels = prevState.pixels + pixelGain;
        const newLifetimePixels = prevState.lifetimePixels + pixelGain;
        
        return {
          ...prevState,
          pixels: newPixels,
          lifetimePixels: newLifetimePixels
        };
      });
    }, 1000);
    
    return () => {
      clearInterval(timer);
    };
  }, [loaded]);

  // Handle click
  const handleClick = () => {
    setGameState(prevState => {
      // Calculate society level progress
      const currentSocietyLevel = prevState.societyLevel;
      const newSocietyLevel = Math.floor(Math.log10(Math.max(1, prevState.lifetimePixels)) / 3) + 1;
      
      // Apply special effects from prestigious upgrades
      let clickMultiplier = 1;
      
      // Apply critical hit chance
      if (prevState.specialEffects.criticalClickChance > 0) {
        // Random chance for critical hit
        const isCritical = Math.random() < prevState.specialEffects.criticalClickChance;
        if (isCritical) {
          clickMultiplier *= 2; // Critical hits give 2x
        }
      }
      
      // Apply combo system if enabled
      let newCombo = prevState.specialEffects.currentCombo;
      if (prevState.specialEffects.comboMultiplier > 0) {
        // Increase combo with each click, up to maximum of 100% bonus
        newCombo = Math.min(1, newCombo + prevState.specialEffects.comboMultiplier);
        // Add combo bonus to multiplier (ranging from 0% to 100% extra)
        clickMultiplier *= (1 + newCombo);
      }
      
      // Calculate pixels from this click with all bonuses
      const clickPixels = prevState.clickPower * clickMultiplier;
      
      // Apply rebirth click multiplier from skills
      const rebirthEffects = getRebirthEffects();
      const rebirthMultiplier = rebirthEffects.clickMultiplier;
      
      // Add current pixels + new pixels from clicking
      const newPixels = prevState.pixels + (clickPixels * rebirthMultiplier);
      const newLifetimePixels = prevState.lifetimePixels + (clickPixels * rebirthMultiplier);
      
      return {
        ...prevState,
        pixels: newPixels,
        lifetimePixels: newLifetimePixels,
        societyLevel: newSocietyLevel,
        totalClicks: prevState.totalClicks + 1,
        specialEffects: {
          ...prevState.specialEffects,
          currentCombo: newCombo
        }
      };
    });
  };

  // Buy upgrade
  const buyUpgrade = (upgradeId: string) => {
    console.log(`Attempting to buy upgrade: ${upgradeId}`);
    
    setGameState(prevState => {
      const upgrade = prevState.upgrades.find(u => u.id === upgradeId);
      if (!upgrade) {
        console.error(`Upgrade with ID ${upgradeId} not found`);
        return prevState;
      }
      
      if (upgrade.purchased) {
        console.log(`Upgrade ${upgradeId} already purchased`);
        return prevState;
      }
      
      // Check if this is a prestige upgrade that requires rebirth level
      const prestigeUpgrade = upgrade as PrestigeUpgrade;
      if (prestigeUpgrade.requiresRebirth && prevState.rebirthCount < prestigeUpgrade.requiresRebirth) {
        console.log(`Not enough rebirths to purchase upgrade ${upgradeId}`);
        return prevState; // Not enough rebirths to purchase this
      }
      
      // Apply rebirth cost reduction if any
      const rebirthEffects = getRebirthEffects();
      const discountedCost = Math.floor(upgrade.cost * (1 - rebirthEffects.upgradeCostReduction));
      
      console.log(`Upgrade cost: ${upgrade.cost}, Discounted cost: ${discountedCost}, Player pixels: ${prevState.pixels}`);
      
      if (prevState.pixels < discountedCost) {
        console.log(`Not enough pixels to purchase upgrade ${upgradeId}`);
        return prevState;
      }

      // Track if we need to apply an auto clicker boost
      const autoBoostMultiplier = upgrade.autoBoost || 0;
      
      // Create updated auto clickers with boost applied if needed
      const updatedAutoClickers = autoBoostMultiplier > 0 
        ? prevState.autoClickers.map(ac => ({
            ...ac,
            // Increase the pixels per second by the boost percentage
            pixelsPerSecond: ac.pixelsPerSecond * (1 + autoBoostMultiplier)
          }))
        : prevState.autoClickers;
      
      // Handle special effects from prestige upgrades
      let updatedSpecialEffects = { ...prevState.specialEffects };
      
      // Check if this is a prestige upgrade with special effects
      if (prestigeUpgrade.specialEffect) {
        const { type, value } = prestigeUpgrade.specialEffect;
        
        switch (type) {
          case 'criticalClicks':
            updatedSpecialEffects.criticalClickChance += value;
            break;
          case 'autoClickSpeed':
            updatedSpecialEffects.autoClickSpeedBoost += value;
            break;
          case 'comboMultiplier':
            updatedSpecialEffects.comboMultiplier += value;
            break;
          case 'passiveIncome':
            updatedSpecialEffects.passiveIncomeRate += value;
            break;
          case 'rebirth':
            updatedSpecialEffects.rebirthBonus += value;
            break;
        }
      }

      const newPixels = prevState.pixels - discountedCost;
      const newClickPower = prevState.clickPower * upgrade.multiplier;
      
      console.log(`Successfully purchased upgrade ${upgradeId}:`);
      console.log(`- Deducted ${discountedCost} pixels (New total: ${newPixels})`);
      console.log(`- New click power: ${newClickPower}`);
      
      return {
        ...prevState,
        pixels: newPixels,
        clickPower: newClickPower,
        upgrades: prevState.upgrades.map(u => 
          u.id === upgradeId ? { ...u, purchased: true } : u
        ),
        autoClickers: updatedAutoClickers,
        specialEffects: updatedSpecialEffects
      };
    });
  };

  // Buy auto clicker
  const buyAutoClicker = (clickerId: string) => {
    setGameState(prevState => {
      const clicker = prevState.autoClickers.find(c => c.id === clickerId);
      
      // Early return if clicker not found
      if (!clicker) return prevState;
      
      // Apply rebirth discount if applicable
      const rebirthEffects = getRebirthEffects();
      const discountedCost = Math.floor(clicker.cost * (1 - rebirthEffects.autoClickerCostReduction));
      
      // Check if the player can afford it after the discount is applied
      if (prevState.pixels < discountedCost) return prevState;
      
      // Increased cost scaling - more expensive with each purchase
      // Base multiplier is 1.15, now it's higher depending on clicker power
      const costScaleFactor = 1.15 + (clicker.pixelsPerSecond / 1000); // More powerful = steeper cost curve
      
      // Return updated state with reduced pixels and updated auto clicker
      return {
        ...prevState,
        pixels: prevState.pixels - discountedCost, // Subtract the discounted cost from pixels
        autoClickers: prevState.autoClickers.map(c => {
          if (c.id === clickerId) {
            return {
              ...c,
              count: c.count + 1,
              cost: Math.floor(c.cost * costScaleFactor)
            };
          }
          return c;
        })
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

  // Perform rebirth to reset game but gain rebirth points
  const performRebirth = () => {
    setGameState(prevState => {
      // Calculate rebirth points based on total lifetime pixels
      const baseRebirthPoints = Math.floor(Math.pow(prevState.lifetimePixels / 1000, 1/3));
      
      // Apply rebirth bonus from special upgrades
      const rebirthBonus = 1 + prevState.specialEffects.rebirthBonus;
      const totalRebirthPoints = Math.floor(baseRebirthPoints * rebirthBonus);
      
      // Safety check: prevent rebirth if no points would be gained or calculation results in NaN
      if (totalRebirthPoints <= 0 || isNaN(totalRebirthPoints)) {
        return prevState; // Return current state without changing anything
      }
      
      // Reset game but keep rebirth data
      return {
        ...initialGameState,
        rebirthPoints: prevState.rebirthPoints + totalRebirthPoints,
        rebirthCount: prevState.rebirthCount + 1,
        rebirthSkills: prevState.rebirthSkills,
        // Keep special effects from rebirth purchases
        specialEffects: prevState.specialEffects
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