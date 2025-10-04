import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomAPI } from '../api.js';

function MatchRoomButton({ match }) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const createRoom = async () => {
    setIsCreating(true);
    setError(null);
    
    try {
      console.log('Creating room for user:', match.user_id);
      const response = await roomAPI.createRoom(match.user_id);
      console.log('Room creation response:', response.data);
      const { roomId, partnerName } = response.data;
      
      // Navigate to the real-time matched room
      navigate(`/matched-room?roomId=${roomId}&partnerName=${encodeURIComponent(partnerName)}`);
    } catch (error) {
      console.error('Room creation error:', error);
      setError(error.response?.data?.error || 'Failed to create room');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="match-room-button">
      <button 
        onClick={createRoom} 
        disabled={isCreating}
        className="create-room-btn"
      >
        {isCreating ? 'Creating Room...' : 'Start Collaborative Room'}
      </button>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default MatchRoomButton;
