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
    const isHighConfidence = item.confidence_score >= 0.8;
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
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <div className={clsx(
                        "px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5",
                        isHighConfidence ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    )}>
                        {isHighConfidence ? <BadgeCheck size={16} /> : <AlertCircle size={16} />}
                        {Math.round(item.confidence_score * 100)}% Conf.
                    </div>
                    {item.queue && (
                        <span className="px-2 py-1 text-xs font-semibold uppercase tracking-wide bg-slate-100 text-slate-700 rounded">
                            {item.queue.replace('_', ' ')}
                        </span>
                    )}
                </div>
            </div>

            {codesMatch ? (
                <div className="p-5 bg-blue-50 rounded-lg border border-blue-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <BadgeCheck size={90} />
                    </div>
                    <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">
                        Model & Existing Match
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                        {sharedClassification?.title || modelLabel}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-slate-800 mt-2">
                        <span className="font-mono text-xl">{item.model_code}</span>
                        <span className="text-sm px-2 py-1 bg-green-100 text-green-700 rounded-full">Matched</span>
                        {sharedHierarchy.find(h => h.label === "Class") && (
                            <span className="text-sm px-2 py-1 rounded bg-white/70 border border-blue-100 flex items-center gap-1">
                                <span className="font-semibold text-slate-700">Class:</span>
                                <span className="font-mono text-slate-900">
                                    {sharedHierarchy.find(h => h.label === "Class")?.code}
                                </span>
                                {sharedHierarchy.find(h => h.label === "Class")?.classification?.title && (
                                    <span className="text-slate-600">
                                        • {sharedHierarchy.find(h => h.label === "Class")?.classification?.title}
                                    </span>
                                )}
                            </span>
                        )}
                    </div>
                    {sharedHierarchy.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {sharedHierarchy.map((level) => (
                                <div key={level.code} className="px-2 py-1 rounded bg-white/70 border border-blue-100 text-xs flex items-center gap-1">
                                    <span className="font-semibold text-slate-700">{level.label}:</span>
                                    <span className="font-mono text-slate-900">{level.code}</span>
                                    {level.classification?.title && (
                                        <span className="text-slate-600">• {level.classification.title}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    {sharedClassification?.intro && (
                        <p className="text-sm text-slate-700 mt-3 leading-relaxed">
                            {sharedClassification.intro}
                        </p>
                    )}
                    {hasSharedDetails && (
                        <div className="mt-3">
                            <button
                                onClick={() => setShowSharedDetails(v => !v)}
                                className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                            >
                                {showSharedDetails ? "Hide details" : "Show more"}
                            </button>
                            {showSharedDetails && (
                                <div className="mt-3 grid grid-cols-2 gap-3">
                                    {sharedIncludes.length > 0 && (
                                        <div>
                                            <div className="text-xs font-semibold text-emerald-700 mb-1">Includes</div>
                                            <ul className="text-xs text-slate-700 list-disc list-inside space-y-1">
                                                {sharedIncludes.slice(0, 4).map((line) => (
                                                    <li key={line}>{line}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {sharedExcludes.length > 0 && (
                                        <div>
                                            <div className="text-xs font-semibold text-rose-700 mb-1">Excludes</div>
                                            <ul className="text-xs text-slate-700 list-disc list-inside space-y-1">
                                                {sharedExcludes.slice(0, 4).map((line) => (
                                                    <li key={line}>{line}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-8">
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                            Existing Label
                        </div>
                        <div className="text-4xl font-mono font-light text-slate-600 mb-1">
                            {item.existing_code || "N/A"}
                        </div>
                        <div className="text-xl font-semibold text-slate-900">
                            {existingLabel}
                        </div>
                        {existingHierarchy.find(h => h.label === "Class") && (
                            <div className="flex flex-wrap items-center gap-2 mt-2 text-slate-800">
                                <span className="font-mono text-lg">{item.existing_code}</span>
                                <span className="text-sm px-2 py-1 rounded bg-white border border-slate-200 flex items-center gap-1">
                                    <span className="font-semibold text-slate-700">Class:</span>
                                    <span className="font-mono text-slate-900">
                                        {existingHierarchy.find(h => h.label === "Class")?.code}
                                    </span>
                                    {existingHierarchy.find(h => h.label === "Class")?.classification?.title && (
                                        <span className="text-slate-600">
                                            • {existingHierarchy.find(h => h.label === "Class")?.classification?.title}
                                        </span>
                                    )}
                                </span>
                            </div>
                        )}
                        {existingHierarchy.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {existingHierarchy.map((level) => (
                                    <div key={level.code} className="px-2 py-1 rounded bg-white border border-slate-200 text-xs flex items-center gap-1">
                                        <span className="font-semibold text-slate-700">{level.label}:</span>
                                        <span className="font-mono text-slate-900">{level.code}</span>
                                        {level.classification?.title && (
                                            <span className="text-slate-600">• {level.classification.title}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        {existingClassification?.intro && (
                            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                                {existingClassification.intro}
                            </p>
                        )}
                        {hasExistingDetails && (
                            <div className="mt-3">
                                <button
                                    onClick={() => setShowExistingDetails(v => !v)}
                                    className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                                >
                                    {showExistingDetails ? "Hide details" : "Show more"}
                                </button>
                                {showExistingDetails && (
                                    <div className="mt-3 grid grid-cols-2 gap-3">
                                        {existingIncludes.length > 0 && (
                                            <div>
                                                <div className="text-xs font-semibold text-emerald-700 mb-1">Includes</div>
                                                <ul className="text-xs text-slate-600 list-disc list-inside space-y-1">
                                                    {existingIncludes.slice(0, 4).map((line) => (
                                                        <li key={line}>{line}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {existingExcludes.length > 0 && (
                                            <div>
                                                <div className="text-xs font-semibold text-rose-700 mb-1">Excludes</div>
                                                <ul className="text-xs text-slate-600 list-disc list-inside space-y-1">
                                                    {existingExcludes.slice(0, 4).map((line) => (
                                                        <li key={line}>{line}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                            <BadgeCheck size={80} />
                        </div>
                        <div className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-3">
                            Model Prediction
                        </div>
                        <div className="text-4xl font-mono font-bold text-slate-900 mb-1">
                            {item.model_code || "N/A"}
                        </div>
                        <div className="text-xl font-semibold text-slate-900">
                            {modelLabel}
                        </div>
                        {modelHierarchy.find(h => h.label === "Class") && (
                            <div className="flex flex-wrap items-center gap-2 mt-2 text-slate-800">
                                <span className="font-mono text-lg">{item.model_code}</span>
                                <span className="text-sm px-2 py-1 rounded bg-white/70 border border-blue-100 flex items-center gap-1">
                                    <span className="font-semibold text-slate-700">Class:</span>
                                    <span className="font-mono text-slate-900">
                                        {modelHierarchy.find(h => h.label === "Class")?.code}
                                    </span>
                                    {modelHierarchy.find(h => h.label === "Class")?.classification?.title && (
                                        <span className="text-slate-600">
                                            • {modelHierarchy.find(h => h.label === "Class")?.classification?.title}
                                        </span>
                                    )}
                                </span>
                            </div>
                        )}
                        {modelHierarchy.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {modelHierarchy.map((level) => (
                                    <div key={level.code} className="px-2 py-1 rounded bg-white/70 border border-blue-100 text-xs flex items-center gap-1">
                                        <span className="font-semibold text-slate-700">{level.label}:</span>
                                        <span className="font-mono text-slate-900">{level.code}</span>
                                        {level.classification?.title && (
                                            <span className="text-slate-600">• {level.classification.title}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        {modelClassification?.intro && (
                            <p className="text-sm text-slate-700 mt-3 leading-relaxed">
                                {modelClassification.intro}
                            </p>
                        )}
                        {hasModelDetails && (
                            <div className="mt-3">
                                <button
                                    onClick={() => setShowModelDetails(v => !v)}
                                    className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                                >
                                    {showModelDetails ? "Hide details" : "Show more"}
                                </button>
                                {showModelDetails && (
                                    <div className="mt-3 grid grid-cols-2 gap-3">
                                        {modelIncludes.length > 0 && (
                                            <div>
                                                <div className="text-xs font-semibold text-emerald-700 mb-1">Includes</div>
                                                <ul className="text-xs text-slate-700 list-disc list-inside space-y-1">
                                                    {modelIncludes.slice(0, 4).map((line) => (
                                                        <li key={line}>{line}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {modelExcludes.length > 0 && (
                                            <div>
                                                <div className="text-xs font-semibold text-rose-700 mb-1">Excludes</div>
                                                <ul className="text-xs text-slate-700 list-disc list-inside space-y-1">
                                                    {modelExcludes.slice(0, 4).map((line) => (
                                                        <li key={line}>{line}</li>
                                                    ))}
                                                </ul>
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
