// src/services/storyApi.ts
import { api } from './api'; // Import the configured axios instance
import axios from 'axios';
import { Story, APIStory } from '../types/story';

// Helper function to convert frontend story to API story
const toApiStory = (story: Partial<Story>): Partial<APIStory> => {
  const { tags, ...rest } = story;
  return {
    ...rest,
    tags: Array.isArray(tags) ? tags.join(',') : (tags || '')
  };
};

// Helper function to convert API story to frontend story
const fromApiStory = (apiStory: APIStory): Story => {
  const { tags, ...rest } = apiStory;
  return {
    ...rest,
    tags: typeof tags === 'string' ? tags.split(',').filter(Boolean) : []
  };
};

export const storyApi = {
  getStories: async (): Promise<Story[]> => {
    const response = await api.get<APIStory[]>('/stories/');
    return response.data.map(fromApiStory);
  },

  getStory: async (id: string): Promise<Story> => {
    // Ensure ID is a number for the backend
    const storyId = typeof id === 'string' ? parseInt(id, 10) : id;
    const url = `/stories/${storyId}/`; // Add trailing slash for consistency
    console.log(`Fetching story ${storyId} from:`, url);
    const response = await api.get<APIStory>(url);
    return fromApiStory(response.data);
  },

  createStory: async (story: Omit<Story, 'id'>): Promise<Story> => {
    const apiStory = toApiStory(story) as Omit<APIStory, 'id'>;
    const response = await api.post<APIStory>('/stories/', apiStory);
    return fromApiStory(response.data);
  },

  updateStory: async ({ id, ...story }: Story): Promise<Story> => {
    try {
      console.log('Starting update for story ID:', id);
      
      // Log the incoming story data
      console.log('Incoming story data:', JSON.stringify({
        ...story,
        content: story.content ? `${story.content.substring(0, 50)}...` : 'empty',
        tags: story.tags
      }, null, 2));
      
      // Convert frontend story to API format
      const updateData = toApiStory({
        title: story.title,
        content: story.content,
        date: story.date,
        tags: story.tags,
        emotional_impact: story.emotional_impact,
        analysis: story.analysis,
        status: story.status
      });
      
      console.log('Sending update data (full):', JSON.stringify(updateData, null, 2));
      
      // Ensure ID is a number for the backend
      const storyId = typeof id === 'string' ? parseInt(id, 10) : id;
      const url = `/stories/${storyId}/`; // Add trailing slash for consistency
      
      console.log(`Sending PUT request to: ${url}`);
      
      const response = await api.put<APIStory>(
        url, 
        updateData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          validateStatus: (status) => status < 500 // Don't throw for 4xx errors
        }
      );
      
      console.log('Update response status:', response.status);
      
      if (response.status >= 400) {
        console.error('Update failed with status:', response.status);
        console.error('Response data:', response.data);
        throw new Error(`Update failed with status ${response.status}: ${JSON.stringify(response.data)}`);
      }
      
      console.log('Update successful, response data:', response.data);
      return fromApiStory(response.data);
    } catch (error) {
      console.error('Error in updateStory:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('Response error details:', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
            headers: error.response.headers,
          });
        } else if (error.request) {
          console.error('No response received:', error.request);
        } else {
          console.error('Error setting up request:', error.message);
        }
      }
      throw error;
    }
  },

  deleteStory: async (id: string): Promise<void> => {
    const storyId = typeof id === 'string' ? parseInt(id, 10) : id;
    await api.delete(`/stories/${storyId}/`);
  }
};