import { useState, useEffect, useRef } from 'react';
import { Search, X, Check, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { searchClassifications, type Classification } from '../api';

interface FixPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (code: string) => void;
}

export function FixPanel({ isOpen, onClose, onSelect }: FixPanelProps) {
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [results, setResults] = useState<Classification[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                setResults(data);
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
                        <ul>
                            {results.map((item, index) => (
                                <li key={item.code}>
                                    <button
                                        onClick={() => onSelect(item.code)}
                                        className={clsx(
                                            "w-full text-left px-4 py-3 rounded-lg flex items-start justify-between group transition-colors gap-3",
                                            index === selectedIndex ? "bg-indigo-50" : "hover:bg-slate-50"
                                        )}
                                    >
                                        <div className="flex-1">
                                            <div className={clsx("font-mono font-bold", index === selectedIndex ? "text-indigo-700" : "text-slate-700")}>
                                                {item.code}
                                            </div>
                                            <div className={clsx("text-sm", index === selectedIndex ? "text-indigo-600" : "text-slate-500")}>
                                                {item.title}
                                            </div>
                                            {item.intro && (
                                                <div className="text-xs text-slate-500 mt-1 overflow-hidden text-ellipsis">
                                                    {item.intro}
                                                </div>
                                            )}
                                        </div>
                                        {index === selectedIndex && (
                                            <Check className="text-indigo-600" size={20} />
                                        )}
                                    </button>
                                </li>
                            ))}
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
