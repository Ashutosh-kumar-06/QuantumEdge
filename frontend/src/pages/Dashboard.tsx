// ============================================================================
// Dashboard.tsx — Dashboard Page Component
// This page is the main landing page of the QuantumEdge application. It:
//   1. Fetches the full curriculum (list of learning modules) from the backend API
//   2. Fetches the student's progress data from the backend API
//   3. Displays a progress bar showing how many modules have been completed
//   4. Renders a grid of clickable module cards so the student can start lessons
// ============================================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Module } from '../types';
import '../App.css';
import { useProgress } from '../context/ProgressContext';

export default function Dashboard() {
  const [curriculum, setCurriculum] = useState<Module[]>([]);
  const { isCompleted } = useProgress();
  const [user, setUser] = useState<{email: string, provider: string} | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const savedUser = localStorage.getItem('quantumEdgeUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {}
    }

    fetch(`${import.meta.env.VITE_API_URL}/api/curriculum`)
      .then(res => res.json())
      .then(data => {
        if (data && data.modules) setCurriculum(data.modules);
      })
      .catch(err => console.error("Error fetching curriculum", err));
  }, []);

  const completedCount = curriculum.filter(m => isCompleted(m.id)).length;
  const totalCount = curriculum.length;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Welcome back, {user ? user.email.split('@')[0] : 'Student'}!</h2>
        </div>

        <div className="progress-overview">
          {/* Text showing completed count out of total modules */}
          <span>Course Progress: {completedCount} / {totalCount} Modules Completed</span>

          {/* Visual progress bar container (the gray background track) */}
          <div className="progress-bar">
            {/* The filled portion of the progress bar — its width is calculated as a
                percentage: (completed / total) * 100. If total is 0, width is 0% to
                avoid dividing by zero. */}
            <div 
              className="progress-fill" 
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
            ></div>
          {/* End of progress bar */}
          </div>
        {/* End of progress overview section */}
        </div>
      {/* End of dashboard header panel */}
      </div>

      {/* Grid container that holds all the module cards */}
      <div className="module-grid">
        {/* Loop through each module in the curriculum and create a card for it.
            '.map()' transforms each module object into a JSX card element. */}
        {curriculum.map(mod => {
          // Check if this specific module has been completed by the student
          const completed = isCompleted(mod.id);
          
          // Return a card element for this module
          return (
            // Card container div. 'key' is required by React to track list items.
            // If completed, add the 'completed' CSS class for visual styling (e.g., green border).
            // Clicking anywhere on the card navigates to that module's tutorial page.
            <div 
              key={mod.id} 
              className={`module-card glass-panel ${completed ? 'completed' : ''}`}
              onClick={() => navigate(`/tutorial/${mod.id}`)}
            >
              {/* Card header area with the module title and a checkmark if completed */}
              <div className="card-header">
                {/* Display the module title */}
                <h3>{mod.title}</h3>
                {/* If the module is completed, show a green checkmark icon */}
                {completed && <span className="status-icon">✓</span>}
              {/* End of card header */}
              </div>

              {/* Display the module's short description text */}
              <p>{mod.description}</p>

              {/* Card footer area containing the action indicator */}
              <div className="card-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: completed ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {completed ? 'Review Lesson' : 'Start Lesson'}
                </span>
                <span style={{ color: 'var(--primary)', transition: 'transform 0.2s', transform: 'translateX(0)' }} className="card-arrow">
                  →
                </span>
              </div>
            {/* End of module card */}
            </div>
          );
        })}
      {/* End of module grid */}
      </div>
    {/* End of dashboard container */}
    </div>
  );
}
