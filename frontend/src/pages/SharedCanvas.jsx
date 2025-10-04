import React, { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  RoomProvider,
  useMyPresence,
  useOthers,
  useBroadcastEvent,
  useEventListener,
  useMutation,
  useStorage,
  useUpdateMyPresence,
} from '../lib/liveblocks';
import api from '../api';

// Canvas component that will be wrapped by RoomProvider
function Canvas() {
  const { roomId } = useParams();
  const [myPresence, updateMyPresence] = useMyPresence();
  const others = useOthers();
  const [broadcastEvent] = useBroadcastEvent();
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedTool, setSelectedTool] = useState('pen');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);

  // Get canvas data from Liveblocks storage
  const canvasData = useStorage((root) => root.canvasData);

  // Mutation to update canvas data
  const updateCanvas = useMutation(({ storage }, newData) => {
    storage.set("canvasData", newData);
  }, []);

  // Handle drawing on canvas
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return; // Only left mouse button
    setIsDrawing(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newPath = {
      id: Date.now().toString(),
      tool: selectedTool,
      color: selectedColor,
      size: brushSize,
      points: [{ x, y }],
      timestamp: Date.now()
    };

    const currentData = canvasData || { paths: [] };
    updateCanvas({
      ...currentData,
      paths: [...(currentData.paths || []), newPath]
    });
  }, [selectedTool, selectedColor, brushSize, canvasData, updateCanvas]);

  const handleMouseMove = useCallback((e) => {
    if (!isDrawing) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const currentData = canvasData || { paths: [] };
    const lastPath = currentData.paths[currentData.paths.length - 1];
    if (lastPath) {
      const updatedPath = {
        ...lastPath,
        points: [...lastPath.points, { x, y }]
      };
      
      updateCanvas({
        ...currentData,
        paths: [...currentData.paths.slice(0, -1), updatedPath]
      });
    }
  }, [isDrawing, canvasData, updateCanvas]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    updateCanvas({ paths: [] });
  }, [updateCanvas]);

  // Draw path on canvas
  const drawPath = useCallback((path, ctx) => {
    if (!path.points || path.points.length === 0) return;
    
    ctx.beginPath();
    ctx.strokeStyle = path.color;
    ctx.lineWidth = path.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.moveTo(path.points[0].x, path.points[0].y);
    for (let i = 1; i < path.points.length; i++) {
      ctx.lineTo(path.points[i].x, path.points[i].y);
    }
    ctx.stroke();
  }, []);

  // Render canvas
  const renderCanvas = useCallback((canvas) => {
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (canvasData?.paths) {
      canvasData.paths.forEach(path => drawPath(path, ctx));
    }
  }, [canvasData, drawPath]);

  // Update canvas when data changes
  React.useEffect(() => {
    const canvas = document.getElementById('shared-canvas');
    if (canvas) {
      renderCanvas(canvas);
    }
  }, [canvasData, renderCanvas]);

  return (
    <div className="shared-canvas-container">
      <div className="canvas-toolbar">
        <div className="tool-section">
          <label>Tool:</label>
          <select value={selectedTool} onChange={(e) => setSelectedTool(e.target.value)}>
            <option value="pen">Pen</option>
            <option value="brush">Brush</option>
            <option value="eraser">Eraser</option>
          </select>
        </div>
        
        <div className="tool-section">
          <label>Color:</label>
          <input 
            type="color" 
            value={selectedColor} 
            onChange={(e) => setSelectedColor(e.target.value)}
          />
        </div>
        
        <div className="tool-section">
          <label>Size:</label>
          <input 
            type="range" 
            min="1" 
            max="20" 
            value={brushSize} 
            onChange={(e) => setBrushSize(Number(e.target.value))}
          />
          <span>{brushSize}px</span>
        </div>
        
        <button onClick={clearCanvas} className="clear-btn">Clear Canvas</button>
      </div>

      <div className="canvas-wrapper">
        <canvas
          id="shared-canvas"
          width={800}
          height={600}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            border: '2px solid #ddd',
            cursor: 'crosshair',
            backgroundColor: 'white'
          }}
        />
      </div>

      <div className="collaborators">
        <h4>Collaborators:</h4>
        <div className="user-list">
          <div className="user-item current-user">
            <div className="user-avatar" style={{ backgroundColor: '#4CAF50' }}></div>
            <span>You</span>
          </div>
          {others.map(({ connectionId, presence }) => (
            <div key={connectionId} className="user-item">
              <div className="user-avatar" style={{ backgroundColor: '#2196F3' }}></div>
              <span>User {connectionId}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Main component with RoomProvider
export default function SharedCanvas() {
  const { roomId } = useParams();
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    async function loadRoomData() {
      try {
        // Get room data from backend
        const response = await api.get(`/canvas/room/${roomId}`);
        setRoomData(response.data);
      } catch (error) {
        console.error('Failed to load room data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    if (roomId) {
      loadRoomData();
    }
  }, [roomId]);

  if (loading) {
    return <div className="loading">Loading canvas...</div>;
  }

  if (!roomData) {
    return <div className="error">Canvas room not found</div>;
  }

  return (
    <div className="shared-canvas-page">
      <div className="canvas-header">
        <h2>Shared Canvas</h2>
        <p>Room: {roomId}</p>
        <p>Collaborating with: {roomData.partnerName}</p>
      </div>
      
      <RoomProvider id={roomId} initialPresence={{ cursor: null }}>
        <Canvas />
      </RoomProvider>
    </div>
  );
}
