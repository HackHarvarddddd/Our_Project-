import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MOOD_SONGS } from '../../../backend/src/lib/moods';


function getRandomSong(mood) {
  const songs = MOOD_SONGS[mood] || [];
  if (songs.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * songs.length);
  return songs[randomIndex];
}

async function getPreviewUrl({ artist, title }, country = "US") {
  try {
    const term = encodeURIComponent(`${artist} ${title}`);
    const url = `/api/itunes?term=${term}&country=${country}`;
    const res = await fetch(url);
    const data = await res.json();

    // Pick the best match with a preview URL
    const best = data.results.find(r => r.previewUrl);
    return best?.previewUrl || null;
  } catch (error) {
    console.error("Error fetching preview URL:", error);
    return null;
  }
}

function Room() {
  const [searchParams] = useSearchParams();
  const mood = searchParams.get('mood');
  const [song, setSong] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    setSong(getRandomSong(mood));
  }, [mood]);

  const handlePlay = async () => {
    if (!song) {
      alert("No song to play.");
      return;
    }

    const url = await getPreviewUrl(song);
    if (!url) {
      alert("No preview found for that song.");
      return;
    }

    setPreviewUrl(url);
  };

  return (
    <div>
      <h2>Room</h2>
      <p>Mood: {mood}</p>
      {song ? (
        <div>
          <p>{song.artist} — {song.title}</p>
          <button onClick={handlePlay}>Play</button>
          {previewUrl && (
            <audio src={previewUrl} controls autoPlay />
          )}
        </div>
      ) : (
        <p>No songs available for this mood.</p>
      )}
    </div>
  );
}

export default Room;