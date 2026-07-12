// ============================================================================
// CourseModules.tsx — Course Modules Page Component
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

import { auth } from '../firebase';

export default function CourseModules() {
  const [curriculum, setCurriculum] = useState<Module[]>([]);
  const { isCompleted } = useProgress();
  const [user, setUser] = useState<{email: string, provider: string} | null>(null);
  
  const [activeTab, setActiveTab] = useState<'curriculum' | 'projects'>('curriculum');
  const [projects, setProjects] = useState<any[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const savedUser = localStorage.getItem('quantumEdgeUser');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setUser(u);
        fetchProjects(u.email || u.uid);
      } catch (e) {}
    }

    fetch(`${import.meta.env.VITE_API_URL}/api/curriculum`)
      .then(res => res.json())
      .then(data => {
        if (data && data.modules) setCurriculum(data.modules);
      })
      .catch(err => console.error("Error fetching curriculum", err));
  }, []);

  const fetchProjects = async (author: string) => {
    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/user/${encodeURIComponent(author)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setProjects(data);
      }
    } catch (err) {
      console.error("Error fetching projects", err);
    }
  };

  const completedCount = curriculum.filter(m => isCompleted(m.id)).length;
  const totalCount = curriculum.length;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Welcome back, {user ? user.email.split('@')[0] : 'Student'}!</h2>
        </div>

        <div className="progress-overview">
          <span>Course Progress: {completedCount} / {totalCount} Modules Completed</span>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('curriculum')}
          style={{ 
            background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '1.1rem', cursor: 'pointer',
            color: activeTab === 'curriculum' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'curriculum' ? '2px solid var(--primary)' : '2px solid transparent',
            fontWeight: activeTab === 'curriculum' ? 'bold' : 'normal'
          }}
        >
          Curriculum
        </button>
        <button 
          onClick={() => setActiveTab('projects')}
          style={{ 
            background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '1.1rem', cursor: 'pointer',
            color: activeTab === 'projects' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'projects' ? '2px solid var(--primary)' : '2px solid transparent',
            fontWeight: activeTab === 'projects' ? 'bold' : 'normal'
          }}
        >
          My Projects
        </button>
      </div>

      {activeTab === 'curriculum' && (
        <div className="module-grid">
          {curriculum.map(mod => {
            const completed = isCompleted(mod.id);
            return (
              <div 
                key={mod.id} 
                className={`module-card glass-panel ${completed ? 'completed' : ''}`}
                onClick={() => navigate(`/tutorial/${mod.id}`)}
              >
                <div className="card-header">
                  <h3>{mod.title}</h3>
                  {completed && <span className="status-icon">✓</span>}
                </div>
                <p>{mod.description}</p>
                <div className="card-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', color: completed ? 'var(--primary)' : 'var(--text-muted)' }}>
                    {completed ? 'Review Lesson' : 'Start Lesson'}
                  </span>
                  <span style={{ color: 'var(--primary)', transition: 'transform 0.2s', transform: 'translateX(0)' }} className="card-arrow">
                    →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="module-grid">
          {projects.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', padding: '2rem' }}>
              No saved projects yet. Go to the Lab to create one!
            </div>
          ) : (
            projects.map(proj => (
              <div 
                key={proj._id} 
                className="module-card glass-panel"
                onClick={() => navigate(`/lab/sandbox?project=${proj._id}`)}
              >
                <div className="card-header">
                  <h3>{proj.title}</h3>
                </div>
                <p>Language: {proj.language === 'cpp' ? 'C++ (QuEST)' : 'Python (Qiskit)'}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Saved: {new Date(proj.createdAt).toLocaleDateString()}
                </p>
                <div className="card-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>
                    Open Project
                  </span>
                  <span style={{ color: 'var(--primary)' }} className="card-arrow">→</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
