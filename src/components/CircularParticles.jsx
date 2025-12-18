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
  const isFrozenRef = useRef(false);
  const currentStateRef = useRef('gathering');
  const divisionLevelRef = useRef(0);
  const lastStateRef = useRef('gathering');
  
  const [config, setConfig] = useState({
    particleCount: 150,
    sphereRadius: 171,
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
    glowRadius: 1
  });

  const [isFrozen, setIsFrozen] = useState(false);
  const [currentState, setCurrentState] = useState('gathering'); // 'gathering' | 'birth'
  const [divisionLevel, setDivisionLevel] = useState(0); // 0-7 for 8 levels
  const divisionProgressRef = useRef(0); // 0-1 for animation progress
  const divisionStartTimeRef = useRef(0);
  const isDividingRef = useRef(false); // Prevent multiple divisions at once
  const divisionDuration = 2000; // 2 seconds per division cycle
  const separationDistance = 100; // Distance particles move apart

  const colorPalette = [
    ['#050a2e', '#004466', '#b8edff'],
    ['#0e3510', '#556812', '#f9a4ed'],
    ['#ffa200', '#f4ff5c', '#FFFF99'],
    ['#0d351c', '#5d6303', '#DDA0DD'],
    ['#992900', '#ffe747', '#fffef5'],
    ['#2e2905', '#8eecd9', '#B0E0E6'],
    ['#0a4461', '#ffccf4', '#ffccf4'],
    ['#610000', '#ff7300', '#FFFF00']
  ];

  const gradientStops = [
    { stop1: 0, stop2: 0.27520435967302453, stop3: 0.670299727520436 },
    { stop1: 0, stop2: 0.1, stop3: 0.508628519527702 },
    { stop1: 0, stop2: 0.3224341507720254, stop3: 1 },
    { stop1: 0, stop2: 0.18528610354223432, stop3: 0.5 },
    { stop1: 0, stop2: 0.3478655767484105, stop3: 1 },
    { stop1: 0, stop2: 0.1880108991825613, stop3: 0.5367847411444142 },
    { stop1: 0.1008174386920981, stop2: 0.3832879200726612, stop3: 0.6584922797456857 },
    { stop1: 0, stop2: 0.2710997442455243, stop3: 0.7148337595907929 }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];
    let backgroundParticles = [];
    let currentConfig = { ...config };

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Pre-render gradient blobs to offscreen canvases for performance
    const createShapeCache = (colors, stops, shape) => {
      const size = shape === 'circle' ? 128 : 1024;
      const offscreen = document.createElement('canvas');
      offscreen.width = size;
      offscreen.height = size;
      const offCtx = offscreen.getContext('2d');
      
      const cx = size / 2;
      const cy = size / 2;
      const r = size / 2;
      
      if (shape === 'circle') {
        // Circle keeps the original gradient fill behavior
        const gradient = offCtx.createRadialGradient(cx, cy, 0, cx, cy, r);
        gradient.addColorStop(stops.stop1, colors[0]);
        gradient.addColorStop(stops.stop2, colors[1]);
        gradient.addColorStop(stops.stop3, colors[2] + '00');
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
        
        // Draw multiple glow layers using gradient colors and stops
        const glowMult = config.glowRadius || 1;
        const glowLayers = [
          { blur: 180 * glowMult, color: colors[2], opacity: stops.stop3, scale: 1 + 2.0 * glowMult },
          { blur: 120 * glowMult, color: colors[1], opacity: stops.stop2, scale: 1 + 1.2 * glowMult },
          { blur: 60 * glowMult, color: colors[0], opacity: stops.stop1 + 0.3, scale: 1 + 0.4 * glowMult }
        ];
        
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
        
        // Draw the solid shape on top with feathered edge
        offCtx.save();
        offCtx.shadowColor = colors[0];
        offCtx.shadowBlur = 6;
        offCtx.fillStyle = colors[0];
        offCtx.strokeStyle = colors[0];
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
    
    // Helper function to interpolate between two color palettes
    const interpolatePalette = (palette1, palette2, stops1, stops2, t) => {
      const interpolatedColors = palette1.map((color, i) => 
        interpolateColor(color, palette2[i], t)
      );
      const interpolatedStops = {
        stop1: stops1.stop1 + (stops2.stop1 - stops1.stop1) * t,
        stop2: stops1.stop2 + (stops2.stop2 - stops1.stop2) * t,
        stop3: stops1.stop3 + (stops2.stop3 - stops1.stop3) * t
      };
      return { colors: interpolatedColors, stops: interpolatedStops };
    };
    
    // Create caches for all shapes and color palettes
    const shapeTypes = ['circle', 'x', 'torus', 'triangle', 'square'];
    const gradientCache = {};
    shapeTypes.forEach(shape => {
      gradientCache[shape] = colorPalette.map((colors, index) => {
        return createShapeCache(colors, gradientStops[index], shape);
      });
    });
    
    // Create intermediate gradient caches for smooth color transitions
    const createIntermediateCache = (shape, fromIndex, toIndex, t) => {
      // Clamp t between 0 and 1
      const clampedT = Math.max(0, Math.min(1, t));
      
      // If at boundaries, return the exact color
      if (clampedT <= 0) {
        return gradientCache[shape][fromIndex];
      }
      if (clampedT >= 1) {
        return gradientCache[shape][toIndex];
      }
      
      // Interpolate between the two color palettes
      const fromColors = colorPalette[fromIndex];
      const toColors = colorPalette[toIndex];
      const fromStops = gradientStops[fromIndex];
      const toStops = gradientStops[toIndex];
      const interpolated = interpolatePalette(fromColors, toColors, fromStops, toStops, clampedT);
      return createShapeCache(interpolated.colors, interpolated.stops, shape);
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
        
        this.colorSetIndex = Math.floor(Math.random() * colorPalette.length);
        this.colorSet = colorPalette[this.colorSetIndex];
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
      
      updatePosition(cfg, state, divisionProgress, time) {
        if (state === 'birth' && this.isDividing) {
          // Apply both timing offset and staggered delay for organic feel
          const offsetProgress = Math.max(0, divisionProgress - this.divisionTimeOffset);
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

      update(time, cfg, state, allParticles, divisionProgress) {
        const pulse = Math.sin(time * cfg.pulseSpeed + this.pulseOffset);
        let baseRadius = this.baseRadius * this.scale + pulse * 3 * this.scale;
        
        // Metaball effect: merge with sibling when close
        if (state === 'birth' && this.siblingId !== null && allParticles) {
          const sibling = allParticles.find(p => p.index === this.siblingId);
          if (sibling) {
            const dx = this.x3d - sibling.x3d;
            const dy = this.y3d - sibling.y3d;
            const dz = this.z3d - sibling.z3d;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            const mergeDistance = this.baseRadius * 4; // Distance at which merging starts
            const mergeStrength = Math.max(0, 1 - (distance / mergeDistance));
            
            // Increase size when merging (metaball effect)
            const mergeBoost = mergeStrength * this.baseRadius * 0.8;
            baseRadius += mergeBoost * this.scale;
          }
        }
        
        // Fade out parent particles as children separate (if this particle has children dividing)
        if (state === 'birth' && !this.isDividing && divisionProgress !== undefined) {
          // Check if any particles have this as parent
          const hasDividingChildren = allParticles && allParticles.some(p => 
            p.parentId === this.index && p.isDividing
          );
          if (hasDividingChildren) {
            // Shrink parent as children separate
            const fadeOut = Math.min(1, divisionProgress * 2); // Fade out in first half of division
            baseRadius *= (1 - fadeOut * 0.9); // Shrink to 10% of original size
          }
        }
        
        this.currentRadius = Math.max(1, baseRadius);
      }

      draw(ctx, cfg, time, state, allParticles, divisionProgress) {
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
        if (state === 'birth' && !this.isDividing && divisionProgress !== undefined) {
          const hasDividingChildren = allParticles && allParticles.some(p => 
            p.parentId === this.index && p.isDividing
          );
          if (hasDividingChildren) {
            const fadeOut = Math.min(1, divisionProgress * 2); // Fade out in first half
            finalOpacity *= (1 - fadeOut); // Fade to transparent
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
        
        // Transition color during division - very soft and gradual with smoother steps
        if (state === 'birth' && this.isDividing && this.targetColorIndex !== null && divisionProgress !== undefined) {
          // Calculate color transition based on division progress
          // Very gradual transition from start to near end of division
          const transitionStart = 0.0; // Start immediately when division begins
          const transitionEnd = 0.98; // Complete by 98% of division (ultra gradual)
          
          if (divisionProgress > transitionStart) {
            const transitionProgress = Math.min(1, (divisionProgress - transitionStart) / (transitionEnd - transitionStart));
            // Smootherstep - even smoother than smoothstep for ultra-smooth transition
            const easedProgress = transitionProgress * transitionProgress * transitionProgress * (transitionProgress * (transitionProgress * 6 - 15) + 10);
            
            // Update color index for smooth transition
            if (easedProgress > 0.5) {
              // Switch to target color halfway through transition
              currentColorIndex = this.targetColorIndex;
              this.colorSetIndex = this.targetColorIndex;
              this.colorSet = colorPalette[this.targetColorIndex];
            }
            
            targetCache = gradientCache[cfg.particleShape || 'circle'][currentColorIndex];
          }
        }
        
        const cache = targetCache;
        const shouldRotate = cfg.autoRotateShapes && cfg.particleShape !== 'circle';
        const rotationToUse = cfg.particleShape === 'triangle' ? this.movementAngle : this.rotation;
        
        // Draw echo/ghost trails using cached image
        if (cfg.motionBlur > 0 && this.positionHistory.length > 0) {
          for (let i = 0; i < this.positionHistory.length; i++) {
            const pos = this.positionHistory[i];
            const fadeAmount = (i + 1) / this.positionHistory.length;
            const echoOpacity = fadeAmount * cfg.motionBlur * finalOpacity;
            
            const size = pos.radius * 2;
            ctx.globalAlpha = echoOpacity;
            if (shouldRotate) {
              ctx.save();
              ctx.translate(pos.x, pos.y);
              const trailRotation = cfg.particleShape === 'triangle' 
                ? rotationToUse 
                : rotationToUse - this.rotationSpeed * (this.positionHistory.length - i);
              ctx.rotate(trailRotation);
              ctx.drawImage(cache, -size/2, -size/2, size, size);
              ctx.restore();
            } else {
              ctx.drawImage(cache, pos.x - size/2, pos.y - size/2, size, size);
            }
          }
        }
        
        // Draw main particle
        const size = this.currentRadius * 2;
        ctx.globalAlpha = finalOpacity;
        
        // If transitioning colors, smoothly interpolate through color space
        if (state === 'birth' && this.isDividing && this.targetColorIndex !== null && this.originalColorIndex !== null && divisionProgress !== undefined) {
          // Apply timing offset for organic feel
          const offsetProgress = Math.max(0, divisionProgress - this.divisionTimeOffset);
          
          const transitionStart = 0.0; // Start immediately
          const transitionEnd = 0.98; // Complete by 98% (ultra gradual)
          
          if (offsetProgress >= transitionStart && offsetProgress <= transitionEnd) {
            const transitionProgress = (offsetProgress - transitionStart) / (transitionEnd - transitionStart);
            // Ultra-smooth easing for gradual color interpolation
            const easedProgress = transitionProgress * transitionProgress * transitionProgress * (transitionProgress * (transitionProgress * 6 - 15) + 10);
            
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
        this.colorSetIndex = Math.floor(Math.random() * colorPalette.length);
        this.colorSet = colorPalette[this.colorSetIndex];
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
        
        // Draw echo/ghost trails using cached image
        if (cfg.motionBlur > 0 && this.positionHistory.length > 0) {
          for (let i = 0; i < this.positionHistory.length; i++) {
            const pos = this.positionHistory[i];
            const fadeAmount = (i + 1) / this.positionHistory.length;
            const echoOpacity = fadeAmount * cfg.motionBlur * finalOpacity;
            
            const size = pos.radius * 2;
            ctx.globalAlpha = echoOpacity;
            if (shouldRotate) {
              ctx.save();
              ctx.translate(pos.x, pos.y);
              const trailRotation = cfg.particleShape === 'triangle' 
                ? rotationToUse 
                : rotationToUse - this.rotationSpeed * (this.positionHistory.length - i);
              ctx.rotate(trailRotation);
              ctx.drawImage(cache, -size/2, -size/2, size, size);
              ctx.restore();
            } else {
              ctx.drawImage(cache, pos.x - size/2, pos.y - size/2, size, size);
            }
          }
        }
        
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
        // Generate random separation direction with more organic variation
        const dirX = (Math.random() - 0.5) * 2;
        const dirY = (Math.random() - 0.5) * 2;
        const dirZ = (Math.random() - 0.5) * 2;
        const dirMag = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
        const unitX = dirX / dirMag;
        const unitY = dirY / dirMag;
        const unitZ = dirZ / dirMag;
        
        // Create two child particles that start merged
        const child1 = new Particle(particlesRef.current.length + newParticles.length, cfg);
        const child2 = new Particle(particlesRef.current.length + newParticles.length + 1, cfg);
        
        // Link them as siblings for metaball effect
        child1.siblingId = child2.index;
        child2.siblingId = child1.index;
        
        // Assign random colors for more variety
        let newColorIndex1, newColorIndex2;
        if (colorPalette.length > 1) {
          // Randomly select colors, ensuring they're different from each other
          do {
            newColorIndex1 = Math.floor(Math.random() * colorPalette.length);
          } while (newColorIndex1 === parent.colorSetIndex && colorPalette.length > 2);
          
          do {
            newColorIndex2 = Math.floor(Math.random() * colorPalette.length);
          } while ((newColorIndex2 === parent.colorSetIndex || newColorIndex2 === newColorIndex1) && colorPalette.length > 2);
        } else {
          newColorIndex1 = 0;
          newColorIndex2 = 0;
        }
        
        // Store original (parent) color and target colors for smooth transition
        child1.originalColorIndex = parent.colorSetIndex;
        child1.targetColorIndex = newColorIndex1;
        child1.colorSetIndex = parent.colorSetIndex; // Start with parent's color
        child1.colorSet = colorPalette[parent.colorSetIndex];
        
        child2.originalColorIndex = parent.colorSetIndex;
        child2.targetColorIndex = newColorIndex2;
        child2.colorSetIndex = parent.colorSetIndex; // Start with parent's color
        child2.colorSet = colorPalette[parent.colorSetIndex];
        
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
        
        // Random timing offset for organic division start (0 to 0.4 of division duration)
        child1.divisionTimeOffset = Math.random() * 0.4;
        child2.divisionTimeOffset = Math.random() * 0.4;
        
        // Staggered start time for organic feel (0 to 0.2 delay) - kept for position animation
        child1.divisionDelay = Math.random() * 0.2;
        child2.divisionDelay = Math.random() * 0.2;
        
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
        
        // Variable separation distance for organic variation (80% to 120% of base)
        const distanceVariation1 = 0.8 + Math.random() * 0.4;
        const distanceVariation2 = 0.8 + Math.random() * 0.4;
        const individualSeparation1 = separationDistance * distanceVariation1;
        const individualSeparation2 = separationDistance * distanceVariation2;
        child1.separationDistance = individualSeparation1;
        child2.separationDistance = individualSeparation2;
        
        // Target position (opposite directions for the two children)
        child1.targetX = parent.x3d + unitX * individualSeparation1;
        child1.targetY = parent.y3d + unitY * individualSeparation1;
        child1.targetZ = parent.z3d + unitZ * individualSeparation1;
        
        child2.targetX = parent.x3d - unitX * individualSeparation2;
        child2.targetY = parent.y3d - unitY * individualSeparation2;
        child2.targetZ = parent.z3d - unitZ * individualSeparation2;
        
        // Orbital motion properties for curved paths
        child1.orbitalPhase = Math.random() * Math.PI * 2;
        child1.orbitalRadius = 15 + Math.random() * 25;
        child1.rotationPhase = Math.random() * Math.PI * 2;
        
        child2.orbitalPhase = Math.random() * Math.PI * 2;
        child2.orbitalRadius = 15 + Math.random() * 25;
        child2.rotationPhase = Math.random() * Math.PI * 2;
        
        // Store direction for orbital calculations
        child1.divisionDirection = { x: unitX, y: unitY, z: unitZ };
        child2.divisionDirection = { x: -unitX, y: -unitY, z: -unitZ };
        
        newParticles.push(child1, child2);
      });
      
      // Clear pre-dividing flags from old particles
      particlesToDivide.forEach(parent => {
        parent.isPreDividing = false;
        parent.splitColorIndex = null;
      });
      
      // Replace old particles with new divided ones
      particlesRef.current = newParticles;
      divisionLevelRef.current = currentLevel + 1;
      divisionProgressRef.current = 0;
      divisionStartTimeRef.current = Date.now();
      setDivisionLevel(currentLevel + 1);
      isDividingRef.current = false;
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
        if (currentStateRef.current === 'birth' && !isFrozenRef.current) {
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
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Only update animation values if not frozen
        if (!isFrozenRef.current) {
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
            particle.updatePosition(cfg, currentStateRef.current, divisionProgressRef.current, timeRef.current);
            particle.rotate(angleXRef.current, angleYRef.current, cfg, canvas.width, canvas.height);
          });
          
          // Update particle sizes with metaball effect (after positions and rotations are set)
          particlesRef.current.forEach(particle => {
            particle.update(timeRef.current, cfg, currentStateRef.current, particlesRef.current, divisionProgressRef.current);
          });
        } else {
          // When frozen, still need to rotate particles to their current positions for rendering
          // Skip background particles in Birth state
          if (currentStateRef.current !== 'birth') {
            bgParticlesRef.current.forEach(particle => {
              particle.rotate(cfg, canvas.width, canvas.height);
            });
          }

          particlesRef.current.forEach(particle => {
            particle.rotate(angleXRef.current, angleYRef.current, cfg, canvas.width, canvas.height);
          });
        }

        // Reuse array to reduce GC pressure - exclude background particles in Birth state
        const allParticles = currentStateRef.current === 'birth' 
          ? [...particlesRef.current]
          : bgParticlesRef.current.concat(particlesRef.current);
        allParticles.sort((a, b) => a.depth - b.depth);

        ctx.globalCompositeOperation = 'multiply';
        
        allParticles.forEach(particle => {
          if (particle.currentRadius > 0) {
            particle.draw(ctx, cfg, timeRef.current, currentStateRef.current, particlesRef.current, divisionProgressRef.current);
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
  }, []); // Empty dependency - runs once on mount

  // Update frozen ref when state changes
  useEffect(() => {
    isFrozenRef.current = isFrozen;
  }, [isFrozen]);

  // Update state refs when state changes
  useEffect(() => {
    currentStateRef.current = currentState;
  }, [currentState]);

  useEffect(() => {
    divisionLevelRef.current = divisionLevel;
  }, [divisionLevel]);

  const updateConfig = (key, value) => {
    const newValue = parseFloat(value);
    // Update ref immediately for smooth animation
    if (configRef.current) {
      configRef.current = { ...configRef.current, [key]: newValue };
    }
    // Update state for UI display
    setConfig(prev => ({ ...prev, [key]: newValue }));
  };

  const copyAllParams = () => {
    const params = {
      config: config,
      colorPalette: colorPalette,
      gradientStops: gradientStops
    };
    
    navigator.clipboard.writeText(JSON.stringify(params, null, 2)).then(() => {
      alert('All parameters copied to clipboard!');
    });
  };

  return (
    <div className="w-full h-screen bg-white flex flex-col">
      <div className="bg-gray-900 text-white pt-4 pb-4 px-4 overflow-y-auto max-h-64">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">3D Sphere Particle System</h2>
          <div className="flex items-center gap-4">
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
            <div className="flex items-center gap-2">
              <label className="text-xs">Particle Shape:</label>
              <select
                value={config.particleShape}
                onChange={(e) => {
                  const newShape = e.target.value;
                  if (configRef.current) {
                    configRef.current = { ...configRef.current, particleShape: newShape };
                  }
                  setConfig(prev => ({ ...prev, particleShape: newShape }));
                }}
                className="bg-gray-700 text-white text-xs px-2 py-1 rounded"
              >
                <option value="circle">Circle</option>
                <option value="x">X Shape</option>
                <option value="torus">Torus</option>
                <option value="triangle">Triangle</option>
                <option value="square">Square</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs">Auto Rotate:</label>
              <input
                type="checkbox"
                checked={config.autoRotateShapes}
                onChange={(e) => {
                  const newVal = e.target.checked;
                  if (configRef.current) {
                    configRef.current = { ...configRef.current, autoRotateShapes: newVal };
                  }
                  setConfig(prev => ({ ...prev, autoRotateShapes: newVal }));
                }}
                className="w-4 h-4"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs">Freeze Animation:</label>
              <input
                type="checkbox"
                checked={isFrozen}
                onChange={(e) => setIsFrozen(e.target.checked)}
                className="w-4 h-4"
              />
            </div>
            <button
              onClick={copyAllParams}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs"
            >
              Copy All Parameters
            </button>
          </div>
        </div>
        
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
              min="100"
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
            <label className="text-xs block mb-1 text-orange-400">Echo Amount</label>
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
            <label className="text-xs block mb-1 text-orange-400">Echo Length (frames)</label>
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

          <div>
            <label className="text-xs block mb-1 text-pink-400">Glow Radius</label>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={config.glowRadius}
              onChange={(e) => updateConfig('glowRadius', e.target.value)}
              className="w-full accent-pink-500"
            />
            <span className="text-xs text-pink-300">{config.glowRadius.toFixed(1)}</span>
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
