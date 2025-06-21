export interface StoryFilters {
  search?: string;
  sortBy?: 'newest' | 'oldest' | 'title';
  status?: 'draft' | 'published' | 'archived' | '';
  dateFrom?: string;
  dateTo?: string;
}
