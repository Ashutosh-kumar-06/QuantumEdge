import { useEffect, useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Socket } from 'socket.io-client';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';

interface SharedEditorProps {
  socket: Socket;
  roomId: string;
  readOnly: boolean;
  code: string;
  setCode: (code: string) => void;
  username: string;
}

export default function SharedEditor({ roomId, readOnly, code, setCode, username }: SharedEditorProps) {
  const editorRef = useRef<any>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  useEffect(() => {
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const wsUrl = window.location.protocol === 'https:' 
      ? `wss://${window.location.host}/yjs` 
      : `ws://${window.location.host}/yjs`;

    const provider = new WebsocketProvider(wsUrl, roomId, ydoc);
    providerRef.current = provider;

    provider.awareness.setLocalStateField('user', {
      name: username,
      color: '#' + Math.floor(Math.random()*16777215).toString(16)
    });

    return () => {
      bindingRef.current?.destroy();
      provider.destroy();
      ydoc.destroy();
    };
  }, [roomId, username]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Just prevent default save
    });

    if (ydocRef.current && providerRef.current) {
      const type = ydocRef.current.getText('monaco');
      
      if (type.length === 0 && code) {
         type.insert(0, code);
      }

      bindingRef.current = new MonacoBinding(
        type,
        editor.getModel(),
        new Set([editor]),
        providerRef.current.awareness
      );
    }
  };

  const handleEditorChange = (val: string | undefined) => {
    setCode(val || '');
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
        onMount={handleEditorDidMount}
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
