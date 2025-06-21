import { api } from './api';

export interface AIModel {
    name: string;
    model: string;
    modified_at: string;
    size: number;
    digest: string;
}

export const getAvailableModels = async (): Promise<AIModel[]> => {
    const response = await api.get('/ai-model/available-models');
    return response.data;
};

export const getAIModelSettings = async () => {
    const response = await api.get('/ai-model/');
    return response.data;
};

export const updateAIModelSettings = async (settings: { provider: string; model_name: string; api_key?: string }) => {
    const response = await api.put('/ai-model/', settings);
    return response.data;
};
