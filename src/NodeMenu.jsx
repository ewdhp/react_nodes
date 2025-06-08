import React, { useRef, useEffect } from 'react';

function NodeMenu({ menuItems, open, onClose, anchorRef }) {
    const [focusIdx, setFocusIdx] = React.useState(0);
    const menuRef = useRef();

    // Always focus first item when menu opens
    useEffect(() => {
        if (open) setFocusIdx(0);
    }, [open]);

    // Keyboard navigation
    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e) => {
            if (!open) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setFocusIdx((idx) => (idx + 1) % menuItems.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setFocusIdx((idx) => (idx - 1 + menuItems.length) % menuItems.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                menuItems[focusIdx]?.onClick?.();
                onClose();
            } else if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, focusIdx, menuItems, onClose]);

    // Close menu on outside click
    useEffect(() => {
        if (!open) return;
        const handleClick = (e) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(e.target) &&
                (!anchorRef?.current || !anchorRef.current.contains(e.target))
            ) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open, onClose, anchorRef]);

    if (!open) return null;
    return (
        <div
            ref={menuRef}
            style={{
                position: 'absolute',
                right: 0,
                top: 28,
                background: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: 6,
                boxShadow: '0 2px 8px rgba(0,0,0,0.13)',
                zIndex: 10,
                minWidth: 120,
            }}
        >
            {menuItems.map((item, idx) => (
                <div
                    key={item.label}
                    tabIndex={0}
                    style={{
                        padding: '8px 16px',
                        color: '#1976d2',
                        fontWeight: 500,
                        cursor: 'pointer',
                        background: idx === focusIdx ? '#bbdefb' : '#fff',
                        outline: idx === focusIdx ? '2px solid #2196f3' : 'none',
                        borderRadius: 4,
                        transition: 'background 0.15s',
                    }}
                    onClick={() => {
                        item.onClick();
                        onClose();
                    }}
                    onMouseEnter={() => setFocusIdx(idx)}
                >
                    {item.label}
                </div>
            ))}
        </div>
    );
}

export default NodeMenu;
