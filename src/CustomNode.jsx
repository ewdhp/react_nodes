import React, { useRef, useState } from 'react';
import { Handle, Position } from 'reactflow';
import NodeMenu from './NodeMenu';

function CustomNode({ data, selected, hideNavBar = false, borderRadius = 0, children, style = {} }) {
    // Initialize from data
    const initialRectSize = data?.rectSize || { width: 360, height: 180 };
    const initialCollapsed = data?.collapsed || false;
    const [size, setSize] = useState(initialRectSize);
    const [collapsed, setCollapsed] = useState(initialCollapsed);
    const [prevSize, setPrevSize] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuFocusIdx, setMenuFocusIdx] = useState(0); // Track focused menu item
    const [edgesVisible, setEdgesVisible] = useState(true); // new state for edge visibility
    const menuItems = [
        {
            label: edgesVisible ? 'Hide Edges' : 'Show Edges',
            onClick: () => setEdgesVisible((v) => !v),
        },
        { label: 'Menu Item', onClick: () => {/* TODO: implement action */ } },
        // Add more menu items here if needed
    ];
    const menuButtonRef = useRef(); // new: for anchor
    const hiddenLabelRef = useRef();

    // Always focus first item when menu opens
    React.useEffect(() => {
        if (menuOpen) setMenuFocusIdx(0);
    }, [menuOpen]);

    // Keyboard navigation for menu
    React.useEffect(() => {
        if (!menuOpen) {
            setMenuFocusIdx(0);
            return;
        }
        const handleKeyDown = (e) => {
            if (!menuOpen) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setMenuFocusIdx((idx) => (idx + 1) % menuItems.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setMenuFocusIdx((idx) => (idx - 1 + menuItems.length) % menuItems.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                menuItems[menuFocusIdx]?.onClick?.();
                setMenuOpen(false);
            } else if (e.key === 'Escape') {
                setMenuOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [menuOpen, menuFocusIdx, menuItems]);

    // --- Collapse/Expand logic ---
    // [ANNOTATION: Collapse/Expand handlers below]
    const navBarRef = useRef();
    const handleExpand = () => {
        // Restore previous size if available, else use default
        const rectSize = prevSize && prevSize.width && prevSize.height ? prevSize : { width: 360, height: 180 };
        setSize(rectSize);
        setCollapsed(false);
        if (data.onNodeUpdate) {
            data.onNodeUpdate({ ...data, collapsed: false, rectSize });
        }
        window.setTimeout(() => {
            alert('Node expanded via double click: ' + (data?.label || 'Node') + ' (id: ' + (data?.id || 'unknown') + ')');
        }, 0);
    };
    const handleCollapse = () => {
        // Save current size before collapsing
        const rectSize = size;
        setPrevSize(rectSize);
        setSize(rectSize);
        setCollapsed(true);
        if (data.onNodeUpdate) {
            data.onNodeUpdate({ ...data, collapsed: true, rectSize });
        }
    };

    // --- UI ---
    // [ANNOTATION: Main render logic below]
    // Collapsed: render as a circle with play button centered, label above
    const [playHover, setPlayHover] = React.useState(false);
    const [executing, setExecuting] = React.useState(false); // Add executing state
    if (collapsed) {
        // Calculate circle diameter (min 48, max label width + padding)
        let circleDiameter = 56;
        if (navBarRef.current) {
            circleDiameter = Math.max(48, navBarRef.current.getBoundingClientRect().height + 16);
        }
        let labelWidth = 0;
        if (hiddenLabelRef.current) {
            labelWidth = hiddenLabelRef.current.offsetWidth;
        }
        circleDiameter = Math.max(circleDiameter, 36, labelWidth * 0.7 + 36); // heuristic
        return (
            <div /* [ANNOTATION: Collapsed node wrapper] */ style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                width: '100%',
                position: 'relative',
            }}>
                {/* [ANNOTATION: Collapsed label above node] */}
                <div style={{
                    marginBottom: 6,
                    fontWeight: 600,
                    color: '#222',
                    fontSize: 15,
                    textAlign: 'center',
                    maxWidth: 120,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}>{data?.label || 'Node'}</div>
                {/* [ANNOTATION: Hidden span for label width] */}
                <span ref={hiddenLabelRef} style={{
                    position: 'absolute',
                    left: -9999,
                    top: -9999,
                    fontWeight: 600,
                    fontSize: 16,
                    fontFamily: 'inherit',
                    whiteSpace: 'pre',
                    pointerEvents: 'none',
                    visibility: 'hidden',
                }}>{data?.label || 'Node'}</span>
                {/* [ANNOTATION: Collapsed main circle node] */}
                <div
                    style={{
                        width: circleDiameter,
                        height: circleDiameter,
                        background: '#f5f5f5',
                        borderRadius: '50%',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: selected ? '1px solid gray' : '1px solid #e0e0e0',
                        pointerEvents: 'auto',
                        transition: 'width 0.18s, height 0.18s, border-radius 0.18s',
                        minWidth: 0,
                        minHeight: 0,
                        padding: 0,
                        zIndex: 1,
                        cursor: 'default', // Fix: show default pointer, not hand
                    }}
                    onDoubleClick={handleExpand}
                >
                    {/* [ANNOTATION: Play button in collapsed state] */}
                    <button
                        onClick={() => {
                            setExecuting(true);
                            setTimeout(() => setExecuting(false), 1200); // Simulate execution
                        }}
                        onMouseEnter={() => setPlayHover(true)}
                        onMouseLeave={() => setPlayHover(false)}
                        onDoubleClick={e => e.stopPropagation()}
                        style={{
                            background: playHover ? '#ffe0b2' : 'none',
                            border: 'none',
                            color: 'inherit',
                            borderRadius: '50%',
                            padding: 0,
                            width: 32,
                            height: 32,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer', // Only the play button is clickable
                            boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
                            transition: 'background 0.15s',
                        }}
                        title="Run"
                    >
                        {/* [ANNOTATION: Play triangle SVG] */}
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <polygon points="5,3 17,10 5,17" fill={executing ? '#43a047' : playHover ? '#ffa726' : 'gray'} />
                        </svg>
                    </button>
                    {/* [ANNOTATION: Handles in collapsed state] */}
                    {edgesVisible && <Handle type="target" position={Position.Left} style={{ background: '#1976d2', width: 10, height: 10, borderRadius: 5, left: -11, top: '50%', transform: 'translateY(-50%)', zIndex: 10, pointerEvents: 'none' }} />}
                    {edgesVisible && <Handle type="source" position={Position.Right} style={{ background: '#1976d2', width: 10, height: 10, borderRadius: 5, right: -11, top: '50%', transform: 'translateY(-50%)', zIndex: 10, pointerEvents: 'none' }} />}
                </div>
            </div>
        );
    }

    return (
        <>
            {/* [ANNOTATION: Label above node when collapsed] */}
            {collapsed && (
                <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: '-1.8em',
                    transform: 'translateX(-50%)',
                    fontWeight: 600,
                    color: '#222',
                    fontSize: 15,
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                    zIndex: 20,
                }}>
                    {data?.label || 'Node'}
                </div>
            )}
            <div
                style={{
                    width: style?.width || '100%',
                    height: style?.height || '100%',
                    background: '#f5f5f5',
                    borderRadius: collapsed ? '50%' : borderRadius,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    overflow: 'visible',
                    border: selected ? '1px solid gray' : '1px solid #e0e0e0',
                    resize: 'none',
                    pointerEvents: 'auto',
                    transition: 'all 0.2s cubic-bezier(.4,2,.6,1)',
                    cursor: 'default',
                }}
                onDoubleClick={!collapsed ? handleCollapse : undefined}
            >
                {/* [ANNOTATION: Top nav bar in expanded state] */}
                {!collapsed && !hideNavBar && (
                    <div
                        ref={navBarRef}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            padding: '4px 10px 4px 4px',
                            borderBottom: 'none', // transparent, no border
                            minHeight: 32,
                            background: 'transparent', // transparent background
                            borderTopLeftRadius: 8,
                            borderTopRightRadius: 8,
                            position: 'relative',
                            zIndex: 2,
                        }}
                    >
                        {/* [ANNOTATION: Play button in expanded state] */}
                        <button
                            onClick={() => alert('Run!')}
                            onMouseEnter={() => setPlayHover(true)}
                            onMouseLeave={() => setPlayHover(false)}
                            style={{
                                background: 'none', // always none
                                border: 'none',
                                color: 'inherit',
                                borderRadius: 4,
                                padding: '4px 10px',
                                fontWeight: 600,
                                fontSize: 15,
                                cursor: 'pointer',
                                marginRight: 8,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'box-shadow 0.15s, outline 0.15s',
                                boxShadow: playHover ? '0 0 0 4px #ffa72655' : 'none', // orange glow on hover
                                outline: playHover ? '2px solid #ffa726' : 'none', // orange border on hover
                            }}
                            title="Run"
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                {/* [ANNOTATION: Play triangle SVG] */}
                                <polygon points="5,3 17,10 5,17" fill="gray" />
                            </svg>
                        </button>
                        {/* [ANNOTATION: Node label in nav bar] */}
                        <span style={{ fontWeight: 600, color: '#222', flex: 1 }}>{data?.label || 'Node'}</span>
                        {/* [ANNOTATION: Menu button and menu] */}
                        <div style={{ position: 'relative', zIndex: 10 }}>
                            <button
                                ref={menuButtonRef}
                                onClick={() => setMenuOpen((v) => !v)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#888',
                                    fontSize: 20,
                                    cursor: 'pointer',
                                    padding: 2,
                                    borderRadius: 4,
                                }}
                                title="Menu"
                            >
                                ☰
                            </button>
                            {/* Ensure NodeMenu is always rendered when open, and zIndex is high */}
                            <NodeMenu
                                menuItems={menuItems}
                                open={menuOpen}
                                onClose={() => setMenuOpen(false)}
                                anchorRef={menuButtonRef}
                            />
                        </div>
                    </div>
                )}
                {/* [ANNOTATION: Main content area in expanded state] */}
                {!collapsed && (
                    <div style={{ flex: 1, width: '100%', height: '100%', display: 'flex', alignItems: 'stretch', justifyContent: 'stretch', position: 'relative', zIndex: 2 }}>
                        {children || data?.content || 'Content'}
                    </div>
                )}
                {/* [ANNOTATION: Handles in expanded state] */}
                {/* Handles removed from expanded state to avoid duplicate handles. Child nodes (like Prompt) should render their own handles. */}
            </div>
        </>
    );
}

export default CustomNode;
