import { useState, useEffect } from 'react';
import { fetchStats, unlockItem, unlockAllItems, requeueEscalated, resetStaleLocks } from '../api';
import type { Stats } from '../api';
import { Lock, Unlock, RefreshCw, AlertTriangle, CheckCircle, Clock, Users } from 'lucide-react';

interface AdminPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const loadStats = async () => {
        setLoading(true);
        try {
            const data = await fetchStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to load stats', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadStats();
        }
    }, [isOpen]);

    const handleUnlockItem = async (itemId: string) => {
        try {
            await unlockItem(itemId);
            setMessage(`Item ${itemId} unlocked`);
            loadStats();
        } catch (error) {
            setMessage('Failed to unlock item');
        }
    };

    const handleUnlockAll = async () => {
        try {
            const result = await unlockAllItems();
            setMessage(result.message);
            loadStats();
        } catch (error) {
            setMessage('Failed to unlock items');
        }
    };

    const handleRequeueEscalated = async () => {
        try {
            const result = await requeueEscalated();
            setMessage(result.message);
            loadStats();
        } catch (error) {
            setMessage('Failed to requeue escalated items');
        }
    };

    const handleResetStaleLocks = async () => {
        try {
            const result = await resetStaleLocks(30);
            setMessage(result.message);
            loadStats();
        } catch (error) {
            setMessage('Failed to reset stale locks');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Users size={24} />
                        Admin Panel - Item Management
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-white/70 hover:text-white text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                    {message && (
                        <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg flex items-center gap-2">
                            <CheckCircle size={18} />
                            {message}
                            <button onClick={() => setMessage(null)} className="ml-auto text-green-600 hover:text-green-800">×</button>
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-8 text-slate-500">Loading...</div>
                    ) : stats ? (
                        <>
                            {/* Stats Overview */}
                            <div className="grid grid-cols-5 gap-4 mb-6">
                                <div className="bg-slate-100 rounded-lg p-4 text-center">
                                    <div className="text-3xl font-bold text-slate-800">{stats.total}</div>
                                    <div className="text-sm text-slate-500">Total</div>
                                </div>
                                <div className="bg-yellow-100 rounded-lg p-4 text-center">
                                    <div className="text-3xl font-bold text-yellow-700">{stats.pending}</div>
                                    <div className="text-sm text-yellow-600">Pending</div>
                                </div>
                                <div className="bg-orange-100 rounded-lg p-4 text-center">
                                    <div className="text-3xl font-bold text-orange-700">{stats.locked}</div>
                                    <div className="text-sm text-orange-600">Locked</div>
                                </div>
                                <div className="bg-green-100 rounded-lg p-4 text-center">
                                    <div className="text-3xl font-bold text-green-700">{stats.completed}</div>
                                    <div className="text-sm text-green-600">Completed</div>
                                </div>
                                <div className="bg-red-100 rounded-lg p-4 text-center">
                                    <div className="text-3xl font-bold text-red-700">{stats.escalated}</div>
                                    <div className="text-sm text-red-600">Escalated</div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 mb-6">
                                <button
                                    onClick={handleUnlockAll}
                                    disabled={stats.locked === 0}
                                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Unlock size={18} />
                                    Unlock All ({stats.locked})
                                </button>
                                <button
                                    onClick={handleRequeueEscalated}
                                    disabled={stats.escalated === 0}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <RefreshCw size={18} />
                                    Requeue Escalated ({stats.escalated})
                                </button>
                                <button
                                    onClick={handleResetStaleLocks}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600"
                                >
                                    <Clock size={18} />
                                    Reset Stale Locks (30min+)
                                </button>
                                <button
                                    onClick={loadStats}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 ml-auto"
                                >
                                    <RefreshCw size={18} />
                                    Refresh
                                </button>
                            </div>

                            {/* Locked Items */}
                            {stats.locked_items.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                                        <Lock size={18} className="text-orange-500" />
                                        Locked Items ({stats.locked_items.length})
                                    </h3>
                                    <div className="bg-orange-50 rounded-lg border border-orange-200 overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-orange-100">
                                                <tr>
                                                    <th className="text-left p-3">ID</th>
                                                    <th className="text-left p-3">Description</th>
                                                    <th className="text-left p-3">Locked By</th>
                                                    <th className="text-left p-3">Locked At</th>
                                                    <th className="text-center p-3">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stats.locked_items.map((item) => (
                                                    <tr key={item.id} className="border-t border-orange-200">
                                                        <td className="p-3 font-mono text-xs">{item.id}</td>
                                                        <td className="p-3">{item.description}</td>
                                                        <td className="p-3 text-orange-700">{item.locked_by}</td>
                                                        <td className="p-3 text-xs text-slate-500">{item.locked_at}</td>
                                                        <td className="p-3 text-center">
                                                            <button
                                                                onClick={() => handleUnlockItem(item.id)}
                                                                className="px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
                                                            >
                                                                Unlock
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Escalated Items */}
                            {stats.escalated_items.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                                        <AlertTriangle size={18} className="text-red-500" />
                                        Escalated Items ({stats.escalated_items.length})
                                    </h3>
                                    <div className="bg-red-50 rounded-lg border border-red-200 overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-red-100">
                                                <tr>
                                                    <th className="text-left p-3">ID</th>
                                                    <th className="text-left p-3">Description</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stats.escalated_items.map((item) => (
                                                    <tr key={item.id} className="border-t border-red-200">
                                                        <td className="p-3 font-mono text-xs">{item.id}</td>
                                                        <td className="p-3">{item.description}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {stats.locked === 0 && stats.escalated === 0 && (
                                <div className="text-center py-8 text-slate-500">
                                    <CheckCircle size={48} className="mx-auto mb-3 text-green-500" />
                                    <p>All items are either pending or completed!</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-8 text-red-500">Failed to load stats</div>
                    )}
                </div>
            </div>
        </div>
    );
}
