import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MOOD_SONGS } from "../data/moods";
import { get } from "../../../backend/src/routes/mood";
import useSound from 'use-sound';
import song from '../../assets/music/song.mp3';


// function getRandomSong(mood) {
//   const songs = MOOD_SONGS[mood?.toLowerCase()] || []; // Ensure mood is case-insensitive
//   if (songs.length === 0) return null;
//   const randomIndex = Math.floor(Math.random() * songs.length);
//   return songs[randomIndex];
// }

function getSongPath() {
  return '../assets/music/song.mp3'; 
}
function Room() {
  const [searchParams] = useSearchParams();
  const mood = searchParams.get("mood") || "happy";
  const [song, setSong] = useState(null);
  const [path, setPath] = useState(null);
  const [loading, setLoading] = useState(false);
  const [playSong, { stop }] = useSound(song || ''); // Initialize useSound with the song path

  useEffect(() => {
    setPath(null);
    setSong(getRandomSong(mood));
  }, [mood]);

  const handlePlay = () => {
    if (song) {
      playSong(); // Play the song
    }
  };

  return (
    <div>
      <h2>Room</h2>
      <p>Mood: {mood}</p>

      {song ? (
        <div>
          <p>
            {song.artist} — {song.title}
          </p>
          <button onClick={handlePlay} disabled={loading}>
            Play
          </button>

          {preview?.url && (
            <>
              <p style={{ fontSize: 12, opacity: 0.7 }}>
                Preview provider: {"Spotify"}
              </p>
            </>
          )}
        </div>
      ) : (
        <p>No songs available for this mood.</p>
      )}
    </div>
  );
}

export default Room;