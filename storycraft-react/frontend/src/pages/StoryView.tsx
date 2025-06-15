import { format } from 'date-fns';
import { ArrowLeft, Calendar as CalendarIcon, Loader2, Save, Sparkles, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Button } from '../components/ui/button';
import { Calendar } from '../components/ui/calendar';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Textarea } from '../components/ui/textarea';
import { useDeleteStory, useStory, useUpdateStory } from '../hooks/useStories';
import { cn } from '../lib/utils';
import { Story } from '../types/story';


type StoryFormData = {
  title: string;
  content: string;
  date: Date;
  status: Story['status'];
};

export const StoryView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: story, isLoading, error } = useStory(id || '');
  const updateStory = useUpdateStory();
  const deleteStory = useDeleteStory();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editData, setEditData] = useState<StoryFormData>({
    title: '',
    content: '',
    date: new Date(),
    status: 'draft'
  });

  // Initialize edit form when story loads
  useEffect(() => {
    if (story) {
      setEditData({
        title: story.title,
        content: story.content,
        date: story.date ? new Date(story.date) : new Date(),
        status: story.status || 'draft'
      });
    }
  }, [story]);

  const handleSave = async () => {
    if (!id || !story) return;
    
    try {
      await updateStory.mutateAsync({
        ...story, // Include all existing story properties
        ...editData, // Override with edited fields
        id,
        date: editData.date.toISOString(),
        status: editData.status,
        updatedAt: new Date().toISOString(),
        // Ensure tags and excerpt are included
        tags: story.tags || [],
        excerpt: story.excerpt || ''
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update story:', err);
    }
  };

  const handleCancel = () => {
    if (story) {
      setEditData({
        title: story.title,
        content: story.content,
        date: story.date ? new Date(story.date) : new Date(),
        status: story.status || 'draft'
      });
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteStory.mutateAsync(id);
      navigate('/');
    } catch (err) {
      console.error('Failed to delete story:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-lg text-muted-foreground">Loading your story...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-destructive text-lg mb-4">Error loading story</div>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Story not found</h1>
        <Button onClick={() => navigate('/')} variant="outline">
          Back to Stories
        </Button>
      </div>
    );
  }

  const formattedDate = story.date 
    ? format(new Date(story.date), 'MMMM d, yyyy')
    : 'No date';
  
  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8">
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this story?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the story "{story?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteStory.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={deleteStory.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteStory.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Story'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to stories
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          {!isEditing && (
            <>
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button 
                asChild
                variant="default"
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                <Link to={`/stories/${id}/edit`} className="flex items-center">
                  <Sparkles className="h-4 w-4 mr-1" />
                  Edit Story
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
      
      {isEditing ? (
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editData.title}
                onChange={(e) => setEditData({...editData, title: e.target.value})}
                placeholder="Story title"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !editData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editData.date ? format(editData.date, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={editData.date}
                    onSelect={(date) => date && setEditData({...editData, date})}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={editData.content}
                onChange={(e) => setEditData({...editData, content: e.target.value})}
                placeholder="Write your story here..."
                className="mt-1 min-h-[200px]"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateStory.isPending}>
              {updateStory.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{story.title}</h1>
            <p className="text-muted-foreground mt-2">{formattedDate}</p>
          </div>
          
          <div className="prose max-w-none">
            {story.content.split('\n\n').map((paragraph, i) => (
              <p key={i} className="mb-4 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryView;
