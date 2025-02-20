import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import VideoGallery from './pages/VideoGallery';
import { Analytics } from "@vercel/analytics/react"

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/videos" element={<VideoGallery />} />
        </Routes>
      </Router>
      <Analytics />
    </>
  );
}

export default App;