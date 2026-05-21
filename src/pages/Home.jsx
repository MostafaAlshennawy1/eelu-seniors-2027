import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import Countdown from '../components/Countdown';
import HorizontalTimeline from '../components/HorizontalTimeline';
import InteractiveTerminal from '../components/InteractiveTerminal';
import BranchStats from '../components/BranchStats';
import MessageBoard from '../components/MessageBoard';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  // June 10, 2027
  const graduationDate = '2027-06-10T00:00:00';

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="badge label-caps">Class of 2027</div>
            <h1 className="headline-xl hero-title">
              EELU Computer Science <br />
              <span className="text-primary">Seniors 2027</span>
            </h1>
            <p className="body-lg hero-subtitle">
              The Countdown to Greatness
            </p>

            <Countdown targetDate={graduationDate} />

            <div className="hero-action">
              <button className="btn btn-primary btn-large" onClick={() => navigate('/memories')}>
                <Camera size={20} />
                Explore Memories Gallery
              </button>
            </div>
            
            <InteractiveTerminal />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <BranchStats />
        </div>
      </section>

      {/* Timeline Section */}
      <section className="timeline-section">
        <div className="container">
          <div className="section-header">
            <h2 className="headline-lg text-secondary">Our Journey</h2>
            <p className="body-md text-outline">From the beginning to the gala, tracking our milestones.</p>
          </div>
          <HorizontalTimeline />
        </div>
      </section>

      {/* Message Board Section */}
      <section className="message-board-section">
        <div className="container">
          <MessageBoard />
        </div>
      </section>
    </div>
  );
};

export default Home;
