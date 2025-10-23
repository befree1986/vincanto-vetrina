import { useEffect, useRef, useState } from 'react';
import './AnimatedDivider.css'; // crea questo file per gli stili

const AnimatedDivider = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    });

    if (ref.current) observer.observe(ref.current);
    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  return (
    <div ref={ref} className={`divider ${isVisible ? 'visible' : ''}`}>
      <hr />
    </div>
  );
};

export default AnimatedDivider;