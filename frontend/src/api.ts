import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

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
