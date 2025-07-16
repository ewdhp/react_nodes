import React, { useState, useEffect, useRef } from 'react';
import { useTerminalSocket } from './TerminalProvider';

const BasicTerminal = ({ nodeId, nodeName, isMaximized, onToggleMaximize }) => {
  // Format terminal output to handle server-side formatting issues
  const formatOutput = (text) => {
    if (!text) return '';
    
    // Handle common cases where server doesn't send proper line breaks
    let formatted = text
      // Handle ANSI escape sequences (basic color codes)
      .replace(/\x1b\[[0-9;]*m/g, '')
      // Normalize line endings to \n but preserve all line breaks
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Preserve tabs as proper spacing
      .replace(/\t/g, '    '); // Convert tabs to 4 spaces

    // Special handling for 'ls' command output that might be missing line breaks
    // Look for patterns like "drwxr-xr-x" followed by numbers and text
    if (formatted.includes('drwxr-xr-x') || formatted.includes('-rw-r--r--') || formatted.includes('total ')) {
      // Split on directory/file permission patterns and add line breaks
      formatted = formatted
        // Add line break before each permission string that starts a new entry
        .replace(/(drwxr-xr-x|d---------|-rw-r--r--|lrwxrwxrwx|[d-][rwx-]{9})/g, '\n$1')
        // Clean up any double line breaks
        .replace(/\n\n/g, '\n')
        // Remove leading line break if it exists
        .replace(/^\n/, '');
    }

    return formatted;
  };

  // Render output preserving all line breaks
  const renderOutput = (text) => {
    if (!text) return `Welcome to ${nodeName} terminal\nType commands and press Enter...\n\n`;
    
    // Split by newlines and render each line, preserving empty lines
    const lines = text.split('\n');
    return lines.map((line, index) => (
      <div key={index} style={{ 
        minHeight: '1.4em',
        whiteSpace: 'pre-wrap', // Preserve whitespace and allow wrapping
        fontFamily: 'inherit'
      }}>
        {line.length === 0 ? '\u00A0' : line} {/* Non-breaking space for empty lines */}
      </div>
    ));
  };

  const [output, setOutput] = useState('');
  const [input, setInput] = useState('');
  const { createTerminal, sendInput, subscribeToOutput } = useTerminalSocket();
  const outputRef = useRef(null);
  const terminalId = `node-${nodeId}`;

  useEffect(() => {
    // Create terminal when component mounts
    createTerminal(terminalId);

    // Subscribe to output
    const unsubscribe = subscribeToOutput(terminalId, (data) => {
      console.log('Terminal received raw data:', data); // Debug log
      console.log('Raw data bytes:', data.split('').map(c => c.charCodeAt(0))); // Show character codes
      const formatted = formatOutput(data);
      console.log('Formatted output:', formatted); // Debug log
      console.log('Formatted lines:', formatted.split('\n')); // Show as array of lines
      setOutput(prev => prev + formatted);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [nodeId]);

  useEffect(() => {
    // Auto-scroll to bottom when new output is added
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (input.trim()) {
        // Add the command to output display with proper formatting
        const commandLine = `$ ${input}\n`;
        setOutput(prev => prev + commandLine);
        // Send to server
        sendInput(terminalId, input);
        setInput('');
      }
    } else if (e.key === 'Tab') {
      // Prevent tab from moving focus away from terminal
      e.preventDefault();
      // Add tab character to input (could be enhanced with auto-completion later)
      setInput(prev => prev + '    '); // 4 spaces for tab
    } else if (e.ctrlKey && e.key === 'c') {
      // Handle Ctrl+C (interrupt)
      e.preventDefault();
      setOutput(prev => prev + '^C\n');
      setInput('');
    } else if (e.ctrlKey && e.key === 'l') {
      // Handle Ctrl+L (clear screen)
      e.preventDefault();
      clearTerminal();
    }
  };

  const clearTerminal = () => {
    setOutput('');
  };

  return (
    <div style={{
      height: '100%',
      background: '#1e1e1e',
      color: '#ffffff',
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      fontSize: '14px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Terminal Header */}
      <div style={{
        background: '#2d2d2d',
        padding: '8px 16px',
        borderBottom: '1px solid #3e3e3e',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <span style={{ fontWeight: 'bold', color: '#ffffff' }}>
          Basic Terminal: {nodeName}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Maximize/Minimize Button */}
          <button
            onClick={onToggleMaximize}
            style={{
              background: 'transparent',
              border: '1px solid #555',
              color: '#ffffff',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            onMouseOver={(e) => e.target.style.background = '#444'}
            onMouseOut={(e) => e.target.style.background = 'transparent'}
            title={isMaximized ? "Minimize Terminal" : "Maximize Terminal"}
          >
            {isMaximized ? (
              // Minimize Icon
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3v3a2 2 0 0 1-2 2H3"/>
                <path d="m3 3 5 5"/>
                <path d="M21 8h-3a2 2 0 0 1-2-2V3"/>
                <path d="m16 3 5 5"/>
                <path d="M8 21v-3a2 2 0 0 0-2-2H3"/>
                <path d="m3 16 5 5"/>
                <path d="M16 21v-3a2 2 0 0 0 2-2h3"/>
                <path d="m21 16-5 5"/>
              </svg>
            ) : (
              // Maximize Icon
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3"/>
                <path d="M21 8V5a2 2 0 0 0-2-2h-3"/>
                <path d="M3 16v3a2 2 0 0 0 2 2h3"/>
                <path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
              </svg>
            )}
            {isMaximized ? 'Minimize' : 'Maximize'}
          </button>
          
          {/* Clear Button */}
          <button
            onClick={clearTerminal}
            style={{
              background: 'transparent',
              border: '1px solid #555',
              color: '#ffffff',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
            onMouseOver={(e) => e.target.style.background = '#444'}
            onMouseOut={(e) => e.target.style.background = 'transparent'}
            title="Clear Terminal"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div
        ref={outputRef}
        style={{
          flex: 1,
          padding: '16px',
          overflow: 'auto',
          backgroundColor: '#1e1e1e',
          minHeight: 0, // Important for flex child to be scrollable
          textAlign: 'left',
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
          fontSize: '14px',
          lineHeight: '1.4',
          overflowWrap: 'break-word',
          whiteSpace: 'pre-wrap', // Changed from 'pre' to 'pre-wrap' for better line wrapping
          wordBreak: 'break-word'
        }}
      >
        {renderOutput(output)}
      </div>

      {/* Terminal Input */}
      <div style={{
        background: '#2d2d2d',
        padding: '8px 16px',
        borderTop: '1px solid #3e3e3e',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <span style={{ color: '#00ff00', marginRight: '8px' }}>$</span>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder="Type command and press Enter..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: '#ffffff',
            fontSize: '14px',
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            outline: 'none',
            padding: '4px',
            lineHeight: '1.4'
          }}
          autoFocus
        />
      </div>
    </div>
  );
};

export default BasicTerminal;