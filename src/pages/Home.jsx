import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Plus } from 'lucide-react';
import Countdown from '../components/Countdown';
import HorizontalTimeline from '../components/HorizontalTimeline';
import InteractiveTerminal from '../components/InteractiveTerminal';
import BranchStats from '../components/BranchStats';
import MessageBoard from '../components/MessageBoard';
import AlbumShelf from '../components/AlbumShelf';
import AddAlbumModal from '../components/AddAlbumModal';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [showAddAlbum, setShowAddAlbum] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  // June 10, 2027
  const graduationDate = '2027-06-10T00:00:00';

  const handleSelectAlbum = (album) => {
    setSelectedAlbum(album);
    // Smooth scroll down to digital yearbook section when album selected
    if (album) {
      setTimeout(() => {
        const boardEl = document.getElementById('digital-yearbook-section');
        if (boardEl) {
          boardEl.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

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

      {/* Albums Section — before Digital Yearbook sticky notes */}
      <section className="albums-section">
        <div className="container">
          <div className="section-header albums-section-header">
            <div>
              <h2 className="headline-lg text-primary">Digital Yearbook Albums</h2>
              <p className="body-md text-outline">Click an album to display its photos in the Digital Yearbook below.</p>
            </div>
            {isAdmin && (
              <button
                className="btn btn-primary home-add-album-btn"
                onClick={() => setShowAddAlbum(true)}
              >
                <Plus size={18} />
                New Album
              </button>
            )}
          </div>
          <AlbumShelf
            selectedAlbum={selectedAlbum}
            onSelectAlbum={handleSelectAlbum}
            onAddAlbum={() => setShowAddAlbum(true)}
          />
        </div>
      </section>

      {/* Message Board Section — Digital Yearbook sticky notes */}
      <section className="message-board-section">
        <div className="container">
          <MessageBoard
            selectedAlbum={selectedAlbum}
            onClearAlbum={() => setSelectedAlbum(null)}
          />
        </div>
      </section>

      {/* Add Album Modal */}
      {showAddAlbum && (
        <AddAlbumModal onClose={() => setShowAddAlbum(false)} />
      )}
    </div>
  );
};

export default Home;
