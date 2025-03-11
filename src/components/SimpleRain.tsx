import React, { useEffect, useState } from 'react';

interface SimpleRainProps {
  pixelsPerSecond?: number;
}

interface RainDrop {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  color: string;
}

const SimpleRain: React.FC<SimpleRainProps> = ({ pixelsPerSecond = 0 }) => {
  const [raindrops, setRaindrops] = useState<RainDrop[]>([]);
  
  // Calculate number of raindrops based on pixels per second with a maximum cap
  const calculateDropCount = () => {
    const minDrops = 10;
    const maxDrops = 150; // Cap for performance
    
    if (pixelsPerSecond <= 0) return minDrops;
    
    // Logarithmic scaling to handle very large numbers
    const logScale = Math.log10(pixelsPerSecond + 1);
    const normalizedScale = Math.min(1, logScale / 10); // Cap at log10(10^10)
    
    return Math.floor(minDrops + normalizedScale * (maxDrops - minDrops));
  };

  useEffect(() => {
    const dropCount = calculateDropCount();
    const drops: RainDrop[] = Array.from({ length: dropCount }, (_, i) => createRaindrop(i));
    setRaindrops(drops);
    
    // More consistent animation timing using requestAnimationFrame
    let animationId: number;
    let lastTime = 0;
    const fps = 60; // Higher framerate for smoother animation
    const frameTime = 1000 / fps;
    
    const animate = (timestamp: number) => {
      const deltaTime = timestamp - lastTime;
      
      if (deltaTime > frameTime) {
        lastTime = timestamp;
        
        setRaindrops(prevDrops => {
          return prevDrops.map(drop => {
            // Move each drop based on its speed and the time elapsed
            // This gives a smoother, more consistent motion regardless of framerate
            const newY = drop.y + (drop.speed * deltaTime / 16); // Normalized for ~60fps
            
            if (newY > window.innerHeight) {
              return createRaindrop(drop.id);
            }
            
            return { ...drop, y: newY };
          });
        });
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [pixelsPerSecond]); // Re-initialize when pixels per second changes

  const createRaindrop = (id: number): RainDrop => {
    const colors = ['#4285F4', '#5E7CE2', '#7B68EE', '#A682FF', '#6495ED'];
    
    // Realistic raindrop size (smaller drops fall slower)
    const size = 1.5 + Math.random() * 2;
    
    // Realistic raindrop speeds - between 400-800 pixels per second
    // Larger drops fall faster (terminal velocity physics)
    const baseSpeed = 30; // Speed per frame at 60fps ≈ 900px/s
    const sizeMultiplier = size / 3; // Larger drops are faster
    const speed = baseSpeed * sizeMultiplier;
    
    return {
      id,
      x: Math.random() * window.innerWidth,
      y: Math.random() * -window.innerHeight,
      size,
      speed,
      opacity: 0.3 + Math.random() * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)]
    };
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {raindrops.map(drop => (
        <div
          key={drop.id}
          className="absolute rounded-full"
          style={{
            left: `${drop.x}px`,
            top: `${drop.y}px`,
            width: `${drop.size}px`,
            height: `${drop.size * 15}px`, // Longer streaks for faster movement
            opacity: drop.opacity,
            backgroundColor: drop.color,
            boxShadow: `0 0 ${drop.size}px ${drop.color}`
          }}
        />
      ))}
    </div>
  );
};

export default SimpleRain; 