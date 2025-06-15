import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { aiService, AIAnalysisResponse, EnhanceResponse } from '../services/aiService';

interface UseStoryAnalysisReturn {
  analysis: AIAnalysisResponse | null;
  isAnalyzing: boolean;
  error: string | null;
  analyze: (content: string) => Promise<AIAnalysisResponse>;
  enhance: (content: string) => Promise<EnhanceResponse>;
  generateTitle: (content: string) => Promise<string>;
  isEnhancing: boolean;
  isGeneratingTitle: boolean;
}

export const useStoryAnalysis = (): UseStoryAnalysisReturn => {
  // State for tracking loading states and errors
  const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

  // Analyze story content
  const analyzeMutation = useMutation({
    mutationFn: (content: string) => aiService.analyzeStory(content),
    onMutate: () => {
      setIsAnalyzing(true);
      setError(null);
    },
    onSuccess: (data: AIAnalysisResponse) => {
      setAnalysis(data);
    },
    onError: (error: Error) => {
      setError(error.message || 'Failed to analyze story');
    },
    onSettled: () => {
      setIsAnalyzing(false);
    },
  });

  // Enhance story content
  const enhanceMutation = useMutation({
    mutationFn: (content: string) => aiService.enhanceStory(content),
    onMutate: () => {
      setIsEnhancing(true);
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message || 'Failed to enhance story');
    },
    onSettled: () => {
      setIsEnhancing(false);
    },
  });

  // Generate title
  const generateTitleMutation = useMutation({
    mutationFn: (content: string) => aiService.generateTitle(content),
    onMutate: () => {
      setIsGeneratingTitle(true);
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message || 'Failed to generate title');
    },
    onSettled: () => {
      setIsGeneratingTitle(false);
    },
  });

  // Wrapper functions with error handling
  const analyze = useCallback(
    async (content: string) => {
      try {
        const result = await analyzeMutation.mutateAsync(content);
        return result;
      } catch (error) {
        console.error('Analysis failed:', error);
        throw error;
      }
    },
    [analyzeMutation]
  );

  const enhance = useCallback(
    async (content: string) => {
      try {
        const result = await enhanceMutation.mutateAsync(content);
        return result;
      } catch (error) {
        console.error('Enhancement failed:', error);
        throw error;
      }
    },
    [enhanceMutation]
  );

  const generateTitle = useCallback(
    async (content: string) => {
      try {
        const result = await generateTitleMutation.mutateAsync(content);
        return result;
      } catch (error) {
        console.error('Title generation failed:', error);
        throw error;
      }
    },
    [generateTitleMutation]
  );

  return {
    analysis,
    isAnalyzing,
    error,
    analyze,
    enhance,
    generateTitle,
    isEnhancing,
    isGeneratingTitle,
  };
};
