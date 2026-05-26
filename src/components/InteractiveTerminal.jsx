import React, { useState, useEffect, useRef } from 'react';
import './InteractiveTerminal.css';

const InteractiveTerminal = () => {
  const [history, setHistory] = useState([
    { type: 'system', text: 'Booting EELU OS v20.27...' },
    { type: 'system', text: 'Initializing Computer Science Senior Module...' },
    { type: 'success', text: 'System ready. Type /help for available commands.' },
  ]);
  const [input, setInput] = useState('');
  const bodyRef = useRef(null);
  const inputRef = useRef(null);

  const handleCommand = (cmd) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    const newHistory = [...history, { type: 'user', text: `> ${trimmed}` }];
    
    switch (trimmed.toLowerCase()) {
      case '/help':
        newHistory.push({ type: 'output', text: 'Available commands: /help, /seniors, /countdown, /clear, /coffee' });
        break;
      case '/seniors':
        newHistory.push({ type: 'output', text: 'EELU CS Seniors 2027: The best class to ever compile. 0 errors, 0 warnings.' });
        break;
      case '/countdown':
        newHistory.push({ type: 'output', text: 'Calculating time to graduation... [ERROR] Too much time left. Focus on your project!' });
        break;
      case '/coffee':
        newHistory.push({ type: 'output', text: '☕ Brewing coffee... Done. +10 Coding Speed.' });
        break;
      case '/clear':
        setHistory([]);
        setInput('');
        return;
      default:
        newHistory.push({ type: 'error', text: `Command not found: ${trimmed}. Type /help.` });
    }

    setHistory(newHistory);
    setInput('');
  };

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
    }
  }, []);

  const handleBodyClick = () => {
    if (inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
    }
  };

  return (
    <div className="terminal-container" onClick={handleBodyClick}>
      <div className="terminal-header">
        <div className="terminal-dots">
          <span className="dot close"></span>
          <span className="dot minimize"></span>
          <span className="dot maximize"></span>
        </div>
        <div className="terminal-title">bash - class_of_2027</div>
      </div>
      <div className="terminal-body" ref={bodyRef}>
        {history.map((line, index) => (
          <div key={index} className={`terminal-line ${line.type}`}>
            {line.text}
          </div>
        ))}
        <div className="terminal-input-line">
          <span className="prompt">root@eelu:~# </span>
          <div className="input-wrapper">
            <span className="input-text">
              {input ? input : <span className="terminal-placeholder">Type /help to see commands...</span>}
            </span>
            <span className="blinking-cursor">|</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCommand(input);
              }}
              autoComplete="off"
              spellCheck="false"
              className="hidden-input"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveTerminal;
