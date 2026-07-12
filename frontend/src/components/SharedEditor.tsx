import { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Socket } from 'socket.io-client';

interface SharedEditorProps {
  socket: Socket;
  roomId: string;
  readOnly: boolean;
  code: string;
  setCode: (code: string) => void;
}

export default function SharedEditor({ socket, roomId, readOnly, code, setCode, username }: SharedEditorProps) {
  const [isRemoteUpdate, setIsRemoteUpdate] = useState(false);
  const editorRef = useRef<any>(null);
  const decorationsRef = useRef<any>(null);
  const remoteCursorsRef = useRef<{[user: string]: {line: number, col: number}}>({});

  useEffect(() => {
    socket.on('code_update', ({ code: remoteCode }) => {
      setIsRemoteUpdate(true);
      setCode(remoteCode);
    });

    socket.on('cursor_move', ({ username: remoteUser, line, col }) => {
      if (remoteUser === username || !remoteUser) return;
      remoteCursorsRef.current = {
        ...remoteCursorsRef.current,
        [remoteUser]: { line, col }
      };
      updateDecorations();
    });

    return () => {
      socket.off('code_update');
      socket.off('cursor_move');
    };
  }, [socket, setCode, username]);

  const updateDecorations = () => {
    if (!decorationsRef.current || !editorRef.current) return;
    const decorations: any[] = [];
    const monaco = (window as any).monaco;
    if (!monaco) return;

    Object.entries(remoteCursorsRef.current).forEach(([user, pos]) => {
      decorations.push({
        range: new monaco.Range(pos.line, pos.col, pos.line, pos.col),
        options: {
          className: 'remote-cursor',
          hoverMessage: { value: `**${user}** is editing here` },
          isWholeLine: false,
        }
      });
    });
    decorationsRef.current.set(decorations);
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    (window as any).monaco = monaco; // Save monaco to window for updateDecorations
    decorationsRef.current = editor.createDecorationsCollection([]);
    
    editor.onDidChangeCursorPosition((e: any) => {
      if (!username) return;
      socket.emit('cursor_move', {
        roomId,
        username,
        line: e.position.lineNumber,
        col: e.position.column
      });
    });
  };

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
        onMount={handleEditorDidMount}
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
