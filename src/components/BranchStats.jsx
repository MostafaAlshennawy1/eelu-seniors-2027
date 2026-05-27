import React, { useEffect, useState, useRef } from 'react';
import { Users, Coffee, Code, Bug } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import './BranchStats.css';

// Count local images in assets/imgs directory
const studentImages = import.meta.glob('../assets/imgs/**/*.{png,jpg,jpeg,webp,gif}', { eager: true });
const localSeniorsCount = Object.keys(studentImages).length || 150; // Fallback if 0

const StatCard = ({ stat }) => {
  const [count, setCount] = useState(0);
  const cardRef = useRef(null);
  const isIntersectingRef = useRef(false);
  const timerRef = useRef(null);
  const targetValueRef = useRef(stat.value);

  // Keep target value ref up to date to avoid stale closure in observer
  useEffect(() => {
    targetValueRef.current = stat.value;
  }, [stat.value]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          isIntersectingRef.current = true;
          animateCount(0, targetValueRef.current);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isIntersectingRef.current && count !== stat.value) {
      animateCount(count, stat.value);
    }
  }, [stat.value]);

  const animateCount = (start, end) => {
    if (end === start) return;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const duration = 2000;
    const increment = (end - start) / (duration / 16);
    let current = start;

    timerRef.current = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
        setCount(end);
        clearInterval(timerRef.current);
        timerRef.current = null;
      } else {
        setCount(Math.floor(current));
      }
    }, 16);
  };

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
  const [totalSeniors, setTotalSeniors] = useState(localSeniorsCount);

  useEffect(() => {
    const q = query(
      collection(db, 'uploads'),
      where('type', '==', 'Memories Gallery')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const firebaseCount = querySnapshot.size;
      setTotalSeniors(localSeniorsCount + firebaseCount);
    });

    return () => unsubscribe();
  }, []);

  const statsData = [
    { id: 1, label: 'Seniors', value: totalSeniors, icon: Users, color: '#4facfe' },
    { id: 2, label: 'Coffee Cups', value: 3420, icon: Coffee, color: '#ff0844' },
    { id: 3, label: 'Lines of Code', value: 950000, icon: Code, color: '#00f2fe' },
    { id: 4, label: 'Bugs Fixed', value: 1337, icon: Bug, color: '#f83600' },
  ];

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
