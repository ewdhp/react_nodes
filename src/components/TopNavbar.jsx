import React from 'react';

const TopNavbar = ({ activeSection, setActiveSection }) => {
  console.log('TopNavbar rendering with activeSection:', activeSection);
  
  return (
    <div 
      style={{
        height: 60,
        background: '#1e1e1e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '1px solid #333',
        zIndex: 1000,
        flexShrink: 0,
        position: 'relative',
        minHeight: '60px'
      }}
      data-testid="top-navbar"
    >
      {/* Navigation buttons - centered */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {/* Graph Section Icon */}
        <button
          onClick={() => setActiveSection('graph')}
          style={{
            background: activeSection === 'graph' ? '#007acc' : 'transparent',
            border: 'none',
            color: '#fff',
            padding: '12px 20px',
            margin: '0 8px',
            borderRadius: 6,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            outline: 'none',
            boxShadow: activeSection === 'graph' ? '0 0 0 2px rgba(0, 122, 204, 0.3)' : 'none'
          }}
          title="Graph (Alt+1 or Alt+Ctrl+→/←)"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="5" cy="5" r="3" fill="currentColor"/>
            <circle cx="19" cy="5" r="3" fill="currentColor"/>
            <circle cx="12" cy="19" r="3" fill="currentColor"/>
            <line x1="8" y1="5" x2="16" y2="5" stroke="currentColor" strokeWidth="2"/>
            <line x1="7.5" y1="7.5" x2="10.5" y2="16.5" stroke="currentColor" strokeWidth="2"/>
            <line x1="16.5" y1="7.5" x2="13.5" y2="16.5" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>

        {/* Terminal Section Icon */}
        <button
          onClick={() => setActiveSection('terminal')}
          style={{
            background: activeSection === 'terminal' ? '#007acc' : 'transparent',
            border: 'none',
            color: '#fff',
            padding: '12px 20px',
            margin: '0 8px',
            borderRadius: 6,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            outline: 'none',
            boxShadow: activeSection === 'terminal' ? '0 0 0 2px rgba(0, 122, 204, 0.3)' : 'none'
          }}
          title="Scripts (Alt+2 or Alt+Ctrl+→/←)"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6"/>
            <polyline points="8 6 2 12 8 18"/>
          </svg>
        </button>

        {/* XTerm Terminal Section Icon */}
        <button
          onClick={() => setActiveSection('xterm')}
          style={{
            background: activeSection === 'xterm' ? '#007acc' : 'transparent',
            border: 'none',
            color: '#fff',
            padding: '12px 20px',
            margin: '0 8px',
            borderRadius: 6,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            outline: 'none',
            boxShadow: activeSection === 'xterm' ? '0 0 0 2px rgba(0, 122, 204, 0.3)' : 'none'
          }}
          title="Terminal (Alt+3 or Ctrl+Alt+T)"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="4,17 10,11 4,5"/>
            <line x1="12" y1="19" x2="20" y2="19"/>
          </svg>
        </button>

        {/* Config Section Icon */}
        <button
          onClick={() => setActiveSection('config')}
          style={{
            background: activeSection === 'config' ? '#007acc' : 'transparent',
            border: 'none',
            color: '#fff',
            padding: '12px 20px',
            margin: '0 8px',
            borderRadius: 6,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            outline: 'none',
            boxShadow: activeSection === 'config' ? '0 0 0 2px rgba(0, 122, 204, 0.3)' : 'none'
          }}
          title="JSON Config (Alt+4 or Alt+Ctrl+→/←)"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9.5 3h5L16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-4z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>

        {/* LogPane Section Icon */}
        <button
          onClick={() => setActiveSection('logs')}
          style={{
            background: activeSection === 'logs' ? '#007acc' : 'transparent',
            border: 'none',
            color: '#fff',
            padding: '12px 20px',
            margin: '0 8px',
            borderRadius: 6,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            outline: 'none',
            boxShadow: activeSection === 'logs' ? '0 0 0 2px rgba(0, 122, 204, 0.3)' : 'none'
          }}
          title="Logs (Alt+5 or Alt+Ctrl+→/←)"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10,9 9,9 8,9"/>
          </svg>
        </button>

        {/* 3D Graph Section Icon */}
        <button
          onClick={() => setActiveSection('3d')}
          style={{
            background: activeSection === '3d' ? '#007acc' : 'transparent',
            border: 'none',
            color: '#fff',
            padding: '12px 20px',
            margin: '0 8px',
            borderRadius: 6,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            outline: 'none',
            boxShadow: activeSection === '3d' ? '0 0 0 2px rgba(0, 122, 204, 0.3)' : 'none'
          }}
          title="3D Graph (Alt+6 or Alt+Ctrl+→/←)"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TopNavbar;
