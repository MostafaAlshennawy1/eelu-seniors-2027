import React, { useEffect, useState, useRef } from 'react';
import { Users, Coffee, Code, Bug } from 'lucide-react';
import './BranchStats.css';

// Count images in assets/imgs directory
const studentImages = import.meta.glob('../assets/imgs/**/*.{png,jpg,jpeg,webp,gif}', { eager: true });
const totalSeniors = Object.keys(studentImages).length || 150; // Fallback if 0

const statsData = [
  { id: 1, label: 'Seniors', value: totalSeniors, icon: Users, color: '#4facfe' },
  { id: 2, label: 'Coffee Cups', value: 3420, icon: Coffee, color: '#ff0844' },
  { id: 3, label: 'Lines of Code', value: 950000, icon: Code, color: '#00f2fe' },
  { id: 4, label: 'Bugs Fixed', value: 1337, icon: Bug, color: '#f83600' },
];

const StatCard = ({ stat }) => {
  const [count, setCount] = useState(0);
  const cardRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          let start = 0;
          const end = stat.value;
          const duration = 2000;
          const increment = end / (duration / 16);

          const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
          
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [stat.value]);

  const Icon = stat.icon;

  return (
    <div className="stat-card" ref={cardRef}>
      <div className="stat-icon" style={{ color: stat.color, background: `${stat.color}22` }}>
        <Icon size={32} />
      </div>
      <div className="stat-info">
        <h3 className="stat-value">{count.toLocaleString()}</h3>
        <p className="stat-label">{stat.label}</p>
      </div>
    </div>
  );
};

const BranchStats = () => {
  return (
    <div className="branch-stats-container">
      <h2 className="stats-title">Class by the Numbers</h2>
      <div className="stats-grid">
        {statsData.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </div>
    </div>
  );
};

export default BranchStats;
