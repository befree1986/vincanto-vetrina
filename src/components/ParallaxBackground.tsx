import React, { useEffect } from 'react';
import './ParallaxBackground.css';

interface ParallaxBackgroundProps {
  imageUrl: string;
  children?: React.ReactNode;
}

const ParallaxBackground: React.FC<ParallaxBackgroundProps> = ({ imageUrl, children }) => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isMobile = window.innerWidth < 769;

    if (isMobile) {
      const handleScroll = () => {
        const offset = window.scrollY;
        const background = document.querySelector('.parallax-background') as HTMLElement;
        if (background) {
          background.style.transform = `translateY(${offset * 0.5}px)`;
        }
      };

      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <div className="parallax-wrapper">
      <div
        className="parallax-background"
        style={{ backgroundImage: `url(${imageUrl})` }}
      ></div>
      <div className="parallax-content">
        {children}
      </div>
    </div>
  );
};

export default ParallaxBackground;