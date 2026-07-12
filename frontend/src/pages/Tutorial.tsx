// ============================================================================
// Tutorial.tsx — Tutorial Page Component
// This page displays the educational tutorial content for a specific module.
// It fetches the curriculum from the backend, finds the module matching the
// URL parameter, and renders its markdown content with support for:
//   - GitHub-flavored Markdown (tables, task lists, etc.)
//   - Math equations (using KaTeX for LaTeX-style rendering)
//   - Embedded interactive simulators (Bloch sphere, circuit demos)
// At the bottom, it provides a button to navigate to the coding lab.
// ============================================================================

// Import React hooks:
// - useState: to store and manage component data (like the current module)
// - useEffect: to run side effects (like fetching data from the API) after render
import { useState, useEffect } from 'react';

// Import React Router hooks:
// - useParams: extracts URL parameters (like the module ':id' from '/tutorial/:id')
// - useNavigate: returns a function to programmatically change pages
import { useParams, useNavigate } from 'react-router-dom';

// Import ReactMarkdown — a component that takes raw Markdown text and renders
// it as formatted HTML (headings, paragraphs, code blocks, links, etc.)
import ReactMarkdown from 'react-markdown';

// Import 'remark-gfm' plugin — adds support for GitHub Flavored Markdown features
// like tables, strikethrough text, task lists, and autolinked URLs.
import remarkGfm from 'remark-gfm';

// Import 'remark-math' plugin — detects math expressions written in LaTeX notation
// (like $E = mc^2$) inside the Markdown content.
import remarkMath from 'remark-math';

// Import 'rehype-katex' plugin — takes the math expressions detected by remark-math
// and renders them as beautifully formatted equations using the KaTeX library.
import rehypeKatex from 'rehype-katex';

// Import the KaTeX CSS stylesheet — required for the math equations to display
// correctly with proper fonts, sizes, and spacing.
import 'katex/dist/katex.min.css';

// Import the Module type definition so TypeScript knows the shape of module data.
import type { Module } from '../types';

// Import the MiniSimulator component — this renders interactive quantum simulators
// (like a Bloch sphere or circuit demo) that can be embedded inside tutorial content.
import MiniSimulator from '../components/MiniSimulator';

// Import shared application styles
import '../App.css';

// Import simulator-specific styles (for Bloch sphere and circuit visuals)
import '../simulator.css';

import { useProgress } from '../context/ProgressContext';

/**
 * Tutorial Component
 * ------------------
 * Fetches and displays the tutorial content for a specific learning module.
 * The module ID comes from the URL (e.g., /tutorial/module-1).
 * Content is rendered as Markdown with math support and embedded simulators.
 */
export default function Tutorial() {
  const { isCompleted, markCompleted } = useProgress();
  
  // Extract the 'id' parameter from the URL (e.g., 'module-1' from '/tutorial/module-1').
  // This tells us which module's tutorial to display.
  const { id } = useParams();

  // Get the navigate function to programmatically redirect the user to other pages.
  const navigate = useNavigate();

  // 'module' state holds the data for the current module (title, content, etc.).
  // It starts as 'null' because we haven't fetched it yet.
  // The type is 'Module | null' meaning it's either a Module object or null.
  const [module, setModule] = useState<Module | null>(null);

  // 'loading' state tracks whether we're still waiting for the API data.
  // Starts as 'true' because data fetching begins immediately.
  const [loading, setLoading] = useState(true);

  // useEffect fetches the curriculum data from the backend API whenever the 'id' changes.
  // The [id] dependency array means this effect re-runs if the user navigates to a
  // different module (the 'id' in the URL changes).
  useEffect(() => {
    // Make an HTTP GET request to the curriculum API endpoint
    fetch(`${import.meta.env.VITE_API_URL}/api/curriculum`)
      // Convert the raw response into a JavaScript object (JSON parsing)
      .then(res => res.json())
      // Process the parsed JSON data
      .then(data => {
        // Check that the response contains valid data with a 'modules' array
        if (data && data.modules) {
          // Search through all modules to find the one whose 'id' matches the URL parameter.
          // '.find()' returns the first matching item, or 'undefined' if none match.
          const mod = data.modules.find((m: Module) => m.id === id);
          // Save the found module to state (or null if not found)
          setModule(mod || null);
        }
        // Data has been processed, so we're no longer loading
        setLoading(false);
      })
      // If the fetch fails (network error, server down, etc.), handle the error
      .catch(err => {
        // Log the error to the browser's developer console for debugging
        console.error("Error fetching module", err);
        // Even on error, stop showing the loading indicator
        setLoading(false);
      });
  }, [id]); // Re-run this effect whenever the module 'id' in the URL changes

  // If data is still loading, show a loading message inside a styled panel
  if (loading) return <div className="tutorial-container"><div className="glass-panel">Loading tutorial...</div></div>;

  // If loading is done but no module was found (bad ID), show an error message
  if (!module) return <div className="tutorial-container"><div className="glass-panel">Module not found.</div></div>;

  // Render the full tutorial page
  return (
    // Outer container for the tutorial page layout
    <div className="tutorial-container">
      {/* Tutorial header section with a back button, title, and metadata */}
      <div className="tutorial-header glass-header">
        {/* Back button — clicking it navigates the user back to the Lab */}
        <button className="back-btn" onClick={() => navigate(`/`)}>← Back</button>

        {/* Display the module's title as a large heading */}
        <h1>{module.title}</h1>

        {/* Metadata section showing estimated time to complete */}
        <div className="tutorial-meta">
          {/* Show the estimated hours with a clock emoji */}
          <span>⏱️ Est. {module.estHours} Hours</span>
        {/* End of tutorial meta */}
        </div>
      {/* End of tutorial header */}
      </div>
      
      {/* Main content area where the Markdown tutorial text is rendered */}
      <main className="tutorial-content glass-panel markdown-body">
        {/* ReactMarkdown component converts raw Markdown text into formatted HTML.
            It accepts plugins to extend its capabilities: */}
        <ReactMarkdown 
          // 'remarkPlugins' process the Markdown text before it becomes HTML:
          // - remarkGfm: adds GitHub Flavored Markdown (tables, strikethrough, etc.)
          // - remarkMath: detects LaTeX math expressions like $x^2$ and $$\sum$$
          remarkPlugins={[remarkGfm, remarkMath]}
          // 'rehypePlugins' process the HTML output after Markdown conversion:
          // - rehypeKatex: renders detected math expressions as formatted equations
          rehypePlugins={[rehypeKatex]}
          // 'components' lets us override how specific HTML elements are rendered.
          // Here we override the <code> element to detect special 'simulator' code blocks.
          components={{
            // Custom renderer for code blocks. Receives properties about the code element:
            // - node: the AST node (internal representation)
            // - inline: whether it's inline code (`like this`) or a fenced code block
            // - className: contains the language identifier (e.g., "language-python")
            // - children: the actual code text content
            // - ...props: any other HTML attributes
            code({node, inline, className, children, ...props}: any) {
              // Try to extract the language name from the className (e.g., "language-simulator")
              // using a regular expression that matches "language-" followed by word characters.
              const match = /language-(\w+)/.exec(className || '');

              // If this is a fenced code block (not inline) AND the language is 'simulator',
              // render an interactive MiniSimulator component instead of a plain code block.
              if (!inline && match && match[1] === 'simulator') {
                // Pass the code content as the 'config' prop to MiniSimulator.
                // .replace(/\n$/, '') removes any trailing newline from the content.
                return <MiniSimulator config={String(children).replace(/\n$/, '')} />;
              }

              // For all other code blocks (Python, JavaScript, etc.), render a normal
              // <code> element with syntax highlighting CSS classes.
              return <code className={className} {...props}>{children}</code>;
            }
          }}
        >
          {/* Pass the module's Markdown content to ReactMarkdown for rendering.
              If the module has no content yet, show a placeholder message. */}
          {module.content || '# Content coming soon...'}
        {/* End of ReactMarkdown component */}
        </ReactMarkdown>
      {/* End of tutorial content area */}
      </main>

      {/* Footer section with a call-to-action to go to the coding lab */}
      <div className="tutorial-footer glass-panel">
        {/* Heading encouraging the student to practice */}
        <h3>Ready to practice what you learned?</h3>

        {/* Description text */}
        <p>Enter the quantum lab to complete the coding exercise for this module.</p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          {/* Button that navigates to the Lab page for this module.
              Uses the module's ID to construct the URL (e.g., '/lab/module-1'). */}
          <button 
            className="start-coding-btn" 
            onClick={() => navigate(`/lab/${module.id}`)}
          >
            Start Coding Challenge →
          </button>
          
          {/* Mark Complete button using local storage progress */}
          <button 
            className="start-coding-btn" 
            style={{ background: isCompleted(module.id) ? 'var(--primary)' : 'rgba(255,255,255,0.1)' }}
            onClick={() => markCompleted(module.id)}
          >
            {isCompleted(module.id) ? '✓ Completed' : 'Mark as Complete'}
          </button>
        </div>
      {/* End of tutorial footer */}
      </div>
    {/* End of tutorial container */}
    </div>
  );
}
