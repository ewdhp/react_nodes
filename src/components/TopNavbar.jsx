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
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3"/>
            <circle cx="6" cy="12" r="3"/>
            <circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
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
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="9" y1="9" x2="15" y2="9"/>
            <line x1="9" y1="12" x2="15" y2="12"/>
            <line x1="9" y1="15" x2="13" y2="15"/>
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
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
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
            <path d="M12.89 1.45l8 4A2 2 0 0 1 22 7.24v9.53a2 2 0 0 1-1.11 1.79l-8 4a2 2 0 0 1-1.78 0l-8-4a2 2 0 0 1-1.11-1.79V7.24a2 2 0 0 1 1.11-1.79l8-4a2 2 0 0 1 1.78 0z"/>
            <path d="M12 22V12"/>
            <path d="m1.11 7.24 8.89 4.76"/>
            <path d="m22 7.24-8.89 4.76"/>
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
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
            <path d="M9 14l2 2 4-4"/>
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
