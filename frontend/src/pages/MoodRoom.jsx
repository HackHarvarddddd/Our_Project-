import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import useSound from 'use-sound';
import api from '../api';

function Room() {
  const [searchParams] = useSearchParams();
  const mood = searchParams.get("mood") || "Calm"; // Hardcoded mood
  const [users, setUsers] = useState([
    { id: "1", name: "Alice", summary: "Loves peaceful walks in nature." },
    { id: "2", name: "Bob", summary: "Enjoys meditating and yoga." },
    { id: "3", name: "Charlie", summary: "Finds calmness in painting." }
  ]); // Hardcoded users
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false); // State to track if the song is playing
  const [playSong, { stop }] = useSound('../../assets/music/song.mp3'); // Directly use the song path
  const [userId, setUserId] = useState(null); // State to store the current user ID
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUserId() {
      try {
        const response = await api.get('/auth/me'); // Fetch user data
        setUserId(response.data.user.id); // Set the user ID
      } catch (e) {
        console.error('Error fetching user ID:', e);
        setError('Failed to fetch user ID. Please log in again.');
      }
    }
    fetchUserId();
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      stop(); // Stop the song
    } else {
      playSong(); // Play the song
    }
    setIsPlaying(!isPlaying); // Toggle the play state
  };

  const inviteUser = async (user) => {
    try {
      if (!userId) {
        throw new Error('User ID is missing. Please log in again.');
      }
      const newInvite = {
        id: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_a: userId,
        user_b: user.id,
        partnerUserId: user.id,
        partner_name: user.name,
        event_id: 'evt_rock_1',
        start_iso: new Date().toISOString(),
        end_iso: new Date(Date.now() + 3600000).toISOString(),
        location: "Virtual Meeting Room",
        notes: `Meeting with ${user.name}`
      };

      console.log('Sending invite:', newInvite);
      await api.post('/schedule', newInvite);
      navigate('/home');
    } catch (e) {
      console.error('Error sending invite:', e);
      const errorMessage = e.response?.data?.error || e.response?.data?.message || e.message;
      setError('Failed to send invite. Please try again. ' + errorMessage);
    }
  };

  return (
    <div>
      <h2>Mood Room</h2>
      <p>Mood: {mood}</p>
      <p>Song: "Happy by Pharrell Williams"</p>
      <button onClick={togglePlay}>{isPlaying ? "Stop" : "Play"}</button> {/* Toggle button text */}
      {error && <p className="error" style={{ color: 'red' }}>{error}</p>} {/* Display error */}
      <div>
        <h3>Users with the same mood:</h3>
        {users.length === 0 ? (
          <p>No users found with the same mood.</p>
        ) : (
          users.map(user => (
            <div key={user.id} className="user-card">
              <strong>{user.name}</strong>
              <p>{user.summary}</p>
              <button onClick={() => inviteUser(user)}>Invite to Schedule</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Room;