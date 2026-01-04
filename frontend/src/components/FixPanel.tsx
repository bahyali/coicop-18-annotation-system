import { useState, useEffect, useRef } from 'react';
import { Search, X, Check, Loader2, BookOpen } from 'lucide-react';
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

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setQuery("");
            setSelectedIndex(0);
            setError(null);
            setResults([]);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        setLoading(true);
        const timeout = setTimeout(async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await searchClassifications(query, 8);
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

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (results.length === 0) return;
                setSelectedIndex(i => Math.min(i + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (results.length === 0) return;
                setSelectedIndex(i => Math.max(i - 1, 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (results[selectedIndex]) {
                    onSelect(results[selectedIndex].code);
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, selectedIndex, onSelect, onClose]);

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
                    {!loading && !error && results.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                            No matches found.
                        </div>
                    ) : (
                        <ul className="space-y-2">
                            {results.map((item, index) => {
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
                                                "w-full text-left px-4 py-3 rounded-lg border flex items-start justify-between group transition-all gap-3",
                                                !isClass
                                                    ? "bg-slate-50 border-slate-200 cursor-not-allowed opacity-75"
                                                    : index === selectedIndex
                                                        ? "bg-indigo-50 border-indigo-200 shadow-sm"
                                                        : "bg-white border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/40"
                                            )}
                                        >
                                            <div className="flex-1 space-y-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className={clsx(
                                                        "font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-sm border",
                                                        index === selectedIndex && isClass ? "border-indigo-200" : "border-slate-200"
                                                    )}>
                                                        {item.code}
                                                    </span>
                                                    <span className={clsx(
                                                        "text-xs px-2 py-0.5 rounded-full border",
                                                        !isClass
                                                            ? "bg-slate-100 text-slate-500 border-slate-200"
                                                            : index === selectedIndex
                                                                ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                                                                : "bg-slate-100 text-slate-600 border-slate-200"
                                                    )}>
                                                        {level}
                                                    </span>
                                                    {!isClass && (
                                                        <span className="text-[10px] uppercase tracking-wide text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded">
                                                            Informational
                                                        </span>
                                                    )}
                                                </div>
                                                <div className={clsx("text-base font-semibold leading-tight", index === selectedIndex ? "text-indigo-800" : "text-slate-800")}>
                                                    {item.title}
                                                </div>
                                                {hierarchy.length > 1 && (
                                                    <div className="flex flex-wrap gap-2 text-[11px] text-slate-600">
                                                        {hierarchy.map((level) => (
                                                            <span key={level.code} className="px-2 py-0.5 rounded border border-slate-200 bg-white flex items-center gap-1">
                                                                <span className="font-semibold text-slate-700">{level.label}:</span>
                                                                <span className="font-mono text-slate-900">{level.code}</span>
                                                                {level.classification?.title && (
                                                                    <span className="text-slate-600">• {level.classification.title}</span>
                                                                )}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                {item.intro && (
                                                    <div
                                                        className="text-xs text-slate-600"
                                                        style={{
                                                            display: "-webkit-box",
                                                            WebkitLineClamp: 3,
                                                            WebkitBoxOrient: "vertical",
                                                            overflow: "hidden"
                                                        }}
                                                    >
                                                        {item.intro}
                                                    </div>
                                                )}
                                                {parseLines(item.includes).length > 0 && (
                                                    <div className="flex items-start gap-2 text-xs text-slate-600">
                                                        <BookOpen size={14} className="mt-0.5 text-indigo-500" />
                                                        <div className="space-y-0.5">
                                                            {parseLines(item.includes).map(line => (
                                                                <div key={line} className="truncate">• {line}</div>
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
