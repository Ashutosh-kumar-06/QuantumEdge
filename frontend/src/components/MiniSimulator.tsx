// ============================================================================
// MiniSimulator.tsx — Interactive Simulator Components
// This file contains three components for embedding interactive quantum
// computing visualizations inside tutorial content:
//
// 1. MiniSimulator (default export): A router that reads a text config string,
//    determines what type of simulator to show, and renders the correct one.
// 2. BlochSphereSimulator: An interactive 3D-style Bloch sphere visualization
//    where users can apply quantum gates (X, Y, Z, H, S) and see how they
//    rotate the qubit's state vector in real-time.
// 3. CircuitDemoSimulator: An animated circuit execution visualizer that
//    shows a quantum circuit wire with gate boxes and a "photon" that moves
//    through them step by step.
// ============================================================================

// Import React hooks:
// - useState: to store component data (like the current Bloch vector position)
// - useEffect: to run side effects (like setting initial state or starting animations)
import { useState, useEffect } from 'react';

// Import the CSS styles specific to the simulator components
// (sphere visuals, gate buttons, circuit wire styling, etc.)
import '../simulator.css';

import ProbabilitySimulator from './simulators/ProbabilitySimulator';
import EntanglementSimulator from './simulators/EntanglementSimulator';
import DensityMatrixSimulator from './simulators/DensityMatrixSimulator';
import ParameterizedSimulator from './simulators/ParameterizedSimulator';
import GroverSimulator from './simulators/GroverSimulator';
import ShorSimulator from './simulators/ShorSimulator';
import VQESimulator from './simulators/VQESimulator';
import HardwareSimulator from './simulators/HardwareSimulator';

// Define the TypeScript interface for the props (input data) that MiniSimulator accepts.
// An interface describes the "shape" of the data — what properties it has and their types.
interface SimulatorProps {
  // 'config' is a multi-line string containing key-value pairs (like "type: bloch-sphere")
  // that tell the simulator what type to render and with what settings.
  config: string;
}

/**
 * MiniSimulator Component (Default Export)
 * ----------------------------------------
 * Acts as a router/factory for simulator types. It parses the config string
 * to determine which type of simulator to render (bloch-sphere or circuit-demo),
 * then renders the appropriate sub-component with the correct props.
 *
 * Config format example:
 *   type: bloch-sphere
 *   state: 0
 */
export default function MiniSimulator({ config }: SimulatorProps) {
  // Split the config string into individual lines (each line is a "key: value" pair)
  const lines = config.split('\n');

  // Create an empty object to store the parsed key-value parameters.
  // 'Record<string, string>' is a TypeScript type meaning an object where
  // both keys and values are strings (like a dictionary).
  const params: Record<string, string> = {};

  // Loop through each line of the config and parse it into key-value pairs
  lines.forEach(line => {
    // Split each line on the ':' character to separate the key from the value.
    // '.map(s => s.trim())' removes any whitespace from both the key and value.
    // Destructure the result into variables 'k' (key) and 'v' (value).
    const [k, v] = line.split(':').map(s => s.trim());
    // Only add to params if both key and value are non-empty strings
    if (k && v) params[k] = v;
  });

  // Extract the 'type' parameter which determines which simulator to render.
  // Defaults to 'unknown' if no type was specified in the config.
  const type = params['type'] || 'unknown';

  // If the type is 'bloch-sphere', render the Bloch Sphere interactive visualizer.
  // Pass the initial quantum state (e.g., '0', '1', '+', '-') as a prop.
  if (type === 'bloch-sphere') {
    return <BlochSphereSimulator initialState={params['state']} />;
  }

  // If the type is 'circuit-demo', render the Circuit Demo animated visualizer.
  // Pass the comma-separated list of gates (e.g., 'H,X,M') as a prop.
  if (type === 'circuit-demo') {
    return <CircuitDemoSimulator gates={params['gates']} />;
  }

  if (type === 'probability') return <ProbabilitySimulator />;
  if (type === 'entanglement') return <EntanglementSimulator />;
  if (type === 'density-matrix') return <DensityMatrixSimulator />;
  if (type === 'parameterized') return <ParameterizedSimulator />;
  if (type === 'grover') return <GroverSimulator />;
  if (type === 'shor') return <ShorSimulator />;
  if (type === 'vqe') return <VQESimulator />;
  if (type === 'hardware') return <HardwareSimulator />;

  // If the type doesn't match any known simulator, show an error message.
  // This helps developers debug config issues in tutorial markdown.
  return (
    // Error container with an error CSS class for red styling
    <div className="mini-simulator error">
      {/* Display the unsupported type name so the author knows what went wrong */}
      Unsupported simulator type: {type}
    </div>
  );
}

// ============================================================================
// BlochSphereSimulator — Interactive Bloch Sphere Visualization
// ============================================================================

/**
 * BlochSphereSimulator Component
 * ------------------------------
 * Renders an interactive CSS-based Bloch sphere that visualizes a qubit's state.
 * The Bloch sphere is a geometric representation where:
 *   - The north pole (0, 0, 1) represents qubit state |0⟩
 *   - The south pole (0, 0, -1) represents qubit state |1⟩
 *   - Points on the equator represent superposition states
 * Users can click gate buttons (X, Y, Z, H, S) to apply quantum gates
 * and see how the state vector rotates on the sphere in real-time.
 */
function BlochSphereSimulator({ initialState }: { initialState: string }) {
  // Store the Bloch vector as [x, y, z] Cartesian coordinates.
  // The vector points from the center of the sphere to the qubit's state.
  // Default is [0, 0, 1] which represents the |0⟩ state (north pole).
  const [vec, setVec] = useState<[number, number, number]>([0, 0, 1]);
  
  // Store an explanation string to help the user understand what just happened
  const [explanation, setExplanation] = useState<string>("Click the gates below to interactively rotate the state vector.");

  // useEffect sets the initial Bloch vector position based on the 'initialState' prop.
  // It runs whenever 'initialState' changes.
  useEffect(() => {
    // Map common quantum state labels to their Bloch sphere coordinates:
    if (initialState === '0') setVec([0, 0, 1]);           // |0⟩ = north pole
    else if (initialState === '1') setVec([0, 0, -1]);     // |1⟩ = south pole
    else if (initialState === '+') setVec([1, 0, 0]);      // |+⟩ = positive X axis
    else if (initialState === '-') setVec([-1, 0, 0]);     // |-⟩ = negative X axis
    else if (initialState === 'i') setVec([0, 1, 0]);      // |i⟩ = positive Y axis
    // 'superposition' = equal mix on XY plane (45° between X and Y)
    else if (initialState === 'superposition') setVec([1/Math.sqrt(2), 1/Math.sqrt(2), 0]);
    // Default to |0⟩ for any unrecognized state
    else setVec([0, 0, 1]);
  }, [initialState]); // Re-run when the initial state prop changes

  /**
   * applyGate
   * ---------
   * Applies a quantum gate transformation to the current Bloch vector.
   * Each gate rotates the vector in a specific way:
   * - X gate: 180° rotation around the X-axis (flips |0⟩ ↔ |1⟩)
   * - Y gate: 180° rotation around the Y-axis
   * - Z gate: 180° rotation around the Z-axis (phase flip)
   * - H gate: Hadamard gate (creates superposition, rotates around X+Z axis)
   * - S gate: 90° rotation around the Z-axis (phase gate)
   * - T gate: 45° rotation around the Z-axis (π/8 gate)
   */
  const applyGate = (gate: string) => {
    // Use the functional form of setVec to get the previous vector value.
    // This ensures we're always working with the most up-to-date state.
    setVec(prev => {
      // Destructure the previous vector into x, y, z components
      let [x, y, z] = prev;

      // Apply the appropriate rotation based on which gate was selected
      switch (gate) {
        // X gate (Pauli-X): Rotates 180° around X-axis. Negates y and z.
        case 'X': 
          setExplanation("X Gate (NOT): Rotates 180° around the X-axis. It acts as a quantum bit-flip, swapping |0⟩ and |1⟩.");
          return [x, -y, -z];
        // Y gate (Pauli-Y): Rotates 180° around Y-axis. Negates x and z.
        case 'Y': 
          setExplanation("Y Gate: Rotates 180° around the Y-axis. It flips both the bit and the phase.");
          return [-x, y, -z];
        // Z gate (Pauli-Z): Rotates 180° around Z-axis. Negates x and y.
        case 'Z': 
          setExplanation("Z Gate: Rotates 180° around the Z-axis. It flips the phase of the qubit without changing its probability.");
          return [-x, -y, z];
        // H gate (Hadamard): Swaps x↔z and negates y. Creates superposition.
        case 'H': 
          setExplanation("Hadamard Gate (H): Rotates to create a superposition. It moves the state between the poles and the equator.");
          return [z, -y, x];
        // S gate (Phase): 90° rotation around Z. Swaps x↔y with a sign change.
        case 'S': 
          setExplanation("S Gate: Rotates 90° around the Z-axis, adding an imaginary phase shift.");
          return [-y, x, z];
        // T gate (π/8): 45° rotation around Z-axis using rotation matrix formula.
        // Applies cos(π/4) and sin(π/4) to the x and y components.
        case 'T': 
          setExplanation("T Gate: Rotates 45° around the Z-axis (a π/4 phase shift).");
          return [x * Math.cos(Math.PI/4) - y * Math.sin(Math.PI/4), x * Math.sin(Math.PI/4) + y * Math.cos(Math.PI/4), z];
        // If an unknown gate is provided, return the vector unchanged
        default: return prev;
      }
    });
  };

  /**
   * reset
   * -----
   * Resets the Bloch vector back to the |0⟩ state (north pole of the sphere).
   */
  const reset = () => {
    setExplanation("Reset: Returned to the initial |0⟩ state (North Pole).");
    // Set the vector back to [0, 0, 1] which is the |0⟩ state
    setVec([0, 0, 1]);
  };

  // Destructure the current vector into individual x, y, z variables for calculations
  // Convert Cartesian coordinates (x, y, z) to CSS rotation angles (theta, phi)
  const [x, y, z] = vec;

  // Clamp z to the range [-1, 1] to prevent floating-point errors that could
  // cause Math.acos to return NaN (Not a Number). Tiny rounding errors like
  // z = 1.0000000002 would break acos, so we clamp it to exactly [-1, 1].
  const safeZ = Math.max(-1, Math.min(1, z));

  // Calculate theta (polar angle) — the angle from the north pole (0° to 180°).
  // Math.acos returns radians, so we multiply by (180/π) to convert to degrees.
  const theta = Math.acos(safeZ) * (180 / Math.PI); // 0 to 180

  // Calculate phi (azimuthal angle) — the angle around the equator (-180° to 180°).
  // Math.atan2(y, x) gives the angle in radians from the positive X-axis.
  const phi = Math.atan2(y, x) * (180 / Math.PI); // -180 to 180

  // Convert spherical angles to CSS rotation values for the 3D transform.
  // rotateX controls the tilt from north to south pole.
  const rotateX = 180 - theta;

  // rotateY controls the spin around the equator.
  const rotateY = phi;

  // Determine the color of the vector based on which state it's closest to.
  // This gives visual feedback about the qubit's current state.
  let color = 'var(--primary-color, #45f3ff)'; // Default: cyan/blue (near |0⟩)

  // If z < -0.8, the vector is near the south pole (|1⟩ state) — color it red
  if (z < -0.8) color = 'var(--danger, #ff4545)';
  // If x > 0.8, the vector is near the positive X-axis (|+⟩ state) — color it green
  else if (x > 0.8) color = 'var(--success-color, #00ff88)';

  // Render the Bloch sphere visualization
  return (
    // Outer container for the entire Bloch sphere simulator widget
    <div className="mini-simulator bloch-simulator">
      {/* Header area with title and a badge */}
      <div className="bloch-meta">
        {/* Title of the interactive widget */}
        <h4>Interactive Bloch Sphere</h4>
        {/* Badge label indicating this visualizes the state vector */}
        <span className="badge">State Vector</span>
      {/* End of header area */}
      </div>
      
      {/* Container that holds the 3D sphere visualization */}
      <div className="sphere-container">
        {/* The sphere itself — a circular element styled with CSS to look 3D */}
        <div className="sphere">
          {/* Visual element representing the equator circle of the sphere */}
          <div className="equator"></div>
          {/* Visual element representing the Z-axis (vertical, north-south) */}
          <div className="axis-z"></div>
          {/* Visual element representing the X-axis (horizontal, left-right) */}
          <div className="axis-x"></div>
          {/* Visual element representing the Y-axis (horizontal, front-back) */}
          <div className="axis-y"></div>
          
          {/* The state vector arrow — rotated using CSS 3D transforms to point
              in the direction of the current quantum state */}
          <div 
            className="vector"
            style={{ 
              // Apply 3D rotation: first rotate around Y-axis (phi), then X-axis (theta)
              transform: `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`, 
              // Color the vector based on the current state
              backgroundColor: color,
              // Add a glowing shadow effect in the same color
              boxShadow: `0 0 10px ${color}`
            }}
          >
            {/* The arrowhead at the tip of the vector, colored to match */}
            <div className="vector-head" style={{ borderBottomColor: color }}></div>
          {/* End of vector */}
          </div>
        {/* End of sphere */}
        </div>
      {/* End of sphere container */}
      </div>

      {/* Gate buttons — each button applies a different quantum gate to the state vector */}
      <div className="simulator-controls" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* X Gate button — applies a Pauli-X rotation (bit flip) */}
        <button className="gate-btn" onClick={() => applyGate('X')}>X Gate</button>
        {/* Y Gate button — applies a Pauli-Y rotation */}
        <button className="gate-btn" onClick={() => applyGate('Y')}>Y Gate</button>
        {/* Z Gate button — applies a Pauli-Z rotation (phase flip) */}
        <button className="gate-btn" onClick={() => applyGate('Z')}>Z Gate</button>
        {/* H Gate button — applies a Hadamard gate (creates superposition) */}
        <button className="gate-btn" onClick={() => applyGate('H')}>H Gate</button>
        {/* S Gate button — applies a phase gate (90° Z rotation) */}
        <button className="gate-btn" onClick={() => applyGate('S')}>S Gate</button>
        {/* Reset button — returns the vector to the |0⟩ state (north pole) */}
        <button className="gate-btn reset-btn" onClick={reset}>Reset |0⟩</button>
      {/* End of simulator controls */}
      </div>

      {/* Explanation Panel */}
      <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', borderLeft: '4px solid var(--primary-color)' }}>
        <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.4' }}><strong>Action:</strong> {explanation}</p>
        <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem' }}>
          <span><strong>X:</strong> {x.toFixed(2)}</span>
          <span><strong>Y:</strong> {y.toFixed(2)}</span>
          <span><strong>Z:</strong> {z.toFixed(2)}</span>
        </div>
      </div>

    {/* End of Bloch sphere simulator */}
    </div>
  );
}

// ============================================================================
// CircuitDemoSimulator — Animated Circuit Execution Visualizer
// ============================================================================

/**
 * CircuitDemoSimulator Component
 * ------------------------------
 * Renders an interactive quantum circuit visualization where gates are displayed
 * as boxes on a wire. Users can:
 *   - Click "Play" to animate a "photon" moving through each gate sequentially
 *   - Click "Pause" to stop the animation
 *   - Click individual gates to jump to that step
 *   - Click "Reset" to return to the initial state
 * The gates are provided as a comma-separated string (e.g., "H,X,M").
 */
export function CircuitDemoSimulator({ gates }: { gates: string }) {
  // Parse the comma-separated gates string into an array of individual gate names.
  // If no gates string is provided, default to ['H', 'X', 'M'] (Hadamard, X, Measure).
  const gateArray = (gates || 'H,X,M').split(',');

  // 'activeGate' tracks which gate is currently highlighted/active (-1 means none).
  // This index determines where the "photon" dot appears on the circuit wire.
  const [activeGate, setActiveGate] = useState(-1);

  // 'isPlaying' tracks whether the automatic step-through animation is running.
  // When true, the circuit automatically advances through gates one per second.
  const [isPlaying, setIsPlaying] = useState(false);

  // useEffect manages the auto-play animation timer.
  // When isPlaying is true, it sets up an interval that advances the active gate
  // every 1000ms (1 second). When isPlaying becomes false, it cleans up the interval.
  useEffect(() => {
    // Variable to hold the interval timer ID (so we can clear it later)
    let interval: any;

    // Only start the animation timer if isPlaying is true
    if (isPlaying) {
      // Set up a repeating timer that fires every 1000ms
      interval = setInterval(() => {
        // Advance to the next gate using the functional updater form of setState
        setActiveGate(prev => {
          // If we've gone past the last gate, stop playing and reset
          if (prev >= gateArray.length) {
            // Stop the auto-play animation
            setIsPlaying(false);
            // Reset back to "no gate selected" state
            return -1;
          }
          // Otherwise, move to the next gate (increment by 1)
          return prev + 1;
        });
      }, 1000); // Advance every 1 second
    }

    // Cleanup function — React calls this when the component unmounts or when
    // the dependencies change. It clears the interval to prevent memory leaks.
    return () => clearInterval(interval);
  }, [isPlaying, gateArray.length]); // Re-run when play state or gate count changes

  // Render the circuit demo visualization
  return (
    // Outer container for the circuit simulator widget
    <div className="mini-simulator circuit-simulator">
      {/* Header area with the widget title */}
      <div className="bloch-meta">
        {/* Title describing what this interactive widget does */}
        <h4>Interactive Circuit Execution</h4>
      {/* End of header */}
      </div>
      
      {/* The circuit wire area — a horizontally scrolling container with flexbox layout */}
      <div className="circuit-wire-container" style={{ 
        position: 'relative', 
        width: '100%', 
        height: '80px', 
        borderBottom: '2px solid rgba(255,255,255,0.2)', 
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        overflowX: 'auto',
        overflowY: 'hidden',
        paddingLeft: '1rem',
        paddingRight: '1rem',
        gap: '2rem'
      }}>
        {/* Label at the start of the wire showing the initial qubit state |0⟩ */}
        <div className="wire-label" style={{ fontWeight: 'bold', marginRight: '1rem' }}>|0⟩</div>
        
        {/* Render each gate as a box along the wire */}
        {gateArray.map((gate, idx) => (
          <div 
            key={idx} 
            className={`circuit-gate ${activeGate === idx ? 'active-pulse' : ''}`}
            onClick={() => setActiveGate(idx)}
            style={{ 
              position: 'relative',
              flexShrink: 0,
              padding: '0.4rem 1rem',
              background: 'rgba(69, 243, 255, 0.1)',
              border: `1px solid ${activeGate === idx ? '#fff' : 'var(--primary-color, #45f3ff)'}`,
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            {gate}
            {/* The "photon" indicator */}
            {activeGate === idx && (
              <div 
                className="photon-pulse" 
                style={{ 
                  position: 'absolute',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  top: '110%',
                  width: '10px',
                  height: '10px',
                  background: '#00ff88',
                  borderRadius: '50%',
                  boxShadow: '0 0 10px #00ff88'
                }}
              ></div>
            )}
          </div>
        ))}
      </div>

      {/* Playback control buttons for the circuit animation */}
      <div className="simulator-controls" style={{ display: 'flex', gap: '0.5rem' }}>
        {/* Play button — starts the auto-advancing animation. Disabled while already playing. */}
        <button className="gate-btn" onClick={() => setIsPlaying(true)} disabled={isPlaying}>Play</button>
        {/* Pause button — stops the animation. Disabled when not currently playing. */}
        <button className="gate-btn" onClick={() => setIsPlaying(false)} disabled={!isPlaying}>Pause</button>
        {/* Reset button — clears the active gate selection, returning to initial state. */}
        <button className="gate-btn reset-btn" onClick={() => setActiveGate(-1)}>Reset</button>
      {/* End of simulator controls */}
      </div>

      {/* Instructional caption explaining how to use the widget */}
      <p className="caption">Click "Play" or click on individual gates to step through the execution.</p>
    {/* End of circuit simulator */}
    </div>
  );
}
