import { useState } from 'react';
import { type Item, type Classification } from '../api';
import { clsx } from 'clsx';
import { BadgeCheck, AlertCircle, Tag, Package } from 'lucide-react';

interface ItemDisplayProps {
    item: Item;
    classificationMap?: Record<string, Classification | null>;
    existingClassification?: Classification | null;
    modelClassification?: Classification | null;
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

export function ItemDisplay({ item, classificationMap = {}, existingClassification, modelClassification }: ItemDisplayProps) {
    // const isHighConfidence = item.confidence_score >= 0.8;
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
    const hasExistingDetails = existingIncludes.length > 0 || existingExcludes.length > 0;
    const hasModelDetails = modelIncludes.length > 0 || modelExcludes.length > 0;
    const hasSharedDetails = sharedIncludes.length > 0 || sharedExcludes.length > 0;
    const [showExistingDetails, setShowExistingDetails] = useState(false);
    const [showModelDetails, setShowModelDetails] = useState(false);
    const [showSharedDetails, setShowSharedDetails] = useState(false);
    const existingHierarchy = buildHierarchy(item.existing_code, classificationMap).slice(0, 3);
    const modelHierarchy = buildHierarchy(item.model_code, classificationMap).slice(0, 3);
    const sharedHierarchy = buildHierarchy(codesMatch ? item.model_code : undefined, classificationMap).slice(0, 3);

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-200 space-y-6">
            <div className="p-4 bg-gradient-to-r from-indigo-50 via-slate-50 to-white rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                    <Package size={16} />
                    <span className="font-mono">{item.id}</span>
                    <span className="mx-2">•</span>
                    <Tag size={16} />
                    <span>{item.status}</span>
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 leading-tight mb-2">
                    {item.description}
                </h1>

            </div>

            {codesMatch ? (
                <div className="p-5 bg-slate-50 rounded-lg border-2 border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <BadgeCheck size={90} />
                    </div>
                    {/* Primary: Match confirmation + Code */}
                    <div className="flex items-center gap-3 mb-2">

                        <span className="font-mono text-xl font-bold text-slate-800">{item.model_code}</span>
                    </div>
                    {/* Secondary: Classification title - the main info */}
                    <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
                        {sharedClassification?.title || modelLabel}
                    </h2>
                    {/* Tertiary: Brief description if available */}
                    {sharedClassification?.intro && (
                        <p className="text-base text-slate-600 mt-2 leading-relaxed line-clamp-2">
                            {sharedClassification.intro}
                        </p>
                    )}
                    {/* Collapsed details */}
                    {(sharedHierarchy.length > 0 || hasSharedDetails) && (
                        <div className="mt-4 pt-3 border-t border-green-200/50">
                            <button
                                onClick={() => setShowSharedDetails(v => !v)}
                                className="text-sm font-medium text-green-700 hover:text-green-800 flex items-center gap-1"
                            >
                                {showSharedDetails ? "Hide details" : "Show more"}
                                <span className="text-xs">({sharedHierarchy.length} levels)</span>
                            </button>
                            {showSharedDetails && (
                                <div className="mt-3 space-y-4">
                                    {/* Hierarchy as clean vertical list */}
                                    {sharedHierarchy.length > 0 && (
                                        <div className="bg-white/80 rounded-lg border border-green-200 overflow-hidden">
                                            {sharedHierarchy.map((level, idx) => (
                                                <div
                                                    key={level.code}
                                                    className={`flex items-center gap-3 px-3 py-2 ${idx !== sharedHierarchy.length - 1 ? 'border-b border-green-100' : ''}`}
                                                >
                                                    <span className="text-[10px] font-bold text-green-500 uppercase w-14 flex-shrink-0">{level.label}</span>
                                                    <span className="font-mono text-sm text-slate-800 font-medium">{level.code}</span>
                                                    {level.classification?.title && (
                                                        <span className="text-sm text-slate-500 truncate">{level.classification.title}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {/* Includes/Excludes in clean cards */}
                                    {hasSharedDetails && (
                                        <div className="grid grid-cols-2 gap-3">
                                            {sharedIncludes.length > 0 && (
                                                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                                                    <div className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2">Includes</div>
                                                    <ul className="space-y-1.5">
                                                        {sharedIncludes.slice(0, 4).map((line) => (
                                                            <li key={line} className="text-xs text-slate-700 flex gap-2">
                                                                <span className="text-emerald-400 flex-shrink-0">•</span>
                                                                <span>{line}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {sharedExcludes.length > 0 && (
                                                <div className="bg-rose-50 rounded-lg p-3 border border-rose-100">
                                                    <div className="text-xs font-bold text-rose-700 uppercase tracking-wide mb-2">Excludes</div>
                                                    <ul className="space-y-1.5">
                                                        {sharedExcludes.slice(0, 4).map((line) => (
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
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {/* Existing Label - Left */}
                    <div className="p-5 bg-slate-50 rounded-lg border-2 border-slate-200">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="px-2.5 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-full uppercase tracking-wide">
                                Existing
                            </span>
                            <span className="font-mono text-xl font-bold text-slate-600">{item.existing_code || "N/A"}</span>
                        </div>
                        <h3 className="text-2xl font-extrabold text-slate-800 leading-tight">
                            {existingLabel}
                        </h3>
                        {existingClassification?.intro && (
                            <p className="text-sm text-slate-600 mt-2 leading-relaxed line-clamp-2">
                                {existingClassification.intro}
                            </p>
                        )}
                        {(existingHierarchy.length > 0 || hasExistingDetails) && (
                            <div className="mt-4 pt-3 border-t border-slate-200">
                                <button
                                    onClick={() => setShowExistingDetails(v => !v)}
                                    className="text-sm font-medium text-slate-600 hover:text-slate-800 flex items-center gap-1"
                                >
                                    {showExistingDetails ? "Hide details" : "Show more"}
                                </button>
                                {showExistingDetails && (
                                    <div className="mt-3 space-y-4">
                                        {/* Hierarchy as clean vertical list */}
                                        {existingHierarchy.length > 0 && (
                                            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                                                {existingHierarchy.map((level, idx) => (
                                                    <div
                                                        key={level.code}
                                                        className={`flex items-center gap-3 px-3 py-2 ${idx !== existingHierarchy.length - 1 ? 'border-b border-slate-100' : ''}`}
                                                    >
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase w-14 flex-shrink-0">{level.label}</span>
                                                        <span className="font-mono text-sm text-slate-800 font-medium">{level.code}</span>
                                                        {level.classification?.title && (
                                                            <span className="text-sm text-slate-500 truncate">{level.classification.title}</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {/* Includes/Excludes in clean cards */}
                                        {hasExistingDetails && (
                                            <div className="grid grid-cols-2 gap-3">
                                                {existingIncludes.length > 0 && (
                                                    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                                                        <div className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2">Includes</div>
                                                        <ul className="space-y-1.5">
                                                            {existingIncludes.slice(0, 4).map((line) => (
                                                                <li key={line} className="text-xs text-slate-700 flex gap-2">
                                                                    <span className="text-emerald-400 flex-shrink-0">•</span>
                                                                    <span>{line}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {existingExcludes.length > 0 && (
                                                    <div className="bg-rose-50 rounded-lg p-3 border border-rose-100">
                                                        <div className="text-xs font-bold text-rose-700 uppercase tracking-wide mb-2">Excludes</div>
                                                        <ul className="space-y-1.5">
                                                            {existingExcludes.slice(0, 4).map((line) => (
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
                        )}
                    </div>

                    {/* Model Prediction - Right */}
                    <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                            <BadgeCheck size={80} />
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="px-2.5 py-1 bg-blue-500 text-white text-xs font-bold rounded-full uppercase tracking-wide">
                                Model
                            </span>
                            <span className="font-mono text-xl font-bold text-slate-800">{item.model_code || "N/A"}</span>
                        </div>
                        <h3 className="text-2xl font-extrabold text-slate-900 leading-tight">
                            {modelLabel}
                        </h3>
                        {modelClassification?.intro && (
                            <p className="text-sm text-slate-600 mt-2 leading-relaxed line-clamp-2">
                                {modelClassification.intro}
                            </p>
                        )}
                        {(modelHierarchy.length > 0 || hasModelDetails) && (
                            <div className="mt-4 pt-3 border-t border-blue-200/50">
                                <button
                                    onClick={() => setShowModelDetails(v => !v)}
                                    className="text-sm font-medium text-blue-700 hover:text-blue-800 flex items-center gap-1"
                                >
                                    {showModelDetails ? "Hide details" : "Show more"}
                                </button>
                                {showModelDetails && (
                                    <div className="mt-3 space-y-4">
                                        {/* Hierarchy as clean vertical list */}
                                        {modelHierarchy.length > 0 && (
                                            <div className="bg-white/80 rounded-lg border border-blue-200 overflow-hidden">
                                                {modelHierarchy.map((level, idx) => (
                                                    <div
                                                        key={level.code}
                                                        className={`flex items-center gap-3 px-3 py-2 ${idx !== modelHierarchy.length - 1 ? 'border-b border-blue-100' : ''}`}
                                                    >
                                                        <span className="text-[10px] font-bold text-blue-400 uppercase w-14 flex-shrink-0">{level.label}</span>
                                                        <span className="font-mono text-sm text-slate-800 font-medium">{level.code}</span>
                                                        {level.classification?.title && (
                                                            <span className="text-sm text-slate-500 truncate">{level.classification.title}</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {/* Includes/Excludes in clean cards */}
                                        {hasModelDetails && (
                                            <div className="grid grid-cols-2 gap-3">
                                                {modelIncludes.length > 0 && (
                                                    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                                                        <div className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2">Includes</div>
                                                        <ul className="space-y-1.5">
                                                            {modelIncludes.slice(0, 4).map((line) => (
                                                                <li key={line} className="text-xs text-slate-700 flex gap-2">
                                                                    <span className="text-emerald-400 flex-shrink-0">•</span>
                                                                    <span>{line}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {modelExcludes.length > 0 && (
                                                    <div className="bg-rose-50 rounded-lg p-3 border border-rose-100">
                                                        <div className="text-xs font-bold text-rose-700 uppercase tracking-wide mb-2">Excludes</div>
                                                        <ul className="space-y-1.5">
                                                            {modelExcludes.slice(0, 4).map((line) => (
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
                        )}
                    </div>
                </div>
            )}

            {/* Metadata Section */}
            {Object.keys(item.meta_data).length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-500 mb-3">Item Metadata</h3>
                    <div className="grid grid-cols-3 gap-4">
                        {Object.entries(item.meta_data).map(([key, value]) => (
                            <div key={key}>
                                <div className="text-xs text-slate-400 mb-1 capitalize">{key.replace(/_/g, ' ')}</div>
                                <div className="text-sm text-slate-700 font-medium">{String(value)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
