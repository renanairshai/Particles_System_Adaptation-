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
    particleOpacity: 0.23,
    bgParticleOpacity: 0.43,
    particleShape: 'circle',
    autoRotateShapes: true,
    glowRadius: 1,
    trailType: 'echo',
    streakColor: '#c8c8ff',
    blendMode: 'multiply',
    connectorsEnabled: true,
    connectorMinDistance: 100,
    connectorMaxDistance: 112,
    connectorColor: '#000000',
    connectorWidth: 0.5,
    connectorOpacity: 1.00,
    connectorMaxPerParticle: 5,
    connectorMaxTotal: 20,
    connectorArcMode: false,
    connectorArcOutward: true,
    connectorShowDots: false,
    connectorDotSize: 3
  });

  const [currentState, setCurrentState] = useState('gathering'); // 'gathering' | 'birth'
  const [divisionLevel, setDivisionLevel] = useState(0); // 0-7 for 8 levels
  const divisionProgressRef = useRef(0); // 0-1 for animation progress
  const divisionStartTimeRef = useRef(0);
  const isDividingRef = useRef(false); // Prevent multiple divisions at once
  const divisionDuration = 2000; // 2 seconds per division cycle
  const separationDistance = 100; // Distance particles move apart

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
          { position: 0.12076271186440678, color: '#0e3510', opacity: 1 },
          { position: 0.508628519527702, color: '#f9a4ed', opacity: 0 }
        ],
        [
          { position: 0, color: '#ffa200', opacity: 1 },
          { position: 0.3224341507720254, color: '#f4ff5c', opacity: 1 },
          { position: 1, color: '#FFFF99', opacity: 0 }
        ],
        [
          { position: 0, color: '#0d351c', opacity: 1 },
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
          { position: 0.12076271186440678, color: '#0e3510', opacity: 1 },
          { position: 0.508628519527702, color: '#f9a4ed', opacity: 0 }
        ],
        [
          { position: 0.17690677966101695, color: '#29496b', opacity: 1 },
          { position: 0.19809322033898305, color: '#356935', opacity: 1 },
          { position: 0.4555084745762712, color: '#5d745d', opacity: 0 }
        ],
        [
          { position: 0, color: '#0d351c', opacity: 1 },
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
          { position: 0.12076271186440678, color: '#0e3510', opacity: 1 },
          { position: 0.508628519527702, color: '#f9a4ed', opacity: 0 }
        ],
        [
          { position: 0.06779661016949153, color: '#638bb6', opacity: 1 },
          { position: 0.09322033898305085, color: '#28496b', opacity: 1 },
          { position: 0.1048728813559322, color: '#356935', opacity: 1 },
          { position: 0.4555084745762712, color: '#5d745d', opacity: 0 }
        ],
        [
          { position: 0, color: '#0d351c', opacity: 1 },
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
          { position: 0.11016949152542373, color: '#424242', opacity: 1 },
          { position: 0.24258474576271186, color: '#616161', opacity: 1 },
          { position: 0.670299727520436, color: '#9e9e9e', opacity: 0 }
        ],
        [
          { position: 0.09110169491525423, color: '#556812', opacity: 1 },
          { position: 0.12076271186440678, color: '#0e3510', opacity: 1 },
          { position: 0.508628519527702, color: '#f9a4ed', opacity: 0 }
        ],
        [
          { position: 0.06779661016949153, color: '#638bb6', opacity: 1 },
          { position: 0.09322033898305085, color: '#28496b', opacity: 1 },
          { position: 0.1048728813559322, color: '#356935', opacity: 1 },
          { position: 0.4555084745762712, color: '#5d745d', opacity: 0 }
        ],
        [
          { position: 0, color: '#0d351c', opacity: 1 },
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
        blendMode: 'multiply'
      },
      selectedColorSet: 'Color Set A',
      backgroundColor: '#ffffff'
    },
    'B': {
      config: {
        particleCount: 117,
        sphereRadius: 174,
        minRadius: 30,
        maxRadius: 80,
        rotationSpeedX: 0.003,
        rotationSpeedY: 0.006,
        pulseSpeed: 0.02,
        perspective: 1200,
        scatter: 64,
        breathingSpeedMin: 0,
        breathingSpeedMax: 0.0081,
        breathingAmountMin: 49,
        breathingAmountMax: 64,
        backgroundParticles: 270,
        blobDistortion: 0.3,
        bgDriftSpeedMin: 0.55,
        bgDriftSpeedMax: 0.51,
        bgMinSize: 13,
        bgMaxSize: 45,
        motionBlur: 1.68,
        motionBlurSteps: 28,
        particleOpacity: 0.34,
        bgParticleOpacity: 1,
        particleShape: 'circle',
        autoRotateShapes: true,
        glowRadius: 1,
        trailType: 'streak',
        streakColor: '#d1e9ff',
        blendMode: 'soft-light'
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
    }
  };

  const [selectedColorSet, setSelectedColorSet] = useState('Color Set A');
  const [showGradientEditor, setShowGradientEditor] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [selectedPreset, setSelectedPreset] = useState('Default');
  
  // Convert old format (colorPalette + gradientStops) to new format (gradientStops with colors)
  const convertToNewFormat = (colorSet) => {
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
      return colorSet.gradientStops.map(gradient => 
        gradient.map(stop => ({ ...stop }))
      );
    }
    
    // Old format: convert colorPalette + gradientStops to new format
    const colorPalette = colorSet.colorPalette;
    const gradientStops = colorSet.gradientStops;
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
    return convertToNewFormat(currentSet);
  });
  
  // Update editable gradients when color set changes
  useEffect(() => {
    const currentSet = colorSets[selectedColorSet];
    setEditableGradients(convertToNewFormat(currentSet));
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
    const gradientStopsArray = editableGradients;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

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
          const colorWithOpacity = stop.opacity < 1 
            ? stop.color + Math.round(stop.opacity * 255).toString(16).padStart(2, '0')
            : stop.color;
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
        const glowMult = config.glowRadius || 1;
        const reversedStops = [...sortedStops].reverse();
        const glowLayers = reversedStops.map((stop, index) => {
          const scaleFactor = 1 + (reversedStops.length - index) * 0.5 * glowMult;
          const blurFactor = (reversedStops.length - index) * 60 * glowMult;
          return {
            blur: blurFactor,
            color: stop.color,
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
        offCtx.shadowColor = firstStop.color;
        offCtx.shadowBlur = 6;
        offCtx.fillStyle = firstStop.color;
        offCtx.strokeStyle = firstStop.color;
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
        this.baseX = cfg.sphereRadius * this.unitX;
        this.baseY = cfg.sphereRadius * this.unitY;
        this.baseZ = cfg.sphereRadius * this.unitZ;
        
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

      rotate(angleX, angleY, cfg, canvasWidth, canvasHeight) {
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
        
        // Store position in history for echo effect
        if (cfg.motionBlur > 0) {
          const maxHistory = cfg.motionBlurSteps;
          this.positionHistory.push({
            x: this.x2d,
            y: this.y2d,
            radius: this.currentRadius
          });
          // Trim to max length
          while (this.positionHistory.length > maxHistory) {
            this.positionHistory.shift();
          }
        } else if (this.positionHistory.length > 0) {
          this.positionHistory.length = 0;
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
            
            ctx.save();
            ctx.translate(this.x2d, this.y2d);
            if (shouldRotate) {
              ctx.rotate(rotationToUse);
            }
            
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
            
            ctx.restore();
          } else {
            // Normal drawing after transition
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
        } else {
          // Normal drawing
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
          this.positionHistory.push({
            x: this.x2d,
            y: this.y2d,
            radius: this.currentRadius
          });
          while (this.positionHistory.length > maxHistory) {
            this.positionHistory.shift();
          }
        } else if (this.positionHistory.length > 0) {
          this.positionHistory.length = 0;
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
        
        // Draw main particle using cached image
        const size = this.currentRadius * 2;
        ctx.globalAlpha = finalOpacity;
        if (shouldRotate) {
          ctx.save();
          ctx.translate(this.x2d, this.y2d);
          ctx.rotate(rotationToUse);
          ctx.drawImage(cache, -size/2, -size/2, size, size);
          ctx.restore();
        } else {
          ctx.drawImage(cache, this.x2d - size/2, this.y2d - size/2, size, size);
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

    // Draw connectors between particles within distance range
    const drawConnectors = (ctx, particles, cfg) => {
      if (!cfg.connectorsEnabled) return;
      
      ctx.save();
      ctx.strokeStyle = cfg.connectorColor || '#ffffff';
      ctx.lineWidth = cfg.connectorWidth || 1;
      ctx.globalAlpha = cfg.connectorOpacity || 0.3;
      ctx.globalCompositeOperation = 'source-over';
      
      const minDist = cfg.connectorMinDistance || 100;
      const maxDist = cfg.connectorMaxDistance || 200;
      const maxPerParticle = cfg.connectorMaxPerParticle || Infinity;
      const maxTotal = cfg.connectorMaxTotal || Infinity;
      
      // Get or initialize active connections map
      let activeConnections = activeConnectionsRef.current;
      
      // Track current frame's connections per particle
      const connectionsPerParticle = new Map();
      let totalConnectionsDrawn = 0;
      const newActiveConnections = new Map();
      
      // First, validate existing connections and keep valid ones
      for (const [key, conn] of activeConnections.entries()) {
        const p1 = conn.p1;
        const p2 = conn.p2;
        
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
            // Draw the persistent connection
            ctx.beginPath();
            if (cfg.connectorArcMode) {
              // Draw as arc using quadratic bezier curve
              const midX = (p1.x2d + p2.x2d) / 2;
              const midY = (p1.y2d + p2.y2d) / 2;
              const dx = p2.x2d - p1.x2d;
              const dy = p2.y2d - p1.y2d;
              const distance = Math.sqrt(dx * dx + dy * dy);
              // Control point perpendicular to the line, creating an arc
              const arcHeight = distance * 0.3; // Adjust arc height
              const direction = cfg.connectorArcOutward !== false ? 1 : -1; // 1 for outward, -1 for inward
              const controlX = midX + (-dy / distance) * arcHeight * direction;
              const controlY = midY + (dx / distance) * arcHeight * direction;
              ctx.moveTo(p1.x2d, p1.y2d);
              ctx.quadraticCurveTo(controlX, controlY, p2.x2d, p2.y2d);
            } else {
              ctx.moveTo(p1.x2d, p1.y2d);
              ctx.lineTo(p2.x2d, p2.y2d);
            }
            ctx.stroke();
            
            // Draw dots at connector tips if enabled
            if (cfg.connectorShowDots) {
              const dotSize = Number(cfg.connectorDotSize) || 3;
              const savedAlpha = ctx.globalAlpha;
              ctx.fillStyle = cfg.connectorColor || '#000000';
              ctx.globalAlpha = 1.0; // Use full opacity for dots to make them visible
              ctx.beginPath();
              ctx.arc(p1.x2d, p1.y2d, dotSize / 2, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(p2.x2d, p2.y2d, dotSize / 2, 0, Math.PI * 2);
              ctx.fill();
              ctx.globalAlpha = savedAlpha; // Restore previous alpha
            }
            
            // Track this connection
            connectionsPerParticle.set(p1, count1 + 1);
            connectionsPerParticle.set(p2, count2 + 1);
            totalConnectionsDrawn++;
            
            // Keep in new active connections
            newActiveConnections.set(key, { p1, p2, distance });
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
          ctx.beginPath();
          if (cfg.connectorArcMode) {
            // Draw as arc using quadratic bezier curve
            const midX = (conn.p1.x2d + conn.p2.x2d) / 2;
            const midY = (conn.p1.y2d + conn.p2.y2d) / 2;
            const dx = conn.p2.x2d - conn.p1.x2d;
            const dy = conn.p2.y2d - conn.p1.y2d;
            const distance = Math.sqrt(dx * dx + dy * dy);
            // Control point perpendicular to the line, creating an arc
            const arcHeight = distance * 0.3; // Adjust arc height
            const direction = cfg.connectorArcOutward !== false ? 1 : -1; // 1 for outward, -1 for inward
            const controlX = midX + (-dy / distance) * arcHeight * direction;
            const controlY = midY + (dx / distance) * arcHeight * direction;
            ctx.moveTo(conn.p1.x2d, conn.p1.y2d);
            ctx.quadraticCurveTo(controlX, controlY, conn.p2.x2d, conn.p2.y2d);
          } else {
            ctx.moveTo(conn.p1.x2d, conn.p1.y2d);
            ctx.lineTo(conn.p2.x2d, conn.p2.y2d);
          }
          ctx.stroke();
          
          // Draw dots at connector tips if enabled
          if (cfg.connectorShowDots) {
            const dotSize = Number(cfg.connectorDotSize) || 3;
            const savedAlpha = ctx.globalAlpha;
            ctx.fillStyle = cfg.connectorColor || '#000000';
            ctx.globalAlpha = 1.0; // Use full opacity for dots to make them visible
            ctx.beginPath();
            ctx.arc(conn.p1.x2d, conn.p1.y2d, dotSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(conn.p2.x2d, conn.p2.y2d, dotSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = savedAlpha; // Restore previous alpha
          }
          
          // Track this connection
          connectionsPerParticle.set(conn.p1, count1 + 1);
          connectionsPerParticle.set(conn.p2, count2 + 1);
          totalConnectionsDrawn++;
          
          // Add to new active connections
          newActiveConnections.set(conn.key, { p1: conn.p1, p2: conn.p2, distance: conn.distance });
        }
      }
      
      // Update active connections for next frame
      activeConnectionsRef.current = newActiveConnections;
      
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
          } else if (currentStateRef.current === 'gathering') {
            // Transition to Gathering: restore normal particle distribution
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
        
        // Check if we need to recreate particles (only when counts change and in gathering state)
        if (currentStateRef.current === 'gathering') {
          if (particlesRef.current.length !== cfg.particleCount) {
            particlesRef.current = Array.from({ length: cfg.particleCount }, (_, i) => new Particle(i, cfg));
          }
        }
        if (bgParticlesRef.current.length !== cfg.backgroundParticles) {
          bgParticlesRef.current = Array.from({ length: cfg.backgroundParticles }, () => new BackgroundParticle(cfg));
        }
        
        // Only update particles when config actually changes
        const lastCfg = lastConfigRef.current;
        if (!lastCfg || 
            lastCfg.sphereRadius !== cfg.sphereRadius ||
            lastCfg.scatter !== cfg.scatter ||
            lastCfg.minRadius !== cfg.minRadius ||
            lastCfg.maxRadius !== cfg.maxRadius ||
            lastCfg.breathingSpeedMin !== cfg.breathingSpeedMin ||
            lastCfg.breathingSpeedMax !== cfg.breathingSpeedMax ||
            lastCfg.breathingAmountMin !== cfg.breathingAmountMin ||
            lastCfg.breathingAmountMax !== cfg.breathingAmountMax) {
          particlesRef.current.forEach(particle => particle.updateFromConfig(cfg));
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
        angleXRef.current += cfg.rotationSpeedX;
        angleYRef.current += cfg.rotationSpeedY;

        // Skip background particles in Birth state
        if (currentStateRef.current !== 'birth') {
          bgParticlesRef.current.forEach(particle => {
            particle.update(cfg);
            particle.rotate(cfg, canvas.width, canvas.height);
          });
        }

        particlesRef.current.forEach(particle => {
          particle.updatePosition(cfg, currentStateRef.current, divisionProgressRef.current, timeRef.current, Date.now());
          particle.rotate(angleXRef.current, angleYRef.current, cfg, canvas.width, canvas.height);
        });
        
        // Update particle sizes with metaball effect (after positions and rotations are set)
        const currentTime = Date.now();
        particlesRef.current.forEach(particle => {
          particle.update(timeRef.current, cfg, currentStateRef.current, particlesRef.current, divisionProgressRef.current, currentTime);
        });

        // Draw connectors between particles within distance range
        drawConnectors(ctx, particlesRef.current, cfg);

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
        
        const visibleCount = allParticles.filter(p => 
          p.x2d >= 0 && p.x2d <= canvas.width && 
          p.y2d >= 0 && p.y2d <= canvas.height &&
          p.currentRadius > 0
        ).length;
        
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'black';
        ctx.font = '12px monospace';
        ctx.fillText(`Frame: ${timeRef.current} Visible: ${visibleCount}/${allParticles.length}`, 10, 20);
      } catch (error) {
        console.error('Animation error:', error);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, [selectedColorSet, editableGradients, backgroundColor]); // Re-run when color set, gradients, or background color change

  // Update state refs when state changes
  useEffect(() => {
    currentStateRef.current = currentState;
  }, [currentState]);

  useEffect(() => {
    divisionLevelRef.current = divisionLevel;
  }, [divisionLevel]);

  const updateConfig = (key, value) => {
    // Handle string values (like trailType, streakColor, blendMode, connectorColor) vs numeric values vs boolean values
    const stringKeys = ['trailType', 'streakColor', 'blendMode', 'connectorColor'];
    const booleanKeys = ['autoRotateShapes', 'connectorsEnabled', 'connectorArcMode', 'connectorArcOutward', 'connectorShowDots'];
    let newValue;
    if (stringKeys.includes(key)) {
      newValue = value;
    } else if (booleanKeys.includes(key)) {
      newValue = value;
    } else {
      newValue = parseFloat(value);
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
      connectorShowDots: config.connectorShowDots,
      connectorDotSize: config.connectorDotSize
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

  const copyAllParams = () => {
    const currentColorSet = colorSets[selectedColorSet];
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
              <label className="text-xs">Color Set:</label>
              <select
                value={selectedColorSet}
                onChange={(e) => setSelectedColorSet(e.target.value)}
                className="bg-gray-700 text-white text-xs px-2 py-1 rounded"
              >
                {Object.keys(colorSets).map((setName) => (
                  <option key={setName} value={setName}>
                    {setName}
                  </option>
                ))}
              </select>
            </div>
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
                
                return (
                  <div key={gradientIndex} className="p-3 bg-gray-700 rounded border border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-white">Gradient {gradientIndex + 1}</h4>
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
              min="30"
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
              max="80"
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
            <label className="text-xs block mb-1 text-green-400">Connector Color</label>
            <div className="flex items-center gap-2">
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
            <label className="text-xs block mb-1 text-green-400">Opacity</label>
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
              min="1"
              max="10"
              step="0.5"
              value={Number(config.connectorDotSize) || 3}
              onChange={(e) => updateConfig('connectorDotSize', Number(e.target.value))}
              className="w-full accent-green-500"
              disabled={!config.connectorsEnabled || !config.connectorShowDots}
            />
            <span className="text-xs text-green-300">{(Number(config.connectorDotSize) || 3).toFixed(1)}</span>
          </div>
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
