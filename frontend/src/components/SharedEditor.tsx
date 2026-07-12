import { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Socket } from 'socket.io-client';

interface SharedEditorProps {
  socket: Socket;
  roomId: string;
  readOnly: boolean;
}

export default function SharedEditor({ socket, roomId, readOnly }: SharedEditorProps) {
  const [code, setCode] = useState('// Welcome to the Shared Code Editor\n');
  const [isRemoteUpdate, setIsRemoteUpdate] = useState(false);

  useEffect(() => {
    socket.on('code_update', ({ code: remoteCode }) => {
      setIsRemoteUpdate(true);
      setCode(remoteCode);
    });
    return () => {
      socket.off('code_update');
    };
  }, [socket]);

  const handleEditorChange = (val: string | undefined) => {
    const newCode = val || '';
    if (!isRemoteUpdate && !readOnly) {
      socket.emit('code_update', { roomId, code: newCode });
    }
    setCode(newCode);
    setIsRemoteUpdate(false);
  };

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      {readOnly && (
        <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, background: 'rgba(255,50,50,0.8)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
          READ-ONLY (Ask Owner for Edit Permission)
        </div>
      )}
      <Editor
        height="100%"
        defaultLanguage="python"
        theme="vs-dark"
        value={code}
        onChange={handleEditorChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          padding: { top: 16 },
          readOnly: readOnly,
          automaticLayout: true
        }}
      />
    </div>
  );
}
