import React, { useEffect, useRef, useState } from 'react';

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
        
        // Store position history for echo effect
        this.positionHistory = [];
      }
      
      updatePosition(time) {
        const scatterOffset = currentConfig.scatter;
        
        this.breathingPhase += this.breathingSpeed;
        const breathingOffset = Math.sin(this.breathingPhase) * this.breathingAmount;
        
        const mag = Math.sqrt(
          this.baseX * this.baseX + 
          this.baseY * this.baseY + 
          this.baseZ * this.baseZ
        );
        
        const factor = (mag + breathingOffset) / mag;
        
        this.x3d = this.baseX * factor + this.scatterX * scatterOffset;
        this.y3d = this.baseY * factor + this.scatterY * scatterOffset;
        this.z3d = this.baseZ * factor + this.scatterZ * scatterOffset;
      }

      rotate(angleX, angleY) {
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
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        this.x2d = centerX + x2 * scale;
        this.y2d = centerY + y1 * scale;
        
        // Store position in history for echo effect
        if (currentConfig.motionBlur > 0) {
          this.positionHistory.push({
            x: this.x2d,
            y: this.y2d,
            radius: this.currentRadius
          });
          
          // Keep only the last N positions based on motionBlurSteps
          const maxHistory = currentConfig.motionBlurSteps;
          if (this.positionHistory.length > maxHistory) {
            this.positionHistory.shift();
          }
        } else {
          this.positionHistory = [];
        }
      }

      update(time) {
        const pulse = Math.sin(time * currentConfig.pulseSpeed + this.pulseOffset);
        this.currentRadius = this.baseRadius * this.scale + pulse * 3 * this.scale;
      }

      draw() {
        const depthOpacity = Math.max(0.5, Math.min(1, (this.depth + currentConfig.sphereRadius) / (currentConfig.sphereRadius * 2)));
        const finalOpacity = depthOpacity * currentConfig.particleOpacity;
        
        // Draw echo/ghost trails
        if (currentConfig.motionBlur > 0 && this.positionHistory.length > 0) {
          for (let i = 0; i < this.positionHistory.length; i++) {
            const pos = this.positionHistory[i];
            const fadeAmount = (i + 1) / this.positionHistory.length;
            const echoOpacity = fadeAmount * currentConfig.motionBlur * finalOpacity;
            
            const gradient = ctx.createRadialGradient(
              pos.x, pos.y, 0,
              pos.x, pos.y, pos.radius
            );
            
            const alpha1 = Math.floor(echoOpacity * 255).toString(16).padStart(2, '0');
            const alpha2 = Math.floor(echoOpacity * 200).toString(16).padStart(2, '0');
            
            const stops = gradientStops[this.colorSetIndex] || { stop1: 0, stop2: 0.5, stop3: 1 };
            
            gradient.addColorStop(stops.stop1, this.colorSet[0] + alpha1);
            gradient.addColorStop(stops.stop2, this.colorSet[1] + alpha2);
            gradient.addColorStop(stops.stop3, this.colorSet[2] + '00');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            
            const segments = 16;
            const noiseAmount = pos.radius * currentConfig.blobDistortion;
            
            for (let j = 0; j <= segments; j++) {
              const angle = (j / segments) * Math.PI * 2;
              const noise = Math.sin(angle * 3 + time * 0.02 + this.pulseOffset) * noiseAmount;
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
          }
        }
        
        // Draw main particle
        const gradient = ctx.createRadialGradient(
          this.x2d, this.y2d, 0,
          this.x2d, this.y2d, this.currentRadius
        );
        
        const alpha1 = Math.floor(finalOpacity * 255).toString(16).padStart(2, '0');
        const alpha2 = Math.floor(finalOpacity * 200).toString(16).padStart(2, '0');
        
        const stops = gradientStops[this.colorSetIndex] || { stop1: 0, stop2: 0.5, stop3: 1 };
        
        gradient.addColorStop(stops.stop1, this.colorSet[0] + alpha1);
        gradient.addColorStop(stops.stop2, this.colorSet[1] + alpha2);
        gradient.addColorStop(stops.stop3, this.colorSet[2] + '00');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        
        // Create irregular blob shape instead of perfect circle
        const segments = 16;
        const noiseAmount = this.currentRadius * currentConfig.blobDistortion;
        
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          const noise = Math.sin(angle * 3 + time * 0.02 + this.pulseOffset) * noiseAmount;
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
        this.reset();
      }

      reset() {
        const distance = 400 + Math.random() * 400;
        
        this.x3d = (Math.random() - 0.5) * distance * 2;
        this.y3d = (Math.random() - 0.5) * distance * 2;
        this.z3d = -200 - Math.random() * 600;
        
        this.sizeRatio = Math.random(); // Store ratio instead of absolute size
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
        
        // Store position history for echo effect
        this.positionHistory = [];
      }

      update() {
        this.x3d += this.driftX;
        this.y3d += this.driftY;
        this.z3d += this.driftZ;
        
        if (Math.abs(this.x3d) > 1000 || Math.abs(this.y3d) > 1000 || this.z3d > 200) {
          this.reset();
        }
        
        this.pulsePhase += this.pulseSpeed;
      }

      rotate(angleX, angleY) {
        // Background particles don't rotate with the sphere
        const scale = currentConfig.perspective / (currentConfig.perspective + this.z3d);
        this.scale = scale;
        
        this.depth = this.z3d;
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        this.x2d = centerX + this.x3d * scale;
        this.y2d = centerY + this.y3d * scale;
        
        // Calculate base radius from current config with safeguard
        const minSize = Math.min(currentConfig.bgMinSize, currentConfig.bgMaxSize);
        const maxSize = Math.max(currentConfig.bgMinSize, currentConfig.bgMaxSize);
        const baseRadius = minSize + this.sizeRatio * (maxSize - minSize);
        
        const pulse = Math.sin(this.pulsePhase);
        this.currentRadius = baseRadius * this.scale * (1 + pulse * 0.2);
        
        // Store position in history for echo effect
        if (currentConfig.motionBlur > 0) {
          this.positionHistory.push({
            x: this.x2d,
            y: this.y2d,
            radius: this.currentRadius
          });
          
          const maxHistory = currentConfig.motionBlurSteps;
          if (this.positionHistory.length > maxHistory) {
            this.positionHistory.shift();
          }
        } else {
          this.positionHistory = [];
        }
      }

      draw() {
        const depthOpacity = Math.max(0.3, Math.min(0.6, (this.depth + 800) / 1000));
        const finalOpacity = depthOpacity * currentConfig.bgParticleOpacity;
        
        // Draw echo/ghost trails for background particles
        if (currentConfig.motionBlur > 0 && this.positionHistory.length > 0) {
          for (let i = 0; i < this.positionHistory.length; i++) {
            const pos = this.positionHistory[i];
            const fadeAmount = (i + 1) / this.positionHistory.length;
            const echoOpacity = fadeAmount * currentConfig.motionBlur * finalOpacity;
            
            const gradient = ctx.createRadialGradient(
              pos.x, pos.y, 0,
              pos.x, pos.y, pos.radius
            );
            
            const stops = gradientStops[this.colorSetIndex] || { stop1: 0, stop2: 0.5, stop3: 1 };
            
            const alpha1 = Math.floor(echoOpacity * 200).toString(16).padStart(2, '0');
            const alpha2 = Math.floor(echoOpacity * 150).toString(16).padStart(2, '0');
            
            gradient.addColorStop(stops.stop1, this.colorSet[0] + alpha1);
            gradient.addColorStop(stops.stop2, this.colorSet[1] + alpha2);
            gradient.addColorStop(stops.stop3, this.colorSet[2] + '00');
            
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
          }
        }
        
        // Draw main background particle
        const gradient = ctx.createRadialGradient(
          this.x2d, this.y2d, 0,
          this.x2d, this.y2d, this.currentRadius
        );
        
        const stops = gradientStops[this.colorSetIndex] || { stop1: 0, stop2: 0.5, stop3: 1 };
        
        const alpha1 = Math.floor(finalOpacity * 200).toString(16).padStart(2, '0');
        const alpha2 = Math.floor(finalOpacity * 150).toString(16).padStart(2, '0');
        
        gradient.addColorStop(stops.stop1, this.colorSet[0] + alpha1);
        gradient.addColorStop(stops.stop2, this.colorSet[1] + alpha2);
        gradient.addColorStop(stops.stop3, this.colorSet[2] + '00');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        
        // Create irregular blob shape for background particles too
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
    };

    initParticles();
    let time = 0;
    let angleX = 0;
    let angleY = 0;

    const animate = () => {
      try {
        if (!canvas.width || !canvas.height) {
          animationId = requestAnimationFrame(animate);
          return;
        }
        
        // Update config
        currentConfig = { ...config };
        
        // Check if we need to recreate particles
        if (particles.length !== currentConfig.particleCount || 
            backgroundParticles.length !== currentConfig.backgroundParticles) {
          initParticles();
        }
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        time++;
        angleX += currentConfig.rotationSpeedX;
        angleY += currentConfig.rotationSpeedY;

        backgroundParticles.forEach(particle => {
          particle.update();
          particle.rotate(angleX, angleY);
        });

        particles.forEach(particle => {
          particle.updatePosition(time);
          particle.rotate(angleX, angleY);
          particle.update(time);
        });

        const allParticles = [...backgroundParticles, ...particles];
        allParticles.sort((a, b) => a.depth - b.depth);

        ctx.globalCompositeOperation = 'multiply';
        
        allParticles.forEach(particle => {
          if (particle.x2d >= 0 && particle.x2d <= canvas.width && 
              particle.y2d >= 0 && particle.y2d <= canvas.height &&
              particle.currentRadius > 0) {
            particle.draw();
          }
        });
        
        // Debug: count visible particles
        const visibleCount = allParticles.filter(p => 
          p.x2d >= 0 && p.x2d <= canvas.width && 
          p.y2d >= 0 && p.y2d <= canvas.height &&
          p.currentRadius > 0
        ).length;
        
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'black';
        ctx.font = '12px monospace';
        ctx.fillText(`Frame: ${time} Visible: ${visibleCount}/${allParticles.length}`, 10, 20);
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
  }, [config]);

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
};

export default CircularParticles;
