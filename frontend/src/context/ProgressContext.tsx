import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface ProgressContextType {
  completedModules: string[];
  markCompleted: (moduleId: string) => void;
  isCompleted: (moduleId: string) => boolean;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [completedModules, setCompletedModules] = useState<string[]>([]);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('quantumEdgeProgress');
      if (saved) {
        setCompletedModules(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to parse progress from local storage", e);
    }
  }, []);

  // Save to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('quantumEdgeProgress', JSON.stringify(completedModules));
    // Also save as cookie for full browser tracking support
    document.cookie = `quantumEdgeProgress=${JSON.stringify(completedModules)}; path=/; max-age=31536000`;
  }, [completedModules]);

  // Generate or load a unique username for the leaderboard
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    let savedUser = localStorage.getItem('quantumEdgeUser');
    let displayUsername = '';
    
    if (!savedUser) {
      displayUsername = 'QuantumExplorer_' + Math.floor(Math.random() * 10000);
      // We don't save it to quantumEdgeUser to avoid overwriting auth state
    } else {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.email) {
          displayUsername = parsed.email.split('@')[0];
        } else {
          displayUsername = savedUser;
        }
      } catch (e) {
        displayUsername = savedUser;
      }
    }
    setUsername(displayUsername);
  }, []);

  const markCompleted = async (moduleId: string) => {
    setCompletedModules(prev => {
      if (!prev.includes(moduleId)) {
        // Sync with backend asynchronously
        if (username) {
          fetch(`${import.meta.env.VITE_API_URL}/api/progress/${username}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ moduleId, completed: true })
          }).catch(err => console.error("Failed to sync progress:", err));
        }
        return [...prev, moduleId];
      }
      return prev;
    });
  };

  const isCompleted = (moduleId: string) => {
    return completedModules.includes(moduleId);
  };

  return (
    <ProgressContext.Provider value={{ completedModules, markCompleted, isCompleted }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
}
