import React, { useRef, useEffect, useState } from 'react';
import './LemonDivider.css';

interface LemonDividerProps {
  position: 'left' | 'right';
}

const LemonDivider: React.FC<LemonDividerProps> = ({ position }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.3 } // si attiva quando il 30% del divider è visibile
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`lemon-divider ${position} ${isVisible ? 'visible' : ''}`}
    >
      <div className="lemon-branch-container">
        <div className="lemon-branch"></div>
      </div>
    </div>
  );
};

export default LemonDivider;
