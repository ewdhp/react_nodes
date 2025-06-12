import React, { useRef, useEffect } from "react";
import { FaRedo } from "react-icons/fa";

const LogPane = ({
    showLog,
    runCount,
    outputLog,
    runExecutions,
    collapsedRuns,
    setCollapsedRuns,
    replayRun
}) => {
    const logContentRef = useRef(null);

    useEffect(() => {
        const el = logContentRef.current;
        if (!el) return;
        let isDown = false;
        let startY, scrollTop;
        const onMouseDown = (e) => {
            isDown = true;
            startY = e.pageY - el.offsetTop;
            scrollTop = el.scrollTop;
            el.style.cursor = 'grabbing';
            e.preventDefault();
        };
        const onMouseLeave = () => {
            isDown = false;
            el.style.cursor = 'default';
        };
        const onMouseUp = () => {
            isDown = false;
            el.style.cursor = 'default';
        };
        const onMouseMove = (e) => {
            if (!isDown) return;
            const y = e.pageY - el.offsetTop;
            const walk = (y - startY) * 1.2; // scroll speed
            el.scrollTop = scrollTop - walk;
        };
        el.addEventListener('mousedown', onMouseDown);
        el.addEventListener('mouseleave', onMouseLeave);
        el.addEventListener('mouseup', onMouseUp);
        el.addEventListener('mousemove', onMouseMove);
        return () => {
            el.removeEventListener('mousedown', onMouseDown);
            el.removeEventListener('mouseleave', onMouseLeave);
            el.removeEventListener('mouseup', onMouseUp);
            el.removeEventListener('mousemove', onMouseMove);
        };
    }, [showLog]);

    if (!showLog) return null;

    return (
        <div
            style={{
                position: "relative",
                width: "45%",
                height: "100vh",
                background: "rgba(48, 48, 48, 0.95)", // changed to rgba gray
                color: "#fff",
                padding: "1em 1em 0 1em",
                fontFamily: "monospace",
                userSelect: "none",
                cursor: "grab",
                overflow: "hidden",
                boxSizing: "border-box",
                zIndex: 100,
            }}
        >
            <h4 style={{ marginTop: 0, marginBottom: 8 }}>SSH Output</h4>
            <div style={{ marginBottom: 8, color: "#aaa" }}>
                Total Runs: {runCount}
            </div>
            <div
                ref={logContentRef}
                style={{
                    height: "calc(100vh - 80px)", // Fill remaining space, adjust for header
                    overflow: "hidden",
                    cursor: "grab"
                }}
            >
                {Array.from(
                    outputLog.reduce((acc, entry) => {
                        if (!acc.has(entry.run)) acc.set(entry.run, []);
                        acc.get(entry.run).push(entry);
                        return acc;
                    }, new Map())
                ).map(([run, entries]) => {
                    const runNodes = runExecutions[run]?.nodes || [];
                    return (
                        <div key={run} style={{ marginBottom: 8 }}>
                            <div
                                style={{
                                    background: "#333",
                                    color: "#fff",
                                    padding: "4px 8px",
                                    borderRadius: 4,
                                    marginBottom: 4,
                                    fontWeight: "bold",
                                    cursor: "pointer",
                                    userSelect: "none",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    minHeight: 32
                                }}
                                onClick={() =>
                                    setCollapsedRuns(prev => ({
                                        ...prev,
                                        [run]: !prev[run]
                                    }))
                                }
                            >
                                <span>
                                    {collapsedRuns[run] ? "▶" : "▼"} Run #{run}
                                </span>
                                <button
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "#4fc3f7",
                                        cursor: "pointer",
                                        marginLeft: 12,
                                        fontSize: 15,
                                        display: "flex",
                                        alignItems: "center",
                                        padding: 0
                                    }}
                                    title="Replay this run"
                                    onClick={e => {
                                        e.stopPropagation();
                                        replayRun(run);
                                    }}
                                >
                                    <FaRedo />
                                </button>
                            </div>
                            {!collapsedRuns[run] && entries.map((entry, idx) => (
                                <div key={idx}>
                                    <b>
                                        Node {runNodes.find
                                            (n => n.id === entry.nodeId)
                                            ?.data?.label || entry.nodeId}
                                    </b>
                                    <span style={{ float: "right", color: "#aaa" }}>
                                        {entry.time}
                                    </span>
                                    <pre style={{ whiteSpace: "pre-wrap" }}>{entry.output}</pre>
                                    <hr />
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LogPane;
