// Define panel ID type
export type PanelId = 'stats' | 'upgrades' | 'autoClickers' | 'rebirth' | 'settings' | null;

// For panel state keys we need non-null panel IDs
export type NonNullPanelId = Exclude<PanelId, null>;

// Define sub-tabs for the upgrades panel - no longer needed as these are now main tabs
export type UpgradeSubTab = 'upgrades' | 'autoClickers' | 'rebirth';

// Define panel state
export type PanelState = {
  minimized: boolean;
  position: {
    x: number;
    y: number;
  };
};

// Define all panel states
export type PanelStates = {
  [key in NonNullPanelId]: PanelState;
};

// Define settings types
export type ColorScheme = 'rainbow' | 'monochrome' | 'blues' | 'greens';
export type AnimationSpeed = 'slow' | 'normal' | 'fast';

export type Settings = {
  pixelSize: number;
  colorScheme: ColorScheme;
  animationSpeed: AnimationSpeed;
}; 