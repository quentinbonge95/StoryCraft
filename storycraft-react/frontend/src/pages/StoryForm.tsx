import { format, parseISO } from 'date-fns';
import { CalendarIcon, Loader2, Sparkles, Wand2, X, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Calendar } from '../components/ui/calendar';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { TagInput } from '../components/ui/tag-input';
import { Textarea } from '../components/ui/textarea';
import { useToast } from '../components/ui/use-toast';
import { useCreateStory, useStory, useUpdateStory } from '../hooks/useStories';
import { useStoryAnalysis } from '../hooks/useStoryAnalysis';
import { cn } from '../lib/utils';
import { EnhanceResponse } from '../services/aiService';
import { Story } from '../types/story';

interface StoryFormProps {
  story?: Story;
  onSuccess?: () => void;
}

type StoryStatus = 'draft' | 'published' | 'archived';

// Frontend form data type - uses array for tags
interface StoryFormData {
  title: string;
  content: string;
  date: Date;
  tags: string[];
  status: StoryStatus;
  excerpt: string;
  emotional_impact?: string;
}

// Type for the story update payload that matches the backend's StoryUpdate schema
interface StoryUpdatePayload {
  title?: string;
  content?: string;
  date?: string;
  tags?: string;
  emotional_impact?: string;
  analysis?: string;
}

export const StoryForm = ({ story: initialStory, onSuccess }: StoryFormProps) => {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [enhancedContent, setEnhancedContent] = useState('');
  const { id: storyId } = useParams();
  const isEditMode = !!storyId;
  
  // AI Analysis state and hooks
  const {
    analysis,
    isAnalyzing,
    error: analysisError,
    analyze,
    enhance,
    generateTitle,
    isEnhancing,
    isGeneratingTitle,
  } = useStoryAnalysis();
  
  // Fetch story data if in edit mode and no initial story provided
  const { data: fetchedStory, isLoading: isStoryLoading } = useStory(storyId || '', { 
    enabled: isEditMode && !initialStory 
  });
  
  // Use either the prop story or the fetched story
  const story = initialStory || fetchedStory;
  const isEditing = !!story;
  
  // Convert API story to frontend story format
  const toFrontendStory = (apiStory: Story): Story => {
    return {
      ...apiStory,
      tags: Array.isArray(apiStory.tags) 
        ? apiStory.tags.map(tag => String(tag))
        : [],
      excerpt: apiStory.excerpt || ''
    };
  };

  // Convert frontend form data to a complete Story object for the API
  const toApiStory = (formData: StoryFormData, isUpdate: boolean): Omit<Story, 'id'> => {
    const now = new Date().toISOString();
    const tags = Array.isArray(formData.tags) 
      ? formData.tags 
      : [];

    return {
      title: formData.title,
      content: formData.content,
      excerpt: formData.excerpt || '',
      date: format(formData.date, 'yyyy-MM-dd'),
      status: formData.status || 'draft',
      tags,
      createdAt: isUpdate ? (story?.createdAt || now) : now,
      updatedAt: now
    };
  };

  // Get initial tags for form 
  const getInitialTags = (): string[] => {
    if (!story?.tags) return [];
    return Array.isArray(story.tags) 
      ? story.tags.map((tag: unknown) => String(tag)) 
      : [];
  };

  const getInitialStatus = (): StoryStatus => {
    const validStatuses: StoryStatus[] = ['draft', 'published', 'archived'];
    const status = story?.status as StoryStatus;
    return status && validStatuses.includes(status) ? status : 'draft';
  };

  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting }, 
    setValue, 
    watch, 
    reset,
    trigger,
    getValues
  } = useForm<StoryFormData>({
    defaultValues: {
      title: story?.title || '',
      content: story?.content || '',
      date: story?.date ? parseISO(`${story.date}T12:00:00Z`) : new Date(),
      tags: getInitialTags(),
      status: getInitialStatus(),
      excerpt: story?.excerpt || ''
    }
  });
  
  // Helper function to safely get tags as an array
  const getSafeTags = (): string[] => {
    const tags = getValues('tags');
    return Array.isArray(tags) ? tags : [];
  };
  
  // Get form values
  const content = watch('content') || '';
  const title = watch('title');
  const date = watch('date');
  const tags = getSafeTags();
  
  // Watch for tags changes
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'tags' && !Array.isArray(value.tags)) {
        setValue('tags', []);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue]);
  
  const createStory = useCreateStory();
  const updateStory = useUpdateStory();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isFormLoading = isSubmitting || createStory.isPending || updateStory.isPending;

  // Set initial form values when story is loaded
  useEffect(() => {
    if (story) {
      reset({
        title: story.title,
        content: story.content,
        date: parseISO(`${story.date}T12:00:00Z`),
        tags: getInitialTags(),
        status: getInitialStatus(),
        excerpt: story.excerpt || ''
      });
    }
  }, [story, reset]);

  // Show loading state while fetching story data
  if (isEditMode && !story && isStoryLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-lg text-muted-foreground">
          Loading story...
        </div>
      </div>
    );
  }

  const handleApplyAll = async () => {
    await Promise.all([
      handleGenerateTitle(),
      handleEnhance(),
      handleAnalyze()
    ]);
  };

  const handleAnalyze = async () => {
    console.log('handleAnalyze called with content:', content);
    if (!content.trim()) {
      toast({
        title: 'No content',
        description: 'Please add some content to analyze.',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('Calling analyze function...');
      const result = await analyze(content);
      console.log('Analysis result:', result);
      setShowAnalysis(true);
      toast({
        title: 'Analysis complete!',
        description: 'Your story has been analyzed.',
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis failed',
        description: error instanceof Error ? error.message : 'Could not analyze the story. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEnhance = async () => {
    if (!content.trim()) {
      toast({
        title: 'No content',
        description: 'Please add some content to enhance.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const result: EnhanceResponse = await enhance(content);
      // The enhanced content should already have think tags removed by the aiService
      const cleanContent = result.enhancedContent;
      setEnhancedContent(cleanContent);
      setValue('content', cleanContent, { shouldDirty: true });
      toast({
        title: 'Story enhanced!',
        description: 'Your story has been enhanced with AI suggestions.',
      });
    } catch (error) {
      console.error('Enhancement error:', error);
      toast({
        title: 'Enhancement failed',
        description: error instanceof Error ? error.message : 'Could not enhance the story. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const handleGenerateTitle = async () => {
    if (!content.trim()) {
      toast({
        title: 'No content',
        description: 'Please add some content to generate a title.',
        variant: 'destructive',
      });
      return;
    }
  
    try {
      const generatedTitle = await generateTitle(content);
      // The title should already have think tags removed by the aiService
      setValue('title', generatedTitle, { shouldDirty: true });
      toast({
        title: 'Title generated!',
        description: 'A title has been generated for your story.',
      });
    } catch (error) {
      console.error('Title generation error:', error);
      toast({
        title: 'Title generation failed',
        description: error instanceof Error ? error.message : 'Could not generate a title. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (data: StoryFormData) => {
    try {
      const storyData = toApiStory(data, isEditMode);
      
      if (isEditMode && storyId) {
        await updateStory.mutateAsync({
          ...storyData,
          id: storyId
        });
        toast({
          title: 'Success!',
          description: 'Your story has been updated.',
        });
      } else {
        await createStory.mutateAsync(storyData);
        toast({
          title: 'Success!',
          description: 'Your story has been created.',
        });
      }

      if (onSuccess) {
        onSuccess();
      } else if (isEditing && story?.id) {
        navigate(`/stories/${story.id}`);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: 'Error',
        description: 'There was an error saving your story. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const renderAITools = () => (
    <div className="flex flex-wrap gap-2 mb-6 p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Zap className="h-4 w-4 text-yellow-500" />
        <span>AI Tools:</span>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleGenerateTitle}
        disabled={isGeneratingTitle || !content.trim()}
      >
        {isGeneratingTitle ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Title
          </>
        )}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleEnhance}
        disabled={isEnhancing || !content.trim()}
      >
        {isEnhancing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enhancing...
          </>
        ) : (
          <>
            <Wand2 className="mr-2 h-4 w-4" />
            Enhance Content
          </>
        )}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAnalyze}
        disabled={isAnalyzing || !content?.trim()}
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Analyze Story
          </>
        )}
      </Button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Edit Story' : 'Create New Story'}
        </h1>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="outline"
            form="story-form"
            disabled={isFormLoading}
          >
            {isFormLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : isEditing ? (
              'Update Story'
            ) : (
              'Create Story'
            )}
          </Button>
        </div>
      </div>

      <form 
        id="story-form" 
        onSubmit={handleSubmit(onSubmit)} 
        className="space-y-6"
      >
        {renderAITools()}

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <div className="flex gap-2">
              <Input
                id="title"
                placeholder="Enter a title for your story"
                className={cn('flex-1', errors.title && 'border-red-500')}
                {...register('title', { required: 'Title is required' })}
              />
            </div>
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground',
                    errors.date && 'border-red-500'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setValue('date', date, { shouldValidate: true })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="content">Your Story</Label>
            <Textarea
              id="content"
              placeholder="Write your story here..."
              className={cn('min-h-[300px]', errors.content && 'border-red-500')}
              {...register('content', { required: 'Content is required' })}
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="excerpt">Excerpt (Optional)</Label>
            <Textarea
              id="excerpt"
              placeholder="A short summary of your story"
              className="min-h-[100px]"
              {...register('excerpt')}
            />
          </div>

          <div className="space-y-2">
            <Label>Tags (Optional)</Label>
            <TagInput
              value={watch('tags') || []}
              onChange={(tags) => setValue('tags', tags, { shouldDirty: true })}
              placeholder="Add a tag and press Enter"
              maxTags={10}
            />
            <p className="text-xs text-muted-foreground">
              Press Enter or click + to add a tag
            </p>
          </div>
        </div>
      </form>

      {showAnalysis && analysis && (
        <div className="mt-8 p-4 border rounded-lg bg-muted/50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Story Analysis</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAnalysis(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-4">
            {analysis.emotional_tone && (
              <div>
                <h4 className="font-medium">Emotional Tone</h4>
                <p>{analysis.emotional_tone}</p>
              </div>
            )}
            {analysis.key_themes && (
              <div>
                <h4 className="font-medium">Key Themes</h4>
                <p className="whitespace-pre-line">{analysis.key_themes}</p>
              </div>
            )}
            {analysis.readability && (
              <div>
                <h4 className="font-medium">Readability</h4>
                <p>{analysis.readability}</p>
              </div>
            )}
            {analysis.sentiment_score !== undefined && (
              <div>
                <h4 className="font-medium">Sentiment Score</h4>
                <p>{analysis.sentiment_score}/10</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryForm;
