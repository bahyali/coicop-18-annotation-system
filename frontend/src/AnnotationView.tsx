import { useState, useEffect, useCallback } from 'react';
import { fetchNextItem, submitDecision, fetchClassification } from './api';
import type { Item, Decision, Classification } from './api';
import { ItemDisplay } from './components/ItemDisplay';
import { FixPanel } from './components/FixPanel';
import { Loader2 } from 'lucide-react';

export function AnnotationView() {
    const [currentItem, setCurrentItem] = useState<Item | null>(null);
    const [loading, setLoading] = useState(true);
    const [userId] = useState("test_user_1"); // TODO: Real user auth
    const [processing, setProcessing] = useState(false);
    const [isFixPanelOpen, setIsFixPanelOpen] = useState(false);
    const [classifications, setClassifications] = useState<Record<string, Classification | null>>({});

    const loadNext = useCallback(async () => {
        setLoading(true);
        try {
            const item = await fetchNextItem(userId);
            setCurrentItem(item);
        } catch (e) {
            console.error("Failed to load item", e);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        loadNext();
    }, [loadNext]);

    const handleAction = async (action: 'accept' | 'fix' | 'escalate', codeOverride?: string) => {
        if (!currentItem || processing) return;

        if (action === 'fix' && !codeOverride) {
            setIsFixPanelOpen(true);
            return;
        }

        setProcessing(true);
        // If fix panel was open, close it
        setIsFixPanelOpen(false);

        try {
            const decision: Decision = {
                item_id: currentItem.id,
                reviewer_id: userId,
                action,
                final_code: codeOverride || (action === 'accept' ? (currentItem.model_code || currentItem.existing_code || "") : ""),
                time_spent_ms: 0, // TODO: Track time
            };

            await submitDecision(decision);
            await loadNext();
        } catch (e) {
            console.error("Failed to submit decision", e);
            alert("Error submitting decision");
        } finally {
            setProcessing(false);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
            if (isFixPanelOpen) return; // Let FixPanel handle its own keys
            const hasConflict = Boolean(
                currentItem?.existing_code &&
                currentItem?.model_code &&
                currentItem.existing_code !== currentItem.model_code
            );

            switch (e.key.toLowerCase()) {
                case 'a':
                    if (!hasConflict) handleAction('accept');
                    break;
                case 'm':
                    if (hasConflict) {
                        handleAction('accept', currentItem?.model_code || undefined);
                    }
                    break;
                case 'x':
                    if (hasConflict) {
                        handleAction('accept', currentItem?.existing_code || undefined);
                    }
                    break;
                case 'f':
                    handleAction('fix');
                    break;
                case 'e':
                    handleAction('escalate');
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentItem, processing, isFixPanelOpen]);

    useEffect(() => {
        if (!currentItem) return;
        const codes = [currentItem.existing_code, currentItem.model_code].filter(Boolean) as string[];

        const prefixes = new Set<string>();
        codes.forEach((code) => {
            const parts = code.split('.');
            let current = parts[0];
            prefixes.add(current);
            for (let i = 1; i < parts.length; i += 1) {
                current = `${current}.${parts[i]}`;
                prefixes.add(current);
            }
        });

        prefixes.forEach((code) => {
            if (classifications[code] !== undefined) return;
            fetchClassification(code)
                .then((data) => setClassifications((prev) => ({ ...prev, [code]: data })))
                .catch((err) => {
                    console.error("Failed to fetch classification", err);
                    setClassifications((prev) => ({ ...prev, [code]: null }));
                });
        });
    }, [currentItem, classifications]);

    if (loading && !currentItem) {
        return (
            <div className="flex h-screen items-center justify-center text-slate-400">
                <Loader2 className="animate-spin mr-2" /> Loading queue...
            </div>
        );
    }

    if (!currentItem) {
        return (
            <div className="flex h-screen items-center justify-center text-slate-500">
                All items validated! 🎉
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 selection:bg-indigo-100">
            <div className="max-w-5xl mx-auto">
                <header className="mb-8 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <span className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-sm">CO</span>
                        COICOP Validator
                    </h1>
                    <div className="text-sm text-slate-500 font-mono">
                        User: {userId}
                    </div>
                </header>

                {processing && (
                    <div className="fixed top-0 left-0 w-full h-1 bg-indigo-100 z-50">
                        <div className="h-full bg-indigo-600 animate-pulse w-1/3 mx-auto" />
                    </div>
                )}

                <ItemDisplay
                    item={currentItem}
                    classificationMap={classifications}
                    existingClassification={currentItem.existing_code ? classifications[currentItem.existing_code] : null}
                    modelClassification={currentItem.model_code ? classifications[currentItem.model_code] : null}
                    onAction={handleAction}
                    disabled={processing}
                />

            </div>

            <FixPanel
                isOpen={isFixPanelOpen}
                onClose={() => setIsFixPanelOpen(false)}
                onSelect={(code) => handleAction('fix', code)}
            />

        </div>
    );
}
