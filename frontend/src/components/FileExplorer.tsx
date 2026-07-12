import React, { useState } from 'react';

interface FileExplorerProps {
  files: { [filename: string]: string };
  activeFile: string;
  onFileSelect: (filename: string) => void;
  onFileCreate: (filename: string) => void;
  onFileDelete: (filename: string) => void;
}

export default function FileExplorer({ files, activeFile, onFileSelect, onFileCreate, onFileDelete }: FileExplorerProps) {
  const [newFileName, setNewFileName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = () => {
    if (newFileName.trim()) {
      onFileCreate(newFileName.trim());
      setNewFileName('');
      setIsCreating(false);
    }
  };

  return (
    <div style={{ height: '100%', background: '#111', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '0.8rem', background: '#1a1a1a', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ color: '#aaa', margin: 0, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>EXPLORER</h4>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          style={{ background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px' }}
        >
          +
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0' }}>
        {isCreating && (
          <div style={{ padding: '0.5rem' }}>
            <input 
              autoFocus
              type="text" 
              value={newFileName}
              onChange={e => setNewFileName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              onBlur={() => setIsCreating(false)}
              placeholder="filename.py"
              style={{ width: '100%', background: '#000', color: '#fff', border: '1px solid var(--primary)', padding: '4px', outline: 'none' }}
            />
          </div>
        )}

        {Object.keys(files).map(filename => (
          <div 
            key={filename}
            onClick={() => onFileSelect(filename)}
            style={{ 
              padding: '0.4rem 1rem', 
              cursor: 'pointer', 
              background: activeFile === filename ? 'rgba(69, 243, 255, 0.1)' : 'transparent',
              borderLeft: activeFile === filename ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeFile === filename ? '#fff' : '#888',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span style={{ fontSize: '0.9rem' }}>📄 {filename}</span>
            {Object.keys(files).length > 1 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onFileDelete(filename);
                }}
                style={{ background: 'transparent', color: '#ff5555', border: 'none', cursor: 'pointer', opacity: activeFile === filename ? 1 : 0.2 }}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
