import React, { useState, useMemo } from 'react';

interface FileExplorerProps {
  files: { [filename: string]: string };
  activeFile: string;
  onFileSelect: (filename: string) => void;
  onFileCreate: (filename: string) => void;
  onFileDelete: (filename: string) => void;
}

type FileNode = {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children: { [name: string]: FileNode };
};

export default function FileExplorer({ files, activeFile, onFileSelect, onFileCreate, onFileDelete }: FileExplorerProps) {
  const [newFileName, setNewFileName] = useState('');
  const [isCreatingFile, setIsCreatingFile] = useState<string | null>(null); // null, or path of parent folder
  const [isCreatingFolder, setIsCreatingFolder] = useState<string | null>(null);
  
  const [expandedFolders, setExpandedFolders] = useState<{ [path: string]: boolean }>({ '': true });

  // Build tree from flat paths
  const tree = useMemo(() => {
    const root: FileNode = { name: 'root', path: '', type: 'folder', children: {} };
    
    Object.keys(files).forEach(filePath => {
      const parts = filePath.split('/');
      let current = root;
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!part) continue;
        
        const isFile = i === parts.length - 1 && !filePath.endsWith('/');
        const path = parts.slice(0, i + 1).join('/') + (isFile ? '' : '/');
        
        if (!current.children[part]) {
          current.children[part] = {
            name: part,
            path: path,
            type: isFile ? 'file' : 'folder',
            children: {}
          };
        }
        current = current.children[part];
      }
    });
    return root;
  }, [files]);

  const toggleFolder = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const handleCreateSubmit = (type: 'file' | 'folder', parentPath: string) => {
    if (newFileName.trim()) {
      const fullPath = parentPath + newFileName.trim() + (type === 'folder' ? '/' : '');
      onFileCreate(fullPath);
      setNewFileName('');
      if (type === 'file') setIsCreatingFile(null);
      if (type === 'folder') setIsCreatingFolder(null);
      setExpandedFolders(prev => ({ ...prev, [parentPath]: true }));
    }
  };

  const renderNode = (node: FileNode, level: number = 0) => {
    if (node.name === 'root') {
      return Object.values(node.children).sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name);
      }).map(child => renderNode(child, 0));
    }

    const isExpanded = expandedFolders[node.path];
    const isActive = activeFile === node.path;
    const paddingLeft = `${level * 1.2 + 0.5}rem`;

    return (
      <div key={node.path}>
        <div 
          onClick={() => node.type === 'file' ? onFileSelect(node.path) : toggleFolder(node.path, { stopPropagation: () => {} } as any)}
          style={{ 
            padding: `0.3rem 0.5rem`,
            paddingLeft,
            cursor: 'pointer', 
            background: isActive ? 'rgba(69, 243, 255, 0.1)' : 'transparent',
            borderLeft: isActive ? '2px solid var(--primary)' : '2px solid transparent',
            color: isActive ? '#fff' : '#aaa',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.85rem'
          }}
          onMouseEnter={(e) => {
            (e.currentTarget.lastChild as HTMLElement).style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            if (!isActive) (e.currentTarget.lastChild as HTMLElement).style.opacity = '0';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {node.type === 'folder' ? (
              <span style={{ fontSize: '0.7rem', width: '12px' }}>{isExpanded ? '▼' : '▶'}</span>
            ) : (
              <span style={{ width: '12px' }}></span>
            )}
            <span>{node.type === 'folder' ? '📁' : '📄'}</span>
            <span>{node.name}</span>
          </div>

          <div style={{ display: 'flex', gap: '4px', opacity: isActive ? 1 : 0, transition: 'opacity 0.1s' }}>
            {node.type === 'folder' && (
              <>
                <button title="New File" onClick={(e) => { e.stopPropagation(); setIsCreatingFile(node.path); setExpandedFolders(prev => ({ ...prev, [node.path]: true })); }} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>📝</button>
                <button title="New Folder" onClick={(e) => { e.stopPropagation(); setIsCreatingFolder(node.path); setExpandedFolders(prev => ({ ...prev, [node.path]: true })); }} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>📁</button>
              </>
            )}
            <button title="Delete" onClick={(e) => { e.stopPropagation(); onFileDelete(node.path); }} style={{ background: 'none', border: 'none', color: '#ff5555', cursor: 'pointer' }}>×</button>
          </div>
        </div>

        {node.type === 'folder' && isExpanded && (
          <div>
            {isCreatingFile === node.path && (
              <div style={{ padding: `0.3rem 0.5rem`, paddingLeft: `${(level + 1) * 1.2 + 0.5}rem` }}>
                <input autoFocus type="text" value={newFileName} onChange={e => setNewFileName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateSubmit('file', node.path)} onBlur={() => setIsCreatingFile(null)} placeholder="file.py" style={{ width: '100%', background: '#000', color: '#fff', border: '1px solid var(--primary)', outline: 'none', fontSize: '0.85rem' }} />
              </div>
            )}
            {isCreatingFolder === node.path && (
              <div style={{ padding: `0.3rem 0.5rem`, paddingLeft: `${(level + 1) * 1.2 + 0.5}rem` }}>
                <input autoFocus type="text" value={newFileName} onChange={e => setNewFileName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateSubmit('folder', node.path)} onBlur={() => setIsCreatingFolder(null)} placeholder="folderName" style={{ width: '100%', background: '#000', color: '#fff', border: '1px solid var(--primary)', outline: 'none', fontSize: '0.85rem' }} />
              </div>
            )}
            {Object.values(node.children).sort((a, b) => {
              if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
              return a.name.localeCompare(b.name);
            }).map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ height: '100%', background: '#111', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '0.8rem', background: '#1a1a1a', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ color: '#aaa', margin: 0, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>EXPLORER</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button title="New Root File" onClick={() => setIsCreatingFile('')} style={{ background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0' }}>📝</button>
          <button title="New Root Folder" onClick={() => setIsCreatingFolder('')} style={{ background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0' }}>📁</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0' }}>
        {isCreatingFile === '' && (
          <div style={{ padding: '0.5rem' }}>
            <input autoFocus type="text" value={newFileName} onChange={e => setNewFileName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateSubmit('file', '')} onBlur={() => setIsCreatingFile(null)} placeholder="main.py" style={{ width: '100%', background: '#000', color: '#fff', border: '1px solid var(--primary)', padding: '4px', outline: 'none' }} />
          </div>
        )}
        {isCreatingFolder === '' && (
          <div style={{ padding: '0.5rem' }}>
            <input autoFocus type="text" value={newFileName} onChange={e => setNewFileName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateSubmit('folder', '')} onBlur={() => setIsCreatingFolder(null)} placeholder="src" style={{ width: '100%', background: '#000', color: '#fff', border: '1px solid var(--primary)', padding: '4px', outline: 'none' }} />
          </div>
        )}
        
        {renderNode(tree)}
      </div>
    </div>
  );
}
