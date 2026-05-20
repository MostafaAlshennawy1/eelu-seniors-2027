import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import LightboxGallery from '../components/LightboxGallery';
import './Memories.css';

const branches = [
  'All', 'Assiut', 'Ain_shams', 'Alex', 'Sohag', 'Menoufia', 'Tanta',
  'Ismailia', 'Fayoum', 'Beni_Suef', 'Minya', 'Qena', 'Hurghada', 'Sadat'
];

const Memories = () => {
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    // Option 2 WOW Feature: Confetti Celebration Cannon
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
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
          <h1 className="headline-lg text-primary">Class Gallery</h1>
          <p className="body-lg text-outline">
            Memories from every branch of EELU Computer Science Class of 2027.
          </p>
        </div>

        <div className="tabs-container">
          <div className="tabs-scroll">
            {branches.map(branch => (
              <button
                key={branch}
                className={`tab-button ${activeTab === branch ? 'active' : ''}`}
                onClick={() => setActiveTab(branch)}
              >
                {branch.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <LightboxGallery activeTab={activeTab} />
      </div>
    </div>
  );
};

export default Memories;
