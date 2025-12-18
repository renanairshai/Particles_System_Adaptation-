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
    
    // Create caches for all shapes and color palettes
    const shapeTypes = ['circle', 'x', 'torus', 'triangle', 'square'];
    const gradientCache = {};
    shapeTypes.forEach(shape => {
      gradientCache[shape] = colorPalette.map((colors, index) => {
        return createShapeCache(colors, gradientStops[index], shape);
      });
    });

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
      
      updatePosition(cfg) {
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

      update(time, cfg) {
        const pulse = Math.sin(time * cfg.pulseSpeed + this.pulseOffset);
        this.currentRadius = Math.max(1, this.baseRadius * this.scale + pulse * 3 * this.scale);
      }

      draw(ctx, cfg, time) {
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
        const finalOpacity = depthOpacity * cfg.particleOpacity;
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
        
        // Check if we need to recreate particles (only when counts change)
        if (particlesRef.current.length !== cfg.particleCount) {
          particlesRef.current = Array.from({ length: cfg.particleCount }, (_, i) => new Particle(i, cfg));
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

          bgParticlesRef.current.forEach(particle => {
            particle.update(cfg);
            particle.rotate(cfg, canvas.width, canvas.height);
          });

          particlesRef.current.forEach(particle => {
            particle.updatePosition(cfg);
            particle.update(timeRef.current, cfg); // Update radius before rotate uses it
            particle.rotate(angleXRef.current, angleYRef.current, cfg, canvas.width, canvas.height);
          });
        } else {
          // When frozen, still need to rotate particles to their current positions for rendering
          bgParticlesRef.current.forEach(particle => {
            particle.rotate(cfg, canvas.width, canvas.height);
          });

          particlesRef.current.forEach(particle => {
            particle.rotate(angleXRef.current, angleYRef.current, cfg, canvas.width, canvas.height);
          });
        }

        // Reuse array to reduce GC pressure
        const allParticles = bgParticlesRef.current.concat(particlesRef.current);
        allParticles.sort((a, b) => a.depth - b.depth);

        ctx.globalCompositeOperation = 'multiply';
        
        allParticles.forEach(particle => {
          if (particle.currentRadius > 0) {
            particle.draw(ctx, cfg, timeRef.current);
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
