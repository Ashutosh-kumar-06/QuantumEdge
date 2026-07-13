import { useEffect, useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Socket } from 'socket.io-client';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import FileExplorer from './FileExplorer';

interface SharedEditorProps {
  socket: Socket;
  roomId: string;
  readOnly: boolean;
  username: string;
  onFilesChange?: (files: { [path: string]: string }) => void;
  onActiveFileChange?: (file: string) => void;
}

export default function SharedEditor({ roomId, readOnly, username, onFilesChange, onActiveFileChange }: SharedEditorProps) {
  const editorRef = useRef<any>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  
  const [activeFile, setActiveFile] = useState('main.py');
  const [filesList, setFilesList] = useState<{ [path: string]: string }>({ 'main.py': '' });

  const notifyFilesChange = (doc: Y.Doc, currentFilesMeta: Map<string, any>) => {
    if (!onFilesChange) return;
    const res: { [path: string]: string } = {};
    currentFilesMeta.forEach((val, key) => {
      if (val) res[key] = doc.getText(key).toString();
    });
    onFilesChange(res);
  };

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

    const filesMeta = ydoc.getMap('files_meta');
    
    // Initialize if empty
    provider.on('sync', (isSynced: boolean) => {
      if (isSynced && Array.from(filesMeta.keys()).length === 0) {
        filesMeta.set('main.py', true);
        ydoc.getText('main.py').insert(0, '// Write your code here!\n');
      }
    });

    filesMeta.observe(() => {
      const newList: { [path: string]: string } = {};
      filesMeta.forEach((val, key) => {
        if (val) newList[key] = ydoc.getText(key).toString();
      });
      setFilesList(newList);
      notifyFilesChange(ydoc, filesMeta as any);
    });

    return () => {
      bindingRef.current?.destroy();
      provider.destroy();
      ydoc.destroy();
    };
  }, [roomId, username]);

  // Handle active file changing
  useEffect(() => {
    if (!editorRef.current || !ydocRef.current || !providerRef.current) return;
    
    // Destroy old binding
    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    const type = ydocRef.current.getText(activeFile);
    
    bindingRef.current = new MonacoBinding(
      type,
      editorRef.current.getModel(),
      new Set([editorRef.current]),
      providerRef.current.awareness
    );
    
    if (onActiveFileChange) onActiveFileChange(activeFile);
  }, [activeFile]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Prevent save
    });

    if (ydocRef.current && providerRef.current) {
      const type = ydocRef.current.getText(activeFile);
      bindingRef.current = new MonacoBinding(
        type,
        editor.getModel(),
        new Set([editor]),
        providerRef.current.awareness
      );
    }
  };

  const handleEditorChange = () => {
    if (ydocRef.current) {
      notifyFilesChange(ydocRef.current, ydocRef.current.getMap('files_meta') as any);
    }
  };

  const handleFileCreate = (filename: string) => {
    if (readOnly || !ydocRef.current) return;
    ydocRef.current.getMap('files_meta').set(filename, true);
    if (!filename.endsWith('/')) {
      setActiveFile(filename);
    }
  };

  const handleFileDelete = (filename: string) => {
    if (readOnly || !ydocRef.current) return;
    ydocRef.current.getMap('files_meta').delete(filename);
    if (activeFile === filename) {
      const remaining = Array.from(ydocRef.current.getMap('files_meta').keys());
      if (remaining.length > 0) setActiveFile(remaining[0]);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden' }}>
      <div style={{ width: '250px', flexShrink: 0, borderRight: '1px solid #333' }}>
        <FileExplorer 
          files={filesList} 
          activeFile={activeFile} 
          onFileSelect={setActiveFile} 
          onFileCreate={handleFileCreate} 
          onFileDelete={handleFileDelete} 
        />
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        {readOnly && (
          <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, background: 'rgba(255,50,50,0.8)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
            READ-ONLY (Ask Owner for Edit Permission)
          </div>
        )}
        <Editor
          height="100%"
          path={activeFile}
          defaultLanguage={activeFile.endsWith('.cpp') ? 'cpp' : 'python'}
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
    </div>
  );
}
