import { useState, useEffect, useRef } from 'react';
import { Search, X, Check } from 'lucide-react';
import { clsx } from 'clsx';

interface FixPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (code: string) => void;
}

// Mock COICOP data
const COICOP_CODES = [
    { code: "01.1.1", label: "Rice" },
    { code: "01.1.2", label: "Flour and other cereals" },
    { code: "01.1.3", label: "Bread" },
    { code: "01.1.4", label: "Other bakery products" },
    { code: "07.1.1", label: "Motor cars" },
    { code: "07.2.2", label: "Fuels and lubricants for personal transport equipment" },
    { code: "05.1.1", label: "Furniture for reception, covering and dining" },
    { code: "05.1.2", label: "Carpets and other floor coverings" },
    { code: "01.2.1", label: "Coffee, tea and cocoa" },
    { code: "11.1.1", label: "Restaurants, cafes and the like" }
];

export function FixPanel({ isOpen, onClose, onSelect }: FixPanelProps) {
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Filter items
    const filteredItems = COICOP_CODES.filter(item =>
        item.code.includes(query) || item.label.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5); // Limit to 5 for now

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setQuery("");
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(i => Math.min(i + 1, filteredItems.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(i => Math.max(i - 1, 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredItems[selectedIndex]) {
                    onSelect(filteredItems[selectedIndex].code);
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredItems, selectedIndex, onSelect, onClose]);

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
                    {filteredItems.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                            No matches found.
                        </div>
                    ) : (
                        <ul>
                            {filteredItems.map((item, index) => (
                                <li key={item.code}>
                                    <button
                                        onClick={() => onSelect(item.code)}
                                        className={clsx(
                                            "w-full text-left px-4 py-3 rounded-lg flex items-center justify-between group transition-colors",
                                            index === selectedIndex ? "bg-indigo-50" : "hover:bg-slate-50"
                                        )}
                                    >
                                        <div>
                                            <div className={clsx("font-mono font-bold", index === selectedIndex ? "text-indigo-700" : "text-slate-700")}>
                                                {item.code}
                                            </div>
                                            <div className={clsx("text-sm", index === selectedIndex ? "text-indigo-600" : "text-slate-500")}>
                                                {item.label}
                                            </div>
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
