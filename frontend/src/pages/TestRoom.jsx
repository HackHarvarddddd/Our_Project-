import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import '../styles/MatchedRoom.css';

// Simple test room without Liveblocks for debugging
function TestRoom() {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('roomId');
  const partnerName = searchParams.get('partnerName');
  
  console.log('TestRoom loaded with:', { roomId, partnerName });
  
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 600;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
  }, []);

  // Drawing functions
  const startDrawing = useCallback((e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, []);

  const draw = useCallback((e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    setMessages(prev => [...prev, { content: message, user: 'You', timestamp: Date.now() }]);
    setMessage('');
  };

  if (!roomId) {
    return <div>No room ID provided</div>;
  }

  return (
    <div className="matched-room">
      <header className="room-header">
        <h2>Test Collaborative Room with {partnerName}</h2>
        <div className="room-info">
          <span>Room ID: {roomId}</span>
          <span>Status: Connected (Test Mode)</span>
        </div>
      </header>
      
      <div className="room-content">
        <div className="canvas-section">
          <h3>Collaborative Canvas (Test Mode)</h3>
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
              <button onClick={clearCanvas}>Clear Canvas</button>
            </div>
          </div>
        </div>
        
        <div className="chat-section">
          <h3>Chat (Test Mode)</h3>
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
        </div>
      </div>
    </div>
  );
}

export default TestRoom;
