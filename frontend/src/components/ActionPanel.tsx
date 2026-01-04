import { Check, Edit2, AlertTriangle } from 'lucide-react';

interface ActionPanelProps {
    onAction: (action: 'accept' | 'fix' | 'escalate', codeOverride?: string) => void;
    disabled?: boolean;
    conflict?: boolean;
    existingCode?: string | null;
    modelCode?: string | null;
}

export function ActionPanel({ onAction, disabled, conflict, existingCode, modelCode }: ActionPanelProps) {
    return (
        <div className="mt-8 flex gap-4 justify-center flex-wrap">
            {conflict ? (
                <>
                    <button
                        onClick={() => onAction('accept', modelCode || undefined)}
                        disabled={disabled}
                        className="group relative flex flex-col items-center gap-2 p-6 w-44 bg-white border-2 border-green-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                            <Check size={24} strokeWidth={3} />
                        </div>
                        <span className="font-bold text-slate-700 group-hover:text-green-700">Accept Model</span>
                        <div className="text-xs text-slate-400">Use {modelCode || "model code"}</div>
                        <div className="absolute top-2 right-2 text-xs font-mono text-slate-300 border border-slate-200 rounded px-1.5 py-0.5">M</div>
                    </button>

                    <button
                        onClick={() => onAction('accept', existingCode || undefined)}
                        disabled={disabled}
                        className="group relative flex flex-col items-center gap-2 p-6 w-44 bg-white border-2 border-emerald-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                            <Check size={24} strokeWidth={3} />
                        </div>
                        <span className="font-bold text-slate-700 group-hover:text-emerald-700">Accept Existing</span>
                        <div className="text-xs text-slate-400">Use {existingCode || "existing code"}</div>
                        <div className="absolute top-2 right-2 text-xs font-mono text-slate-300 border border-slate-200 rounded px-1.5 py-0.5">X</div>
                    </button>
                    <div className="w-full text-center text-xs text-slate-500 mt-2">
                        Shortcut A disabled while codes conflict. Use M or X.
                    </div>
                </>
            ) : (
                <button
                    onClick={() => onAction('accept')}
                    disabled={disabled}
                    className="group relative flex flex-col items-center gap-2 p-6 w-40 bg-white border-2 border-slate-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                    <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                        <Check size={24} strokeWidth={3} />
                    </div>
                    <span className="font-bold text-slate-700 group-hover:text-green-700">Accept</span>
                    <div className="absolute top-2 right-2 text-xs font-mono text-slate-300 border border-slate-200 rounded px-1.5 py-0.5">A</div>
                </button>
            )}

            <button
                onClick={() => onAction('fix')}
                disabled={disabled}
                className="group relative flex flex-col items-center gap-2 p-6 w-40 bg-white border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                    <Edit2 size={24} />
                </div>
                <span className="font-bold text-slate-700 group-hover:text-blue-700">Fix</span>
                <div className="absolute top-2 right-2 text-xs font-mono text-slate-300 border border-slate-200 rounded px-1.5 py-0.5">F</div>
            </button>

            <button
                onClick={() => onAction('escalate')}
                disabled={disabled}
                className="group relative flex flex-col items-center gap-2 p-6 w-40 bg-white border-2 border-slate-200 rounded-xl hover:border-amber-500 hover:bg-amber-50 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                    <AlertTriangle size={24} />
                </div>
                <span className="font-bold text-slate-700 group-hover:text-amber-700">Escalate</span>
                <div className="absolute top-2 right-2 text-xs font-mono text-slate-300 border border-slate-200 rounded px-1.5 py-0.5">E</div>
            </button>
        </div>
    );
}
