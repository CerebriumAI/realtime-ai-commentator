import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom'; // Add Navigate import
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Room,
  RoomEvent,
  VideoPresets,
  Track,
  LocalTrackPublication,
} from 'livekit-client';

const videos = [
  {
    id: 1,
    title: "Big Buck Bunny",
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnail: "https://images.unsplash.com/photo-1536240478700-b869070f9279?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80"
  },
  {
    id: 2,
    title: "Elephant Dream",
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnail: "https://images.unsplash.com/photo-1485846234645-a62644f84728?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80"
  },
  {
    id: 3,
    title: "Sintel",
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    thumbnail: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80"
  }
];

const VideoGallery = () => {
  const location = useLocation();
  const roomName = location.state?.roomName;
  const [selectedVideo, setSelectedVideo] = useState(videos[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const roomRef = useRef<Room | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioElements = useRef<HTMLAudioElement[]>([]);
  const publishedTracksRef = useRef<LocalTrackPublication[]>([]);

  if (!roomName) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    if (roomName) {
      initializeRoom();
    }
    return () => {
      roomRef.current?.disconnect();
    };
  }, [roomName]);

  const cleanupAudio = () => {
    audioElements.current.forEach(audio => {
      audio.pause();
      audio.srcObject = null;
      audio.remove();
    });
    audioElements.current = [];
  };

  const initializeRoom = async () => {
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        resolution: VideoPresets.h720.resolution,
      },
      reconnect: true,
      maxRetries: 3,
    });

    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      console.log('Track subscribed:', track.kind);
      if (track.kind === 'audio') {
        const audioElement = track.attach();
        audioElement.volume = 1.0;  // Ensure volume is up
        
        // Store the audio element so we can control it later
        audioElements.current.push(audioElement);
      }
    });
    

    try {

      const apiUrl = import.meta.env.VITE_API_URL;
      const authToken = import.meta.env.VITE_AUTH_TOKEN;
      const livekitUrl = import.meta.env.VITE_LIVEKIT_WS_URL;

      // Get token from your backend
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'Origin': window.location.origin,
        },
        body: JSON.stringify({
          room_name: roomName,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token request failed: ${response.statusText}`);
      }

      const { result: { token } } = await response.json();
      
      // For local development, use ws:// instead of wss:// if not on HTTPS
      
      console.log('Connecting to LiveKit server:', livekitUrl);
      
      await room.connect(livekitUrl, token, {
        autoSubscribe: true,
        rtcConfig: {
          iceTransportPolicy: 'all',
          iceServers: []
        }
      });

      console.log('Connected to room:', room.name);
      roomRef.current = room;

    } catch (error) {
      console.error('Connection failed:', error);
      // Add more detailed error logging
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
    }
  };

  const handleVideoPlayPause = async (isPlaying: boolean) => {
    console.log(isPlaying ? 'Video playing' : 'Video paused');
    setIsPlaying(isPlaying);

    if (roomRef.current) {
      if (isPlaying && videoRef.current) {
        try {
          const mediaStream = videoRef.current.captureStream();
          const videoTrack = mediaStream.getVideoTracks()[0];
          const audioTrack = mediaStream.getAudioTracks()[0];
          
          // Store published tracks for cleanup
          publishedTracksRef.current = [];
          
          if (videoTrack) {
            console.log('publishing video track');
            const publishedVideo = await roomRef.current.localParticipant.publishTrack(videoTrack, {
              source: Track.Source.Unknown,
              stopMicTrackOnMute: true,
            });
            publishedTracksRef.current.push(publishedVideo);
          }
          if (audioTrack) {
            console.log('publishing audio track');
            const publishedAudio = await roomRef.current.localParticipant.publishTrack(audioTrack, {
              source: Track.Source.Unknown,
              name: 'audio-playback',
              dtx: true,
              forceStereo: true,
              red: true,
              stopMicTrackOnMute: false
            });
            publishedTracksRef.current.push(publishedAudio);
          }
        } catch (error) {
          console.error('Error publishing video:', error);
        }
      } else {
        // Cleanup published tracks when video is paused
        console.log(roomRef.current?.localParticipant.trackPublications);
        for (const publication of publishedTracksRef.current) {
          try {
            console.log('Attempting to unpublish track with SID:', publication.trackSid);
            if (publication.track.kind === 'audio') {
              cleanupAudio();
            }
            await roomRef.current.localParticipant.unpublishTrack(publication.track);
          } catch (error) {
            console.warn('Error unpublishing track:', error);
          }
        }
        publishedTracksRef.current = [];
      }
    }
  };

  const handleVideoEnd = async () => {
    console.log('Video ended');
    setIsPlaying(false);
    // Cleanup published tracks
    if (roomRef.current) {
      for (const publication of publishedTracksRef.current) {
        await roomRef.current.localParticipant.unpublishTrack(publication);
      }
      publishedTracksRef.current = [];
    }
  };

  const handleVideoSelect = (video: typeof videos[0]) => {
    setSelectedVideo(video);
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center text-gray-400 hover:text-white mb-8">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Link>

        {/* Main Video Player */}
        <div className="max-w-4xl mx-auto">
          <div className="aspect-w-16 aspect-h-9 bg-black rounded-lg overflow-hidden mb-8">
          <video
            ref={videoRef}
            key={selectedVideo.url}
            controls
            muted
            className="w-full h-full object-contain"
            poster={selectedVideo.thumbnail}
            onPlay={() => handleVideoPlayPause(true)}
            onPause={() => handleVideoPlayPause(false)}
            onEnded={handleVideoEnd}
            crossOrigin="anonymous"  // Add this line
          >
            <source src={selectedVideo.url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Other videos</h2>

          {/* Video Carousel */}
          <div className="relative mt-8">
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className={`flex-none w-64 cursor-pointer transition-transform transform hover:scale-105 ${
                    selectedVideo.id === video.id ? 'ring-2 ring-[#EB3A6F]' : ''
                  }`}
                  onClick={() => handleVideoSelect(video)}
                >
                  <div className="aspect-w-16 aspect-h-9 mb-2">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <h3 className="text-sm font-medium">{video.title}</h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoGallery;