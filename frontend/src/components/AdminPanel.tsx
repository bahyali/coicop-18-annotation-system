import { useState, useEffect } from 'react';
import { fetchUserDetailedStats } from '../api';
import type { UserDetailedStats } from '../api';
import { Settings, RefreshCw, CheckCircle, Edit3, AlertTriangle, Clock, Target, TrendingUp, Calendar, Award } from 'lucide-react';

interface AdminPanelProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

// Progress Ring Component
function ProgressRing({ progress, size = 120, strokeWidth = 10 }: { progress: number; size?: number; strokeWidth?: number }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

    // Color based on progress
    const getColor = () => {
        if (progress >= 80) return '#22c55e'; // green
        if (progress >= 50) return '#eab308'; // yellow
        return '#94a3b8'; // slate
    };

    return (
        <svg width={size} height={size} className="transform -rotate-90">
            {/* Background circle */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth={strokeWidth}
            />
            {/* Progress circle */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={getColor()}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-500"
            />
        </svg>
    );
}

// Action Bar Component
function ActionBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
    const percentage = total > 0 ? (count / total) * 100 : 0;

    return (
        <div className="flex items-center gap-3">
            <span className="w-20 text-sm text-slate-600">{label}</span>
            <div className="flex-1 bg-slate-200 rounded-full h-3">
                <div
                    className={`h-3 rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <span className="w-16 text-sm text-slate-600 text-right">{percentage.toFixed(0)}%</span>
        </div>
    );
}

export function AdminPanel({ isOpen, onClose, userId }: AdminPanelProps) {
    const [stats, setStats] = useState<UserDetailedStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [dailyTarget, setDailyTarget] = useState(() => {
        const saved = localStorage.getItem(`dailyTarget_${userId}`);
        return saved ? parseInt(saved, 10) : 2400;
    });
    const [tempTarget, setTempTarget] = useState(dailyTarget);

    const loadStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchUserDetailedStats(userId);
            setStats(data);
        } catch (err) {
            console.error('Failed to load stats', err);
            setError('Failed to load statistics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadStats();
        }
    }, [isOpen, userId]);

    useEffect(() => {
        // Update localStorage when userId changes
        const saved = localStorage.getItem(`dailyTarget_${userId}`);
        if (saved) {
            setDailyTarget(parseInt(saved, 10));
            setTempTarget(parseInt(saved, 10));
        }
    }, [userId]);

    const saveTarget = () => {
        setDailyTarget(tempTarget);
        localStorage.setItem(`dailyTarget_${userId}`, tempTarget.toString());
        setShowSettings(false);
    };

    const formatTime = (minutes: number) => {
        if (minutes < 60) return `${minutes.toFixed(0)}m`;
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    if (!isOpen) return null;

    const todayProgress = stats ? (stats.today.count / dailyTarget) * 100 : 0;
    const totalActions = stats ? Object.values(stats.action_breakdown).reduce((a, b) => a + b, 0) : 0;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <TrendingUp size={24} />
                        My Progress - تقدمي
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                setTempTarget(dailyTarget);
                                setShowSettings(!showSettings);
                            }}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            title="Settings"
                        >
                            <Settings size={20} />
                        </button>
                        <button
                            onClick={loadStats}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button
                            onClick={onClose}
                            className="text-white/70 hover:text-white text-2xl px-2"
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* Settings Panel */}
                {showSettings && (
                    <div className="bg-indigo-50 border-b border-indigo-200 p-4">
                        <div className="flex items-center gap-4">
                            <Target size={20} className="text-indigo-600" />
                            <span className="font-medium text-slate-700">Daily Target:</span>
                            <input
                                type="number"
                                min="1"
                                max="500"
                                value={tempTarget}
                                onChange={(e) => setTempTarget(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-24 px-3 py-2 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <span className="text-slate-500">items/day</span>
                            <button
                                onClick={saveTarget}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg flex items-center gap-2">
                            <AlertTriangle size={18} />
                            {error}
                        </div>
                    )}

                    {loading && !stats ? (
                        <div className="text-center py-12 text-slate-500">
                            <RefreshCw size={32} className="mx-auto mb-3 animate-spin" />
                            <p>Loading your progress...</p>
                        </div>
                    ) : stats ? (
                        <div className="space-y-6">
                            {/* Top Row: Daily Target + Today's Achievements */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Daily Target Card */}
                                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Target size={20} className="text-indigo-600" />
                                        <h3 className="font-bold text-slate-800">Daily Target</h3>
                                    </div>
                                    <div className="flex items-center justify-center">
                                        <div className="relative">
                                            <ProgressRing progress={todayProgress} size={140} strokeWidth={12} />
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-3xl font-bold text-slate-800">{stats.today.count}</span>
                                                <span className="text-slate-500">/ {dailyTarget}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-center mt-4">
                                        <span className={`text-lg font-semibold ${todayProgress >= 100 ? 'text-green-600' :
                                            todayProgress >= 80 ? 'text-green-500' :
                                                todayProgress >= 50 ? 'text-yellow-600' :
                                                    'text-slate-500'
                                            }`}>
                                            {todayProgress >= 100 ? 'Target Achieved!' : `${todayProgress.toFixed(0)}% Complete`}
                                        </span>
                                    </div>
                                </div>

                                {/* Today's Achievements Card */}
                                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Award size={20} className="text-emerald-600" />
                                        <h3 className="font-bold text-slate-800">Today's Achievements</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                                            <span className="flex items-center gap-2 text-slate-700">
                                                <CheckCircle size={18} className="text-green-500" />
                                                Accepts
                                            </span>
                                            <span className="font-bold text-green-600">
                                                {stats.action_breakdown.accept || 0}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                                            <span className="flex items-center gap-2 text-slate-700">
                                                <Edit3 size={18} className="text-blue-500" />
                                                Fixes
                                            </span>
                                            <span className="font-bold text-blue-600">
                                                {stats.action_breakdown.fix || 0}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                                            <span className="flex items-center gap-2 text-slate-700">
                                                <AlertTriangle size={18} className="text-orange-500" />
                                                Escalations
                                            </span>
                                            <span className="font-bold text-orange-600">
                                                {stats.action_breakdown.escalate || 0}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border-t border-emerald-200">
                                            <span className="flex items-center gap-2 text-slate-700">
                                                <Clock size={18} className="text-slate-500" />
                                                Time Spent
                                            </span>
                                            <span className="font-bold text-slate-700">
                                                {formatTime(stats.today.time_minutes)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Period Stats Row */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* This Week */}
                                <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Calendar size={18} className="text-blue-600" />
                                        <h4 className="font-semibold text-slate-700">This Week</h4>
                                    </div>
                                    <div className="text-3xl font-bold text-blue-700 mb-1">
                                        {stats.this_week.count}
                                    </div>
                                    <div className="text-sm text-blue-600">items reviewed</div>
                                    <div className="mt-3 pt-3 border-t border-blue-200 text-sm text-slate-600">
                                        <div className="flex justify-between">
                                            <span>Time:</span>
                                            <span className="font-medium">{formatTime(stats.this_week.time_minutes)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Avg:</span>
                                            <span className="font-medium">{stats.this_week.avg_time_seconds.toFixed(1)}s/item</span>
                                        </div>
                                    </div>
                                </div>

                                {/* This Month */}
                                <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Calendar size={18} className="text-purple-600" />
                                        <h4 className="font-semibold text-slate-700">This Month</h4>
                                    </div>
                                    <div className="text-3xl font-bold text-purple-700 mb-1">
                                        {stats.this_month.count}
                                    </div>
                                    <div className="text-sm text-purple-600">items reviewed</div>
                                    <div className="mt-3 pt-3 border-t border-purple-200 text-sm text-slate-600">
                                        <div className="flex justify-between">
                                            <span>Time:</span>
                                            <span className="font-medium">{formatTime(stats.this_month.time_minutes)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Avg:</span>
                                            <span className="font-medium">{stats.this_month.avg_time_seconds.toFixed(1)}s/item</span>
                                        </div>
                                    </div>
                                </div>

                                {/* All Time */}
                                <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
                                    <div className="flex items-center gap-2 mb-3">
                                        <TrendingUp size={18} className="text-amber-600" />
                                        <h4 className="font-semibold text-slate-700">All Time</h4>
                                    </div>
                                    <div className="text-3xl font-bold text-amber-700 mb-1">
                                        {stats.total.count.toLocaleString()}
                                    </div>
                                    <div className="text-sm text-amber-600">items reviewed</div>
                                    <div className="mt-3 pt-3 border-t border-amber-200 text-sm text-slate-600">
                                        <div className="flex justify-between">
                                            <span>Time:</span>
                                            <span className="font-medium">{formatTime(stats.total.time_minutes)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Avg:</span>
                                            <span className="font-medium">{stats.total.avg_time_seconds.toFixed(1)}s/item</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Breakdown */}
                            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        <CheckCircle size={20} className="text-slate-600" />
                                        Action Breakdown
                                    </h3>
                                    <div className="bg-indigo-100 px-3 py-1 rounded-full">
                                        <span className="text-sm font-medium text-indigo-700">
                                            Agreement Rate: {stats.agreement_rate.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <ActionBar
                                        label="Accept"
                                        count={stats.action_breakdown.accept || 0}
                                        total={totalActions}
                                        color="bg-green-500"
                                    />
                                    <ActionBar
                                        label="Fix"
                                        count={stats.action_breakdown.fix || 0}
                                        total={totalActions}
                                        color="bg-blue-500"
                                    />
                                    <ActionBar
                                        label="Escalate"
                                        count={stats.action_breakdown.escalate || 0}
                                        total={totalActions}
                                        color="bg-orange-500"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                            <AlertTriangle size={48} className="mx-auto mb-3 text-slate-400" />
                            <p>No data available yet. Start reviewing items to see your progress!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
