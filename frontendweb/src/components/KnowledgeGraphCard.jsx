import React, { useEffect, useMemo, useState } from 'react';
import { BrainCircuit, Clock3, GitBranch, HelpCircle, Layers, Sparkles } from 'lucide-react';
import './KnowledgeGraphCard.css';
import api from '../api';

const LEVEL_ORDER = {
    beginner: 1,
    all_levels: 2,
    intermediate: 3,
    advanced: 4,
};

const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getMasteryColor = (mastery) => {
    if (mastery >= 80) return '#34d399';
    if (mastery >= 60) return '#60a5fa';
    if (mastery >= 40) return '#fbbf24';
    return '#f87171';
};

const extractListData = (response) => {
    const payload = response?.data;

    if (payload?.success && Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.results)) return payload.results;
    if (Array.isArray(payload)) return payload;

    return [];
};

const buildEdges = (nodes) => {
    const byCategory = {};
    nodes.forEach((node) => {
        const category = String(node.category || 'other');
        if (!byCategory[category]) byCategory[category] = [];
        byCategory[category].push(node);
    });

    const edges = [];
    const seen = new Set();

    Object.values(byCategory).forEach((group) => {
        if (group.length < 2) return;

        const sorted = [...group].sort((a, b) => {
            const aRank = LEVEL_ORDER[String(a.level || 'all_levels')] || 2;
            const bRank = LEVEL_ORDER[String(b.level || 'all_levels')] || 2;
            if (aRank !== bRank) return aRank - bRank;
            return String(a.label || '').localeCompare(String(b.label || ''));
        });

        for (let i = 1; i < sorted.length; i += 1) {
            const source = String(sorted[i - 1].id);
            const target = String(sorted[i].id);
            const key = `${source}->${target}`;
            if (source === target || seen.has(key)) continue;
            seen.add(key);
            edges.push({ source, target });
        }
    });

    return edges;
};

const applyLayout = (nodes, edges) => {
    if (!nodes.length) return [];

    const nodeMap = new Map(nodes.map((node) => [String(node.id), { ...node }]));
    if (!edges.length) {
        const ordered = [...nodes].sort((a, b) => String(a.label).localeCompare(String(b.label)));
        const columns = Math.min(4, Math.max(1, ordered.length));
        const rows = Math.ceil(ordered.length / columns);

        ordered.forEach((node, index) => {
            const row = Math.floor(index / columns);
            const col = index % columns;
            const x = columns === 1 ? 50 : 12 + (col * (76 / (columns - 1)));
            const y = rows === 1 ? 50 : 20 + (row * (60 / (rows - 1)));

            const current = nodeMap.get(String(node.id));
            current.x = Number(x.toFixed(2));
            current.y = Number(y.toFixed(2));
            nodeMap.set(String(node.id), current);
        });

        return nodes.map((node) => nodeMap.get(String(node.id)));
    }

    const adjacency = {};
    const inDegree = {};

    nodes.forEach((node) => {
        adjacency[String(node.id)] = [];
        inDegree[String(node.id)] = 0;
    });

    edges.forEach((edge) => {
        const source = String(edge.source);
        const target = String(edge.target);
        if (!(source in adjacency) || !(target in adjacency) || source === target) return;
        adjacency[source].push(target);
        inDegree[target] += 1;
    });

    const queue = Object.keys(inDegree).filter((id) => inDegree[id] === 0);
    const levels = {};
    Object.keys(inDegree).forEach((id) => { levels[id] = 0; });
    const visited = new Set();

    while (queue.length) {
        const current = queue.shift();
        visited.add(current);

        adjacency[current].forEach((neighbor) => {
            levels[neighbor] = Math.max(levels[neighbor], levels[current] + 1);
            inDegree[neighbor] -= 1;
            if (inDegree[neighbor] === 0) queue.push(neighbor);
        });
    }

    Object.keys(levels).forEach((id) => {
        if (!visited.has(id)) levels[id] = 0;
    });

    const maxLevel = Math.max(...Object.values(levels), 0);
    const groups = {};
    Object.entries(levels).forEach(([id, level]) => {
        if (!groups[level]) groups[level] = [];
        groups[level].push(id);
    });

    Object.entries(groups).forEach(([levelText, ids]) => {
        const level = Number(levelText);
        ids.sort((a, b) => {
            const aLabel = String(nodeMap.get(a)?.label || '');
            const bLabel = String(nodeMap.get(b)?.label || '');
            return aLabel.localeCompare(bLabel);
        });

        const x = maxLevel === 0 ? 12 : 12 + (level * (76 / maxLevel));
        ids.forEach((id, index) => {
            const y = ((index + 1) * (100 / (ids.length + 1)));
            const current = nodeMap.get(id);
            current.x = Number(x.toFixed(2));
            current.y = Number(clamp(y, 10, 90).toFixed(2));
            nodeMap.set(id, current);
        });
    });

    return nodes.map((node) => nodeMap.get(String(node.id)));
};

const buildLiveFallbackGraph = async () => {
    const [coursesResult, progressResult, dashboardResult] = await Promise.allSettled([
        api.get('students/courses/?page_size=100'),
        api.get('students/progress/'),
        api.get('students/dashboard/'),
    ]);

    const courses = coursesResult.status === 'fulfilled'
        ? extractListData(coursesResult.value)
        : [];
    const progressRows = progressResult.status === 'fulfilled'
        ? extractListData(progressResult.value)
        : [];

    const nodeMap = new Map();

    courses.forEach((course) => {
        const id = String(course.id);
        const totalLessons = toNumber(course.total_lessons, 0);
        const progress = clamp(toNumber(course.progress_percentage, 0), 0, 100);

        let importance = 1;
        if (totalLessons >= 4) importance += 1;
        if (totalLessons >= 8) importance += 1;
        if ((LEVEL_ORDER[String(course.level)] || 2) >= 3) importance += 1;

        nodeMap.set(id, {
            id,
            label: String(course.title || 'Untitled Course'),
            mastery: Number(progress.toFixed(1)),
            importance: clamp(importance, 1, 5),
            category: String(course.category || 'other'),
            level: String(course.level || 'all_levels'),
        });
    });

    progressRows.forEach((row) => {
        const id = String(row.course_id);
        const progress = clamp(toNumber(row.progress_percentage, 0), 0, 100);

        if (nodeMap.has(id)) {
            const current = nodeMap.get(id);
            current.mastery = Number(progress.toFixed(1));
            const lessonCount = toNumber(row.total_lessons, 0);
            if (lessonCount >= 8) current.importance = Math.min(5, current.importance + 1);
            nodeMap.set(id, current);
            return;
        }

        let importance = 1;
        const lessonCount = toNumber(row.total_lessons, 0);
        if (lessonCount >= 4) importance += 1;
        if (lessonCount >= 8) importance += 1;

        nodeMap.set(id, {
            id,
            label: String(row.course_title || 'Untitled Course'),
            mastery: Number(progress.toFixed(1)),
            importance: clamp(importance, 1, 5),
            category: 'other',
            level: 'all_levels',
        });
    });

    const nodes = Array.from(nodeMap.values());
    if (!nodes.length) {
        return null;
    }

    const edges = buildEdges(nodes);
    const positionedNodes = applyLayout(nodes, edges);

    const dashboardData = dashboardResult.status === 'fulfilled'
        ? (dashboardResult.value?.data?.data || {})
        : {};

    return {
        nodes: positionedNodes,
        edges,
        signals: {
            quiz_accuracy: toNumber(dashboardData.average_quiz_score, 0),
            time_spent_hours: 0,
            flashcards_performance: 0,
            doubts_asked: 0,
        },
        meta: {
            source: 'live_backend_fallback',
            node_count: positionedNodes.length,
            edge_count: edges.length,
            warnings: ['knowledge_graph_endpoint_unavailable'],
        },
    };
};

export function KnowledgeGraphCard({ isLoading }) {
    const [graphData, setGraphData] = useState(null);
    const [isGraphLoading, setIsGraphLoading] = useState(true);
    const [notice, setNotice] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;

        const fetchKnowledgeGraph = async (initial = false) => {
            if (initial) {
                setIsGraphLoading(true);
            }

            try {
                const res = await api.get('students/knowledge-graph/');
                if (!res.data?.success || !res.data?.data) {
                    throw new Error('Invalid response payload');
                }

                if (!isMounted) return;
                setGraphData(res.data.data);
                setNotice('');
                setError('');
                return;
            } catch (primaryError) {
                const fallbackData = await buildLiveFallbackGraph();

                if (!isMounted) return;

                if (fallbackData) {
                    setGraphData(fallbackData);
                    setNotice('Knowledge graph API unavailable. Showing live fallback from course/progress data.');
                    setError('');
                    return;
                }

                const statusCode = primaryError?.response?.status;
                const detail = primaryError?.response?.data?.error?.message
                    || primaryError?.response?.data?.detail
                    || '';
                const statusLabel = statusCode ? ` (${statusCode})` : '';
                setError(`Unable to load live knowledge graph data from backend${statusLabel}${detail ? `: ${detail}` : '.'}`);
            } finally {
                if (initial && isMounted) {
                    setIsGraphLoading(false);
                }
            }
        };

        fetchKnowledgeGraph(true);
        const refreshInterval = setInterval(() => fetchKnowledgeGraph(false), 60000);

        return () => {
            isMounted = false;
            clearInterval(refreshInterval);
        };
    }, []);

    const nodes = useMemo(() => {
        const rawNodes = Array.isArray(graphData?.nodes) ? graphData.nodes : [];
        return rawNodes.map((node) => ({
            ...node,
            id: String(node.id),
            label: String(node.label || 'Untitled'),
            mastery: clamp(toNumber(node.mastery, 0), 0, 100),
            importance: clamp(toNumber(node.importance, 1), 1, 5),
            x: clamp(toNumber(node.x, 50), 0, 100),
            y: clamp(toNumber(node.y, 50), 0, 100),
        }));
    }, [graphData]);

    const edges = useMemo(() => {
        const rawEdges = Array.isArray(graphData?.edges) ? graphData.edges : [];
        return rawEdges
            .map((edge) => ({
                source: String(edge.source),
                target: String(edge.target),
            }))
            .filter((edge) => edge.source !== edge.target);
    }, [graphData]);

    const signals = graphData?.signals || {};
    const averageMastery = nodes.length
        ? nodes.reduce((sum, node) => sum + node.mastery, 0) / nodes.length
        : 0;

    const isCardLoading = isLoading || isGraphLoading;
    const hasNoLiveNodes = !isCardLoading && nodes.length === 0;

    return (
        <div className="card knowledge-graph-card slide-up" style={{ animationDelay: '0.8s' }}>
            <div className="knowledge-graph-header">
                <div>
                    <div className="graph-kicker">
                        <BrainCircuit size={14} />
                        AI Knowledge Graph
                    </div>
                    <h2 className="card-title">Living Concept Map</h2>
                    <p className="graph-subtitle">
                        Live backend data only. No seeded or demo graph values.
                    </p>
                </div>
                <div className="adaptive-pill">
                    <Sparkles size={14} />
                    <span>Live sync</span>
                </div>
            </div>

            {isCardLoading ? (
                <div className="knowledge-graph-loading">
                    <div className="graph-spinner"></div>
                    <p>Loading live graph data...</p>
                </div>
            ) : hasNoLiveNodes ? (
                <div className="knowledge-graph-loading">
                    <p>No course graph data yet. Enroll in courses and build progress to activate it.</p>
                </div>
            ) : (
                <div className="knowledge-graph-main">
                    <div className="graph-panel">
                        <div className="graph-panel-title">
                            <GitBranch size={15} />
                            <span>Course Dependency Graph</span>
                        </div>
                        <div className="graph-canvas-shell">
                            <svg className="knowledge-graph-svg" viewBox="0 0 100 100" role="img" aria-label="Student knowledge graph">
                                {edges.map((edge, index) => {
                                    const source = nodes.find((node) => node.id === edge.source);
                                    const target = nodes.find((node) => node.id === edge.target);
                                    if (!source || !target) return null;

                                    const strength = clamp((source.mastery + target.mastery) / 200, 0.2, 1);

                                    return (
                                        <line
                                            key={`${edge.source}-${edge.target}-${index}`}
                                            x1={source.x}
                                            y1={source.y}
                                            x2={target.x}
                                            y2={target.y}
                                            stroke={source.mastery >= 60 ? '#60a5fa' : '#94a3b8'}
                                            strokeOpacity={0.2 + (strength * 0.6)}
                                            strokeWidth={0.55 + (strength * 0.85)}
                                        />
                                    );
                                })}

                                {nodes.map((node) => {
                                    const radius = 4 + (node.importance * 1.4);
                                    const color = getMasteryColor(node.mastery);

                                    return (
                                        <g key={node.id}>
                                            <circle
                                                cx={node.x}
                                                cy={node.y}
                                                r={radius + 1.4}
                                                fill={color}
                                                fillOpacity={0.22}
                                            />
                                            <circle
                                                cx={node.x}
                                                cy={node.y}
                                                r={radius}
                                                fill={color}
                                                stroke="rgba(255, 255, 255, 0.5)"
                                                strokeWidth="0.4"
                                            />
                                            <text
                                                x={node.x}
                                                y={node.y + 1}
                                                className="node-score"
                                                textAnchor="middle"
                                            >
                                                {Math.round(node.mastery)}
                                            </text>
                                            <text
                                                x={node.x}
                                                y={node.y + radius + 5}
                                                className="node-label"
                                                textAnchor="middle"
                                            >
                                                {node.label}
                                            </text>
                                            <title>{`${node.label}: ${Math.round(node.mastery)}% mastery`}</title>
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>
                    </div>

                    <div className="insights-panel">
                        <div className="insight-box">
                            <h3>Live Signals</h3>
                            <div className="signal-item">
                                <span className="signal-label">
                                    <BrainCircuit size={14} /> Quiz Accuracy
                                </span>
                                <span className="signal-value">{toNumber(signals.quiz_accuracy, 0).toFixed(1)}%</span>
                            </div>
                            <div className="signal-item">
                                <span className="signal-label">
                                    <Clock3 size={14} /> Time Spent
                                </span>
                                <span className="signal-value">{toNumber(signals.time_spent_hours, 0).toFixed(1)}h</span>
                            </div>
                            <div className="signal-item">
                                <span className="signal-label">
                                    <Layers size={14} /> Flashcards
                                </span>
                                <span className="signal-value">{toNumber(signals.flashcards_performance, 0).toFixed(1)}%</span>
                            </div>
                            <div className="signal-item">
                                <span className="signal-label">
                                    <HelpCircle size={14} /> Doubts Asked
                                </span>
                                <span className="signal-value">{Math.round(toNumber(signals.doubts_asked, 0))}</span>
                            </div>
                        </div>

                        <div className="insight-box">
                            <h3>Mastery Legend</h3>
                            <div className="mastery-legend">
                                <span className="legend-chip high">80-100 Strong</span>
                                <span className="legend-chip medium">60-79 Growing</span>
                                <span className="legend-chip low">40-59 At Risk</span>
                                <span className="legend-chip critical">0-39 Needs Support</span>
                            </div>
                            <div className="graph-health">
                                Graph Readiness <strong>{Math.round(averageMastery)}%</strong>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {notice && <p className="signal-warning" style={{ color: '#93c5fd' }}>{notice}</p>}
            {error && <p className="signal-warning">{error}</p>}
        </div>
    );
}
