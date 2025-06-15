// Global variables
let stories = [];  // Array to store loaded stories

// Load configuration
console.log('[App] Initializing StoryCraft application');
const API = window.StoryCraftConfig?.API_BASE_URL || 'http://localhost:8000';
console.log('[App] Using API base URL:', API);
let flatpickrInstance = null;

// Show loading overlay
function showLoading(show = true) {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.classList.toggle('hidden', !show);
  }
}

// Show error message
function showError(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = message;
    element.classList.remove('hidden');
  }
}

// Hide error message
function hideError(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.classList.add('hidden');
  }
}

// Initialize date picker
function initDatePicker() {
  const dateInput = document.getElementById('date');
  if (dateInput && !flatpickrInstance) {
    flatpickrInstance = flatpickr(dateInput, {
      dateFormat: 'Y-m-d',
      defaultDate: 'today',
      allowInput: true
    });
  }
}

// Word count function
function updateWordCount() {
  const content = document.getElementById('content');
  const wordCount = document.getElementById('word-count');
  if (content && wordCount) {
    const count = content.value.trim() === '' ? 0 : content.value.trim().split(/\s+/).length;
    wordCount.textContent = count;
  }
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

async function fetchJSON(path, opts = {}) {
  const url = API + path;
  const method = opts.method || 'GET';
  
  console.log(`[API] ${method} ${url}`, opts.body || '');
  showLoading(true);
  
  try {
    const res = await fetch(url, {
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      ...opts,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    
    console.log(`[API] ${method} ${url} - Status: ${res.status}`);
    
    if (!res.ok) {
      let errorData;
      try {
        errorData = await res.json();
        console.error('[API] Error response:', errorData);
      } catch (e) {
        errorData = { message: await res.text() };
        console.error('[API] Error parsing error response:', e);
      }
      const error = new Error(errorData.message || `HTTP error! status: ${res.status}`);
      error.status = res.status;
      error.data = errorData;
      throw error;
    }
    
    const data = await res.json().catch(e => {
      console.error('[API] Error parsing JSON response:', e);
      return null;
    });
    
    console.log('[API] Response data:', data);
    return data;
  } catch (error) {
    console.error('[API] Request failed:', error);
    throw error;
  } finally {
    showLoading(false);
  }
}

const StoryAPI = {
  getAll: async () => {
    console.log('[API] Fetching all stories...');
    try {
      const stories = await fetchJSON("/stories/");
      console.log('[API] Stories loaded:', stories);
      return stories;
    } catch (error) {
      console.error('[API] Error fetching stories:', error);
      throw error;
    }
  },
  get: async (id) => {
    console.log(`[API] Fetching story ${id}...`);
    return fetchJSON(`/stories/${id}`);
  },
  add: (s) => {
    console.log('[API] Adding story:', s);
    return fetchJSON("/stories/", { 
      method: "POST", 
      body: s 
    });
  },
  update: (id, s) => {
    console.log(`[API] Updating story ${id}:`, s);
    return fetchJSON(`/stories/${id}`, { 
      method: "PUT", 
      body: s 
    });
  },
  delete: (id) => {
    console.log(`[API] Deleting story ${id}`);
    return fetchJSON(`/stories/${id}`, { 
      method: "DELETE" 
    });
  },
  analyze: (id) => {
    console.log(`[API] Analyzing story ${id}`);
    return fetchJSON(`/stories/${id}/analyze`, { 
      method: "POST" 
    });
  },
  getPrompt: () => {
    console.log('[API] Fetching prompt');
    return fetchJSON("/prompt/");
  }
};

const UI = {
  currentStoryId: null,
  
  init() {
    // Wait for DOM to be fully loaded before initializing
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this._initApp());
    } else {
      this._initApp();
    }
  },
  


  _initApp() {
    this.cache();
    this.bind();
    this.loadStories();
    this.loadPrompt();
    
    // Initialize date picker
    initDatePicker();
    
    // Set up word count
    const contentInput = document.getElementById('content');
    if (contentInput) {
      contentInput.addEventListener('input', debounce(updateWordCount, 300));
    }
    
    // Show dashboard by default
    this.show('dash');
    
    // Check for empty state after loading stories
    setTimeout(() => {
      this.checkEmptyState();
    }, 100);
  },
  
  cache() {
    try {
      // Initialize views
      this.views = {
        dash: document.getElementById('stories-dashboard'),
        add: document.getElementById('add-story'),
        detail: document.getElementById('story-detail')
      };
      
      // Initialize main elements
      this.grid = document.getElementById('stories-grid');
      this.emptyState = document.getElementById('empty-state');
      this.loadingOverlay = document.getElementById('loading-overlay');
      this.promptC = document.getElementById("prompt-card");
      this.promptT = document.getElementById("prompt-text");
      this.form = document.getElementById("story-form");
      
      // Initialize form elements
      this.formTitle = document.getElementById('title');
      this.formDate = document.getElementById('date');
      this.formContent = document.getElementById('content');
      this.formTags = document.getElementById('tags');
      
      // Initialize navigation elements with null checks
      this.nav = {};
      const navElements = [
        { key: 'stories', id: 'nav-stories' },
        { key: 'add', id: 'nav-add' },
        { key: 'refine', id: 'nav-refine' },
        { key: 'addBtn', id: 'nav-add-btn' }
      ];
      
      navElements.forEach(({ key, id }) => {
        const element = document.getElementById(id);
        if (element) {
          this.nav[key] = element;
        } else {
          console.warn(`[UI] Navigation element not found: ${id}`);
        }
      });
      
      // Initialize detail elements with null checks
      this.detail = {};
      const detailElements = [
        { key: 'title', id: 'detail-title' },
        { key: 'date', id: 'detail-date' },
        { key: 'content', id: 'detail-content' },
        { key: 'analysis', id: 'detail-analysis' },
        { key: 'analysisCards', id: 'analysis-cards' },
        { key: 'analysisLoading', id: 'analysis-loading' },
        { key: 'editTitle', id: 'edit-title' },
        { key: 'editDate', id: 'edit-date' },
        { key: 'editContent', id: 'edit-content' },
        { key: 'contentView', id: 'content-view' },
        { key: 'editView', id: 'edit-view' },
        { key: 'backButton', id: 'back-to-dashboard' },
        { key: 'editButton', id: 'edit-story' },
        { key: 'cancelEdit', id: 'cancel-edit' },
        { key: 'saveEdit', id: 'save-edit' },
        { key: 'analyzeButton', id: 'analyze-story' },
        { key: 'refreshButton', id: 'refresh-analysis' }
      ];
      
      detailElements.forEach(({ key, id }) => {
        const element = document.getElementById(id);
        if (element) {
          this.detail[key] = element;
        } else {
          console.warn(`[UI] Detail element not found: ${id}`);
        }
      });
      
      // Initialize buttons
      this.btn = {};
      const buttonElements = [
        { key: 'publish', id: 'publish-story' },
        { key: 'saveDraft', id: 'save-draft' },
        { key: 'analyze', id: 'analyze-story' },
        { key: 'refresh', id: 'refresh-analysis' }
      ];
      
      buttonElements.forEach(({ key, id }) => {
        const element = document.getElementById(id);
        if (element) {
          this.btn[key] = element;
        } else {
          console.warn(`[UI] Button not found: ${id}`);
        }
      });
      
      // Initialize event listeners
      const backButton = document.getElementById('back-to-dashboard');
      if (backButton) {
        backButton.addEventListener('click', (e) => {
          e.preventDefault();
          this.show('dash');
        });
      }
    } catch (error) {
      console.error('Error during cache initialization:', error);
    }
  },
  
  _logMissingElements() {
    // Check main elements
    if (!this.grid) console.warn('Element not found: stories-grid');
    if (!this.promptC) console.warn('Element not found: prompt-card');
    if (!this.promptT) console.warn('Element not found: prompt-text');
    if (!this.form) console.warn('Element not found: story-form');
    
    // Check navigation elements
    Object.entries(this.nav).forEach(([key, element]) => {
      if (!element) console.warn(`Navigation element not found: ${key}`);
    });
    
    // Check button elements
    Object.entries(this.btn).forEach(([key, element]) => {
      if (!element) console.warn(`Button not found: ${key}`);
    });
    
    // Check detail elements
    if (this.detail) {
      Object.entries(this.detail).forEach(([key, element]) => {
        if (!element) console.warn(`Detail element not found: ${key}`);
      });
    } else {
      console.warn('Detail elements not initialized');
    }
  },
  
  bind() {
    // Navigation
    if (this.nav.stories) {
      this.nav.stories.onclick = e => { e.preventDefault(); this.show("dash"); };
    }
    if (this.nav.add) {
      this.nav.add.onclick = e => { e.preventDefault(); this.show("add"); };
    }
    if (this.nav.addBtn) {
      this.nav.addBtn.onclick = () => this.show("add");
    }
    if (this.nav.refine) {
      this.nav.refine.onclick = e => { e.preventDefault(); this.show("refine"); };
    }
    // Add first story button
    const addFirstStoryBtn = document.getElementById('add-first-story');
    if (addFirstStoryBtn) {
      addFirstStoryBtn.onclick = (e) => {
        e.preventDefault();
        this.show('add');
      };
    }
    
    // Cancel add button
    const cancelAddBtn = document.getElementById('cancel-add');
    if (cancelAddBtn) {
      cancelAddBtn.onclick = (e) => {
        e.preventDefault();
        this.show('dash');
      };
    }
    
    // Form actions
    if (this.btn.publish) {
      this.btn.publish.onclick = () => this.save(false);
    }
    if (this.btn.saveDraft) {
      this.btn.saveDraft.onclick = () => this.save(true);
    }
    
    // Story detail actions
    if (this.detail.backButton) {
      this.detail.backButton.onclick = () => this.show('dash');
    }
    if (this.detail.editButton) {
      this.detail.editButton.onclick = () => this.toggleEditMode(true);
    }
    if (this.detail.cancelEdit) {
      this.detail.cancelEdit.onclick = () => this.toggleEditMode(false);
    }
    if (this.detail.saveEdit) {
      this.detail.saveEdit.onclick = () => this.saveStoryUpdate();
    }
    if (this.detail.analyzeButton && this.currentStoryId) {
      this.detail.analyzeButton.onclick = () => this.analyze(this.currentStoryId, true);
    }
    if (this.detail.refreshButton && this.currentStoryId) {
      this.detail.refreshButton.onclick = () => this.analyze(this.currentStoryId, true);
    }
    
    // Handle Enter key in edit mode
    if (this.detail.editContent) {
      this.detail.editContent.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          this.saveStoryUpdate();
        }
      });
    } else {
      console.warn('[UI] editContent element not found for keydown event');
    }
  },
  
  toggleEditMode(showEdit) {
    this.detail.contentView.classList.toggle('hidden', showEdit);
    this.detail.editForm.classList.toggle('hidden', !showEdit);
    this.detail.editButton.classList.toggle('hidden', showEdit);
    
    if (showEdit) {
      this.detail.editContent.focus();
      // Auto-resize textarea
      this.detail.editContent.style.height = 'auto';
      this.detail.editContent.style.height = `${this.detail.editContent.scrollHeight}px`;
    }
  },
  
  async saveStoryUpdate() {
    try {
      const content = this.detail.editContent.value.trim();
      if (!content) return;
      
      // Update the UI immediately for better UX
      this.detail.contentView.textContent = content;
      this.toggleEditMode(false);
      
      // Save to server
      await fetchJSON(`/stories/${this.currentStoryId}`, {
        method: 'PUT',
        body: JSON.stringify({ content })
      });
      
      // Update the story in the dashboard
      this.loadStories();
    } catch (e) {
      console.error('Failed to update story:', e);
      alert('Failed to save changes. Please try again.');
    }
  },
  async loadStories() {
    console.log('[UI] loadStories called');
    try {
      console.log('[UI] Fetching stories from API...');
      const startTime = Date.now();
      stories = await StoryAPI.getAll();
      console.log(`[UI] Successfully loaded ${stories.length} stories in ${Date.now() - startTime}ms`, stories);
      this.renderStories();
      this.show('dash');
    } catch(e) {
      console.error('[UI] Failed to load stories:', e);
      // Show error to user
      if (this.grid) {
        this.grid.innerHTML = `
          <div class="text-center py-8">
            <p class="text-red-500 mb-4">Failed to load stories. Please try again later.</p>
            <button class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700" 
                    onclick="UI.loadStories()">
              Retry
            </button>
          </div>
        `;
      }
    }
  },
  show(v) {
    if (!this.views) {
      console.error('Views not initialized');
      return;
    }
    
    // Hide all views
    Object.values(this.views).forEach(view => {
      if (view) view.classList.add("hidden");
    });
    
    // Show the requested view if it exists
    if (this.views[v]) {
      this.views[v].classList.remove("hidden");
      
      // If showing dashboard, render stories
      if (v === 'dash' && this.grid) {
        this.renderStories();
      }
    } else {
      console.error(`View not found: ${v}`);
    }
  },
  
  renderStories() {
    if (!this.grid) {
      console.error('Grid element not found');
      return;
    }
    
    if (!stories || stories.length === 0) {
      this.grid.innerHTML = `
        <div class="col-span-2 text-center py-8">
          <p class="text-gray-500">No stories found. Add your first story to get started!</p>
        </div>
      `;
      return;
    }
    
    this.grid.innerHTML = stories.map(story => `
      <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div class="p-4">
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900 truncate">${story.title || 'Untitled Story'}</h3>
              <p class="text-sm text-gray-500 mt-1">
                ${story.date ? new Date(story.date).toLocaleDateString() : 'No date'}
              </p>
            </div>
            <div class="flex space-x-2">
              <button onclick="UI.editStory('${story.id}')" class="text-indigo-600 hover:text-indigo-900">
                <i class="fas fa-edit"></i>
              </button>
              <button onclick="UI.deleteStory('${story.id}')" class="text-red-600 hover:text-red-900">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
          <p class="mt-2 text-sm text-gray-600 line-clamp-3">
            ${story.content || 'No content'}
          </p>
          ${story.tags ? `
            <div class="mt-3 flex flex-wrap gap-1">
              ${story.tags.split(',').map(tag => `
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  ${tag.trim()}
                </span>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `).join('');
  },
  
  async analyze(id, showInDetail = false) {
    try {
      if (showInDetail && this.currentStoryId === id.toString()) {
        this.detail.analysisLoading.classList.remove('hidden');
        this.detail.analysisCards.classList.add('hidden');
      }
      
      const { analysis } = await StoryAPI.analyze(id);
      
      if (showInDetail && this.currentStoryId === id.toString()) {
        this.renderAnalysisCards(analysis);
        this.detail.analysisLoading.classList.add('hidden');
        this.detail.analysisCards.classList.remove('hidden');
      } else {
        // Show in a modal or alert for non-detail views
        alert("AI Analysis:\n\n" + analysis);
      }
    } catch (e) { 
      console.error('Analysis failed:', e);
      if (showInDetail && this.currentStoryId === id.toString()) {
        this.detail.analysisLoading.classList.add('hidden');
        this.detail.analysisCards.innerHTML = `
          <div class="text-center py-4 text-red-500">
            Failed to analyze story. Please try again.
          </div>
        `;
        this.detail.analysisCards.classList.remove('hidden');
      } else {
        alert('Failed to analyze story. Please try again.');
      }
    }
  },
  async loadPrompt() {
    try {
      const { prompt } = await StoryAPI.getPrompt();
      this.promptT.textContent = prompt;
      this.promptC.classList.remove("hidden");
    } catch(e){ console.error(e) }
  }
};

// Initialize the application when the script loads
// The init() method handles both immediate and deferred DOM loading
UI.init();
UI.checkEmptyState = function() {
  const storiesGrid = document.getElementById('stories-grid');
  const emptyState = document.getElementById('empty-state');
  const dashboard = document.getElementById('stories-dashboard');
  
  if (!storiesGrid || !emptyState || !dashboard) return;
  
  if (storiesGrid.children.length === 0) {
    emptyState.classList.remove('hidden');
    dashboard.classList.add('hidden');
  } else {
    emptyState.classList.add('hidden');
    dashboard.classList.remove('hidden');
  }
};

// Add the editStory function
UI.editStory = function(storyId) {
  const story = this.stories.find(s => s.id === storyId);
  if (!story) return;
  
  this.currentStoryId = storyId;
  this.show('detail');
  this.renderStoryDetail(story);
};