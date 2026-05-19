import React from 'react';
import { Rocket, BrainCircuit, Code, Award } from 'lucide-react';
import './HorizontalTimeline.css';

const timelineData = [
  {
    date: '1/10/2023',
    title: 'The Beginning',
    subtitle: 'Matriculation',
    icon: <Rocket size={24} />,
    color: 'blue'
  },
  {
    date: 'Spring 2025',
    title: 'Architecting Logic',
    subtitle: 'Core CS Concepts',
    icon: <BrainCircuit size={24} />,
    color: 'orange'
  },
  {
    date: 'Fall 2026',
    title: 'The Senior Capstone',
    subtitle: 'Building the Future',
    icon: <Code size={24} />,
    color: 'gold'
  },
  {
    date: '10/6/2027',
    title: 'Graduation',
    subtitle: 'The Gala',
    icon: <Award size={24} />,
    color: 'dark'
  }
];

const HorizontalTimeline = () => {
  return (
    <div className="timeline-wrapper">
      <div className="timeline-container">
        <div className="timeline-line"></div>
        {timelineData.map((item, index) => (
          <div className="timeline-item" key={index}>
            <div className={`timeline-icon-box ${item.color}`}>
              {item.icon}
            </div>
            <div className="timeline-content">
              <span className="timeline-date">{item.date}</span>
              <h3 className="timeline-title">{item.title}</h3>
              <p className="timeline-subtitle">{item.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HorizontalTimeline;
