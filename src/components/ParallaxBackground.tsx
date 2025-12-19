import React, { useEffect, useRef } from 'react';
import './ParallaxBackground.css';

interface ParallaxBackgroundProps {
  imageUrl: string;
  children?: React.ReactNode;
}

const ParallaxBackground: React.FC<ParallaxBackgroundProps> = ({ imageUrl, children }) => {
  const bgRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = bgRef.current;
    if (!el) return;

    el.style.setProperty('--bg-image', `url(${imageUrl})`);
    el.style.backgroundImage = `url(${imageUrl})`;

    const isMobile = window.innerWidth < 769;
    if (!isMobile) return;

    const handleScroll = () => {
      const offset = window.scrollY;
      el.style.transform = `translateY(${offset * 0.5}px)`;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [imageUrl]);

  return (
    <div className="parallax-wrapper">
      <div
        className="parallax-background"
        ref={bgRef}
        data-image-url={imageUrl}
      ></div>
      <div className="parallax-content">
        {children}
      </div>
    </div>
  );
};

export default ParallaxBackground;