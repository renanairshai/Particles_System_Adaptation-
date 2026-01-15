import React, { useEffect, useRef, useState } from 'react';

const CircularParticles = () => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const bgParticlesRef = useRef([]);
  const configRef = useRef(null); // Current config used by animation
  const lastConfigRef = useRef(null); // Track previous config for change detection
  const animationRef = useRef(null);
  const timeRef = useRef(0);
  const angleXRef = useRef(0);
  const angleYRef = useRef(0);
  const currentStateRef = useRef('gathering');
  const divisionLevelRef = useRef(0);
  const lastStateRef = useRef('gathering');
  const activeConnectionsRef = useRef(new Map()); // Store persistent connections between frames
  const hoveredParticleRef = useRef(null); // Track hovered particle for position display
  
  const [config, setConfig] = useState({
    particleCount: 150,
    sphereRadius: 1,
    minRadius: 15,
    maxRadius: 45,
    rotationSpeedX: 0.003,
    rotationSpeedY: 0.005,
    pulseSpeed: 0.02,
    perspective: 800,
    scatter: 0,
    breathingSpeedMin: 0,
    breathingSpeedMax: 0.0081,
    breathingAmountMin: 49,
    breathingAmountMax: 64,
    backgroundParticles: 773,
    blobDistortion: 0.3,
    bgDriftSpeedMin: 0.55,
    bgDriftSpeedMax: 0.51,
    bgMinSize: 6,
    bgMaxSize: 18,
    motionBlur: 0.78,
    motionBlurSteps: 20,
    trailInterval: 1,
    particleOpacity: 0.23,
    bgParticleOpacity: 0.43,
    particleNoise: 0, // Noise amount for particle positions (0-100)
    particleShape: 'circle',
    autoRotateShapes: true,
    glowRadius: 1,
    trailType: 'echo',
    streakColor: '#c8c8ff',
    blendMode: 'source-over',
    connectorsEnabled: true,
    connectorMinDistance: 100,
    connectorMaxDistance: 112,
    connectorColor: '#000000',
    connectorDotColor: null, // If null, falls back to connectorColor
    connectorWidth: 0.5,
    connectorOpacity: 1.00,
    connectorDotOpacity: null, // If null, falls back to connectorOpacity
    connectorMaxPerParticle: 5,
    connectorMaxTotal: 20,
    connectorArcMode: false,
    connectorArcOutward: true,
    connectorArcHeight: 0.3,
    connectorShowDots: false,
    connectorDotSize: 9,
    connectorLineStyle: 'solid',
    connectorBlendMode: 'source-over',
    connectorDotStrokeOnly: false,
    connectorDotFillConnected: false,
    connectorWiggle: false,
    connectorWiggleAmplitude: 5,
    connectorWiggleFrequency: 2,
    connectorWiggleSpeed: 0.01,
    connectorDrawOnTop: true,  // If true, connectors appear on top of particles; if false, behind
    gridRows: 12, // Grid rows (only used in grid state)
    gridCols: 13, // Grid columns (only used in grid state)
    gridWidth: 1950, // Total grid width in units (only used in grid state)
    gridHeight: 1800, // Total grid height in units (only used in grid state)
    gridVerticalMovementEnabled: false, // Enable vertical movement in grid state
    gridVerticalSpeedMin: 0.01, // Minimum vertical oscillation speed
    gridVerticalSpeedMax: 0.02, // Maximum vertical oscillation speed
    gridVerticalAmplitudeMin: 20, // Minimum vertical movement distance
    gridVerticalAmplitudeMax: 40  // Maximum vertical movement distance
  });

  const [currentState, setCurrentState] = useState('gathering'); // 'gathering' | 'birth' | 'grid'
  const [divisionLevel, setDivisionLevel] = useState(0); // 0-7 for 8 levels
  const [gridRows, setGridRows] = useState(12); // Grid rows (only used in grid state)
  const [gridCols, setGridCols] = useState(13); // Grid columns (only used in grid state)
  const [gridWidth, setGridWidth] = useState(1950); // Grid width in units (only used in grid state)
  const [gridHeight, setGridHeight] = useState(1800); // Grid height in units (only used in grid state)
  const divisionProgressRef = useRef(0); // 0-1 for animation progress
  const divisionStartTimeRef = useRef(0);
  const isDividingRef = useRef(false); // Prevent multiple divisions at once
  const divisionDuration = 2000; // 2 seconds per division cycle
  const separationDistance = 100; // Distance particles move apart

  // Define color palettes - simple color lists that can be applied to gradients
  // Each palette is an array of hex color strings
  const colorPalettes = {
    // Default palettes
    'Default': ['#ffffff', '#050a2e', '#004466', '#b8edff'],
    'Warm Sunset': ['#ff6b6b', '#ffa500', '#ffd93d', '#ff6b9d'],
    'Cool Ocean': ['#006994', '#00a8cc', '#4ecdc4', '#95e1d3'],
    'Forest': ['#2d5016', '#3d7c47', '#6b8e23', '#9acd32'],
    'Purple Dream': ['#6c5ce7', '#a29bfe', '#fd79a8', '#fdcb6e'],
    // Custom palettes
    'Vibrant Spectrum': ['#FF714A', '#2E32FF', '#FBF99F', '#F2262A', '#284D41', '#B7E5FF', '#5E4E3A'],
    'Bold Gradient': ['#FF5616', '#022FCD', '#CA7D00', '#FD98EA', '#8E151A', '#013605', '#74AB34', '#797791'],
    // Add more custom palettes below - format: 'Palette Name': ['#color1', '#color2', '#color3', ...]
  };

  // Function to apply Custom-1 color set with exact arrangement
  const applyCustom1 = () => {
    // Based on the image: 6 gradients with specific color pairs
    // Each gradient goes from outer color to inner color
    const custom1Gradients = [
      // Gradient 1: Pale sky blue outer → Brown-orange inner
      [
        { position: 0, color: '#C3F0FF', opacity: 1 },
        { position: 0.3, color: '#C3F0FF', opacity: 1 },
        { position: 0.7, color: '#CA7D00', opacity: 1 },
        { position: 1, color: '#CA7D00', opacity: 0 }
      ],
      // Gradient 2: Light pink outer → Vibrant red inner
      [
        { position: 0, color: '#FCAFBA', opacity: 1 },
        { position: 0.3, color: '#FCAFBA', opacity: 1 },
        { position: 0.7, color: '#FE5E40', opacity: 1 },
        { position: 1, color: '#FE5E40', opacity: 0 }
      ],
      // Gradient 3: Brown-orange outer → Bright yellow inner
      [
        { position: 0, color: '#CA7D00', opacity: 1 },
        { position: 0.3, color: '#CA7D00', opacity: 1 },
        { position: 0.7, color: '#FFFF8D', opacity: 1 },
        { position: 1, color: '#FFFF8D', opacity: 0 }
      ],
      // Gradient 4: Pale sky blue outer → Deep royal blue inner
      [
        { position: 0, color: '#C3F0FF', opacity: 1 },
        { position: 0.3, color: '#C3F0FF', opacity: 1 },
        { position: 0.7, color: '#022FCD', opacity: 1 },
        { position: 1, color: '#022FCD', opacity: 0 }
      ],
      // Gradient 5: Vibrant red outer → Bright yellow inner
      [
        { position: 0, color: '#FE5E40', opacity: 1 },
        { position: 0.3, color: '#FE5E40', opacity: 1 },
        { position: 0.7, color: '#FFFF8D', opacity: 1 },
        { position: 1, color: '#FFFF8D', opacity: 0 }
      ],
      // Gradient 6: Deep royal blue outer → Vibrant red-orange inner
      [
        { position: 0, color: '#022FCD', opacity: 1 },
        { position: 0.3, color: '#022FCD', opacity: 1 },
        { position: 0.7, color: '#FE5E40', opacity: 1 },
        { position: 1, color: '#FE5E40', opacity: 0 }
      ]
    ];
    
    setEditableGradients(custom1Gradients);
    setSelectedColorSet('Custom-1');
    // Enable all 6 gradients for Custom-1
    setEnabledGradients(Array(6).fill(true));
    setSelectedPalette(null); // Clear any palette selection
  };

  // Function to apply Custom-2 color set with exact arrangement
  const applyCustom2 = () => {
    // Based on the image: 6 gradients with specific color pairs
    // Each gradient goes from outer color to inner color
    const custom2Gradients = [
      // Gradient 1: Light blue outer → Brown-orange inner
      [
        { position: 0, color: '#A4D2E1', opacity: 1 },
        { position: 0.3, color: '#A4D2E1', opacity: 1 },
        { position: 0.7, color: '#CA7D00', opacity: 1 },
        { position: 1, color: '#CA7D00', opacity: 0 }
      ],
      // Gradient 2: Light pink outer → Red inner
      [
        { position: 0, color: '#FCAFBA', opacity: 1 },
        { position: 0.3, color: '#FCAFBA', opacity: 1 },
        { position: 0.7, color: '#F7452F', opacity: 1 },
        { position: 1, color: '#F7452F', opacity: 0 }
      ],
      // Gradient 3: Brown-orange outer → Bright yellow inner
      [
        { position: 0, color: '#CA7D00', opacity: 1 },
        { position: 0.3, color: '#CA7D00', opacity: 1 },
        { position: 0.7, color: '#FFFF8D', opacity: 1 },
        { position: 1, color: '#FFFF8D', opacity: 0 }
      ],
      // Gradient 4: Light blue outer → White inner
      [
        { position: 0, color: '#A4D2E1', opacity: 1 },
        { position: 0.3, color: '#A4D2E1', opacity: 1 },
        { position: 0.7, color: '#FAFBFF', opacity: 1 },
        { position: 1, color: '#FAFBFF', opacity: 0 }
      ],
      // Gradient 5: Red outer → Bright yellow inner
      [
        { position: 0, color: '#F7452F', opacity: 1 },
        { position: 0.3, color: '#F7452F', opacity: 1 },
        { position: 0.7, color: '#FFFF8D', opacity: 1 },
        { position: 1, color: '#FFFF8D', opacity: 0 }
      ],
      // Gradient 6: White outer → Red inner
      [
        { position: 0, color: '#FAFBFF', opacity: 1 },
        { position: 0.3, color: '#FAFBFF', opacity: 1 },
        { position: 0.7, color: '#F7452F', opacity: 1 },
        { position: 1, color: '#F7452F', opacity: 0 }
      ]
    ];
    
    setEditableGradients(custom2Gradients);
    setSelectedColorSet('Custom-2');
    // Enable all 6 gradients for Custom-2
    setEnabledGradients(Array(6).fill(true));
    setSelectedPalette(null); // Clear any palette selection
  };

  // Function to apply Custom-3 color set with exact arrangement
  const applyCustom3 = () => {
    // Based on the image: 6 gradients with specific color pairs
    // Each gradient goes from outer color to inner color
    const custom3Gradients = [
      // Gradient 1: Royal blue outer → Golden-brown inner
      [
        { position: 0, color: '#022FCD', opacity: 1 },
        { position: 0.3, color: '#022FCD', opacity: 1 },
        { position: 0.7, color: '#CA7D00', opacity: 1 },
        { position: 1, color: '#CA7D00', opacity: 0 }
      ],
      // Gradient 2: Dark teal outer → Pale yellow inner
      [
        { position: 0, color: '#005442', opacity: 1 },
        { position: 0.3, color: '#005442', opacity: 1 },
        { position: 0.7, color: '#FFFF8D', opacity: 1 },
        { position: 1, color: '#FFFF8D', opacity: 0 }
      ],
      // Gradient 3: Sky blue outer (halo) → Golden-brown inner
      [
        { position: 0, color: '#A4D2E1', opacity: 1 },
        { position: 0.3, color: '#A4D2E1', opacity: 1 },
        { position: 0.7, color: '#CA7D00', opacity: 1 },
        { position: 1, color: '#CA7D00', opacity: 0 }
      ],
      // Gradient 4: Dark teal outer → Light pink inner
      [
        { position: 0, color: '#005442', opacity: 1 },
        { position: 0.3, color: '#005442', opacity: 1 },
        { position: 0.7, color: '#FCAFBA', opacity: 1 },
        { position: 1, color: '#FCAFBA', opacity: 0 }
      ],
      // Gradient 5: Coral/reddish-orange outer → Golden-brown inner
      [
        { position: 0, color: '#FE5E40', opacity: 1 },
        { position: 0.3, color: '#FE5E40', opacity: 1 },
        { position: 0.7, color: '#CA7D00', opacity: 1 },
        { position: 1, color: '#CA7D00', opacity: 0 }
      ],
      // Gradient 6: Pale yellow outer → Royal blue inner
      [
        { position: 0, color: '#FFFF8D', opacity: 1 },
        { position: 0.3, color: '#FFFF8D', opacity: 1 },
        { position: 0.7, color: '#022FCD', opacity: 1 },
        { position: 1, color: '#022FCD', opacity: 0 }
      ]
    ];
    
    setEditableGradients(custom3Gradients);
    setSelectedColorSet('Custom-3');
    // Enable all 6 gradients for Custom-3
    setEnabledGradients(Array(6).fill(true));
    setSelectedPalette(null); // Clear any palette selection
  };

  // Function to apply Custom-4 color set with exact arrangement
  const applyCustom4 = () => {
    // Based on the image: 6 gradients with specific color pairs
    // Each gradient goes from outer color to inner color
    const custom4Gradients = [
      // Gradient 1: Light pink outer → Dark gray inner (large circle)
      [
        { position: 0, color: '#FD98EA', opacity: 1 },
        { position: 0.3, color: '#FD98EA', opacity: 1 },
        { position: 0.7, color: '#797791', opacity: 1 },
        { position: 1, color: '#797791', opacity: 0 }
      ],
      // Gradient 2: Vibrant orange outer → Deep dark red inner (small circle)
      [
        { position: 0, color: '#FF5616', opacity: 1 },
        { position: 0.3, color: '#FF5616', opacity: 1 },
        { position: 0.7, color: '#8E151A', opacity: 1 },
        { position: 1, color: '#8E151A', opacity: 0 }
      ],
      // Gradient 3: Warm earthy brown outer → Bright solid blue inner (medium-large circle)
      [
        { position: 0, color: '#CA7D00', opacity: 1 },
        { position: 0.3, color: '#CA7D00', opacity: 1 },
        { position: 0.7, color: '#022FCD', opacity: 1 },
        { position: 1, color: '#022FCD', opacity: 0 }
      ],
      // Gradient 4: Muted green outer → Lighter vibrant green inner (medium circle)
      [
        { position: 0, color: '#013605', opacity: 1 },
        { position: 0.3, color: '#013605', opacity: 1 },
        { position: 0.7, color: '#74AB34', opacity: 1 },
        { position: 1, color: '#74AB34', opacity: 0 }
      ],
      // Gradient 5: Bright blue outer → Soft light pink inner (small circle)
      [
        { position: 0, color: '#022FCD', opacity: 1 },
        { position: 0.3, color: '#022FCD', opacity: 1 },
        { position: 0.7, color: '#FD98EA', opacity: 1 },
        { position: 1, color: '#FD98EA', opacity: 0 }
      ],
      // Gradient 6: Bold orange outer → Deep dark red inner (largest circle)
      [
        { position: 0, color: '#FF5616', opacity: 1 },
        { position: 0.3, color: '#FF5616', opacity: 1 },
        { position: 0.7, color: '#8E151A', opacity: 1 },
        { position: 1, color: '#8E151A', opacity: 0 }
      ]
    ];
    
    setEditableGradients(custom4Gradients);
    setSelectedColorSet('Custom-4');
    // Enable all 6 gradients for Custom-4
    setEnabledGradients(Array(6).fill(true));
    setSelectedPalette(null); // Clear any palette selection
  };

  // Function to apply Custom-5 color set with exact arrangement
  const applyCustom5 = () => {
    // Based on the image: 7 gradients with specific color pairs
    // Each gradient goes from outer color to inner color
    const custom5Gradients = [
      // Gradient 1: Periwinkle blue outer → Light pastel green inner (large circle)
      [
        { position: 0, color: '#7098FA', opacity: 1 },
        { position: 0.3, color: '#7098FA', opacity: 1 },
        { position: 0.7, color: '#80EB91', opacity: 1 },
        { position: 1, color: '#80EB91', opacity: 0 }
      ],
      // Gradient 2: Light pink outer → Bright yellow inner (small circle)
      [
        { position: 0, color: '#FFC6DD', opacity: 1 },
        { position: 0.3, color: '#FFC6DD', opacity: 1 },
        { position: 0.7, color: '#FAFE45', opacity: 1 },
        { position: 1, color: '#FAFE45', opacity: 0 }
      ],
      // Gradient 3: Warm orange outer → Light pastel pink inner (very large circle)
      [
        { position: 0, color: '#FF8C4A', opacity: 1 },
        { position: 0.3, color: '#FF8C4A', opacity: 1 },
        { position: 0.7, color: '#FFC6DD', opacity: 1 },
        { position: 1, color: '#FFC6DD', opacity: 0 }
      ],
      // Gradient 4: Blue outer → Light pastel green inner (medium circle)
      [
        { position: 0, color: '#7098FA', opacity: 1 },
        { position: 0.3, color: '#7098FA', opacity: 1 },
        { position: 0.7, color: '#80EB91', opacity: 1 },
        { position: 1, color: '#80EB91', opacity: 0 }
      ],
      // Gradient 5: Yellow-green outer → Warm orange inner (small circle)
      [
        { position: 0, color: '#D4EF3B', opacity: 1 },
        { position: 0.3, color: '#D4EF3B', opacity: 1 },
        { position: 0.7, color: '#FF8C4A', opacity: 1 },
        { position: 1, color: '#FF8C4A', opacity: 0 }
      ],
      // Gradient 6: Blue outer → Blue inner (medium circle - using same blue as provided)
      [
        { position: 0, color: '#7098FA', opacity: 1 },
        { position: 0.3, color: '#7098FA', opacity: 1 },
        { position: 0.7, color: '#7098FA', opacity: 0.7 },
        { position: 1, color: '#7098FA', opacity: 0 }
      ],
      // Gradient 7: Light blue outer → Darker blue inner (large circle - using same blue with reduced opacity for darker effect)
      [
        { position: 0, color: '#7098FA', opacity: 1 },
        { position: 0.3, color: '#7098FA', opacity: 0.8 },
        { position: 0.7, color: '#7098FA', opacity: 0.5 },
        { position: 1, color: '#7098FA', opacity: 0 }
      ]
    ];
    
    setEditableGradients(custom5Gradients);
    setSelectedColorSet('Custom-5');
    // Enable all 7 gradients for Custom-5
    setEnabledGradients(Array(7).fill(true));
    setSelectedPalette(null); // Clear any palette selection
  };

  // Function to apply Custom-6 color set with exact arrangement
  const applyCustom6 = () => {
    // Based on the image: 6 gradients with specific color pairs
    // Each gradient goes from outer color to inner color
    const custom6Gradients = [
      // Gradient 1: Orange/red outer → Light blue inner (light blue central with orange outer)
      [
        { position: 0, color: '#F2262A', opacity: 1 },
        { position: 0.3, color: '#F2262A', opacity: 1 },
        { position: 0.7, color: '#B7E5FF', opacity: 1 },
        { position: 1, color: '#B7E5FF', opacity: 0 }
      ],
      // Gradient 2: Light pink/whitish outer → Red inner (small red central with faint pink halo)
      [
        { position: 0, color: '#FAE5EF', opacity: 1 },
        { position: 0.3, color: '#FAE5EF', opacity: 0.5 },
        { position: 0.7, color: '#F2262A', opacity: 1 },
        { position: 1, color: '#F2262A', opacity: 0 }
      ],
      // Gradient 3: Royal blue outer → Light yellow inner (light yellow central with royal blue outer)
      [
        { position: 0, color: '#2E32FF', opacity: 1 },
        { position: 0.3, color: '#2E32FF', opacity: 1 },
        { position: 0.7, color: '#FBF99F', opacity: 1 },
        { position: 1, color: '#FBF99F', opacity: 0 }
      ],
      // Gradient 4: Light blue outer → Dark teal inner (dark teal central with light blue outer)
      [
        { position: 0, color: '#B7E5FF', opacity: 1 },
        { position: 0.3, color: '#B7E5FF', opacity: 1 },
        { position: 0.7, color: '#284D41', opacity: 1 },
        { position: 1, color: '#284D41', opacity: 0 }
      ],
      // Gradient 5: Red/orange outer → Dark brown inner (dark brown central with orange outer)
      [
        { position: 0, color: '#F2262A', opacity: 1 },
        { position: 0.3, color: '#F2262A', opacity: 1 },
        { position: 0.7, color: '#5E4E3A', opacity: 1 },
        { position: 1, color: '#5E4E3A', opacity: 0 }
      ],
      // Gradient 6: Light pink outer → Red inner (red central with large light pink outer)
      [
        { position: 0, color: '#FAE5EF', opacity: 1 },
        { position: 0.3, color: '#FAE5EF', opacity: 1 },
        { position: 0.7, color: '#F2262A', opacity: 1 },
        { position: 1, color: '#F2262A', opacity: 0 }
      ]
    ];
    
    setEditableGradients(custom6Gradients);
    setSelectedColorSet('Custom-6');
    // Enable all 6 gradients for Custom-6
    setEnabledGradients(Array(6).fill(true));
    setSelectedPalette(null); // Clear any palette selection
  };

  // Function to apply Custom-7 color set with exact arrangement
  const applyCustom7 = () => {
    // Based on the image: 6 gradients with specific color pairs
    // Each gradient goes from outer color to inner color
    const custom7Gradients = [
      // Gradient 1: Dark olive green outer → Light lavender/pale purple inner (large circle)
      [
        { position: 0, color: '#013605', opacity: 1 },
        { position: 0.3, color: '#013605', opacity: 1 },
        { position: 0.7, color: '#FD98EA', opacity: 1 },
        { position: 1, color: '#FD98EA', opacity: 0 }
      ],
      // Gradient 2: Bright pink outer → Vibrant orange-red inner (small circle)
      [
        { position: 0, color: '#FD98EA', opacity: 1 },
        { position: 0.3, color: '#FD98EA', opacity: 1 },
        { position: 0.7, color: '#F54114', opacity: 1 },
        { position: 1, color: '#F54114', opacity: 0 }
      ],
      // Gradient 3: Golden-brown/light brown outer → Deep royal blue inner (large circle)
      [
        { position: 0, color: '#CA7D00', opacity: 1 },
        { position: 0.3, color: '#CA7D00', opacity: 1 },
        { position: 0.7, color: '#022FCD', opacity: 1 },
        { position: 1, color: '#022FCD', opacity: 0 }
      ],
      // Gradient 4: Green outer → Very dark blue/almost black inner (medium circle)
      [
        { position: 0, color: '#48881E', opacity: 1 },
        { position: 0.3, color: '#48881E', opacity: 1 },
        { position: 0.7, color: '#0E0033', opacity: 1 },
        { position: 1, color: '#0E0033', opacity: 0 }
      ],
      // Gradient 5: Coral/reddish-orange outer → Light pink inner (medium circle)
      [
        { position: 0, color: '#F54114', opacity: 1 },
        { position: 0.3, color: '#F54114', opacity: 1 },
        { position: 0.7, color: '#FD98EA', opacity: 1 },
        { position: 1, color: '#FD98EA', opacity: 0 }
      ],
      // Gradient 6: Dark forest green outer → Vibrant orange-red inner (large circle)
      [
        { position: 0, color: '#013605', opacity: 1 },
        { position: 0.3, color: '#013605', opacity: 1 },
        { position: 0.7, color: '#F54114', opacity: 1 },
        { position: 1, color: '#F54114', opacity: 0 }
      ]
    ];
    
    setEditableGradients(custom7Gradients);
    setSelectedColorSet('Custom-7');
    // Enable all 6 gradients for Custom-7
    setEnabledGradients(Array(6).fill(true));
    setSelectedPalette(null); // Clear any palette selection
  };

  // Function to apply Custom-8 color set - uses same structure as Color Set A but with specified colors
  const applyCustom8 = () => {
    // Get the current Color Set A structure to preserve gradient positions
    const colorSetA = colorSets['Color Set A'];
    if (!colorSetA) {
      console.error('Color Set A not found');
      return;
    }
    
    // Convert Color Set A to new format to get the structure (positions and opacity)
    const baseGradients = convertToNewFormat(colorSetA);
    
    // Define the 7 colors to use
    const customColors = [
      '#4891EA', // Medium blue
      '#96b62d', // Yellow-green/chartreuse
      '#9fc1d6', // Light blue/gray-blue
      '#f2262A', // Red
      '#f3f3f3', // Light gray/off-white
      '#f4d529', // Bright yellow
      '#ffb8f2'  // Light pink/magenta
    ];
    
    // Map colors to gradients - distribute the 7 colors across 8 gradients
    // Each gradient has 3 color stops, so we map [outer, middle, inner] colors
    const colorMapping = [
      [customColors[6], customColors[2], customColors[0]], // Pink → Light blue → Medium blue
      [customColors[4], customColors[1], customColors[6]], // White → Yellow-green → Pink
      [customColors[5], customColors[1], customColors[1]], // Yellow → Yellow-green → Yellow-green
      [customColors[4], customColors[1], customColors[6]], // White → Yellow-green → Pink
      [customColors[3], customColors[5], customColors[4]], // Red → Yellow → White
      [customColors[2], customColors[0], customColors[2]], // Light blue → Medium blue → Light blue
      [customColors[0], customColors[6], customColors[6]], // Medium blue → Pink → Pink
      [customColors[3], customColors[5], customColors[5]]  // Red → Yellow → Yellow
    ];
    
    // Create new gradients with same structure (positions, opacity) but new colors
    const custom8Gradients = baseGradients.map((gradient, index) => {
      const colors = colorMapping[index] || [customColors[0], customColors[1], customColors[2]];
      // Sort stops by position to ensure correct order
      const sortedStops = [...gradient].sort((a, b) => a.position - b.position);
      return sortedStops.map((stop, stopIndex) => {
        // Map colors: first stop gets first color, second gets second, etc.
        // If there are more stops than colors, cycle through colors
        const colorIndex = stopIndex % colors.length;
        return {
          ...stop,
          color: colors[colorIndex]
        };
      });
    });
    
    setEditableGradients(custom8Gradients);
    setSelectedColorSet('Custom-8');
    // Enable all gradients (same count as Color Set A - 8 gradients)
    setEnabledGradients(Array(8).fill(true));
    setSelectedPalette(null); // Clear any palette selection
  };

  // Function to apply Custom-9 - Uses the 7 specific colors from the palette
  // Colors in order: #4891EA, #96B62D, #9FC1D6, #F2262A, #F3F3F3, #F4D529, #FFB8F2
  const applyCustom9 = () => {
    // Get Color Set K structure to preserve gradient positions
    const colorSetK = colorSets['Color Set K'];
    if (!colorSetK || !colorSetK.gradientStops) {
      console.error('Color Set K not found');
      return;
    }
    
    // The 7 colors from the palette in the exact order shown
    const paletteColors = [
      '#4891EA',  // Medium Blue
      '#96B62D',  // Olive Green
      '#9FC1D6',  // Light Blue/Gray-Blue
      '#F2262A',  // Red
      '#F3F3F3',  // Very light gray/off-white
      '#F4D529',  // Bright Yellow
      '#FFB8F2'   // Light Pink/Lavender
    ];
    
    // Distribute these 7 colors across the 9 gradients from Color Set K
    // Keep the same gradient structure (positions, opacity) but use the new colors
    const custom9Gradients = colorSetK.gradientStops.map((gradient, gradientIndex) => {
      return gradient.map((stop, stopIndex) => {
        // Map colors to stops - cycle through palette colors
        const colorIndex = (gradientIndex * gradient.length + stopIndex) % paletteColors.length;
        return {
          ...stop,
          color: paletteColors[colorIndex]
        };
      });
    });
    
    setEditableGradients(custom9Gradients);
    setSelectedColorSet('Custom-9');
    // Enable all gradients (same count as Color Set K - 9 gradients)
    setEnabledGradients(Array(9).fill(true));
    // Set blend mode to normal (source-over)
    updateConfig('blendMode', 'source-over');
    // Set background color
    setBackgroundColor('#f9f9f9');
    setSelectedPalette(null); // Clear any palette selection
  };

  // Function to apply Default - Same as Custom-9 but softer/more transparent
  const applyDefault = () => {
    // Get Color Set K structure to preserve gradient positions
    const colorSetK = colorSets['Color Set K'];
    if (!colorSetK || !colorSetK.gradientStops) {
      console.error('Color Set K not found');
      return;
    }
    
    // The same 7 colors from Custom-9, with green updated
    const paletteColors = [
      '#4891EA',  // Medium Blue
      '#61b361',  // Green (updated)
      '#9FC1D6',  // Light Blue/Gray-Blue
      '#F2262A',  // Red
      '#F3F3F3',  // Very light gray/off-white
      '#F4D529',  // Bright Yellow
      '#FFB8F2'   // Light Pink/Lavender
    ];
    
    // Create softer version by reducing opacity
    // Reduce opacity by about 40-50% to make it softer
    const opacityMultiplier = 0.6; // 60% of original opacity = 40% reduction
    
    // Distribute these 7 colors across the 9 gradients from Color Set K
    // Keep the same gradient structure but reduce opacity for softer appearance
    const custom10Gradients = colorSetK.gradientStops.map((gradient, gradientIndex) => {
      return gradient.map((stop, stopIndex) => {
        // Map colors to stops - cycle through palette colors
        const colorIndex = (gradientIndex * gradient.length + stopIndex) % paletteColors.length;
        let finalColor = paletteColors[colorIndex];
        
        // Special handling for gradient 1 (index 0) - make it much softer, almost white
        if (gradientIndex === 0) {
          // All stops in gradient 1 should be white
          finalColor = '#ffffff';
          // Very low opacity for soft appearance
          const newOpacity = Math.max(0, stop.opacity * 0.3);
          return {
            ...stop,
            color: finalColor,
            opacity: newOpacity
          };
        }
        
        // Keep white colors pure white (#ffffff) - don't use #F3F3F3 for white dots
        // If the color is the light gray (#F3F3F3), convert it to pure white for better visibility
        if (finalColor.toLowerCase() === '#f3f3f3') {
          finalColor = '#ffffff';
        }
        
        // Reduce opacity to make it softer, but keep white at full opacity for clean edges
        let newOpacity = Math.max(0, stop.opacity * opacityMultiplier);
        if (finalColor.toLowerCase() === '#ffffff' && stop.opacity > 0) {
          // Keep white at higher opacity to avoid grey outlines
          newOpacity = Math.max(0.8, stop.opacity * 0.9);
        }
        
        return {
          ...stop,
          color: finalColor,
          opacity: newOpacity
        };
      });
    });
    
    setEditableGradients(custom10Gradients);
    setSelectedColorSet('Default');
    // Enable all gradients (same count as Color Set K - 9 gradients)
    setEnabledGradients(Array(9).fill(true));
    // Set blend mode to normal (source-over)
    updateConfig('blendMode', 'source-over');
    // Set background color
    setBackgroundColor('#EEEEEE');
    setSelectedPalette(null); // Clear any palette selection
  };

  // Function to apply Custom-10: Same structure as Default but with new color palette
  const applyCustom10 = () => {
    // Get the Default color set structure (exact same positions and opacities)
    const defaultSet = colorSets['Default'];
    if (!defaultSet || !defaultSet.gradientStops) {
      console.error('Default color set not found');
      return;
    }
    
    // Helper function to map colors based on color family
    const mapColor = (originalColor) => {
      const color = originalColor.toLowerCase();
      
      // Keep white as white
      if (color === '#ffffff' || color === '#ffffff') {
        return '#ffffff';
      }
      
      // Map blues (various shades) to new blue or light blue
      // Darker blues → #4891EA, lighter blues → #D1EDFF
      if (color.includes('7aa4d4') || color.includes('325a7e') || color.includes('6379ff') || 
          color.includes('0d5578') || color.includes('005277') || color.includes('4891ea')) {
        // Check if it's a darker blue (like #325a7e, #0d5578, #005277) → use #4891EA
        if (color.includes('325a7e') || color.includes('0d5578') || color.includes('005277') || 
            color.includes('6379ff') || color.includes('4a1a73')) {
          return '#4891EA';
        }
        // Lighter blues → use #D1EDFF
        return '#D1EDFF';
      }
      
      // Map greens (various shades) to #d1ff39
      if (color.includes('6a7d1a') || color.includes('6a8d6a') || color.includes('407d40') || 
          color.includes('3d9a5f') || color.includes('6f7504') || color.includes('61b361') ||
          color.includes('6f8a6f') || color.includes('48881e') || color.includes('74ab34')) {
        return '#d1ff39';
      }
      
      // Map reds (various shades) to #FB5558
      if (color.includes('ff1a1a') || color.includes('750000') || color.includes('e03f3f') || 
          color.includes('f2262a') || color.includes('f54114') || color.includes('8e151a')) {
        return '#FB5558';
      }
      
      // Map yellows/oranges to #FFED8A
      if (color.includes('ff8a1a') || color.includes('ffff1a') || color.includes('f4d529') || 
          color.includes('fafe45') || color.includes('fbf99f') || color.includes('ffff8d')) {
        return '#FFED8A';
      }
      
      // Map pinks/lavenders to #FFB8F2 (keep same)
      if (color.includes('ffb8f5') || color.includes('f5b8f5') || color.includes('ffe0ff') || 
          color.includes('d299c6') || color.includes('ffb8f2') || color.includes('f98ea') ||
          color.includes('ffc6dd') || color.includes('fcafba')) {
        return '#FFB8F2';
      }
      
      // Map purples/lavenders to #ECB8F6
      if (color.includes('d4b3ff') || color.includes('ecb8f6')) {
        return '#ECB8F6';
      }
      
      // Map light grays to purple
      if (color.includes('f3f3f3') || color.includes('d9d9d9') || color.includes('bababa')) {
        return '#ECB8F6';
      }
      
      // Default: return original color if no match
      return originalColor;
    };
    
    // Apply color mapping to Default structure (keep exact same positions and opacities)
    const custom10Gradients = defaultSet.gradientStops.map((gradient) => {
      return gradient.map((stop) => {
        return {
          ...stop,
          color: mapColor(stop.color)
        };
      });
    });
    
    setEditableGradients(custom10Gradients);
    setSelectedColorSet('Custom-10');
    // Enable all gradients (same count as Default - 9 gradients)
    setEnabledGradients(Array(9).fill(true));
    // Set blend mode to normal (source-over) - same as Default
    updateConfig('blendMode', 'source-over');
    // Set background color - same as Default
    setBackgroundColor('#EEEEEE');
    setSelectedPalette(null); // Clear any palette selection
  };

  // Function to apply Custom-11: Same structure as Custom-10 but with new color palette
  const applyCustom11 = () => {
    // Get the Custom-10 color set structure (or Default, since Custom-10 uses Default structure)
    // We'll use Default as the base since Custom-10 is based on it
    const defaultSet = colorSets['Default'];
    if (!defaultSet || !defaultSet.gradientStops) {
      console.error('Default color set not found');
      return;
    }
    
    // New color palette for Custom-11 (from the image)
    // Mapping from Custom-10 colors to Custom-11 colors:
    // Blue: #4891EA → #75B0F5
    // Light Blue: #D1EDFF → #A7BFD2
    // Green: #d1ff39 → #A5D1AE
    // Red: #FB5558 → #DE6352
    // Yellow: #FFED8A → #EFD885
    // Pink: #FFB8F2 → #F3BDED
    // Purple: #ECB8F6 → #ECB8F6 (same)
    // Light Gray: #F3F3F3 → #F3F3F3 (same, or map to purple if needed)
    
    // Helper function to map colors from Custom-10 to Custom-11
    const mapColor = (originalColor) => {
      const color = originalColor.toLowerCase();
      
      // Keep white as white
      if (color === '#ffffff' || color === '#ffffff') {
        return '#ffffff';
      }
      
      // Map blues
      // #4891EA (Custom-10 blue) → #75B0F5 (Custom-11 blue)
      if (color === '#4891ea' || color.includes('4891ea')) {
        return '#75B0F5';
      }
      // #D1EDFF (Custom-10 light blue) → #A7BFD2 (Custom-11 light blue)
      if (color === '#d1edff' || color.includes('d1edff')) {
        return '#A7BFD2';
      }
      
      // Map greens
      // #d1ff39 (Custom-10 green) → #A5D1AE (Custom-11 green)
      if (color === '#d1ff39' || color.includes('d1ff39')) {
        return '#A5D1AE';
      }
      
      // Map reds
      // #FB5558 (Custom-10 red) → #DE6352 (Custom-11 orange-red)
      if (color === '#fb5558' || color.includes('fb5558')) {
        return '#DE6352';
      }
      
      // Map yellows
      // #FFED8A (Custom-10 yellow) → #EFD885 (Custom-11 yellow)
      if (color === '#ffed8a' || color.includes('ffed8a')) {
        return '#EFD885';
      }
      
      // Map pinks
      // #FFB8F2 (Custom-10 pink) → #F3BDED (Custom-11 pink)
      if (color === '#ffb8f2' || color.includes('ffb8f2')) {
        return '#F3BDED';
      }
      
      // Map purples
      // #ECB8F6 (Custom-10 purple) → #ECB8F6 (Custom-11 purple - same)
      if (color === '#ecb8f6' || color.includes('ecb8f6')) {
        return '#ECB8F6';
      }
      
      // Map light grays - if they were mapped to purple in Custom-10, keep as purple
      // Otherwise map to #F3F3F3
      if (color.includes('f3f3f3') || color.includes('d9d9d9') || color.includes('bababa')) {
        // If it was a light gray that became purple in Custom-10, keep it as purple
        // Otherwise use #F3F3F3
        return '#F3F3F3';
      }
      
      // Also check for any other blues, greens, reds, yellows, pinks that might be variations
      // Blues (various shades that might have been mapped)
      if (color.includes('7aa4d4') || color.includes('325a7e') || color.includes('6379ff') || 
          color.includes('0d5578') || color.includes('005277')) {
        // Darker blues → #75B0F5, lighter → #A7BFD2
        if (color.includes('325a7e') || color.includes('0d5578') || color.includes('005277') || 
            color.includes('6379ff') || color.includes('4a1a73')) {
          return '#75B0F5';
        }
        return '#A7BFD2';
      }
      
      // Greens
      if (color.includes('6a7d1a') || color.includes('6a8d6a') || color.includes('407d40') || 
          color.includes('3d9a5f') || color.includes('6f7504') || color.includes('61b361') ||
          color.includes('6f8a6f') || color.includes('48881e') || color.includes('74ab34')) {
        return '#A5D1AE';
      }
      
      // Reds
      if (color.includes('ff1a1a') || color.includes('750000') || color.includes('e03f3f') || 
          color.includes('f2262a') || color.includes('f54114') || color.includes('8e151a')) {
        return '#DE6352';
      }
      
      // Yellows/oranges
      if (color.includes('ff8a1a') || color.includes('ffff1a') || color.includes('f4d529') || 
          color.includes('fafe45') || color.includes('fbf99f') || color.includes('ffff8d')) {
        return '#EFD885';
      }
      
      // Pinks/lavenders
      if (color.includes('ffb8f5') || color.includes('f5b8f5') || color.includes('ffe0ff') || 
          color.includes('d299c6') || color.includes('ffb8f2') || color.includes('f98ea') ||
          color.includes('ffc6dd') || color.includes('fcafba')) {
        return '#F3BDED';
      }
      
      // Purples
      if (color.includes('d4b3ff') || color.includes('ecb8f6')) {
        return '#ECB8F6';
      }
      
      // Default: return original color if no match
      return originalColor;
    };
    
    // Apply color mapping to Default structure (keep exact same positions and opacities)
    const custom11Gradients = defaultSet.gradientStops.map((gradient) => {
      return gradient.map((stop) => {
        return {
          ...stop,
          color: mapColor(stop.color)
        };
      });
    });
    
    setEditableGradients(custom11Gradients);
    setSelectedColorSet('Custom-11');
    // Enable all gradients (same count as Default - 9 gradients)
    setEnabledGradients(Array(9).fill(true));
    // Set blend mode to normal (source-over) - same as Default
    updateConfig('blendMode', 'source-over');
    // Set background color - same as Default
    setBackgroundColor('#EEEEEE');
    setSelectedPalette(null); // Clear any palette selection
  };

  // Function to apply Custom-12: Same structure as Custom-11 but with updated blue and purple
  const applyCustom12 = () => {
    // Get the Default color set structure (same base as Custom-11)
    const defaultSet = colorSets['Default'];
    if (!defaultSet || !defaultSet.gradientStops) {
      console.error('Default color set not found');
      return;
    }
    
    // Helper function to map colors from Custom-11 to Custom-12
    // Only changes: dark blue #75B0F5 → #214DFD, purple #ECB8F6 → #BB9BFB
    const mapColor = (originalColor) => {
      const color = originalColor.toLowerCase();
      
      // Keep white as white
      if (color === '#ffffff' || color === '#ffffff') {
        return '#ffffff';
      }
      
      // Map dark blue: #75B0F5 (Custom-11) → #214DFD (Custom-12)
      if (color === '#75b0f5' || color.includes('75b0f5')) {
        return '#214DFD';
      }
      // Also map the original blue that Custom-11 replaced
      if (color === '#4891ea' || color.includes('4891ea')) {
        return '#214DFD';
      }
      
      // Map purple: #ECB8F6 (Custom-11) → #BB9BFB (Custom-12)
      if (color === '#ecb8f6' || color.includes('ecb8f6')) {
        return '#BB9BFB';
      }
      
      // Map light blue: #D1EDFF → #A7BFD2 (same as Custom-11)
      if (color === '#d1edff' || color.includes('d1edff')) {
        return '#A7BFD2';
      }
      
      // Map greens: #d1ff39 → #A5D1AE (same as Custom-11)
      if (color === '#d1ff39' || color.includes('d1ff39')) {
        return '#A5D1AE';
      }
      
      // Map reds: #FB5558 → #DE6352 (same as Custom-11)
      if (color === '#fb5558' || color.includes('fb5558')) {
        return '#DE6352';
      }
      
      // Map yellows: #FFED8A → #EFD885 (same as Custom-11)
      if (color === '#ffed8a' || color.includes('ffed8a')) {
        return '#EFD885';
      }
      
      // Map pinks: #FFB8F2 → #F3BDED (same as Custom-11)
      if (color === '#ffb8f2' || color.includes('ffb8f2')) {
        return '#F3BDED';
      }
      
      // Map light grays
      if (color.includes('f3f3f3') || color.includes('d9d9d9') || color.includes('bababa')) {
        return '#F3F3F3';
      }
      
      // Also check for any other blues, greens, reds, yellows, pinks that might be variations
      // Blues (various shades)
      if (color.includes('7aa4d4') || color.includes('325a7e') || color.includes('6379ff') || 
          color.includes('0d5578') || color.includes('005277')) {
        // Darker blues → #214DFD (new dark blue)
        if (color.includes('325a7e') || color.includes('0d5578') || color.includes('005277') || 
            color.includes('6379ff') || color.includes('4a1a73')) {
          return '#214DFD';
        }
        // Lighter blues → #A7BFD2 (same as Custom-11)
        return '#A7BFD2';
      }
      
      // Greens
      if (color.includes('6a7d1a') || color.includes('6a8d6a') || color.includes('407d40') || 
          color.includes('3d9a5f') || color.includes('6f7504') || color.includes('61b361') ||
          color.includes('6f8a6f') || color.includes('48881e') || color.includes('74ab34')) {
        return '#A5D1AE';
      }
      
      // Reds
      if (color.includes('ff1a1a') || color.includes('750000') || color.includes('e03f3f') || 
          color.includes('f2262a') || color.includes('f54114') || color.includes('8e151a')) {
        return '#DE6352';
      }
      
      // Yellows/oranges
      if (color.includes('ff8a1a') || color.includes('ffff1a') || color.includes('f4d529') || 
          color.includes('fafe45') || color.includes('fbf99f') || color.includes('ffff8d')) {
        return '#EFD885';
      }
      
      // Pinks/lavenders
      if (color.includes('ffb8f5') || color.includes('f5b8f5') || color.includes('ffe0ff') || 
          color.includes('d299c6') || color.includes('ffb8f2') || color.includes('f98ea') ||
          color.includes('ffc6dd') || color.includes('fcafba')) {
        return '#F3BDED';
      }
      
      // Purples (map to new purple)
      if (color.includes('d4b3ff') || color.includes('ecb8f6')) {
        return '#BB9BFB';
      }
      
      // Default: return original color if no match
      return originalColor;
    };
    
    // Apply color mapping to Default structure (keep exact same positions and opacities)
    const custom12Gradients = defaultSet.gradientStops.map((gradient) => {
      return gradient.map((stop) => {
        return {
          ...stop,
          color: mapColor(stop.color)
        };
      });
    });
    
    setEditableGradients(custom12Gradients);
    setSelectedColorSet('Custom-12');
    // Enable all gradients (same count as Default - 9 gradients)
    setEnabledGradients(Array(9).fill(true));
    // Set blend mode to normal (source-over) - same as Default
    updateConfig('blendMode', 'source-over');
    // Set background color - same as Default
    setBackgroundColor('#EEEEEE');
    setSelectedPalette(null); // Clear any palette selection
  };

  // Function to apply a color palette to all gradients
  const applyColorPalette = (paletteName) => {
    const palette = colorPalettes[paletteName];
    if (!palette || palette.length === 0) return;

    setEditableGradients(prev => {
      return prev.map((gradient, gradientIndex) => {
        // Distribute palette colors across the gradient stops
        // Keep the positions and opacity, but update colors
        const sortedStops = [...gradient].sort((a, b) => a.position - b.position);
        
        return sortedStops.map((stop, stopIndex) => {
          // Calculate which palette color to use based on position
          // Map stop position (0-1) to palette index
          const paletteIndex = Math.floor((stop.position * (palette.length - 1)) % palette.length);
          const nextPaletteIndex = Math.min(paletteIndex + 1, palette.length - 1);
          
          // Interpolate between two palette colors based on position
          const localPosition = (stop.position * (palette.length - 1)) % 1;
          const color1 = palette[paletteIndex];
          const color2 = palette[nextPaletteIndex];
          
          // Simple interpolation - you could use the interpolateColor function here
          let newColor = color1;
          if (localPosition > 0.1 && palette.length > 1) {
            // Blend between colors
            const hexToRgb = (hex) => {
              const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
              return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
              } : null;
            };
            const rgbToHex = (r, g, b) => {
              return "#" + [r, g, b].map(x => {
                const hex = Math.round(x).toString(16);
                return hex.length === 1 ? "0" + hex : hex;
              }).join("");
            };
            const rgb1 = hexToRgb(color1);
            const rgb2 = hexToRgb(color2);
            if (rgb1 && rgb2) {
              const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * localPosition);
              const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * localPosition);
              const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * localPosition);
              newColor = rgbToHex(r, g, b);
            }
          } else {
            newColor = color1;
          }
          
          return {
            ...stop,
            color: newColor
          };
        });
      });
    });
  };

  // Define color sets - each set contains 8 gradients (color palettes + gradient stops)
  const colorSets = {
    'Color Set A': {
      colorPalette: [
        ['#050a2e', '#004466', '#b8edff'],
        ['#0e3510', '#556812', '#f9a4ed'],
        ['#ffa200', '#f4ff5c', '#FFFF99'],
        ['#0d351c', '#5d6303', '#DDA0DD'],
        ['#992900', '#ffe747', '#fffef5'],
        ['#2e2905', '#8eecd9', '#B0E0E6'],
        ['#0a4461', '#ffccf4', '#ffccf4'],
        ['#610000', '#ff7300', '#FFFF00']
      ],
      gradientStops: [
        { stop1: 0, stop2: 0.27520435967302453, stop3: 0.670299727520436 },
        { stop1: 0, stop2: 0.1, stop3: 0.508628519527702 },
        { stop1: 0, stop2: 0.3224341507720254, stop3: 1 },
        { stop1: 0, stop2: 0.18528610354223432, stop3: 0.5 },
        { stop1: 0, stop2: 0.3478655767484105, stop3: 1 },
        { stop1: 0, stop2: 0.1880108991825613, stop3: 0.5367847411444142 },
        { stop1: 0.1008174386920981, stop2: 0.3832879200726612, stop3: 0.6584922797456857 },
        { stop1: 0, stop2: 0.2710997442455243, stop3: 0.7148337595907929 }
      ]
    },
    'Color Set B': {
      // New format: array of gradient stop arrays
      gradientStops: [
        [
          { position: 0.09533898305084745, color: '#ffffff', opacity: 1 },
          { position: 0.1917372881355932, color: '#050a2e', opacity: 1 },
          { position: 0.388771186440678, color: '#004466', opacity: 0.7 },
          { position: 0.670299727520436, color: '#b8edff', opacity: 0 }
        ],
        [
          { position: 0.11970338983050847, color: '#ffffff', opacity: 1 },
          { position: 0.13029661016949154, color: '#0d3510', opacity: 1 },
          { position: 0.30431425976385107, color: '#556812', opacity: 1 },
          { position: 0.508628519527702, color: '#f9a4ed', opacity: 0 }
        ],
        [
          { position: 0.11652542372881355, color: '#ffffff', opacity: 1 },
          { position: 0.1451271186440678, color: '#ffa202', opacity: 1 },
          { position: 0.6612170753860127, color: '#f4ff5c', opacity: 1 },
          { position: 1, color: '#FFFF99', opacity: 0 }
        ],
        [
          { position: 0.09957627118644068, color: '#ffffff', opacity: 1 },
          { position: 0.11546610169491525, color: '#0d351c', opacity: 1 },
          { position: 0.3707627118644068, color: '#5d6303', opacity: 1 },
          { position: 0.5, color: '#DDA0DD', opacity: 0 }
        ],
        [
          { position: 0.11122881355932203, color: '#ffffff', opacity: 1 },
          { position: 0.11758474576271187, color: '#992900', opacity: 1 },
          { position: 0.6739327883742052, color: '#ffe747', opacity: 1 },
          { position: 1, color: '#fffef5', opacity: 0 }
        ],
        [
          { position: 0.09533898305084745, color: '#ffffff', opacity: 1 },
          { position: 0.10063559322033898, color: '#2e2905', opacity: 1 },
          { position: 0.2913135593220339, color: '#8eecd9', opacity: 0.7 },
          { position: 0.5367847411444142, color: '#B0E0E6', opacity: 0 }
        ],
        [
          { position: 0.1008174386920981, color: '#ffffff', opacity: 1 },
          { position: 0.10805084745762712, color: '#0b4461', opacity: 1 },
          { position: 0.3832879200726612, color: '#ffccf4', opacity: 1 },
          { position: 0.6584922797456857, color: '#ffccf4', opacity: 0 }
        ],
        [
          { position: 0.09110169491525423, color: '#ffffff', opacity: 1 },
          { position: 0.1016949152542373, color: '#610000', opacity: 1 },
          { position: 0.2849576271186441, color: '#ff7300', opacity: 1 },
          { position: 0.8792372881355932, color: '#FFFF00', opacity: 0 }
        ]
      ]
    },
    'Color Set C': {
      // New format: array of gradient stop arrays
      gradientStops: [
        [
          { position: 0.06991525423728813, color: '#800033', opacity: 1 },
          { position: 0.15360169491525424, color: '#781b79', opacity: 1 },
          { position: 0.18008474576271186, color: '#3e51b1', opacity: 0.7 },
          { position: 0.2796610169491525, color: '#a6ddd7', opacity: 1 },
          { position: 0.6875, color: '#b8edff', opacity: 0 }
        ],
        [
          { position: 0.048728813559322036, color: '#ffdbbd', opacity: 1 },
          { position: 0.10699152542372882, color: '#c1e1c4', opacity: 1 },
          { position: 0.30431425976385107, color: '#e1f5f2', opacity: 1 },
          { position: 1, color: '#ffffff', opacity: 0 }
        ],
        [
          { position: 0.02754237288135593, color: '#ff99e9', opacity: 1 },
          { position: 0.1260593220338983, color: '#ffd1b8', opacity: 1 },
          { position: 0.3813559322033898, color: '#ffa55c', opacity: 1 },
          { position: 0.5540254237288136, color: '#f8ff94', opacity: 1 },
          { position: 1, color: '#FFFF99', opacity: 0 }
        ],
        [
          { position: 0.04025423728813559, color: '#ff5c5c', opacity: 1 },
          { position: 0.1461864406779661, color: '#6ba064', opacity: 1 },
          { position: 0.4385593220338983, color: '#ffc58f', opacity: 1 },
          { position: 1, color: '#DDA0DD', opacity: 0 }
        ],
        [
          { position: 0.0625, color: '#9e0028', opacity: 1 },
          { position: 0.11758474576271187, color: '#498cb6', opacity: 1 },
          { position: 0.3146186440677966, color: '#94c76b', opacity: 1 },
          { position: 0.6573093220338984, color: '#fff3a3', opacity: 1 },
          { position: 1, color: '#fffef5', opacity: 0 }
        ],
        [
          { position: 0.020127118644067795, color: '#14ff6e', opacity: 1 },
          { position: 0.10063559322033898, color: '#2e2905', opacity: 1 },
          { position: 0.2913135593220339, color: '#8eecd9', opacity: 0.7 },
          { position: 0.5367847411444142, color: '#B0E0E6', opacity: 0 }
        ],
        [
          { position: 0.015889830508474576, color: '#9effb1', opacity: 1 },
          { position: 0.11175847457627118, color: '#0b4461', opacity: 1 },
          { position: 0.2076271186440678, color: '#ff7575', opacity: 1 },
          { position: 0.3400423728813559, color: '#ffccd9', opacity: 0 }
        ],
        [
          { position: 0.01059322033898305, color: '#ff6161', opacity: 1 },
          { position: 0.1016949152542373, color: '#610000', opacity: 1 },
          { position: 0.2849576271186441, color: '#ff7300', opacity: 1 },
          { position: 0.8792372881355932, color: '#FFFF00', opacity: 0 }
        ]
      ]
    },
    'Color Set D': {
      // New format: array of gradient stop arrays
      gradientStops: [
        [
          { position: 0.06991525423728813, color: '#800033', opacity: 1 },
          { position: 0.15360169491525424, color: '#781b79', opacity: 1 },
          { position: 0.2309322033898305, color: '#a6ddd7', opacity: 1 },
          { position: 0.2309322033898305, color: '#3e51b1', opacity: 0.7 },
          { position: 0.3644067796610169, color: '#b8edff', opacity: 0 }
        ],
        [
          { position: 0.048728813559322036, color: '#ffdbbd', opacity: 1 },
          { position: 0.10699152542372882, color: '#c1e1c4', opacity: 1 },
          { position: 0.30431425976385107, color: '#e1f5f2', opacity: 1 },
          { position: 0.5995762711864406, color: '#ffffff', opacity: 0 }
        ],
        [
          { position: 0.02754237288135593, color: '#ff0aca', opacity: 1 },
          { position: 0.2701271186440678, color: '#ffd1b8', opacity: 1 },
          { position: 0.3813559322033898, color: '#ffa55c', opacity: 1 },
          { position: 0.4576271186440678, color: '#f8ff94', opacity: 1 },
          { position: 0.5338983050847458, color: '#FFFF99', opacity: 0 }
        ],
        [
          { position: 0.020127118644067795, color: '#14ff6e', opacity: 1 },
          { position: 0.10063559322033898, color: '#ffe524', opacity: 1 },
          { position: 0.2913135593220339, color: '#8eecd9', opacity: 0.7 },
          { position: 0.3898305084745763, color: '#4bff1a', opacity: 0 }
        ],
        [
          { position: 0.01059322033898305, color: '#ff6161', opacity: 1 },
          { position: 0.1016949152542373, color: '#610000', opacity: 1 },
          { position: 0.2923728813559322, color: '#ff7300', opacity: 1 },
          { position: 0.600635593220339, color: '#FFFF00', opacity: 0 }
        ],
        [
          { position: 0.06991525423728813, color: '#800033', opacity: 1 },
          { position: 0.15360169491525424, color: '#781b79', opacity: 1 },
          { position: 0.18008474576271186, color: '#3e51b1', opacity: 0.7 },
          { position: 0.2796610169491525, color: '#a6ddd7', opacity: 1 },
          { position: 0.6875, color: '#b8edff', opacity: 0 }
        ]
      ]
    },
    'Color Set E': {
      // New format: array of gradient stop arrays
      gradientStops: [
        [
          { position: 0, color: '#000000', opacity: 1 },
          { position: 0.27520435967302453, color: '#616161', opacity: 1 },
          { position: 0.670299727520436, color: '#9e9e9e', opacity: 0 }
        ],
        [
          { position: 0.09110169491525423, color: '#556812', opacity: 1 },
          { position: 0.12076271186440678, color: '#557756', opacity: 1 },
          { position: 0.508628519527702, color: '#f9a4ed', opacity: 0 }
        ],
        [
          { position: 0, color: '#ffa200', opacity: 1 },
          { position: 0.3224341507720254, color: '#f4ff5c', opacity: 1 },
          { position: 1, color: '#FFFF99', opacity: 0 }
        ],
        [
          { position: 0, color: '#318150', opacity: 1 },
          { position: 0.18528610354223432, color: '#5d6303', opacity: 1 },
          { position: 0.5, color: '#DDA0DD', opacity: 0 }
        ],
        [
          { position: 0, color: '#2e2905', opacity: 1 },
          { position: 0.1880108991825613, color: '#8a8a8a', opacity: 1 },
          { position: 0.5367847411444142, color: '#B0E0E6', opacity: 0 }
        ],
        [
          { position: 0.1008174386920981, color: '#0a4461', opacity: 1 },
          { position: 0.3832879200726612, color: '#ffccf4', opacity: 1 },
          { position: 0.6584922797456857, color: '#ffccf4', opacity: 0 }
        ],
        [
          { position: 0, color: '#610000', opacity: 1 },
          { position: 0.2710997442455243, color: '#ff7300', opacity: 1 },
          { position: 0.6684322033898306, color: '#FFFF00', opacity: 0 }
        ],
        [
          { position: 0, color: '#050a2e', opacity: 1 },
          { position: 0.27520435967302453, color: '#004466', opacity: 1 },
          { position: 0.670299727520436, color: '#b8edff', opacity: 0 }
        ],
        [
          { position: 0, color: '#000000', opacity: 1 },
          { position: 0.27520435967302453, color: '#616161', opacity: 1 },
          { position: 0.670299727520436, color: '#9e9e9e', opacity: 0 }
        ]
      ]
    },
    'Color Set F': {
      // New format: array of gradient stop arrays
      gradientStops: [
        [
          { position: 0.07097457627118645, color: '#ffffff', opacity: 1 },
          { position: 0.11016949152542373, color: '#212121', opacity: 1 },
          { position: 0.4727520435967303, color: '#616161', opacity: 1 },
          { position: 0.670299727520436, color: '#9e9e9e', opacity: 0 }
        ],
        [
          { position: 0.09110169491525423, color: '#556812', opacity: 1 },
          { position: 0.12076271186440678, color: '#557756', opacity: 1 },
          { position: 0.508628519527702, color: '#f9a4ed', opacity: 0 }
        ],
        [
          { position: 0.17690677966101695, color: '#29496b', opacity: 1 },
          { position: 0.19809322033898305, color: '#356935', opacity: 1 },
          { position: 0.4555084745762712, color: '#5d745d', opacity: 0 }
        ],
        [
          { position: 0, color: '#318150', opacity: 1 },
          { position: 0.18528610354223432, color: '#5d6303', opacity: 1 },
          { position: 0.5, color: '#DDA0DD', opacity: 0 }
        ],
        [
          { position: 0, color: '#ffffff', opacity: 1 },
          { position: 0.1880108991825613, color: '#4d4d4d', opacity: 1 },
          { position: 0.5367847411444142, color: '#4f4f4f', opacity: 0 }
        ],
        [
          { position: 0.1008174386920981, color: '#0a4461', opacity: 1 },
          { position: 0.3832879200726612, color: '#ffccf4', opacity: 1 },
          { position: 0.6584922797456857, color: '#ffccf4', opacity: 0 }
        ],
        [
          { position: 0, color: '#610000', opacity: 1 },
          { position: 0.2710997442455243, color: '#ff7300', opacity: 1 },
          { position: 0.6684322033898306, color: '#FFFF00', opacity: 0 }
        ],
        [
          { position: 0, color: '#050a2e', opacity: 1 },
          { position: 0.27520435967302453, color: '#004466', opacity: 1 },
          { position: 0.670299727520436, color: '#b8edff', opacity: 0 }
        ],
        [
          { position: 0, color: '#000000', opacity: 1 },
          { position: 0.27520435967302453, color: '#616161', opacity: 1 },
          { position: 0.670299727520436, color: '#9e9e9e', opacity: 0 }
        ],
        [
          { position: 0.07097457627118645, color: '#ffffff', opacity: 1 },
          { position: 0.11016949152542373, color: '#212121', opacity: 1 },
          { position: 0.4727520435967303, color: '#616161', opacity: 1 },
          { position: 0.670299727520436, color: '#9e9e9e', opacity: 0 }
        ]
      ]
    },
    'Color Set G': {
      // New format: array of gradient stop arrays
      gradientStops: [
        [
          { position: 0.09745762711864407, color: '#ffffff', opacity: 1 },
          { position: 0.11016949152542373, color: '#424242', opacity: 1 },
          { position: 0.24258474576271186, color: '#616161', opacity: 1 },
          { position: 0.670299727520436, color: '#9e9e9e', opacity: 0 }
        ],
        [
          { position: 0.09110169491525423, color: '#556812', opacity: 1 },
          { position: 0.12076271186440678, color: '#557756', opacity: 1 },
          { position: 0.508628519527702, color: '#f9a4ed', opacity: 0 }
        ],
        [
          { position: 0.06779661016949153, color: '#638bb6', opacity: 1 },
          { position: 0.09322033898305085, color: '#28496b', opacity: 1 },
          { position: 0.1048728813559322, color: '#356935', opacity: 1 },
          { position: 0.4555084745762712, color: '#5d745d', opacity: 0 }
        ],
        [
          { position: 0, color: '#318150', opacity: 1 },
          { position: 0.18528610354223432, color: '#5d6303', opacity: 1 },
          { position: 0.5, color: '#DDA0DD', opacity: 0 }
        ],
        [
          { position: 0, color: '#ffffff', opacity: 1 },
          { position: 0.1880108991825613, color: '#4d4d4d', opacity: 1 },
          { position: 0.5367847411444142, color: '#4f4f4f', opacity: 0 }
        ],
        [
          { position: 0.1008174386920981, color: '#0a4461', opacity: 1 },
          { position: 0.3832879200726612, color: '#ffccf4', opacity: 1 },
          { position: 0.6584922797456857, color: '#ffccf4', opacity: 0 }
        ],
        [
          { position: 0.024364406779661018, color: '#ff0000', opacity: 1 },
          { position: 0.03072033898305085, color: '#610000', opacity: 1 },
          { position: 0.17796610169491525, color: '#ff7300', opacity: 1 },
          { position: 0.551906779661017, color: '#FFFF00', opacity: 0 }
        ],
        [
          { position: 0.0423728813559322, color: '#5266ff', opacity: 1 },
          { position: 0.06779661016949153, color: '#050a2e', opacity: 1 },
          { position: 0.23728813559322035, color: '#004466', opacity: 1 },
          { position: 0.4502118644067797, color: '#b8edff', opacity: 0 }
        ],
        [
          { position: 0, color: '#000000', opacity: 1 },
          { position: 0.27520435967302453, color: '#616161', opacity: 1 },
          { position: 0.670299727520436, color: '#9e9e9e', opacity: 0 }
        ],
        [
          { position: 0.07097457627118645, color: '#ffffff', opacity: 1 },
          { position: 0.11016949152542373, color: '#212121', opacity: 1 },
          { position: 0.4727520435967303, color: '#616161', opacity: 1 },
          { position: 0.670299727520436, color: '#9e9e9e', opacity: 0 }
        ],
        [
          { position: 0.026483050847457626, color: '#ffffff', opacity: 1 },
          { position: 0.028601694915254237, color: '#c03535', opacity: 1 },
          { position: 0.3199152542372881, color: '#b082ad', opacity: 1 },
          { position: 0.670299727520436, color: '#b082ad', opacity: 0 }
        ]
      ]
    },
    'Color Set H': {
      // New format: array of gradient stop arrays
      gradientStops: [
        [
          { position: 0.09745762711864407, color: '#ffffff', opacity: 1 },
          { position: 0.11016949152542373, color: '#bababa', opacity: 1 },
          { position: 0.24258474576271186, color: '#ffffff', opacity: 1 },
          { position: 0.4014830508474576, color: '#ffffff', opacity: 0 }
        ],
        [
          { position: 0.09110169491525423, color: '#556812', opacity: 1 },
          { position: 0.12076271186440678, color: '#557756', opacity: 1 },
          { position: 0.508628519527702, color: '#f9a4ed', opacity: 0 }
        ],
        [
          { position: 0.06779661016949153, color: '#638bb6', opacity: 1 },
          { position: 0.09322033898305085, color: '#28496b', opacity: 1 },
          { position: 0.1048728813559322, color: '#356935', opacity: 1 },
          { position: 0.4555084745762712, color: '#5d745d', opacity: 0 }
        ],
        [
          { position: 0, color: '#318150', opacity: 1 },
          { position: 0.18528610354223432, color: '#5d6303', opacity: 1 },
          { position: 0.5, color: '#DDA0DD', opacity: 0 }
        ],
        [
          { position: 0, color: '#ffffff', opacity: 1 },
          { position: 0.1880108991825613, color: '#bfa0ee', opacity: 1 },
          { position: 0.5805084745762712, color: '#d9d9d9', opacity: 0 }
        ],
        [
          { position: 0.1008174386920981, color: '#0a4461', opacity: 1 },
          { position: 0.3220338983050847, color: '#ffccf4', opacity: 1 },
          { position: 0.4608050847457627, color: '#ffccf4', opacity: 0 }
        ],
        [
          { position: 0.024364406779661018, color: '#ff0000', opacity: 1 },
          { position: 0.03072033898305085, color: '#610000', opacity: 1 },
          { position: 0.17796610169491525, color: '#ff7300', opacity: 1 },
          { position: 0.551906779661017, color: '#FFFF00', opacity: 0 }
        ],
        [
          { position: 0.0423728813559322, color: '#5266ff', opacity: 1 },
          { position: 0.06779661016949153, color: '#3e1560', opacity: 1 },
          { position: 0.19385593220338984, color: '#004466', opacity: 0.7 },
          { position: 0.388771186440678, color: '#b8edff', opacity: 0 }
        ],
        [
          { position: 0, color: '#000000', opacity: 1 },
          { position: 0.27520435967302453, color: '#616161', opacity: 1 },
          { position: 0.670299727520436, color: '#9e9e9e', opacity: 0 }
        ],
        [
          { position: 0.07097457627118645, color: '#ffffff', opacity: 1 },
          { position: 0.11016949152542373, color: '#212121', opacity: 1 },
          { position: 0.3103813559322034, color: '#bfbfbf', opacity: 1 },
          { position: 0.475635593220339, color: '#ffffff', opacity: 0 }
        ],
        [
          { position: 0.026483050847457626, color: '#ffffff', opacity: 1 },
          { position: 0.028601694915254237, color: '#c03535', opacity: 1 },
          { position: 0.3199152542372881, color: '#b082ad', opacity: 1 },
          { position: 0.670299727520436, color: '#b082ad', opacity: 0 }
        ]
      ]
    },
    'Color Set I': {
      // New format: array of gradient stop arrays
      gradientStops: [
        [
          { position: 0, color: '#243dff', opacity: 1 },
          { position: 0.27520435967302453, color: '#cce4ef', opacity: 1 },
          { position: 0.670299727520436, color: '#b8edff', opacity: 0 }
        ],
        [
          { position: 0, color: '#ffa200', opacity: 1 },
          { position: 0.3224341507720254, color: '#f4ff5c', opacity: 1 },
          { position: 1, color: '#FFFF99', opacity: 0 }
        ],
        [
          { position: 0, color: '#751071', opacity: 1 },
          { position: 0.18528610354223432, color: '#ff859d', opacity: 1 },
          { position: 0.5, color: '#DDA0DD', opacity: 0 }
        ],
        [
          { position: 0, color: '#992900', opacity: 1 },
          { position: 0.3478655767484105, color: '#ffe747', opacity: 1 },
          { position: 1, color: '#fffef5', opacity: 0 }
        ],
        [
          { position: 0, color: '#3874ff', opacity: 1 },
          { position: 0.1880108991825613, color: '#8eecd9', opacity: 1 },
          { position: 0.5367847411444142, color: '#B0E0E6', opacity: 0 }
        ],
        [
          { position: 0.1008174386920981, color: '#ff2424', opacity: 1 },
          { position: 0.3832879200726612, color: '#ffccf4', opacity: 1 },
          { position: 0.6584922797456857, color: '#ffccf4', opacity: 0 }
        ]
      ]
    },
    'Color Set J': {
      // New format: array of gradient stop arrays
      gradientStops: [
        [
          { position: 0.09745762711864407, color: '#ffffff', opacity: 1 },
          { position: 0.11016949152542373, color: '#bababa', opacity: 1 },
          { position: 0.24258474576271186, color: '#ffffff', opacity: 1 },
          { position: 0.4014830508474576, color: '#ffffff', opacity: 0 }
        ],
        [
          { position: 0.09110169491525423, color: '#556812', opacity: 1 },
          { position: 0.12076271186440678, color: '#557756', opacity: 1 },
          { position: 0.508628519527702, color: '#f9a4ed', opacity: 0 }
        ],
        [
          { position: 0.06779661016949153, color: '#638bb6', opacity: 1 },
          { position: 0.09322033898305085, color: '#28496b', opacity: 1 },
          { position: 0.1048728813559322, color: '#356935', opacity: 1 },
          { position: 0.4555084745762712, color: '#5d745d', opacity: 0 }
        ],
        [
          { position: 0, color: '#318150', opacity: 1 },
          { position: 0.18528610354223432, color: '#5d6303', opacity: 1 },
          { position: 0.5, color: '#DDA0DD', opacity: 0 }
        ],
        [
          { position: 0, color: '#ffffff', opacity: 1 },
          { position: 0.1880108991825613, color: '#bfa0ee', opacity: 1 },
          { position: 0.5805084745762712, color: '#d9d9d9', opacity: 0 }
        ],
        [
          { position: 0.1008174386920981, color: '#0a4461', opacity: 1 },
          { position: 0.3220338983050847, color: '#ffccf4', opacity: 1 },
          { position: 0.4608050847457627, color: '#ffccf4', opacity: 0 }
        ],
        [
          { position: 0.024364406779661018, color: '#ff0000', opacity: 1 },
          { position: 0.03072033898305085, color: '#610000', opacity: 1 },
          { position: 0.17796610169491525, color: '#ff7300', opacity: 1 },
          { position: 0.551906779661017, color: '#FFFF00', opacity: 0 }
        ],
        [
          { position: 0.0423728813559322, color: '#5266ff', opacity: 1 },
          { position: 0.06779661016949153, color: '#3e1560', opacity: 1 },
          { position: 0.19385593220338984, color: '#004466', opacity: 0.7 },
          { position: 0.388771186440678, color: '#b8edff', opacity: 0 }
        ],
        [
          { position: 0.026483050847457626, color: '#ffffff', opacity: 1 },
          { position: 0.028601694915254237, color: '#c03535', opacity: 1 },
          { position: 0.3199152542372881, color: '#b082ad', opacity: 1 },
          { position: 0.670299727520436, color: '#b082ad', opacity: 0 }
        ]
      ]
    },
    'Color Set 7': {
      gradientStops: [
        [
          { position: 0.09745762711864407, color: "#ffffff", opacity: 1 },
          { position: 0.11016949152542373, color: "#bababa", opacity: 1 },
          { position: 0.24258474576271186, color: "#ffffff", opacity: 1 },
          { position: 0.4014830508474576, color: "#ffffff", opacity: 0 }
        ],
        [
          { position: 0.09110169491525423, color: "#556812", opacity: 1 },
          { position: 0.12076271186440678, color: "#557756", opacity: 1 },
          { position: 0.508628519527702, color: "#f9a4ed", opacity: 0 }
        ],
        [
          { position: 0.06779661016949153, color: "#638bb6", opacity: 1 },
          { position: 0.09322033898305085, color: "#28496b", opacity: 1 },
          { position: 0.1048728813559322, color: "#356935", opacity: 1 },
          { position: 0.4555084745762712, color: "#5d745d", opacity: 0 }
        ],
        [
          { position: 0, color: "#318150", opacity: 1 },
          { position: 0.18528610354223432, color: "#5d6303", opacity: 1 },
          { position: 0.5, color: "#DDA0DD", opacity: 0 }
        ],
        [
          { position: 0, color: "#ffffff", opacity: 1 },
          { position: 0.1880108991825613, color: "#bfa0ee", opacity: 1 },
          { position: 0.5805084745762712, color: "#d9d9d9", opacity: 0 }
        ],
        [
          { position: 0.1008174386920981, color: "#0a4461", opacity: 1 },
          { position: 0.3220338983050847, color: "#ffccf4", opacity: 1 },
          { position: 0.4608050847457627, color: "#ffccf4", opacity: 0 }
        ],
        [
          { position: 0.024364406779661018, color: "#ff0000", opacity: 1 },
          { position: 0.03072033898305085, color: "#610000", opacity: 1 },
          { position: 0.17796610169491525, color: "#ff7300", opacity: 1 },
          { position: 0.551906779661017, color: "#FFFF00", opacity: 0 }
        ],
        [
          { position: 0.0423728813559322, color: "#5266ff", opacity: 1 },
          { position: 0.06779661016949153, color: "#3e1560", opacity: 1 },
          { position: 0.19385593220338984, color: "#004466", opacity: 0.7 },
          { position: 0.388771186440678, color: "#b8edff", opacity: 0 }
        ],
        [
          { position: 0.026483050847457626, color: "#ffffff", opacity: 1 },
          { position: 0.028601694915254237, color: "#c03535", opacity: 1 },
          { position: 0.3199152542372881, color: "#b082ad", opacity: 1 },
          { position: 0.670299727520436, color: "#b082ad", opacity: 0 }
        ]
      ]
    },
    'Color Set K': {
      // New format: array of gradient stop arrays
      gradientStops: [
        [
          { position: 0.09745762711864407, color: '#ffffff', opacity: 1 },
          { position: 0.11016949152542373, color: '#bababa', opacity: 1 },
          { position: 0.24258474576271186, color: '#ffffff', opacity: 1 },
          { position: 0.4014830508474576, color: '#ffffff', opacity: 0 }
        ],
        [
          { position: 0.09110169491525423, color: '#556812', opacity: 1 },
          { position: 0.12076271186440678, color: '#557756', opacity: 1 },
          { position: 0.508628519527702, color: '#f9a4ed', opacity: 0 }
        ],
        [
          { position: 0.06779661016949153, color: '#638bb6', opacity: 1 },
          { position: 0.09322033898305085, color: '#28496b', opacity: 1 },
          { position: 0.1048728813559322, color: '#356935', opacity: 1 },
          { position: 0.4555084745762712, color: '#5d745d', opacity: 0 }
        ],
        [
          { position: 0, color: '#318150', opacity: 1 },
          { position: 0.18528610354223432, color: '#5d6303', opacity: 1 },
          { position: 0.5, color: '#DDA0DD', opacity: 0 }
        ],
        [
          { position: 0, color: '#ffffff', opacity: 1 },
          { position: 0.1880108991825613, color: '#bfa0ee', opacity: 1 },
          { position: 0.5805084745762712, color: '#d9d9d9', opacity: 0 }
        ],
        [
          { position: 0.1008174386920981, color: '#0a4461', opacity: 1 },
          { position: 0.3220338983050847, color: '#ffccf4', opacity: 1 },
          { position: 0.4608050847457627, color: '#ffccf4', opacity: 0 }
        ],
        [
          { position: 0.024364406779661018, color: '#ff0000', opacity: 1 },
          { position: 0.03072033898305085, color: '#610000', opacity: 1 },
          { position: 0.17796610169491525, color: '#ff7300', opacity: 1 },
          { position: 0.551906779661017, color: '#FFFF00', opacity: 0 }
        ],
        [
          { position: 0.0423728813559322, color: '#5266ff', opacity: 1 },
          { position: 0.06779661016949153, color: '#3e1560', opacity: 1 },
          { position: 0.19385593220338984, color: '#004466', opacity: 0.7 },
          { position: 0.388771186440678, color: '#b8edff', opacity: 0 }
        ],
        [
          { position: 0.026483050847457626, color: '#ffffff', opacity: 1 },
          { position: 0.028601694915254237, color: '#c03535', opacity: 1 },
          { position: 0.3199152542372881, color: '#b082ad', opacity: 1 },
          { position: 0.670299727520436, color: '#b082ad', opacity: 0 }
        ]
      ]
    },
    'Color Set L': {
      // New format: array of gradient stop arrays
      gradientStops: [
        [
          { position: 0.09745762711864407, color: '#ffffff', opacity: 1 },
          { position: 0.11016949152542373, color: '#bababa', opacity: 1 },
          { position: 0.24258474576271186, color: '#ffffff', opacity: 1 },
          { position: 0.4014830508474576, color: '#ffffff', opacity: 0 }
        ],
        [
          { position: 0.09110169491525423, color: '#556812', opacity: 1 },
          { position: 0.12076271186440678, color: '#557756', opacity: 1 },
          { position: 0.508628519527702, color: '#f9a4ed', opacity: 0 }
        ],
        [
          { position: 0.06779661016949153, color: '#638bb6', opacity: 1 },
          { position: 0.09322033898305085, color: '#28496b', opacity: 1 },
          { position: 0.1048728813559322, color: '#5e6935', opacity: 1 },
          { position: 0.4555084745762712, color: '#6a745d', opacity: 0 }
        ],
        [
          { position: 0, color: '#318150', opacity: 1 },
          { position: 0.18528610354223432, color: '#5d6303', opacity: 1 },
          { position: 0.5, color: '#DDA0DD', opacity: 0 }
        ],
        [
          { position: 0, color: '#ffffff', opacity: 1 },
          { position: 0.10477299185098952, color: '#5f4e79', opacity: 1 },
          { position: 0.5805084745762712, color: '#d9d9d9', opacity: 0 }
        ],
        [
          { position: 0.1008174386920981, color: '#0a4461', opacity: 1 },
          { position: 0.3220338983050847, color: '#ffccf4', opacity: 1 },
          { position: 0.4608050847457627, color: '#ffccf4', opacity: 0 }
        ],
        [
          { position: 0.024364406779661018, color: '#ff0000', opacity: 1 },
          { position: 0.03072033898305085, color: '#610000', opacity: 1 },
          { position: 0.17796610169491525, color: '#ff7300', opacity: 1 },
          { position: 0.551906779661017, color: '#FFFF00', opacity: 0 }
        ],
        [
          { position: 0.0423728813559322, color: '#5266ff', opacity: 1 },
          { position: 0.06779661016949153, color: '#3e1560', opacity: 1 },
          { position: 0.19385593220338984, color: '#004466', opacity: 0.7 },
          { position: 0.388771186440678, color: '#b8edff', opacity: 0 }
        ],
        [
          { position: 0.026483050847457626, color: '#ffffff', opacity: 1 },
          { position: 0.028601694915254237, color: '#764c4c', opacity: 1 },
          { position: 0.220023282887078, color: '#593412', opacity: 1 },
          { position: 0.670299727520436, color: '#b082ad', opacity: 0 }
        ]
      ]
    },
    'Color Set M': {
      // New format: array of gradient stop arrays
      gradientStops: [
        [
          { position: 0.09745762711864407, color: '#ffffff', opacity: 1 },
          { position: 0.11016949152542373, color: '#bababa', opacity: 1 },
          { position: 0.24258474576271186, color: '#ffffff', opacity: 1 },
          { position: 0.4014830508474576, color: '#ffffff', opacity: 0 }
        ],
        [
          { position: 0.09110169491525423, color: '#556812', opacity: 1 },
          { position: 0.12076271186440678, color: '#557756', opacity: 1 },
          { position: 0.508628519527702, color: '#f9a4ed', opacity: 0 }
        ],
        [
          { position: 0.06779661016949153, color: '#638bb6', opacity: 1 },
          { position: 0.09322033898305085, color: '#28496b', opacity: 1 },
          { position: 0.1048728813559322, color: '#5e6935', opacity: 1 },
          { position: 0.4555084745762712, color: '#6a745d', opacity: 0 }
        ],
        [
          { position: 0, color: '#318150', opacity: 1 },
          { position: 0.18528610354223432, color: '#5d6303', opacity: 1 },
          { position: 0.5, color: '#DDA0DD', opacity: 0 }
        ],
        [
          { position: 0, color: '#ffffff', opacity: 1 },
          { position: 0.10477299185098952, color: '#5f4e79', opacity: 1 },
          { position: 0.5805084745762712, color: '#d9d9d9', opacity: 0 }
        ],
        [
          { position: 0.1008174386920981, color: '#0a4461', opacity: 1 },
          { position: 0.3220338983050847, color: '#ffccf4', opacity: 1 },
          { position: 0.4608050847457627, color: '#ffccf4', opacity: 0 }
        ],
        [
          { position: 0.024364406779661018, color: '#ff0000', opacity: 1 },
          { position: 0.03072033898305085, color: '#610000', opacity: 1 },
          { position: 0.17796610169491525, color: '#ff7300', opacity: 1 },
          { position: 0.551906779661017, color: '#FFFF00', opacity: 0 }
        ],
        [
          { position: 0.0423728813559322, color: '#5266ff', opacity: 1 },
          { position: 0.06779661016949153, color: '#3e1560', opacity: 1 },
          { position: 0.19385593220338984, color: '#004466', opacity: 0.7 },
          { position: 0.388771186440678, color: '#b8edff', opacity: 0 }
        ],
        [
          { position: 0.026483050847457626, color: '#ffffff', opacity: 1 },
          { position: 0.028601694915254237, color: '#764c4c', opacity: 1 },
          { position: 0.21420256111757857, color: '#522d31', opacity: 0.8 },
          { position: 0.4039580908032596, color: '#ffa575', opacity: 0 }
        ]
      ]
    },
    'Color Set N': {
      // New format: array of gradient stop arrays
      gradientStops: [
        [
          { position: 0.09745762711864407, color: '#ffffff', opacity: 1 },
          { position: 0.11016949152542373, color: '#bababa', opacity: 1 },
          { position: 0.24258474576271186, color: '#ffffff', opacity: 1 },
          { position: 0.4014830508474576, color: '#ffffff', opacity: 0 }
        ],
        [
          { position: 0.09110169491525423, color: '#556812', opacity: 1 },
          { position: 0.12076271186440678, color: '#557756', opacity: 1 },
          { position: 0.508628519527702, color: '#f9a4ed', opacity: 0 }
        ],
        [
          { position: 0.06779661016949153, color: '#638bb6', opacity: 1 },
          { position: 0.09322033898305085, color: '#28496b', opacity: 1 },
          { position: 0.1048728813559322, color: '#356935', opacity: 1 },
          { position: 0.4555084745762712, color: '#5d745d', opacity: 0 }
        ],
        [
          { position: 0, color: '#318150', opacity: 1 },
          { position: 0.18528610354223432, color: '#5d6303', opacity: 1 },
          { position: 0.5, color: '#DDA0DD', opacity: 0 }
        ],
        [
          { position: 0, color: '#ffffff', opacity: 1 },
          { position: 0.1880108991825613, color: '#bfa0ee', opacity: 1 },
          { position: 0.5805084745762712, color: '#d9d9d9', opacity: 0 }
        ],
        [
          { position: 0.1008174386920981, color: '#0a4461', opacity: 1 },
          { position: 0.2114256684985914, color: '#ffccf4', opacity: 1 },
          { position: 0.3220338983050847, color: '#ffccf4', opacity: 1 },
          { position: 0.4608050847457627, color: '#ffccf4', opacity: 0 }
        ],
        [
          { position: 0.24781181619256018, color: '#ffff75', opacity: 1 },
          { position: 0.31017505470459517, color: '#ff7300', opacity: 1 },
          { position: 0.35311816192560175, color: '#ff5900', opacity: 0.2 },
          { position: 0.4190371991247265, color: '#ff0000', opacity: 0 }
        ],
        [
          { position: 0.162472647702407, color: '#5266ff', opacity: 1 },
          { position: 0.16411378555798686, color: '#3e1560', opacity: 1 },
          { position: 0.19385593220338984, color: '#004466', opacity: 0.7 },
          { position: 0.388771186440678, color: '#b8edff', opacity: 0 }
        ],
        [
          { position: 0.026483050847457626, color: '#ffffff', opacity: 1 },
          { position: 0.028601694915254237, color: '#c03535', opacity: 1 },
          { position: 0.3199152542372881, color: '#b082ad', opacity: 1 },
          { position: 0.670299727520436, color: '#b082ad', opacity: 0 }
        ]
      ]
    },
    'Custom-1': {
      // New format: array of gradient stop arrays - exact arrangement from image
      gradientStops: [
        // Gradient 1: Pale sky blue outer → Brown-orange inner
        [
          { position: 0, color: '#C3F0FF', opacity: 1 },
          { position: 0.3, color: '#C3F0FF', opacity: 1 },
          { position: 0.7, color: '#CA7D00', opacity: 1 },
          { position: 1, color: '#CA7D00', opacity: 0 }
        ],
        // Gradient 2: Light pink outer → Vibrant red inner
        [
          { position: 0, color: '#FCAFBA', opacity: 1 },
          { position: 0.3, color: '#FCAFBA', opacity: 1 },
          { position: 0.7, color: '#FE5E40', opacity: 1 },
          { position: 1, color: '#FE5E40', opacity: 0 }
        ],
        // Gradient 3: Brown-orange outer → Bright yellow inner
        [
          { position: 0, color: '#CA7D00', opacity: 1 },
          { position: 0.3, color: '#CA7D00', opacity: 1 },
          { position: 0.7, color: '#FFFF8D', opacity: 1 },
          { position: 1, color: '#FFFF8D', opacity: 0 }
        ],
        // Gradient 4: Pale sky blue outer → Deep royal blue inner
        [
          { position: 0, color: '#C3F0FF', opacity: 1 },
          { position: 0.3, color: '#C3F0FF', opacity: 1 },
          { position: 0.7, color: '#022FCD', opacity: 1 },
          { position: 1, color: '#022FCD', opacity: 0 }
        ],
        // Gradient 5: Vibrant red outer → Bright yellow inner
        [
          { position: 0, color: '#FE5E40', opacity: 1 },
          { position: 0.3, color: '#FE5E40', opacity: 1 },
          { position: 0.7, color: '#FFFF8D', opacity: 1 },
          { position: 1, color: '#FFFF8D', opacity: 0 }
        ],
        // Gradient 6: Deep royal blue outer → Vibrant red-orange inner
        [
          { position: 0, color: '#022FCD', opacity: 1 },
          { position: 0.3, color: '#022FCD', opacity: 1 },
          { position: 0.7, color: '#FE5E40', opacity: 1 },
          { position: 1, color: '#FE5E40', opacity: 0 }
        ]
      ]
    },
    'Custom-2': {
      // New format: array of gradient stop arrays - exact arrangement from image
      gradientStops: [
        // Gradient 1: Light blue outer → Brown-orange inner
        [
          { position: 0, color: '#A4D2E1', opacity: 1 },
          { position: 0.3, color: '#A4D2E1', opacity: 1 },
          { position: 0.7, color: '#CA7D00', opacity: 1 },
          { position: 1, color: '#CA7D00', opacity: 0 }
        ],
        // Gradient 2: Light pink outer → Red inner
        [
          { position: 0, color: '#FCAFBA', opacity: 1 },
          { position: 0.3, color: '#FCAFBA', opacity: 1 },
          { position: 0.7, color: '#F7452F', opacity: 1 },
          { position: 1, color: '#F7452F', opacity: 0 }
        ],
        // Gradient 3: Brown-orange outer → Bright yellow inner
        [
          { position: 0, color: '#CA7D00', opacity: 1 },
          { position: 0.3, color: '#CA7D00', opacity: 1 },
          { position: 0.7, color: '#FFFF8D', opacity: 1 },
          { position: 1, color: '#FFFF8D', opacity: 0 }
        ],
        // Gradient 4: Light blue outer → White inner
        [
          { position: 0, color: '#A4D2E1', opacity: 1 },
          { position: 0.3, color: '#A4D2E1', opacity: 1 },
          { position: 0.7, color: '#FAFBFF', opacity: 1 },
          { position: 1, color: '#FAFBFF', opacity: 0 }
        ],
        // Gradient 5: Red outer → Bright yellow inner
        [
          { position: 0, color: '#F7452F', opacity: 1 },
          { position: 0.3, color: '#F7452F', opacity: 1 },
          { position: 0.7, color: '#FFFF8D', opacity: 1 },
          { position: 1, color: '#FFFF8D', opacity: 0 }
        ],
        // Gradient 6: White outer → Red inner
        [
          { position: 0, color: '#FAFBFF', opacity: 1 },
          { position: 0.3, color: '#FAFBFF', opacity: 1 },
          { position: 0.7, color: '#F7452F', opacity: 1 },
          { position: 1, color: '#F7452F', opacity: 0 }
        ]
      ]
    },
    'Custom-3': {
      // New format: array of gradient stop arrays - exact arrangement from image
      gradientStops: [
        // Gradient 1: Royal blue outer → Golden-brown inner
        [
          { position: 0, color: '#022FCD', opacity: 1 },
          { position: 0.3, color: '#022FCD', opacity: 1 },
          { position: 0.7, color: '#CA7D00', opacity: 1 },
          { position: 1, color: '#CA7D00', opacity: 0 }
        ],
        // Gradient 2: Dark teal outer → Pale yellow inner
        [
          { position: 0, color: '#005442', opacity: 1 },
          { position: 0.3, color: '#005442', opacity: 1 },
          { position: 0.7, color: '#FFFF8D', opacity: 1 },
          { position: 1, color: '#FFFF8D', opacity: 0 }
        ],
        // Gradient 3: Sky blue outer (halo) → Golden-brown inner
        [
          { position: 0, color: '#A4D2E1', opacity: 1 },
          { position: 0.3, color: '#A4D2E1', opacity: 1 },
          { position: 0.7, color: '#CA7D00', opacity: 1 },
          { position: 1, color: '#CA7D00', opacity: 0 }
        ],
        // Gradient 4: Dark teal outer → Light pink inner
        [
          { position: 0, color: '#005442', opacity: 1 },
          { position: 0.3, color: '#005442', opacity: 1 },
          { position: 0.7, color: '#FCAFBA', opacity: 1 },
          { position: 1, color: '#FCAFBA', opacity: 0 }
        ],
        // Gradient 5: Coral/reddish-orange outer → Golden-brown inner
        [
          { position: 0, color: '#FE5E40', opacity: 1 },
          { position: 0.3, color: '#FE5E40', opacity: 1 },
          { position: 0.7, color: '#CA7D00', opacity: 1 },
          { position: 1, color: '#CA7D00', opacity: 0 }
        ],
        // Gradient 6: Pale yellow outer → Royal blue inner
        [
          { position: 0, color: '#FFFF8D', opacity: 1 },
          { position: 0.3, color: '#FFFF8D', opacity: 1 },
          { position: 0.7, color: '#022FCD', opacity: 1 },
          { position: 1, color: '#022FCD', opacity: 0 }
        ]
      ]
    },
    'Custom-4': {
      // New format: array of gradient stop arrays - exact arrangement from image
      gradientStops: [
        // Gradient 1: Light pink outer → Dark gray inner (large circle)
        [
          { position: 0, color: '#FD98EA', opacity: 1 },
          { position: 0.3, color: '#FD98EA', opacity: 1 },
          { position: 0.7, color: '#797791', opacity: 1 },
          { position: 1, color: '#797791', opacity: 0 }
        ],
        // Gradient 2: Vibrant orange outer → Deep dark red inner (small circle)
        [
          { position: 0, color: '#FF5616', opacity: 1 },
          { position: 0.3, color: '#FF5616', opacity: 1 },
          { position: 0.7, color: '#8E151A', opacity: 1 },
          { position: 1, color: '#8E151A', opacity: 0 }
        ],
        // Gradient 3: Warm earthy brown outer → Bright solid blue inner (medium-large circle)
        [
          { position: 0, color: '#CA7D00', opacity: 1 },
          { position: 0.3, color: '#CA7D00', opacity: 1 },
          { position: 0.7, color: '#022FCD', opacity: 1 },
          { position: 1, color: '#022FCD', opacity: 0 }
        ],
        // Gradient 4: Muted green outer → Lighter vibrant green inner (medium circle)
        [
          { position: 0, color: '#013605', opacity: 1 },
          { position: 0.3, color: '#013605', opacity: 1 },
          { position: 0.7, color: '#74AB34', opacity: 1 },
          { position: 1, color: '#74AB34', opacity: 0 }
        ],
        // Gradient 5: Bright blue outer → Soft light pink inner (small circle)
        [
          { position: 0, color: '#022FCD', opacity: 1 },
          { position: 0.3, color: '#022FCD', opacity: 1 },
          { position: 0.7, color: '#FD98EA', opacity: 1 },
          { position: 1, color: '#FD98EA', opacity: 0 }
        ],
        // Gradient 6: Bold orange outer → Deep dark red inner (largest circle)
        [
          { position: 0, color: '#FF5616', opacity: 1 },
          { position: 0.3, color: '#FF5616', opacity: 1 },
          { position: 0.7, color: '#8E151A', opacity: 1 },
          { position: 1, color: '#8E151A', opacity: 0 }
        ]
      ]
    },
    'Custom-5': {
      // New format: array of gradient stop arrays - exact arrangement from image
      gradientStops: [
        // Gradient 1: Periwinkle blue outer → Light pastel green inner (large circle)
        [
          { position: 0, color: '#7098FA', opacity: 1 },
          { position: 0.3, color: '#7098FA', opacity: 1 },
          { position: 0.7, color: '#80EB91', opacity: 1 },
          { position: 1, color: '#80EB91', opacity: 0 }
        ],
        // Gradient 2: Light pink outer → Bright yellow inner (small circle)
        [
          { position: 0, color: '#FFC6DD', opacity: 1 },
          { position: 0.3, color: '#FFC6DD', opacity: 1 },
          { position: 0.7, color: '#FAFE45', opacity: 1 },
          { position: 1, color: '#FAFE45', opacity: 0 }
        ],
        // Gradient 3: Warm orange outer → Light pastel pink inner (very large circle)
        [
          { position: 0, color: '#FF8C4A', opacity: 1 },
          { position: 0.3, color: '#FF8C4A', opacity: 1 },
          { position: 0.7, color: '#FFC6DD', opacity: 1 },
          { position: 1, color: '#FFC6DD', opacity: 0 }
        ],
        // Gradient 4: Blue outer → Light pastel green inner (medium circle)
        [
          { position: 0, color: '#7098FA', opacity: 1 },
          { position: 0.3, color: '#7098FA', opacity: 1 },
          { position: 0.7, color: '#80EB91', opacity: 1 },
          { position: 1, color: '#80EB91', opacity: 0 }
        ],
        // Gradient 5: Yellow-green outer → Warm orange inner (small circle)
        [
          { position: 0, color: '#D4EF3B', opacity: 1 },
          { position: 0.3, color: '#D4EF3B', opacity: 1 },
          { position: 0.7, color: '#FF8C4A', opacity: 1 },
          { position: 1, color: '#FF8C4A', opacity: 0 }
        ],
        // Gradient 6: Blue outer → Blue inner (medium circle - using same blue as provided)
        [
          { position: 0, color: '#7098FA', opacity: 1 },
          { position: 0.3, color: '#7098FA', opacity: 1 },
          { position: 0.7, color: '#7098FA', opacity: 0.7 },
          { position: 1, color: '#7098FA', opacity: 0 }
        ],
        // Gradient 7: Light blue outer → Darker blue inner (large circle - using same blue with reduced opacity for darker effect)
        [
          { position: 0, color: '#7098FA', opacity: 1 },
          { position: 0.3, color: '#7098FA', opacity: 0.8 },
          { position: 0.7, color: '#7098FA', opacity: 0.5 },
          { position: 1, color: '#7098FA', opacity: 0 }
        ]
      ]
    },
    'Custom-6': {
      // New format: array of gradient stop arrays - exact arrangement from image
      gradientStops: [
        // Gradient 1: Orange/red outer → Light blue inner (light blue central with orange outer)
        [
          { position: 0, color: '#F2262A', opacity: 1 },
          { position: 0.3, color: '#F2262A', opacity: 1 },
          { position: 0.7, color: '#B7E5FF', opacity: 1 },
          { position: 1, color: '#B7E5FF', opacity: 0 }
        ],
        // Gradient 2: Light pink/whitish outer → Red inner (small red central with faint pink halo)
        [
          { position: 0, color: '#FAE5EF', opacity: 1 },
          { position: 0.3, color: '#FAE5EF', opacity: 0.5 },
          { position: 0.7, color: '#F2262A', opacity: 1 },
          { position: 1, color: '#F2262A', opacity: 0 }
        ],
        // Gradient 3: Royal blue outer → Light yellow inner (light yellow central with royal blue outer)
        [
          { position: 0, color: '#2E32FF', opacity: 1 },
          { position: 0.3, color: '#2E32FF', opacity: 1 },
          { position: 0.7, color: '#FBF99F', opacity: 1 },
          { position: 1, color: '#FBF99F', opacity: 0 }
        ],
        // Gradient 4: Light blue outer → Dark teal inner (dark teal central with light blue outer)
        [
          { position: 0, color: '#B7E5FF', opacity: 1 },
          { position: 0.3, color: '#B7E5FF', opacity: 1 },
          { position: 0.7, color: '#284D41', opacity: 1 },
          { position: 1, color: '#284D41', opacity: 0 }
        ],
        // Gradient 5: Red/orange outer → Dark brown inner (dark brown central with orange outer)
        [
          { position: 0, color: '#F2262A', opacity: 1 },
          { position: 0.3, color: '#F2262A', opacity: 1 },
          { position: 0.7, color: '#5E4E3A', opacity: 1 },
          { position: 1, color: '#5E4E3A', opacity: 0 }
        ],
        // Gradient 6: Light pink outer → Red inner (red central with large light pink outer)
        [
          { position: 0, color: '#FAE5EF', opacity: 1 },
          { position: 0.3, color: '#FAE5EF', opacity: 1 },
          { position: 0.7, color: '#F2262A', opacity: 1 },
          { position: 1, color: '#F2262A', opacity: 0 }
        ]
      ]
    },
    'Custom-7': {
      // New format: array of gradient stop arrays - exact arrangement from image
      gradientStops: [
        // Gradient 1: Dark olive green outer → Light lavender/pale purple inner (large circle)
        [
          { position: 0, color: '#013605', opacity: 1 },
          { position: 0.3, color: '#013605', opacity: 1 },
          { position: 0.7, color: '#FD98EA', opacity: 1 },
          { position: 1, color: '#FD98EA', opacity: 0 }
        ],
        // Gradient 2: Bright pink outer → Vibrant orange-red inner (small circle)
        [
          { position: 0, color: '#FD98EA', opacity: 1 },
          { position: 0.3, color: '#FD98EA', opacity: 1 },
          { position: 0.7, color: '#F54114', opacity: 1 },
          { position: 1, color: '#F54114', opacity: 0 }
        ],
        // Gradient 3: Golden-brown/light brown outer → Deep royal blue inner (large circle)
        [
          { position: 0, color: '#CA7D00', opacity: 1 },
          { position: 0.3, color: '#CA7D00', opacity: 1 },
          { position: 0.7, color: '#022FCD', opacity: 1 },
          { position: 1, color: '#022FCD', opacity: 0 }
        ],
        // Gradient 4: Green outer → Very dark blue/almost black inner (medium circle)
        [
          { position: 0, color: '#48881E', opacity: 1 },
          { position: 0.3, color: '#48881E', opacity: 1 },
          { position: 0.7, color: '#0E0033', opacity: 1 },
          { position: 1, color: '#0E0033', opacity: 0 }
        ],
        // Gradient 5: Coral/reddish-orange outer → Light pink inner (medium circle)
        [
          { position: 0, color: '#F54114', opacity: 1 },
          { position: 0.3, color: '#F54114', opacity: 1 },
          { position: 0.7, color: '#FD98EA', opacity: 1 },
          { position: 1, color: '#FD98EA', opacity: 0 }
        ],
        // Gradient 6: Dark forest green outer → Vibrant orange-red inner (large circle)
        [
          { position: 0, color: '#013605', opacity: 1 },
          { position: 0.3, color: '#013605', opacity: 1 },
          { position: 0.7, color: '#F54114', opacity: 1 },
          { position: 1, color: '#F54114', opacity: 0 }
        ]
      ]
    },
    'Custom-8': {
      // New format: array of gradient stop arrays - exact arrangement from image
      gradientStops: [
        // Gradient 1: Light purple/lavender outer → Light blue/gray-blue inner (smallest shape)
        [
          { position: 0, color: '#ffb8f2', opacity: 1 },
          { position: 0.3, color: '#ffb8f2', opacity: 1 },
          { position: 0.7, color: '#9fc1d6', opacity: 1 },
          { position: 1, color: '#9fc1d6', opacity: 0 }
        ],
        // Gradient 2: Light blue/gray-blue outer → Medium blue inner (large shape - blue gradient)
        [
          { position: 0, color: '#9fc1d6', opacity: 1 },
          { position: 0.3, color: '#9fc1d6', opacity: 0.9 },
          { position: 0.7, color: '#4891EA', opacity: 1 },
          { position: 1, color: '#4891EA', opacity: 0 }
        ],
        // Gradient 3: Yellow-green/chartreuse throughout (medium-large shape)
        [
          { position: 0, color: '#96b62d', opacity: 1 },
          { position: 0.3, color: '#96b62d', opacity: 1 },
          { position: 0.7, color: '#96b62d', opacity: 0.8 },
          { position: 1, color: '#96b62d', opacity: 0 }
        ],
        // Gradient 4: Light gray/off-white outer halo → Light pink/magenta inner (medium shape)
        [
          { position: 0, color: '#f3f3f3', opacity: 1 },
          { position: 0.3, color: '#f3f3f3', opacity: 1 },
          { position: 0.7, color: '#ffb8f2', opacity: 1 },
          { position: 1, color: '#ffb8f2', opacity: 0 }
        ],
        // Gradient 5: Bright yellow outer halo → Vibrant red inner (largest shape)
        [
          { position: 0, color: '#f4d529', opacity: 1 },
          { position: 0.3, color: '#f4d529', opacity: 1 },
          { position: 0.7, color: '#f2262A', opacity: 1 },
          { position: 1, color: '#f2262A', opacity: 0 }
        ]
      ]
    },
    'Custom-9': {
      // Color Set K adjusted for normal blending mode (compensates for soft-light removal)
      gradientStops: [
        [
          { position: 0.09745762711864407, color: '#ffffff', opacity: 1 },
          { position: 0.11016949152542373, color: '#bababa', opacity: 1 },
          { position: 0.24258474576271186, color: '#ffffff', opacity: 1 },
          { position: 0.4014830508474576, color: '#ffffff', opacity: 0 }
        ],
        [
          { position: 0.09110169491525423, color: '#6a7d1a', opacity: 1 },
          { position: 0.12076271186440678, color: '#6a8d6a', opacity: 1 },
          { position: 0.508628519527702, color: '#ffb8f5', opacity: 0 }
        ],
        [
          { position: 0.06779661016949153, color: '#7aa4d4', opacity: 1 },
          { position: 0.09322033898305085, color: '#325a7e', opacity: 1 },
          { position: 0.1048728813559322, color: '#407d40', opacity: 1 },
          { position: 0.4555084745762712, color: '#6f8a6f', opacity: 0 }
        ],
        [
          { position: 0, color: '#3d9a5f', opacity: 1 },
          { position: 0.18528610354223432, color: '#6f7504', opacity: 1 },
          { position: 0.5, color: '#f5b8f5', opacity: 0 }
        ],
        [
          { position: 0, color: '#ffffff', opacity: 1 },
          { position: 0.1880108991825613, color: '#d4b3ff', opacity: 1 },
          { position: 0.5805084745762712, color: '#d9d9d9', opacity: 0 }
        ],
        [
          { position: 0.1008174386920981, color: '#0d5578', opacity: 1 },
          { position: 0.3220338983050847, color: '#ffe0ff', opacity: 1 },
          { position: 0.4608050847457627, color: '#ffe0ff', opacity: 0 }
        ],
        [
          { position: 0.024364406779661018, color: '#ff1a1a', opacity: 1 },
          { position: 0.03072033898305085, color: '#750000', opacity: 1 },
          { position: 0.17796610169491525, color: '#ff8a1a', opacity: 1 },
          { position: 0.551906779661017, color: '#ffff1a', opacity: 0 }
        ],
        [
          { position: 0.0423728813559322, color: '#6379ff', opacity: 1 },
          { position: 0.06779661016949153, color: '#4a1a73', opacity: 1 },
          { position: 0.19385593220338984, color: '#005277', opacity: 0.7 },
          { position: 0.388771186440678, color: '#d4f5ff', opacity: 0 }
        ],
        [
          { position: 0.026483050847457626, color: '#ffffff', opacity: 1 },
          { position: 0.028601694915254237, color: '#e03f3f', opacity: 1 },
          { position: 0.3199152542372881, color: '#d299c6', opacity: 1 },
          { position: 0.670299727520436, color: '#d299c6', opacity: 0 }
        ]
      ]
    },
    'Default': {
      // Same as Custom-9 but with reduced opacity for softer appearance
      // Colors: #4891EA, #61b361, #9FC1D6, #F2262A, #F3F3F3, #F4D529, #FFB8F2
      // Opacity reduced to 60% of original for softer look
      gradientStops: [
        [
          { position: 0.09745762711864407, color: '#ffffff', opacity: 0.3 },
          { position: 0.11016949152542373, color: '#ffffff', opacity: 0.3 },
          { position: 0.24258474576271186, color: '#ffffff', opacity: 0.3 },
          { position: 0.4014830508474576, color: '#ffffff', opacity: 0 }
        ],
        [
          { position: 0.09110169491525423, color: '#6a7d1a', opacity: 0.6 },
          { position: 0.12076271186440678, color: '#6a8d6a', opacity: 0.6 },
          { position: 0.508628519527702, color: '#ffb8f5', opacity: 0 }
        ],
        [
          { position: 0.06779661016949153, color: '#7aa4d4', opacity: 0.6 },
          { position: 0.09322033898305085, color: '#325a7e', opacity: 0.6 },
          { position: 0.1048728813559322, color: '#407d40', opacity: 0.6 },
          { position: 0.4555084745762712, color: '#6f8a6f', opacity: 0 }
        ],
        [
          { position: 0, color: '#3d9a5f', opacity: 0.6 },
          { position: 0.18528610354223432, color: '#6f7504', opacity: 0.6 },
          { position: 0.5, color: '#f5b8f5', opacity: 0 }
        ],
        [
          { position: 0, color: '#ffffff', opacity: 0.6 },
          { position: 0.1880108991825613, color: '#d4b3ff', opacity: 0.6 },
          { position: 0.5805084745762712, color: '#d9d9d9', opacity: 0 }
        ],
        [
          { position: 0.1008174386920981, color: '#0d5578', opacity: 0.6 },
          { position: 0.3220338983050847, color: '#ffe0ff', opacity: 0.6 },
          { position: 0.4608050847457627, color: '#ffe0ff', opacity: 0 }
        ],
        [
          { position: 0.024364406779661018, color: '#ff1a1a', opacity: 0.6 },
          { position: 0.03072033898305085, color: '#750000', opacity: 0.6 },
          { position: 0.17796610169491525, color: '#ff8a1a', opacity: 0.6 },
          { position: 0.551906779661017, color: '#ffff1a', opacity: 0 }
        ],
        [
          { position: 0.0423728813559322, color: '#6379ff', opacity: 0.6 },
          { position: 0.06779661016949153, color: '#4a1a73', opacity: 0.6 },
          { position: 0.19385593220338984, color: '#005277', opacity: 0.42 },
          { position: 0.388771186440678, color: '#d4f5ff', opacity: 0 }
        ],
        [
          { position: 0.026483050847457626, color: '#ffffff', opacity: 0.6 },
          { position: 0.028601694915254237, color: '#e03f3f', opacity: 0.6 },
          { position: 0.3199152542372881, color: '#d299c6', opacity: 0.6 },
          { position: 0.670299727520436, color: '#d299c6', opacity: 0 }
        ]
      ]
    },
    'Custom-10': {
      // Same structure as Default - colors will be applied by applyCustom10 function
      // Using a copy of Default's structure
      gradientStops: [
        [
          { position: 0.09745762711864407, color: '#ffffff', opacity: 0.3 },
          { position: 0.11016949152542373, color: '#ffffff', opacity: 0.3 },
          { position: 0.24258474576271186, color: '#ffffff', opacity: 0.3 },
          { position: 0.4014830508474576, color: '#ffffff', opacity: 0 }
        ],
        [
          { position: 0.09110169491525423, color: '#6a7d1a', opacity: 0.6 },
          { position: 0.12076271186440678, color: '#6a8d6a', opacity: 0.6 },
          { position: 0.508628519527702, color: '#ffb8f5', opacity: 0 }
        ],
        [
          { position: 0.06779661016949153, color: '#7aa4d4', opacity: 0.6 },
          { position: 0.09322033898305085, color: '#325a7e', opacity: 0.6 },
          { position: 0.1048728813559322, color: '#407d40', opacity: 0.6 },
          { position: 0.4555084745762712, color: '#6f8a6f', opacity: 0 }
        ],
        [
          { position: 0, color: '#3d9a5f', opacity: 0.6 },
          { position: 0.18528610354223432, color: '#6f7504', opacity: 0.6 },
          { position: 0.5, color: '#f5b8f5', opacity: 0 }
        ],
        [
          { position: 0, color: '#ffffff', opacity: 0.6 },
          { position: 0.1880108991825613, color: '#d4b3ff', opacity: 0.6 },
          { position: 0.5805084745762712, color: '#d9d9d9', opacity: 0 }
        ],
        [
          { position: 0.1008174386920981, color: '#0d5578', opacity: 0.6 },
          { position: 0.3220338983050847, color: '#ffe0ff', opacity: 0.6 },
          { position: 0.4608050847457627, color: '#ffe0ff', opacity: 0 }
        ],
        [
          { position: 0.024364406779661018, color: '#ff1a1a', opacity: 0.6 },
          { position: 0.03072033898305085, color: '#750000', opacity: 0.6 },
          { position: 0.17796610169491525, color: '#ff8a1a', opacity: 0.6 },
          { position: 0.551906779661017, color: '#ffff1a', opacity: 0 }
        ],
        [
          { position: 0.0423728813559322, color: '#6379ff', opacity: 0.6 },
          { position: 0.06779661016949153, color: '#4a1a73', opacity: 0.6 },
          { position: 0.19385593220338984, color: '#005277', opacity: 0.42 },
          { position: 0.388771186440678, color: '#d4f5ff', opacity: 0 }
        ],
        [
          { position: 0.026483050847457626, color: '#ffffff', opacity: 0.6 },
          { position: 0.028601694915254237, color: '#e03f3f', opacity: 0.6 },
          { position: 0.3199152542372881, color: '#d299c6', opacity: 0.6 },
          { position: 0.670299727520436, color: '#d299c6', opacity: 0 }
        ]
      ]
    },
    'Custom-11': {
      // Same structure as Default - colors will be applied by applyCustom11 function
      gradientStops: [
        [
          { position: 0.09745762711864407, color: '#ffffff', opacity: 0.3 },
          { position: 0.11016949152542373, color: '#ffffff', opacity: 0.3 },
          { position: 0.24258474576271186, color: '#ffffff', opacity: 0.3 },
          { position: 0.4014830508474576, color: '#ffffff', opacity: 0 }
        ],
        [
          { position: 0.09110169491525423, color: '#6a7d1a', opacity: 0.6 },
          { position: 0.12076271186440678, color: '#6a8d6a', opacity: 0.6 },
          { position: 0.508628519527702, color: '#ffb8f5', opacity: 0 }
        ],
        [
          { position: 0.06779661016949153, color: '#7aa4d4', opacity: 0.6 },
          { position: 0.09322033898305085, color: '#325a7e', opacity: 0.6 },
          { position: 0.1048728813559322, color: '#407d40', opacity: 0.6 },
          { position: 0.4555084745762712, color: '#6f8a6f', opacity: 0 }
        ],
        [
          { position: 0, color: '#3d9a5f', opacity: 0.6 },
          { position: 0.18528610354223432, color: '#6f7504', opacity: 0.6 },
          { position: 0.5, color: '#f5b8f5', opacity: 0 }
        ],
        [
          { position: 0, color: '#ffffff', opacity: 0.6 },
          { position: 0.1880108991825613, color: '#d4b3ff', opacity: 0.6 },
          { position: 0.5805084745762712, color: '#d9d9d9', opacity: 0 }
        ],
        [
          { position: 0.1008174386920981, color: '#0d5578', opacity: 0.6 },
          { position: 0.3220338983050847, color: '#ffe0ff', opacity: 0.6 },
          { position: 0.4608050847457627, color: '#ffe0ff', opacity: 0 }
        ],
        [
          { position: 0.024364406779661018, color: '#ff1a1a', opacity: 0.6 },
          { position: 0.03072033898305085, color: '#750000', opacity: 0.6 },
          { position: 0.17796610169491525, color: '#ff8a1a', opacity: 0.6 },
          { position: 0.551906779661017, color: '#ffff1a', opacity: 0 }
        ],
        [
          { position: 0.0423728813559322, color: '#6379ff', opacity: 0.6 },
          { position: 0.06779661016949153, color: '#4a1a73', opacity: 0.6 },
          { position: 0.19385593220338984, color: '#005277', opacity: 0.42 },
          { position: 0.388771186440678, color: '#d4f5ff', opacity: 0 }
        ],
        [
          { position: 0.026483050847457626, color: '#ffffff', opacity: 0.6 },
          { position: 0.028601694915254237, color: '#e03f3f', opacity: 0.6 },
          { position: 0.3199152542372881, color: '#d299c6', opacity: 0.6 },
          { position: 0.670299727520436, color: '#d299c6', opacity: 0 }
        ]
      ]
    },
    'Custom-12': {
      // Same structure as Default - colors will be applied by applyCustom12 function
      gradientStops: [
        [
          { position: 0.09745762711864407, color: '#ffffff', opacity: 0.3 },
          { position: 0.11016949152542373, color: '#ffffff', opacity: 0.3 },
          { position: 0.24258474576271186, color: '#ffffff', opacity: 0.3 },
          { position: 0.4014830508474576, color: '#ffffff', opacity: 0 }
        ],
        [
          { position: 0.09110169491525423, color: '#6a7d1a', opacity: 0.6 },
          { position: 0.12076271186440678, color: '#6a8d6a', opacity: 0.6 },
          { position: 0.508628519527702, color: '#ffb8f5', opacity: 0 }
        ],
        [
          { position: 0.06779661016949153, color: '#7aa4d4', opacity: 0.6 },
          { position: 0.09322033898305085, color: '#325a7e', opacity: 0.6 },
          { position: 0.1048728813559322, color: '#407d40', opacity: 0.6 },
          { position: 0.4555084745762712, color: '#6f8a6f', opacity: 0 }
        ],
        [
          { position: 0, color: '#3d9a5f', opacity: 0.6 },
          { position: 0.18528610354223432, color: '#6f7504', opacity: 0.6 },
          { position: 0.5, color: '#f5b8f5', opacity: 0 }
        ],
        [
          { position: 0, color: '#ffffff', opacity: 0.6 },
          { position: 0.1880108991825613, color: '#d4b3ff', opacity: 0.6 },
          { position: 0.5805084745762712, color: '#d9d9d9', opacity: 0 }
        ],
        [
          { position: 0.1008174386920981, color: '#0d5578', opacity: 0.6 },
          { position: 0.3220338983050847, color: '#ffe0ff', opacity: 0.6 },
          { position: 0.4608050847457627, color: '#ffe0ff', opacity: 0 }
        ],
        [
          { position: 0.024364406779661018, color: '#ff1a1a', opacity: 0.6 },
          { position: 0.03072033898305085, color: '#750000', opacity: 0.6 },
          { position: 0.17796610169491525, color: '#ff8a1a', opacity: 0.6 },
          { position: 0.551906779661017, color: '#ffff1a', opacity: 0 }
        ],
        [
          { position: 0.0423728813559322, color: '#6379ff', opacity: 0.6 },
          { position: 0.06779661016949153, color: '#4a1a73', opacity: 0.6 },
          { position: 0.19385593220338984, color: '#005277', opacity: 0.42 },
          { position: 0.388771186440678, color: '#d4f5ff', opacity: 0 }
        ],
        [
          { position: 0.026483050847457626, color: '#ffffff', opacity: 0.6 },
          { position: 0.028601694915254237, color: '#e03f3f', opacity: 0.6 },
          { position: 0.3199152542372881, color: '#d299c6', opacity: 0.6 },
          { position: 0.670299727520436, color: '#d299c6', opacity: 0 }
        ]
      ]
    }
  };

  // Design presets - complete configurations including all params, color set, and background
  const designPresets = {
    'A': {
      config: {
        particleCount: 150,
        sphereRadius: 217,
        minRadius: 30,
        maxRadius: 69,
        rotationSpeedX: 0.003,
        rotationSpeedY: 0.005,
        pulseSpeed: 0.02,
        perspective: 800,
        scatter: 0,
        breathingSpeedMin: 0,
        breathingSpeedMax: 0.0081,
        breathingAmountMin: 49,
        breathingAmountMax: 64,
        backgroundParticles: 773,
        blobDistortion: 0.3,
        bgDriftSpeedMin: 0.55,
        bgDriftSpeedMax: 0.51,
        bgMinSize: 6,
        bgMaxSize: 18,
        motionBlur: 0.78,
        motionBlurSteps: 20,
        particleOpacity: 0.23,
        bgParticleOpacity: 0.43,
        particleShape: 'circle',
        autoRotateShapes: true,
        glowRadius: 1,
        trailType: 'echo',
        streakColor: '#c8c8ff',
        blendMode: 'multiply'
      },
      selectedColorSet: 'Color Set A',
      backgroundColor: '#ffffff'
    },
    'Default': {
      config: {
        particleCount: 150,
        sphereRadius: 1,
        minRadius: 15,
        maxRadius: 45,
        rotationSpeedX: 0.003,
        rotationSpeedY: 0.005,
        pulseSpeed: 0.02,
        perspective: 800,
        scatter: 0,
        breathingSpeedMin: 0,
        breathingSpeedMax: 0.0081,
        breathingAmountMin: 49,
        breathingAmountMax: 64,
        backgroundParticles: 773,
        blobDistortion: 0.3,
        bgDriftSpeedMin: 0.55,
        bgDriftSpeedMax: 0.51,
        bgMinSize: 6,
        bgMaxSize: 18,
        motionBlur: 0.78,
        motionBlurSteps: 20,
        particleOpacity: 0.23,
        bgParticleOpacity: 0.43,
        particleShape: 'circle',
        autoRotateShapes: true,
        glowRadius: 1,
        trailType: 'echo',
        streakColor: '#c8c8ff',
        blendMode: 'source-over'
      },
      selectedColorSet: 'Color Set A',
      backgroundColor: '#EEEEEE'
    },
    'B': {
      config: {
        particleCount: 92,
        sphereRadius: 198,
        minRadius: 30,
        maxRadius: 80,
        rotationSpeedX: 0.003,
        rotationSpeedY: 0.0027,
        pulseSpeed: 0.02,
        perspective: 1200,
        scatter: 93,
        breathingSpeedMin: 0.0086,
        breathingSpeedMax: 0.01,
        breathingAmountMin: 7,
        breathingAmountMax: 100,
        backgroundParticles: 270,
        blobDistortion: 0.3,
        bgDriftSpeedMin: 0.25,
        bgDriftSpeedMax: 0.64,
        bgMinSize: 13,
        bgMaxSize: 45,
        motionBlur: 0.58,
        motionBlurSteps: 37,
        particleOpacity: 0.63,
        bgParticleOpacity: 0.54,
        particleShape: 'circle',
        autoRotateShapes: true,
        glowRadius: 1,
        trailType: 'echo',
        streakColor: '#d1e9ff',
        blendMode: 'soft-light',
        connectorsEnabled: true,
        connectorMinDistance: 14,
        connectorMaxDistance: 214,
        connectorColor: '#000000',
        connectorWidth: 0.5,
        connectorOpacity: 1,
        connectorMaxPerParticle: 3,
        connectorMaxTotal: 60,
        connectorArcMode: true,
        connectorArcOutward: true,
        connectorArcHeight: 0.3,
        connectorShowDots: true,
        connectorDotSize: 9,
        connectorLineStyle: 'dashed',
        connectorBlendMode: 'source-over',
        connectorDotStrokeOnly: false,
        connectorDotFillConnected: true,
        connectorDrawOnTop: true
      },
      selectedColorSet: 'Color Set H',
      backgroundColor: '#dbdbdb'
    },
    'C': {
      config: {
        particleCount: 92,
        sphereRadius: 198,
        minRadius: 30,
        maxRadius: 80,
        rotationSpeedX: 0.003,
        rotationSpeedY: 0.0027,
        pulseSpeed: 0.02,
        perspective: 1200,
        scatter: 93,
        breathingSpeedMin: 0.0086,
        breathingSpeedMax: 0.01,
        breathingAmountMin: 7,
        breathingAmountMax: 100,
        backgroundParticles: 270,
        blobDistortion: 0.3,
        bgDriftSpeedMin: 0.55,
        bgDriftSpeedMax: 0.51,
        bgMinSize: 13,
        bgMaxSize: 45,
        motionBlur: 1.33,
        motionBlurSteps: 16,
        particleOpacity: 0.6,
        bgParticleOpacity: 0.54,
        particleShape: 'circle',
        autoRotateShapes: true,
        glowRadius: 1,
        trailType: 'echo',
        streakColor: '#d1e9ff',
        blendMode: 'soft-light'
      },
      selectedColorSet: 'Color Set H',
      backgroundColor: '#dbdbdb'
    },
    'C2': {
      config: {
        particleCount: 92,
        sphereRadius: 190,
        minRadius: 30,
        maxRadius: 80,
        rotationSpeedX: 0.003,
        rotationSpeedY: 0.0027,
        pulseSpeed: 0.02,
        perspective: 1200,
        scatter: 57,
        breathingSpeedMin: 0.0086,
        breathingSpeedMax: 0.01,
        breathingAmountMin: 7,
        breathingAmountMax: 100,
        backgroundParticles: 172,
        blobDistortion: 0.3,
        bgDriftSpeedMin: 0.55,
        bgDriftSpeedMax: 0.51,
        bgMinSize: 13,
        bgMaxSize: 46,
        motionBlur: 2,
        motionBlurSteps: 25,
        particleOpacity: 0.19,
        bgParticleOpacity: 0.36,
        particleShape: 'circle',
        autoRotateShapes: true,
        glowRadius: 1,
        trailType: 'echo',
        streakColor: '#d1e9ff',
        blendMode: 'soft-light'
      },
      selectedColorSet: 'Color Set H',
      backgroundColor: '#dbdbdb'
    },
    'D': {
      config: {
        particleCount: 150,
        sphereRadius: 217,
        minRadius: 30,
        maxRadius: 69,
        rotationSpeedX: 0.003,
        rotationSpeedY: 0.005,
        pulseSpeed: 0.02,
        perspective: 800,
        scatter: 0,
        breathingSpeedMin: 0,
        breathingSpeedMax: 0.0081,
        breathingAmountMin: 49,
        breathingAmountMax: 64,
        backgroundParticles: 773,
        blobDistortion: 0.3,
        bgDriftSpeedMin: 0.55,
        bgDriftSpeedMax: 0.51,
        bgMinSize: 6,
        bgMaxSize: 18,
        motionBlur: 0.78,
        motionBlurSteps: 20,
        particleOpacity: 0.21,
        bgParticleOpacity: 0.43,
        particleShape: 'circle',
        autoRotateShapes: true,
        glowRadius: 1,
        trailType: 'echo',
        streakColor: '#c8c8ff',
        blendMode: 'multiply'
      },
      selectedColorSet: 'Color Set I',
      backgroundColor: '#ffffff'
    },
    'E': {
      config: {
        particleCount: 92,
        sphereRadius: 198,
        minRadius: 30,
        maxRadius: 80,
        rotationSpeedX: 0.003,
        rotationSpeedY: 0.0027,
        pulseSpeed: 0.02,
        perspective: 1200,
        scatter: 93,
        breathingSpeedMin: 0.0086,
        breathingSpeedMax: 0.01,
        breathingAmountMin: 7,
        breathingAmountMax: 100,
        backgroundParticles: 270,
        blobDistortion: 0.3,
        bgDriftSpeedMin: 0.55,
        bgDriftSpeedMax: 0.51,
        bgMinSize: 13,
        bgMaxSize: 45,
        motionBlur: 1.33,
        motionBlurSteps: 16,
        particleOpacity: 0.6,
        bgParticleOpacity: 0.54,
        particleShape: 'circle',
        autoRotateShapes: true,
        glowRadius: 1,
        trailType: 'echo',
        streakColor: '#d1e9ff',
        blendMode: 'soft-light'
      },
      selectedColorSet: 'Color Set H',
      backgroundColor: '#dbdbdb'
    },
    'F': {
      config: {
        particleCount: 92,
        sphereRadius: 198,
        minRadius: 30,
        maxRadius: 80,
        rotationSpeedX: 0.003,
        rotationSpeedY: 0.0027,
        pulseSpeed: 0.02,
        perspective: 1200,
        scatter: 93,
        breathingSpeedMin: 0.0086,
        breathingSpeedMax: 0.01,
        breathingAmountMin: 7,
        breathingAmountMax: 100,
        backgroundParticles: 270,
        blobDistortion: 0.3,
        bgDriftSpeedMin: 0.55,
        bgDriftSpeedMax: 0.51,
        bgMinSize: 13,
        bgMaxSize: 45,
        motionBlur: 0.22,
        motionBlurSteps: 71,
        particleOpacity: 1,
        bgParticleOpacity: 1,
        particleShape: 'circle',
        autoRotateShapes: true,
        glowRadius: 1,
        trailType: 'streak',
        streakColor: '#61784f',
        blendMode: 'soft-light'
      },
      selectedColorSet: 'Color Set H',
      backgroundColor: '#dbdbdb'
    }
  };

  // PERIOD presets - complete configurations including all params, gradients, and connectors
  const periodPresets = {
    '1': {
      config: {
        particleCount: 100,
        sphereRadius: 300,
        minRadius: 1,
        maxRadius: 1,
        rotationSpeedX: 0,
        rotationSpeedY: 0,
        pulseSpeed: 0.02,
        perspective: 1200,
        scatter: 300,
        breathingSpeedMin: 0.0086,
        breathingSpeedMax: 0.01,
        breathingAmountMin: 7,
        breathingAmountMax: 100,
        backgroundParticles: 270,
        blobDistortion: 0.3,
        bgDriftSpeedMin: 0.76,
        bgDriftSpeedMax: 0.57,
        bgMinSize: 13,
        bgMaxSize: 45,
        motionBlur: 0.58,
        motionBlurSteps: 37,
        particleOpacity: 0.20,
        bgParticleOpacity: 0,
        particleShape: 'circle',
        autoRotateShapes: true,
        glowRadius: 1,
        trailType: 'echo',
        streakColor: '#d1e9ff',
        blendMode: 'soft-light',
        connectorsEnabled: true,
        connectorMinDistance: 0,
        connectorMaxDistance: 72,
        connectorColor: null,
        connectorWidth: 0.5,
        connectorOpacity: 1,
        connectorMaxPerParticle: 3,
        connectorMaxTotal: 60,
        connectorArcMode: true,
        connectorArcOutward: true,
        connectorArcHeight: 0.3,
        connectorShowDots: true,
        connectorDotSize: 9,
        connectorLineStyle: 'dashed',
        connectorBlendMode: 'source-over',
        connectorDotStrokeOnly: true,
        connectorDotFillConnected: true,
        connectorDrawOnTop: true
      },
      selectedColorSet: 'Color Set J',
      backgroundColor: '#dbdbdb'
    },
    '2': {
      config: {
        particleCount: 100,
        sphereRadius: 239,
        minRadius: 1,
        maxRadius: 1,
        rotationSpeedX: 0.0023,
        rotationSpeedY: 0.0026,
        pulseSpeed: 0.009,
        perspective: 1200,
        scatter: 137,
        breathingSpeedMin: 0.0086,
        breathingSpeedMax: 0.01,
        breathingAmountMin: 7,
        breathingAmountMax: 100,
        backgroundParticles: 270,
        blobDistortion: 0.3,
        bgDriftSpeedMin: 0.03,
        bgDriftSpeedMax: 0.1,
        bgMinSize: 5,
        bgMaxSize: 5,
        motionBlur: 0.58,
        motionBlurSteps: 37,
        particleOpacity: 0.2,
        bgParticleOpacity: 0,
        particleShape: 'circle',
        autoRotateShapes: true,
        glowRadius: 1,
        trailType: 'echo',
        streakColor: '#d1e9ff',
        blendMode: 'soft-light',
        connectorsEnabled: true,
        connectorMinDistance: 0,
        connectorMaxDistance: 72,
        connectorColor: null,
        connectorWidth: 0.5,
        connectorOpacity: 1,
        connectorMaxPerParticle: 3,
        connectorMaxTotal: 60,
        connectorArcMode: true,
        connectorArcOutward: true,
        connectorArcHeight: 0.3,
        connectorShowDots: true,
        connectorDotSize: 9,
        connectorLineStyle: 'dashed',
        connectorBlendMode: 'source-over',
        connectorDotStrokeOnly: true,
        connectorDotFillConnected: true,
        connectorDrawOnTop: true
      },
      selectedColorSet: 'Color Set J',
      backgroundColor: '#dbdbdb'
    },
    '3': {
      config: {
        particleCount: 100,
        sphereRadius: 277,
        minRadius: 30,
        maxRadius: 80,
        rotationSpeedX: 0.0017,
        rotationSpeedY: 0.0023,
        pulseSpeed: 0.009,
        perspective: 1200,
        scatter: 205,
        breathingSpeedMin: 0.0086,
        breathingSpeedMax: 0.01,
        breathingAmountMin: 7,
        breathingAmountMax: 100,
        backgroundParticles: 69,
        blobDistortion: 0.3,
        bgDriftSpeedMin: 0.48,
        bgDriftSpeedMax: 0.94,
        bgMinSize: 10,
        bgMaxSize: 24,
        motionBlur: 0.58,
        motionBlurSteps: 37,
        particleOpacity: 0.5,
        bgParticleOpacity: 0.59,
        particleShape: 'circle',
        autoRotateShapes: true,
        glowRadius: 1,
        trailType: 'echo',
        streakColor: '#d1e9ff',
        blendMode: 'soft-light',
        connectorsEnabled: true,
        connectorMinDistance: 0,
        connectorMaxDistance: 72,
        connectorColor: null,
        connectorWidth: 0.5,
        connectorOpacity: 1,
        connectorMaxPerParticle: 3,
        connectorMaxTotal: 60,
        connectorArcMode: true,
        connectorArcOutward: true,
        connectorArcHeight: 0.3,
        connectorShowDots: true,
        connectorDotSize: 9,
        connectorLineStyle: 'dashed',
        connectorBlendMode: 'source-over',
        connectorDotStrokeOnly: true,
        connectorDotFillConnected: true,
        connectorDrawOnTop: true
      },
      selectedColorSet: 'Color Set J',
      backgroundColor: '#dbdbdb'
    },
    '4': {
      config: {
        particleCount: 100,
        sphereRadius: 194,
        minRadius: 30,
        maxRadius: 80,
        rotationSpeedX: 0.0021,
        rotationSpeedY: 0.0026,
        pulseSpeed: 0.009,
        perspective: 1200,
        scatter: 134,
        breathingSpeedMin: 0.0086,
        breathingSpeedMax: 0.01,
        breathingAmountMin: 7,
        breathingAmountMax: 100,
        backgroundParticles: 69,
        blobDistortion: 0.3,
        bgDriftSpeedMin: 0.48,
        bgDriftSpeedMax: 0.94,
        bgMinSize: 10,
        bgMaxSize: 24,
        motionBlur: 0.58,
        motionBlurSteps: 37,
        particleOpacity: 0.5,
        bgParticleOpacity: 1,
        particleShape: 'circle',
        autoRotateShapes: true,
        glowRadius: 1,
        trailType: 'echo',
        streakColor: '#d1e9ff',
        blendMode: 'soft-light',
        connectorsEnabled: true,
        connectorMinDistance: 7,
        connectorMaxDistance: 63,
        connectorColor: '#000000',
        connectorWidth: 0.5,
        connectorOpacity: 1,
        connectorMaxPerParticle: 11,
        connectorMaxTotal: 40,
        connectorArcMode: true,
        connectorArcOutward: true,
        connectorArcHeight: 0.05,
        connectorShowDots: true,
        connectorDotSize: 9,
        connectorLineStyle: 'dashed',
        connectorBlendMode: 'source-over',
        connectorDotStrokeOnly: true,
        connectorDotFillConnected: true,
        connectorDrawOnTop: true
      },
      selectedColorSet: 'Color Set J',
      backgroundColor: '#dbdbdb'
    },
    '5': {
      config: {
        particleCount: 100,
        sphereRadius: 1,
        minRadius: 30,
        maxRadius: 80,
        rotationSpeedX: 0.01,
        rotationSpeedY: 0.0055,
        pulseSpeed: 0.02,
        perspective: 1200,
        scatter: 140,
        breathingSpeedMin: 0.0086,
        breathingSpeedMax: 0.01,
        breathingAmountMin: 7,
        breathingAmountMax: 100,
        backgroundParticles: 270,
        blobDistortion: 0.3,
        bgDriftSpeedMin: 0.76,
        bgDriftSpeedMax: 0.57,
        bgMinSize: 13,
        bgMaxSize: 45,
        motionBlur: 0.58,
        motionBlurSteps: 37,
        particleOpacity: 0.5,
        bgParticleOpacity: 0.26,
        particleShape: 'circle',
        autoRotateShapes: true,
        glowRadius: 1,
        trailType: 'echo',
        streakColor: '#d1e9ff',
        blendMode: 'soft-light',
        connectorsEnabled: true,
        connectorMinDistance: 0,
        connectorMaxDistance: 72,
        connectorColor: null,
        connectorWidth: 0.5,
        connectorOpacity: 1,
        connectorMaxPerParticle: 3,
        connectorMaxTotal: 60,
        connectorArcMode: true,
        connectorArcOutward: true,
        connectorArcHeight: 0.3,
        connectorShowDots: true,
        connectorDotSize: 9,
        connectorLineStyle: 'dashed',
        connectorBlendMode: 'source-over',
        connectorDotStrokeOnly: true,
        connectorDotFillConnected: true,
        connectorDrawOnTop: true
      },
      selectedColorSet: 'Color Set J',
      backgroundColor: '#dbdbdb'
    },
    '6': {
      config: {
        particleCount: 100,
        sphereRadius: 116,
        minRadius: 5,
        maxRadius: 30,
        rotationSpeedX: 0.0007,
        rotationSpeedY: 0.0028,
        pulseSpeed: 0.02,
        perspective: 1200,
        scatter: 0,
        breathingSpeedMin: 0.0086,
        breathingSpeedMax: 0.01,
        breathingAmountMin: 7,
        breathingAmountMax: 100,
        backgroundParticles: 270,
        blobDistortion: 0.3,
        bgDriftSpeedMin: 0.76,
        bgDriftSpeedMax: 0.57,
        bgMinSize: 13,
        bgMaxSize: 19,
        motionBlur: 0.58,
        motionBlurSteps: 37,
        particleOpacity: 0.34,
        bgParticleOpacity: 0.26,
        particleShape: 'circle',
        autoRotateShapes: true,
        glowRadius: 1,
        trailType: 'echo',
        streakColor: '#d1e9ff',
        blendMode: 'soft-light',
        connectorsEnabled: true,
        connectorMinDistance: 14,
        connectorMaxDistance: 303,
        connectorColor: null,
        connectorWidth: 0.5,
        connectorOpacity: 1,
        connectorMaxPerParticle: 15,
        connectorMaxTotal: 50,
        connectorArcMode: true,
        connectorArcOutward: true,
        connectorArcHeight: 0.3,
        connectorShowDots: true,
        connectorDotSize: 9,
        connectorLineStyle: 'dashed',
        connectorBlendMode: 'source-over',
        connectorDotStrokeOnly: true,
        connectorDotFillConnected: true,
        connectorDrawOnTop: true
      },
      selectedColorSet: 'Color Set J',
      backgroundColor: '#dbdbdb'
    },
    '7': {
      config: {
        particleCount: 100,
        sphereRadius: 167,
        minRadius: 15,
        maxRadius: 80,
        rotationSpeedX: 0.01,
        rotationSpeedY: 0.0091,
        pulseSpeed: 0.009,
        perspective: 1200,
        scatter: 66,
        breathingSpeedMin: 0.0086,
        breathingSpeedMax: 0.01,
        breathingAmountMin: 7,
        breathingAmountMax: 100,
        backgroundParticles: 69,
        blobDistortion: 0.3,
        bgDriftSpeedMin: 0.48,
        bgDriftSpeedMax: 0.94,
        bgMinSize: 10,
        bgMaxSize: 24,
        motionBlur: 0.58,
        motionBlurSteps: 37,
        particleOpacity: 0.55,
        bgParticleOpacity: 0.59,
        particleShape: 'circle',
        autoRotateShapes: true,
        glowRadius: 1,
        trailType: 'echo',
        streakColor: '#d1e9ff',
        blendMode: 'soft-light',
        connectorsEnabled: true,
        connectorMinDistance: 0,
        connectorMaxDistance: 72,
        connectorColor: '#bababa',
        connectorWidth: 0.5,
        connectorOpacity: 1,
        connectorMaxPerParticle: 3,
        connectorMaxTotal: 60,
        connectorArcMode: true,
        connectorArcOutward: true,
        connectorArcHeight: 0.3,
        connectorShowDots: true,
        connectorDotSize: 5,
        connectorLineStyle: 'dashed',
        connectorBlendMode: 'source-over',
        connectorDotStrokeOnly: false,
        connectorDotFillConnected: false,
        connectorDrawOnTop: true
      },
      selectedColorSet: 'Color Set 7',
      backgroundColor: '#dbdbdb'
    },
    '8': {
      config: {
        particleCount: 100,
        sphereRadius: 167,
        minRadius: 15,
        maxRadius: 80,
        rotationSpeedX: 0.0035,
        rotationSpeedY: 0.0061,
        pulseSpeed: 0.009,
        perspective: 1200,
        scatter: 113,
        breathingSpeedMin: 0.0086,
        breathingSpeedMax: 0.01,
        breathingAmountMin: 7,
        breathingAmountMax: 100,
        backgroundParticles: 69,
        blobDistortion: 0.3,
        bgDriftSpeedMin: 0.48,
        bgDriftSpeedMax: 0.94,
        bgMinSize: 10,
        bgMaxSize: 24,
        motionBlur: 0.58,
        motionBlurSteps: 37,
        particleOpacity: 0.55,
        bgParticleOpacity: 0.59,
        particleShape: 'circle',
        autoRotateShapes: true,
        glowRadius: 1,
        trailType: 'echo',
        streakColor: '#d1e9ff',
        blendMode: 'soft-light',
        connectorsEnabled: true,
        connectorMinDistance: 34,
        connectorMaxDistance: 195,
        connectorColor: '#ffffff',
        connectorWidth: 0.8,
        connectorOpacity: 0.71,
        connectorMaxPerParticle: 3,
        connectorMaxTotal: 20,
        connectorArcMode: true,
        connectorArcOutward: true,
        connectorArcHeight: 0.3,
        connectorShowDots: true,
        connectorDotSize: 6.5,
        connectorLineStyle: 'solid',
        connectorBlendMode: 'source-over',
        connectorDotStrokeOnly: false,
        connectorDotFillConnected: false,
        connectorDrawOnTop: true,
        connectorWiggle: true,
        connectorWiggleAmplitude: 9.5,
        connectorWiggleFrequency: 0.7,
        connectorWiggleSpeed: 0.038
      },
      selectedColorSet: 'Color Set 7',
      backgroundColor: '#dbdbdb'
    },
    '9': {
      config: {
        particleCount: 100,
        sphereRadius: 167,
        minRadius: 15,
        maxRadius: 80,
        rotationSpeedX: 0.01,
        rotationSpeedY: 0.0091,
        pulseSpeed: 0.009,
        perspective: 1200,
        scatter: 66,
        breathingSpeedMin: 0.0086,
        breathingSpeedMax: 0.01,
        breathingAmountMin: 7,
        breathingAmountMax: 100,
        backgroundParticles: 69,
        blobDistortion: 0.3,
        bgDriftSpeedMin: 0.48,
        bgDriftSpeedMax: 0.94,
        bgMinSize: 10,
        bgMaxSize: 24,
        motionBlur: 0.58,
        motionBlurSteps: 37,
        particleOpacity: 0.55,
        bgParticleOpacity: 0.59,
        particleShape: 'circle',
        autoRotateShapes: true,
        glowRadius: 1,
        trailType: 'echo',
        streakColor: '#d1e9ff',
        blendMode: 'source-over',
        connectorsEnabled: true,
        connectorMinDistance: 195,
        connectorMaxDistance: 72,
        connectorColor: '#ffffff',
        connectorWidth: 0.5,
        connectorOpacity: 1,
        connectorMaxPerParticle: 3,
        connectorMaxTotal: 60,
        connectorArcMode: true,
        connectorArcOutward: true,
        connectorArcHeight: 0.3,
        connectorShowDots: true,
        connectorDotSize: 8,
        connectorLineStyle: 'dashed',
        connectorBlendMode: 'overlay',
        connectorDotStrokeOnly: false,
        connectorDotFillConnected: false,
        connectorDrawOnTop: true,
        connectorWiggle: false,
        connectorWiggleAmplitude: 0,
        connectorWiggleFrequency: 0.5,
        connectorWiggleSpeed: 0.01,
        connectorDotColor: '#000000'
      },
      selectedColorSet: 'Color Set K',
      backgroundColor: '#EEEEEE'
    },
    '10': {
      config: {
        particleCount: 150,
        sphereRadius: 300,
        minRadius: 15,
        maxRadius: 80,
        rotationSpeedX: 0.0018,
        rotationSpeedY: 0.0042,
        pulseSpeed: 0.05,
        perspective: 1200,
        scatter: 300,
        breathingSpeedMin: 0.0086,
        breathingSpeedMax: 0.01,
        breathingAmountMin: 7,
        breathingAmountMax: 100,
        backgroundParticles: 69,
        blobDistortion: 0.3,
        bgDriftSpeedMin: 0.48,
        bgDriftSpeedMax: 0.94,
        bgMinSize: 22,
        bgMaxSize: 28,
        motionBlur: 0.58,
        motionBlurSteps: 50,
        particleOpacity: 0.96,
        bgParticleOpacity: 0,
        particleNoise: 88,
        particleShape: 'circle',
        autoRotateShapes: true,
        glowRadius: 1,
        trailType: 'echo',
        streakColor: '#d1e9ff',
        blendMode: 'color',
        connectorsEnabled: true,
        connectorMinDistance: 3,
        connectorMaxDistance: 187,
        connectorColor: '#ffffff',
        connectorWidth: 0.8,
        connectorOpacity: 1,
        connectorMaxPerParticle: 20,
        connectorMaxTotal: 490,
        connectorArcMode: true,
        connectorArcOutward: true,
        connectorArcHeight: 0.3,
        connectorShowDots: true,
        connectorDotSize: 11,
        connectorLineStyle: 'arrows',
        connectorBlendMode: 'source-over',
        connectorDotStrokeOnly: false,
        connectorDotFillConnected: true,
        connectorDrawOnTop: true,
        connectorWiggle: false,
        connectorWiggleAmplitude: 5,
        connectorWiggleFrequency: 2,
        connectorWiggleSpeed: 0.01,
        connectorDotColor: '#ffffff'
      },
      selectedColorSet: 'Color Set L',
      backgroundColor: '#d4d4d4'
    },
    '11': {
      config: {
        particleCount: 5,
        sphereRadius: 300,
        minRadius: 20,
        maxRadius: 159,
        rotationSpeedX: 0.01,
        rotationSpeedY: 0.0091,
        pulseSpeed: 0.009,
        perspective: 1200,
        scatter: 300,
        breathingSpeedMin: 0.0086,
        breathingSpeedMax: 0.01,
        breathingAmountMin: 7,
        breathingAmountMax: 100,
        backgroundParticles: 69,
        blobDistortion: 0.3,
        bgDriftSpeedMin: 0.48,
        bgDriftSpeedMax: 0.94,
        bgMinSize: 27,
        bgMaxSize: 76,
        motionBlur: 0.58,
        motionBlurSteps: 37,
        particleOpacity: 0.84,
        bgParticleOpacity: 1,
        particleShape: 'circle',
        autoRotateShapes: true,
        glowRadius: 1,
        trailType: 'echo',
        streakColor: '#d1e9ff',
        blendMode: 'soft-light',
        connectorsEnabled: false,
        connectorMinDistance: 195,
        connectorMaxDistance: 72,
        connectorColor: '#ffffff',
        connectorWidth: 0.5,
        connectorOpacity: 1,
        connectorMaxPerParticle: 3,
        connectorMaxTotal: 60,
        connectorArcMode: true,
        connectorArcOutward: true,
        connectorArcHeight: 0.3,
        connectorShowDots: true,
        connectorDotSize: 8,
        connectorLineStyle: 'dashed',
        connectorBlendMode: 'overlay',
        connectorDotStrokeOnly: false,
        connectorDotFillConnected: false,
        connectorDrawOnTop: true,
        connectorWiggle: false,
        connectorWiggleAmplitude: 5,
        connectorWiggleFrequency: 2,
        connectorWiggleSpeed: 0.01,
        connectorDotColor: '#000000'
      },
      selectedColorSet: 'Color Set N',
      backgroundColor: '#ffffff'
    }
  };

  const [selectedColorSet, setSelectedColorSet] = useState('Default');
  const [showGradientEditor, setShowGradientEditor] = useState(false);
  const [showColorControls, setShowColorControls] = useState(true); // New state for color controls panel
  const [selectedGradientIndex, setSelectedGradientIndex] = useState(null); // Track which gradient is being edited
  const [selectedPalette, setSelectedPalette] = useState(null); // Selected color palette name
  const gradientEditorRefs = useRef({}); // Refs for scrolling to specific gradients
  const [backgroundColor, setBackgroundColor] = useState('#EEEEEE');
  const [selectedPreset, setSelectedPreset] = useState('Default');
  // New color control states
  const [colorBrightness, setColorBrightness] = useState(1.0); // 0.5 to 2.0 multiplier
  const [colorSaturation, setColorSaturation] = useState(1.0); // 0.0 to 2.0 multiplier
  const [enabledGradients, setEnabledGradients] = useState(() => {
    // Initialize all gradients as enabled
    const currentSet = colorSets[selectedColorSet];
    if (currentSet && currentSet.gradientStops) {
      return currentSet.gradientStops.map((_, i) => true);
    }
    return [];
  });
  const [selectedPeriod, setSelectedPeriod] = useState('9');
  const [enabledPeriods, setEnabledPeriods] = useState({
    '1': true,
    '2': true,
    '3': true,
    '4': true,
    '5': true,
    '6': true,
    '7': true,
    '8': true,
    '9': true,
    '10': true,
    '11': true
  });
  const [interpolateMode, setInterpolateMode] = useState(true);
  const [oneColorMode, setOneColorMode] = useState(false);
  const [oneColorModeColor, setOneColorModeColor] = useState('#ffffff');
  const [oneColorModeDotOriginalColor, setOneColorModeDotOriginalColor] = useState(false);
  
  // Convert old format (colorPalette + gradientStops) to new format (gradientStops with colors)
  const convertToNewFormat = (colorSet) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/454bdaec-6972-42c5-890c-970c6aef7036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CircularParticles.jsx:1324',message:'convertToNewFormat entry',data:{colorSetExists:!!colorSet,hasGradientStops:!!colorSet?.gradientStops,hasColorPalette:!!colorSet?.colorPalette},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    if (!colorSet) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/454bdaec-6972-42c5-890c-970c6aef7036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CircularParticles.jsx:1326',message:'ERROR: colorSet is undefined',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return [];
    }
    // Check if it's already in new format (has gradientStops as array of arrays of stop objects)
    if (colorSet.gradientStops && 
        Array.isArray(colorSet.gradientStops) && 
        colorSet.gradientStops.length > 0 &&
        Array.isArray(colorSet.gradientStops[0]) && 
        colorSet.gradientStops[0].length > 0 &&
        typeof colorSet.gradientStops[0][0] === 'object' &&
        'position' in colorSet.gradientStops[0][0] &&
        'color' in colorSet.gradientStops[0][0]) {
      // Already in new format, just return it (make a deep copy to avoid mutations)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/454bdaec-6972-42c5-890c-970c6aef7036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CircularParticles.jsx:1338',message:'using new format path',data:{gradientStopsLength:colorSet.gradientStops.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return colorSet.gradientStops.map(gradient => 
        gradient.map(stop => ({ ...stop }))
      );
    }
    
    // Old format: convert colorPalette + gradientStops to new format
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/454bdaec-6972-42c5-890c-970c6aef7036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CircularParticles.jsx:1342',message:'using old format path',data:{hasColorPalette:!!colorSet.colorPalette,hasGradientStops:!!colorSet.gradientStops},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    const colorPalette = colorSet.colorPalette;
    const gradientStops = colorSet.gradientStops;
    if (!colorPalette || !gradientStops) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/454bdaec-6972-42c5-890c-970c6aef7036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CircularParticles.jsx:1346',message:'ERROR: missing colorPalette or gradientStops in old format',data:{hasColorPalette:!!colorPalette,hasGradientStops:!!gradientStops},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return [];
    }
    return colorPalette.map((colors, index) => {
      const stops = gradientStops[index];
      return [
        { position: stops.stop1, color: colors[0], opacity: 1 },
        { position: stops.stop2, color: colors[1], opacity: 1 },
        { position: stops.stop3, color: colors[2], opacity: 0 } // Last color has opacity 0
      ].sort((a, b) => a.position - b.position); // Sort by position
    });
  };

  // State for editable gradient values (new format: array of stops with position, color, opacity)
  const [editableGradients, setEditableGradients] = useState(() => {
    const currentSet = colorSets[selectedColorSet];
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/454bdaec-6972-42c5-890c-970c6aef7036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CircularParticles.jsx:1376',message:'initial editableGradients setup',data:{selectedColorSet,currentSetExists:!!currentSet,allColorSets:Object.keys(colorSets),hasColorSet7:!!colorSets['Color Set 7']},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    return convertToNewFormat(currentSet);
  });
  
  // Log available periods on mount
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/454bdaec-6972-42c5-890c-970c6aef7036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CircularParticles.jsx:1384',message:'component mount - periods available',data:{allPeriods:Object.keys(periodPresets),period7Exists:!!periodPresets['7'],colorSet7Exists:!!colorSets['Color Set 7']},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
  }, []);

  // Initialize Default color set and settings on mount - run FIRST
  useEffect(() => {
    // Apply Default color set (Custom-10 renamed) immediately
    // This sets the correct colors dynamically
    applyDefault();
  }, []); // Only run on mount
  
  // Initialize default period on mount (but preserve Default color set)
  // Run after Default is applied
  useEffect(() => {
    // Small delay to ensure Default is applied first
    const timer = setTimeout(() => {
      if (selectedPeriod === '9') {
        const period = periodPresets['9'];
        if (period) {
          // Apply period config but preserve Default color set and settings
          const periodConfig = { ...period.config };
          // Override these to keep Default values
          periodConfig.connectorShowDots = false;
          periodConfig.blendMode = 'source-over';
          setConfig(periodConfig);
          if (configRef.current) {
            configRef.current = { ...periodConfig };
          }
          // Don't change color set - keep it as Default
          // Don't change background - keep it as #f9f9f9
          setSelectedPeriod('9');
        }
      }
    }, 50);
    
    return () => clearTimeout(timer);
  }, []); // Only run on mount
  
  // Update editable gradients when color set changes
  useEffect(() => {
    // Skip Custom-10, Custom-11, and Custom-12 - they are handled by their respective functions
    if (selectedColorSet === 'Custom-10' || selectedColorSet === 'Custom-11' || selectedColorSet === 'Custom-12') {
      return;
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/454bdaec-6972-42c5-890c-970c6aef7036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CircularParticles.jsx:1360',message:'useEffect selectedColorSet entry',data:{selectedColorSet,colorSetExists:!!colorSets[selectedColorSet]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    const currentSet = colorSets[selectedColorSet];
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/454bdaec-6972-42c5-890c-970c6aef7036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CircularParticles.jsx:1362',message:'before convertToNewFormat',data:{selectedColorSet,currentSetExists:!!currentSet,hasGradientStops:!!currentSet?.gradientStops,hasColorPalette:!!currentSet?.colorPalette},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    if (!currentSet) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/454bdaec-6972-42c5-890c-970c6aef7036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CircularParticles.jsx:1363',message:'ERROR: currentSet is undefined',data:{selectedColorSet},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return;
    }
    try {
      const converted = convertToNewFormat(currentSet);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/454bdaec-6972-42c5-890c-970c6aef7036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CircularParticles.jsx:1368',message:'convertToNewFormat success',data:{selectedColorSet,convertedLength:converted?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      setEditableGradients(converted);
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/454bdaec-6972-42c5-890c-970c6aef7036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CircularParticles.jsx:1372',message:'ERROR: convertToNewFormat failed',data:{selectedColorSet,error:error.message,stack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
    }
  }, [selectedColorSet]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];
    let backgroundParticles = [];
    let currentConfig = { ...config };
    
    // Get the current editable gradients (new format: array of gradient arrays)
    // Filter to only include enabled gradients and apply color adjustments
    const filteredGradients = editableGradients.filter((_, index) => enabledGradients[index] !== false);
    // Safety check: if no gradients are enabled, use all gradients
    const gradientsToUse = filteredGradients.length > 0 ? filteredGradients : editableGradients;
    const gradientStopsArray = gradientsToUse.map(gradient => 
      gradient.map(stop => {
        let adjustedColor = stop.color;
        // Apply brightness adjustment if needed
        if (colorBrightness !== 1.0) {
          adjustedColor = adjustBrightness(adjustedColor, colorBrightness);
        }
        // Apply saturation adjustment if needed
        if (colorSaturation !== 1.0) {
          adjustedColor = adjustSaturation(adjustedColor, colorSaturation);
        }
        return { ...stop, color: adjustedColor };
      })
    );
    const currentOneColorMode = oneColorMode;
    const currentOneColorModeColor = oneColorModeColor;
    const currentOneColorModeDotOriginalColor = oneColorModeDotOriginalColor;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Mouse move handler to detect hovered particles
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Find the closest particle within hover distance
      let closestParticle = null;
      let closestDistance = Infinity;
      const hoverThreshold = 30; // Maximum distance to consider a particle "hovered"
      
      // Check all particles (both main and background)
      const allParticles = currentStateRef.current === 'birth' 
        ? particlesRef.current
        : bgParticlesRef.current.concat(particlesRef.current);
      
      for (const particle of allParticles) {
        if (!particle || particle.currentRadius <= 0) continue;
        
        const dx = mouseX - particle.x2d;
        const dy = mouseY - particle.y2d;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if mouse is within the particle's radius + threshold
        if (distance < particle.currentRadius + hoverThreshold && distance < closestDistance) {
          closestDistance = distance;
          closestParticle = particle;
        }
      }
      
      hoveredParticleRef.current = closestParticle;
    };
    
    canvas.addEventListener('mousemove', handleMouseMove);

    // Pre-render gradient blobs to offscreen canvases for performance
    const createShapeCache = (stopsArray, shape) => {
      const size = shape === 'circle' ? 128 : 1024;
      const offscreen = document.createElement('canvas');
      offscreen.width = size;
      offscreen.height = size;
      const offCtx = offscreen.getContext('2d');
      
      const cx = size / 2;
      const cy = size / 2;
      const r = size / 2;
      
      // Sort stops by position to ensure correct order
      const sortedStops = [...stopsArray].sort((a, b) => a.position - b.position);
      
      if (shape === 'circle') {
        // Circle keeps the original gradient fill behavior
        const gradient = offCtx.createRadialGradient(cx, cy, 0, cx, cy, r);
        sortedStops.forEach(stop => {
          // Use selected color if one color mode is enabled
          const color = currentOneColorMode ? currentOneColorModeColor : stop.color;
          const colorWithOpacity = stop.opacity < 1 
            ? color + Math.round(stop.opacity * 255).toString(16).padStart(2, '0')
            : color;
          gradient.addColorStop(stop.position, colorWithOpacity);
        });
        offCtx.fillStyle = gradient;
        offCtx.beginPath();
        offCtx.arc(cx, cy, r, 0, Math.PI * 2);
        offCtx.fill();
      } else {
        // Other shapes: draw shape with large blur for glow, then solid shape on top
        
        // Helper to draw the shape path
        const drawShapePath = (ctx, scale = 1) => {
          ctx.beginPath();
          switch (shape) {
            case 'x': {
              const lineW = size * 0.04 + (scale - 1) * size * 0.15;
              const baseInset = size * 0.3;
              const inset = baseInset - (scale - 1) * size * 0.1;
              ctx.lineWidth = lineW;
              ctx.lineCap = 'round';
              ctx.moveTo(inset, inset);
              ctx.lineTo(size - inset, size - inset);
              ctx.moveTo(size - inset, inset);
              ctx.lineTo(inset, size - inset);
              return 'stroke';
            }
            case 'torus': {
              const outerR = r * 0.5 * scale;
              const innerR = r * 0.375 * scale;
              ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
              ctx.arc(cx, cy, innerR, 0, Math.PI * 2, true);
              return 'fill-evenodd';
            }
            case 'triangle': {
              const triR = r * 0.55 * scale;
              ctx.moveTo(cx, cy - triR * 0.9);
              ctx.lineTo(cx + triR * 0.85, cy + triR * 0.6);
              ctx.lineTo(cx - triR * 0.85, cy + triR * 0.6);
              ctx.closePath();
              return 'fill';
            }
            case 'square': {
              const sqSize = size * 0.35 * scale;
              ctx.rect(cx - sqSize / 2, cy - sqSize / 2, sqSize, sqSize);
              return 'fill';
            }
          }
        };
        
        // Draw multiple glow layers using gradient stops (reverse order for outer to inner)
        const glowMult = currentConfig.glowRadius || 1;
        const reversedStops = [...sortedStops].reverse();
        const glowLayers = reversedStops.map((stop, index) => {
          const scaleFactor = 1 + (reversedStops.length - index) * 0.5 * glowMult;
          const blurFactor = (reversedStops.length - index) * 60 * glowMult;
          // Use selected color if one color mode is enabled
          const color = currentOneColorMode ? currentOneColorModeColor : stop.color;
          return {
            blur: blurFactor,
            color: color,
            opacity: stop.opacity,
            scale: scaleFactor
          };
        });
        
        for (const layer of glowLayers) {
          offCtx.save();
          offCtx.globalAlpha = Math.min(1, layer.opacity);
          offCtx.shadowColor = layer.color;
          offCtx.shadowBlur = layer.blur;
          offCtx.fillStyle = layer.color;
          offCtx.strokeStyle = layer.color;
          const fillType = drawShapePath(offCtx, layer.scale);
          if (fillType === 'stroke') {
            offCtx.stroke();
          } else if (fillType === 'fill-evenodd') {
            offCtx.fill('evenodd');
          } else {
            offCtx.fill();
          }
          offCtx.restore();
        }
        
        // Draw the solid shape on top with feathered edge (use first stop color)
        offCtx.save();
        const firstStop = sortedStops[0];
        // Use selected color if one color mode is enabled
        const firstColor = currentOneColorMode ? currentOneColorModeColor : firstStop.color;
        offCtx.shadowColor = firstColor;
        offCtx.shadowBlur = 6;
        offCtx.fillStyle = firstColor;
        offCtx.strokeStyle = firstColor;
        const fillType = drawShapePath(offCtx, 1);
        if (fillType === 'stroke') {
          offCtx.stroke();
        } else if (fillType === 'fill-evenodd') {
          offCtx.fill('evenodd');
        } else {
          offCtx.fill();
        }
        offCtx.restore();
      }
      
      return offscreen;
    };
    
    // Helper function to interpolate between two colors in RGB space
    const interpolateColor = (color1, color2, t) => {
      // Parse hex colors to RGB
      const hex1 = color1.replace('#', '');
      const hex2 = color2.replace('#', '');
      const r1 = parseInt(hex1.substring(0, 2), 16);
      const g1 = parseInt(hex1.substring(2, 4), 16);
      const b1 = parseInt(hex1.substring(4, 6), 16);
      const r2 = parseInt(hex2.substring(0, 2), 16);
      const g2 = parseInt(hex2.substring(2, 4), 16);
      const b2 = parseInt(hex2.substring(4, 6), 16);
      
      // Linear interpolation in RGB space
      const r = Math.round(r1 + (r2 - r1) * t);
      const g = Math.round(g1 + (g2 - g1) * t);
      const b = Math.round(b1 + (b2 - b1) * t);
      
      // Clamp values
      const clampedR = Math.max(0, Math.min(255, r));
      const clampedG = Math.max(0, Math.min(255, g));
      const clampedB = Math.max(0, Math.min(255, b));
      
      return `#${clampedR.toString(16).padStart(2, '0')}${clampedG.toString(16).padStart(2, '0')}${clampedB.toString(16).padStart(2, '0')}`;
    };
    
    // Helper function to interpolate between two gradient stop arrays
    const interpolateStops = (stops1, stops2, t) => {
      // For simplicity, interpolate matching indices (assume same number of stops)
      // If different lengths, use the longer one and interpolate with last stop of shorter
      const maxLength = Math.max(stops1.length, stops2.length);
      const interpolated = [];
      
      for (let i = 0; i < maxLength; i++) {
        const stop1 = stops1[i] || stops1[stops1.length - 1];
        const stop2 = stops2[i] || stops2[stops2.length - 1];
        
        interpolated.push({
          position: stop1.position + (stop2.position - stop1.position) * t,
          color: interpolateColor(stop1.color, stop2.color, t),
          opacity: stop1.opacity + (stop2.opacity - stop1.opacity) * t
        });
      }
      
      return interpolated;
    };
    
    // Helper function to draw a circle with offset radial gradient
    const drawCircleWithOffsetGradient = (ctx, x, y, radius, stops, offsetX, offsetY, currentOneColorMode, currentOneColorModeColor) => {
      const sortedStops = [...stops].sort((a, b) => a.position - b.position);
      const centerX = x + offsetX;
      const centerY = y + offsetY;
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      
      sortedStops.forEach(stop => {
        const color = currentOneColorMode ? currentOneColorModeColor : stop.color;
        const colorWithOpacity = stop.opacity < 1 
          ? color + Math.round(stop.opacity * 255).toString(16).padStart(2, '0')
          : color;
        gradient.addColorStop(stop.position, colorWithOpacity);
      });
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    };
    
    // Create caches for all shapes and gradients
    const shapeTypes = ['circle', 'x', 'torus', 'triangle', 'square'];
    const gradientCache = {};
    shapeTypes.forEach(shape => {
      gradientCache[shape] = gradientStopsArray.map((stops) => {
        return createShapeCache(stops, shape);
      });
    });
    
    // Create intermediate gradient caches for smooth color transitions
    const createIntermediateCache = (shape, fromIndex, toIndex, t) => {
      // Clamp t between 0 and 1
      const clampedT = Math.max(0, Math.min(1, t));
      
      // If at boundaries, return the exact gradient
      if (clampedT <= 0) {
        return gradientCache[shape][fromIndex];
      }
      if (clampedT >= 1) {
        return gradientCache[shape][toIndex];
      }
      
      // Interpolate between the two gradient stop arrays
      const fromStops = gradientStopsArray[fromIndex];
      const toStops = gradientStopsArray[toIndex];
      const interpolated = interpolateStops(fromStops, toStops, clampedT);
      return createShapeCache(interpolated, shape);
    };

    // Trail rendering functions
    const drawTrail = (ctx, positionHistory, cfg, finalOpacity, cache, shouldRotate, rotationToUse, rotationSpeed, particleShape) => {
      if (cfg.motionBlur <= 0 || positionHistory.length === 0) return;

      const trailType = cfg.trailType || 'echo';
      const maxDistance = Math.max(canvas.width, canvas.height) * 0.5; // Max distance for valid trail segments
      
      switch (trailType) {
        case 'echo':
          drawEchoTrail(ctx, positionHistory, cfg, finalOpacity, cache, shouldRotate, rotationToUse, rotationSpeed, particleShape);
          break;
        case 'streak':
          drawStreakTrail(ctx, positionHistory, cfg, finalOpacity, maxDistance);
          break;
        case 'ribbon':
          drawRibbonTrail(ctx, positionHistory, cfg, finalOpacity, maxDistance);
          break;
        case 'sparkle':
          drawSparkleTrail(ctx, positionHistory, cfg, finalOpacity, cache);
          break;
        case 'glow':
          drawGlowTrail(ctx, positionHistory, cfg, finalOpacity, maxDistance);
          break;
        case 'fade':
          drawFadeTrail(ctx, positionHistory, cfg, finalOpacity, maxDistance);
          break;
        default:
          drawEchoTrail(ctx, positionHistory, cfg, finalOpacity, cache, shouldRotate, rotationToUse, rotationSpeed, particleShape);
      }
    };

    // Echo trail: Faded copies of previous positions
    const drawEchoTrail = (ctx, positionHistory, cfg, finalOpacity, cache, shouldRotate, rotationToUse, rotationSpeed, particleShape) => {
      for (let i = 0; i < positionHistory.length; i++) {
        const pos = positionHistory[i];
        const fadeAmount = (i + 1) / positionHistory.length;
        const echoOpacity = fadeAmount * cfg.motionBlur * finalOpacity;
        
        const size = pos.radius * 2;
        ctx.globalAlpha = echoOpacity;
        if (shouldRotate) {
          ctx.save();
          ctx.translate(pos.x, pos.y);
          const trailRotation = particleShape === 'triangle' 
            ? rotationToUse 
            : rotationToUse - rotationSpeed * (positionHistory.length - i);
          ctx.rotate(trailRotation);
          ctx.drawImage(cache, -size/2, -size/2, size, size);
          ctx.restore();
        } else {
          ctx.drawImage(cache, pos.x - size/2, pos.y - size/2, size, size);
        }
      }
    };

    // Streak trail: Continuous line connecting positions
    const drawStreakTrail = (ctx, positionHistory, cfg, finalOpacity, maxDistance) => {
      if (positionHistory.length < 2) return;
      
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Helper to convert hex to RGB
      const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 200, g: 200, b: 255 }; // fallback to original blue
      };
      
      const rgb = hexToRgb(cfg.streakColor || '#c8c8ff');
      
      // Draw lines with increasing opacity
      for (let i = 0; i < positionHistory.length - 1; i++) {
        const pos1 = positionHistory[i];
        const pos2 = positionHistory[i + 1];
        
        // Check distance - skip if positions are too far apart (likely a wrap/jump)
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > maxDistance) continue; // Skip drawing this segment
        
        const fadeAmount = (i + 1) / positionHistory.length;
        const lineOpacity = Math.min(1, fadeAmount * cfg.motionBlur * finalOpacity * 2);
        const lineWidth = Math.max(2, pos1.radius * 0.5 * fadeAmount);
        
        // Use the configurable streak color
        ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${lineOpacity})`;
        ctx.globalAlpha = 1;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(pos1.x, pos1.y);
        ctx.lineTo(pos2.x, pos2.y);
        ctx.stroke();
      }
      
      ctx.restore();
    };

    // Ribbon trail: Smooth curved path with varying width
    const drawRibbonTrail = (ctx, positionHistory, cfg, finalOpacity, maxDistance) => {
      if (positionHistory.length < 2) return;
      
      ctx.save();
      
      // Draw ribbon segments
      for (let i = 0; i < positionHistory.length - 1; i++) {
        const pos1 = positionHistory[i];
        const pos2 = positionHistory[i + 1];
        
        // Calculate perpendicular vector for ribbon width
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Skip if positions are too close or too far apart
        if (dist < 0.1 || dist > maxDistance) continue;
        
        const fadeAmount = (i + 1) / positionHistory.length;
        const ribbonOpacity = Math.min(1, fadeAmount * cfg.motionBlur * finalOpacity * 2);
        const width = Math.max(3, pos1.radius * 0.6 * fadeAmount);
        
        // Use a visible color
        ctx.fillStyle = `rgba(200, 200, 255, ${ribbonOpacity})`;
        ctx.globalAlpha = 1;
        
        const perpX = -dy / dist;
        const perpY = dx / dist;
        
        // Draw ribbon segment as a quad
        ctx.beginPath();
        ctx.moveTo(pos1.x + perpX * width, pos1.y + perpY * width);
        ctx.lineTo(pos1.x - perpX * width, pos1.y - perpY * width);
        ctx.lineTo(pos2.x - perpX * width, pos2.y - perpY * width);
        ctx.lineTo(pos2.x + perpX * width, pos2.y + perpY * width);
        ctx.closePath();
        ctx.fill();
      }
      
      ctx.restore();
    };

    // Sparkle trail: Small particles scattered along the trail
    const drawSparkleTrail = (ctx, positionHistory, cfg, finalOpacity, cache) => {
      if (positionHistory.length === 0) return;
      
      ctx.save();
      const sampleInterval = Math.max(1, Math.floor(positionHistory.length / 10));
      
      for (let i = 0; i < positionHistory.length; i += sampleInterval) {
        const pos = positionHistory[i];
        const fadeAmount = (i + 1) / positionHistory.length;
        const sparkleOpacity = fadeAmount * cfg.motionBlur * finalOpacity;
        const sparkleSize = Math.max(2, pos.radius * 0.3 * fadeAmount);
        
        ctx.globalAlpha = sparkleOpacity;
        ctx.drawImage(cache, pos.x - sparkleSize/2, pos.y - sparkleSize/2, sparkleSize, sparkleSize);
      }
      
      ctx.restore();
    };

    // Glow trail: Gradient glow along the path
    const drawGlowTrail = (ctx, positionHistory, cfg, finalOpacity, maxDistance) => {
      if (positionHistory.length < 2) return;
      
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Filter out positions that are too far apart to avoid cross-screen lines
      const filteredHistory = [];
      for (let i = 0; i < positionHistory.length; i++) {
        if (i === 0) {
          filteredHistory.push(positionHistory[i]);
        } else {
          const prev = filteredHistory[filteredHistory.length - 1];
          const curr = positionHistory[i];
          const dx = curr.x - prev.x;
          const dy = curr.y - prev.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= maxDistance) {
            filteredHistory.push(curr);
          } else {
            // If distance is too large, draw current segment and start a new one
            if (filteredHistory.length > 1) {
              // Draw current segment before starting new one
              for (let layer = 2; layer >= 0; layer--) {
                const layerWidth = (layer + 1) * 4;
                const layerOpacity = Math.min(1, (1 - layer * 0.25) * cfg.motionBlur * finalOpacity * 1.5);
                
                ctx.strokeStyle = `rgba(200, 220, 255, ${layerOpacity})`;
                ctx.lineWidth = layerWidth;
                ctx.globalAlpha = 1;
                
                ctx.beginPath();
                for (let j = 0; j < filteredHistory.length; j++) {
                  const pos = filteredHistory[j];
                  if (j === 0) {
                    ctx.moveTo(pos.x, pos.y);
                  } else {
                    ctx.lineTo(pos.x, pos.y);
                  }
                }
                ctx.stroke();
              }
              // Start new segment
              filteredHistory.length = 0;
              filteredHistory.push(curr);
            } else {
              filteredHistory[0] = curr;
            }
          }
        }
      }
      
      // Draw remaining segment
      if (filteredHistory.length > 1) {
        for (let layer = 2; layer >= 0; layer--) {
          const layerWidth = (layer + 1) * 4;
          const layerOpacity = Math.min(1, (1 - layer * 0.25) * cfg.motionBlur * finalOpacity * 1.5);
          
          ctx.strokeStyle = `rgba(200, 220, 255, ${layerOpacity})`;
          ctx.lineWidth = layerWidth;
          ctx.globalAlpha = 1;
          
          ctx.beginPath();
          for (let j = 0; j < filteredHistory.length; j++) {
            const pos = filteredHistory[j];
            if (j === 0) {
              ctx.moveTo(pos.x, pos.y);
            } else {
              ctx.lineTo(pos.x, pos.y);
            }
          }
          ctx.stroke();
        }
      }
      
      ctx.restore();
    };

    // Fade trail: Single smooth fading tail
    const drawFadeTrail = (ctx, positionHistory, cfg, finalOpacity, maxDistance) => {
      if (positionHistory.length < 2) return;
      
      ctx.save();
      
      // Filter out positions that are too far apart
      const filteredHistory = [];
      for (let i = 0; i < positionHistory.length; i++) {
        if (i === 0) {
          filteredHistory.push(positionHistory[i]);
        } else {
          const prev = filteredHistory[filteredHistory.length - 1];
          const curr = positionHistory[i];
          const dx = curr.x - prev.x;
          const dy = curr.y - prev.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= maxDistance) {
            filteredHistory.push(curr);
          } else {
            // If distance is too large, draw current segment and start a new one
            if (filteredHistory.length > 1) {
              // Draw current segment
              const firstPos = filteredHistory[0];
              const lastPos = filteredHistory[filteredHistory.length - 1];
              const gradient = ctx.createLinearGradient(
                firstPos.x, firstPos.y,
                lastPos.x, lastPos.y
              );
              
              for (let j = 0; j < filteredHistory.length; j++) {
                const fadeAmount = (j + 1) / filteredHistory.length;
                const stopOpacity = Math.min(1, fadeAmount * cfg.motionBlur * finalOpacity * 2);
                const stopPos = j / Math.max(1, filteredHistory.length - 1);
                gradient.addColorStop(stopPos, `rgba(200, 220, 255, ${stopOpacity})`);
              }
              
              ctx.strokeStyle = gradient;
              ctx.lineWidth = Math.max(3, filteredHistory[0].radius * 0.8);
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              ctx.globalAlpha = 1;
              
              ctx.beginPath();
              for (let j = 0; j < filteredHistory.length; j++) {
                const pos = filteredHistory[j];
                if (j === 0) {
                  ctx.moveTo(pos.x, pos.y);
                } else {
                  ctx.lineTo(pos.x, pos.y);
                }
              }
              ctx.stroke();
              
              // Start new segment
              filteredHistory.length = 0;
              filteredHistory.push(curr);
            } else {
              filteredHistory[0] = curr;
            }
          }
        }
      }
      
      // Draw remaining segment
      if (filteredHistory.length > 1) {
        const firstPos = filteredHistory[0];
        const lastPos = filteredHistory[filteredHistory.length - 1];
        const gradient = ctx.createLinearGradient(
          firstPos.x, firstPos.y,
          lastPos.x, lastPos.y
        );
        
        for (let i = 0; i < filteredHistory.length; i++) {
          const fadeAmount = (i + 1) / filteredHistory.length;
          const stopOpacity = Math.min(1, fadeAmount * cfg.motionBlur * finalOpacity * 2);
          const stopPos = i / Math.max(1, filteredHistory.length - 1);
          gradient.addColorStop(stopPos, `rgba(200, 220, 255, ${stopOpacity})`);
        }
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = Math.max(3, filteredHistory[0].radius * 0.8);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 1;
        
        ctx.beginPath();
        for (let i = 0; i < filteredHistory.length; i++) {
          const pos = filteredHistory[i];
          if (i === 0) {
            ctx.moveTo(pos.x, pos.y);
          } else {
            ctx.lineTo(pos.x, pos.y);
          }
        }
        ctx.stroke();
      }
      
      ctx.restore();
    };

    class Particle {
      constructor(index, cfg) {
        this.index = index;
        
        // Calculate unit sphere position (fixed per particle)
        const phi = Math.acos(1 - 2 * (index + 0.5) / cfg.particleCount);
        const theta = Math.PI * (1 + Math.sqrt(5)) * index;
        this.unitX = Math.sin(phi) * Math.cos(theta);
        this.unitY = Math.sin(phi) * Math.sin(theta);
        this.unitZ = Math.cos(phi);
        
        // Calculate grid position (fixed per particle)
        // Fill columns first (top-to-bottom, left-to-right)
        // Use specified grid dimensions if available (grid state), otherwise calculate from particle count
        const gridCols = cfg.gridCols || Math.ceil(Math.sqrt(cfg.particleCount));
        const gridRows = cfg.gridRows || Math.ceil(cfg.particleCount / gridCols);
        // Fill columns: particles go down each column before moving to next column
        this.gridRow = index % gridRows;
        this.gridCol = Math.floor(index / gridRows);
        this.gridCols = gridCols; // Store for use in updateFromConfig
        this.gridRows = gridRows; // Store for use in updateFromConfig
        
        // Random values stored for consistent behavior
        this.scatterX = (Math.random() - 0.5) * 2;
        this.scatterY = (Math.random() - 0.5) * 2;
        this.scatterZ = (Math.random() - 0.5) * 2;
        const scatterMag = Math.sqrt(
          this.scatterX * this.scatterX + 
          this.scatterY * this.scatterY + 
          this.scatterZ * this.scatterZ
        );
        this.scatterX /= scatterMag;
        this.scatterY /= scatterMag;
        this.scatterZ /= scatterMag;
        
        this.breathingSpeedRatio = Math.random();
        this.breathingAmountRatio = Math.random();
        this.breathingPhase = Math.random() * Math.PI * 2;
        this.radiusRatio = Math.random();
        
        // Grid vertical movement properties
        this.gridVerticalSpeedRatio = Math.random();
        this.gridVerticalAmplitudeRatio = Math.random();
        this.gridVerticalPhase = Math.random() * Math.PI * 2;
        
        // Noise offsets (consistent per particle)
        this.noiseOffsetX = (Math.random() - 0.5) * 2;
        this.noiseOffsetY = (Math.random() - 0.5) * 2;
        
        this.colorSetIndex = Math.floor(Math.random() * gradientStopsArray.length);
        this.colorSet = gradientStopsArray[this.colorSetIndex];
        this.pulseOffset = index * 0.05;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.08;
        this.lastX2d = 0;
        this.lastY2d = 0;
        this.movementAngle = 0;
        
        // Initialize positions based on config
        this.updateFromConfig(cfg);
        
        // Calculate gradient offset for organic feel (15-30% of radius)
        const offsetRange = 0.15 + Math.random() * 0.15; // 15-30% range
        const maxOffset = this.baseRadius * offsetRange;
        this.gradientOffsetX = (Math.random() - 0.5) * maxOffset * 2;
        this.gradientOffsetY = (Math.random() - 0.5) * maxOffset * 2;
        
        this.x3d = this.baseX;
        this.y3d = this.baseY;
        this.z3d = this.baseZ;
        
        this.x2d = 0;
        this.y2d = 0;
        this.scale = 1;
        this.depth = 0;
        this.currentRadius = this.baseRadius; // Initialize to prevent undefined
        
        // Store position history for echo effect
        this.positionHistory = [];
        this.trailFrameCounter = 0;
        
        // Division properties for Birth state
        this.parentId = null;
        this.divisionLevel = 0;
        this.divisionProgress = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.targetZ = 0;
        this.startX = 0;
        this.startY = 0;
        this.startZ = 0;
        this.isDividing = false;
        this.divisionDirection = null; // Unit vector for separation direction
        this.divisionDelay = 0; // Staggered start time (0-1)
        this.orbitalPhase = Math.random() * Math.PI * 2; // For orbital motion
        this.orbitalRadius = 0; // Orbital radius during division
        this.separationDistance = separationDistance; // Individual separation distance
        this.rotationPhase = Math.random() * Math.PI * 2; // Rotation during division
        this.siblingId = null; // ID of the particle it split from (for metaball effect)
        this.parentParticle = null; // Reference to parent for metaball merging
        this.splitColorIndex = null; // Second color for split visualization
        this.isPreDividing = false; // True when showing two color halves before division
        this.originalColorIndex = null; // Store original color before transition
        this.targetColorIndex = null; // Target color to transition to
        this.divisionTimeOffset = 0; // Random timing offset for organic division start (0-1)
        this.divisionStartDelay = 0; // Per-particle delay before division starts (in milliseconds, 0-500ms)
        this.divisionStartTime = 0; // Individual start time for this particle's division (timestamp)
      }
      
      // Recalculate base positions from current config (uses stored unit positions)
      updateFromConfig(cfg) {
        // Sphere positions (for gathering/birth states)
        this.baseX = cfg.sphereRadius * this.unitX;
        this.baseY = cfg.sphereRadius * this.unitY;
        this.baseZ = cfg.sphereRadius * this.unitZ;
        
        // Grid positions (for grid state)
        // Recalculate grid dimensions if they changed in config
        const gridCols = cfg.gridCols || this.gridCols;
        const gridRows = cfg.gridRows || this.gridRows;
        // Update stored dimensions
        this.gridCols = gridCols;
        this.gridRows = gridRows;
        // Recalculate grid position if dimensions changed
        if (cfg.gridCols || cfg.gridRows) {
          this.gridRow = this.index % gridRows;
          this.gridCol = Math.floor(this.index / gridRows);
        }
        
        // Calculate spacing based on grid width/height and number of rows/columns
        const gridWidth = cfg.gridWidth || 1950;
        const gridHeight = cfg.gridHeight || 1800;
        // Calculate spacing: divide total size by number of cells (cols-1 and rows-1 for spacing between)
        const gridSpacingX = gridCols > 1 ? gridWidth / (gridCols - 1) : 0;
        const gridSpacingY = gridRows > 1 ? gridHeight / (gridRows - 1) : 0;
        
        // Position particles: center the grid and space evenly
        this.gridBaseX = (this.gridCol - (gridCols - 1) / 2) * gridSpacingX;
        this.gridBaseY = (this.gridRow - (gridRows - 1) / 2) * gridSpacingY;
        this.gridBaseZ = 0; // Keep grid in 2D plane
        
        // Calculate per-particle vertical movement values (with fallback defaults)
        const speedMin = cfg.gridVerticalSpeedMin ?? 0.01;
        const speedMax = cfg.gridVerticalSpeedMax ?? 0.02;
        const ampMin = cfg.gridVerticalAmplitudeMin ?? 20;
        const ampMax = cfg.gridVerticalAmplitudeMax ?? 40;
        this.gridVerticalSpeed = speedMin + this.gridVerticalSpeedRatio * (speedMax - speedMin);
        this.gridVerticalAmplitude = ampMin + this.gridVerticalAmplitudeRatio * (ampMax - ampMin);
        
        this.breathingSpeed = cfg.breathingSpeedMin + this.breathingSpeedRatio * (cfg.breathingSpeedMax - cfg.breathingSpeedMin);
        this.breathingAmount = cfg.breathingAmountMin + this.breathingAmountRatio * (cfg.breathingAmountMax - cfg.breathingAmountMin);
        this.baseRadius = cfg.minRadius + this.radiusRatio * (cfg.maxRadius - cfg.minRadius);
      }
      
      updatePosition(cfg, state, divisionProgress, time, currentTime) {
        if (state === 'birth' && this.isDividing) {
          // Calculate per-particle division progress based on individual start time
          let particleProgress = 0;
          if (this.divisionStartTime > 0 && currentTime) {
            const particleElapsed = Math.max(0, currentTime - this.divisionStartTime);
            particleProgress = Math.min(1, particleElapsed / divisionDuration);
          } else {
            // Fallback to global progress if per-particle timing not available
            particleProgress = divisionProgress;
          }
          
          // Apply both timing offset and staggered delay for organic feel
          const offsetProgress = Math.max(0, particleProgress - this.divisionTimeOffset);
          const delayedProgress = Math.max(0, Math.min(1, (offsetProgress - this.divisionDelay) / (1 - this.divisionDelay)));
          
          // Organic easing: ease-out with slight overshoot feel
          const eased = 1 - Math.pow(1 - delayedProgress, 2.5);
          
          // Base linear interpolation
          const baseX = this.startX + (this.targetX - this.startX) * eased;
          const baseY = this.startY + (this.targetY - this.startY) * eased;
          const baseZ = this.startZ + (this.targetZ - this.startZ) * eased;
          
          // Add orbital motion for organic curve (stronger at start, fades out)
          const orbitalStrength = Math.sin(delayedProgress * Math.PI) * 0.25; // Peaks in middle
          const orbitalAngle = this.orbitalPhase + delayedProgress * Math.PI * 1.5;
          
          // Calculate perpendicular vector for orbital motion
          const dir = this.divisionDirection;
          // Create a perpendicular vector using cross product with a reference vector
          const refVec = { x: 0, y: 1, z: 0 };
          // If direction is too close to reference, use different reference
          if (Math.abs(dir.x) < 0.1 && Math.abs(dir.z) < 0.1) {
            refVec.x = 1;
            refVec.y = 0;
          }
          // Cross product to get perpendicular
          const perpX = dir.y * refVec.z - dir.z * refVec.y;
          const perpY = dir.z * refVec.x - dir.x * refVec.z;
          const perpZ = dir.x * refVec.y - dir.y * refVec.x;
          const perpMag = Math.sqrt(perpX * perpX + perpY * perpY + perpZ * perpZ);
          const perpNormX = perpMag > 0 ? perpX / perpMag : 1;
          const perpNormY = perpMag > 0 ? perpY / perpMag : 0;
          const perpNormZ = perpMag > 0 ? perpZ / perpMag : 0;
          
          const orbitalOffsetX = Math.cos(orbitalAngle) * perpNormX * this.orbitalRadius * orbitalStrength;
          const orbitalOffsetY = Math.sin(orbitalAngle) * perpNormY * this.orbitalRadius * orbitalStrength;
          const orbitalOffsetZ = Math.sin(orbitalAngle * 0.8) * perpNormZ * this.orbitalRadius * orbitalStrength;
          
          // Add slight wobble/breathing during division (deterministic based on phase)
          const wobbleAmount = Math.sin(delayedProgress * Math.PI * 4 + this.rotationPhase) * 2;
          const wobbleX = Math.sin(this.rotationPhase + delayedProgress * Math.PI * 3) * wobbleAmount * 0.08;
          const wobbleY = Math.cos(this.rotationPhase * 1.3 + delayedProgress * Math.PI * 3.5) * wobbleAmount * 0.08;
          const wobbleZ = Math.sin(this.rotationPhase * 0.7 + delayedProgress * Math.PI * 2.7) * wobbleAmount * 0.08;
          
          this.x3d = baseX + orbitalOffsetX + wobbleX;
          this.y3d = baseY + orbitalOffsetY + wobbleY;
          this.z3d = baseZ + orbitalOffsetZ + wobbleZ;
        } else if (state === 'grid') {
          // Grid state: maintain grid positions with optional vertical movement
          this.x3d = this.gridBaseX;
          this.z3d = this.gridBaseZ;
          // Apply vertical oscillation if enabled
          if (cfg.gridVerticalMovementEnabled && 
              typeof this.gridVerticalSpeed !== 'undefined' && 
              typeof this.gridVerticalAmplitude !== 'undefined' &&
              typeof this.gridVerticalPhase !== 'undefined') {
            this.y3d = this.gridBaseY + Math.sin(time * this.gridVerticalSpeed + this.gridVerticalPhase) * this.gridVerticalAmplitude;
          } else {
            this.y3d = this.gridBaseY;
          }
        } else {
          // Gathering state: original sphere movement logic
          const scatterOffset = cfg.scatter;
          
          this.breathingPhase += this.breathingSpeed;
          const breathingOffset = Math.sin(this.breathingPhase) * this.breathingAmount;
          
          const mag = Math.sqrt(
            this.baseX * this.baseX + 
            this.baseY * this.baseY + 
            this.baseZ * this.baseZ
          );
          
          const factor = mag > 0 ? (mag + breathingOffset) / mag : 1;
          
          this.x3d = this.baseX * factor + this.scatterX * scatterOffset;
          this.y3d = this.baseY * factor + this.scatterY * scatterOffset;
          this.z3d = this.baseZ * factor + this.scatterZ * scatterOffset;
        }
      }

      rotate(angleX, angleY, cfg, canvasWidth, canvasHeight, state) {
        // For grid state, directly project to 2D without 3D rotation
        if (state === 'grid') {
          const centerX = canvasWidth / 2;
          const centerY = canvasHeight / 2;
          // Direct 2D projection - no rotation, no perspective
          this.x2d = centerX + this.x3d;
          this.y2d = centerY + this.y3d;
          this.depth = this.z3d;
          this.scale = 1; // No perspective scaling for flat 2D grid
        } else {
          // Original 3D rotation logic for other states
          const cosX = Math.cos(angleX);
          const sinX = Math.sin(angleX);
          const y1 = this.y3d * cosX - this.z3d * sinX;
          const z1 = this.y3d * sinX + this.z3d * cosX;
          
          const cosY = Math.cos(angleY);
          const sinY = Math.sin(angleY);
          const x2 = this.x3d * cosY + z1 * sinY;
          const z2 = -this.x3d * sinY + z1 * cosY;
          
          this.depth = z2;
          
          const scale = cfg.perspective / (cfg.perspective + z2);
          this.scale = scale;
          
          const centerX = canvasWidth / 2;
          const centerY = canvasHeight / 2;
          
          this.x2d = centerX + x2 * scale;
          this.y2d = centerY + y1 * scale;
        }
        
        // Store position in history for echo effect
        if (cfg.motionBlur > 0) {
          const maxHistory = cfg.motionBlurSteps;
          const trailInterval = cfg.trailInterval || 1;
          
          // Increment frame counter
          this.trailFrameCounter++;
          
          // Only store position every N frames (based on trailInterval)
          if (this.trailFrameCounter >= trailInterval) {
            this.positionHistory.push({
              x: this.x2d,
              y: this.y2d,
              radius: this.currentRadius
            });
            this.trailFrameCounter = 0; // Reset counter
          }
          
          // Trim to max length
          while (this.positionHistory.length > maxHistory) {
            this.positionHistory.shift();
          }
        } else if (this.positionHistory.length > 0) {
          this.positionHistory.length = 0;
          this.trailFrameCounter = 0;
        }
      }

      update(time, cfg, state, allParticles, divisionProgress, currentTime) {
        const pulse = Math.sin(time * cfg.pulseSpeed + this.pulseOffset);
        let baseRadius = this.baseRadius * this.scale + pulse * 3 * this.scale;
        
        // For dividing particles: start at 50% size and grow to 100% as they separate
        // This creates the "split" effect where each half grows into a full particle
        if (state === 'birth' && this.isDividing) {
          // Calculate per-particle division progress
          let particleProgress = 0;
          if (this.divisionStartTime > 0 && currentTime) {
            const particleElapsed = Math.max(0, currentTime - this.divisionStartTime);
            particleProgress = Math.min(1, particleElapsed / divisionDuration);
          } else {
            particleProgress = divisionProgress;
          }
          
          // Apply timing offset and delay (same as movement calculation)
          const offsetProgress = Math.max(0, particleProgress - this.divisionTimeOffset);
          const delayedProgress = Math.max(0, Math.min(1, (offsetProgress - this.divisionDelay) / (1 - this.divisionDelay)));
          
          // Ultra-smooth 4th power ease-in-out for size growth
          const sizeEase = delayedProgress < 0.5
            ? 2 * delayedProgress * delayedProgress * delayedProgress * delayedProgress
            : 1 - Math.pow(-2 * delayedProgress + 2, 4) / 2;
          
          // Scale from 50% to 100% of base radius
          const sizeMultiplier = 0.5 + (sizeEase * 0.5); // 0.5 to 1.0
          baseRadius *= sizeMultiplier;
        }
        
        // Metaball effect: merge with sibling when close
        if (state === 'birth' && this.siblingId !== null && allParticles) {
          const sibling = allParticles.find(p => p.index === this.siblingId);
          if (sibling) {
            const dx = this.x3d - sibling.x3d;
            const dy = this.y3d - sibling.y3d;
            const dz = this.z3d - sibling.z3d;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            // Prevent division by zero and sudden jumps when particles are at same position
            const minSafeDistance = 0.1; // Minimum safe distance to prevent jumps
            const safeDistance = Math.max(distance, minSafeDistance);
            
            const mergeDistance = this.baseRadius * 4; // Distance at which merging starts
            
            // Smooth metaball strength calculation with gradual falloff
            const normalizedDistance = Math.min(1, safeDistance / mergeDistance);
            // Use smoothstep for gradual transition
            const mergeStrength = 1 - (normalizedDistance * normalizedDistance * (3 - 2 * normalizedDistance));
            
            // Gradually reduce metaball boost when particles are very close (fully merged)
            // This prevents the "doubled" appearance at the start
            const minDistance = this.baseRadius * 0.3; // Larger threshold for smoother transition
            const closeFactor = safeDistance < minDistance 
              ? Math.max(0.1, safeDistance / minDistance) // Never go to 0, minimum 0.1 to prevent jumps
              : 1;
            
            // Increase size when merging (metaball effect) - smoothly reduced when fully merged
            const mergeBoost = mergeStrength * closeFactor * this.baseRadius * 0.3; // Reduced for smoother effect
            baseRadius += mergeBoost * this.scale;
          }
        }
        
        // Fade out parent particles as children separate (if this particle has children dividing)
        // Use global progress for parents (they fade based on when children start dividing)
        // Parent shrinks from 100% to 0% using the same easing curve as children for perfect synchronization
        if (state === 'birth' && !this.isDividing && divisionProgress !== undefined) {
          // Check if any particles have this as parent
          const hasDividingChildren = allParticles && allParticles.some(p => 
            p.parentId === this.index && p.isDividing
          );
          if (hasDividingChildren) {
            // Use ultra-smooth 4th power ease-in-out (same as children) for perfect synchronization
            const smoothFadeOut = divisionProgress < 0.5
              ? 2 * divisionProgress * divisionProgress * divisionProgress * divisionProgress
              : 1 - Math.pow(-2 * divisionProgress + 2, 4) / 2;
            
            // Shrink from 100% to 0% - when children reach full size, parent is completely gone
            baseRadius *= (1 - smoothFadeOut); // Shrink to 0% of original size
          }
        }
        
        // Allow parent particles to shrink to 0 when fading out, otherwise minimum is 1
        const isFadingParent = state === 'birth' && !this.isDividing && divisionProgress !== undefined && 
          allParticles && allParticles.some(p => p.parentId === this.index && p.isDividing);
        this.currentRadius = isFadingParent ? Math.max(0, baseRadius) : Math.max(1, baseRadius);
      }

      draw(ctx, cfg, time, state, allParticles, divisionProgress, currentTime) {
        // Update rotation if auto-rotate is enabled
        if (cfg.autoRotateShapes) {
          if (cfg.particleShape === 'triangle') {
            // Triangle points in direction of movement
            const dx = this.x2d - this.lastX2d;
            const dy = this.y2d - this.lastY2d;
            if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
              this.movementAngle = Math.atan2(dy, dx) + Math.PI / 2;
            }
            this.lastX2d = this.x2d;
            this.lastY2d = this.y2d;
          } else {
            this.rotation += this.rotationSpeed;
          }
        }
        
        const depthOpacity = Math.max(0.5, Math.min(1, (this.depth + cfg.sphereRadius) / (cfg.sphereRadius * 2)));
        let finalOpacity = depthOpacity * cfg.particleOpacity;
        
        // Fade out parent particles as children separate
        // Use global progress for parents (they fade based on when children start dividing)
        // Use the same easing curve as size shrinking for perfect synchronization
        if (state === 'birth' && !this.isDividing && divisionProgress !== undefined) {
          const hasDividingChildren = allParticles && allParticles.some(p => 
            p.parentId === this.index && p.isDividing
          );
          if (hasDividingChildren) {
            // Use ultra-smooth 4th power ease-in-out (same as size shrinking) for perfect synchronization
            const smoothFadeOut = divisionProgress < 0.5
              ? 2 * divisionProgress * divisionProgress * divisionProgress * divisionProgress
              : 1 - Math.pow(-2 * divisionProgress + 2, 4) / 2;
            
            // Fade to transparent - synchronized with size shrinking
            finalOpacity *= (1 - smoothFadeOut); // Fade to transparent
          }
        }
        
        // Metaball effect: reduce opacity when very close to sibling to avoid dark multiply overlap
        if (state === 'birth' && this.siblingId !== null && allParticles) {
          const sibling = allParticles.find(p => p.index === this.siblingId);
          if (sibling) {
            const dx = this.x2d - sibling.x2d;
            const dy = this.y2d - sibling.y2d;
            const distance2d = Math.sqrt(dx * dx + dy * dy);
            const mergeDistance = this.currentRadius * 2.5;
            const mergeStrength = Math.max(0, 1 - (distance2d / mergeDistance));
            
            // Reduce opacity when very close to avoid dark multiply overlap
            // When particles are overlapping (distance < radius), reduce opacity significantly
            const overlapThreshold = this.currentRadius * 1.5;
            if (distance2d < overlapThreshold) {
              const overlapAmount = 1 - (distance2d / overlapThreshold);
              // Reduce opacity more as they get closer to prevent dark multiply effect
              finalOpacity *= (1 - overlapAmount * 0.6);
            } else {
              // Slight increase when moderately close (for metaball feel without overlap)
              finalOpacity = Math.min(1, finalOpacity + mergeStrength * 0.2);
            }
          }
        }
        // Determine which color to use based on division progress
        let currentColorIndex = this.colorSetIndex;
        let targetCache = gradientCache[cfg.particleShape || 'circle'][this.colorSetIndex];
        
        // Calculate per-particle progress for dividing particles
        let particleProgressForDraw = divisionProgress;
        if (state === 'birth' && this.isDividing && this.divisionStartTime > 0 && currentTime) {
          const particleElapsed = Math.max(0, currentTime - this.divisionStartTime);
          particleProgressForDraw = Math.min(1, particleElapsed / divisionDuration);
        }
        
        // Transition color during division - synchronized with movement
        if (state === 'birth' && this.isDividing && this.targetColorIndex !== null && particleProgressForDraw !== undefined) {
          // Apply same timing calculations as movement for synchronization
          const offsetProgress = Math.max(0, particleProgressForDraw - this.divisionTimeOffset);
          const delayedProgress = Math.max(0, Math.min(1, (offsetProgress - this.divisionDelay) / (1 - this.divisionDelay)));
          
          // Start color transition slightly after movement begins (when movement is ~5% visible)
          const transitionStart = 0.05; // Start when movement is 5% visible
          const transitionEnd = 1.0; // Complete by 100% of division (ultra gradual)
          
          if (delayedProgress > transitionStart) {
            const transitionProgress = Math.min(1, (delayedProgress - transitionStart) / (transitionEnd - transitionStart));
            // Ultra-smooth easing: ease-in-out with very gentle curve
            // Using a gentler ease-in-out that's smoother at the start and end
            const easedProgress = transitionProgress < 0.5
              ? 2 * transitionProgress * transitionProgress * transitionProgress * transitionProgress
              : 1 - Math.pow(-2 * transitionProgress + 2, 4) / 2;
            
            // Update color index for smooth transition
            if (easedProgress > 0.5) {
              // Switch to target color halfway through transition
              currentColorIndex = this.targetColorIndex;
              this.colorSetIndex = this.targetColorIndex;
              this.colorSet = gradientStopsArray[this.targetColorIndex];
            }
            
            targetCache = gradientCache[cfg.particleShape || 'circle'][currentColorIndex];
          }
        }
        
        const cache = targetCache;
        const shouldRotate = cfg.autoRotateShapes && cfg.particleShape !== 'circle';
        const rotationToUse = cfg.particleShape === 'triangle' ? this.movementAngle : this.rotation;
        
        // Draw trail effect
        drawTrail(ctx, this.positionHistory, cfg, finalOpacity, cache, shouldRotate, rotationToUse, this.rotationSpeed, cfg.particleShape);
        
        // Draw main particle
        const size = this.currentRadius * 2;
        ctx.globalAlpha = finalOpacity;
        
        // If transitioning colors, smoothly interpolate through color space
        // Use per-particle progress for dividing particles
        let particleProgressForColorTransition = divisionProgress;
        if (state === 'birth' && this.isDividing && this.divisionStartTime > 0 && currentTime) {
          const particleElapsed = Math.max(0, currentTime - this.divisionStartTime);
          particleProgressForColorTransition = Math.min(1, particleElapsed / divisionDuration);
        }
        
        if (state === 'birth' && this.isDividing && this.targetColorIndex !== null && this.originalColorIndex !== null && particleProgressForColorTransition !== undefined) {
          // Apply same timing calculations as movement for synchronization
          // This ensures color transition starts when movement becomes visible
          const offsetProgress = Math.max(0, particleProgressForColorTransition - this.divisionTimeOffset);
          const delayedProgress = Math.max(0, Math.min(1, (offsetProgress - this.divisionDelay) / (1 - this.divisionDelay)));
          
          // Start color transition slightly after movement begins (when movement is ~5% visible)
          // This prevents the weird moment where colors change but nothing moves
          const transitionStart = 0.05; // Start when movement is 5% visible
          const transitionEnd = 1.0; // Complete by 100% (ultra gradual)
          
          if (delayedProgress >= transitionStart && delayedProgress <= transitionEnd) {
            const transitionProgress = (delayedProgress - transitionStart) / (transitionEnd - transitionStart);
            // Ultra-smooth easing: ease-in-out with very gentle curve
            // Using a gentler ease-in-out that's smoother at the start and end
            const easedProgress = transitionProgress < 0.5
              ? 2 * transitionProgress * transitionProgress * transitionProgress * transitionProgress
              : 1 - Math.pow(-2 * transitionProgress + 2, 4) / 2;
            
            // Apply noise to transition drawing
            const noiseAmount = cfg.particleNoise || 0;
            const noiseX = this.noiseOffsetX * noiseAmount;
            const noiseY = this.noiseOffsetY * noiseAmount;
            const drawX = this.x2d + noiseX;
            const drawY = this.y2d + noiseY;
            
            ctx.save();
            ctx.translate(drawX, drawY);
            if (shouldRotate) {
              ctx.rotate(rotationToUse);
            }
            
            // For circles, create interpolated gradient with offset
            if (cfg.particleShape === 'circle') {
              // Interpolate between original and target color sets
              const originalStops = gradientStopsArray[this.originalColorIndex];
              const targetStops = gradientStopsArray[this.targetColorIndex];
              const interpolatedStops = interpolateStops(originalStops, targetStops, easedProgress);
              
              // Scale offset to current radius
              const offsetScale = this.currentRadius / this.baseRadius;
              const scaledOffsetX = this.gradientOffsetX * offsetScale;
              const scaledOffsetY = this.gradientOffsetY * offsetScale;
              
              ctx.globalAlpha = finalOpacity;
              drawCircleWithOffsetGradient(
                ctx, 
                0, 
                0, 
                this.currentRadius, 
                interpolatedStops, 
                scaledOffsetX, 
                scaledOffsetY,
                currentOneColorMode,
                currentOneColorModeColor
              );
            } else {
              // Create intermediate gradient cache that interpolates through color space
              // This smoothly passes through intermediate colors, avoiding saturation spikes
              try {
                const intermediateCache = createIntermediateCache(
                  cfg.particleShape || 'circle',
                  this.originalColorIndex,
                  this.targetColorIndex,
                  easedProgress
                );
                
                // Draw the interpolated color (single smooth transition through color space)
                ctx.globalAlpha = finalOpacity;
                ctx.drawImage(intermediateCache, -size/2, -size/2, size, size);
              } catch (e) {
                // Fallback to normal drawing if interpolation fails
                ctx.globalAlpha = finalOpacity;
                ctx.drawImage(cache, -size/2, -size/2, size, size);
              }
            }
            
            ctx.restore();
            } else {
              // Normal drawing after transition with noise
              const noiseAmount = cfg.particleNoise || 0;
              const noiseX = this.noiseOffsetX * noiseAmount;
              const noiseY = this.noiseOffsetY * noiseAmount;
              const drawX = this.x2d + noiseX;
              const drawY = this.y2d + noiseY;
              
              // For circles, use offset gradient for organic feel
              if (cfg.particleShape === 'circle') {
                // Scale offset to current radius
                const offsetScale = this.currentRadius / this.baseRadius;
                const scaledOffsetX = this.gradientOffsetX * offsetScale;
                const scaledOffsetY = this.gradientOffsetY * offsetScale;
                drawCircleWithOffsetGradient(
                  ctx, 
                  drawX, 
                  drawY, 
                  this.currentRadius, 
                  this.colorSet, 
                  scaledOffsetX, 
                  scaledOffsetY,
                  currentOneColorMode,
                  currentOneColorModeColor
                );
              } else {
                // For other shapes, use cached image
                if (shouldRotate) {
                  ctx.save();
                  ctx.translate(drawX, drawY);
                  ctx.rotate(rotationToUse);
                  ctx.drawImage(cache, -size/2, -size/2, size, size);
                  ctx.restore();
                } else {
                  ctx.drawImage(cache, drawX - size/2, drawY - size/2, size, size);
                }
              }
            }
        } else {
          // Normal drawing with noise
          const noiseAmount = cfg.particleNoise || 0;
          const noiseX = this.noiseOffsetX * noiseAmount;
          const noiseY = this.noiseOffsetY * noiseAmount;
          const drawX = this.x2d + noiseX;
          const drawY = this.y2d + noiseY;
          
          // For circles, use offset gradient for organic feel
          if (cfg.particleShape === 'circle') {
            // Scale offset to current radius
            const offsetScale = this.currentRadius / this.baseRadius;
            const scaledOffsetX = this.gradientOffsetX * offsetScale;
            const scaledOffsetY = this.gradientOffsetY * offsetScale;
            drawCircleWithOffsetGradient(
              ctx, 
              drawX, 
              drawY, 
              this.currentRadius, 
              this.colorSet, 
              scaledOffsetX, 
              scaledOffsetY,
              currentOneColorMode,
              currentOneColorModeColor
            );
          } else {
            // For other shapes, use cached image
            if (shouldRotate) {
              ctx.save();
              ctx.translate(drawX, drawY);
              ctx.rotate(rotationToUse);
              ctx.drawImage(cache, -size/2, -size/2, size, size);
              ctx.restore();
            } else {
              ctx.drawImage(cache, drawX - size/2, drawY - size/2, size, size);
            }
          }
        }
        ctx.globalAlpha = 1;
      }
    }

    class BackgroundParticle {
      constructor(cfg) {
        this.sizeRatio = Math.random();
        this.colorSetIndex = Math.floor(Math.random() * gradientStopsArray.length);
        this.colorSet = gradientStopsArray[this.colorSetIndex];
        this.driftSpeedRatio = Math.random();
        this.driftAngle = Math.random() * Math.PI * 2;
        this.driftAngleY = (Math.random() - 0.5) * Math.PI;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.01 + Math.random() * 0.02;
        this.positionHistory = [];
        this.trailFrameCounter = 0;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.06;
        this.lastX2d = 0;
        this.lastY2d = 0;
        this.movementAngle = 0;
        
        this.reset(cfg);
      }

      reset(cfg) {
        const distance = 400 + Math.random() * 400;
        
        this.x3d = (Math.random() - 0.5) * distance * 2;
        this.y3d = (Math.random() - 0.5) * distance * 2;
        this.z3d = -200 - Math.random() * 600;
        
        this.updateDrift(cfg);
        
        // Calculate gradient offset for organic feel (15-30% of radius)
        // Use average size for offset calculation
        const minSize = Math.min(cfg.bgMinSize, cfg.bgMaxSize);
        const maxSize = Math.max(cfg.bgMinSize, cfg.bgMaxSize);
        const avgRadius = (minSize + maxSize) / 2;
        const offsetRange = 0.15 + Math.random() * 0.15; // 15-30% range
        const maxOffset = avgRadius * offsetRange;
        this.gradientOffsetX = (Math.random() - 0.5) * maxOffset * 2;
        this.gradientOffsetY = (Math.random() - 0.5) * maxOffset * 2;
        
        this.x2d = 0;
        this.y2d = 0;
        this.scale = 1;
        this.depth = 0;
      }
      
      updateDrift(cfg) {
        const speed = cfg.bgDriftSpeedMin + this.driftSpeedRatio * (cfg.bgDriftSpeedMax - cfg.bgDriftSpeedMin);
        this.driftX = Math.cos(this.driftAngle) * Math.cos(this.driftAngleY) * speed;
        this.driftY = Math.sin(this.driftAngleY) * speed;
        this.driftZ = Math.sin(this.driftAngle) * Math.cos(this.driftAngleY) * speed;
      }

      update(cfg) {
        this.x3d += this.driftX;
        this.y3d += this.driftY;
        this.z3d += this.driftZ;
        
        if (Math.abs(this.x3d) > 1000 || Math.abs(this.y3d) > 1000 || this.z3d > 200) {
          this.reset(cfg);
        }
        
        this.pulsePhase += this.pulseSpeed;
      }

      rotate(cfg, canvasWidth, canvasHeight) {
        const scale = cfg.perspective / (cfg.perspective + this.z3d);
        this.scale = scale;
        
        this.depth = this.z3d;
        
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        
        this.x2d = centerX + this.x3d * scale;
        this.y2d = centerY + this.y3d * scale;
        
        const minSize = Math.min(cfg.bgMinSize, cfg.bgMaxSize);
        const maxSize = Math.max(cfg.bgMinSize, cfg.bgMaxSize);
        const baseRadius = minSize + this.sizeRatio * (maxSize - minSize);
        
        const pulse = Math.sin(this.pulsePhase);
        this.currentRadius = baseRadius * this.scale * (1 + pulse * 0.2);
        
        // Store position in history for echo effect
        if (cfg.motionBlur > 0) {
          const maxHistory = cfg.motionBlurSteps;
          const trailInterval = cfg.trailInterval || 1;
          
          // Increment frame counter
          this.trailFrameCounter++;
          
          // Only store position every N frames (based on trailInterval)
          if (this.trailFrameCounter >= trailInterval) {
            this.positionHistory.push({
              x: this.x2d,
              y: this.y2d,
              radius: this.currentRadius
            });
            this.trailFrameCounter = 0; // Reset counter
          }
          
          while (this.positionHistory.length > maxHistory) {
            this.positionHistory.shift();
          }
        } else if (this.positionHistory.length > 0) {
          this.positionHistory.length = 0;
          this.trailFrameCounter = 0;
        }
      }

      draw(ctx, cfg) {
        // Update rotation if auto-rotate is enabled
        if (cfg.autoRotateShapes) {
          if (cfg.particleShape === 'triangle') {
            // Triangle points in direction of movement
            const dx = this.x2d - this.lastX2d;
            const dy = this.y2d - this.lastY2d;
            if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
              this.movementAngle = Math.atan2(dy, dx) + Math.PI / 2;
            }
            this.lastX2d = this.x2d;
            this.lastY2d = this.y2d;
          } else {
            this.rotation += this.rotationSpeed;
          }
        }
        
        const depthOpacity = Math.max(0.3, Math.min(0.6, (this.depth + 800) / 1000));
        const finalOpacity = depthOpacity * cfg.bgParticleOpacity;
        const cache = gradientCache[cfg.particleShape || 'circle'][this.colorSetIndex];
        const shouldRotate = cfg.autoRotateShapes && cfg.particleShape !== 'circle';
        const rotationToUse = cfg.particleShape === 'triangle' ? this.movementAngle : this.rotation;
        
        // Draw trail effect
        drawTrail(ctx, this.positionHistory, cfg, finalOpacity, cache, shouldRotate, rotationToUse, this.rotationSpeed, cfg.particleShape);
        
        // Draw main particle
        const size = this.currentRadius * 2;
        ctx.globalAlpha = finalOpacity;
        
        // For circles, use offset gradient for organic feel
        if (cfg.particleShape === 'circle') {
          // Scale offset to current radius (use average of min/max for background particles)
          const minSize = Math.min(cfg.bgMinSize, cfg.bgMaxSize);
          const maxSize = Math.max(cfg.bgMinSize, cfg.bgMaxSize);
          const avgRadius = (minSize + maxSize) / 2;
          const offsetScale = this.currentRadius / avgRadius;
          const scaledOffsetX = this.gradientOffsetX * offsetScale;
          const scaledOffsetY = this.gradientOffsetY * offsetScale;
          drawCircleWithOffsetGradient(
            ctx, 
            this.x2d, 
            this.y2d, 
            this.currentRadius, 
            this.colorSet, 
            scaledOffsetX, 
            scaledOffsetY,
            currentOneColorMode,
            currentOneColorModeColor
          );
        } else {
          // For other shapes, use cached image
          if (shouldRotate) {
            ctx.save();
            ctx.translate(this.x2d, this.y2d);
            ctx.rotate(rotationToUse);
            ctx.drawImage(cache, -size/2, -size/2, size, size);
            ctx.restore();
          } else {
            ctx.drawImage(cache, this.x2d - size/2, this.y2d - size/2, size, size);
          }
        }
        ctx.globalAlpha = 1;
      }
    }

    // Initialize config ref
    configRef.current = { ...config };
    
    const initParticles = (cfg) => {
      particlesRef.current = Array.from({ length: cfg.particleCount }, (_, i) => new Particle(i, cfg));
      bgParticlesRef.current = Array.from({ length: cfg.backgroundParticles }, () => new BackgroundParticle(cfg));
      // Clear connections when particles are reinitialized
      activeConnectionsRef.current = new Map();
    };

    initParticles(configRef.current);

    // Initialize Birth state: create single particle at center
    const initBirthState = (cfg) => {
      const singleParticle = new Particle(0, cfg);
      singleParticle.x3d = 0;
      singleParticle.y3d = 0;
      singleParticle.z3d = 0;
      singleParticle.baseX = 0;
      singleParticle.baseY = 0;
      singleParticle.baseZ = 0;
      singleParticle.divisionLevel = 0;
      singleParticle.isDividing = false;
      particlesRef.current = [singleParticle];
      divisionLevelRef.current = 0;
      divisionProgressRef.current = 0;
      divisionStartTimeRef.current = Date.now();
      isDividingRef.current = false;
      setDivisionLevel(0);
      // Clear connections when entering Birth state
      activeConnectionsRef.current = new Map();
    };

    // Divide particles: each particle splits into 2
    const divideParticles = (cfg) => {
      if (isDividingRef.current) return; // Prevent multiple simultaneous divisions
      const currentLevel = divisionLevelRef.current;
      if (currentLevel >= 7) return; // Max 8 levels (0-7)
      
      isDividingRef.current = true;
      const particlesToDivide = particlesRef.current.filter(p => p.divisionLevel === currentLevel);
      const newParticles = [];
      
      particlesToDivide.forEach((parent, idx) => {
        // Generate one random direction - children will move in opposite directions
        const dirX = (Math.random() - 0.5) * 2;
        const dirY = (Math.random() - 0.5) * 2;
        const dirZ = (Math.random() - 0.5) * 2;
        const dirMag = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
        const unitX = dirX / dirMag;
        const unitY = dirY / dirMag;
        const unitZ = dirZ / dirMag;
        
        // First child goes in the random direction
        const unit1X = unitX;
        const unit1Y = unitY;
        const unit1Z = unitZ;
        
        // Second child goes in the exact opposite direction
        const unit2X = -unitX;
        const unit2Y = -unitY;
        const unit2Z = -unitZ;
        
        // Create two child particles that start merged
        const child1 = new Particle(particlesRef.current.length + newParticles.length, cfg);
        const child2 = new Particle(particlesRef.current.length + newParticles.length + 1, cfg);
        
        // Link them as siblings for metaball effect
        child1.siblingId = child2.index;
        child2.siblingId = child1.index;
        
        // Assign random colors for more variety
        let newColorIndex1, newColorIndex2;
        if (gradientStopsArray.length > 1) {
          // Randomly select colors, ensuring they're different from each other
          do {
            newColorIndex1 = Math.floor(Math.random() * gradientStopsArray.length);
          } while (newColorIndex1 === parent.colorSetIndex && gradientStopsArray.length > 2);
          
          do {
            newColorIndex2 = Math.floor(Math.random() * gradientStopsArray.length);
          } while ((newColorIndex2 === parent.colorSetIndex || newColorIndex2 === newColorIndex1) && gradientStopsArray.length > 2);
        } else {
          newColorIndex1 = 0;
          newColorIndex2 = 0;
        }
        
        // Store original (parent) color and target colors for smooth transition
        child1.originalColorIndex = parent.colorSetIndex;
        child1.targetColorIndex = newColorIndex1;
        child1.colorSetIndex = parent.colorSetIndex; // Start with parent's color
        child1.colorSet = gradientStopsArray[parent.colorSetIndex];
        
        child2.originalColorIndex = parent.colorSetIndex;
        child2.targetColorIndex = newColorIndex2;
        child2.colorSetIndex = parent.colorSetIndex; // Start with parent's color
        child2.colorSet = gradientStopsArray[parent.colorSetIndex];
        
        // Inherit size properties from parent
        child1.baseRadius = parent.baseRadius;
        child1.radiusRatio = parent.radiusRatio;
        child2.baseRadius = parent.baseRadius;
        child2.radiusRatio = parent.radiusRatio;
        
        // Set division properties
        child1.parentId = parent.index;
        child1.divisionLevel = currentLevel + 1;
        child1.isDividing = true;
        child2.parentId = parent.index;
        child2.divisionLevel = currentLevel + 1;
        child2.isDividing = true;
        
        // No timing offsets - both children start moving immediately with same energy
        child1.divisionTimeOffset = 0;
        child2.divisionTimeOffset = 0;
        
        // No staggered delays - both start simultaneously
        child1.divisionDelay = 0;
        child2.divisionDelay = 0;
        
        // Start immediately - no delays
        const baseStartTime = Date.now();
        child1.divisionStartDelay = 0;
        child2.divisionStartDelay = 0;
        child1.divisionStartTime = baseStartTime;
        child2.divisionStartTime = baseStartTime;
        
        // Start position (parent's current position - start merged)
        child1.startX = parent.x3d;
        child1.startY = parent.y3d;
        child1.startZ = parent.z3d;
        child1.x3d = parent.x3d;
        child1.y3d = parent.y3d;
        child1.z3d = parent.z3d;
        
        child2.startX = parent.x3d;
        child2.startY = parent.y3d;
        child2.startZ = parent.z3d;
        child2.x3d = parent.x3d;
        child2.y3d = parent.y3d;
        child2.z3d = parent.z3d;
        
        // Same separation distance for both children (same energy)
        // Both move with equal energy to opposite sides
        const individualSeparation = separationDistance;
        child1.separationDistance = individualSeparation;
        child2.separationDistance = individualSeparation;
        
        // Target position (children move in opposite directions with same energy)
        child1.targetX = parent.x3d + unit1X * individualSeparation;
        child1.targetY = parent.y3d + unit1Y * individualSeparation;
        child1.targetZ = parent.z3d + unit1Z * individualSeparation;
        
        child2.targetX = parent.x3d + unit2X * individualSeparation;
        child2.targetY = parent.y3d + unit2Y * individualSeparation;
        child2.targetZ = parent.z3d + unit2Z * individualSeparation;
        
        // Orbital motion properties for curved paths
        child1.orbitalPhase = Math.random() * Math.PI * 2;
        child1.orbitalRadius = 15 + Math.random() * 25;
        child1.rotationPhase = Math.random() * Math.PI * 2;
        
        child2.orbitalPhase = Math.random() * Math.PI * 2;
        child2.orbitalRadius = 15 + Math.random() * 25;
        child2.rotationPhase = Math.random() * Math.PI * 2;
        
        // Store direction for orbital calculations
        child1.divisionDirection = { x: unit1X, y: unit1Y, z: unit1Z };
        child2.divisionDirection = { x: unit2X, y: unit2Y, z: unit2Z };
        
        newParticles.push(child1, child2);
      });
      
      // Remove parent particles immediately - they should not be visible at all
      // Only the children should be visible, creating a clean split effect
      const parentIndices = new Set(particlesToDivide.map(p => p.index));
      particlesRef.current = [
        ...particlesRef.current.filter(p => !parentIndices.has(p.index)),
        ...newParticles
      ];
      divisionLevelRef.current = currentLevel + 1;
      divisionProgressRef.current = 0;
      divisionStartTimeRef.current = Date.now();
      setDivisionLevel(currentLevel + 1);
      isDividingRef.current = false;
    };

    // Helper function to create a connection key from two particle indices
    const getConnectionKey = (p1, p2) => {
      const idx1 = p1.index;
      const idx2 = p2.index;
      return idx1 < idx2 ? `${idx1}-${idx2}` : `${idx2}-${idx1}`;
    };

    // Helper function to draw a line with different styles
    // progress: 0-1, controls trim path effect (0 = no line, 1 = full line)
    // Draws from both ends toward center: 0→50% and 100%→50%
    const drawStyledLine = (ctx, x1, y1, x2, y2, style, isArc = false, controlX = null, controlY = null, progress = 1.0, cfg = null, time = 0) => {
      const lineStyle = style || 'solid';
      const trimmedProgress = Math.max(0, Math.min(1, progress)); // Clamp to 0-1
      
      // Check if wiggle is enabled
      const wiggleEnabled = cfg && cfg.connectorWiggle === true;
      const wiggleAmplitude = cfg ? (cfg.connectorWiggleAmplitude || 5) : 5;
      const wiggleFrequency = cfg ? (cfg.connectorWiggleFrequency || 2) : 2;
      const wiggleSpeed = cfg ? (cfg.connectorWiggleSpeed || 0.01) : 0.01;
      
      // Helper function to get point on path at parameter t (0 to 1)
      const getPointOnPath = (t) => {
        if (isArc && controlX !== null && controlY !== null) {
          // Quadratic bezier: P(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
          const mt = 1 - t;
          const x = mt * mt * x1 + 2 * mt * t * controlX + t * t * x2;
          const y = mt * mt * y1 + 2 * mt * t * controlY + t * t * y2;
          return { x, y };
        } else {
          // Straight line
          return {
            x: x1 + (x2 - x1) * t,
            y: y1 + (y2 - y1) * t
          };
        }
      };
      
      // Helper function to get tangent direction at parameter t
      const getTangentAt = (t) => {
        if (isArc && controlX !== null && controlY !== null) {
          // Derivative of quadratic bezier: P'(t) = 2(1-t)(P₁-P₀) + 2t(P₂-P₁)
          const dx = 2 * (1 - t) * (controlX - x1) + 2 * t * (x2 - controlX);
          const dy = 2 * (1 - t) * (controlY - y1) + 2 * t * (y2 - controlY);
          const len = Math.sqrt(dx * dx + dy * dy);
          return len > 0 ? { x: dx / len, y: dy / len } : { x: 1, y: 0 };
        } else {
          // Straight line tangent
          const dx = x2 - x1;
          const dy = y2 - y1;
          const len = Math.sqrt(dx * dx + dy * dy);
          return len > 0 ? { x: dx / len, y: dy / len } : { x: 1, y: 0 };
        }
      };
      
      // If wiggle is enabled, draw wiggly path
      if (wiggleEnabled && wiggleAmplitude > 0 && !isNaN(wiggleAmplitude) && !isNaN(wiggleFrequency) && !isNaN(wiggleSpeed) && isFinite(wiggleSpeed)) {
        try {
          ctx.beginPath();
          
          // Calculate number of segments based on line length and frequency
          const dx = x2 - x1;
          const dy = y2 - y1;
          const lineLength = Math.sqrt(dx * dx + dy * dy);
          
          // Safety check: if line length is 0 or invalid, fall through to normal drawing
          if (lineLength > 0 && isFinite(lineLength)) {
          const numSegments = Math.max(20, Math.floor(lineLength / 2)); // At least 20 segments, more for longer lines
          
          // Sample points along the path and apply wiggle
          // Handle progress: draw from both ends toward center (like original)
          const halfProgress = trimmedProgress * 2; // Scale to 0-2
          
          let firstPoint = true;
          let hasPoints = false;
          
          // Draw from start toward center (0 → 50%)
          if (halfProgress > 0) {
            const startProgress = Math.min(0.5, halfProgress * 0.5);
            const startSegments = Math.ceil(numSegments * startProgress);
            
            for (let i = 0; i <= startSegments; i++) {
              const t = i / numSegments;
              if (t > startProgress) break;
              
              try {
                const point = getPointOnPath(t);
                const tangent = getTangentAt(t);
                const perpX = -tangent.y;
                const perpY = tangent.x;
                // Add time-based animation offset using configurable speed
                const wavePhase = t * wiggleFrequency * Math.PI * 2 + time * wiggleSpeed;
                // Fade factor: 0 at t=0 and t=1, 1.0 at t=0.5 (pins ends to particles)
                const fadeFactor = Math.sin(t * Math.PI);
                const offset = Math.sin(wavePhase) * wiggleAmplitude * fadeFactor;
                
                const wiggledX = point.x + perpX * offset;
                const wiggledY = point.y + perpY * offset;
                
                // Check for valid coordinates
                if (isFinite(wiggledX) && isFinite(wiggledY)) {
                  if (firstPoint) {
                    ctx.moveTo(wiggledX, wiggledY);
                    firstPoint = false;
                    hasPoints = true;
                  } else {
                    ctx.lineTo(wiggledX, wiggledY);
                  }
                }
              } catch (e) {
                // If there's an error, fall through to normal drawing
                console.warn('Wiggle drawing error:', e);
                break;
              }
            }
          }
          
          // Draw from end toward center (100% → 50%)
          if (halfProgress > 1) {
            const endProgress = 1 - Math.min(0.5, (halfProgress - 1) * 0.5);
            const endSegments = Math.ceil(numSegments * (1 - endProgress));
            
            for (let i = numSegments; i >= endSegments; i--) {
              const t = i / numSegments;
              if (t < endProgress) break;
              
              try {
                const point = getPointOnPath(t);
                const tangent = getTangentAt(t);
                const perpX = -tangent.y;
                const perpY = tangent.x;
                // Add time-based animation offset using configurable speed
                const wavePhase = t * wiggleFrequency * Math.PI * 2 + time * wiggleSpeed;
                // Fade factor: 0 at t=0 and t=1, 1.0 at t=0.5 (pins ends to particles)
                const fadeFactor = Math.sin(t * Math.PI);
                const offset = Math.sin(wavePhase) * wiggleAmplitude * fadeFactor;
                
                const wiggledX = point.x + perpX * offset;
                const wiggledY = point.y + perpY * offset;
                
                // Check for valid coordinates
                if (isFinite(wiggledX) && isFinite(wiggledY)) {
                  ctx.lineTo(wiggledX, wiggledY);
                  hasPoints = true;
                }
              } catch (e) {
                // If there's an error, fall through to normal drawing
                console.warn('Wiggle drawing error:', e);
                break;
              }
            }
          }
          
          // Only draw if we have valid points
          if (hasPoints) {
            // Apply line style
            if (lineStyle === 'solid') {
              ctx.setLineDash([]);
            } else if (lineStyle === 'dashed') {
              ctx.setLineDash([5, 5]);
            } else if (lineStyle === 'dotted') {
              ctx.setLineDash([2, 3]);
            }
            
            ctx.stroke();
            if (lineStyle !== 'solid') {
              ctx.setLineDash([]);
            }
            return;
          }
          // If no valid points, close the path and fall through to normal drawing
          ctx.beginPath(); // Reset path for normal drawing
        }
        } catch (e) {
          // If wiggle drawing fails completely, fall through to normal drawing
          console.warn('Wiggle drawing failed, using normal drawing:', e);
          ctx.beginPath(); // Reset path for normal drawing
        }
      }
      
      // Normal drawing code (when wiggle is disabled or failed)
      if (lineStyle === 'solid') {
        ctx.setLineDash([]);
        ctx.beginPath();
        if (isArc && controlX !== null && controlY !== null) {
          // Bezier curve: draw from both ends toward center
          if (trimmedProgress >= 1.0) {
            ctx.moveTo(x1, y1);
            ctx.quadraticCurveTo(controlX, controlY, x2, y2);
          } else {
            // Calculate midpoint of curve (t = 0.5)
            const midT = 0.5;
            const q0x = x1 + (controlX - x1) * midT;
            const q0y = y1 + (controlY - y1) * midT;
            const q1x = controlX + (x2 - controlX) * midT;
            const q1y = controlY + (y2 - controlY) * midT;
            const midX = q0x + (q1x - q0x) * midT;
            const midY = q0y + (q1y - q0y) * midT;
            
            // Progress for each half (0 to 1, where 1 = reaches center)
            const halfProgress = trimmedProgress * 2; // Scale to 0-2, then clamp each half
            
            // Draw from start toward center (0 → 50%)
            if (halfProgress > 0) {
              const startT = Math.min(0.5, halfProgress * 0.5);
              const startQ0x = x1 + (controlX - x1) * startT;
              const startQ0y = y1 + (controlY - y1) * startT;
              const startQ1x = controlX + (x2 - controlX) * startT;
              const startQ1y = controlY + (y2 - controlY) * startT;
              const startEndX = startQ0x + (startQ1x - startQ0x) * startT;
              const startEndY = startQ0y + (startQ1y - startQ0y) * startT;
              ctx.moveTo(x1, y1);
              ctx.quadraticCurveTo(startQ0x, startQ0y, startEndX, startEndY);
            }
            
            // Draw from end toward center (100% → 50%)
            if (halfProgress > 1) {
              // Calculate how far from end we've drawn (0.5 = at midpoint, 1.0 = at end)
              const endProgress = Math.min(0.5, (halfProgress - 1) * 0.5);
              // endT goes from 1.0 (at end) down to 0.5 (at midpoint)
              const endT = 1.0 - endProgress;
              
              // To draw from end (t=1.0) toward a point at t=endT, we need the curve segment
              // For quadratic bezier P(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
              // To get segment from t=a to t=1.0, we subdivide at t=a
              // The second half has: start = P(a), control = Q₁(a), end = P₂
              
              // Calculate point and control at t=endT
              const t = endT;
              const q0x = x1 + (controlX - x1) * t;
              const q0y = y1 + (controlY - y1) * t;
              const q1x = controlX + (x2 - controlX) * t;
              const q1y = controlY + (y2 - controlY) * t;
              const pointAtT_X = q0x + (q1x - q0x) * t;
              const pointAtT_Y = q0y + (q1y - q0y) * t;
              
              // The second half of the curve (from t to 1.0) uses:
              // Start: pointAtT, Control: q1, End: x2,y2
              // But we want to draw from end (x2,y2) toward pointAtT
              // So we reverse it: start at x2,y2, end at pointAtT, control is q1
              ctx.moveTo(x2, y2);
              ctx.quadraticCurveTo(q1x, q1y, pointAtT_X, pointAtT_Y);
            }
          }
        } else {
          // Straight line: draw from both ends toward center
          if (trimmedProgress >= 1.0) {
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
          } else {
            const halfProgress = trimmedProgress * 2; // Scale to 0-2
            
            // Draw from start toward center (0 → 50%)
            if (halfProgress > 0) {
              const startProgress = Math.min(0.5, halfProgress * 0.5);
              const startEndX = x1 + (x2 - x1) * startProgress;
              const startEndY = y1 + (y2 - y1) * startProgress;
              ctx.moveTo(x1, y1);
              ctx.lineTo(startEndX, startEndY);
            }
            
            // Draw from end toward center (100% → 50%)
            if (halfProgress > 1) {
              const endProgress = 1 - Math.min(0.5, (halfProgress - 1) * 0.5);
              const endEndX = x1 + (x2 - x1) * endProgress;
              const endEndY = y1 + (y2 - y1) * endProgress;
              ctx.moveTo(x2, y2);
              ctx.lineTo(endEndX, endEndY);
            }
          }
        }
        ctx.stroke();
      } else if (lineStyle === 'dashed') {
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        if (isArc && controlX !== null && controlY !== null) {
          if (trimmedProgress >= 1.0) {
            ctx.moveTo(x1, y1);
            ctx.quadraticCurveTo(controlX, controlY, x2, y2);
          } else {
            const midT = 0.5;
            const halfProgress = trimmedProgress * 2;
            
            if (halfProgress > 0) {
              const startT = Math.min(0.5, halfProgress * 0.5);
              const startQ0x = x1 + (controlX - x1) * startT;
              const startQ0y = y1 + (controlY - y1) * startT;
              const startQ1x = controlX + (x2 - controlX) * startT;
              const startQ1y = controlY + (y2 - controlY) * startT;
              const startEndX = startQ0x + (startQ1x - startQ0x) * startT;
              const startEndY = startQ0y + (startQ1y - startQ0y) * startT;
              ctx.moveTo(x1, y1);
              ctx.quadraticCurveTo(startQ0x, startQ0y, startEndX, startEndY);
            }
            
            if (halfProgress > 1) {
              const endProgress = Math.min(0.5, (halfProgress - 1) * 0.5);
              const endT = 1.0 - endProgress;
              
              const t = endT;
              const q0x = x1 + (controlX - x1) * t;
              const q0y = y1 + (controlY - y1) * t;
              const q1x = controlX + (x2 - controlX) * t;
              const q1y = controlY + (y2 - controlY) * t;
              const pointAtT_X = q0x + (q1x - q0x) * t;
              const pointAtT_Y = q0y + (q1y - q0y) * t;
              
              ctx.moveTo(x2, y2);
              ctx.quadraticCurveTo(q1x, q1y, pointAtT_X, pointAtT_Y);
            }
          }
        } else {
          if (trimmedProgress >= 1.0) {
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
          } else {
            const halfProgress = trimmedProgress * 2;
            
            if (halfProgress > 0) {
              const startProgress = Math.min(0.5, halfProgress * 0.5);
              const startEndX = x1 + (x2 - x1) * startProgress;
              const startEndY = y1 + (y2 - y1) * startProgress;
              ctx.moveTo(x1, y1);
              ctx.lineTo(startEndX, startEndY);
            }
            
            if (halfProgress > 1) {
              const endProgress = 1 - Math.min(0.5, (halfProgress - 1) * 0.5);
              const endEndX = x1 + (x2 - x1) * endProgress;
              const endEndY = y1 + (y2 - y1) * endProgress;
              ctx.moveTo(x2, y2);
              ctx.lineTo(endEndX, endEndY);
            }
          }
        }
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (lineStyle === 'dotted') {
        ctx.setLineDash([2, 3]); // Small dots with gaps
        ctx.beginPath();
        if (isArc && controlX !== null && controlY !== null) {
          if (trimmedProgress >= 1.0) {
            ctx.moveTo(x1, y1);
            ctx.quadraticCurveTo(controlX, controlY, x2, y2);
          } else {
            const halfProgress = trimmedProgress * 2;
            
            if (halfProgress > 0) {
              const startT = Math.min(0.5, halfProgress * 0.5);
              const startQ0x = x1 + (controlX - x1) * startT;
              const startQ0y = y1 + (controlY - y1) * startT;
              const startQ1x = controlX + (x2 - controlX) * startT;
              const startQ1y = controlY + (y2 - controlY) * startT;
              const startEndX = startQ0x + (startQ1x - startQ0x) * startT;
              const startEndY = startQ0y + (startQ1y - startQ0y) * startT;
              ctx.moveTo(x1, y1);
              ctx.quadraticCurveTo(startQ0x, startQ0y, startEndX, startEndY);
            }
            
            if (halfProgress > 1) {
              const endProgress = Math.min(0.5, (halfProgress - 1) * 0.5);
              const endT = 1.0 - endProgress;
              
              const t = endT;
              const q0x = x1 + (controlX - x1) * t;
              const q0y = y1 + (controlY - y1) * t;
              const q1x = controlX + (x2 - controlX) * t;
              const q1y = controlY + (y2 - controlY) * t;
              const pointAtT_X = q0x + (q1x - q0x) * t;
              const pointAtT_Y = q0y + (q1y - q0y) * t;
              
              ctx.moveTo(x2, y2);
              ctx.quadraticCurveTo(q1x, q1y, pointAtT_X, pointAtT_Y);
            }
          }
        } else {
          if (trimmedProgress >= 1.0) {
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
          } else {
            const halfProgress = trimmedProgress * 2;
            
            if (halfProgress > 0) {
              const startProgress = Math.min(0.5, halfProgress * 0.5);
              const startEndX = x1 + (x2 - x1) * startProgress;
              const startEndY = y1 + (y2 - y1) * startProgress;
              ctx.moveTo(x1, y1);
              ctx.lineTo(startEndX, startEndY);
            }
            
            if (halfProgress > 1) {
              const endProgress = 1 - Math.min(0.5, (halfProgress - 1) * 0.5);
              const endEndX = x1 + (x2 - x1) * endProgress;
              const endEndY = y1 + (y2 - y1) * endProgress;
              ctx.moveTo(x2, y2);
              ctx.lineTo(endEndX, endEndY);
            }
          }
        }
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (lineStyle === 'arrows' || lineStyle === 'arrows-large') {
        // Calculate the direction angle for straight lines (from x1,y1 to x2,y2)
        const straightDirectionAngle = Math.atan2(y2 - y1, x2 - x1);
        
        // Draw line first
        ctx.setLineDash([]);
        ctx.beginPath();
        if (isArc && controlX !== null && controlY !== null) {
          ctx.moveTo(x1, y1);
          if (trimmedProgress >= 1.0) {
            ctx.quadraticCurveTo(controlX, controlY, x2, y2);
          } else {
            const t = trimmedProgress;
            const q0x = x1 + (controlX - x1) * t;
            const q0y = y1 + (controlY - y1) * t;
            const q1x = controlX + (x2 - controlX) * t;
            const q1y = controlY + (y2 - controlY) * t;
            const endX = q0x + (q1x - q0x) * t;
            const endY = q0y + (q1y - q0y) * t;
            ctx.quadraticCurveTo(q0x, q0y, endX, endY);
          }
        } else {
          ctx.moveTo(x1, y1);
          const endX = x1 + (x2 - x1) * trimmedProgress;
          const endY = y1 + (y2 - y1) * trimmedProgress;
          ctx.lineTo(endX, endY);
        }
        ctx.stroke();
        
        // Draw arrows along the path
        const arrowCount = lineStyle === 'arrows-large' ? 2 : 3; // Fewer arrows for large style
        const arrowSize = lineStyle === 'arrows-large' ? 8 : 4; // Bigger arrows
        
        for (let i = 1; i <= arrowCount; i++) {
          const t = i / (arrowCount + 1);
          let arrowX, arrowY, arrowAngle;
          
          if (isArc && controlX !== null && controlY !== null) {
            // Calculate position on arc
            const t1 = 1 - t;
            const mt = 1 - t1;
            arrowX = (1 - mt) * (1 - mt) * x1 + 2 * (1 - mt) * mt * controlX + mt * mt * x2;
            arrowY = (1 - mt) * (1 - mt) * y1 + 2 * (1 - mt) * mt * controlY + mt * mt * y2;
            
            // Calculate tangent angle at this point on the arc
            // For quadratic bezier: derivative gives tangent direction
            // P(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
            // P'(t) = 2(1-t)(P₁ - P₀) + 2t(P₂ - P₁)
            const dx_dt = 2 * (1 - mt) * (controlX - x1) + 2 * mt * (x2 - controlX);
            const dy_dt = 2 * (1 - mt) * (controlY - y1) + 2 * mt * (y2 - controlY);
            arrowAngle = Math.atan2(dy_dt, dx_dt);
          } else {
            // Straight line
            arrowX = x1 + (x2 - x1) * t;
            arrowY = y1 + (y2 - y1) * t;
            arrowAngle = straightDirectionAngle; // Use straight direction for non-arcs
          }
          
          // Draw arrowhead aligned to the path direction
          ctx.save();
          ctx.translate(arrowX, arrowY);
          ctx.rotate(arrowAngle);
          ctx.beginPath();
          if (lineStyle === 'arrows-large') {
            // Big arrows: unclosed triangle (2 lines, V-shape)
            ctx.moveTo(0, 0);
            ctx.lineTo(-arrowSize, -arrowSize / 2);
            ctx.moveTo(0, 0);
            ctx.lineTo(-arrowSize, arrowSize / 2);
            ctx.stroke();
          } else {
            // Regular arrows: filled triangle
            ctx.fillStyle = ctx.strokeStyle; // Use same color as line
            ctx.moveTo(0, 0);
            ctx.lineTo(-arrowSize, -arrowSize / 2);
            ctx.lineTo(-arrowSize, arrowSize / 2);
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
        }
      }
    };

    // Draw connectors between particles within distance range
    const drawConnectors = (ctx, particles, cfg, time = 0, oneColorModeFlag = false, oneColorModeDotOriginalColorFlag = false, oneColorModeColorValue = '#ffffff') => {
      if (!cfg.connectorsEnabled) return;
      
      ctx.save();
      // Use black as fallback for null connectorColor (better visibility on light backgrounds)
      ctx.strokeStyle = cfg.connectorColor || '#000000';
      ctx.lineWidth = cfg.connectorWidth || 1;
      ctx.globalAlpha = cfg.connectorOpacity || 0.3;
      ctx.globalCompositeOperation = cfg.connectorBlendMode || 'source-over';
      
      const minDist = cfg.connectorMinDistance || 100;
      const maxDist = cfg.connectorMaxDistance || 200;
      const maxPerParticle = cfg.connectorMaxPerParticle || Infinity;
      const maxTotal = cfg.connectorMaxTotal || Infinity;
      
      // Animation speed for trim path effect (progress per frame, ~60fps)
      const animationSpeed = 0.03; // Adjust this to control animation speed
      
      // Get or initialize active connections map
      let activeConnections = activeConnectionsRef.current;
      
      // Track current frame's connections per particle
      const connectionsPerParticle = new Map();
      const connectedParticles = new Set(); // Track which particles have connections
      let totalConnectionsDrawn = 0;
      const newActiveConnections = new Map();
      
      // First, validate existing connections and keep valid ones
      for (const [key, conn] of activeConnections.entries()) {
        const p1 = conn.p1;
        const p2 = conn.p2;
        
        // Initialize progress if not present (for backward compatibility)
        let progress = conn.progress !== undefined ? conn.progress : 1.0;
        
        // Check if particles still exist and are valid
        if (!p1 || !p2 || p1.currentRadius <= 0 || p2.currentRadius <= 0) {
          continue; // Skip invalid connections
        }
        
        // Calculate current distance
        const dx = p1.x2d - p2.x2d;
        const dy = p1.y2d - p2.y2d;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if connection is still within range
        if (distance >= minDist && distance <= maxDist) {
          const count1 = connectionsPerParticle.get(p1) || 0;
          const count2 = connectionsPerParticle.get(p2) || 0;
          
          // Keep connection if limits allow
          if (count1 < maxPerParticle && count2 < maxPerParticle && totalConnectionsDrawn < maxTotal) {
            // Animate progress: increase towards 1.0
            progress = Math.min(1.0, progress + animationSpeed);
            
            // Calculate arc control point if needed
            let controlX = null;
            let controlY = null;
            const isArc = cfg.connectorArcMode;
            
            if (isArc) {
              const midX = (p1.x2d + p2.x2d) / 2;
              const midY = (p1.y2d + p2.y2d) / 2;
              const dx = p2.x2d - p1.x2d;
              const dy = p2.y2d - p1.y2d;
              const distance = Math.sqrt(dx * dx + dy * dy);
              // Power function: distance^1.3 creates exponential-like curve growth
              const baseMultiplier = 0.15; // Base curve intensity
              const powerFactor = 1.3; // Controls how aggressively curves grow with distance
              const normalizedDist = Math.max(0, Math.min(1, (distance - minDist) / (maxDist - minDist)));
              const distanceFactor = Math.pow(normalizedDist, powerFactor);
              const curveIntensity = 0.05 + (distanceFactor * 0.45); // Range: 0.05 to 0.5
              const arcHeight = distance * curveIntensity;
              const direction = cfg.connectorArcOutward !== false ? 1 : -1;
              controlX = midX + (-dy / distance) * arcHeight * direction;
              controlY = midY + (dx / distance) * arcHeight * direction;
            }
            
            // Draw line with selected style and progress (trim path effect)
            drawStyledLine(ctx, p1.x2d, p1.y2d, p2.x2d, p2.y2d, cfg.connectorLineStyle || 'solid', isArc, controlX, controlY, progress, cfg, time);
            
            // Mark particles as connected
            connectedParticles.add(p1);
            connectedParticles.add(p2);
            
            // Track this connection
            connectionsPerParticle.set(p1, count1 + 1);
            connectionsPerParticle.set(p2, count2 + 1);
            totalConnectionsDrawn++;
            
            // Keep in new active connections with updated progress
            newActiveConnections.set(key, { p1, p2, distance, progress });
          } else {
            // Connection is being removed - animate out
            progress = Math.max(0, progress - animationSpeed);
            if (progress > 0) {
              // Still draw while fading out
              let controlX = null;
              let controlY = null;
              const isArc = cfg.connectorArcMode;
              if (isArc) {
                const midX = (p1.x2d + p2.x2d) / 2;
                const midY = (p1.y2d + p2.y2d) / 2;
                const dx = p2.x2d - p1.x2d;
                const dy = p2.y2d - p1.y2d;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const normalizedDist = Math.max(0, Math.min(1, (distance - minDist) / (maxDist - minDist)));
                const distanceFactor = Math.pow(normalizedDist, 1.3);
                const curveIntensity = 0.05 + (distanceFactor * 0.45);
                const arcHeight = distance * curveIntensity;
                const direction = cfg.connectorArcOutward !== false ? 1 : -1;
                controlX = midX + (-dy / distance) * arcHeight * direction;
                controlY = midY + (dx / distance) * arcHeight * direction;
              }
              drawStyledLine(ctx, p1.x2d, p1.y2d, p2.x2d, p2.y2d, cfg.connectorLineStyle || 'solid', isArc, controlX, controlY, progress, cfg, time);
              newActiveConnections.set(key, { p1, p2, distance, progress });
            }
          }
        } else {
          // Connection out of range - animate out
          progress = Math.max(0, progress - animationSpeed);
          if (progress > 0) {
            let controlX = null;
            let controlY = null;
            const isArc = cfg.connectorArcMode;
            if (isArc) {
              const midX = (p1.x2d + p2.x2d) / 2;
              const midY = (p1.y2d + p2.y2d) / 2;
              const dx = p2.x2d - p1.x2d;
              const dy = p2.y2d - p1.y2d;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const normalizedDist = Math.max(0, Math.min(1, (distance - minDist) / (maxDist - minDist)));
              const distanceFactor = Math.pow(normalizedDist, 1.3);
              const curveIntensity = 0.05 + (distanceFactor * 0.45);
              const arcHeight = distance * curveIntensity;
              const direction = cfg.connectorArcOutward !== false ? 1 : -1;
              controlX = midX + (-dy / distance) * arcHeight * direction;
              controlY = midY + (dx / distance) * arcHeight * direction;
            }
            drawStyledLine(ctx, p1.x2d, p1.y2d, p2.x2d, p2.y2d, cfg.connectorLineStyle || 'solid', isArc, controlX, controlY, progress, cfg, time);
            newActiveConnections.set(key, { p1, p2, distance, progress });
          }
        }
      }
      
      // Now find new connections to fill remaining capacity
      const candidateConnections = [];
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        if (!p1 || p1.currentRadius <= 0) continue;
        
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          if (!p2 || p2.currentRadius <= 0) continue;
          
          // Skip if this connection already exists
          const key = getConnectionKey(p1, p2);
          if (newActiveConnections.has(key)) continue;
          
          // Calculate 2D screen distance
          const dx = p1.x2d - p2.x2d;
          const dy = p1.y2d - p2.y2d;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Store connection if distance is within range
          if (distance >= minDist && distance <= maxDist) {
            candidateConnections.push({
              p1,
              p2,
              distance,
              key
            });
          }
        }
      }
      
      // Sort candidate connections by distance (closest first)
      candidateConnections.sort((a, b) => a.distance - b.distance);
      
      // Add new connections up to limits
      for (const conn of candidateConnections) {
        // Stop if total limit reached
        if (totalConnectionsDrawn >= maxTotal) {
          break;
        }
        
        const count1 = connectionsPerParticle.get(conn.p1) || 0;
        const count2 = connectionsPerParticle.get(conn.p2) || 0;
        
        // Only add if both particles haven't exceeded their limit
        if (count1 < maxPerParticle && count2 < maxPerParticle) {
          // Calculate arc control point if needed
          let controlX = null;
          let controlY = null;
          const isArc = cfg.connectorArcMode;
          
          if (isArc) {
            const midX = (conn.p1.x2d + conn.p2.x2d) / 2;
            const midY = (conn.p1.y2d + conn.p2.y2d) / 2;
            const dx = conn.p2.x2d - conn.p1.x2d;
            const dy = conn.p2.y2d - conn.p1.y2d;
            const distance = Math.sqrt(dx * dx + dy * dy);
            // Power function: distance^1.3 creates exponential-like curve growth
            const baseMultiplier = 0.15; // Base curve intensity
            const powerFactor = 1.3; // Controls how aggressively curves grow with distance
            const normalizedDist = Math.max(0, Math.min(1, (distance - minDist) / (maxDist - minDist)));
            const distanceFactor = Math.pow(normalizedDist, powerFactor);
            const curveIntensity = 0.05 + (distanceFactor * 0.85); // Range: 0.05 to 0.9
            const arcHeight = distance * curveIntensity;
            const direction = cfg.connectorArcOutward !== false ? 1 : -1;
            controlX = midX + (-dy / distance) * arcHeight * direction;
            controlY = midY + (dx / distance) * arcHeight * direction;
          }
          
          // New connection - start with progress 0 and animate in
          const newProgress = 0; // Will animate to 1.0 over time
          
          // Draw line with selected style and progress (trim path effect)
          drawStyledLine(ctx, conn.p1.x2d, conn.p1.y2d, conn.p2.x2d, conn.p2.y2d, cfg.connectorLineStyle || 'solid', isArc, controlX, controlY, newProgress, cfg, time);
          
          // Mark particles as connected
          connectedParticles.add(conn.p1);
          connectedParticles.add(conn.p2);
          
          // Track this connection
          connectionsPerParticle.set(conn.p1, count1 + 1);
          connectionsPerParticle.set(conn.p2, count2 + 1);
          totalConnectionsDrawn++;
          
          // Add to new active connections with initial progress
          newActiveConnections.set(conn.key, { p1: conn.p1, p2: conn.p2, distance: conn.distance, progress: newProgress });
        }
      }
      
      // Update active connections for next frame
      activeConnectionsRef.current = newActiveConnections;
      
      // Draw dots on all particles if enabled
      if (cfg.connectorShowDots) {
        const dotSize = Number(cfg.connectorDotSize) || 3;
        const savedAlpha = ctx.globalAlpha;
        const savedLineDash = ctx.getLineDash(); // Save current line dash pattern
        const fillConnected = cfg.connectorDotFillConnected === true;
        
        // Use separate dot opacity if specified, otherwise fall back to connectorOpacity
        const dotOpacity = cfg.connectorDotOpacity !== null && cfg.connectorDotOpacity !== undefined
          ? cfg.connectorDotOpacity
          : (cfg.connectorOpacity || 1.0);
        ctx.globalAlpha = dotOpacity;
        
        // Draw dots on all particles
        for (const particle of particles) {
          if (!particle || particle.currentRadius <= 0) continue;
          
          const isConnected = connectedParticles.has(particle);
          const shouldFill = fillConnected ? isConnected : !cfg.connectorDotStrokeOnly;
          
          // If one color mode is on AND the toggle is enabled, use the full original gradient
          if (oneColorModeFlag && oneColorModeDotOriginalColorFlag && particle.colorSet && particle.colorSet.length > 0) {
            // Create a radial gradient for the dot using the particle's full gradient with offset
            const sortedStops = [...particle.colorSet].sort((a, b) => a.position - b.position);
            const dotRadius = dotSize / 2;
            
            // Scale offset to dot size (proportional to particle radius)
            const offsetScale = dotRadius / particle.currentRadius;
            const scaledOffsetX = (particle.gradientOffsetX || 0) * offsetScale;
            const scaledOffsetY = (particle.gradientOffsetY || 0) * offsetScale;
            
            const centerX = particle.x2d + scaledOffsetX;
            const centerY = particle.y2d + scaledOffsetY;
            const gradient = ctx.createRadialGradient(
              centerX, centerY, 0,
              centerX, centerY, dotRadius
            );
            
            // Add all gradient stops from the particle's gradient
            sortedStops.forEach(stop => {
              const color = oneColorModeFlag ? oneColorModeColorValue : stop.color;
              const colorWithOpacity = stop.opacity < 1 
                ? color + Math.round(stop.opacity * 255).toString(16).padStart(2, '0')
                : color;
              gradient.addColorStop(stop.position, colorWithOpacity);
            });
            
            if (shouldFill) {
              ctx.fillStyle = gradient;
              ctx.beginPath();
              ctx.arc(particle.x2d, particle.y2d, dotRadius, 0, Math.PI * 2);
              ctx.fill();
            } else {
              ctx.setLineDash([]); // Ensure solid line for dot stroke
              ctx.strokeStyle = gradient;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.arc(particle.x2d, particle.y2d, dotRadius, 0, Math.PI * 2);
              ctx.stroke();
            }
          } else {
            // Use the configured dot color (or fallback to connector color)
            const dotColor = cfg.connectorDotColor !== null && cfg.connectorDotColor !== undefined 
              ? cfg.connectorDotColor 
              : (cfg.connectorColor || '#000000');
            
            if (shouldFill) {
              ctx.fillStyle = dotColor;
              ctx.beginPath();
              ctx.arc(particle.x2d, particle.y2d, dotSize / 2, 0, Math.PI * 2);
              ctx.fill();
            } else {
              ctx.setLineDash([]); // Ensure solid line for dot stroke
              ctx.strokeStyle = dotColor;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.arc(particle.x2d, particle.y2d, dotSize / 2, 0, Math.PI * 2);
              ctx.stroke();
            }
          }
        }
        
        ctx.setLineDash(savedLineDash); // Restore line dash pattern
        ctx.globalAlpha = savedAlpha; // Restore previous alpha
      }
      
      ctx.restore();
    };

    const animate = () => {
      try {
        if (!canvas.width || !canvas.height) {
          animationRef.current = requestAnimationFrame(animate);
          return;
        }
        
        const cfg = configRef.current;
        if (!cfg) {
          animationRef.current = requestAnimationFrame(animate);
          return;
        }
        
        // Handle state transitions
        if (currentStateRef.current !== lastStateRef.current) {
          if (currentStateRef.current === 'birth') {
            // Transition to Birth: initialize with single particle
            initBirthState(cfg);
          } else if (currentStateRef.current === 'gathering' || currentStateRef.current === 'grid') {
            // Transition to Gathering or Grid: restore normal particle distribution
            // For grid state, ensure config has grid dimensions
            if (currentStateRef.current === 'grid' && configRef.current) {
              configRef.current.gridRows = gridRows;
              configRef.current.gridCols = gridCols;
            }
            particlesRef.current = Array.from({ length: cfg.particleCount }, (_, i) => new Particle(i, cfg));
            divisionLevelRef.current = 0;
            divisionProgressRef.current = 0;
            isDividingRef.current = false;
            setDivisionLevel(0);
          }
          lastStateRef.current = currentStateRef.current;
        }
        
        // Handle Birth state division logic
        if (currentStateRef.current === 'birth') {
          const elapsed = Date.now() - divisionStartTimeRef.current;
          divisionProgressRef.current = Math.min(1, elapsed / divisionDuration);
          
          // Check if current division cycle is complete and trigger next
          if (divisionProgressRef.current >= 1 && divisionLevelRef.current < 7 && !isDividingRef.current) {
            divideParticles(cfg);
          }
        }
        
        // Check if we need to recreate particles (only when counts change and in gathering or grid state)
        if (currentStateRef.current === 'gathering' || currentStateRef.current === 'grid') {
          if (particlesRef.current.length !== cfg.particleCount) {
            particlesRef.current = Array.from({ length: cfg.particleCount }, (_, i) => new Particle(i, cfg));
          }
        }
        if (bgParticlesRef.current.length !== cfg.backgroundParticles) {
          bgParticlesRef.current = Array.from({ length: cfg.backgroundParticles }, () => new BackgroundParticle(cfg));
        }
        
        // Only update particles when config actually changes
        const lastCfg = lastConfigRef.current;
        // Check if grid dimensions changed (for grid state)
        const gridDimensionsChanged = currentStateRef.current === 'grid' && lastCfg && 
          (lastCfg.gridRows !== cfg.gridRows || lastCfg.gridCols !== cfg.gridCols ||
           lastCfg.gridWidth !== cfg.gridWidth || lastCfg.gridHeight !== cfg.gridHeight);
        
        if (!lastCfg || 
            lastCfg.sphereRadius !== cfg.sphereRadius ||
            lastCfg.scatter !== cfg.scatter ||
            lastCfg.minRadius !== cfg.minRadius ||
            lastCfg.maxRadius !== cfg.maxRadius ||
            lastCfg.breathingSpeedMin !== cfg.breathingSpeedMin ||
            lastCfg.breathingSpeedMax !== cfg.breathingSpeedMax ||
            lastCfg.breathingAmountMin !== cfg.breathingAmountMin ||
            lastCfg.breathingAmountMax !== cfg.breathingAmountMax ||
            lastCfg.gridVerticalSpeedMin !== cfg.gridVerticalSpeedMin ||
            lastCfg.gridVerticalSpeedMax !== cfg.gridVerticalSpeedMax ||
            lastCfg.gridVerticalAmplitudeMin !== cfg.gridVerticalAmplitudeMin ||
            lastCfg.gridVerticalAmplitudeMax !== cfg.gridVerticalAmplitudeMax ||
            gridDimensionsChanged) {
          // If grid dimensions changed, recreate particles with new grid layout
          if (gridDimensionsChanged && currentStateRef.current === 'grid') {
            particlesRef.current = Array.from({ length: cfg.particleCount }, (_, i) => new Particle(i, cfg));
          } else {
            particlesRef.current.forEach(particle => particle.updateFromConfig(cfg));
          }
        }
        
        if (!lastCfg ||
            lastCfg.bgDriftSpeedMin !== cfg.bgDriftSpeedMin ||
            lastCfg.bgDriftSpeedMax !== cfg.bgDriftSpeedMax) {
          bgParticlesRef.current.forEach(particle => particle.updateDrift(cfg));
        }
        
        lastConfigRef.current = { ...cfg };
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        timeRef.current++;
        // Skip rotation updates for grid state (purely 2D, no rotation)
        if (currentStateRef.current !== 'grid') {
          angleXRef.current += cfg.rotationSpeedX;
          angleYRef.current += cfg.rotationSpeedY;
        }

        // Skip background particles in Birth state
        if (currentStateRef.current !== 'birth') {
          bgParticlesRef.current.forEach(particle => {
            particle.update(cfg);
            particle.rotate(cfg, canvas.width, canvas.height);
          });
        }

        particlesRef.current.forEach(particle => {
          particle.updatePosition(cfg, currentStateRef.current, divisionProgressRef.current, timeRef.current, Date.now());
          particle.rotate(angleXRef.current, angleYRef.current, cfg, canvas.width, canvas.height, currentStateRef.current);
        });
        
        // Update particle sizes with metaball effect (after positions and rotations are set)
        const currentTime = Date.now();
        particlesRef.current.forEach(particle => {
          particle.update(timeRef.current, cfg, currentStateRef.current, particlesRef.current, divisionProgressRef.current, currentTime);
        });

        // Draw connectors before particles if connectorDrawOnTop is false
        if (cfg.connectorDrawOnTop === false) {
          drawConnectors(ctx, particlesRef.current, cfg, timeRef.current, currentOneColorMode, currentOneColorModeDotOriginalColor, currentOneColorModeColor);
        }

        // Reuse array to reduce GC pressure - exclude background particles in Birth state
        const allParticles = currentStateRef.current === 'birth' 
          ? [...particlesRef.current]
          : bgParticlesRef.current.concat(particlesRef.current);
        allParticles.sort((a, b) => a.depth - b.depth);

        ctx.globalCompositeOperation = cfg.blendMode || 'multiply';
        
        allParticles.forEach(particle => {
          if (particle.currentRadius > 0) {
            particle.draw(ctx, cfg, timeRef.current, currentStateRef.current, particlesRef.current, divisionProgressRef.current, currentTime);
          }
        });

        // Draw connectors after particles if connectorDrawOnTop is true (default)
        if (cfg.connectorDrawOnTop !== false) {
          drawConnectors(ctx, particlesRef.current, cfg, timeRef.current, currentOneColorMode, currentOneColorModeDotOriginalColor, currentOneColorModeColor);
        }
        
        const visibleCount = allParticles.filter(p => 
          p.x2d >= 0 && p.x2d <= canvas.width && 
          p.y2d >= 0 && p.y2d <= canvas.height &&
          p.currentRadius > 0
        ).length;
        
        // Text display disabled
        // ctx.globalCompositeOperation = 'source-over';
        // ctx.fillStyle = 'black';
        // ctx.font = '12px monospace';
        // ctx.fillText(`Frame: ${timeRef.current} Visible: ${visibleCount}/${allParticles.length}`, 10, 20);
        
        // Draw position text for hovered particle - disabled
        // if (hoveredParticleRef.current) {
        //   const particle = hoveredParticleRef.current;
        //   const x = Math.round(particle.x3d * 100) / 100;
        //   const y = Math.round(particle.y3d * 100) / 100;
        //   const z = Math.round(particle.z3d * 100) / 100;
        //   const positionText = `[${x}, ${y}, ${z}]`;
        //   
        //   // Position text very close to the particle (above)
        //   const textX = particle.x2d;
        //   const textY = particle.y2d - particle.currentRadius - 2;
        //   
        //   // Draw text in black, smaller font
        //   ctx.font = '10px monospace';
        //   ctx.fillStyle = 'black';
        //   ctx.textAlign = 'center';
        //   ctx.textBaseline = 'bottom';
        //   ctx.fillText(positionText, textX, textY);
        //   
        //   // Reset text alignment
        //   ctx.textAlign = 'left';
        //   ctx.textBaseline = 'alphabetic';
        // }
      } catch (error) {
        console.error('Animation error:', error);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationRef.current);
    };
  }, [selectedColorSet, editableGradients, backgroundColor, oneColorMode, oneColorModeColor, oneColorModeDotOriginalColor, enabledGradients, colorBrightness, colorSaturation]); // Re-run when color set, gradients, background color, one color mode, enabled gradients, or color adjustments change

  // Update enabled gradients when color set changes or editableGradients updates
  useEffect(() => {
    if (editableGradients.length > 0) {
      setEnabledGradients(Array(editableGradients.length).fill(true));
    } else {
      const currentSet = colorSets[selectedColorSet];
      if (currentSet) {
        const gradientCount = currentSet.gradientStops ? currentSet.gradientStops.length : 8; // Default to 8 if unknown
        setEnabledGradients(Array(gradientCount).fill(true));
      }
    }
  }, [selectedColorSet, editableGradients.length]);

  // Update state refs when state changes
  useEffect(() => {
    currentStateRef.current = currentState;
    // When switching to grid state, sync grid dimensions
    if (currentState === 'grid' && configRef.current) {
      // Use config values if they exist, otherwise use state values
      if (configRef.current.gridRows && configRef.current.gridCols) {
        setGridRows(configRef.current.gridRows);
        setGridCols(configRef.current.gridCols);
      } else {
        configRef.current.gridRows = gridRows;
        configRef.current.gridCols = gridCols;
      }
      if (configRef.current.gridWidth && configRef.current.gridHeight) {
        setGridWidth(configRef.current.gridWidth);
        setGridHeight(configRef.current.gridHeight);
      } else {
        configRef.current.gridWidth = gridWidth;
        configRef.current.gridHeight = gridHeight;
      }
      // Ensure particle count matches grid dimensions
      const targetCount = (configRef.current.gridRows || gridRows) * (configRef.current.gridCols || gridCols);
      if (configRef.current.particleCount !== targetCount) {
        configRef.current.particleCount = targetCount;
        setConfig(prev => ({ ...prev, particleCount: targetCount }));
      }
    }
  }, [currentState, gridRows, gridCols, gridWidth, gridHeight]);

  useEffect(() => {
    divisionLevelRef.current = divisionLevel;
  }, [divisionLevel]);

  const updateConfig = (key, value) => {
    // Handle string values (like trailType, streakColor, blendMode, connectorColor) vs numeric values vs boolean values
    const booleanKeys = ['autoRotateShapes', 'connectorsEnabled', 'connectorArcMode', 'connectorArcOutward', 'connectorShowDots', 'connectorDotStrokeOnly', 'connectorDotFillConnected', 'connectorWiggle', 'gridVerticalMovementEnabled'];
    const stringKeys = ['particleShape', 'trailType', 'streakColor', 'blendMode', 'connectorBlendMode', 'connectorLineStyle', 'connectorColor', 'connectorDotColor'];
    let newValue;
    if (stringKeys.includes(key)) {
      // Handle connectorColor and connectorDotColor: allow empty string to set to null
      if ((key === 'connectorColor' || key === 'connectorDotColor') && (value === '' || value === null)) {
        newValue = null;
      } else {
        newValue = value;
      }
    } else if (booleanKeys.includes(key)) {
      newValue = value;
    } else {
      // For numeric values, if value is already a number, use it; otherwise parse it
      newValue = typeof value === 'number' ? value : parseFloat(value);
      // If parseFloat returns NaN, keep the previous value or use a default
      if (isNaN(newValue)) {
        const defaults = {
          connectorWiggleAmplitude: 5,
          connectorWiggleFrequency: 2
        };
        newValue = defaults[key] !== undefined ? defaults[key] : value;
      }
    }
    // Update ref immediately for smooth animation
    if (configRef.current) {
      configRef.current = { ...configRef.current, [key]: newValue };
    }
    // Update state for UI display
    setConfig(prev => ({ ...prev, [key]: newValue }));
  };

  const handlePresetChange = (presetName) => {
    const preset = designPresets[presetName];
    if (!preset) return;
    
    // Preserve connector properties from current config
    const connectorProps = {
      connectorsEnabled: config.connectorsEnabled,
      connectorMinDistance: config.connectorMinDistance,
      connectorMaxDistance: config.connectorMaxDistance,
      connectorColor: config.connectorColor,
      connectorWidth: config.connectorWidth,
      connectorOpacity: config.connectorOpacity,
      connectorMaxPerParticle: config.connectorMaxPerParticle,
      connectorMaxTotal: config.connectorMaxTotal,
      connectorArcMode: config.connectorArcMode,
      connectorArcOutward: config.connectorArcOutward,
      connectorArcHeight: config.connectorArcHeight,
      connectorShowDots: config.connectorShowDots,
      connectorDotSize: config.connectorDotSize,
      connectorLineStyle: config.connectorLineStyle,
      connectorBlendMode: config.connectorBlendMode,
      connectorDotStrokeOnly: config.connectorDotStrokeOnly,
      connectorDotFillConnected: config.connectorDotFillConnected
    };
    
    // Merge preset config with preserved connector properties
    const mergedConfig = { ...preset.config, ...connectorProps };
    
    // Update config state
    setConfig(mergedConfig);
    
    // Update config ref immediately for smooth animation
    if (configRef.current) {
      configRef.current = { ...mergedConfig };
    }
    
    // Update color set
    setSelectedColorSet(preset.selectedColorSet);
    
    // Update background color
    setBackgroundColor(preset.backgroundColor);
    
    // Update selected preset
    setSelectedPreset(presetName);
  };

  // Helper function to interpolate between two hex colors
  const interpolateColor = (color1, color2, factor) => {
    // Convert hex to RGB
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    // Convert RGB to hex
    const rgbToHex = (r, g, b) => {
      return "#" + [r, g, b].map(x => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      }).join("");
    };

    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return color1; // Fallback if color parsing fails

    const r = rgb1.r + (rgb2.r - rgb1.r) * factor;
    const g = rgb1.g + (rgb2.g - rgb1.g) * factor;
    const b = rgb1.b + (rgb2.b - rgb1.b) * factor;

    return rgbToHex(r, g, b);
  };

  // Helper function to adjust color brightness
  const adjustBrightness = (hex, multiplier) => {
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };
    const rgbToHex = (r, g, b) => {
      return "#" + [r, g, b].map(x => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      }).join("");
    };
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    const r = Math.max(0, Math.min(255, rgb.r * multiplier));
    const g = Math.max(0, Math.min(255, rgb.g * multiplier));
    const b = Math.max(0, Math.min(255, rgb.b * multiplier));
    return rgbToHex(r, g, b);
  };

  // Helper function to adjust color saturation
  const adjustSaturation = (hex, multiplier) => {
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };
    const rgbToHex = (r, g, b) => {
      return "#" + [r, g, b].map(x => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      }).join("");
    };
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    // Convert to grayscale (luminance)
    const gray = rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114;
    // Interpolate between grayscale and original color based on multiplier
    const r = Math.max(0, Math.min(255, gray + (rgb.r - gray) * multiplier));
    const g = Math.max(0, Math.min(255, gray + (rgb.g - gray) * multiplier));
    const b = Math.max(0, Math.min(255, gray + (rgb.b - gray) * multiplier));
    return rgbToHex(r, g, b);
  };

  // Interpolate between two period configurations based on index position
  const interpolatePeriodConfigByIndex = (indexValue) => {
    const enabled = getEnabledPeriods();
    if (enabled.length === 0) return;
    
    const index = parseFloat(indexValue);
    
    // Clamp to valid range
    if (index < 0) return;
    if (index > enabled.length - 1) return;
    
    const lowerIndex = Math.floor(index);
    const upperIndex = Math.ceil(index);
    const factor = index - lowerIndex; // 0 to 1
    
    // If exactly on a period (integer index), use that period's config directly
    if (factor === 0 || lowerIndex === upperIndex) {
      const periodKey = enabled[lowerIndex];
      if (periodKey) {
        handlePeriodChange(periodKey);
      }
      return;
    }
    
    const lowerPeriodKey = enabled[lowerIndex];
    const upperPeriodKey = enabled[upperIndex];
    
    if (!lowerPeriodKey || !upperPeriodKey) return;
    
    const lowerPeriodData = periodPresets[lowerPeriodKey];
    const upperPeriodData = periodPresets[upperPeriodKey];
    
    if (!lowerPeriodData || !upperPeriodData) return;
    
    // Interpolate config values
    const lowerConfig = lowerPeriodData.config;
    const upperConfig = upperPeriodData.config;
    const interpolatedConfig = {};
    
    // Interpolate all numeric values
    Object.keys(lowerConfig).forEach(key => {
      const lowerVal = lowerConfig[key];
      const upperVal = upperConfig[key];
      
      if (typeof lowerVal === 'number' && typeof upperVal === 'number') {
        // Linear interpolation for numbers
        interpolatedConfig[key] = lowerVal + (upperVal - lowerVal) * factor;
      } else if (typeof lowerVal === 'boolean' && typeof upperVal === 'boolean') {
        // Use threshold: >= 0.5 use upper, < 0.5 use lower
        interpolatedConfig[key] = factor >= 0.5 ? upperVal : lowerVal;
      } else {
        // For strings, null, or other types, use lower period's value
        interpolatedConfig[key] = lowerVal;
      }
    });
    
    // Update config state
    setConfig(interpolatedConfig);
    
    // Update config ref immediately for smooth animation
    if (configRef.current) {
      configRef.current = { ...interpolatedConfig };
    }
    
    // Use lower period's color set (interpolating color sets would be complex)
    if (lowerPeriodData.selectedColorSet) {
      setSelectedColorSet(lowerPeriodData.selectedColorSet);
    }
    
    // Interpolate background color
    const interpolatedBgColor = interpolateColor(
      lowerPeriodData.backgroundColor,
      upperPeriodData.backgroundColor,
      factor
    );
    setBackgroundColor(interpolatedBgColor);
    
    // Update selected period (store as decimal index for display)
    setSelectedPeriod(indexValue.toString());
  };

  // Get enabled periods in order
  const getEnabledPeriods = () => {
    return Object.keys(periodPresets).filter(key => enabledPeriods[key]);
  };

  // Toggle period enabled state
  const togglePeriodEnabled = (periodKey) => {
    setEnabledPeriods(prev => {
      const newEnabled = { ...prev, [periodKey]: !prev[periodKey] };
      
      // If disabling the currently selected period, switch to first enabled period
      const enabled = Object.keys(periodPresets).filter(key => newEnabled[key]);
      
      // Check if current selection would be invalid
      const currentIsDecimal = selectedPeriod && !isNaN(parseFloat(selectedPeriod)) && parseFloat(selectedPeriod) >= 0;
      const currentIsPeriodKey = selectedPeriod && enabled.includes(selectedPeriod);
      
      if (!newEnabled[periodKey] && (selectedPeriod === periodKey || (!currentIsPeriodKey && !currentIsDecimal))) {
        if (enabled.length > 0) {
          handlePeriodChange(enabled[0]);
        } else {
          setSelectedPeriod(null);
        }
      }
      
      return newEnabled;
    });
  };

  const handlePeriodChange = (periodName) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/454bdaec-6972-42c5-890c-970c6aef7036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CircularParticles.jsx:3758',message:'handlePeriodChange entry',data:{periodName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const period = periodPresets[periodName];
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/454bdaec-6972-42c5-890c-970c6aef7036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CircularParticles.jsx:3760',message:'period lookup result',data:{periodName,periodExists:!!period,selectedColorSet:period?.selectedColorSet},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (!period) return;
    
    // Apply complete config including all connector params (no preservation)
    // Note: connectorColor can be null, which will use fallback colors in the rendering code
    const periodConfig = { ...period.config };
    
    // Preserve wiggle settings (not typically in period presets)
    if (config.connectorWiggle !== undefined) {
      periodConfig.connectorWiggle = config.connectorWiggle;
    }
    if (typeof config.connectorWiggleAmplitude === 'number') {
      periodConfig.connectorWiggleAmplitude = config.connectorWiggleAmplitude;
    }
    if (typeof config.connectorWiggleFrequency === 'number') {
      periodConfig.connectorWiggleFrequency = config.connectorWiggleFrequency;
    }
    if (typeof config.connectorWiggleSpeed === 'number') {
      periodConfig.connectorWiggleSpeed = config.connectorWiggleSpeed;
    }
    
    // Don't override show dots or blend mode if we're on Default color set
    // Keep Default settings: show dots disabled, normal blending
    if (selectedColorSet === 'Default') {
      periodConfig.connectorShowDots = false;
      periodConfig.blendMode = 'source-over';
    }
    
    // Update config state
    setConfig(periodConfig);
    
    // Update config ref immediately for smooth animation
    if (configRef.current) {
      configRef.current = { ...periodConfig };
    }
    
    // Update color set from preset (which will update gradients via useEffect)
    // But don't change if we're on Default
    if (period.selectedColorSet && selectedColorSet !== 'Default') {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/454bdaec-6972-42c5-890c-970c6aef7036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CircularParticles.jsx:3775',message:'before setSelectedColorSet',data:{selectedColorSet:period.selectedColorSet,colorSetExists:!!colorSets[period.selectedColorSet],allColorSetKeys:Object.keys(colorSets),colorSet7DirectCheck:!!colorSets['Color Set 7'],colorSet7Value:colorSets['Color Set 7']?Object.keys(colorSets['Color Set 7']):'undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      setSelectedColorSet(period.selectedColorSet);
    }
    
    // Update background color (but keep #f9f9f9 for Default)
    if (selectedColorSet !== 'Default') {
      setBackgroundColor(period.backgroundColor);
    }
    
    // Update selected period
    setSelectedPeriod(periodName);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/454bdaec-6972-42c5-890c-970c6aef7036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CircularParticles.jsx:3783',message:'handlePeriodChange exit',data:{periodName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
  };

  const copyAllParams = () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/454bdaec-6972-42c5-890c-970c6aef7036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CircularParticles.jsx:3786',message:'copyAllParams entry',data:{selectedColorSet},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    const currentColorSet = colorSets[selectedColorSet];
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/454bdaec-6972-42c5-890c-970c6aef7036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CircularParticles.jsx:3788',message:'before accessing colorPalette',data:{selectedColorSet,currentColorSetExists:!!currentColorSet,hasColorPalette:!!currentColorSet?.colorPalette,hasGradientStops:!!currentColorSet?.gradientStops},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (!currentColorSet) {
      alert('Color set not found!');
      return;
    }
    const params = {
      config: config,
      colorPalette: currentColorSet.colorPalette,
      gradientStops: currentColorSet.gradientStops
    };
    
    navigator.clipboard.writeText(JSON.stringify(params, null, 2)).then(() => {
      alert('All parameters copied to clipboard!');
    });
  };

  // Update gradient stop color
  const updateGradientStopColor = (gradientIndex, stopIndex, newColor) => {
    setEditableGradients(prev => {
      const newGradients = prev.map((gradient, gIdx) => {
        if (gIdx === gradientIndex) {
          return gradient.map((stop, sIdx) => 
            sIdx === stopIndex ? { ...stop, color: newColor } : stop
          );
        }
        return gradient;
      });
      return newGradients;
    });
  };

  // Update gradient stop position
  const updateGradientStopPosition = (gradientIndex, stopIndex, newPosition) => {
    setEditableGradients(prev => {
      const newGradients = prev.map((gradient, gIdx) => {
        if (gIdx === gradientIndex) {
          const clampedPosition = Math.max(0, Math.min(1, parseFloat(newPosition)));
          return gradient.map((stop, sIdx) => 
            sIdx === stopIndex ? { ...stop, position: clampedPosition } : stop
          ).sort((a, b) => a.position - b.position); // Re-sort after position change
        }
        return gradient;
      });
      return newGradients;
    });
  };

  // Update gradient stop opacity
  const updateGradientStopOpacity = (gradientIndex, stopIndex, newOpacity) => {
    setEditableGradients(prev => {
      const newGradients = prev.map((gradient, gIdx) => {
        if (gIdx === gradientIndex) {
          const clampedOpacity = Math.max(0, Math.min(1, parseFloat(newOpacity)));
          return gradient.map((stop, sIdx) => 
            sIdx === stopIndex ? { ...stop, opacity: clampedOpacity } : stop
          );
        }
        return gradient;
      });
      return newGradients;
    });
  };

  // Add a new stop to a gradient
  const addGradientStop = (gradientIndex) => {
    setEditableGradients(prev => {
      const newGradients = prev.map((gradient, gIdx) => {
        if (gIdx === gradientIndex) {
          // Find a good position for the new stop (middle of largest gap)
          const sorted = [...gradient].sort((a, b) => a.position - b.position);
          let maxGap = 0;
          let insertPosition = 0.5;
          
          for (let i = 0; i < sorted.length - 1; i++) {
            const gap = sorted[i + 1].position - sorted[i].position;
            if (gap > maxGap) {
              maxGap = gap;
              insertPosition = sorted[i].position + gap / 2;
            }
          }
          
          // Interpolate color between adjacent stops
          const newStop = {
            position: insertPosition,
            color: sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)].color : '#ffffff',
            opacity: 1
          };
          
          return [...gradient, newStop].sort((a, b) => a.position - b.position);
        }
        return gradient;
      });
      return newGradients;
    });
  };

  // Remove a stop from a gradient (must have at least 2 stops)
  const removeGradientStop = (gradientIndex, stopIndex) => {
    setEditableGradients(prev => {
      const newGradients = prev.map((gradient, gIdx) => {
        if (gIdx === gradientIndex && gradient.length > 2) {
          return gradient.filter((_, sIdx) => sIdx !== stopIndex);
        }
        return gradient;
      });
      return newGradients;
    });
  };

  // Add a new gradient to the color set
  const addGradient = () => {
    setEditableGradients(prev => {
      // Create a new gradient with default stops (similar to first gradient or a simple default)
      const defaultGradient = prev.length > 0 
        ? prev[0].map(stop => ({ ...stop })) // Copy first gradient as template
        : [
            { position: 0, color: '#ffffff', opacity: 1 },
            { position: 0.5, color: '#000000', opacity: 1 },
            { position: 1, color: '#000000', opacity: 0 }
          ];
      return [...prev, defaultGradient];
    });
  };

  // Remove a gradient from the color set (must have at least 1 gradient)
  const removeGradient = (gradientIndex) => {
    setEditableGradients(prev => {
      if (prev.length > 1) {
        return prev.filter((_, idx) => idx !== gradientIndex);
      }
      return prev; // Keep at least 1 gradient
    });
  };

  // Copy only gradient parameters
  const copyGradientParams = () => {
    navigator.clipboard.writeText(JSON.stringify(editableGradients, null, 2)).then(() => {
      alert('Gradient parameters copied to clipboard!');
    });
  };

  return (
    <div className="w-full h-screen flex flex-col" style={{ backgroundColor }}>
      <div className="bg-gray-900 text-white pt-4 pb-4 px-4 overflow-y-auto max-h-[246px]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">3D Sphere Particle System</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs">Design Preset:</label>
              <select
                value={selectedPreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="bg-gray-700 text-white text-xs px-2 py-1 rounded"
              >
                {Object.keys(designPresets).map((presetName) => (
                  <option key={presetName} value={presetName}>
                    {presetName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs">PERIOD:</label>
              <select
                value={selectedPeriod || ''}
                onChange={(e) => {
                  // #region agent log
                  fetch('http://127.0.0.1:7242/ingest/454bdaec-6972-42c5-890c-970c6aef7036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CircularParticles.jsx:4013',message:'dropdown onChange',data:{selectedValue:e.target.value,allPeriods:Object.keys(periodPresets)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                  // #endregion
                  if (e.target.value) {
                    try {
                      handlePeriodChange(e.target.value);
                    } catch (error) {
                      // #region agent log
                      fetch('http://127.0.0.1:7242/ingest/454bdaec-6972-42c5-890c-970c6aef7036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CircularParticles.jsx:4020',message:'ERROR: handlePeriodChange threw',data:{selectedValue:e.target.value,error:error.message,stack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                      // #endregion
                      console.error('Error in handlePeriodChange:', error);
                    }
                  } else {
                    setSelectedPeriod('');
                  }
                }}
                className="bg-gray-700 text-white text-xs px-2 py-1 rounded"
              >
                <option value="">--</option>
                {Object.keys(periodPresets).map((periodName) => (
                  <option key={periodName} value={periodName}>
                    {periodName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs">Color Set:</label>
              <select
                value={selectedColorSet}
                onChange={(e) => {
                  const newSet = e.target.value;
                  setSelectedColorSet(newSet);
                  // Call the appropriate function for custom sets
                  if (newSet === 'Custom-10') {
                    applyCustom10();
                  } else if (newSet === 'Custom-11') {
                    applyCustom11();
                  } else if (newSet === 'Custom-12') {
                    applyCustom12();
                  }
                }}
                className="bg-gray-700 text-white text-xs px-2 py-1 rounded"
              >
                {Object.keys(colorSets)
                  .sort((a, b) => {
                    // Put "Default" first
                    if (a === 'Default') return -1;
                    if (b === 'Default') return 1;
                    // Then sort alphabetically
                    return a.localeCompare(b);
                  })
                  .map((setName) => (
                    <option key={setName} value={setName}>
                      {setName}
                    </option>
                  ))}
              </select>
            </div>
            <button
              onClick={() => setShowColorControls(!showColorControls)}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-xs"
            >
              {showColorControls ? 'Hide' : 'Show'} Color Controls
            </button>
            <div className="flex items-center gap-2">
              <label className="text-xs">State:</label>
              <select
                value={currentState}
                onChange={(e) => {
                  setCurrentState(e.target.value);
                  setDivisionLevel(0);
                }}
                className="bg-gray-700 text-white text-xs px-2 py-1 rounded"
              >
                <option value="gathering">Gathering</option>
                <option value="birth">Birth</option>
                <option value="grid">Grid</option>
              </select>
            </div>
            {currentState === 'birth' && (
              <div className="flex items-center gap-2">
                <label className="text-xs">Division Level:</label>
                <span className="text-xs font-mono bg-gray-700 px-2 py-1 rounded">
                  {divisionLevel}/7
                </span>
              </div>
            )}
            {currentState === 'grid' && (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-xs">Grid Rows:</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={gridRows}
                    onChange={(e) => {
                      const rows = parseInt(e.target.value) || 1;
                      setGridRows(rows);
                      updateConfig('gridRows', rows);
                      updateConfig('particleCount', rows * gridCols);
                    }}
                    className="w-16 bg-gray-700 text-white text-xs px-2 py-1 rounded"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs">Grid Columns:</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={gridCols}
                    onChange={(e) => {
                      const cols = parseInt(e.target.value) || 1;
                      setGridCols(cols);
                      updateConfig('gridCols', cols);
                      updateConfig('particleCount', gridRows * cols);
                    }}
                    className="w-16 bg-gray-700 text-white text-xs px-2 py-1 rounded"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs">Total Particles:</label>
                  <span className="text-xs font-mono bg-gray-700 px-2 py-1 rounded">
                    {gridRows * gridCols}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs">Grid Width:</label>
                  <input
                    type="number"
                    min="100"
                    max="5000"
                    step="50"
                    value={gridWidth}
                    onChange={(e) => {
                      const width = parseInt(e.target.value) || 100;
                      setGridWidth(width);
                      updateConfig('gridWidth', width);
                    }}
                    className="w-20 bg-gray-700 text-white text-xs px-2 py-1 rounded"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs">Grid Height:</label>
                  <input
                    type="number"
                    min="100"
                    max="5000"
                    step="50"
                    value={gridHeight}
                    onChange={(e) => {
                      const height = parseInt(e.target.value) || 100;
                      setGridHeight(height);
                      updateConfig('gridHeight', height);
                    }}
                    className="w-20 bg-gray-700 text-white text-xs px-2 py-1 rounded"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs">Enable Vertical Movement:</label>
                  <input
                    type="checkbox"
                    checked={config.gridVerticalMovementEnabled}
                    onChange={(e) => {
                      updateConfig('gridVerticalMovementEnabled', e.target.checked);
                    }}
                    className="w-4 h-4"
                  />
                </div>
                {config.gridVerticalMovementEnabled && (
                  <>
                    <div className="flex items-center gap-2">
                      <label className="text-xs">Vertical Speed Min:</label>
                      <input
                        type="number"
                        min="0"
                        max="0.1"
                        step="0.001"
                        value={config.gridVerticalSpeedMin}
                        onChange={(e) => {
                          updateConfig('gridVerticalSpeedMin', parseFloat(e.target.value) || 0);
                        }}
                        className="w-20 bg-gray-700 text-white text-xs px-2 py-1 rounded"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs">Vertical Speed Max:</label>
                      <input
                        type="number"
                        min="0"
                        max="0.1"
                        step="0.001"
                        value={config.gridVerticalSpeedMax}
                        onChange={(e) => {
                          updateConfig('gridVerticalSpeedMax', parseFloat(e.target.value) || 0);
                        }}
                        className="w-20 bg-gray-700 text-white text-xs px-2 py-1 rounded"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs">Vertical Amplitude Min:</label>
                      <input
                        type="number"
                        min="0"
                        max="200"
                        step="1"
                        value={config.gridVerticalAmplitudeMin}
                        onChange={(e) => {
                          updateConfig('gridVerticalAmplitudeMin', parseFloat(e.target.value) || 0);
                        }}
                        className="w-20 bg-gray-700 text-white text-xs px-2 py-1 rounded"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs">Vertical Amplitude Max:</label>
                      <input
                        type="number"
                        min="0"
                        max="200"
                        step="1"
                        value={config.gridVerticalAmplitudeMax}
                        onChange={(e) => {
                          updateConfig('gridVerticalAmplitudeMax', parseFloat(e.target.value) || 0);
                        }}
                        className="w-20 bg-gray-700 text-white text-xs px-2 py-1 rounded"
                      />
                    </div>
                  </>
                )}
              </>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCurrentState('gathering');
                  setDivisionLevel(0);
                }}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
              >
                Reset
              </button>
            </div>
            <button
              onClick={copyAllParams}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs"
            >
              Copy All Parameters
            </button>
            <button
              onClick={() => setShowGradientEditor(!showGradientEditor)}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
            >
              {showGradientEditor ? 'Hide' : 'Show'} Gradient Editor
            </button>
            {showGradientEditor && (
              <button
                onClick={copyGradientParams}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
              >
                Copy Gradient Params
              </button>
            )}
            <div className="flex items-center gap-2">
              <label className="text-xs">BG Color:</label>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-10 h-8 rounded border border-gray-500 cursor-pointer"
              />
              <input
                type="text"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-20 bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-500"
                placeholder="#ffffff"
              />
            </div>
          </div>
        </div>

        {/* Color Control Panel */}
        {showColorControls && (
          <div className="mb-4 p-4 bg-gray-800 rounded border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-indigo-400">🎨 Color Controls</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setColorBrightness(1.0);
                    setColorSaturation(1.0);
                    const currentSet = colorSets[selectedColorSet];
                    if (currentSet) {
                      const gradientCount = currentSet.gradientStops ? currentSet.gradientStops.length : editableGradients.length;
                      setEnabledGradients(Array(gradientCount).fill(true));
                    }
                  }}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
                >
                  Reset All
                </button>
              </div>
            </div>

            {/* Color Palette Selector */}
            <div className="mb-6 p-3 bg-gray-700 rounded border border-gray-600">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Color Palettes</h4>
              <div className="mb-3">
                <label className="text-xs text-gray-400 block mb-2">
                  Quick Apply Palette:
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={selectedPalette || ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        applyColorPalette(e.target.value);
                      }
                    }}
                    className="bg-gray-800 text-white text-xs px-3 py-2 rounded border border-gray-600 flex-1 min-w-[200px]"
                  >
                    <option value="">-- Select a palette --</option>
                    {Object.keys(colorPalettes).map((paletteName) => (
                      <option key={paletteName} value={paletteName}>
                        {paletteName}
                      </option>
                    ))}
                  </select>
                  {selectedPalette && (
                    <button
                      onClick={() => {
                        setSelectedPalette(null);
                      }}
                      className="px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded text-xs"
                      title="Clear palette selection"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              {/* Custom Color Sets */}
              <div className="mt-3 pt-3 border-t border-gray-600">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={applyCustom1}
                    className="px-2 py-2 bg-purple-600 hover:bg-purple-700 rounded text-xs font-medium text-white transition-colors"
                    title="Apply Custom-1: Exact arrangement with 6 specific gradients"
                  >
                    Custom-1
                  </button>
                  <button
                    onClick={applyCustom2}
                    className="px-2 py-2 bg-purple-600 hover:bg-purple-700 rounded text-xs font-medium text-white transition-colors"
                    title="Apply Custom-2: Exact arrangement with 6 specific gradients"
                  >
                    Custom-2
                  </button>
                  <button
                    onClick={applyCustom3}
                    className="px-2 py-2 bg-purple-600 hover:bg-purple-700 rounded text-xs font-medium text-white transition-colors"
                    title="Apply Custom-3: Exact arrangement with 6 specific gradients"
                  >
                    Custom-3
                  </button>
                  <button
                    onClick={applyCustom4}
                    className="px-2 py-2 bg-purple-600 hover:bg-purple-700 rounded text-xs font-medium text-white transition-colors"
                    title="Apply Custom-4: Exact arrangement with 6 specific gradients"
                  >
                    Custom-4
                  </button>
                  <button
                    onClick={applyCustom5}
                    className="px-2 py-2 bg-purple-600 hover:bg-purple-700 rounded text-xs font-medium text-white transition-colors"
                    title="Apply Custom-5: Exact arrangement with 7 specific gradients"
                  >
                    Custom-5
                  </button>
                  <button
                    onClick={applyCustom6}
                    className="px-2 py-2 bg-purple-600 hover:bg-purple-700 rounded text-xs font-medium text-white transition-colors"
                    title="Apply Custom-6: Exact arrangement with 6 specific gradients"
                  >
                    Custom-6
                  </button>
                  <button
                    onClick={applyCustom7}
                    className="px-2 py-2 bg-purple-600 hover:bg-purple-700 rounded text-xs font-medium text-white transition-colors"
                    title="Apply Custom-7: Exact arrangement with 6 specific gradients"
                  >
                    Custom-7
                  </button>
                  <button
                    onClick={applyCustom8}
                    className="px-2 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-xs font-medium text-white transition-colors"
                    title="Apply Custom-8: Exact arrangement with 5 specific gradients"
                  >
                    Custom-8
                  </button>
                  <button
                    onClick={applyCustom9}
                    className="px-2 py-2 bg-teal-600 hover:bg-teal-700 rounded text-xs font-medium text-white transition-colors"
                    title="Apply Custom-9: Color Set K adjusted for normal blending mode"
                  >
                    Custom-9
                  </button>
                  <button
                    onClick={applyDefault}
                    className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-xs font-medium text-white transition-colors"
                    title="Apply Default: Same as Custom-9 but softer/more transparent"
                  >
                    Default
                  </button>
                  <button
                    onClick={applyCustom10}
                    className="px-2 py-2 bg-pink-600 hover:bg-pink-700 rounded text-xs font-medium text-white transition-colors"
                    title="Apply Custom-10: Same structure as Default with new color palette"
                  >
                    Custom-10
                  </button>
                  <button
                    onClick={applyCustom11}
                    className="px-2 py-2 bg-rose-600 hover:bg-rose-700 rounded text-xs font-medium text-white transition-colors"
                    title="Apply Custom-11: Same structure as Custom-10 with new color palette"
                  >
                    Custom-11
                  </button>
                  <button
                    onClick={applyCustom12}
                    className="px-2 py-2 bg-violet-600 hover:bg-violet-700 rounded text-xs font-medium text-white transition-colors"
                    title="Apply Custom-12: Same structure as Custom-11 with updated blue and purple"
                  >
                    Custom-12
                  </button>
                </div>
                <div className="mt-2 text-xs text-gray-400 text-center space-y-1">
                  <div>Custom-1: #022FCD, #CA7D00, #FE5E40, #FFFF8D, #FCAFBA, #C3F0FF</div>
                  <div>Custom-2: #FAFBFF, #CA7D00, #F7452F, #FFFF8D, #FCAFBA, #A4D2E1</div>
                  <div>Custom-3: #022FCD, #CA7D00, #FE5E40, #FFFF8D, #FCAFBA, #A4D2E1, #005442</div>
                  <div>Custom-4: #FF5616, #8E151A, #022FCD, #FD98EA, #013605, #74AB34, #CA7D00, #797791</div>
                  <div>Custom-5: #7098FA, #FF8C4A, #FFC6DD, #FAFE45, #D4EF3B, #80EB91</div>
                  <div>Custom-6: #FAE5EF, #F2262A, #2E32FF, #FBF99F, #284D41, #B7E5FF, #5E4E3A</div>
                  <div>Custom-7: #013605, #F54114, #FD98EA, #022FCD, #CA7D00, #0E0033, #48881E</div>
                  <div>Custom-8: #4891EA, #96b62d, #9fc1d6, #f2262A, #f3f3f3, #f4d529, #ffb8f2</div>
                  <div>Custom-9: #4891EA, #96B62D, #9FC1D6, #F2262A, #F3F3F3, #F4D529, #FFB8F2</div>
                  <div>Default: Same as Custom-9 but softer/more transparent</div>
                </div>
              </div>
              {/* Palette Preview */}
              {selectedPalette && colorPalettes[selectedPalette] && (
                <div className="mt-3">
                  <div className="text-xs text-gray-400 mb-2">Palette Preview:</div>
                  <div className="flex gap-1 flex-wrap">
                    {colorPalettes[selectedPalette].map((color, idx) => (
                      <div
                        key={idx}
                        className="w-12 h-12 rounded border-2 border-gray-500"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Global Color Adjustments */}
            <div className="mb-6 p-3 bg-gray-700 rounded border border-gray-600">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Global Adjustments</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-2">
                    Brightness: {(colorBrightness * 100).toFixed(0)}%
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.05"
                    value={colorBrightness}
                    onChange={(e) => setColorBrightness(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>50%</span>
                    <span>100%</span>
                    <span>200%</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-2">
                    Saturation: {(colorSaturation * 100).toFixed(0)}%
                  </label>
                  <input
                    type="range"
                    min="0.0"
                    max="2.0"
                    step="0.05"
                    value={colorSaturation}
                    onChange={(e) => setColorSaturation(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>100%</span>
                    <span>200%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Gradient Previews */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Gradient Previews</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {editableGradients.map((stops, gradientIndex) => {
                  const sortedStops = [...stops].sort((a, b) => a.position - b.position);
                  const gradientString = sortedStops.map((stop, idx) => {
                    // Apply brightness and saturation adjustments
                    let adjustedColor = stop.color;
                    if (colorBrightness !== 1.0) {
                      adjustedColor = adjustBrightness(adjustedColor, colorBrightness);
                    }
                    if (colorSaturation !== 1.0) {
                      adjustedColor = adjustSaturation(adjustedColor, colorSaturation);
                    }
                    const colorWithOpacity = stop.opacity < 1 
                      ? adjustedColor + Math.round(stop.opacity * 255).toString(16).padStart(2, '0')
                      : adjustedColor;
                    return `${colorWithOpacity} ${stop.position * 100}%`;
                  }).join(', ');

                  const isEnabled = enabledGradients[gradientIndex] !== false;
                  const isSelected = selectedGradientIndex === gradientIndex;

                  // Handler for clicking on the gradient card to edit it
                  const handleGradientClick = (e) => {
                    // Don't trigger if clicking on the toggle switch
                    if (e.target.closest('label') || e.target.closest('input[type="checkbox"]')) {
                      return;
                    }
                    // Set this gradient as selected and open the editor
                    setSelectedGradientIndex(gradientIndex);
                    setShowGradientEditor(true);
                    // Scroll to the gradient in the editor after a brief delay to allow it to render
                    setTimeout(() => {
                      const gradientElement = gradientEditorRefs.current[gradientIndex];
                      if (gradientElement) {
                        gradientElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // Add a highlight effect
                        gradientElement.classList.add('ring-4', 'ring-yellow-400');
                        setTimeout(() => {
                          gradientElement.classList.remove('ring-4', 'ring-yellow-400');
                        }, 2000);
                      }
                    }, 100);
                  };

                  return (
                    <div
                      key={gradientIndex}
                      onClick={handleGradientClick}
                      className={`p-3 rounded border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 border-yellow-400 ring-2 ring-yellow-400'
                          : isEnabled
                          ? 'bg-gray-700 border-indigo-500 hover:border-indigo-400 hover:bg-gray-600'
                          : 'bg-gray-800 border-gray-600 opacity-50'
                      }`}
                      title="Click to edit this gradient"
                    >
                      <div className="mb-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-white">
                            Gradient {gradientIndex + 1}
                            {isSelected && <span className="ml-2 text-yellow-300">✏️ Editing</span>}
                          </span>
                          <label 
                            className="relative inline-flex items-center cursor-pointer"
                            onClick={(e) => e.stopPropagation()} // Prevent card click when toggling
                          >
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={(e) => {
                                const newEnabled = [...enabledGradients];
                                newEnabled[gradientIndex] = e.target.checked;
                                setEnabledGradients(newEnabled);
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                        </div>
                        <div
                          className="h-16 rounded border border-gray-500 mb-2"
                          style={{
                            background: `radial-gradient(circle, ${gradientString})`,
                            opacity: isEnabled ? 1 : 0.5
                          }}
                        />
                      </div>
                      <div className="text-xs text-gray-400 flex items-center justify-between">
                        <span>{sortedStops.length} stops</span>
                        <span className="text-indigo-300">Click to edit →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setEnabledGradients(Array(editableGradients.length).fill(true))}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
              >
                Enable All
              </button>
              <button
                onClick={() => setEnabledGradients(Array(editableGradients.length).fill(false))}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
              >
                Disable All
              </button>
              <button
                onClick={() => {
                  const newEnabled = enabledGradients.map((_, i) => i % 2 === 0);
                  setEnabledGradients(newEnabled);
                }}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
              >
                Toggle Alternating
              </button>
            </div>
          </div>
        )}
        
        {/* Period Slider */}
        <div className="mb-4 py-4 px-4 bg-gray-800 rounded border border-gray-700">
          {/* Checkboxes for enabling/disabling periods */}
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <label className="text-xs font-medium text-gray-300">Enable periods:</label>
            {Object.keys(periodPresets).map((periodKey) => (
              <label key={periodKey} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabledPeriods[periodKey]}
                  onChange={() => togglePeriodEnabled(periodKey)}
                  className="w-4 h-4 accent-blue-500 cursor-pointer"
                />
                <span className="text-xs text-white">{periodKey}</span>
              </label>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <label className="text-xs font-medium text-gray-300">Interpolate:</label>
              <button
                onClick={() => {
                  const newMode = !interpolateMode;
                  setInterpolateMode(newMode);
                  
                  // If switching to snap mode, snap to nearest period
                  if (!newMode && selectedPeriod) {
                    const enabled = getEnabledPeriods();
                    if (enabled.length > 0) {
                      const parsed = parseFloat(selectedPeriod);
                      if (!isNaN(parsed) && parsed >= 0 && parsed < enabled.length) {
                        // It's a decimal index, snap to nearest
                        const roundedIndex = Math.round(parsed);
                        const targetPeriod = enabled[roundedIndex];
                        if (targetPeriod) {
                          handlePeriodChange(targetPeriod);
                        }
                      } else if (enabled.includes(selectedPeriod)) {
                        // Already a period key, keep it
                        handlePeriodChange(selectedPeriod);
                      } else {
                        // Invalid, use first enabled
                        handlePeriodChange(enabled[0]);
                      }
                    }
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  interpolateMode ? 'bg-blue-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    interpolateMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-white whitespace-nowrap">Period:</label>
            <div className="flex-1 flex items-center gap-4">
              {(() => {
                const enabled = getEnabledPeriods();
                if (enabled.length === 0) {
                  return (
                    <div className="flex-1 text-center text-gray-400 text-sm py-2">
                      No periods enabled
                    </div>
                  );
                }
                
                // Get current index value (can be decimal for interpolation)
                let currentIndexValue = 0;
                if (selectedPeriod) {
                  // Check if selectedPeriod is a decimal index string
                  const parsed = parseFloat(selectedPeriod);
                  if (!isNaN(parsed) && parsed >= 0 && parsed < enabled.length) {
                    currentIndexValue = parsed;
                  } else if (enabled.includes(selectedPeriod)) {
                    // It's a period key, get its index
                    currentIndexValue = enabled.indexOf(selectedPeriod);
                  }
                }
                
                // Calculate progress based on index position (equal segments)
                const progress = enabled.length > 1
                  ? (currentIndexValue / (enabled.length - 1)) * 100
                  : 0;
                
                // Determine display value
                const lowerIndex = Math.floor(currentIndexValue);
                const upperIndex = Math.ceil(currentIndexValue);
                const factor = currentIndexValue - lowerIndex;
                let displayValue = '--';
                
                if (factor === 0 || lowerIndex === upperIndex) {
                  // Exactly on a period
                  displayValue = enabled[lowerIndex] || '--';
                } else if (interpolateMode) {
                  // Between periods - show both with interpolation indicator
                  const lowerPeriod = enabled[lowerIndex];
                  const upperPeriod = enabled[upperIndex];
                  displayValue = `${lowerPeriod}-${upperPeriod}`;
                } else {
                  // Snap mode - show nearest period
                  displayValue = enabled[Math.round(currentIndexValue)] || enabled[lowerIndex] || '--';
                }
                
                return (
                  <>
                    <input
                      type="range"
                      min="0"
                      max={enabled.length - 1}
                      step={interpolateMode ? "0.01" : "1"}
                      value={interpolateMode ? currentIndexValue : Math.round(currentIndexValue)}
                      onChange={(e) => {
                        const indexValue = parseFloat(e.target.value);
                        if (interpolateMode) {
                          interpolatePeriodConfigByIndex(indexValue);
                        } else {
                          // Snap to nearest period
                          const roundedIndex = Math.round(indexValue);
                          const targetPeriod = enabled[roundedIndex];
                          if (targetPeriod) {
                            handlePeriodChange(targetPeriod);
                          }
                        }
                      }}
                      className="flex-1 h-4 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-colors"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress}%, #374151 ${progress}%, #374151 100%)`
                      }}
                    />
                    <span className="text-sm font-mono text-white bg-gray-700 px-3 py-1.5 rounded min-w-[3rem] text-center border border-gray-600">
                      {displayValue}
                    </span>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
        
        {showGradientEditor && (
          <div className="mb-4 p-4 bg-gray-800 rounded border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-green-400">Gradient Editor</h3>
              <button
                onClick={addGradient}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
              >
                + Add Gradient
              </button>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {editableGradients.map((stops, gradientIndex) => {
                const sortedStops = [...stops].sort((a, b) => a.position - b.position);
                const gradientString = sortedStops.map((stop, idx) => {
                  const colorWithOpacity = stop.opacity < 1 
                    ? stop.color + Math.round(stop.opacity * 255).toString(16).padStart(2, '0')
                    : stop.color;
                  return `${colorWithOpacity} ${stop.position * 100}%`;
                }).join(', ');
                
                const isSelected = selectedGradientIndex === gradientIndex;
                
                return (
                  <div 
                    key={gradientIndex} 
                    ref={(el) => { gradientEditorRefs.current[gradientIndex] = el; }}
                    className={`p-3 rounded border-2 transition-all ${
                      isSelected 
                        ? 'bg-indigo-800 border-yellow-400 ring-2 ring-yellow-400' 
                        : 'bg-gray-700 border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm font-medium ${isSelected ? 'text-yellow-300' : 'text-white'}`}>
                          Gradient {gradientIndex + 1}
                          {isSelected && <span className="ml-2">✏️</span>}
                        </h4>
                        {editableGradients.length > 1 && (
                          <button
                            onClick={() => removeGradient(gradientIndex)}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs text-white"
                            title="Remove this gradient"
                          >
                            × Remove Gradient
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => addGradientStop(gradientIndex)}
                        className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                      >
                        + Add Stop
                      </button>
                    </div>
                    
                    {/* Visual Gradient Slider */}
                    <div className="mb-4">
                      <div 
                        className="relative h-12 rounded border border-gray-500 overflow-hidden mb-2 cursor-crosshair"
                        style={{
                          background: `linear-gradient(to right, ${gradientString})`
                        }}
                        onMouseDown={(e) => {
                          const slider = e.currentTarget;
                          const rect = slider.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const percent = Math.max(0, Math.min(1, x / rect.width));
                          
                          // Find closest stop or create new one
                          const sorted = [...stops].sort((a, b) => a.position - b.position);
                          const closestStop = sorted.reduce((closest, stop) => {
                            const dist = Math.abs(stop.position - percent);
                            return dist < Math.abs(closest.position - percent) ? stop : closest;
                          }, sorted[0]);
                          
                          const originalIndex = stops.findIndex(s => s === closestStop);
                          const handleMove = (moveEvent) => {
                            const newX = moveEvent.clientX - rect.left;
                            const newPercent = Math.max(0, Math.min(1, newX / rect.width));
                            updateGradientStopPosition(gradientIndex, originalIndex, newPercent);
                          };
                          const handleUp = () => {
                            document.removeEventListener('mousemove', handleMove);
                            document.removeEventListener('mouseup', handleUp);
                          };
                          document.addEventListener('mousemove', handleMove);
                          document.addEventListener('mouseup', handleUp);
                        }}
                      >
                        {sortedStops.map((stop, stopIndex) => {
                          const originalIndex = stops.findIndex(s => s === stop);
                          return (
                            <div
                              key={originalIndex}
                              className="absolute top-0 bottom-0 cursor-move"
                              style={{
                                left: `${stop.position * 100}%`,
                                transform: 'translateX(-50%)',
                                zIndex: 10,
                                width: '8px'
                              }}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                const slider = e.currentTarget.parentElement;
                                const rect = slider.getBoundingClientRect();
                                const handleMove = (moveEvent) => {
                                  const x = moveEvent.clientX - rect.left;
                                  const percent = Math.max(0, Math.min(1, x / rect.width));
                                  updateGradientStopPosition(gradientIndex, originalIndex, percent);
                                };
                                const handleUp = () => {
                                  document.removeEventListener('mousemove', handleMove);
                                  document.removeEventListener('mouseup', handleUp);
                                };
                                document.addEventListener('mousemove', handleMove);
                                document.addEventListener('mouseup', handleUp);
                              }}
                            >
                              <div 
                                className="absolute top-0 left-1/2 transform -translate-x-1/2 w-5 h-5 rounded border-2 border-white shadow-lg cursor-move hover:scale-110 transition-transform"
                                style={{ 
                                  backgroundColor: stop.color,
                                  borderColor: stop.opacity < 0.5 ? '#888' : '#fff',
                                  top: '-2px'
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Stop Details */}
                    <div className="space-y-2">
                      <div className="text-xs text-gray-400 mb-2">Stops:</div>
                      {sortedStops.map((stop, stopIndex) => {
                        const originalIndex = stops.findIndex(s => s === stop);
                        return (
                          <div 
                            key={originalIndex} 
                            className="p-2 bg-gray-600 rounded border border-gray-500"
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div 
                                className="w-6 h-6 rounded border border-gray-400"
                                style={{ backgroundColor: stop.color }}
                              />
                              <div className="flex-1 grid grid-cols-3 gap-2">
                                <div>
                                  <label className="text-xs text-gray-300 block mb-1">Position</label>
                                  <input
                                    type="text"
                                    value={`${(stop.position * 100).toFixed(1)}%`}
                                    onChange={(e) => {
                                      const percent = parseFloat(e.target.value.replace('%', '')) / 100;
                                      if (!isNaN(percent)) {
                                        updateGradientStopPosition(gradientIndex, originalIndex, percent);
                                      }
                                    }}
                                    className="w-full bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-300 block mb-1">Color</label>
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="color"
                                      value={stop.color}
                                      onChange={(e) => updateGradientStopColor(gradientIndex, originalIndex, e.target.value)}
                                      className="w-8 h-8 rounded border border-gray-500 cursor-pointer"
                                    />
                                    <input
                                      type="text"
                                      value={stop.color}
                                      onChange={(e) => updateGradientStopColor(gradientIndex, originalIndex, e.target.value)}
                                      className="flex-1 bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-500"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-xs text-gray-300 block mb-1">Opacity</label>
                                  <input
                                    type="text"
                                    value={`${Math.round(stop.opacity * 100)}%`}
                                    onChange={(e) => {
                                      const percent = parseFloat(e.target.value.replace('%', '')) / 100;
                                      if (!isNaN(percent)) {
                                        updateGradientStopOpacity(gradientIndex, originalIndex, percent);
                                      }
                                    }}
                                    className="w-full bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-500"
                                  />
                                </div>
                              </div>
                              {stops.length > 2 && (
                                <button
                                  onClick={() => removeGradientStop(gradientIndex, originalIndex)}
                                  className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs text-white"
                                >
                                  −
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs block mb-1">Particle Count</label>
            <input
              type="range"
              min="1"
              max="150"
              value={config.particleCount}
              onChange={(e) => updateConfig('particleCount', e.target.value)}
              className="w-full"
            />
            <span className="text-xs">{config.particleCount}</span>
          </div>

          <div>
            <label className="text-xs block mb-1">Sphere Radius</label>
            <input
              type="range"
              min="1"
              max="300"
              value={config.sphereRadius}
              onChange={(e) => updateConfig('sphereRadius', e.target.value)}
              className="w-full"
            />
            <span className="text-xs">{config.sphereRadius}</span>
          </div>

          <div>
            <label className="text-xs block mb-1">Scatter Amount</label>
            <input
              type="range"
              min="0"
              max="300"
              value={config.scatter}
              onChange={(e) => updateConfig('scatter', e.target.value)}
              className="w-full"
            />
            <span className="text-xs">{config.scatter}</span>
          </div>

          <div>
            <label className="text-xs block mb-1">Min Particle Size</label>
            <input
              type="range"
              min="1"
              max="30"
              value={config.minRadius}
              onChange={(e) => updateConfig('minRadius', e.target.value)}
              className="w-full"
            />
            <span className="text-xs">{config.minRadius}</span>
          </div>

          <div>
            <label className="text-xs block mb-1">Max Particle Size</label>
            <input
              type="range"
              min="1"
              max="200"
              value={config.maxRadius}
              onChange={(e) => updateConfig('maxRadius', e.target.value)}
              className="w-full"
            />
            <span className="text-xs">{config.maxRadius}</span>
          </div>

          <div>
            <label className="text-xs block mb-1">Rotation Speed X</label>
            <input
              type="range"
              min="0"
              max="0.01"
              step="0.0001"
              value={config.rotationSpeedX}
              onChange={(e) => updateConfig('rotationSpeedX', e.target.value)}
              className="w-full"
            />
            <span className="text-xs">{config.rotationSpeedX.toFixed(4)}</span>
          </div>

          <div>
            <label className="text-xs block mb-1">Rotation Speed Y</label>
            <input
              type="range"
              min="0"
              max="0.01"
              step="0.0001"
              value={config.rotationSpeedY}
              onChange={(e) => updateConfig('rotationSpeedY', e.target.value)}
              className="w-full"
            />
            <span className="text-xs">{config.rotationSpeedY.toFixed(4)}</span>
          </div>

          <div>
            <label className="text-xs block mb-1">Pulse Speed</label>
            <input
              type="range"
              min="0"
              max="0.05"
              step="0.001"
              value={config.pulseSpeed}
              onChange={(e) => updateConfig('pulseSpeed', e.target.value)}
              className="w-full"
            />
            <span className="text-xs">{config.pulseSpeed.toFixed(3)}</span>
          </div>

          <div>
            <label className="text-xs block mb-1">Perspective</label>
            <input
              type="range"
              min="400"
              max="1200"
              value={config.perspective}
              onChange={(e) => updateConfig('perspective', e.target.value)}
              className="w-full"
            />
            <span className="text-xs">{config.perspective}</span>
          </div>

          <div>
            <label className="text-xs block mb-1 text-purple-400">Min Breathing Speed</label>
            <input
              type="range"
              min="0"
              max="0.01"
              step="0.0001"
              value={config.breathingSpeedMin}
              onChange={(e) => updateConfig('breathingSpeedMin', e.target.value)}
              className="w-full accent-purple-500"
            />
            <span className="text-xs text-purple-300">{config.breathingSpeedMin.toFixed(4)}</span>
          </div>

          <div>
            <label className="text-xs block mb-1 text-purple-400">Max Breathing Speed</label>
            <input
              type="range"
              min="0"
              max="0.01"
              step="0.0001"
              value={config.breathingSpeedMax}
              onChange={(e) => updateConfig('breathingSpeedMax', e.target.value)}
              className="w-full accent-purple-500"
            />
            <span className="text-xs text-purple-300">{config.breathingSpeedMax.toFixed(4)}</span>
          </div>

          <div>
            <label className="text-xs block mb-1 text-purple-400">Min Breathing Amount</label>
            <input
              type="range"
              min="0"
              max="100"
              value={config.breathingAmountMin}
              onChange={(e) => updateConfig('breathingAmountMin', e.target.value)}
              className="w-full accent-purple-500"
            />
            <span className="text-xs text-purple-300">{config.breathingAmountMin}</span>
          </div>

          <div>
            <label className="text-xs block mb-1 text-purple-400">Max Breathing Amount</label>
            <input
              type="range"
              min="0"
              max="100"
              value={config.breathingAmountMax}
              onChange={(e) => updateConfig('breathingAmountMax', e.target.value)}
              className="w-full accent-purple-500"
            />
            <span className="text-xs text-purple-300">{config.breathingAmountMax}</span>
          </div>

          <div>
            <label className="text-xs block mb-1 text-blue-400">Background Particles</label>
            <input
              type="range"
              min="0"
              max="1000"
              value={config.backgroundParticles}
              onChange={(e) => updateConfig('backgroundParticles', e.target.value)}
              className="w-full accent-blue-500"
            />
            <span className="text-xs text-blue-300">{config.backgroundParticles}</span>
          </div>

          <div>
            <label className="text-xs block mb-1 text-blue-400">BG Min Drift Speed</label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              value={config.bgDriftSpeedMin}
              onChange={(e) => updateConfig('bgDriftSpeedMin', e.target.value)}
              className="w-full accent-blue-500"
            />
            <span className="text-xs text-blue-300">{config.bgDriftSpeedMin.toFixed(2)}</span>
          </div>

          <div>
            <label className="text-xs block mb-1 text-blue-400">BG Max Drift Speed</label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              value={config.bgDriftSpeedMax}
              onChange={(e) => updateConfig('bgDriftSpeedMax', e.target.value)}
              className="w-full accent-blue-500"
            />
            <span className="text-xs text-blue-300">{config.bgDriftSpeedMax.toFixed(2)}</span>
          </div>

          <div>
            <label className="text-xs block mb-1 text-blue-400">BG Min Size</label>
            <input
              type="range"
              min="5"
              max="50"
              value={config.bgMinSize}
              onChange={(e) => updateConfig('bgMinSize', e.target.value)}
              className="w-full accent-blue-500"
            />
            <span className="text-xs text-blue-300">{config.bgMinSize}</span>
          </div>

          <div>
            <label className="text-xs block mb-1 text-blue-400">BG Max Size</label>
            <input
              type="range"
              min="5"
              max="100"
              value={config.bgMaxSize}
              onChange={(e) => updateConfig('bgMaxSize', e.target.value)}
              className="w-full accent-blue-500"
            />
            <span className="text-xs text-blue-300">{config.bgMaxSize}</span>
          </div>

          <div>
            <label className="text-xs block mb-1 text-orange-400">Trail Type</label>
            <select
              value={config.trailType}
              onChange={(e) => updateConfig('trailType', e.target.value)}
              className="w-full bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-500"
            >
              <option value="echo">Echo</option>
              <option value="streak">Streak</option>
              <option value="ribbon">Ribbon</option>
              <option value="sparkle">Sparkle</option>
              <option value="glow">Glow</option>
              <option value="fade">Fade</option>
            </select>
          </div>

          {config.trailType === 'streak' && (
            <div>
              <label className="text-xs block mb-1 text-orange-400">Streak Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.streakColor || '#c8c8ff'}
                  onChange={(e) => updateConfig('streakColor', e.target.value)}
                  className="w-10 h-8 rounded border border-gray-500 cursor-pointer"
                />
                <input
                  type="text"
                  value={config.streakColor || '#c8c8ff'}
                  onChange={(e) => updateConfig('streakColor', e.target.value)}
                  className="flex-1 bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-500"
                  placeholder="#c8c8ff"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs block mb-1 text-orange-400">Blend Mode</label>
            <select
              value={config.blendMode || 'multiply'}
              onChange={(e) => updateConfig('blendMode', e.target.value)}
              className="w-full bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-500"
            >
              <option value="source-over">Normal (Source Over)</option>
              <option value="multiply">Multiply</option>
              <option value="screen">Screen</option>
              <option value="overlay">Overlay</option>
              <option value="darken">Darken</option>
              <option value="lighten">Lighten</option>
              <option value="color-dodge">Color Dodge</option>
              <option value="color-burn">Color Burn</option>
              <option value="hard-light">Hard Light</option>
              <option value="soft-light">Soft Light</option>
              <option value="difference">Difference</option>
              <option value="exclusion">Exclusion</option>
              <option value="hue">Hue</option>
              <option value="saturation">Saturation</option>
              <option value="color">Color</option>
              <option value="luminosity">Luminosity</option>
            </select>
          </div>

          <div>
            <label className="text-xs block mb-1 text-orange-400">Trail Amount</label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              value={config.motionBlur}
              onChange={(e) => updateConfig('motionBlur', e.target.value)}
              className="w-full accent-orange-500"
            />
            <span className="text-xs text-orange-300">{config.motionBlur.toFixed(2)}</span>
          </div>

          <div>
            <label className="text-xs block mb-1 text-orange-400">Trail Length (frames)</label>
            <input
              type="range"
              min="0"
              max="100"
              value={config.motionBlurSteps}
              onChange={(e) => updateConfig('motionBlurSteps', e.target.value)}
              className="w-full accent-orange-500"
            />
            <span className="text-xs text-orange-300">{config.motionBlurSteps}</span>
          </div>

          <div>
            <label className="text-xs block mb-1 text-orange-400">Trail Interval (gap between echoes)</label>
            <input
              type="range"
              min="1"
              max="10"
              value={config.trailInterval || 1}
              onChange={(e) => updateConfig('trailInterval', parseInt(e.target.value))}
              className="w-full accent-orange-500"
            />
            <span className="text-xs text-orange-300">{config.trailInterval || 1} frame{(config.trailInterval || 1) !== 1 ? 's' : ''}</span>
          </div>

          <div>
            <label className="text-xs block mb-1 text-cyan-400">Sphere Particle Opacity</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={config.particleOpacity}
              onChange={(e) => updateConfig('particleOpacity', e.target.value)}
              className="w-full accent-cyan-500"
            />
            <span className="text-xs text-cyan-300">{config.particleOpacity.toFixed(2)}</span>
          </div>

          <div>
            <label className="text-xs block mb-1 text-cyan-400">Particle Noise</label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={config.particleNoise}
              onChange={(e) => updateConfig('particleNoise', parseFloat(e.target.value) || 0)}
              className="w-full accent-cyan-500"
            />
            <span className="text-xs text-cyan-300">{config.particleNoise}</span>
          </div>

          <div>
            <label className="text-xs block mb-1 text-cyan-400">BG Particle Opacity</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={config.bgParticleOpacity}
              onChange={(e) => updateConfig('bgParticleOpacity', e.target.value)}
              className="w-full accent-cyan-500"
            />
            <span className="text-xs text-cyan-300">{config.bgParticleOpacity.toFixed(2)}</span>
          </div>

          <div>
            <label className="text-xs block mb-1 text-cyan-400">One Color Mode</label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={oneColorMode}
                onChange={(e) => setOneColorMode(e.target.checked)}
                className="w-4 h-4 accent-cyan-500 cursor-pointer"
              />
              <span className="text-xs text-cyan-300">{oneColorMode ? 'On' : 'Off'}</span>
            </div>
          </div>

          {oneColorMode && (
            <>
              <div>
                <label className="text-xs block mb-1 text-cyan-400">Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={oneColorModeColor}
                    onChange={(e) => setOneColorModeColor(e.target.value)}
                    className="w-12 h-8 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={oneColorModeColor}
                    onChange={(e) => setOneColorModeColor(e.target.value)}
                    className="flex-1 bg-gray-700 text-white text-xs px-2 py-1 rounded"
                    placeholder="#ffffff"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs block mb-1 text-cyan-400">Use Original Dot Colors</label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={oneColorModeDotOriginalColor}
                    onChange={(e) => setOneColorModeDotOriginalColor(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500 cursor-pointer"
                  />
                  <span className="text-xs text-cyan-300">{oneColorModeDotOriginalColor ? 'On' : 'Off'}</span>
                </div>
                <span className="text-xs text-gray-400 italic block mt-1">Use first gradient color for connector dots</span>
              </div>
            </>
          )}

          <div className="col-span-2 md:col-span-4 border-t border-gray-600 pt-4 mt-2">
            <h3 className="text-sm font-semibold text-green-400 mb-3">Connectors</h3>
          </div>

          <div>
            <label className="text-xs block mb-1 text-green-400">Enable Connectors</label>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={config.connectorsEnabled !== false}
                onChange={(e) => updateConfig('connectorsEnabled', e.target.checked)}
                className="w-4 h-4 accent-green-500"
              />
              <span className="text-xs text-green-300 ml-2">
                {config.connectorsEnabled !== false ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs block mb-1 text-green-400">Arc Mode</label>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={config.connectorArcMode === true}
                onChange={(e) => updateConfig('connectorArcMode', e.target.checked)}
                className="w-4 h-4 accent-green-500"
                disabled={config.connectorsEnabled === false}
              />
              <span className="text-xs text-green-300 ml-2">
                {config.connectorArcMode === true ? 'Arcs' : 'Lines'}
              </span>
            </div>
          </div>

          {config.connectorArcMode && (
            <>
              <div>
                <label className="text-xs block mb-1 text-green-400">Arc Direction</label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.connectorArcOutward !== false}
                    onChange={(e) => updateConfig('connectorArcOutward', e.target.checked)}
                    className="w-4 h-4 accent-green-500"
                    disabled={config.connectorsEnabled === false}
                  />
                  <span className="text-xs text-green-300 ml-2">
                    {config.connectorArcOutward !== false ? 'Outward' : 'Inward'}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs block mb-1 text-green-400">Arc Curve</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={config.connectorArcHeight || 0.3}
                  onChange={(e) => updateConfig('connectorArcHeight', e.target.value)}
                  className="w-full accent-green-500"
                  disabled={config.connectorsEnabled === false}
                />
                <span className="text-xs text-green-300">{(config.connectorArcHeight || 0.3).toFixed(2)}</span>
              </div>
            </>
          )}

          <div>
            <label className="text-xs block mb-1 text-green-400">Wiggle Path</label>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={config.connectorWiggle === true}
                onChange={(e) => {
                  const isEnabled = e.target.checked;
                  updateConfig('connectorWiggle', isEnabled);
                  // Initialize values if they don't exist when enabling
                  if (isEnabled) {
                    if (typeof config.connectorWiggleAmplitude !== 'number' || isNaN(config.connectorWiggleAmplitude)) {
                      updateConfig('connectorWiggleAmplitude', 5);
                    }
                    if (typeof config.connectorWiggleFrequency !== 'number' || isNaN(config.connectorWiggleFrequency)) {
                      updateConfig('connectorWiggleFrequency', 2);
                    }
                    if (typeof config.connectorWiggleSpeed !== 'number' || isNaN(config.connectorWiggleSpeed)) {
                      updateConfig('connectorWiggleSpeed', 0.01);
                    }
                  }
                }}
                className="w-4 h-4 accent-green-500"
                disabled={config.connectorsEnabled === false}
              />
              <span className="text-xs text-green-300 ml-2">
                {config.connectorWiggle === true ? 'On' : 'Off'}
              </span>
            </div>
          </div>

          {config.connectorWiggle && (
            <>
              <div>
                <label className="text-xs block mb-1 text-green-400">Wiggle Amplitude</label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.5"
                  value={(() => {
                    const val = config.connectorWiggleAmplitude;
                    return (typeof val === 'number' && !isNaN(val)) ? val : 5;
                  })()}
                  onChange={(e) => updateConfig('connectorWiggleAmplitude', e.target.value)}
                  className="w-full accent-green-500"
                  disabled={config.connectorsEnabled === false || config.connectorWiggle !== true}
                />
                <span className="text-xs text-green-300">
                  {(() => {
                    const val = config.connectorWiggleAmplitude;
                    return ((typeof val === 'number' && !isNaN(val)) ? val : 5).toFixed(1);
                  })()}
                </span>
              </div>
              <div>
                <label className="text-xs block mb-1 text-green-400">Wiggle Frequency</label>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.1"
                  value={(() => {
                    const val = config.connectorWiggleFrequency;
                    return (typeof val === 'number' && !isNaN(val)) ? val : 2;
                  })()}
                  onChange={(e) => updateConfig('connectorWiggleFrequency', e.target.value)}
                  className="w-full accent-green-500"
                  disabled={config.connectorsEnabled === false || config.connectorWiggle !== true}
                />
                <span className="text-xs text-green-300">
                  {(() => {
                    const val = config.connectorWiggleFrequency;
                    return ((typeof val === 'number' && !isNaN(val)) ? val : 2).toFixed(1);
                  })()}
                </span>
              </div>
              <div>
                <label className="text-xs block mb-1 text-green-400">Wiggle Speed</label>
                <input
                  type="range"
                  min="0"
                  max="0.1"
                  step="0.001"
                  value={(() => {
                    const val = config.connectorWiggleSpeed;
                    return (typeof val === 'number' && !isNaN(val)) ? val : 0.01;
                  })()}
                  onChange={(e) => updateConfig('connectorWiggleSpeed', e.target.value)}
                  className="w-full accent-green-500"
                  disabled={config.connectorsEnabled === false || config.connectorWiggle !== true}
                />
                <span className="text-xs text-green-300">
                  {(() => {
                    const val = config.connectorWiggleSpeed;
                    return ((typeof val === 'number' && !isNaN(val)) ? val : 0.01).toFixed(3);
                  })()}
                </span>
              </div>
            </>
          )}

          <div>
            <label className="text-xs block mb-1 text-green-400">Min Distance</label>
            <input
              type="range"
              min="0"
              max="300"
              value={config.connectorMinDistance || 100}
              onChange={(e) => updateConfig('connectorMinDistance', e.target.value)}
              className="w-full accent-green-500"
              disabled={config.connectorsEnabled === false}
            />
            <span className="text-xs text-green-300">{config.connectorMinDistance || 100}</span>
          </div>

          <div>
            <label className="text-xs block mb-1 text-green-400">Max Distance</label>
            <input
              type="range"
              min="0"
              max="500"
              value={config.connectorMaxDistance || 200}
              onChange={(e) => updateConfig('connectorMaxDistance', e.target.value)}
              className="w-full accent-green-500"
              disabled={config.connectorsEnabled === false}
            />
            <span className="text-xs text-green-300">{config.connectorMaxDistance || 200}</span>
          </div>

          <div>
            <label className="text-xs block mb-1 text-green-400">Connector Color (Strokes)</label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="color"
                value={config.connectorColor || '#ffffff'}
                onChange={(e) => updateConfig('connectorColor', e.target.value)}
                className="w-10 h-8 rounded border border-gray-500 cursor-pointer"
                disabled={config.connectorsEnabled === false}
              />
              <input
                type="text"
                value={config.connectorColor || '#ffffff'}
                onChange={(e) => updateConfig('connectorColor', e.target.value)}
                className="flex-1 bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-500"
                placeholder="#ffffff"
                disabled={config.connectorsEnabled === false}
              />
            </div>
          </div>

          <div>
            <label className="text-xs block mb-1 text-green-400">Dot Color</label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="color"
                value={config.connectorDotColor || config.connectorColor || '#ffffff'}
                onChange={(e) => updateConfig('connectorDotColor', e.target.value)}
                className="w-10 h-8 rounded border border-gray-500 cursor-pointer"
                disabled={config.connectorsEnabled === false}
              />
              <input
                type="text"
                value={config.connectorDotColor || ''}
                onChange={(e) => updateConfig('connectorDotColor', e.target.value === '' ? null : e.target.value)}
                className="flex-1 bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-500"
                placeholder={config.connectorColor || '#ffffff'}
                disabled={config.connectorsEnabled === false}
              />
            </div>
            <span className="text-xs text-gray-400 italic">Leave empty to use stroke color</span>
          </div>

          <div>
            <label className="text-xs block mb-1 text-green-400">Line Width</label>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.1"
              value={config.connectorWidth || 1}
              onChange={(e) => updateConfig('connectorWidth', e.target.value)}
              className="w-full accent-green-500"
              disabled={config.connectorsEnabled === false}
            />
            <span className="text-xs text-green-300">{(config.connectorWidth || 1).toFixed(1)}</span>
          </div>

          <div>
            <label className="text-xs block mb-1 text-green-400">Line Style</label>
            <select
              value={config.connectorLineStyle || 'solid'}
              onChange={(e) => updateConfig('connectorLineStyle', e.target.value)}
              className="w-full bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-500"
              disabled={!config.connectorsEnabled}
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
              <option value="arrows">Arrows</option>
              <option value="arrows-large">Big Arrows</option>
            </select>
          </div>

          <div>
            <label className="text-xs block mb-1 text-green-400">Connector Blend Mode</label>
            <select
              value={config.connectorBlendMode || 'source-over'}
              onChange={(e) => updateConfig('connectorBlendMode', e.target.value)}
              className="w-full bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-500"
              disabled={!config.connectorsEnabled}
            >
              <option value="source-over">Normal (Source Over)</option>
              <option value="multiply">Multiply</option>
              <option value="screen">Screen</option>
              <option value="overlay">Overlay</option>
              <option value="darken">Darken</option>
              <option value="lighten">Lighten</option>
              <option value="color-dodge">Color Dodge</option>
              <option value="color-burn">Color Burn</option>
              <option value="hard-light">Hard Light</option>
              <option value="soft-light">Soft Light</option>
              <option value="difference">Difference</option>
              <option value="exclusion">Exclusion</option>
              <option value="hue">Hue</option>
              <option value="saturation">Saturation</option>
              <option value="color">Color</option>
              <option value="luminosity">Luminosity</option>
            </select>
          </div>

          <div>
            <label className="text-xs block mb-1 text-green-400">Opacity (Strokes)</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={config.connectorOpacity || 0.3}
              onChange={(e) => updateConfig('connectorOpacity', e.target.value)}
              className="w-full accent-green-500"
              disabled={config.connectorsEnabled === false}
            />
            <span className="text-xs text-green-300">{(config.connectorOpacity || 0.3).toFixed(2)}</span>
          </div>

          <div>
            <label className="text-xs block mb-1 text-green-400">Dot Opacity</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={config.connectorDotOpacity !== null && config.connectorDotOpacity !== undefined 
                ? config.connectorDotOpacity 
                : (config.connectorOpacity !== null && config.connectorOpacity !== undefined ? config.connectorOpacity : 1.0)}
              onChange={(e) => updateConfig('connectorDotOpacity', parseFloat(e.target.value))}
              className="w-full accent-green-500"
              disabled={config.connectorsEnabled === false}
            />
            <span className="text-xs text-green-300">
              {(config.connectorDotOpacity !== null && config.connectorDotOpacity !== undefined 
                ? config.connectorDotOpacity 
                : (config.connectorOpacity !== null && config.connectorOpacity !== undefined ? config.connectorOpacity : 1.0)).toFixed(2)}
            </span>
            <span className="text-xs text-gray-400 italic block mt-1">
              {config.connectorDotOpacity === null || config.connectorDotOpacity === undefined 
                ? '(Using stroke opacity)' 
                : ''}
            </span>
          </div>

          <div>
            <label className="text-xs block mb-1 text-green-400">Max Per Particle</label>
            <input
              type="range"
              min="1"
              max="20"
              value={config.connectorMaxPerParticle || 5}
              onChange={(e) => updateConfig('connectorMaxPerParticle', e.target.value)}
              className="w-full accent-green-500"
              disabled={config.connectorsEnabled === false}
            />
            <span className="text-xs text-green-300">{config.connectorMaxPerParticle || 5}</span>
          </div>

          <div>
            <label className="text-xs block mb-1 text-green-400">Max Total Connectors</label>
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={config.connectorMaxTotal || 100}
              onChange={(e) => updateConfig('connectorMaxTotal', e.target.value)}
              className="w-full accent-green-500"
              disabled={config.connectorsEnabled === false}
            />
            <span className="text-xs text-green-300">{config.connectorMaxTotal || 100}</span>
          </div>

          <div>
            <label className="text-xs block mb-1 text-green-400">Show Dots</label>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={config.connectorShowDots === true}
                onChange={(e) => updateConfig('connectorShowDots', e.target.checked)}
                className="w-4 h-4 accent-green-500"
                disabled={!config.connectorsEnabled}
              />
              <span className="text-xs text-green-300 ml-2">
                {config.connectorShowDots === true ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs block mb-1 text-green-400">Dot Size</label>
            <input
              type="range"
              min="0"
              max="20"
              step="0.5"
              value={Number(config.connectorDotSize) || 3}
              onChange={(e) => updateConfig('connectorDotSize', Number(e.target.value))}
              className="w-full accent-green-500"
              disabled={!config.connectorsEnabled || !config.connectorShowDots}
            />
            <span className="text-xs text-green-300">{(Number(config.connectorDotSize) || 3).toFixed(1)}</span>
          </div>

          {config.connectorShowDots && (
            <>
              <div>
                <label className="text-xs block mb-1 text-green-400">Dot Stroke Only</label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.connectorDotStrokeOnly === true}
                    onChange={(e) => updateConfig('connectorDotStrokeOnly', e.target.checked)}
                    className="w-4 h-4 accent-green-500"
                    disabled={!config.connectorsEnabled || config.connectorDotFillConnected === true}
                  />
                  <span className="text-xs text-green-300 ml-2">
                    {config.connectorDotStrokeOnly === true ? 'Stroke Only' : 'Filled'}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs block mb-1 text-green-400">Fill Connected Only</label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.connectorDotFillConnected === true}
                    onChange={(e) => updateConfig('connectorDotFillConnected', e.target.checked)}
                    className="w-4 h-4 accent-green-500"
                    disabled={!config.connectorsEnabled}
                  />
                  <span className="text-xs text-green-300 ml-2">
                    {config.connectorDotFillConnected === true ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="flex-1 w-full"
      />
    </div>
  );
};

export default CircularParticles;
