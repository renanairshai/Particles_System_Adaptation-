import React, { useEffect, useRef, useState, useMemo } from 'react';

const CircularParticles = () => {
  const canvasRef = useRef(null);
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
    backgroundParticles: 1000,
    blobDistortion: 0.3,
    bgDriftSpeedMin: 0.1,
    bgDriftSpeedMax: 0.51,
    bgMinSize: 6,
    bgMaxSize: 11,
    motionBlur: 1.58,
    motionBlurSteps: 27,
    particleOpacity: 0.2,
    bgParticleOpacity: 0.2
  });

  // Memoize color palette and gradient stops to avoid recreating
  const colorPalette = useMemo(() => [
    ['#050a2e', '#004466', '#b8edff'],
    ['#0e3510', '#556812', '#f9a4ed'],
    ['#ffa200', '#f4ff5c', '#FFFF99'],
    ['#0d351c', '#5d6303', '#DDA0DD'],
    ['#992900', '#ffe747', '#fffef5'],
    ['#2e2905', '#8eecd9', '#B0E0E6'],
    ['#0a4461', '#ffccf4', '#ffccf4'],
    ['#610000', '#ff7300', '#FFFF00']
  ], []);

  const gradientStops = useMemo(() => [
    { stop1: 0, stop2: 0.27520435967302453, stop3: 0.670299727520436 },
    { stop1: 0, stop2: 0.1, stop3: 0.508628519527702 },
    { stop1: 0, stop2: 0.3224341507720254, stop3: 1 },
    { stop1: 0, stop2: 0.18528610354223432, stop3: 0.5 },
    { stop1: 0, stop2: 0.3478655767484105, stop3: 1 },
    { stop1: 0, stop2: 0.1880108991825613, stop3: 0.5367847411444142 },
    { stop1: 0.1008174386920981, stop2: 0.3832879200726612, stop3: 0.6584922797456857 },
    { stop1: 0, stop2: 0.2710997442455243, stop3: 0.7148337595907929 }
  ], []);

  // Pre-compute hex conversion lookup table
  const hexLookup = useMemo(() => {
    const lookup = new Array(256);
    for (let i = 0; i < 256; i++) {
      lookup[i] = i.toString(16).padStart(2, '0');
    }
    return lookup;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];
    let backgroundParticles = [];
    let allParticles = []; // Reuse array instead of creating new one
    let currentConfig = config;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Circular buffer for position history to avoid array shift operations
    class CircularBuffer {
      constructor(size) {
        this.size = size;
        this.buffer = new Array(size);
        this.writeIndex = 0;
        this.count = 0;
      }

      push(item) {
        this.buffer[this.writeIndex] = item;
        this.writeIndex = (this.writeIndex + 1) % this.size;
        if (this.count < this.size) this.count++;
      }

      forEach(callback) {
        const start = this.count < this.size ? 0 : this.writeIndex;
        for (let i = 0; i < this.count; i++) {
          const index = (start + i) % this.size;
          callback(this.buffer[index], i);
        }
      }

      get length() {
        return this.count;
      }

      clear() {
        this.count = 0;
        this.writeIndex = 0;
      }
    }

    class Particle {
      constructor(index) {
        const phi = Math.acos(1 - 2 * (index + 0.5) / currentConfig.particleCount);
        const theta = Math.PI * (1 + Math.sqrt(5)) * index;
        
        this.baseX = currentConfig.sphereRadius * Math.sin(phi) * Math.cos(theta);
        this.baseY = currentConfig.sphereRadius * Math.sin(phi) * Math.sin(theta);
        this.baseZ = currentConfig.sphereRadius * Math.cos(phi);
        
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
        
        this.breathingSpeed = currentConfig.breathingSpeedMin + Math.random() * (currentConfig.breathingSpeedMax - currentConfig.breathingSpeedMin);
        this.breathingAmount = currentConfig.breathingAmountMin + Math.random() * (currentConfig.breathingAmountMax - currentConfig.breathingAmountMin);
        this.breathingPhase = Math.random() * Math.PI * 2;
        
        this.x3d = this.baseX;
        this.y3d = this.baseY;
        this.z3d = this.baseZ;
        
        this.baseRadius = currentConfig.minRadius + Math.random() * (currentConfig.maxRadius - currentConfig.minRadius);
        this.colorSetIndex = Math.floor(Math.random() * colorPalette.length);
        this.colorSet = colorPalette[this.colorSetIndex];
        this.pulseOffset = index * 0.05;
        
        this.x2d = 0;
        this.y2d = 0;
        this.scale = 1;
        this.depth = 0;
        
        // Cache base magnitude calculation
        this.baseMag = Math.sqrt(
          this.baseX * this.baseX + 
          this.baseY * this.baseY + 
          this.baseZ * this.baseZ
        );
        
        // Use circular buffer for position history
        this.positionHistory = new CircularBuffer(currentConfig.motionBlurSteps || 27);
        
        // Pre-compute gradient stop values
        this.stops = gradientStops[this.colorSetIndex] || { stop1: 0, stop2: 0.5, stop3: 1 };
      }
      
      updatePosition(time) {
        const scatterOffset = currentConfig.scatter;
        
        this.breathingPhase += this.breathingSpeed;
        const breathingOffset = Math.sin(this.breathingPhase) * this.breathingAmount;
        
        const factor = (this.baseMag + breathingOffset) / this.baseMag;
        
        this.x3d = this.baseX * factor + this.scatterX * scatterOffset;
        this.y3d = this.baseY * factor + this.scatterY * scatterOffset;
        this.z3d = this.baseZ * factor + this.scatterZ * scatterOffset;
      }

      rotate(angleX, angleY) {
        // Cache cos/sin values
        const cosX = Math.cos(angleX);
        const sinX = Math.sin(angleX);
        const y1 = this.y3d * cosX - this.z3d * sinX;
        const z1 = this.y3d * sinX + this.z3d * cosX;
        
        const cosY = Math.cos(angleY);
        const sinY = Math.sin(angleY);
        const x2 = this.x3d * cosY + z1 * sinY;
        const z2 = -this.x3d * sinY + z1 * cosY;
        
        this.depth = z2;
        
        const scale = currentConfig.perspective / (currentConfig.perspective + z2);
        this.scale = scale;
        
        const centerX = canvas.width * 0.5; // Use multiplication instead of division
        const centerY = canvas.height * 0.5;
        
        this.x2d = centerX + x2 * scale;
        this.y2d = centerY + y1 * scale;
      }

      update(time) {
        const pulse = Math.sin(time * currentConfig.pulseSpeed + this.pulseOffset);
        this.currentRadius = this.baseRadius * this.scale + pulse * 3 * this.scale;
        
        // Push to history AFTER currentRadius is calculated
        if (currentConfig.motionBlur > 0) {
          this.positionHistory.push({
            x: this.x2d,
            y: this.y2d,
            radius: this.currentRadius
          });
        } else {
          this.positionHistory.clear();
        }
      }

      draw(time) {
        const depthOpacity = Math.max(0.5, Math.min(1, (this.depth + currentConfig.sphereRadius) / (currentConfig.sphereRadius * 2)));
        const finalOpacity = depthOpacity * currentConfig.particleOpacity;
        
        // Early exit if particle is off-screen
        const margin = this.currentRadius * 2;
        if (this.x2d < -margin || this.x2d > canvas.width + margin ||
            this.y2d < -margin || this.y2d > canvas.height + margin) {
          return;
        }
        
        if (currentConfig.motionBlur > 0 && this.positionHistory.length > 0) {
          const historyLength = this.positionHistory.length;
          this.positionHistory.forEach((pos, i) => {
            const fadeAmount = (i + 1) / historyLength;
            const echoOpacity = fadeAmount * currentConfig.motionBlur * finalOpacity;
            
            const alpha1Val = Math.floor(echoOpacity * 255);
            const alpha2Val = Math.floor(echoOpacity * 200);
            
            const gradient = ctx.createRadialGradient(
              pos.x, pos.y, 0,
              pos.x, pos.y, pos.radius
            );
            
            gradient.addColorStop(this.stops.stop1, this.colorSet[0] + hexLookup[alpha1Val]);
            gradient.addColorStop(this.stops.stop2, this.colorSet[1] + hexLookup[alpha2Val]);
            gradient.addColorStop(this.stops.stop3, this.colorSet[2] + '00');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            
            const segments = 16;
            const noiseAmount = pos.radius * currentConfig.blobDistortion;
            const timeOffset = time * 0.02 + this.pulseOffset;
            
            for (let j = 0; j <= segments; j++) {
              const angle = (j / segments) * Math.PI * 2;
              const noise = Math.sin(angle * 3 + timeOffset) * noiseAmount;
              const radius = pos.radius + noise;
              const x = pos.x + Math.cos(angle) * radius;
              const y = pos.y + Math.sin(angle) * radius;
              
              if (j === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
            }
            
            ctx.closePath();
            ctx.fill();
          });
        }
        
        const alpha1Val = Math.floor(finalOpacity * 255);
        const alpha2Val = Math.floor(finalOpacity * 200);
        
        const gradient = ctx.createRadialGradient(
          this.x2d, this.y2d, 0,
          this.x2d, this.y2d, this.currentRadius
        );
        
        gradient.addColorStop(this.stops.stop1, this.colorSet[0] + hexLookup[alpha1Val]);
        gradient.addColorStop(this.stops.stop2, this.colorSet[1] + hexLookup[alpha2Val]);
        gradient.addColorStop(this.stops.stop3, this.colorSet[2] + '00');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        
        const segments = 16;
        const noiseAmount = this.currentRadius * currentConfig.blobDistortion;
        const timeOffset = time * 0.02 + this.pulseOffset;
        
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          const noise = Math.sin(angle * 3 + timeOffset) * noiseAmount;
          const radius = this.currentRadius + noise;
          const x = this.x2d + Math.cos(angle) * radius;
          const y = this.y2d + Math.sin(angle) * radius;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.closePath();
        ctx.fill();
      }
    }

    class BackgroundParticle {
      constructor() {
        const distance = 400 + Math.random() * 400;
        
        this.x3d = (Math.random() - 0.5) * distance * 2;
        this.y3d = (Math.random() - 0.5) * distance * 2;
        this.z3d = -200 - Math.random() * 600;
        
        this.sizeRatio = Math.random();
        this.colorSetIndex = Math.floor(Math.random() * colorPalette.length);
        this.colorSet = colorPalette[this.colorSetIndex];
        
        const speed = currentConfig.bgDriftSpeedMin + Math.random() * (currentConfig.bgDriftSpeedMax - currentConfig.bgDriftSpeedMin);
        const angle = Math.random() * Math.PI * 2;
        const angleY = (Math.random() - 0.5) * Math.PI;
        
        this.driftX = Math.cos(angle) * Math.cos(angleY) * speed;
        this.driftY = Math.sin(angleY) * speed;
        this.driftZ = Math.sin(angle) * Math.cos(angleY) * speed;
        
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.01 + Math.random() * 0.02;
        
        this.x2d = 0;
        this.y2d = 0;
        this.scale = 1;
        this.depth = 0;
        
        // Use circular buffer
        this.positionHistory = new CircularBuffer(currentConfig.motionBlurSteps || 27);
        
        // Pre-compute gradient stop values
        this.stops = gradientStops[this.colorSetIndex] || { stop1: 0, stop2: 0.5, stop3: 1 };
        
        // Pre-compute size calculations
        this.minSize = Math.min(currentConfig.bgMinSize, currentConfig.bgMaxSize);
        this.maxSize = Math.max(currentConfig.bgMinSize, currentConfig.bgMaxSize);
        this.baseRadius = this.minSize + this.sizeRatio * (this.maxSize - this.minSize);
      }

      update() {
        this.x3d += this.driftX;
        this.y3d += this.driftY;
        this.z3d += this.driftZ;
        
        if (Math.abs(this.x3d) > 1000 || Math.abs(this.y3d) > 1000 || this.z3d > 200) {
          const distance = 400 + Math.random() * 400;
          this.x3d = (Math.random() - 0.5) * distance * 2;
          this.y3d = (Math.random() - 0.5) * distance * 2;
          this.z3d = -200 - Math.random() * 600;
        }
        
        this.pulsePhase += this.pulseSpeed;
      }

      rotate(angleX, angleY) {
        const scale = currentConfig.perspective / (currentConfig.perspective + this.z3d);
        this.scale = scale;
        
        this.depth = this.z3d;
        
        const centerX = canvas.width * 0.5;
        const centerY = canvas.height * 0.5;
        
        this.x2d = centerX + this.x3d * scale;
        this.y2d = centerY + this.y3d * scale;
        
        const pulse = Math.sin(this.pulsePhase);
        this.currentRadius = this.baseRadius * this.scale * (1 + pulse * 0.2);
        
        if (currentConfig.motionBlur > 0) {
          this.positionHistory.push({
            x: this.x2d,
            y: this.y2d,
            radius: this.currentRadius
          });
        } else {
          this.positionHistory.clear();
        }
      }

      draw(time) {
        const depthOpacity = Math.max(0.3, Math.min(0.6, (this.depth + 800) / 1000));
        const finalOpacity = depthOpacity * currentConfig.bgParticleOpacity;
        
        // Early exit if particle is off-screen
        const margin = this.currentRadius * 2;
        if (this.x2d < -margin || this.x2d > canvas.width + margin ||
            this.y2d < -margin || this.y2d > canvas.height + margin) {
          return;
        }
        
        if (currentConfig.motionBlur > 0 && this.positionHistory.length > 0) {
          const historyLength = this.positionHistory.length;
          this.positionHistory.forEach((pos, i) => {
            const fadeAmount = (i + 1) / historyLength;
            const echoOpacity = fadeAmount * currentConfig.motionBlur * finalOpacity;
            
            const alpha1Val = Math.floor(echoOpacity * 200);
            const alpha2Val = Math.floor(echoOpacity * 150);
            
            const gradient = ctx.createRadialGradient(
              pos.x, pos.y, 0,
              pos.x, pos.y, pos.radius
            );
            
            gradient.addColorStop(this.stops.stop1, this.colorSet[0] + hexLookup[alpha1Val]);
            gradient.addColorStop(this.stops.stop2, this.colorSet[1] + hexLookup[alpha2Val]);
            gradient.addColorStop(this.stops.stop3, this.colorSet[2] + '00');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            
            const segments = 12;
            const noiseAmount = pos.radius * 0.4;
            
            for (let j = 0; j <= segments; j++) {
              const angle = (j / segments) * Math.PI * 2;
              const noise = Math.sin(angle * 2 + this.pulsePhase) * noiseAmount;
              const radius = pos.radius + noise;
              const x = pos.x + Math.cos(angle) * radius;
              const y = pos.y + Math.sin(angle) * radius;
              
              if (j === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
            }
            
            ctx.closePath();
            ctx.fill();
          });
        }
        
        const alpha1Val = Math.floor(finalOpacity * 200);
        const alpha2Val = Math.floor(finalOpacity * 150);
        
        const gradient = ctx.createRadialGradient(
          this.x2d, this.y2d, 0,
          this.x2d, this.y2d, this.currentRadius
        );
        
        gradient.addColorStop(this.stops.stop1, this.colorSet[0] + hexLookup[alpha1Val]);
        gradient.addColorStop(this.stops.stop2, this.colorSet[1] + hexLookup[alpha2Val]);
        gradient.addColorStop(this.stops.stop3, this.colorSet[2] + '00');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        
        const segments = 12;
        const noiseAmount = this.currentRadius * 0.4;
        
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          const noise = Math.sin(angle * 2 + this.pulsePhase) * noiseAmount;
          const radius = this.currentRadius + noise;
          const x = this.x2d + Math.cos(angle) * radius;
          const y = this.y2d + Math.sin(angle) * radius;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.closePath();
        ctx.fill();
      }
    }

    const initParticles = () => {
      particles = Array.from({ length: currentConfig.particleCount }, (_, i) => new Particle(i));
      backgroundParticles = Array.from({ length: currentConfig.backgroundParticles }, () => new BackgroundParticle());
      // Pre-allocate combined array
      allParticles.length = 0;
      allParticles.push(...backgroundParticles, ...particles);
    };

    initParticles();
    let time = 0;
    let angleX = 0;
    let angleY = 0;
    let lastConfigUpdate = 0;
    const CONFIG_UPDATE_INTERVAL = 5; // Only check config changes every 5 frames

    const animate = () => {
      try {
        if (!canvas.width || !canvas.height) {
          animationId = requestAnimationFrame(animate);
          return;
        }
        
        // Only update config reference periodically to avoid object creation overhead
        if (time - lastConfigUpdate >= CONFIG_UPDATE_INTERVAL) {
          currentConfig = config; // Direct reference, no copy needed
          lastConfigUpdate = time;
          
          // Check if particle counts changed
          if (particles.length !== currentConfig.particleCount || 
              backgroundParticles.length !== currentConfig.backgroundParticles) {
            initParticles();
          }
        }
        
        // Use fillRect instead of clearRect + fillRect for better performance
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        time++;
        angleX += currentConfig.rotationSpeedX;
        angleY += currentConfig.rotationSpeedY;

        // Update particles
        for (let i = 0; i < backgroundParticles.length; i++) {
          backgroundParticles[i].update();
          backgroundParticles[i].rotate(angleX, angleY);
        }

        for (let i = 0; i < particles.length; i++) {
          particles[i].updatePosition(time);
          particles[i].rotate(angleX, angleY);
          particles[i].update(time);
        }

        // Rebuild combined array only if counts changed
        if (allParticles.length !== backgroundParticles.length + particles.length) {
          allParticles.length = 0;
          allParticles.push(...backgroundParticles, ...particles);
        }
        
        // Sort particles by depth (back to front)
        allParticles.sort((a, b) => a.depth - b.depth);

        ctx.globalCompositeOperation = 'multiply';
        
        // Use for loop instead of forEach for better performance
        for (let i = 0; i < allParticles.length; i++) {
          const particle = allParticles[i];
          if (particle.x2d >= -particle.currentRadius * 2 && 
              particle.x2d <= canvas.width + particle.currentRadius * 2 && 
              particle.y2d >= -particle.currentRadius * 2 && 
              particle.y2d <= canvas.height + particle.currentRadius * 2 &&
              particle.currentRadius > 0) {
            particle.draw(time);
          }
        }
        
        ctx.globalCompositeOperation = 'source-over';
      } catch (error) {
        console.error('Animation error:', error);
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [config, colorPalette, gradientStops, hexLookup]);

  const updateConfig = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: parseFloat(value) }));
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
      <div className="bg-gray-900 text-white p-4 overflow-y-auto max-h-64">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">3D Sphere Particle System</h2>
          <button
            onClick={copyAllParams}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs"
          >
            Copy All Parameters
          </button>
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
              min="10"
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
              min="30"
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
              min="1"
              max="30"
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
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="flex-1 w-full"
      />
    </div>
  );
}

export default CircularParticles;
