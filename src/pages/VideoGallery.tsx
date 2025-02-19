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
    title: "Big Buck Bunny Trailer",
    url: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnail: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80"
  },
  {
    id: 2,
    title: "Warriors vs Mavericks",
    url: "https://cerebrium-assets.s3.eu-west-1.amazonaws.com/basketball-game.mp4",
    thumbnail: "https://cerebrium-assets.s3.eu-west-1.amazonaws.com/basketball-thumbnail.png"
  },
];

const VideoGallery = () => {
  const [selectedVideo, setSelectedVideo] = useState(videos[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const roomRef = useRef<Room | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioElements = useRef<HTMLAudioElement[]>([]);
  const publishedTracksRef = useRef<LocalTrackPublication[]>([]);
  const [roomName, setRoomName] = useState(() => 
    `${selectedVideo.id === 1 ? 'movie' : 'basketball'}-${Math.random().toString(36).substring(2, 10)}`
  );


  useEffect(() => {
    if (roomName) {
      initializeRoom();
    }
    return () => {
      roomRef.current?.disconnect();
    };
  }, [roomName, selectedVideo]);

  const toggleAudio = (on: boolean) => {
    audioElements.current.forEach(audio => {
      if (on) {
        audio.play();
      } else {
        audio.pause();
      }
    });
  };

  const initializeRoom = async () => {
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        resolution: VideoPresets.h720.resolution,
      },
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

          toggleAudio(true);
          
          // Add detailed video element debugging
          console.log('Video element state:', {
            readyState: videoRef.current.readyState,
            error: videoRef.current.error,
            networkState: videoRef.current.networkState,
            paused: videoRef.current.paused,
            currentSrc: videoRef.current.currentSrc,
            videoWidth: videoRef.current.videoWidth,
            videoHeight: videoRef.current.videoHeight
          });

          // Check if capture methods exist
          console.log('Capture methods:', {
            captureStream: !!videoRef.current.captureStream,
            webkitCaptureStream: !!videoRef.current.webkitCaptureStream
          });

          const mediaStream = videoRef.current.captureStream 
          ? videoRef.current.captureStream()
          : videoRef.current.webkitCaptureStream();
          console.log(mediaStream);
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
            if (publication.track?.kind === 'audio') {
              toggleAudio(false);
            }
            if (publication.track) {
              await roomRef.current.localParticipant.unpublishTrack(publication.track);
            }
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
        if (publication.track) {
          await roomRef.current.localParticipant.unpublishTrack(publication.track);
        }
      }
      publishedTracksRef.current = [];
    }
  };

  const handleVideoSelect = async (video: typeof videos[0]) => {

    if (roomRef.current) {
      await roomRef.current.disconnect();
      roomRef.current = null;
    }

    audioElements.current = [];
    publishedTracksRef.current = [];

    const newRoomName = `${video.id === 1 ? 'movie' : 'basketball'}-${Math.random().toString(36).substring(2, 10)}`;
    setRoomName(newRoomName);
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
            playsInline
            className="w-full h-full object-contain"
            poster={selectedVideo.thumbnail}
            onPlay={() => handleVideoPlayPause(true)}
            onPause={() => handleVideoPlayPause(false)}
            onEnded={handleVideoEnd}
            crossOrigin="anonymous"
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