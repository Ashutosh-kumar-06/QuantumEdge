import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

  const markCompleted = (moduleId: string) => {
    setCompletedModules(prev => {
      if (!prev.includes(moduleId)) {
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
