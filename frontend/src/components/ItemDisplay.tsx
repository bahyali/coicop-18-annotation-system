import { useState } from 'react';
import { type Item, type Classification } from '../api';
import { Tag, Package, Check, Edit2, AlertTriangle } from 'lucide-react';

interface ItemDisplayProps {
    item: Item;
    classificationMap?: Record<string, Classification | null>;
    existingClassification?: Classification | null;
    modelClassification?: Classification | null;
    onAction?: (action: 'accept' | 'fix' | 'escalate', codeOverride?: string) => void;
    disabled?: boolean;
}

const parseList = (text?: string) => {
    if (!text) return [];
    return text
        .split(/\r?\n/)
        .map(line => line.replace(/^\*\s?/, '').trim())
        .filter(Boolean);
};

const levelNames = ["Division", "Group", "Class", "Sub-class", "Detail"];

const buildHierarchy = (
    code: string | undefined,
    classificationMap: Record<string, Classification | null>
) => {
    if (!code) return [];
    const parts = code.split('.');
    const prefixes: string[] = [];
    let current = parts[0];
    prefixes.push(current);
    for (let i = 1; i < parts.length; i += 1) {
        current = `${current}.${parts[i]}`;
        prefixes.push(current);
    }
    return prefixes.map((prefix, idx) => ({
        label: levelNames[idx] ?? `Level ${idx + 1}`,
        code: prefix,
        classification: classificationMap[prefix] ?? null,
    }));
};

function DetailsSection({
    hierarchy,
    includes,
    excludes,
    show,
    onToggle,
    borderColor = 'slate'
}: {
    hierarchy: { label: string; code: string; classification: Classification | null }[];
    includes: string[];
    excludes: string[];
    show: boolean;
    onToggle: () => void;
    borderColor?: 'slate' | 'blue' | 'green';
}) {
    const hasDetails = includes.length > 0 || excludes.length > 0;
    if (hierarchy.length === 0 && !hasDetails) return null;

    const colors = {
        slate: { border: 'border-slate-200', text: 'text-slate-600', label: 'text-slate-400' },
        blue: { border: 'border-blue-200', text: 'text-blue-700', label: 'text-blue-400' },
        green: { border: 'border-green-200', text: 'text-green-700', label: 'text-green-500' },
    };

    return (
        <div className={`mt-3 pt-3 border-t ${colors[borderColor].border}`}>
            <button
                onClick={onToggle}
                className={`text-sm font-medium ${colors[borderColor].text} hover:opacity-80`}
            >
                {show ? "Hide details" : "Show more"}
            </button>
            {show && (
                <div className="mt-3 space-y-3">
                    {hierarchy.length > 0 && (
                        <div className={`bg-white/80 rounded-lg border ${colors[borderColor].border} overflow-hidden`}>
                            {hierarchy.map((level, idx) => (
                                <div
                                    key={level.code}
                                    className={`flex items-center gap-3 px-3 py-2 ${idx !== hierarchy.length - 1 ? `border-b ${colors[borderColor].border}` : ''}`}
                                >
                                    <span className={`text-[10px] font-bold ${colors[borderColor].label} uppercase w-14 flex-shrink-0`}>{level.label}</span>
                                    <span className="font-mono text-sm text-slate-800 font-medium">{level.code}</span>
                                    {level.classification?.title && (
                                        <span className="text-sm text-slate-500 truncate">{level.classification.title}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    {hasDetails && (
                        <div className="grid grid-cols-2 gap-3">
                            {includes.length > 0 && (
                                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                                    <div className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2">Includes</div>
                                    <ul className="space-y-1.5">
                                        {includes.slice(0, 4).map((line) => (
                                            <li key={line} className="text-xs text-slate-700 flex gap-2">
                                                <span className="text-emerald-400 flex-shrink-0">•</span>
                                                <span>{line}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {excludes.length > 0 && (
                                <div className="bg-rose-50 rounded-lg p-3 border border-rose-100">
                                    <div className="text-xs font-bold text-rose-700 uppercase tracking-wide mb-2">Excludes</div>
                                    <ul className="space-y-1.5">
                                        {excludes.slice(0, 4).map((line) => (
                                            <li key={line} className="text-xs text-slate-700 flex gap-2">
                                                <span className="text-rose-400 flex-shrink-0">•</span>
                                                <span>{line}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export function ItemDisplay({ item, classificationMap = {}, existingClassification, modelClassification, onAction, disabled }: ItemDisplayProps) {
    const existingLabel = existingClassification?.title || item.existing_label || "No existing label";
    const modelLabel = modelClassification?.title || item.model_label || "No prediction";
    const existingIncludes = parseList(existingClassification?.includes);
    const existingExcludes = parseList(existingClassification?.excludes);
    const modelIncludes = parseList(modelClassification?.includes);
    const modelExcludes = parseList(modelClassification?.excludes);
    const codesMatch = Boolean(item.model_code && item.existing_code && item.model_code === item.existing_code);
    const sharedClassification = codesMatch ? (modelClassification || existingClassification) : null;
    const sharedIncludes = parseList(sharedClassification?.includes);
    const sharedExcludes = parseList(sharedClassification?.excludes);
    const [showExistingDetails, setShowExistingDetails] = useState(true);
    const [showModelDetails, setShowModelDetails] = useState(true);
    const [showSharedDetails, setShowSharedDetails] = useState(true);
    const existingHierarchy = buildHierarchy(item.existing_code, classificationMap).slice(0, 3);
    const modelHierarchy = buildHierarchy(item.model_code, classificationMap).slice(0, 3);
    const sharedHierarchy = buildHierarchy(codesMatch ? item.model_code : undefined, classificationMap).slice(0, 3);

    return (
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                    <Package size={16} />
                    <span className="font-mono">{item.id}</span>
                    <span className="mx-2">•</span>
                    <Tag size={16} />
                    <span>{item.status}</span>
                </div>
                <h1 className="text-2xl py-10 text-center font-extrabold text-blue-900 leading-tight">
                    {item.description}
                </h1>
            </div>

            {codesMatch ? (
                /* Match view - side by side: classification left, actions right */
                <div className="flex">
                    {/* Classification info - left side */}
                    <div className="flex-1 p-5 border-r border-slate-100">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="font-mono text-2xl font-bold text-slate-800">{item.model_code}</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 leading-tight">
                            {sharedClassification?.title || modelLabel}
                        </h2>
                        {sharedClassification?.intro && (
                            <p className="text-sm text-slate-600 mt-2 leading-relaxed line-clamp-2">
                                {sharedClassification.intro}
                            </p>
                        )}
                        <DetailsSection
                            hierarchy={sharedHierarchy}
                            includes={sharedIncludes}
                            excludes={sharedExcludes}
                            show={showSharedDetails}
                            onToggle={() => setShowSharedDetails(v => !v)}
                            borderColor="slate"
                        />
                    </div>

                    {/* Actions - right side */}
                    <div className="w-48 p-5 flex flex-col gap-3 bg-slate-50">
                        <button
                            onClick={() => onAction?.('accept')}
                            disabled={disabled}
                            className="group flex items-center gap-2 p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            <Check size={18} strokeWidth={3} />
                            <span className="font-semibold text-sm">Accept</span>
                            <span className="ml-auto text-[10px] font-mono opacity-70">A</span>
                        </button>
                        <button
                            onClick={() => onAction?.('fix')}
                            disabled={disabled}
                            className="group flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg hover:border-amber-400 hover:bg-amber-50 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            <Edit2 size={16} className="text-slate-500 group-hover:text-amber-600" />
                            <span className="font-medium text-sm text-slate-600 group-hover:text-amber-700">Fix</span>
                            <span className="ml-auto text-[10px] font-mono text-slate-300">F</span>
                        </button>
                        <button
                            onClick={() => onAction?.('escalate')}
                            disabled={disabled}
                            className="group flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            <AlertTriangle size={16} className="text-slate-500 group-hover:text-red-500" />
                            <span className="font-medium text-sm text-slate-600 group-hover:text-red-600">Escalate</span>
                            <span className="ml-auto text-[10px] font-mono text-slate-300">E</span>
                        </button>
                    </div>
                </div>
            ) : (
                /* Conflict view - two columns with integrated actions */
                <div className="flex">
                    {/* Existing - left side */}
                    <div className="flex-1 p-5 border-r border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[10px] font-bold rounded uppercase">Existing</span>
                            <span className="font-mono text-lg font-bold text-slate-700">{item.existing_code || "N/A"}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 leading-tight">
                            {existingLabel}
                        </h3>
                        {existingClassification?.intro && (
                            <p className="text-sm text-slate-600 mt-2 leading-relaxed line-clamp-2">
                                {existingClassification.intro}
                            </p>
                        )}
                        <DetailsSection
                            hierarchy={existingHierarchy}
                            includes={existingIncludes}
                            excludes={existingExcludes}
                            show={showExistingDetails}
                            onToggle={() => setShowExistingDetails(v => !v)}
                            borderColor="slate"
                        />
                        {/* Accept Existing button */}
                        <button
                            onClick={() => onAction?.('accept', item.existing_code || undefined)}
                            disabled={disabled}
                            className="mt-4 w-full group flex items-center justify-center gap-2 p-3 bg-slate-100 border-2 border-slate-300 rounded-lg hover:bg-slate-200 hover:border-slate-400 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            <Check size={18} strokeWidth={3} className="text-slate-600" />
                            <span className="font-semibold text-sm text-slate-700">Accept Existing</span>
                            <span className="ml-2 text-[10px] font-mono text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">X</span>
                        </button>
                    </div>

                    {/* Model - right side */}
                    <div className="flex-1 p-5 bg-blue-50/50">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded uppercase">Model</span>
                            <span className="font-mono text-lg font-bold text-slate-800">{item.model_code || "N/A"}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 leading-tight">
                            {modelLabel}
                        </h3>
                        {modelClassification?.intro && (
                            <p className="text-sm text-slate-600 mt-2 leading-relaxed line-clamp-2">
                                {modelClassification.intro}
                            </p>
                        )}
                        <DetailsSection
                            hierarchy={modelHierarchy}
                            includes={modelIncludes}
                            excludes={modelExcludes}
                            show={showModelDetails}
                            onToggle={() => setShowModelDetails(v => !v)}
                            borderColor="blue"
                        />
                        {/* Accept Model button */}
                        <button
                            onClick={() => onAction?.('accept', item.model_code || undefined)}
                            disabled={disabled}
                            className="mt-4 w-full group flex items-center justify-center gap-2 p-3 bg-blue-100 border-2 border-blue-300 rounded-lg hover:bg-blue-200 hover:border-blue-400 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            <Check size={18} strokeWidth={3} className="text-blue-600" />
                            <span className="font-semibold text-sm text-blue-700">Accept Model</span>
                            <span className="ml-2 text-[10px] font-mono text-blue-400 bg-blue-200 px-1.5 py-0.5 rounded">M</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Secondary actions for conflict view */}
            {!codesMatch && (
                <div className="flex justify-center gap-3 p-4 border-t border-slate-100 bg-slate-50">
                    <button
                        onClick={() => onAction?.('fix')}
                        disabled={disabled}
                        className="group flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:border-amber-400 hover:bg-amber-50 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        <Edit2 size={15} className="text-slate-400 group-hover:text-amber-600" />
                        <span className="font-medium text-sm text-slate-500 group-hover:text-amber-700">Fix</span>
                        <span className="text-[10px] font-mono text-slate-300 ml-0.5">F</span>
                    </button>
                    <button
                        onClick={() => onAction?.('escalate')}
                        disabled={disabled}
                        className="group flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        <AlertTriangle size={15} className="text-slate-400 group-hover:text-red-500" />
                        <span className="font-medium text-sm text-slate-500 group-hover:text-red-600">Escalate</span>
                        <span className="text-[10px] font-mono text-slate-300 ml-0.5">E</span>
                    </button>
                </div>
            )}

            {/* Metadata Section */}
            {item.meta_data && Object.keys(item.meta_data).length > 0 && (
                <div className="p-4 border-t border-slate-100">
                    <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Metadata</h3>
                    <div className="flex flex-wrap gap-4">
                        {Object.entries(item.meta_data).map(([key, value]) => (
                            <div key={key}>
                                <div className="text-[10px] text-slate-400 capitalize">{key.replace(/_/g, ' ')}</div>
                                <div className="text-sm text-slate-700 font-medium">{String(value)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
