import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAIModelSettings, updateAIModelSettings, getAvailableModels, AIModel } from '../services/SettingsService';
import { Loader2 } from 'lucide-react';

const SettingsPage: React.FC = () => {
    const { user } = useAuth();
    const [provider, setProvider] = useState('ollama');
    const [modelName, setModelName] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [message, setMessage] = useState('');
    const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const [modelError, setModelError] = useState('');
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            if (user) {
                try {
                    const settings = await getAIModelSettings();
                    if (settings) {
                        setProvider(settings.provider || 'ollama');
                        setModelName(settings.model_name || '');
                    }
                } catch (error) {
                    console.error('Failed to fetch AI model settings', error);
                    setMessage('Failed to load AI model settings');
                } finally {
                    setIsInitializing(false);
                }
            } else {
                setIsInitializing(false);
            }
        };
        fetchSettings();
    }, [user]);

    // Fetch available models when provider is Ollama
    useEffect(() => {
        if (isInitializing) return; // Don't load models until settings are loaded
        
        const fetchModels = async () => {
            if (provider === 'ollama') {
                setIsLoadingModels(true);
                setModelError('');
                try {
                    const models = await getAvailableModels();
                    setAvailableModels(models);
                    
                    // Only update model if we don't have one selected or if current model is not available
                    if (models.length > 0 && (!modelName || !models.some(m => m.model === modelName))) {
                        setModelName(models[0].model);
                    } else if (models.length === 0) {
                        setModelName('');
                        setModelError('No models available. Please pull models in Ollama first.');
                    }
                } catch (error) {
                    console.error('Failed to fetch available models', error);
                    setModelError('Failed to load available models. Please check your Ollama connection.');
                    setModelName('');
                } finally {
                    setIsLoadingModels(false);
                }
            } else {
                setAvailableModels([]);
                // Don't clear model name for external providers
                if (!modelName) {
                    setModelName('');
                }
            }
        };
        
        fetchModels();
    }, [provider, isInitializing]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!modelName) {
            setMessage('Please select a model');
            return;
        }
        
        if (provider === 'external' && !apiKey) {
            setMessage('API key is required for external providers');
            return;
        }
        
        try {
            await updateAIModelSettings({ 
                provider, 
                model_name: modelName, 
                api_key: provider === 'external' ? apiKey : undefined 
            });
            setMessage('Settings updated successfully!');
            setApiKey(''); // Clear API key from state after submission
        } catch (error) {
            setMessage('Failed to update settings. Please try again.');
            console.error('Failed to update AI model settings', error);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900">AI Model Settings</h2>
                    <p className="mt-1 text-sm text-gray-500">Configure your preferred AI model for story analysis.</p>
                    
                    <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <Label htmlFor="provider">AI Provider</Label>
                            <Select value={provider} onValueChange={setProvider}>
                                <SelectTrigger id="provider">
                                    <SelectValue placeholder="Select a provider" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ollama" key="ollama">Ollama (Local)</SelectItem>
                                    <SelectItem value="external" key="external">External API</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="modelName">Model Name {provider === 'ollama' && '(Ollama)'}</Label>
                            {provider === 'ollama' ? (
                                <Select 
                                    value={modelName} 
                                    onValueChange={setModelName}
                                    disabled={isLoadingModels || availableModels.length === 0}
                                >
                                    <SelectTrigger id="modelName">
                                        <SelectValue placeholder={
                                            isLoadingModels ? 'Loading models...' : 
                                            availableModels.length === 0 ? 'No models available' : 
                                            modelName || 'Select a model'
                                        } />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {isLoadingModels ? (
                                            <div className="flex items-center justify-center p-2">
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                Loading models...
                                            </div>
                                        ) : modelError ? (
                                            <div className="p-2 text-sm text-red-600">{modelError}</div>
                                        ) : availableModels.length === 0 ? (
                                            <div className="p-2 text-sm text-gray-500">
                                                No models found. Please pull models in Ollama first.
                                            </div>
                                        ) : (
                                            availableModels.map((model) => (
                                                <SelectItem key={model.model} value={model.model}>
                                                    {model.name || model.model}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Input
                                id="modelName"
                                placeholder="e.g., gpt-4"
                                value={modelName}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setModelName(e.target.value)}
                                required
                                className={!modelName ? 'border-red-500' : ''}
                            />
                            )}
                        </div>

                        {provider === 'external' && (
                            <div className="space-y-2">
                                <Label htmlFor="apiKey">API Key</Label>
                                <Input
                                    id="apiKey"
                                    type="password"
                                    placeholder="Enter your API Key"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                />
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Button type="submit">Save Settings</Button>
                        </div>
                    </form>
                    {message && <p className="mt-4 text-sm text-center text-gray-600">{message}</p>}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
