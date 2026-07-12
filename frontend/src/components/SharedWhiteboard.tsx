import React, { useEffect, useState, useRef } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import { Socket } from 'socket.io-client';

interface SharedWhiteboardProps {
  socket: Socket;
  roomId: string;
  readOnly: boolean;
  username: string;
}

export default function SharedWhiteboard({ socket, roomId, readOnly, username }: SharedWhiteboardProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const isRemoteUpdateRef = useRef(false);
  const lastEmitTimeRef = useRef(0);

  useEffect(() => {
    socket.on('whiteboard_update', ({ elements, remoteUsername }) => {
      if (remoteUsername === username || !excalidrawAPI) return;
      
      isRemoteUpdateRef.current = true;
      excalidrawAPI.updateScene({ elements });
      
      // Reset the flag shortly after
      setTimeout(() => {
        isRemoteUpdateRef.current = false;
      }, 50);
    });
    
    return () => {
      socket.off('whiteboard_update');
    };
  }, [socket, username, excalidrawAPI]);

  const handleChange = (elements: readonly any[], appState: any) => {
    if (isRemoteUpdateRef.current) return;
    
    // Throttle emits to avoid flooding the socket (every 100ms)
    const now = Date.now();
    if (now - lastEmitTimeRef.current > 100) {
      socket.emit('whiteboard_update', { roomId, username, elements });
      lastEmitTimeRef.current = now;
    }
  };

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      {readOnly && (
        <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10, background: 'rgba(255,50,50,0.8)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
          READ-ONLY (Ask Owner for Edit Permission)
        </div>
      )}
      <Excalidraw 
        excalidrawAPI={(api) => setExcalidrawAPI(api)} 
        onChange={handleChange}
        viewModeEnabled={readOnly}
        theme="dark"
        UIOptions={{
          canvasActions: {
            changeViewBackgroundColor: false,
            clearCanvas: !readOnly,
            loadScene: false,
            saveToActiveFile: false,
            toggleTheme: false,
            saveAsImage: true
          }
        }}
      />
    </div>
  );
}
