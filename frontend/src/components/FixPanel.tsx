import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Check, Loader2, BookOpen, Eye, EyeOff } from 'lucide-react';
import { clsx } from 'clsx';
import { searchClassifications, fetchClassification, type Classification } from '../api';

interface FixPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (code: string) => void;
}

const parseLines = (text?: string, limit = 2) => {
    if (!text) return [];
    return text
        .split(/\r?\n/)
        .map(line => line.replace(/^\*\s?/, '').trim())
        .filter(Boolean)
        .slice(0, limit);
};

const levelLabel = (code: string) => {
    if (!code) return "Unknown";
    const parts = code.split('.');
    if (parts.length === 1) return "Division";
    if (parts.length === 2) return "Group";
    if (parts.length === 3) return "Class";
    return "Detail";
};

const levelPriority = (level: string) => {
    if (level === "Class") return 0;
    if (level === "Group") return 1;
    if (level === "Division") return 2;
    return 3; // Detail or other
};

const hierarchyLevels = ["Division", "Group", "Class", "Detail"];

const buildHierarchy = (code: string, map: Record<string, Classification | null>) => {
    const parts = code.split('.');
    const prefixes: string[] = [];
    let current = parts[0];
    prefixes.push(current);
    for (let i = 1; i < parts.length; i += 1) {
        current = `${current}.${parts[i]}`;
        prefixes.push(current);
    }
    return prefixes.map((p, idx) => ({
        label: hierarchyLevels[idx] ?? `Level ${idx + 1}`,
        code: p,
        classification: map[p] ?? null,
    }));
};

export function FixPanel({ isOpen, onClose, onSelect }: FixPanelProps) {
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [results, setResults] = useState<Classification[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [classificationMap, setClassificationMap] = useState<Record<string, Classification | null>>({});
    const [showInformational, setShowInformational] = useState(false);

    // Filter results: only show Class items unless toggle is on
    const displayResults = useMemo(() => {
        if (showInformational) return results;
        return results.filter(item => levelLabel(item.code) === "Class");
    }, [results, showInformational]);

    // Get only selectable (Class) items for keyboard navigation
    const selectableIndices = useMemo(() => {
        return displayResults
            .map((item, idx) => ({ item, idx }))
            .filter(({ item }) => levelLabel(item.code) === "Class")
            .map(({ idx }) => idx);
    }, [displayResults]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setQuery("");
            setSelectedIndex(0);
            setError(null);
            setResults([]);
            setShowInformational(false);
        }
    }, [isOpen]);

    // Reset selected index to first selectable item when display results change
    useEffect(() => {
        if (selectableIndices.length > 0 && !selectableIndices.includes(selectedIndex)) {
            setSelectedIndex(selectableIndices[0]);
        }
    }, [selectableIndices, selectedIndex]);

    useEffect(() => {
        if (!isOpen) return;

        setLoading(true);
        const timeout = setTimeout(async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await searchClassifications(query, 80);
                const sorted = [...data].sort((a, b) => {
                    const pa = levelPriority(levelLabel(a.code));
                    const pb = levelPriority(levelLabel(b.code));
                    if (pa !== pb) return pa - pb;
                    return a.code.localeCompare(b.code);
                });
                setResults(sorted);
                setSelectedIndex(0);
            } catch (err) {
                console.error("Failed to search classifications", err);
                setError("Could not search classifications");
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 200);

        return () => clearTimeout(timeout);
    }, [query, isOpen]);

    // Keyboard navigation - only navigate through selectable (Class) items
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (selectableIndices.length === 0) return;
                const currentPos = selectableIndices.indexOf(selectedIndex);
                const nextPos = Math.min(currentPos + 1, selectableIndices.length - 1);
                setSelectedIndex(selectableIndices[nextPos]);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (selectableIndices.length === 0) return;
                const currentPos = selectableIndices.indexOf(selectedIndex);
                const prevPos = Math.max(currentPos - 1, 0);
                setSelectedIndex(selectableIndices[prevPos]);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const item = displayResults[selectedIndex];
                if (item && levelLabel(item.code) === "Class") {
                    onSelect(item.code);
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, displayResults, selectedIndex, selectableIndices, onSelect, onClose]);

    useEffect(() => {
        if (!isOpen || results.length === 0) return;
        const needed = new Set<string>();
        results.forEach((item) => {
            const parts = item.code.split('.');
            let current = parts[0];
            needed.add(current);
            for (let i = 1; i < parts.length; i += 1) {
                current = `${current}.${parts[i]}`;
                needed.add(current);
            }
        });
        needed.forEach((code) => {
            if (classificationMap[code] !== undefined) return;
            fetchClassification(code)
                .then((data) => setClassificationMap((prev) => ({ ...prev, [code]: data })))
                .catch(() => setClassificationMap((prev) => ({ ...prev, [code]: null })));
        });
    }, [isOpen, results, classificationMap]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-32">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                    <Search className="text-slate-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="flex-1 text-lg outline-none placeholder:text-slate-300"
                        placeholder="Search COICOP code or label..."
                        value={query}
                        onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
                    />
                    <button
                        onClick={() => setShowInformational(v => !v)}
                        className={clsx(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                            showInformational
                                ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                                : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                        )}
                        title={showInformational ? "Hide Division/Group items" : "Show Division/Group items"}
                    >
                        {showInformational ? <EyeOff size={14} /> : <Eye size={14} />}
                        {showInformational ? "Hide" : "Show"} context
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                        <X size={20} />
                    </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {loading && (
                        <div className="p-6 text-center text-slate-400 flex items-center justify-center gap-2">
                            <Loader2 className="animate-spin" size={18} />
                            Searching classifications...
                        </div>
                    )}
                    {error && (
                        <div className="p-6 text-center text-amber-600 text-sm">
                            {error}
                        </div>
                    )}
                    {!loading && !error && displayResults.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                            {results.length === 0 ? "No matches found." : "No Class-level items found. Toggle 'Show context' to see Division/Group items."}
                        </div>
                    ) : (
                        <ul className="space-y-2">
                            {displayResults.map((item, index) => {
                                const level = levelLabel(item.code);
                                const isClass = level === "Class";
                                const hierarchy = buildHierarchy(item.code, classificationMap).slice(0, 3);
                                return (
                                    <li key={item.code}>
                                        <button
                                            onClick={() => {
                                                if (isClass) onSelect(item.code);
                                            }}
                                            disabled={!isClass}
                                            className={clsx(
                                                "w-full text-left px-4 py-3 rounded-lg border flex items-start justify-between group transition-all gap-3 overflow-hidden",
                                                !isClass
                                                    ? "bg-slate-50 border-slate-200 cursor-not-allowed opacity-75"
                                                    : index === selectedIndex
                                                        ? "bg-indigo-50 border-indigo-200 shadow-sm"
                                                        : "bg-white border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/40"
                                            )}
                                        >
                                            <div className="flex-1 min-w-0 space-y-1.5">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={clsx(
                                                        "font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-sm border flex-shrink-0",
                                                        index === selectedIndex && isClass ? "border-indigo-200" : "border-slate-200"
                                                    )}>
                                                        {item.code}
                                                    </span>
                                                    <span className={clsx(
                                                        "text-xs px-2 py-0.5 rounded-full border flex-shrink-0",
                                                        !isClass
                                                            ? "bg-slate-100 text-slate-500 border-slate-200"
                                                            : index === selectedIndex
                                                                ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                                                                : "bg-slate-100 text-slate-600 border-slate-200"
                                                    )}>
                                                        {level}
                                                    </span>
                                                    {!isClass && (
                                                        <span className="text-[10px] uppercase tracking-wide text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded flex-shrink-0">
                                                            Informational
                                                        </span>
                                                    )}
                                                </div>
                                                <div className={clsx("text-base font-semibold leading-snug", index === selectedIndex ? "text-indigo-800" : "text-slate-800")}>
                                                    {item.title}
                                                </div>
                                                {hierarchy.length > 1 && (
                                                    <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-600">
                                                        {hierarchy.map((lvl) => (
                                                            <span key={lvl.code} className="px-2 py-0.5 rounded border border-slate-200 bg-white inline-flex items-start gap-1">
                                                                <span className="font-semibold text-slate-700 flex-shrink-0">{lvl.label}:</span>
                                                                <span className="font-mono text-slate-900 flex-shrink-0">{lvl.code}</span>
                                                                {lvl.classification?.title && (
                                                                    <span className="text-slate-600">• {lvl.classification.title}</span>
                                                                )}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                {item.intro && (
                                                    <p className="text-xs text-slate-600 leading-relaxed">
                                                        {item.intro}
                                                    </p>
                                                )}
                                                {parseLines(item.includes).length > 0 && (
                                                    <div className="flex items-start gap-2 text-xs text-slate-600">
                                                        <BookOpen size={14} className="mt-0.5 text-indigo-500 flex-shrink-0" />
                                                        <div className="space-y-0.5">
                                                            {parseLines(item.includes).map(line => (
                                                                <div key={line}>• {line}</div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {index === selectedIndex && isClass && (
                                                <div className="flex items-center gap-1 text-indigo-600">
                                                    <Check size={20} />
                                                </div>
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                <div className="p-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 flex justify-between px-4 text-center">
                    <span><strong>↑↓</strong> to navigate</span>
                    <span><strong>Enter</strong> to select</span>
                    <span><strong>Esc</strong> to close</span>
                </div>
            </div>
        </div>
    );
}
