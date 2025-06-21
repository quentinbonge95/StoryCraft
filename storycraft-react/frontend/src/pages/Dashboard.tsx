import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, PlusCircle } from 'lucide-react';

import { StoryCard } from '../components/stories/StoryCard';
import { useStories } from '../hooks/useStories';
import { StoryFilters } from '../types/types';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Story } from '@/types/story';

export const Dashboard = () => {
  const [filters, setFilters] = useState<StoryFilters>({ sortBy: 'newest' });
  const [searchTerm, setSearchTerm] = useState('');

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchTerm }));
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: stories = [], isLoading, error } = useStories(filters);

  const handleFilterChange = (
    key: keyof StoryFilters,
    value: string | undefined
  ) => {
    // Special handling for status filter to remove the status when 'all' is selected
    if (key === 'status' && value === 'all') {
      const { status, ...rest } = filters;
      setFilters(rest);
    } else {
      setFilters((prev) => ({ ...prev, [key]: value }));
    }
  };

  const clearFilters = () => {
    setFilters({ sortBy: 'newest' });
    setSearchTerm('');
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button asChild>
          <Link to="/stories/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Story
          </Link>
        </Button>
      </div>

      {/* Filter and Sort Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
        <Input
          placeholder="Search stories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="lg:col-span-2"
        />
        <Select
          value={filters.sortBy}
          onValueChange={(value) => handleFilterChange('sortBy', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Sort by Newest</SelectItem>
            <SelectItem value="oldest">Sort by Oldest</SelectItem>
            <SelectItem value="title">Sort by Title</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.status || ''}
          onValueChange={(value) => handleFilterChange('status', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={'outline'}
              className={cn(
                'justify-start text-left font-normal',
                !filters.dateFrom && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateFrom ? format(new Date(filters.dateFrom), 'PPP') : <span>From date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
              onSelect={(date) =>
                handleFilterChange('dateFrom', date ? format(date, 'yyyy-MM-dd') : undefined)
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={'outline'}
              className={cn(
                'justify-start text-left font-normal',
                !filters.dateTo && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateTo ? format(new Date(filters.dateTo), 'PPP') : <span>To date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={filters.dateTo ? new Date(filters.dateTo) : undefined}
              onSelect={(date) =>
                handleFilterChange('dateTo', date ? format(date, 'yyyy-MM-dd') : undefined)
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <Button onClick={clearFilters} variant="ghost" className="md:col-span-2 lg:col-span-4">
          Clear Filters
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading stories...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">
          Error loading stories: {error instanceof Error ? error.message : 'An unknown error occurred'}
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-12 bg-white shadow rounded-lg">
          <h3 className="text-lg font-medium">No stories found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your filters or create a new story.
          </p>
          <Button asChild className="mt-6">
            <Link to="/stories/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create First Story
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {stories.map((story: Story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
