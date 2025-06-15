// API Story type - matches backend schema
export interface APIStory {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  tags: string; // Comma-separated string in the API
  emotional_impact?: string;
  analysis?: string;
  status: 'draft' | 'published' | 'archived';
  wordCount?: number;
  featuredImage?: string;
}

// Frontend Story type - converts tags to array for easier manipulation
export interface Story extends Omit<APIStory, 'tags'> {
  tags: string[]; // Array in the frontend for easier manipulation
  emotional_impact?: string; // Added to match backend
  analysis?: string; // Added to match backend
}

export interface SearchFilters {
  status?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'newest' | 'oldest' | 'title';
}