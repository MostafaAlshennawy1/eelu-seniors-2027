import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GraduationCap, Image as ImageIcon } from 'lucide-react';
import './TopNavigation.css';

const TopNavigation = () => {
  const location = useLocation();

  return (
    <nav className="top-nav">
      <div className="container nav-content">
        <Link to="/" className="brand">
          <GraduationCap className="brand-icon" />
          <span className="brand-text">EELU Seniors '27</span>
        </Link>
        <div className="nav-links">
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Home
          </Link>
          <Link 
            to="/memories" 
            className={`nav-link ${location.pathname === '/memories' ? 'active' : ''}`}
          >
            <ImageIcon size={18} />
            Memories
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default TopNavigation;
