import React, { useState } from 'react';
import LightboxGallery from '../components/LightboxGallery';
import './Memories.css';

const branches = [
  'All', 'Assiut', 'Ain_shams', 'Alex', 'Sohag', 'Menoufia', 'Tanta',
  'Ismailia', 'Fayoum', 'Beni_Suef', 'Minya', 'Qena', 'Hurghada', 'Sadat'
];

const Memories = () => {
  const [activeTab, setActiveTab] = useState('All');

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
