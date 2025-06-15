import { format } from 'date-fns';
import { BookOpen, Clock, Edit2, Tag as TagIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Story } from '../../types/story';

interface StoryCardProps {
  story: Story;
}

export const StoryCard = ({ story }: StoryCardProps) => {
  const wordCount = story.content.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.ceil(wordCount / 200); // Average reading speed: 200 words per minute
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200 hover:shadow-md transition-shadow duration-200">
      {story.featuredImage && (
        <div className="h-48 bg-gray-100 overflow-hidden">
          <img
            src={story.featuredImage}
            alt={story.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            !story.status || story.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
            story.status === 'published' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {story.status ? (story.status.charAt(0).toUpperCase() + story.status.slice(1)) : 'Draft'}
          </span>
          <span className="text-sm text-muted-foreground">
            {story.date ? format(new Date(story.date), 'MMM d, yyyy') : 'No date'}
          </span>
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
          {story.title}
        </h3>
        
        {story.excerpt && (
          <p className="text-gray-600 mb-4 line-clamp-3">
            {story.excerpt}
          </p>
        )}
        
        {Array.isArray(story.tags) && story.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {story.tags.map((tag) => (
              <span 
                key={tag} 
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
              >
                <TagIcon className="mr-1 h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <BookOpen className="mr-1 h-4 w-4" />
              {wordCount} words
            </span>
            <span className="flex items-center">
              <Clock className="mr-1 h-4 w-4" />
              {readingTime} min read
            </span>
          </div>
          
          <Link
            to={`/stories/${story.id}`}
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <Edit2 className="mr-1 h-4 w-4" />
            Edit
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StoryCard;
