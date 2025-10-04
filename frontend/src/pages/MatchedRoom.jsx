import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RoomProvider, useStorage, useMutation, useMyPresence, useOthers, useBroadcastEvent, useEventListener } from '../lib/liveblocks.js';
import '../styles/MatchedRoom.css';

// Canvas component that uses Liveblocks for real-time collaboration
function Canvas() {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [myPresence, setMyPresence] = useMyPresence();
  const others = useOthers();

  // Get the canvas storage from Liveblocks
  const canvasData = useStorage((root) => root.canvasData);

  // Mutation to update canvas data
  const updateCanvas = useMutation(({ storage }, newData) => {
    storage.set("canvasData", newData);
  }, []);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 600;

    // Set up canvas context
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';

    // Load existing canvas data
    if (canvasData) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = canvasData;
    }
  }, [canvasData]);

  // Handle drawing
  const startDrawing = useCallback((e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    setMyPresence({ cursor: { x, y }, isDrawing: true });
  }, [setMyPresence]);

  const draw = useCallback((e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
    
    setMyPresence({ cursor: { x, y }, isDrawing: true });
  }, [isDrawing, setMyPresence]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    setMyPresence({ cursor: null, isDrawing: false });
    
    // Save canvas state to Liveblocks
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL();
    updateCanvas(dataURL);
  }, [isDrawing, setMyPresence, updateCanvas]);

  // Handle other users' cursors
  const drawOthersCursors = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear previous cursors
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Redraw canvas content
    if (canvasData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        drawCursors(ctx);
      };
      img.src = canvasData;
    } else {
      drawCursors(ctx);
    }
  }, [canvasData]);

  const drawCursors = (ctx) => {
    others.forEach(({ presence }) => {
      if (presence?.cursor) {
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(presence.cursor.x, presence.cursor.y, 5, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
  };

  useEffect(() => {
    drawOthersCursors();
  }, [others, drawOthersCursors]);

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        style={{
          border: '2px solid #ccc',
          cursor: 'crosshair',
          backgroundColor: 'white'
        }}
      />
      <div className="canvas-tools">
        <button onClick={() => {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          updateCanvas(null);
        }}>
          Clear Canvas
        </button>
      </div>
    </div>
  );
}

// Chat component for real-time messaging
function Chat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const broadcastEvent = useBroadcastEvent();
  const useEventListener = useEventListener();

  const sendMessage = useCallback(() => {
    if (!message.trim()) return;
    
    const messageData = { 
      type: 'message', 
      content: message, 
      timestamp: Date.now(),
      user: 'You' // This should come from user context
    };
    broadcastEvent(messageData);
    setMessages(prev => [...prev, messageData]);
    setMessage('');
  }, [message, broadcastEvent]);

  useEventListener(({ event }) => {
    if (event.type === 'message') {
      setMessages(prev => [...prev, event]);
    }
  });

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className="message">
            <strong>{msg.user}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

// Main MatchedRoom component
function MatchedRoom() {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('roomId');
  const partnerName = searchParams.get('partnerName');
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  if (!roomId) {
    return <div>No room ID provided</div>;
  }

  return (
    <RoomProvider 
      id={roomId} 
      initialPresence={{ cursor: null, isDrawing: false }}
      onConnectionStatusChange={(status) => setConnectionStatus(status)}
    >
      <div className="matched-room">
        <header className="room-header">
          <h2>Collaborative Room with {partnerName}</h2>
          <div className="room-info">
            <span>Room ID: {roomId}</span>
            <span>Status: {connectionStatus}</span>
          </div>
        </header>
        
        <div className="room-content">
          <div className="canvas-section">
            <h3>Collaborative Canvas</h3>
            <Canvas />
          </div>
          
          <div className="chat-section">
            <h3>Chat</h3>
            <Chat />
          </div>
        </div>
      </div>
    </RoomProvider>
  );
}

export default MatchedRoom;
