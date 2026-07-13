// ============================================================================
// Lab.tsx — Lab Page Component
// Interactive coding environment with draggable resizable panels
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Suspense, lazy } from 'react';
const Editor = lazy(() => import('@monaco-editor/react'));
import type { Module } from '../types';
import '../App.css';
import { useProgress } from '../context/ProgressContext';
import { io } from 'socket.io-client';
import CircuitBuilder from '../components/CircuitBuilder';
import AiTutorChat from '../components/AiTutorChat';
import QuantumSnippets from '../components/QuantumSnippets';
import FileExplorer from '../components/FileExplorer';
import { auth } from '../firebase';

import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const socket = io(import.meta.env.VITE_API_URL || '', {
  path: '/socket.io',
  transports: ['websocket']
});

// ============================================================================
// Custom Resizable Split — built with pure React, no dependencies
// ============================================================================
function ResizableSplit({
  direction,
  initialRatio = 50,
  minRatio = 15,
  maxRatio = 85,
  first,
  second,
  storageKey,
}: {
  direction: 'horizontal' | 'vertical';
  initialRatio?: number;
  minRatio?: number;
  maxRatio?: number;
  first: React.ReactNode;
  second: React.ReactNode;
  storageKey?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [ratio, setRatio] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val >= minRatio && val <= maxRatio) return val;
      }
    }
    return initialRatio;
  });

  const isHorizontal = direction === 'horizontal';
  const HANDLE_SIZE = 8; // px

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = true;

    const container = containerRef.current;
    if (!container) return;

    // Add a full-page overlay to prevent iframes (Monaco) from eating mouse events
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.zIndex = '99999';
    overlay.style.cursor = isHorizontal ? 'col-resize' : 'row-resize';
    document.body.appendChild(overlay);

    const onMouseMove = (moveE: MouseEvent) => {
      if (!isDragging.current) return;
      const rect = container.getBoundingClientRect();
      let newRatio: number;
      if (isHorizontal) {
        newRatio = ((moveE.clientX - rect.left) / rect.width) * 100;
      } else {
        newRatio = ((moveE.clientY - rect.top) / rect.height) * 100;
      }
      newRatio = Math.max(minRatio, Math.min(maxRatio, newRatio));
      setRatio(newRatio);
    };

    const onMouseUp = () => {
      isDragging.current = false;
      overlay.remove();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      // Persist
      if (storageKey && containerRef.current) {
        setRatio(prev => {
          localStorage.setItem(storageKey, String(prev));
          return prev;
        });
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [isHorizontal, minRatio, maxRatio, storageKey]);

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: isHorizontal ? 'row' : 'column',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* First panel */}
      <div style={{
        [isHorizontal ? 'width' : 'height']: `calc(${ratio}% - ${HANDLE_SIZE / 2}px)`,
        [isHorizontal ? 'height' : 'width']: '100%',
        overflow: 'hidden',
        flexShrink: 0,
        minWidth: 0,
        minHeight: 0,
      }}>
        {first}
      </div>

      {/* Drag handle — thick, visible, with clear cursor */}
      <div
        onMouseDown={onMouseDown}
        className="resizable-handle"
        data-direction={direction}
        style={{
          [isHorizontal ? 'width' : 'height']: `${HANDLE_SIZE}px`,
          [isHorizontal ? 'height' : 'width']: '100%',
          flexShrink: 0,
          cursor: isHorizontal ? 'col-resize' : 'row-resize',
          background: 'rgba(139, 92, 246, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.15s ease',
          position: 'relative',
          zIndex: 20,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(139, 92, 246, 0.7)';
        }}
        onMouseLeave={(e) => {
          if (!isDragging.current) e.currentTarget.style.background = 'rgba(139, 92, 246, 0.25)';
        }}
      >
        {/* Grip dots */}
        <div style={{
          display: 'flex',
          flexDirection: isHorizontal ? 'column' : 'row',
          gap: '3px',
          alignItems: 'center',
        }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: '3px',
              height: '3px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.5)',
            }} />
          ))}
        </div>
      </div>

      {/* Second panel */}
      <div style={{
        flex: 1,
        overflow: 'hidden',
        minWidth: 0,
        minHeight: 0,
        [isHorizontal ? 'height' : 'width']: '100%',
      }}>
        {second}
      </div>
    </div>
  );
}

// ============================================================================
// Lab Component
// ============================================================================
export default function Lab() {
  const { markCompleted } = useProgress();
  const { id } = useParams();
  const navigate = useNavigate();

  const [module, setModule] = useState<Module | null>(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [files, setFiles] = useState<{ [filename: string]: string }>({ 'main.py': '// Write your Qiskit code here!\n' });
  const [activeFile, setActiveFile] = useState('main.py');
  
  const [viewMode, setViewMode] = useState<'code' | 'builder'>('code');
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [language, setLanguage] = useState<'python' | 'cpp'>('python');
  const [noiseModel, setNoiseModel] = useState<'ideal' | 'depolarizing' | 'thermal'>('ideal');
  const [activeOutputTab, setActiveOutputTab] = useState<'visualizer' | 'terminal' | 'snippets' | 'history' | 'challenge'>('terminal');
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  
  const [history, setHistory] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // AI Pair Programmer state
  const editorRef = useRef<any>(null);
  const [isAiTyping, setIsAiTyping] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const handleChunk = ({ chunk }: { chunk: string }) => {
      setIsAiTyping(true);
      if (!editorRef.current) return;
      const position = editorRef.current.getPosition();
      editorRef.current.executeEdits('ai-autocomplete', [{
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        },
        text: chunk,
        forceMoveMarkers: true
      }]);
      // Reset typing state after 2 seconds of inactivity
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsAiTyping(false), 2000);
    };
    
    socket.on('ai_autocomplete_chunk', handleChunk);
    
    return () => {
      socket.off('ai_autocomplete_chunk', handleChunk);
      clearTimeout(timeout);
    };
  }, []);

  const triggerAiAutocomplete = () => {
    if (!editorRef.current || isAiTyping) return;
    const position = editorRef.current.getPosition();
    const model = editorRef.current.getModel();
    const codeContext = model.getValueInRange({
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column
    });
    setIsAiTyping(true);
    socket.emit('ai_autocomplete_request', { code: codeContext, language, roomId: module?.id });
  };

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const projectId = searchParams.get('project');

  // Multiplayer Room State
  const [roomInput, setRoomInput] = useState<string>('');

  const createRoom = (type: 'chat' | 'video') => {
    const newRoomId = Math.random().toString(36).substring(2, 8);
    navigate(`/${type}/${newRoomId}`);
  };

  const joinRoom = (type: 'chat' | 'video') => {
    if (roomInput.trim()) {
      navigate(`/${type}/${roomInput.trim()}`);
    }
  };

  // Tour Guide using Driver.js
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenLabTour');
    if (!hasSeenTour) {
      setTimeout(() => {
        const driverObj = driver({
          showProgress: true,
          steps: [
            { element: '.tour-actions', popover: { title: 'Lab Controls', description: 'Switch languages, request AI code reviews, and run your simulations here.', side: 'bottom', align: 'start' } },
            { element: '.tour-view-toggle', popover: { title: 'Workspace Toggle', description: 'Switch between typing code directly and using our visual drag-and-drop Circuit Builder!', side: 'left', align: 'start' } },
            { element: '.tour-code-editor', popover: { title: 'Your Workspace', description: 'This is where you write or generate your quantum circuits.', side: 'right', align: 'start' } },
            { element: '.tour-visualizer', popover: { title: 'Circuit Diagram', description: 'When you run your code, the quantum circuit will automatically be visualized here.', side: 'left', align: 'start' } },
            { element: '.tour-terminal', popover: { title: 'Terminal', description: 'See your circuit output, measurement counts, and get AI hints if you get stuck.', side: 'top', align: 'start' } },
            { element: '.builder-grid', popover: { title: 'Visual Circuit Builder', description: 'Click cells to cycle through quantum gates (H, X, Y, Z, S, T) and visually design your circuit.', side: 'top', align: 'start' } },
            { element: '.remove-qubit-btn', popover: { title: 'Remove Qubits', description: 'You can remove qubits and moments dynamically as you build.', side: 'top', align: 'start' } }
          ],
          onDestroyStarted: () => {
            localStorage.setItem('hasSeenLabTour', 'true');
            driverObj.destroy();
          }
        });
        driverObj.drive();
      }, 500); // Wait for UI to settle
    }
  }, []);

  // Fetch Pro status
  useEffect(() => {
    const userStr = localStorage.getItem('quantumEdgeUser');
    if (userStr) {
      try {
        const obj = JSON.parse(userStr);
        const username = obj.email || obj.uid || userStr;
        fetch(`${import.meta.env.VITE_API_URL || ''}/api/user/${encodeURIComponent(username)}/status`)
          .then(res => res.json())
          .then(data => {
            if (data && data.isPro) setIsPro(true);
          })
          .catch(err => console.error(err));
      } catch (e) {
        // Fallback for non-JSON strings
        fetch(`${import.meta.env.VITE_API_URL || ''}/api/user/${encodeURIComponent(userStr)}/status`)
          .then(res => res.json())
          .then(data => {
            if (data && data.isPro) setIsPro(true);
          })
          .catch(err => console.error(err));
      }
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('tour_seen')) {
      // Small timeout to allow UI to render first
      setTimeout(() => {
        const d = driver({
          showProgress: true,
          steps: [
            { element: '.tour-code-editor', popover: { title: 'Welcome to QuantumEdge', description: 'This is your interactive quantum coding environment.' } },
            { element: '.tour-visual-builder', popover: { title: 'Visual Builder', description: 'Switch between writing Python/C++ code and a drag-and-drop circuit builder.' } },
            { element: '.tour-run-btn', popover: { title: 'Execution', description: 'Run your circuits securely on our ephemeral Docker backends.' } },
          ]
        });
        d.drive();
        localStorage.setItem('tour_seen', 'true');
      }, 1000);
    }
  }, []);

  // Fetch module data
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/curriculum`)
      .then(res => res.json())
      .then(data => {
        if (data && data.modules) {
          const mod = data.modules.find((m: Module) => m.id === id);
          if (mod) {
            setModule(mod);
            setCode(mod.starterCode);
            setFiles({ 'main.py': mod.starterCode || '' });
          } else {
            // Fallback to a sandbox if not found or if id is 'sandbox'
            const sandboxCode = 'from qiskit import QuantumCircuit\n\n# Your sandbox circuit\nqc = QuantumCircuit(3)\nqc.measure_all()\n';
            setModule({
              id: 'sandbox',
              title: 'Quantum Sandbox',
              description: 'Freeplay environment to build and test your own quantum circuits.',
              prerequisites: [],
              estHours: 0,
              content: '# Quantum Sandbox\n\nWelcome to the sandbox! Here you can experiment with Qiskit or QuEST without being tied to a specific tutorial.\n\nUse the **Visual Builder** to drag and drop gates, or write the code yourself.',
              starterCode: sandboxCode
            });
            setCode(sandboxCode);
            setFiles({ 'main.py': sandboxCode });
          }
        }
      })
      .catch(err => console.error("Error fetching curriculum", err));
  }, [id]);

  // Fetch Cloud Project if URL has ?project=
  useEffect(() => {
    if (projectId) {
      fetch(`${import.meta.env.VITE_API_URL || ''}/api/projects/${projectId}`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            if (data.files && Object.keys(data.files).length > 0) {
              setFiles(data.files);
              setActiveFile(Object.keys(data.files)[0]);
            } else if (data.code) {
              setFiles({ 'main.py': data.code });
              setActiveFile('main.py');
            }
            setCode(data.code || '');
            setLanguage(data.language as 'python' | 'cpp');
          }
        })
        .catch(err => console.error("Error fetching project", err));
    }
  }, [projectId]);

  const saveProject = async () => {
    try {
      let author = 'Anonymous';
      const userStr = localStorage.getItem('quantumEdgeUser');
      if (userStr) {
         try {
            const obj = JSON.parse(userStr);
            author = obj.email || obj.uid || userStr;
         } catch(e) { author = userStr; }
      }
      
      let token = '';
      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
      } else {
        alert('Please sign in to save projects to the cloud!');
        navigate('/auth');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/projects`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          title: module?.title || 'Sandbox Project', 
          code: files[activeFile],
          files: files,
          language, 
          author
        })
      });
      const data = await response.json();
      if (data._id) {
        navigate(`/?project=${data._id}`, { replace: true });
        const shareUrl = window.location.origin + `/?project=${data._id}`;
        navigator.clipboard.writeText(shareUrl);
        alert('Project saved to cloud! Shareable URL copied to clipboard.');
      }
    } catch (err) {
      alert('Failed to save project.');
    }
  };

  const handleLanguageChange = (e: any) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    if (newLang === 'cpp') {
      const cppCode = '// Include QuEST library\n#include <QuEST.h>\n#include <iostream>\n\nint main() {\n  std::cout << "Write your C++ Quantum circuit here!\\n";\n  return 0;\n}';
      setCode(cppCode);
      setFiles({ 'main.cpp': cppCode });
      setActiveFile('main.cpp');
    } else {
      const pyCode = module?.starterCode || '';
      setCode(pyCode);
      setFiles({ 'main.py': pyCode });
      setActiveFile('main.py');
    }
  }
  const submitChallenge = async () => {
    if (!auth.currentUser) {
      alert('Please sign in to submit challenges to the leaderboard!');
      navigate('/auth');
      return;
    }
    const code = files[activeFile];
    if (!code) return;

    if ((noiseModel === 'depolarizing' || noiseModel === 'thermal') && !isPro) {
      setShowProModal(true);
      return;
    }

    setLoading(true);
    setOutput({ status: 'Grading Challenge...' });
    setAiFeedback('');
    try {
      let token = await auth.currentUser.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/submit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ files, mainFile: activeFile, language, challengeId: module?.id })
      });
      const data = await response.json();
      
      if (!response.ok) {
        setLoading(false);
        setOutput({ error: data.error, errorType: data.errorType || 'system' });
        return;
      }
      
      if (!socket.connected) socket.connect();
      socket.emit('subscribe_job', data.jobId);
      
      const onStatus = (jobData: any) => { setOutput((prev: any) => ({ ...prev, status: jobData.status })); };
      let timer: ReturnType<typeof setTimeout>;
      
      const onResult = (jobData: any) => {
        socket.off('job_status', onStatus);
        socket.off('job_result', onResult);
        clearTimeout(timer);
        
        setLoading(false);
        let result;
        if (jobData.status === 'failed') {
          result = { error: jobData.result?.error || 'Unknown error occurred.', errorType: jobData.result?.errorType || 'system' };
        } else {
          result = {
            status: 'success',
            counts: jobData.result?.counts,
            diagram: jobData.result?.diagram,
            output: jobData.result?.output
          };
          if (id) markCompleted(id);
        }
        setOutput(result);
        
        if (jobData.challengeResult) {
          const { passed, score, metrics, title } = jobData.challengeResult;
          if (passed) {
            alert(`🎉 Challenge Passed!\n\nScore: ${score} XP\nGate Count: ${metrics.gateCount}\nDepth: ${metrics.depth}\nRuntime: ${Math.floor(metrics.runtimeMs)}ms\nFidelity: ${metrics.fidelity ? metrics.fidelity.toFixed(3) : 'N/A'}`);
          } else {
            alert(`❌ Challenge Failed\n\nYour circuit didn't meet the criteria. Try optimizing it further!`);
          }
        }
      };
      
      socket.on('job_status', onStatus);
      socket.on('job_result', onResult);
      
      timer = setTimeout(() => { 
        socket.off('job_status', onStatus);
        socket.off('job_result', onResult);
        setLoading(false); 
        setOutput({ error: 'Connection to execution server timed out.', errorType: 'timeout' }); 
      }, 20000);
    } catch (err) {
      setLoading(false);
      setOutput({ error: 'Failed to connect to execution server.', errorType: 'queue' });
    }
  };

  const runCode = async () => {
    const code = files[activeFile];
    if (!code) return;

    if ((noiseModel === 'depolarizing' || noiseModel === 'thermal') && !isPro) {
      setShowProModal(true);
      return;
    }

    setLoading(true);
    setOutput({ status: 'Running...' });
    setAiFeedback('');
    try {
      let token = '';
      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/simulate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ files, mainFile: activeFile, language, noiseModel })
      });
      const data = await response.json();
      
      if (!response.ok) {
        setLoading(false);
        setOutput({ error: data.error, errorType: data.errorType || 'system' });
        return;
      }
      
      if (!socket.connected) socket.connect();
      socket.emit('subscribe_job', data.jobId);
      
      const onStatus = (jobData: any) => { setOutput((prev: any) => ({ ...prev, status: jobData.status })); };
      let timer: ReturnType<typeof setTimeout>;

      const onResult = (jobData: any) => {
        socket.off('job_status', onStatus);
        socket.off('job_result', onResult);
        clearTimeout(timer);
        
        setLoading(false);
        let result;
        if (jobData.status === 'failed') {
          result = { error: jobData.result?.error || 'Unknown error occurred.', errorType: jobData.result?.errorType || 'system' };
        } else {
          result = {
            status: 'success',
            counts: jobData.result?.counts,
            diagram: jobData.result?.diagram,
            output: jobData.result?.output
          };
          if (id) {
            markCompleted(id);
          }
        }
        setOutput(result);
        
        // Save to history
        setHistory(prev => [{
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          code: code,
          output: result
        }, ...prev].slice(0, 10)); // Keep last 10 runs
      };

      socket.on('job_status', onStatus);
      socket.on('job_result', onResult);

      timer = setTimeout(() => { 
        socket.off('job_status', onStatus);
        socket.off('job_result', onResult);
        setLoading(false); 
        setOutput((prev: any) => prev?.status === 'Running...' ? { error: 'Simulation timed out' } : prev); 
      }, 30000);

    } catch (err: any) {
      setOutput({ error: err.message });
      setLoading(false);
    }
  };

  const requestAiReview = async () => {
    const currentCode = files[activeFile];
    let token = '';
    if (auth.currentUser) {
      token = await auth.currentUser.getIdToken();
    } else {
      alert('Please sign in to request AI Code Reviews!');
      navigate('/auth');
      return;
    }

    setReviewLoading(true);
    setIsAiChatOpen(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/review`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: currentCode, actualErrorOrOutput: output })
      });
      const data = await response.json();
      setAiFeedback(data.feedback);
    } catch (err: any) {
      setAiFeedback(`Error: ${err.message}`);
    } finally {
      setReviewLoading(false);
    }
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async () => {
    const res = await loadRazorpay();
    if (!res) {
      alert('Razorpay SDK failed to load');
      return;
    }
    
    let token = '';
    if (auth.currentUser) {
      token = await auth.currentUser.getIdToken();
    }

    try {
      // Create Order
      const orderRes = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/payment/orders`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (orderRes.status === 401) {
         alert('Please sign in to upgrade to Pro!');
         navigate('/auth');
         return;
      }
      
      const orderData = await orderRes.json();

      let username = '';
      const userStr = localStorage.getItem('quantumEdgeUser');
      if (userStr) {
         try {
            const obj = JSON.parse(userStr);
            username = obj.email || obj.uid || userStr;
         } catch(e) { username = userStr; }
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_placeholder",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "QuantumEdge PRO",
        description: "Unlock Advanced Noise Models & Private Rooms",
        order_id: orderData.id,
        handler: async function (response: any) {
          // Verify Payment
          const verifyRes = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/payment/verify`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              username
            })
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            setIsPro(true);
            setShowProModal(false);
            alert('Welcome to QuantumEdge PRO! Advanced models unlocked.');
          } else {
            alert('Payment verification failed.');
          }
        },
        prefill: {
          name: "Quantum Explorer",
        },
        theme: {
          color: "#8b5cf6"
        }
      };
      
      const rzp1 = new (window as any).Razorpay(options);
      rzp1.open();
    } catch (err) {
      console.error(err);
      alert('Error initiating checkout');
    }
  };

  if (!module) return <div className="lab-container"><div className="glass-panel">Loading lab...</div></div>;

  return (
    <div className="lab-layout">
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', width: '100%', overflow: 'hidden' }}>
        {/* Main Workspace */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Top Header */}
          <div className="lab-header" style={{ padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {module.title}
                {!isConnected && (
                  <span style={{ fontSize: '0.75rem', padding: '2px 6px', background: '#ef4444', color: 'white', borderRadius: '4px', animation: 'pulse 2s infinite' }}>
                    Reconnecting...
                  </span>
                )}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '1rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem' }}>
                <button 
                  title="Code Editor"
                  onClick={() => setViewMode('code')} 
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.4rem 0.8rem', background: viewMode === 'code' ? 'rgba(100, 255, 218, 0.1)' : 'transparent', border: viewMode === 'code' ? '1px solid rgba(100,255,218,0.3)' : '1px solid transparent', borderRadius: '4px', color: viewMode === 'code' ? 'var(--primary)' : '#888', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <span style={{ fontSize: '1rem' }}>💻</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: viewMode === 'code' ? 'bold' : 'normal' }}>Code</span>
                </button>
                <button 
                  className="tour-visual-builder"
                  title="Visual Builder"
                  onClick={() => setViewMode('builder')} 
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.4rem 0.8rem', background: viewMode === 'builder' ? 'rgba(100, 255, 218, 0.1)' : 'transparent', border: viewMode === 'builder' ? '1px solid rgba(100,255,218,0.3)' : '1px solid transparent', borderRadius: '4px', color: viewMode === 'builder' ? 'var(--primary)' : '#888', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <span style={{ fontSize: '1rem' }}>🧩</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: viewMode === 'builder' ? 'bold' : 'normal' }}>Builder</span>
                </button>
                <button 
                  className="tour-ai-review"
                  title="AI Code Review"
                  onClick={requestAiReview} disabled={reviewLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.4rem 0.8rem', background: 'transparent', border: '1px solid transparent', borderRadius: '4px', color: '#888', cursor: reviewLoading ? 'wait' : 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#888'; }}
                >
                  <span style={{ fontSize: '1rem' }}>✨</span>
                  <span style={{ fontSize: '0.8rem' }}>AI Review</span>
                </button>
                <button 
                  className="tour-ai-autocomplete"
                  title="AI Pair Programmer"
                  onClick={triggerAiAutocomplete} disabled={isAiTyping}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.4rem 0.8rem', background: 'transparent', border: '1px solid transparent', borderRadius: '4px', color: '#888', cursor: isAiTyping ? 'wait' : 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#888'; }}
                >
                  <span style={{ fontSize: '1rem' }}>🤖</span>
                  <span style={{ fontSize: '0.8rem' }}>AI Autocomplete</span>
                </button>
                <button 
                  className="tour-save-btn"
                  title="Save to Cloud"
                  onClick={saveProject}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.4rem 0.8rem', background: 'transparent', border: '1px solid transparent', borderRadius: '4px', color: '#888', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#888'; }}
                >
                  <span style={{ fontSize: '1rem' }}>☁️</span>
                  <span style={{ fontSize: '0.8rem' }}>Save</span>
                </button>
              </div>
            </div>

            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <select value={language} onChange={handleLanguageChange} style={{ background: '#222', color: '#fff', border: '1px solid #444', padding: '0.4rem', borderRadius: '4px', fontSize: '0.9rem' }}>
                <option value="python">Python (Qiskit)</option>
                <option value="cpp">C++ (QuEST)</option>
              </select>
              
              <select value={noiseModel} onChange={e => setNoiseModel(e.target.value as any)} style={{ background: '#222', color: '#fff', border: '1px solid #444', padding: '0.4rem', borderRadius: '4px', fontSize: '0.9rem' }}>
                <option value="ideal">Ideal Simulator</option>
                <option value="depolarizing">Depolarizing Noise</option>
                <option value="thermal">Thermal Relaxation</option>
              </select>

              {module?.challenge && (
                <button 
                  onClick={submitChallenge} 
                  disabled={loading}
                  style={{ background: '#10b981', color: '#fff', border: '1px solid #059669', padding: '0.4rem 1.2rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {loading ? 'Submitting...' : '🏆 Submit Challenge'}
                </button>
              )}

              <button 
                className="tour-run-btn" 
                onClick={runCode} 
                disabled={loading}
                style={{ background: 'var(--primary)', color: '#000', border: 'none', padding: '0.4rem 1.2rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                {loading ? 'Running...' : '▶ Run'}
              </button>
            </div>
          </div>

          {/* Editor/Builder Area with Overlay Container */}
          <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
            <div style={{ flex: 1 }}>
              <ResizableSplit
                direction={isMobile ? 'vertical' : 'horizontal'}
                initialRatio={50}
                storageKey="qe-main-split"
                first={
                /* Left side: Editor or Builder */
                <div className="tour-code-editor" style={{ height: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--panel-bg)', position: 'relative', display: 'flex' }}>
                  
                  {viewMode === 'code' && (
                    <div style={{ width: '200px' }}>
                      <FileExplorer
                        files={files}
                        activeFile={activeFile}
                        onFileSelect={(filename) => setActiveFile(filename)}
                        onFileCreate={(filename) => {
                          if (!files[filename]) {
                            setFiles(prev => ({ ...prev, [filename]: '' }));
                            if (!filename.endsWith('/')) {
                              setActiveFile(filename);
                            }
                          }
                        }}
                        onFileDelete={(filename) => {
                          const newFiles = { ...files };
                          delete newFiles[filename];
                          setFiles(newFiles);
                          if (activeFile === filename) {
                            setActiveFile(Object.keys(newFiles)[0]);
                          }
                        }}
                      />
                    </div>
                  )}

                  <div style={{ flex: 1 }}>
                    {viewMode === 'code' ? (
                      <Suspense fallback={<div style={{ padding: 20, color: '#38bdf8' }}>Loading Editor...</div>}>
                        <Editor
                          height="100%"
                          defaultLanguage={language}
                          language={language}
                          theme="vs-dark"
                          value={files[activeFile]}
                          onMount={(editor, monaco) => { 
                            editorRef.current = editor; 
                            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
                              runCode();
                            });
                            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
                              // Save is auto-handled by state, just prevent default browser save
                            });
                          }}
                          onChange={(val) => {
                            setFiles(prev => ({ ...prev, [activeFile]: val || '' }));
                          }}
                          options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            wordWrap: 'on',
                            scrollBeyondLastLine: false,
                            padding: { top: 16 }
                          }}
                        />
                      </Suspense>
                    ) : (
                      <CircuitBuilder 
                        onCodeGenerated={(code) => setFiles(prev => ({ ...prev, [activeFile]: code }))} 
                        socket={socket}
                        roomId={module.id}
                        username={localStorage.getItem('quantumEdgeUser') || `User_${Math.floor(Math.random()*1000)}`}
                      />
                    )}
                  </div>
                </div>
              }
              second={
                /* Right side: Tabbed Output Panel */
                <div style={{ height: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--panel-bg)', display: 'flex', flexDirection: 'column' }}>
                  {/* Output Tabs */}
                  <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--border-color)' }}>
                    {['visualizer', 'terminal', 'snippets', 'history', ...(module?.challenge ? ['challenge'] : [])].map(tab => (
                      <button 
                        key={tab}
                        onClick={() => setActiveOutputTab(tab as any)}
                        style={{
                          flex: 1,
                          padding: '0.8rem',
                          background: activeOutputTab === tab ? 'rgba(255,255,255,0.05)' : 'transparent',
                          color: activeOutputTab === tab ? 'var(--primary)' : '#888',
                          border: 'none',
                          borderBottom: activeOutputTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          textTransform: 'capitalize',
                          transition: 'all 0.2s'
                        }}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div style={{ flex: 1, overflow: 'auto', padding: '1rem', boxSizing: 'border-box' }}>
                    
                    {/* Visualizer Tab */}
                    {activeOutputTab === 'visualizer' && (
                      <div className="tour-visualizer" style={{ height: '100%' }}>
                        {output && output.diagram ? (
                          <pre className="circuit-diagram" style={{ margin: 0 }}>{output.diagram}</pre>
                        ) : (
                          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#666' }}>Run simulation to see circuit diagram</div>
                        )}
                      </div>
                    )}


                    {/* Terminal Tab */}
                    {activeOutputTab === 'terminal' && (
                      <div className="tour-terminal" style={{ height: '100%', fontFamily: 'monospace', whiteSpace: 'pre-wrap', padding: '1rem', background: '#0d0d0d', overflowY: 'auto' }}>
                        {aiFeedback && (
                          <div className="ai-feedback" style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(100,255,218,0.1)', borderLeft: '4px solid var(--primary)', borderRadius: '4px' }}>
                            <strong style={{ color: 'var(--primary)' }}>✨ AI Reviewer:</strong>
                            <p style={{ margin: '0.5rem 0 0 0' }}>{aiFeedback}</p>
                          </div>
                        )}
                        {output ? (
                          <>
                            {output.output && output.output.trim() !== '' && (
                              <div style={{ color: '#ccc', marginBottom: '0.5rem' }}>{output.output}</div>
                            )}
                            {output.error && (
                              <div style={{
                                padding: '1rem',
                                marginTop: '0.5rem',
                                borderRadius: '4px',
                                background: output.errorType === 'compilation' ? 'rgba(245, 158, 11, 0.1)' : 
                                            output.errorType === 'docker' ? 'rgba(168, 85, 247, 0.1)' :
                                            output.errorType === 'queue' ? 'rgba(234, 179, 8, 0.1)' :
                                            'rgba(239, 68, 68, 0.1)',
                                borderLeft: `4px solid ${
                                  output.errorType === 'compilation' ? '#f59e0b' : 
                                  output.errorType === 'docker' ? '#a855f7' :
                                  output.errorType === 'queue' ? '#eab308' :
                                  '#ef4444'
                                }`
                              }}>
                                <strong style={{ 
                                  display: 'block', marginBottom: '0.5rem',
                                  color: output.errorType === 'compilation' ? '#f59e0b' : 
                                         output.errorType === 'docker' ? '#a855f7' :
                                         output.errorType === 'queue' ? '#eab308' :
                                         '#ef4444'
                                }}>
                                  {output.errorType === 'compilation' && '⚠️ C++ Compilation Error'}
                                  {output.errorType === 'docker' && '🐳 Sandbox Provisioning Error'}
                                  {output.errorType === 'queue' && '🚦 System Queue Error'}
                                  {output.errorType === 'timeout' && '⏳ Execution Timeout'}
                                  {output.errorType === 'rate_limit' && '🛑 Rate Limit Exceeded'}
                                  {(!output.errorType || output.errorType === 'runtime' || output.errorType === 'system') && '❌ Runtime Error'}
                                </strong>
                                <div style={{ color: '#ffaaaa' }}>{output.error}</div>
                              </div>
                            )}
                            {output.status && !output.error && (!output.output || output.output.trim() === '') && (
                              <div style={{ color: '#888' }}>{output.status}</div>
                            )}
                          </>
                        ) : (
                          <div style={{ color: '#666' }}>Awaiting execution...</div>
                        )}
                      </div>
                    )}

                    {/* Snippets Tab */}
                    {activeOutputTab === 'snippets' && (
                      <QuantumSnippets 
                        onSelect={(snippetCode) => {
                          setFiles(prev => ({ ...prev, [activeFile]: snippetCode }));
                          setViewMode('code');
                          setActiveOutputTab('terminal');
                        }}
                      />
                    )}

                    {/* History Tab */}
                    {activeOutputTab === 'history' && (
                      <div style={{ padding: '1rem', height: '100%', overflowY: 'auto' }}>
                        <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>⏪ Execution History</h3>
                        {history.length === 0 ? (
                          <div style={{ color: '#666' }}>No runs yet. Run a simulation to save it to history.</div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {history.map(item => (
                              <div key={item.id} style={{ background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                  <span style={{ color: '#aaa', fontSize: '0.8rem' }}>{item.timestamp}</span>
                                  <button 
                                    onClick={() => {
                                      if (confirm('Restore this snapshot? Your current code will be overwritten.')) {
                                        setFiles(prev => ({ ...prev, [activeFile]: item.code }));
                                        setOutput(item.output);
                                      }
                                    }}
                                    style={{ background: 'transparent', color: 'var(--primary)', border: 'none', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}
                                  >
                                    Restore
                                  </button>
                                </div>
                                <div style={{ color: item.output.error ? '#ff5555' : '#ccc', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'monospace' }}>
                                  {item.output.error ? item.output.error : (item.output.output || item.output.status)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Challenge Tab */}
                    {activeOutputTab === 'challenge' && module?.challenge && (
                      <div style={{ padding: '1.5rem', height: '100%', overflowY: 'auto' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '1.5rem' }}>
                          <h2 style={{ margin: '0 0 1rem 0', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>🏆</span> {module.challenge.title}
                          </h2>
                          <p style={{ fontSize: '1.1rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                            {module.challenge.description}
                          </p>
                          <div style={{ background: '#111', padding: '1rem', borderRadius: '4px', borderLeft: '4px solid #10b981' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: '#aaa' }}>Target Criteria:</h4>
                            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#ddd' }}>
                              {Object.entries(module.challenge.criteria).map(([k, v]) => (
                                <li key={k}><strong>{k}</strong>: {v as any}</li>
                              ))}
                            </ul>
                          </div>
                          <p style={{ marginTop: '1.5rem', color: '#aaa', fontSize: '0.9rem' }}>
                            When you are ready, click <strong>"Submit Challenge"</strong> at the top to have your code graded. Good luck!
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              }
            />
            </div>

            {/* Floating AI Tutor Chat Overlay */}
            {isAiChatOpen && (
              <AiTutorChat 
                onClose={() => setIsAiChatOpen(false)} 
                codeContext={code}
                initialFeedback={aiFeedback} 
              />
            )}
          </div>
        </div>
      </div>

      {/* Pro Modal */}
      {showProModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ padding: '2rem', maxWidth: '500px', width: '90%', textAlign: 'center' }}>
            <h2 style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '2rem' }}>Upgrade to PRO 🚀</h2>
            <p style={{ marginBottom: '1.5rem', color: '#ccc', lineHeight: '1.6' }}>
              Advanced quantum noise models like <strong>Depolarizing</strong> and <strong>Thermal</strong> require significant computational resources.
            </p>
            <ul style={{ textAlign: 'left', margin: '0 auto 2rem auto', display: 'inline-block', color: '#fff' }}>
              <li>✨ Real-world hardware noise simulation</li>
              <li>🔒 Create private multiplayer rooms</li>
              <li>⚡ Unlimited AI Code Reviews</li>
              <li>🏆 Exclusive PRO Badge on Leaderboard</li>
            </ul>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="start-btn" onClick={handleUpgrade} style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                Extend Pro - ₹1/mo
              </button>
              <button className="start-btn" onClick={() => setShowProModal(false)} style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)' }}>
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
