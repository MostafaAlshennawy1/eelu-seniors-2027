import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TopNavigation from './components/TopNavigation';
import Home from './pages/Home';
import Memories from './pages/Memories';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <TopNavigation />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/memories" element={<Memories />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
