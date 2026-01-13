import { useState, useEffect, useCallback } from 'react';
import { fetchNextItem, submitDecision, fetchClassification } from './api';
import type { Item, Decision, Classification } from './api';
import { ItemDisplay } from './components/ItemDisplay';
import { FixPanel } from './components/FixPanel';
import { AdminPanel } from './components/AdminPanel';
import { Loader2, Settings, Timer, RotateCcw, Pause, Play } from 'lucide-react';

export function AnnotationView() {
    const [currentItem, setCurrentItem] = useState<Item | null>(null);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(() => {
        return localStorage.getItem('reviewer_name') || '';
    });
    const [nameInput, setNameInput] = useState(''); // Separate state for input field
    const [showNamePrompt, setShowNamePrompt] = useState(!localStorage.getItem('reviewer_name'));
    const [processing, setProcessing] = useState(false);
    const [isFixPanelOpen, setIsFixPanelOpen] = useState(false);
    const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
    const [classifications, setClassifications] = useState<Record<string, Classification | null>>({});
    const [itemLoadedAt, setItemLoadedAt] = useState<number>(Date.now());
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [pausedTime, setPausedTime] = useState(0); // Accumulated time when paused

    const loadNext = useCallback(async () => {
        setLoading(true);
        try {
            const item = await fetchNextItem(userId);
            setCurrentItem(item);
            setItemLoadedAt(Date.now()); // Track when item was loaded
            setIsPaused(false); // Reset pause state
            setPausedTime(0); // Reset accumulated paused time
        } catch (e) {
            console.error("Failed to load item", e);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        // Only load items after user has submitted their name
        if (!showNamePrompt && userId) {
            loadNext();
        }
    }, [loadNext, showNamePrompt, userId]);

    // Timer update effect
    useEffect(() => {
        if (isPaused) return;
        const interval = setInterval(() => {
            setElapsedSeconds(pausedTime + Math.floor((Date.now() - itemLoadedAt) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [itemLoadedAt, isPaused, pausedTime]);

    const resetTimer = () => {
        setItemLoadedAt(Date.now());
        setElapsedSeconds(0);
        setIsPaused(false);
        setPausedTime(0);
    };

    const togglePause = () => {
        if (isPaused) {
            // Resuming: set new start time, keep accumulated pausedTime
            setItemLoadedAt(Date.now());
            setIsPaused(false);
        } else {
            // Pausing: save current elapsed time
            setPausedTime(elapsedSeconds);
            setIsPaused(true);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

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
            // Use elapsedSeconds which accounts for pauses
            const timeSpentMs = elapsedSeconds * 1000;
            const decision: Decision = {
                item_id: currentItem.id,
                reviewer_id: userId,
                action,
                final_code: codeOverride || (action === 'accept' ? (currentItem.model_code || currentItem.existing_code || "") : ""),
                time_spent_ms: timeSpentMs,
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

    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (nameInput.trim()) {
            const trimmedName = nameInput.trim();
            localStorage.setItem('reviewer_name', trimmedName);
            setUserId(trimmedName);
            setShowNamePrompt(false);
        }
    };

    const handleChangeName = () => {
        localStorage.removeItem('reviewer_name');
        setNameInput('');
        setShowNamePrompt(true);
    };

    if (showNamePrompt) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <form onSubmit={handleNameSubmit} className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full mx-4">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">COICOP Validator</h2>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Enter your name:
                    </label>
                    <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="e.g. Ahmed, Sara, Mohammed..."
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-4"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={!nameInput.trim()}
                        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Start Reviewing
                    </button>
                </form>
            </div>
        );
    }

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
                    <div className="text-sm text-slate-500 font-mono flex items-center gap-4">
                        <button
                            onClick={() => setIsAdminPanelOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                            title="Admin Panel"
                        >
                            <Settings size={16} />
                            <span className="text-xs font-medium">Admin</span>
                        </button>
                        <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg ${isPaused ? 'bg-slate-100 border-slate-300' : 'bg-amber-50 border-amber-200'}`}>
                            <Timer size={16} className={isPaused ? 'text-slate-400' : 'text-amber-600'} />
                            <span className={`font-bold min-w-[3rem] text-center ${isPaused ? 'text-slate-400' : elapsedSeconds >= 60 ? 'text-amber-600' : 'text-slate-700'}`}>
                                {formatTime(elapsedSeconds)}
                            </span>
                            <button
                                onClick={togglePause}
                                className={`p-1 rounded transition-colors ${isPaused ? 'hover:bg-slate-200' : 'hover:bg-amber-100'}`}
                                title={isPaused ? 'Resume Timer' : 'Pause Timer'}
                            >
                                {isPaused ? (
                                    <Play size={14} className="text-green-600" />
                                ) : (
                                    <Pause size={14} className="text-amber-600" />
                                )}
                            </button>
                            <button
                                onClick={resetTimer}
                                className={`p-1 rounded transition-colors ${isPaused ? 'hover:bg-slate-200' : 'hover:bg-amber-100'}`}
                                title="Reset Timer"
                            >
                                <RotateCcw size={14} className={isPaused ? 'text-slate-400' : 'text-amber-600'} />
                            </button>
                        </div>
                        <span>User: <strong className="text-slate-700">{userId}</strong></span>
                        <button
                            onClick={handleChangeName}
                            className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                        >
                            Change
                        </button>
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

            <AdminPanel
                isOpen={isAdminPanelOpen}
                onClose={() => {
                    setIsAdminPanelOpen(false);
                    loadNext(); // Reload after closing admin panel
                }}
                userId={userId}
            />

        </div>
    );
}
