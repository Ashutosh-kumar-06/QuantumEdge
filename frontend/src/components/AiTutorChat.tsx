import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

interface AiTutorChatProps {
  onClose: () => void;
  codeContext: string;
  initialFeedback?: string;
}

export default function AiTutorChat({ onClose, codeContext, initialFeedback }: AiTutorChatProps) {
  const [messages, setMessages] = useState<Message[]>(
    initialFeedback ? [{ role: 'ai', content: initialFeedback }] : []
  );
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: messages,
          newPrompt: userMsg,
          codeContext: codeContext
        })
      });
      const data = await response.json();
      if (data.feedback) {
        setMessages([...newMessages, { role: 'ai', content: data.feedback }]);
      } else {
        setMessages([...newMessages, { role: 'ai', content: `Error: ${data.error}` }]);
      }
    } catch (err: any) {
      setMessages([...newMessages, { role: 'ai', content: `Error: ${err.message}` }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ position: 'absolute', top: '10px', right: '10px', width: '400px', height: 'calc(100% - 20px)', background: 'var(--panel-bg)', border: '1px solid var(--primary)', borderRadius: '8px', zIndex: 100, display: 'flex', flexDirection: 'column', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
        <h3 style={{ margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>✨</span> AI Tutor</h3>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', background: msg.role === 'user' ? 'rgba(100,255,218,0.1)' : 'rgba(255,255,255,0.05)', padding: '0.8rem 1rem', borderRadius: '8px', maxWidth: '90%', border: msg.role === 'user' ? '1px solid rgba(100,255,218,0.3)' : '1px solid rgba(255,255,255,0.1)' }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
          </div>
        ))}
        {loading && <div style={{ color: '#888', fontStyle: 'italic' }}>AI is thinking...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem' }}>
        <input 
          type="text" 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Ask a follow-up question..." 
          style={{ flex: 1, background: '#222', border: '1px solid #444', color: '#fff', padding: '0.8rem', borderRadius: '4px' }}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()} style={{ background: 'var(--primary)', color: '#000', border: 'none', padding: '0 1rem', borderRadius: '4px', cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>Send</button>
      </div>
    </div>
  );
}
