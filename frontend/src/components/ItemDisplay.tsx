import { type Item } from '../api';
import { clsx } from 'clsx';
import { BadgeCheck, AlertCircle, Tag, Package } from 'lucide-react';

interface ItemDisplayProps {
    item: Item;
}

export function ItemDisplay({ item }: ItemDisplayProps) {
    const isHighConfidence = item.confidence_score >= 0.8;

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                        <Package size={16} />
                        <span className="font-mono">{item.id}</span>
                        <span className="mx-2">•</span>
                        <Tag size={16} />
                        <span>{item.status}</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 leading-snug">
                        {item.description}
                    </h1>
                </div>
                <div className={clsx(
                    "px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5",
                    isHighConfidence ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                )}>
                    {isHighConfidence ? <BadgeCheck size={16} /> : <AlertCircle size={16} />}
                    {Math.round(item.confidence_score * 100)}% Conf.
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                        Existing Label
                    </div>
                    <div className="text-4xl font-mono font-light text-slate-600 mb-1">
                        {item.existing_code || "N/A"}
                    </div>
                    <div className="text-lg text-slate-700">
                        {item.existing_label || "No existing label"}
                    </div>
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
                    <div className="text-lg font-medium text-slate-800">
                        {item.model_code === item.existing_code ? (
                            <span className="text-green-600 flex items-center gap-2">
                                Match with existing
                            </span>
                        ) : (
                            item.model_label || "No prediction"
                        )}
                    </div>
                </div>
            </div>

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
