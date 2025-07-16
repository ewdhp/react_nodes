import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import 'xterm/css/xterm.css';
import { useTerminalSocket } from './TerminalProvider';

const XtermTerminal = ({ nodeId, nodeName, isMaximized, onToggleMaximize }) => {
  const { createTerminal, sendInput, subscribeToOutput } = useTerminalSocket();
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const terminalId = `node-${nodeId}`;

  useEffect(() => {
    // Initialize xterm.js terminal
    const terminal = new Terminal({
      cursorBlink: true,
      cursorStyle: 'default',
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      fontSize: 14,
      lineHeight: 1.4,
      allowTransparency: true,
      scrollback: 1000,
      tabStopWidth: 4,
      // Fix for proper text alignment
      convertEol: true,
      cols: 80,
      rows: 24,
      // Hide scrollbar
      scrollSensitivity: 10,
      fastScrollSensitivity: 5
    });

    // Add addons
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    
    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);
    
    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Local input buffer to avoid state updates causing re-renders
    let currentInputBuffer = '';
    let initFrame = null;

    // Open terminal in the DOM element
    if (terminalRef.current) {
      terminal.open(terminalRef.current);
      
      // Hide scrollbar by adding CSS to the terminal viewport
      setTimeout(() => {
        const viewport = terminalRef.current?.querySelector('.xterm-viewport');
        if (viewport) {
          viewport.style.scrollbarWidth = 'none'; // Firefox
          viewport.style.msOverflowStyle = 'none'; // IE and Edge
          // Add webkit scrollbar hiding
          const style = document.createElement('style');
          style.textContent = `
            .xterm-viewport::-webkit-scrollbar {
              display: none;
            }
          `;
          document.head.appendChild(style);
        }
      }, 100);
      
      // Immediate initialization without delays - terminal should be cached and ready
      initFrame = requestAnimationFrame(() => {
        try {
          fitAddon.fit();
          terminal.focus(); // Ensure terminal has focus for keyboard input
          
          // Let the server handle all initial messages and prompts
        } catch (error) {
          console.warn('Failed to initialize terminal:', error);
        }
      });
    }

    // Handle terminal input
    terminal.onData((data) => {
      // Handle special keys
      if (data === '\r') { // Enter key
        if (currentInputBuffer.trim()) {
          terminal.writeln(''); // Move to next line        // Send command to server
        sendInput(terminalId, currentInputBuffer);
        currentInputBuffer = '';
        // Don't write prompt - let server handle it
        } else {
          terminal.writeln('');
          // Don't write prompt for empty commands either
        }
      } else if (data === '\u0003') { // Ctrl+C
        terminal.writeln('^C');
        currentInputBuffer = '';
        // Don't write prompt - let server handle it
      } else if (data === '\u000C') { // Ctrl+L (clear screen)
        terminal.clear();
        currentInputBuffer = '';
        // Don't write prompt - let server handle it
      } else if (data === '\u0015') { // Ctrl+U (clear line)
        // Clear the current input buffer and line
        terminal.write('\r\x1b[K$ ');
        currentInputBuffer = '';
      } else if (data === '\u007F') { // Backspace
        if (currentInputBuffer.length > 0) {
          currentInputBuffer = currentInputBuffer.slice(0, -1);
          terminal.write('\b \b'); // Move back, write space, move back again
        }
      } else if (data === '\t') { // Tab
        // Add tab as spaces (could be enhanced with auto-completion)
        const spaces = '    ';
        currentInputBuffer += spaces;
        terminal.write(spaces);
      } else if (data.charCodeAt(0) >= 32) { // Printable characters
        currentInputBuffer += data;
        terminal.write(data);
      }
    });

    // Create WebSocket terminal connection
    createTerminal(terminalId);

    // Add keyboard event listener for Ctrl+Alt+= to toggle maximize
    const handleKeyDown = (e) => {
      console.log('Key event:', e.key, 'Ctrl:', e.ctrlKey, 'Alt:', e.altKey, 'Target:', e.target);
      if (e.ctrlKey && e.altKey && e.key === '=') {
        console.log('Terminal toggle shortcut detected!');
        e.preventDefault();
        e.stopPropagation();
        if (onToggleMaximize) {
          onToggleMaximize();
        }
      }
    };

    // Add event listener to document to capture before XTerm does
    document.addEventListener('keydown', handleKeyDown, true); // Use capture phase

    // Subscribe to output from WebSocket
    const unsubscribe = subscribeToOutput(terminalId, (data) => {
      console.log('XTerm received raw data:', JSON.stringify(data));
      console.log('XTerm received raw data (readable):', data);
      
      // Process and write data to terminal
      if (data) {
        // For xterm, we can preserve more formatting since it handles ANSI codes
        // Only clean up problematic sequences
        let processedData = data;
        
        console.log('Before processing:', JSON.stringify(processedData));
        
        // Handle common ls output formatting issues
        if (data.includes('drwxr-xr-x') || data.includes('-rw-r--r--') || data.includes('total ')) {
          // Add line breaks for directory listings if they're missing
          processedData = data
            .replace(/(drwxr-xr-x|d---------|-rw-r--r--|lrwxrwxrwx|[d-][rwx-]{9})/g, '\r\n$1')
            .replace(/^\r\n/, ''); // Remove leading line break
        }
        
        // More aggressive cleanup - remove connection messages entirely
        processedData = processedData
          // Remove WebSocket connection messages completely
          .replace(/Connected to WebSocket server[\r\n\s]*.*?[\r\n]*/g, '')
          // Remove SSH connection messages completely
          .replace(/\[SSH CONNECTED\][\r\n\s]*.*?[\r\n]*/g, '')
          // Clean up multiple consecutive prompts
          .replace(/(\$ )+/g, '$ ')
          .replace(/(> )+/g, '> ')
          // Remove standalone > prompts on their own lines
          .replace(/[\r\n]\s*>\s*[\r\n]/g, '\r\n')
          .replace(/^>\s*[\r\n]/g, '')
          // Clean up line breaks before prompts
          .replace(/(\r?\n)+(\$ )/g, '\r\n$2')
          .replace(/(\r?\n)+(> )/g, '\r\n$2')
          // Limit consecutive line breaks
          .replace(/(\r?\n){3,}/g, '\r\n\r\n')
          // Remove alternating prompts
          .replace(/(\$ \r?\n> )/g, '$ ')
          .replace(/(> \r?\n\$ )/g, '$ ');
        
        console.log('After processing:', JSON.stringify(processedData));
        
        // Skip writing if it's just a standalone prompt or connection message
        const isJustPrompt = /^[\s]*[$>]\s*$/.test(processedData.trim());
        const isEmptyOrWhitespace = /^\s*$/.test(processedData);
        const isConnectionMessage = data.includes('CONNECTED') || 
                                   data.includes('Welcome to') || 
                                   data.includes('Type commands') || 
                                   data.includes('WebSocket server') ||
                                   /^Connected to WebSocket server\s*$/m.test(data.trim());
        
        if (!isJustPrompt && !isEmptyOrWhitespace && !isConnectionMessage) {
          terminal.write(processedData);
        } else {
          console.log('Skipped writing standalone prompt, empty data, or connection message:', JSON.stringify(processedData));
        }
        
        // Only add prompt if the output doesn't already contain or end with a prompt
        const hasPromptInData = processedData.includes('$ ') || processedData.includes('> ');
        const endsWithPrompt = processedData.endsWith('$ ') || 
                              processedData.endsWith('\n$ ') || 
                              processedData.endsWith('\r\n$ ') ||
                              processedData.endsWith('> ') ||
                              processedData.endsWith('\n> ') ||
                              processedData.endsWith('\r\n> ');
        
        if (!isConnectionMessage && 
            !isJustPrompt &&
            !isEmptyOrWhitespace &&
            !hasPromptInData &&
            !endsWithPrompt &&
            processedData.trim().length > 0) {
          console.log('Adding prompt after:', JSON.stringify(processedData));
          terminal.write('\r\n');
        }
        
        // If it's a connection message, just show the prompt once
        if (isConnectionMessage) {
          //terminal.write('> ');
        }
      }
    });

    // Cleanup on unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      unsubscribe();
      if (initFrame) {
        cancelAnimationFrame(initFrame);
      }
      terminal.dispose();
    };
  }, [nodeId, nodeName, createTerminal, sendInput, subscribeToOutput, terminalId, onToggleMaximize]); // Remove inputBuffer from dependencies

  // Handle terminal resize and focus
  useEffect(() => {
    if (fitAddonRef.current && xtermRef.current && xtermRef.current.element) {
      // Use requestAnimationFrame for immediate, smooth resize without delays
      const resizeFrame = requestAnimationFrame(() => {
        try {
          // Check if terminal is properly initialized before fitting
          if (xtermRef.current.element && terminalRef.current?.offsetWidth > 0) {
            fitAddonRef.current.fit();
            // Ensure terminal has focus after resize
            xtermRef.current.focus();
          }
        } catch (error) {
          console.warn('Failed to fit terminal:', error);
        }
      });
      
      return () => cancelAnimationFrame(resizeFrame);
    }
  }, [isMaximized]);

  // Handle visibility changes and immediate fitting when terminal becomes visible
  useEffect(() => {
    if (!terminalRef.current || !fitAddonRef.current || !xtermRef.current) return;

    // Use Intersection Observer to detect when terminal becomes visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0) {
            // Terminal is now visible, fit immediately
            const fitFrame = requestAnimationFrame(() => {
              try {
                if (fitAddonRef.current && xtermRef.current?.element) {
                  fitAddonRef.current.fit();
                  xtermRef.current.focus();
                }
              } catch (error) {
                console.warn('Failed to fit terminal on visibility change:', error);
              }
            });
            
            // Cleanup frame if component unmounts
            return () => cancelAnimationFrame(fitFrame);
          }
        });
      },
      { threshold: 0.1 } // Trigger when at least 10% is visible
    );

    observer.observe(terminalRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (fitAddonRef.current && xtermRef.current && xtermRef.current.element) {
        // Use requestAnimationFrame for immediate resize without delays
        const resizeFrame = requestAnimationFrame(() => {
          try {
            // Check if terminal is properly initialized before fitting
            if (xtermRef.current.element && terminalRef.current?.offsetWidth > 0) {
              fitAddonRef.current.fit();
              // Maintain focus after resize
              xtermRef.current.focus();
            }
          } catch (error) {
            console.warn('Failed to fit terminal on resize:', error);
          }
        });
        
        return () => cancelAnimationFrame(resizeFrame);
      }
    };

    window.addEventListener('resize', handleResize);

    // Add ResizeObserver to watch for container size changes
    let resizeObserver;
    if (terminalRef.current) {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(terminalRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  return (
    <div style={{
      height: '100%',
      width: '100%',
      background: '#ffffff',
      color: '#000000',
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      fontSize: '14px',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      margin: 0,
      padding: 0
    }}>
      {/* XTerm Terminal Container */}
      <div
        ref={terminalRef}
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          overflow: 'hidden', // Important for xterm
          background: '#ffffff',
          position: 'relative',
          // Ensure terminal text is left-aligned and not centered
          textAlign: 'left',
          // Make sure the container can receive focus
          outline: 'none',
          margin: 0,
          padding: 0
        }}
        onClick={() => {
          // Focus the terminal when clicking anywhere in the container
          if (xtermRef.current) {
            xtermRef.current.focus();
          }
        }}
        tabIndex={0} // Make the container focusable
      />
    </div>
  );
};

export default XtermTerminal;
