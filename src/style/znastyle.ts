// src/style/znastyle.ts

// 1) Global Style - Geometry & Normals (handled by model creation)
// 1) Global Style - Textures (flat colors, 1x2 ramp for AO - will be applied to materials)
// 1) Global Style - Scale (human ≈ 1.8 units; sidewalk tile 1×1; road lane width 3.5 - will be used in model scaling)

// 2) Color & Materials
export const COLORS = {
    // Primary palette
    DeepGreen: '#1B3A2E',
    Forest: '#2D5A48',
    Sage: '#8BAF8B',
    Mist: '#DBF2DE',
    Concrete: '#C9D1D3',
    Graphite: '#2B2F33',
    AccentOrange: '#FE730A',
    Hover: '#FEB009',

    // Archetype accents
    DesignNeonMint: '#A6FFE2',
    DesignElectricBlue: '#3AA7FF',
    ArtMagenta: '#FF3DA3',
    ArtUVPurple: '#7B5CFF',
    CollabSunYellow: '#FFC83D',
    CollabTeal: '#47D1C2',

    // Terrain & Layout
    PackedSoil: '#B8C3B3',

    // Water & Sky
    Water: '#9FD8C7',

    // Lighting
    SunWarm: '#FFD9B0',
    SkyboxHazeStart: '#B9E4D7',
    SkyboxHazeEnd: '#F2FFF8',
};

export const MATERIAL_PROPERTIES = {
    Roughness: 0.85, // 0.85–1.0 (matte)
    EmissiveIntensity: { // accents only; 0.6–1.0 intensity; avoid bloom > 0.25
        Min: 0.6,
        Max: 1.0,
        BloomThreshold: 0.25,
    },
};

// 3) Lighting & Post (values to be used in Overworld.ts and post-processing setup)
export const LIGHTING = {
    SunElevation: 35, // degrees
    SunAzimuth: 130, // degrees
    ShadowSoftness: 0.01, // 1-2% softness
};

export const POST_PROCESSING = {
    VignetteIntensity: 0.1, // 10%
    BloomIntensity: 0.25, // low, avoid bloom > 0.25
    AOIntensity: 0.5, // light AO (arbitrary value, will need tuning)
};

// 4) Terrain & Layout (values to be used in terrain generation)
export const TERRAIN = {
    IslandSize: 500, // 0.5x0.5 km
    PerlinAmplitude: {
        Min: 4,
        Max: 6,
    },
    PerlinFrequency: 0.002,
    BlockSize: 80, // 80x80 blocks
    RoadLaneWidth: 3.5,
};

// 5) Vegetation (values to be used in vegetation generation)
export const VEGETATION = {
    GrassWindAmplitude: 0.2,
    GrassWindPeriod: 2.8,
};

// 6) Water & Sky (values to be used in water and sky generation)
export const WATER = {
    RippleAmplitude: 0.05,
    RippleSpeed: 0.4,
};

// 8) Monoliths (values to be used in monolith generation)
export const MONOLITH = {
    Footprint: {
        Min: 12,
        Max: 18,
    },
    Height: {
        Min: 22,
        Max: 36,
    },
    DesignTwist: 8, // degrees
    CollabPulseCycle: 3, // seconds
};

// 9) World Props (values to be used in prop generation)
export const PROPS = {
    StreetlightHeight: 4.2,
};

// 10) NPCs & Player Silhouette (values to be used in character models)
export const CHARACTER = {
    ArchetypeAuraOpacity: 0.05, // 5% opacity
};

// 11) Camera & UI Hooks (values to be used in camera setup)
export const CAMERA = {
    Height: 2.2,
    Distance: 5.5,
    FOV: 70,
};

// 12) Particles & VFX (values to be used in particle systems)
export const VFX = {
    ActivationDuration: 1.2, // seconds
    BattleCircleDiameter: {
        Min: 12,
        Max: 16,
    },
};
