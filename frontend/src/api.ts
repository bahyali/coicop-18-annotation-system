import axios from 'axios';

const API_URL = '/api';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface Item {
    id: string;
    description: string;
    meta_data: Record<string, any>;
    existing_code?: string;
    existing_label?: string;
    model_code?: string;
    model_label?: string;
    confidence_score: number;
    status: string;
    queue: string;
}

export interface Decision {
    item_id: string;
    reviewer_id: string;
    action: 'accept' | 'fix' | 'escalate';
    final_code: string;
    escalation_reason?: string;
    time_spent_ms: number;
}

export interface Classification {
    code: string;
    title: string;
    intro?: string;
    includes?: string;
    also_includes?: string;
    excludes?: string;
}

export const fetchNextItem = async (userId: string, queue?: string): Promise<Item | null> => {
    try {
        const response = await api.get<Item>('/items/next', {
            params: { user_id: userId, queue },
        });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            return null;
        }
        throw error;
    }
};

export const submitDecision = async (decision: Decision): Promise<Item> => {
    const response = await api.post<Item>('/decisions', decision);
    return response.data;
};

export const fetchClassification = async (code: string): Promise<Classification | null> => {
    if (!code) return null;
    try {
        const response = await api.get<Classification>(`/classifications/${encodeURIComponent(code)}`);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            return null;
        }
        throw error;
    }
};

export const searchClassifications = async (query: string, limit = 10): Promise<Classification[]> => {
    const response = await api.get<Classification[]>('/classifications', {
        params: { query, limit },
    });
    return response.data;
};

export interface Stats {
    total: number;
    pending: number;
    locked: number;
    completed: number;
    escalated: number;
    locked_items: Array<{id: string; description: string; locked_by: string; locked_at: string}>;
    escalated_items: Array<{id: string; description: string}>;
}

export const fetchStats = async (userId?: string): Promise<Stats> => {
    const response = await api.get<Stats>('/stats', {
        params: userId ? { user_id: userId } : undefined
    });
    return response.data;
};

export const unlockItem = async (itemId: string): Promise<{message: string}> => {
    const response = await api.post(`/unlock/${itemId}`);
    return response.data;
};

export const unlockAllItems = async (): Promise<{message: string; count: number}> => {
    const response = await api.post('/unlock-all');
    return response.data;
};

export const requeueEscalated = async (): Promise<{message: string; count: number}> => {
    const response = await api.post('/requeue-escalated');
    return response.data;
};

export const resetStaleLocks = async (maxAgeMinutes = 30): Promise<{message: string; count: number}> => {
    const response = await api.post('/reset-stale-locks', null, {
        params: { max_age_minutes: maxAgeMinutes }
    });
    return response.data;
};

// User Management

export interface User {
    username: string;
    role: string;
}

export const fetchUsers = async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users');
    return response.data;
};

export const createUser = async (username: string, role: string = 'reviewer'): Promise<User> => {
    const response = await api.post<User>('/users', { username, role });
    return response.data;
};

export const deleteUser = async (username: string): Promise<{message: string}> => {
    const response = await api.delete(`/users/${encodeURIComponent(username)}`);
    return response.data;
};

// Personal Dashboard Stats

export interface PeriodStats {
    count: number;
    time_minutes: number;
    avg_time_seconds: number;
}

export interface UserDetailedStats {
    reviewer_id: string;
    total: PeriodStats;
    today: PeriodStats;
    this_week: PeriodStats;
    this_month: PeriodStats;
    agreement_rate: number;
    action_breakdown: Record<string, number>;
    daily_breakdown: Array<{ date: string; count: number; time_minutes: number }>;
    weekly_breakdown: Array<{ week_start: string; week_end: string; count: number; time_minutes: number }>;
}

export const fetchUserDetailedStats = async (userId: string): Promise<UserDetailedStats> => {
    const response = await api.get<UserDetailedStats>(`/dashboard/user-detailed-stats/${encodeURIComponent(userId)}`);
    return response.data;
};
