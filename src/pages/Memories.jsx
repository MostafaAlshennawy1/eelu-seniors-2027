import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Upload } from 'lucide-react';
import LightboxGallery from '../components/LightboxGallery';
import './Memories.css';

const Memories = () => {
  useEffect(() => {
    // Confetti Celebration Cannon
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#d4af37', '#ffffff', '#3b82f6']
      });
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#d4af37', '#ffffff', '#3b82f6']
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="memories-page">
      <div className="container">
        <div className="memories-header">
          <div className="memories-header-content">
            <h1 className="headline-lg text-primary">Class Gallery</h1>
            <p className="body-lg text-outline">
              Memories from EELU Computer Science Assiut Branch – Class of 2027.
            </p>
          </div>
          <a
            href="https://mostafaalshennawy1.github.io/Seniors-2027-Gallery/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
          >
            <Upload size={20} />
            Upload Memory
          </a>
        </div>

        <LightboxGallery />
      </div>
    </div>
  );
};

export default Memories;
