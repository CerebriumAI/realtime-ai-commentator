import React from 'react';
import { Link } from 'react-router-dom';
import { Github, ExternalLink, ArrowRight, Play } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <main className="flex-grow">
        <div className="bg-[#EB3A6F] text-white">
          <div className="container mx-auto px-4 py-20">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl font-bold mb-6">Realtime AI commentator</h1>
              <p className="text-xl mb-8">See how a AI Model can commentate on videos in realtime with emotion</p>
              <Link
                to="/videos"
                className="inline-flex items-center px-6 py-3 bg-white text-[#EB3A6F] rounded-full font-semibold hover:bg-opacity-90 transition-colors"
              >
                <Play className="w-5 h-5 mr-2" />
                Start demo
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-10 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="flex justify-center gap-2 mb-12">
                <div className="bg-white rounded-full px-10 py-4 shadow-md flex items-center gap-6">
                  <a href="https://livekit.io/kitt" target="_blank" rel="noopener noreferrer">
                    <img src="/assets/livekit-logo.png" alt="LiveKit" className="h-9" />
                  </a>
                  <a href="https://www.cerebrium.ai/" target="_blank" rel="noopener noreferrer">
                    <img src="/assets/cerebrium-logo.svg" alt="Cerebrium" className="h-12" />
                  </a>
                  <a href="https://cartesia.ai/" target="_blank" rel="noopener noreferrer">
                    <img src="/assets/cartesia-logo.svg" alt="Cartesia" className="h-6" />
                  </a>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-center mb-12">Project Overview</h2>
              <div className="space-y-8">
                <p className="text-gray-600 text-lg">
                Experience the future of live narration with our AI commentator, capable of delivering dynamic, real-time commentary for sports, movie trailers, and more. Using cutting-edge AI models, it reacts instantly to events, bringing the excitement of live broadcasting to any scenario at Scale!
                </p>
                <p className="text-gray-600 text-lg">
                Built with LiveKit for real-time video, Cerebrium for scalable AI infrastructure, and Cartesia for expressive voice synthesis, this system delivers fluid, emotion-rich commentary without human intervention.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-400">
              © 2024 Project Name. All rights reserved.
            </div>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a
                href="https://github.com/yourusername/yourproject"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-gray-400 hover:text-white transition-colors"
              >
                <Github className="w-5 h-5 mr-2" />
                Source Code
              </a>
              <a
                href="https://yourblog.com/post"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-gray-400 hover:text-white transition-colors"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Blog Post
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;