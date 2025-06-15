import { X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Button } from './button';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  maxTags?: number;
}

export function TagInput({ 
  value = [], 
  onChange, 
  placeholder = 'Add tags...',
  className = '',
  maxTags = 10
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !value.includes(trimmedTag) && value.length < maxTags) {
      onChange([...value, trimmedTag]);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const handleAddClick = () => {
    if (inputValue.trim()) {
      addTag(inputValue);
    } else if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [value]);

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center gap-2">
        <div className="flex-1 flex flex-wrap items-center gap-2 p-1 border rounded-md min-h-[40px]">
          {value.map((tag) => (
            <div
              key={tag}
              className="inline-flex items-center gap-1 bg-primary/10 text-primary text-sm px-3 py-1 rounded-full border border-primary/20"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                className="ml-1 text-primary/70 hover:text-primary focus:outline-none"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              if (inputValue.trim()) {
                addTag(inputValue);
              }
            }}
            placeholder={value.length === 0 ? placeholder : ''}
            className={`flex-1 min-w-[100px] bg-transparent border-none focus:outline-none focus:ring-0 px-2 py-1 text-sm`}
            disabled={value.length >= maxTags}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleAddClick}
          className="shrink-0 h-10 w-10 rounded-full text-primary border-primary/20 hover:bg-primary/10"
          disabled={value.length >= maxTags}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {value.length >= maxTags && (
        <p className="mt-1 text-xs text-muted-foreground">
          Maximum {maxTags} tags allowed
        </p>
      )}
    </div>
  );
}

function Plus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
