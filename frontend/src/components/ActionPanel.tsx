import { Check, Edit2, AlertTriangle } from 'lucide-react';

interface ActionPanelProps {
    onAction: (action: 'accept' | 'fix' | 'escalate', codeOverride?: string) => void;
    disabled?: boolean;
    conflict?: boolean;
    existingCode?: string | null;
    modelCode?: string | null;
}

export function ActionPanel({ onAction, disabled, conflict, existingCode, modelCode }: ActionPanelProps) {
    if (conflict) {
        return (
            <div className="mt-6 space-y-3 max-w-4xl mx-auto">
                {/* Accept buttons aligned with their respective boxes */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Accept Existing - matches left slate box */}
                    <button
                        onClick={() => onAction('accept', existingCode || undefined)}
                        disabled={disabled}
                        className="group relative flex items-center justify-center gap-3 p-4 bg-slate-50 border-2 border-slate-300 rounded-xl hover:border-slate-500 hover:bg-slate-100 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                    >
                        <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-300 transition-colors">
                            <Check size={18} strokeWidth={3} />
                        </div>
                        <div className="text-left min-w-0">
                            <div className="font-bold text-slate-700 text-sm">Accept Existing</div>
                            <div className="text-xs text-slate-500 font-mono truncate">{existingCode}</div>
                        </div>
                        <div className="absolute top-2 right-2 text-[10px] font-mono text-slate-400 bg-slate-200 rounded px-1.5 py-0.5">X</div>
                    </button>

                    {/* Accept Model - matches right blue box */}
                    <button
                        onClick={() => onAction('accept', modelCode || undefined)}
                        disabled={disabled}
                        className="group relative flex items-center justify-center gap-3 p-4 bg-blue-50 border-2 border-blue-300 rounded-xl hover:border-blue-500 hover:bg-blue-100 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                    >
                        <div className="w-9 h-9 rounded-full bg-blue-200 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-300 transition-colors">
                            <Check size={18} strokeWidth={3} />
                        </div>
                        <div className="text-left min-w-0">
                            <div className="font-bold text-slate-700 text-sm">Accept Model</div>
                            <div className="text-xs text-blue-600 font-mono truncate">{modelCode}</div>
                        </div>
                        <div className="absolute top-2 right-2 text-[10px] font-mono text-blue-400 bg-blue-200 rounded px-1.5 py-0.5">M</div>
                    </button>
                </div>

                {/* Secondary actions centered below */}
                <div className="flex gap-2 justify-center pt-1">
                    <button
                        onClick={() => onAction('fix')}
                        disabled={disabled}
                        className="group flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:border-amber-400 hover:bg-amber-50 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                    >
                        <Edit2 size={15} className="text-slate-400 group-hover:text-amber-600" />
                        <span className="font-medium text-sm text-slate-500 group-hover:text-amber-700">Fix</span>
                        <span className="text-[10px] font-mono text-slate-300 ml-0.5">F</span>
                    </button>

                    <button
                        onClick={() => onAction('escalate')}
                        disabled={disabled}
                        className="group flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                    >
                        <AlertTriangle size={15} className="text-slate-400 group-hover:text-red-500" />
                        <span className="font-medium text-sm text-slate-500 group-hover:text-red-600">Escalate</span>
                        <span className="text-[10px] font-mono text-slate-300 ml-0.5">E</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-6 max-w-4xl mx-auto">
            {/* Primary action - Accept */}
            <button
                onClick={() => onAction('accept')}
                disabled={disabled}
                className="group relative w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl hover:border-green-500 hover:from-green-100 hover:to-emerald-100 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
                <div className="w-9 h-9 rounded-full bg-green-200 text-green-600 flex items-center justify-center flex-shrink-0 group-hover:bg-green-300 transition-colors">
                    <Check size={18} strokeWidth={3} />
                </div>
                <div>
                    <div className="font-bold text-green-800 text-sm">Accept Match</div>
                    <div className="text-xs text-green-600">Confirm this classification</div>
                </div>
                <div className="absolute top-2 right-2 text-[10px] font-mono text-green-500 bg-green-200 rounded px-1.5 py-0.5">A</div>
            </button>

            {/* Secondary actions */}
            <div className="flex gap-2 justify-center pt-1">
                <button
                    onClick={() => onAction('fix')}
                    disabled={disabled}
                    className="group flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:border-amber-400 hover:bg-amber-50 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                >
                    <Edit2 size={15} className="text-slate-400 group-hover:text-amber-600" />
                    <span className="font-medium text-sm text-slate-500 group-hover:text-amber-700">Fix</span>
                    <span className="text-[10px] font-mono text-slate-300 ml-0.5">F</span>
                </button>

                <button
                    onClick={() => onAction('escalate')}
                    disabled={disabled}
                    className="group flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                >
                    <AlertTriangle size={15} className="text-slate-400 group-hover:text-red-500" />
                    <span className="font-medium text-sm text-slate-500 group-hover:text-red-600">Escalate</span>
                    <span className="text-[10px] font-mono text-slate-300 ml-0.5">E</span>
                </button>
            </div>
        </div>
    );
}
