import { Story } from '@/types/story';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { storyApi } from '../services/storyApi';

export const useStories = () => {
  return useQuery<Story[]>({
    queryKey: ['stories'],
    queryFn: storyApi.getStories,
  });
};

interface UseStoryOptions {
  enabled?: boolean;
}

export const useStory = (id: string, options: UseStoryOptions = {}) => {
  return useQuery<Story>({
    queryKey: ['story', id],
    queryFn: () => storyApi.getStory(id),
    enabled: options.enabled !== undefined ? options.enabled : !!id,
  });
};

export const useCreateStory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: storyApi.createStory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
};

export const useUpdateStory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: storyApi.updateStory,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['story', variables.id] });
    },
  });
};

export const useDeleteStory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: storyApi.deleteStory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
};