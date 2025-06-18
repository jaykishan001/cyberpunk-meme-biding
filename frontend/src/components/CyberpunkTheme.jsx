import React, { useState, useEffect, useRef } from 'react';

const CyberpunkTimeUI = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeButton, setActiveButton] = useState(null);
  const [dataStreams, setDataStreams] = useState([]);
  const [terminalHistory, setTerminalHistory] = useState([
    { type: 'system', text: 'NEURAL LINK v2.1.7 - CYBERNET TERMINAL' },
    { type: 'system', text: 'Connection established...' },
    { type: 'system', text: 'Type "help" for available commands' },
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  const commands = {
    help: () => [
      { type: 'output', text: 'Available commands:' },
      { type: 'output', text: '  help - Show this help message' },
      { type: 'output', text: '  time - Display current time' },
      { type: 'output', text: '  status - System status' },
      { type: 'output', text: '  matrix - Enter the matrix' },
      { type: 'output', text: '  hack - Initiate hack sequence' },
      { type: 'output', text: '  clear - Clear terminal' },
    ],
    time: () => [
      { type: 'output', text: `Current time: ${new Date().toLocaleString()}` }
    ],
    status: () => [
      { type: 'output', text: 'SYSTEM STATUS: OPERATIONAL' },
      { type: 'output', text: 'CPU: 23% | RAM: 4.2GB/16GB | NET: SECURE' },
      { type: 'output', text: 'FIREWALL: ACTIVE | ENCRYPTION: AES-256' },
    ],
    matrix: () => [
      { type: 'output', text: 'Entering the Matrix...' },
      { type: 'output', text: 'Wake up, Neo...' },
      { type: 'output', text: 'The Matrix has you.' },
    ],
    hack: () => [
      { type: 'output', text: 'Initiating hack sequence...' },
      { type: 'output', text: 'Scanning for vulnerabilities...' },
      { type: 'output', text: 'Access granted. Welcome, hacker.' },
    ],
    clear: () => 'clear'
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const cursorTimer = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => {
      clearInterval(timer);
      clearInterval(cursorTimer);
    };
  }, []);

  useEffect(() => {
    const streamTimer = setInterval(() => {
      setDataStreams(prev => [
        ...prev.slice(-15),
        {
          id: Date.now(),
          value: Math.random().toString(36).substr(2, 12).toUpperCase(),
          delay: Math.random() * 2
        }
      ]);
    }, 800);

    return () => clearInterval(streamTimer);
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalHistory]);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  };

  const handleButtonClick = (buttonId) => {
    setActiveButton(buttonId);
    setTimeout(() => setActiveButton(null), 200);
    
    // Add terminal output when button is clicked
    const buttonActions = {
      matrix: () => setTerminalHistory(prev => [...prev, 
        { type: 'input', text: 'matrix' },
        ...commands.matrix()
      ]),
      neural: () => setTerminalHistory(prev => [...prev,
        { type: 'input', text: 'neural_link --connect' },
        { type: 'output', text: 'Neural link established...' },
        { type: 'output', text: 'Consciousness uploaded successfully.' }
      ]),
      quantum: () => setTerminalHistory(prev => [...prev,
        { type: 'input', text: 'quantum --entangle' },
        { type: 'output', text: 'Quantum entanglement initiated...' },
        { type: 'output', text: 'Reality matrix synchronized.' }
      ]),
      cyber: () => setTerminalHistory(prev => [...prev,
        { type: 'input', text: 'cybersec --scan' },
        { type: 'output', text: 'Scanning cyber defenses...' },
        { type: 'output', text: 'All systems secure. Firewall active.' }
      ])
    };

    buttonActions[buttonId]?.();
  };

  const handleTerminalInput = (e) => {
    if (e.key === 'Enter') {
      const command = currentInput.trim().toLowerCase();
      const newHistory = [...terminalHistory, { type: 'input', text: currentInput }];
      
      if (commands[command]) {
        const result = commands[command]();
        if (result === 'clear') {
          setTerminalHistory([]);
        } else {
          setTerminalHistory([...newHistory, ...result]);
        }
      } else if (command) {
        setTerminalHistory([...newHistory, { type: 'error', text: `Command not found: ${command}` }]);
      } else {
        setTerminalHistory(newHistory);
      }
      
      setCurrentInput('');
    }
  };

  const focusTerminal = () => {
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-blue-900/30 to-green-900/30"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          animation: 'grid-move 25s linear infinite'
        }}></div>
      </div>

      {/* Floating Data Streams */}
      <div className="absolute inset-0 pointer-events-none">
        {dataStreams.map(stream => (
          <div
            key={stream.id}
            className="absolute right-4 text-cyan-400/60 text-xs font-mono"
            style={{
              top: '-20px',
              animation: `data-fall 4s linear infinite ${stream.delay}s`
            }}
          >
            {stream.value}
          </div>
        ))}
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row min-h-screen">
        {/* Left Panel - Main Interface */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-5xl lg:text-7xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 animate-pulse">
              NEURAL LINK
            </div>
            <div className="text-cyan-400 text-sm tracking-[0.3em] mb-2">
              ━━━ QUANTUM INTERFACE ONLINE ━━━
            </div>
            <div className="flex items-center justify-center gap-2 text-xs">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400">CONNECTED</span>
            </div>
          </div>

          {/* Time Display */}
          <div className="mb-8 text-center">
            <div className="text-6xl lg:text-8xl font-bold mb-4 text-cyan-400 glow-text font-mono">
              {formatTime(currentTime)}
            </div>
            <div className="text-xl lg:text-2xl text-purple-400 mb-2 tracking-wider">
              {formatDate(currentTime)}
            </div>
            <div className="text-xs text-gray-500 tracking-[0.2em]">
              COORDINATED UNIVERSAL TIME
            </div>
          </div>

          {/* Enhanced Neon Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {[
              { id: 'matrix', label: 'ENTER MATRIX', subtitle: 'REALITY.EXE', color: 'green', glow: '#00ff41' },
              { id: 'neural', label: 'NEURAL LINK', subtitle: 'CONNECT.SYS', color: 'cyan', glow: '#00ffff' },
              { id: 'quantum', label: 'QUANTUM NET', subtitle: 'ENTANGLE.QBT', color: 'purple', glow: '#8b5cf6' },
              { id: 'cyber', label: 'CYBER CORE', subtitle: 'SECURE.NET', color: 'pink', glow: '#ff0080' }
            ].map(button => (
              <button
                key={button.id}
                onClick={() => handleButtonClick(button.id)}
                className={`
                  group relative p-6 bg-black border-2 rounded-lg
                  transition-all duration-300 transform hover:scale-105
                  ${activeButton === button.id ? 'scale-95' : ''}
                  hover:shadow-2xl overflow-hidden
                `}
                style={{
                  borderColor: button.glow,
                  boxShadow: `0 0 20px ${button.glow}40, inset 0 0 20px ${button.glow}10`
                }}
              >
                {/* Button Glow Effect */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                  style={{ backgroundColor: button.glow }}
                ></div>
                
                {/* Animated Border */}
                <div 
                  className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(45deg, ${button.glow}, transparent, ${button.glow})`,
                    backgroundSize: '200% 200%',
                    animation: 'border-flow 2s ease-in-out infinite',
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'xor',
                    padding: '2px'
                  }}
                ></div>

                <div className="relative z-10 text-center">
                  <div 
                    className="text-lg font-bold mb-1 tracking-wider"
                    style={{ 
                      color: button.glow,
                      textShadow: `0 0 10px ${button.glow}, 0 0 20px ${button.glow}80`
                    }}
                  >
                    {button.label}
                  </div>
                  <div className="text-xs text-gray-400 tracking-widest font-mono">
                    {button.subtitle}
                  </div>
                </div>

                {/* Corner Decorations */}
                <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2" style={{ borderColor: button.glow }}></div>
                <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2" style={{ borderColor: button.glow }}></div>
                <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2" style={{ borderColor: button.glow }}></div>
                <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2" style={{ borderColor: button.glow }}></div>
              </button>
            ))}
          </div>

          {/* Status Indicators */}
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div className="p-3 bg-black/50 border border-green-400/30 rounded">
              <div className="text-green-400 font-bold">ONLINE</div>
              <div className="text-xs text-gray-400">STATUS</div>
            </div>
            <div className="p-3 bg-black/50 border border-cyan-400/30 rounded">
              <div className="text-cyan-400 font-bold">99.9%</div>
              <div className="text-xs text-gray-400">UPTIME</div>
            </div>
            <div className="p-3 bg-black/50 border border-purple-400/30 rounded">
              <div className="text-purple-400 font-bold">SECURE</div>
              <div className="text-xs text-gray-400">LINK</div>
            </div>
          </div>
        </div>

        {/* Right Panel - Terminal */}
        <div className="w-full lg:w-96 bg-black/80 border-l border-cyan-400/30 flex flex-col">
          <div className="p-4 border-b border-cyan-400/30 bg-black/50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="ml-4 text-cyan-400 text-sm font-bold">TERMINAL</span>
            </div>
          </div>
          
          <div 
            ref={terminalRef}
            onClick={focusTerminal}
            className="flex-1 p-4 overflow-y-auto cursor-text"
            style={{ maxHeight: 'calc(100vh - 100px)' }}
          >
            {terminalHistory.map((line, index) => (
              <div key={index} className="mb-1">
                {line.type === 'input' && (
                  <div className="text-green-400">
                    <span className="text-cyan-400">user@cybernet:~$</span> {line.text}
                  </div>
                )}
                {line.type === 'output' && (
                  <div className="text-gray-300 ml-4">{line.text}</div>
                )}
                {line.type === 'system' && (
                  <div className="text-yellow-400">{line.text}</div>
                )}
                {line.type === 'error' && (
                  <div className="text-red-400">{line.text}</div>
                )}
              </div>
            ))}
            
            {/* Current Input Line */}
            <div className="flex items-center text-green-400">
              <span className="text-cyan-400">user@cybernet:~$</span>
              <input
                ref={inputRef}
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleTerminalInput}
                className="ml-2 bg-transparent border-none outline-none flex-1 text-green-400 font-mono"
                autoFocus
              />
              <span className={`${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity`}>█</span>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(40px, 40px); }
        }
        
        @keyframes data-fall {
          0% { transform: translateY(-100px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        
        @keyframes border-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .glow-text {
          text-shadow: 0 0 10px currentColor, 0 0 20px currentColor, 0 0 40px currentColor, 0 0 80px currentColor;
        }

        .cyber-card {
          background: linear-gradient(135deg, #18181b 80%, #0fffc1 100%);
          border: 2px solid #0fffc1;
      `}</style>
    </div>
  );
};

export default CyberpunkTimeUI;