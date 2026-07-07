// ============================================================================
// Lab.tsx — Lab Page Component
// This page provides an interactive coding environment where students can:
//   1. Write quantum computing code in Python (Qiskit) or C++ (QuEST)
//   2. Run simulations by sending code to the backend for execution
//   3. View circuit diagrams and measurement results
//   4. Request AI-powered code reviews for feedback on their code
// It uses the Monaco Editor (the same editor that powers VS Code) and
// communicates with the backend API via HTTP requests.
// ============================================================================

// Import React hooks:
// - useState: to track and update component data (code, output, loading states, etc.)
// - useEffect: to run side effects (fetching module data) when the component loads
import { useState, useEffect } from 'react';

// Import React Router hooks:
// - useParams: extracts URL parameters (the module ':id' from '/lab/:id')
// - useNavigate: returns a function to programmatically change the current page
import { useParams, useNavigate } from 'react-router-dom';

// Import the Monaco Editor component from '@monaco-editor/react'.
// Monaco is the code editor used in VS Code — it provides syntax highlighting,
// auto-completion, and a professional coding experience inside the browser.
import Editor from '@monaco-editor/react';

// Import the Module type definition so TypeScript knows the expected shape of module data
import SplitPane from 'react-split-pane';

import type { Module } from '../types';

// Import shared application CSS styles
import '../App.css';
import { useProgress } from '../context/ProgressContext';

/**
 * Lab Component
 * -------------
 * An interactive coding lab where students write and execute quantum computing code.
 * Features:
 * - Monaco code editor with Python/C++ language support
 * - Code execution via backend API with polling for job completion
 * - Circuit diagram visualization
 * - AI-powered code review functionality
 * - Language switching between Python (Qiskit) and C++ (QuEST)
 */
export default function Lab() {
  const { isCompleted, markCompleted } = useProgress();

  // Extract the 'id' parameter from the URL (e.g., 'module-1' from '/lab/module-1').
  // This tells us which module's coding exercise to load.
  const { id } = useParams();

  // Get the navigate function to programmatically redirect the user to other pages.
  const navigate = useNavigate();

  // 'module' state stores the current module's data (title, starterCode, etc.).
  // Starts as null because we haven't fetched it yet.
  const [module, setModule] = useState<Module | null>(null);
  
  // 'code' state holds the current source code in the editor.
  // Starts as an empty string and gets populated with the module's starter code.
  const [code, setCode] = useState('');

  // 'output' state holds the result of running the simulation.
  // Can be any shape — could contain { counts, diagram } on success or { error } on failure.
  // Starts as null (no output yet).
  const [output, setOutput] = useState<any>(null);

  // 'loading' state tracks whether a simulation is currently running.
  // When true, the "Run" button shows "Running..." and is disabled.
  const [loading, setLoading] = useState(false);

  // 'reviewLoading' state tracks whether an AI code review request is in progress.
  // When true, the "AI Code Review" button shows "Reviewing..." and is disabled.
  const [reviewLoading, setReviewLoading] = useState(false);

  // 'aiFeedback' state holds the text response from the AI code reviewer.
  // Starts as an empty string (no feedback yet).
  const [aiFeedback, setAiFeedback] = useState<string>('');

  // 'language' state tracks which programming language is selected.
  // Can only be 'python' or 'cpp'. Defaults to 'python'.
  const [language, setLanguage] = useState<'python' | 'cpp'>('python');

  // useEffect fetches the curriculum data when the component mounts or when 'id' changes.
  // It finds the module matching the URL parameter and loads its starter code.
  useEffect(() => {
    // Make an HTTP GET request to fetch all curriculum modules from the backend
    fetch('http://localhost:4000/api/curriculum')
      // Parse the raw HTTP response body as JSON
      .then(res => res.json())
      // Process the parsed JSON data
      .then(data => {
        // Verify the data is valid and contains a modules array
        if (data && data.modules) {
          // Find the specific module that matches the URL parameter 'id'
          const mod = data.modules.find((m: Module) => m.id === id);
          // If a matching module was found, update the state
          if (mod) {
            // Save the full module object to state
            setModule(mod);
            // Pre-fill the code editor with the module's starter code
            setCode(mod.starterCode);
          }
        }
      })
      // If the fetch request fails, log the error to the console
      .catch(err => console.error("Error fetching curriculum", err));
  }, [id]); // Re-run this effect if the module 'id' in the URL changes

  /**
   * handleLanguageChange
   * --------------------
   * Called when the user selects a different programming language from the dropdown.
   * Switches the editor language and loads appropriate starter code.
   */
  const handleLanguageChange = (e: any) => {
    // Get the newly selected language value from the dropdown event
    const newLang = e.target.value;

    // Update the language state to the new selection
    setLanguage(newLang);

    // If the user switched to C++, load a C++ template with QuEST library includes
    if (newLang === 'cpp') {
      // Set the code editor content to a basic C++ quantum computing template
      setCode('// Include QuEST library\n#include <QuEST.h>\n#include <iostream>\n\nint main() {\n  std::cout << "Write your C++ Quantum circuit here!\\n";\n  return 0;\n}');
    } else {
      // If switching back to Python, restore the module's original starter code.
      // The '?.' is optional chaining — safely access starterCode even if module is null.
      // The '|| ""' provides an empty string as a fallback if starterCode is undefined.
      setCode(module?.starterCode || '');
    }
  }

  /**
   * runCode
   * -------
   * Sends the current code to the backend API for simulation execution.
   * The backend returns a job ID, and then this function polls the server
   * every second to check if the job has completed.
   * On completion, it displays the results (circuit diagram + measurement counts)
   * or an error message if the simulation failed.
   */
  const runCode = async () => {
    // Set loading to true — this disables the Run button and shows "Running..."
    setLoading(true);
    // Clear any previous output from the results panel
    setOutput(null);
    // Clear any previous AI feedback
    setAiFeedback('');

    try {
      // Send the code and selected language to the backend's simulate API endpoint
      const response = await fetch('http://localhost:4000/api/simulate', {
        // Use POST method since we're sending data to the server
        method: 'POST',
        // Tell the server we're sending JSON data
        headers: { 'Content-Type': 'application/json' },
        // Convert the code and language into a JSON string for the request body
        body: JSON.stringify({ code, language })
      });

      // Parse the response JSON — the server returns a jobId for tracking
      const data = await response.json();
      
      // Show a temporary "Processing..." status with the job ID while we wait
      setOutput({ status: 'Processing...', jobId: data.jobId });
      
      // Poll for job completion — check the job status every 1000ms (1 second)
      // setInterval runs the provided function repeatedly at the specified interval.
      const pollInterval = setInterval(async () => {
        try {
          // Check the current status of the job by its ID
          const pollRes = await fetch(`http://localhost:4000/api/job/${data.jobId}`);
          // Parse the job status response
          const jobData = await pollRes.json();
          
          // Check if the job has finished (either successfully or with an error)
          if (jobData.status === 'completed' || jobData.status === 'failed') {
            // Stop polling — the job is done, no need to check again
            clearInterval(pollInterval);
            // Stop showing the loading indicator
            setLoading(false);
            
            // If the job failed, display the error message
            if (jobData.status === 'failed') {
              setOutput({ error: jobData.result?.error || 'Unknown error occurred.' });
            } else {
              // If the job succeeded, display the results:
              // - counts: measurement results (e.g., { "00": 512, "11": 512 })
              // - diagram: ASCII art of the quantum circuit
              // - output: Standard output printed by python code
              setOutput({
                status: 'success',
                counts: jobData.result?.counts,
                diagram: jobData.result?.diagram,
                output: jobData.result?.output
              });
            }
          }
          // If status is still 'pending' or 'running', the interval continues polling
        } catch (pollErr) {
          // If polling itself fails (network issue), stop polling and show an error
          clearInterval(pollInterval);
          setLoading(false);
          setOutput({ error: 'Failed to poll job status.' });
        }
      }, 1000); // Poll every 1000 milliseconds (1 second)
      
    } catch (err: any) {
      // If the initial simulation request fails, display the error message
      setOutput({ error: err.message });
      // Stop the loading indicator
      setLoading(false);
    }
  };

  /**
   * requestAiReview
   * ---------------
   * Sends the current code to the backend's AI review endpoint.
   * The AI analyzes the code and returns feedback about correctness,
   * best practices, and suggestions for improvement.
   */
  const requestAiReview = async () => {
    // Show the review loading state (disables button, shows "Reviewing...")
    setReviewLoading(true);

    try {
      // Send the current code to the AI review API endpoint
      const response = await fetch('http://localhost:4000/api/review', {
        // POST method to send code data
        method: 'POST',
        // Indicate that the request body is JSON
        headers: { 'Content-Type': 'application/json' },
        // Send the code as a JSON payload
        body: JSON.stringify({ code })
      });

      // Parse the AI's response
      const data = await response.json();

      // Save the AI's feedback text to state so it displays in the terminal panel
      setAiFeedback(data.feedback);
    } catch (err: any) {
      // If the request fails, show the error message as feedback
      setAiFeedback(`Error: ${err.message}`);
    }

    // Stop the review loading state regardless of success or failure
    setReviewLoading(false);
  };

  // If the module data hasn't loaded yet, show a loading message
  if (!module) return <div className="lab-container"><div className="glass-panel">Loading lab...</div></div>;

  // Render the full Lab page UI
  return (
    // Main layout container for the lab page
    <div className="lab-layout">
      {/* Header bar with navigation, title, and action buttons */}
      <div className="lab-header glass-header">
        {/* Back button — navigates to the tutorial page for this module */}
        <button className="back-btn" onClick={() => navigate(`/tutorial/${module.id}`)}>← Back to Tutorial</button>

        {/* Display the lab title including the module name */}
        <h2>Lab: {module.title}</h2>

        {/* Container for the action buttons and language selector */}
        <div className="header-actions">
          {/* Dropdown to switch between Python and C++ languages */}
          <select className="lang-select" value={language} onChange={handleLanguageChange}>
            {/* Option for Python with Qiskit quantum framework */}
            <option value="python">Python (Qiskit)</option>
            {/* Option for C++ with QuEST quantum framework */}
            <option value="cpp">C++ (QuEST)</option>
          {/* End of language select dropdown */}
          </select>

          {/* Mark Complete button using local storage progress */}
          <button 
            className="start-coding-btn" 
            style={{ 
              background: module && isCompleted(module.id) ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
              padding: '0.6rem 1.2rem',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
            onClick={() => module && markCompleted(module.id)}
          >
            {module && isCompleted(module.id) ? '✓ Completed' : 'Mark Complete'}
          </button>

          {/* Button to request an AI-powered code review.
              Disabled while a review is already in progress. */}
          <button className="review-btn" onClick={requestAiReview} disabled={reviewLoading}>
            {/* Show different text depending on whether a review is in progress */}
            {reviewLoading ? 'Reviewing...' : '✨ AI Code Review'}
          </button>

          {/* Button to run the code simulation.
              Disabled while a simulation is already running. */}
          <button className="run-btn" onClick={runCode} disabled={loading}>
            {/* Show different text depending on whether code is running */}
            {loading ? 'Running...' : 'Run Simulation'}
          </button>
        {/* End of header actions */}
        </div>
      {/* End of lab header */}
      </div>

      {/* Main workspace area containing the editor and output panels side by side */}
      <div className="lab-workspace">
        {/* Left panel: the code editor */}
        <section className="editor-section glass-panel">
          {/* Monaco Editor component — a full-featured code editor in the browser.
              This is the same editor engine used in Visual Studio Code. */}
          <Editor
            // Set the editor to fill 100% of its parent container's height
            height="100%"
            // Set the initial language for syntax highlighting
            defaultLanguage={language}
            // Dynamically update the language when the user switches (Python ↔ C++)
            language={language}
            // Use the dark color theme (white text on dark background)
            theme="vs-dark"
            // Bind the editor's content to our 'code' state variable
            value={code}
            // When the user types in the editor, update the 'code' state.
            // 'value' might be undefined if the editor is empty, so default to ''.
            onChange={(value) => setCode(value || '')}
            // Additional editor configuration options
            options={{
              // Disable the minimap (the small code preview on the right side)
              minimap: { enabled: false },
              // Set the font size to 14 pixels
              fontSize: 14,
              // Use the Fira Code font for code (supports ligatures), fallback to monospace
              fontFamily: 'Fira Code, monospace',
              // Add 16 pixels of padding at the top of the editor
              padding: { top: 16 }
            }}
          />
        {/* End of editor section */}
        </section>

        {/* Right panel: output area showing circuit diagrams and terminal output */}
        <section className="output-section glass-panel">
          {/* Container for the two sub-panels (visualizer and terminal) */}
          <div className="panels-container">
            {/* Top sub-panel: Circuit Visualizer — shows the quantum circuit diagram */}
            <div className="panel visualizer-panel">
              {/* Panel heading */}
              <h3>Circuit Visualizer</h3>

              {/* Container for the circuit diagram content */}
              <div className="diagram-container">
                {/* Conditionally render the diagram: if output exists and has a diagram... */}
                {output && output.diagram ? (
                  // Display the circuit diagram as preformatted text (preserves spacing/alignment)
                  <pre className="circuit-diagram">{output.diagram}</pre>
                ) : (
                  // Otherwise show placeholder text prompting the user to run a simulation
                  <span className="placeholder-text">Run simulation to see circuit</span>
                )}
              {/* End of diagram container */}
              </div>
            {/* End of visualizer panel */}
            </div>
            
            {/* Bottom sub-panel: Integrated Terminal — shows output and AI feedback */}
            <div className="panel terminal-panel">
              {/* Panel heading */}
              <h3>Integrated Terminal</h3>

              {/* Terminal output area */}
              <div className="terminal">
                {/* If AI feedback exists, display it in a highlighted section */}
                {aiFeedback && (
                  // AI feedback container
                  <div className="ai-feedback">
                    {/* Bold label for the AI section */}
                    <strong>✨ AI Reviewer:</strong>
                    {/* The actual feedback text from the AI */}
                    <p>{aiFeedback}</p>
                  {/* End of AI feedback */}
                  </div>
                )}
                
                {output ? (
                  // Display the output as formatted JSON text.
                  <pre className="output-text">
                    {output.output && output.output.trim() !== '' && (
                      <span className="stdout-text">{output.output}</span>
                    )}
                    {output.counts && (
                      <span className="counts-text">{'\nCounts: ' + JSON.stringify(output.counts, null, 2)}</span>
                    )}
                    {output.error && (
                      <span className="error-text">{'\nError: ' + output.error}</span>
                    )}
                    {!output.counts && !output.error && (!output.output || output.output.trim() === '') && (
                      <span>{JSON.stringify(output, null, 2)}</span>
                    )}
                  </pre>
                ) : (
                  // No output yet — show a placeholder message
                  <span className="placeholder-text">Awaiting execution...</span>
                )}
              {/* End of terminal */}
              </div>
            {/* End of terminal panel */}
            </div>
          {/* End of panels container */}
          </div>
        {/* End of output section */}
        </section>
      {/* End of lab workspace */}
      </div>
    {/* End of lab layout */}
    </div>
  );
}
