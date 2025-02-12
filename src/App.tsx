import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import VideoGallery from './pages/VideoGallery';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/videos" element={<VideoGallery />} />
      </Routes>
    </Router>
  );
}

export default App;