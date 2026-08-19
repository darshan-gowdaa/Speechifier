"use client";

import { useEffect, useRef } from "react";

export function StrandsVisualizer({ 
  isActive, 
  currentWord,
  pitch = 1,
  rate = 1
}: { 
  isActive: boolean; 
  currentWord: string;
  pitch?: number;
  rate?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const amplitudeRef = useRef(0);
  const targetAmpRef = useRef(0);
  const timeRef = useRef(0);

  const textRef = useRef<HTMLSpanElement>(null);

  // Spike amplitude when word changes
  useEffect(() => {
    if (isActive && currentWord) {
      targetAmpRef.current = 1.0 + (pitch * 0.5); // React to pitch
      setTimeout(() => {
        targetAmpRef.current = 0.2;
      }, 50 + (1 / rate) * 50); // Decay based on rate
    } else {
      targetAmpRef.current = 0;
    }
  }, [currentWord, isActive, pitch, rate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    let w = canvas.width = canvas.offsetWidth;
    let h = canvas.height = canvas.offsetHeight;

    const handleResize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    const strands = Array.from({ length: 5 }).map((_, i) => ({
      yOffset: (i - 2) * 20,
      phase: i * 1.5,
      speed: 0.02 + i * 0.005,
      color: `rgba(255, 255, 255, ${0.1 + (i * 0.05)})`
    }));

    const render = () => {
      ctx.clearRect(0, 0, w, h);
      
      amplitudeRef.current += (targetAmpRef.current - amplitudeRef.current) * 0.15;
      timeRef.current += 1 + (amplitudeRef.current * 2);

      if (textRef.current) {
        textRef.current.style.transform = `scale(${1 + amplitudeRef.current * 0.05})`;
      }

      strands.forEach((strand) => {
        ctx.beginPath();
        const yStart = h / 2 + strand.yOffset;
        ctx.moveTo(0, yStart);
        
        for (let x = 0; x <= w; x += 10) {
          const normalizedX = x / w;
          const wave1 = Math.sin(normalizedX * 10 + (timeRef.current * strand.speed) + strand.phase);
          const wave2 = Math.sin(normalizedX * 5 - (timeRef.current * strand.speed * 1.5));
          
          const envelope = Math.sin(normalizedX * Math.PI); 
          const y = yStart + (wave1 + wave2) * 40 * amplitudeRef.current * envelope;
          
          ctx.lineTo(x, y);
        }
        
        ctx.strokeStyle = strand.color;
        ctx.lineWidth = 2 + (amplitudeRef.current * 2);
        ctx.stroke();
      });

      raf = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: 'clamp(150px, 25vh, 240px)', overflow: 'hidden', borderRadius: '16px', border: '1px solid var(--border-soft)', background: 'linear-gradient(180deg, rgba(20,20,20,0.8) 0%, rgba(5,5,5,0.95) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      
      {/* Immersive Word Display */}
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
        {currentWord ? (
          <span ref={textRef} style={{ fontSize: '56px', fontWeight: 600, letterSpacing: '-0.03em', color: '#fff', textShadow: '0 4px 32px rgba(255,255,255,0.25)', display: 'block', transition: 'transform 0.1s ease-out' }}>
            {currentWord}
          </span>
        ) : isActive ? (
          <span style={{ fontSize: '24px', color: 'var(--muted)' }}>...</span>
        ) : null}
      </div>
    </div>
  );
}
