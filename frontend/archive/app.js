// frontend/dist/app.js

const StoryDB = {
    getStories: () => JSON.parse(localStorage.getItem('stories') || '[]'),

    saveStory: (story) => {
        let stories = StoryDB.getStories();
        if (story.id) {
            const index = stories.findIndex(s => s.id === story.id);
            if (index !== -1) stories[index] = story;
        } else {
            story.id = Date.now().toString();
            story.createdAt = new Date().toISOString();
            stories.push(story);
        }
        localStorage.setItem('stories', JSON.stringify(stories));
        return story;
    },

    deleteStory: (id) => {
        const stories = StoryDB.getStories().filter(story => story.id !== id);
        localStorage.setItem('stories', JSON.stringify(stories));
    },

    getStory: (id) => StoryDB.getStories().find(story => story.id === id)
};

const UIState = {
    currentView: 'dashboard',
    currentStoryId: null,

    init: function () {
        this.bindEvents();
        this.showDashboard();
        this.renderStories();
    },

    bindEvents: function () {
        // Navigation
        document.getElementById('nav-stories')?.addEventListener('click', e => { e.preventDefault(); this.showDashboard(); });
        document.getElementById('nav-add')?.addEventListener('click', e => { e.preventDefault(); this.showAddStory(); });
        document.getElementById('nav-refine')?.addEventListener('click', e => { e.preventDefault(); this.showRefineStory(); });

        // Mobile menu
        document.getElementById('mobile-nav-stories')?.addEventListener('click', e => { e.preventDefault(); this.showDashboard(); this.toggleMobileMenu(); });
        document.getElementById('mobile-nav-add')?.addEventListener('click', e => { e.preventDefault(); this.showAddStory(); this.toggleMobileMenu(); });
        document.getElementById('mobile-nav-refine')?.addEventListener('click', e => { e.preventDefault(); this.showRefineStory(); this.toggleMobileMenu(); });
        document.getElementById('mobile-menu-button')?.addEventListener('click', () => this.toggleMobileMenu());

        // Buttons
        document.getElementById('add-new-story-btn')?.addEventListener('click', () => this.showAddStory());
        document.getElementById('first-story-btn')?.addEventListener('click', () => this.showAddStory());
        document.getElementById('cancel-add-story')?.addEventListener('click', () => this.showDashboard());
        document.getElementById('close-detail-btn')?.addEventListener('click', () => this.showDashboard());

        document.getElementById('publish-story')?.addEventListener('click', () => this.saveStory(false));
        document.getElementById('save-draft')?.addEventListener('click', () => this.saveStory(true));
    },

    toggleMobileMenu: function () {
        document.getElementById('mobile-menu')?.classList.toggle('hidden');
    },

    showDashboard: function () {
        this.currentView = 'dashboard';
        this.updateNavState();
        this.switchView('stories-dashboard');
        this.renderStories();
    },

    showAddStory: function (clearForm = true) {
        this.currentView = 'add';
        this.updateNavState();
        this.switchView('add-story');
        if (clearForm) document.getElementById('story-form')?.reset();
    },

    showRefineStory: function () {
        this.currentView = 'refine';
        this.updateNavState();
        this.switchView('refine-story');
        this.renderStoryListForRefinement();
    },

    showStoryDetail: function (id) {
        this.currentView = 'detail';
        this.currentStoryId = id;
        this.updateNavState();
        this.switchView('story-detail');
        this.populateStoryDetail(StoryDB.getStory(id));
    },

    switchView: function (activeId) {
        ['stories-dashboard', 'add-story', 'refine-story', 'story-detail'].forEach(id => {
            document.getElementById(id)?.classList.add('hidden');
        });
        document.getElementById(activeId)?.classList.remove('hidden');
    },

    updateNavState: function () {
        const navItems = ['nav-stories', 'nav-add', 'nav-refine'];
        const mobileNavItems = ['mobile-nav-stories', 'mobile-nav-add', 'mobile-nav-refine'];

        navItems.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.remove('border-blue-500', 'text-gray-900');
                el.classList.add('border-transparent', 'text-gray-500', 'hover:border-gray-300', 'hover:text-gray-700');
            }
        });

        mobileNavItems.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.remove('bg-blue-50', 'border-blue-500', 'text-blue-700');
                el.classList.add('border-transparent', 'text-gray-500', 'hover:bg-gray-50', 'hover:border-gray-300', 'hover:text-gray-700');
            }
        });

        const active = {
            dashboard: 'nav-stories',
            add: 'nav-add',
            refine: 'nav-refine',
            detail: 'nav-stories'
        }[this.currentView];

        document.getElementById(active)?.classList.add('border-blue-500', 'text-gray-900');
    },

    renderStories: function () {
        const container = document.querySelector('#stories-dashboard .grid');
        if (!container) return;

        const stories = StoryDB.getStories();
        container.innerHTML = '';

        if (stories.length === 0) {
            document.getElementById('no-stories-message')?.classList.remove('hidden');
            return;
        }
        document.getElementById('no-stories-message')?.classList.add('hidden');

        stories.forEach(story => {
            const card = document.createElement('div');
            card.className = 'story-card bg-white rounded-lg overflow-hidden shadow-md cursor-pointer';
            card.innerHTML = `
                <div class="p-6">
                    <h3 class="text-lg font-medium text-gray-900 mb-2">${story.title}</h3>
                    <p class="text-sm text-gray-500 mb-2">${new Date(story.date).toLocaleDateString()}</p>
                    <p class="text-gray-600 line-clamp-3">${story.content.slice(0, 120)}...</p>
                </div>
            `;
            card.onclick = () => this.showStoryDetail(story.id);
            container.appendChild(card);
        });
    },

    populateStoryDetail: function (story) {
        if (!story) return;
        document.getElementById('detail-title').textContent = story.title;
        document.getElementById('detail-date').textContent = new Date(story.date).toLocaleDateString();
        document.getElementById('detail-content').innerHTML = `<p>${story.content.replace(/\n/g, '</p><p>')}</p>`;
    },

    renderStoryListForRefinement: function () {
        const container = document.getElementById('story-list-refine');
        if (!container) return;

        container.innerHTML = '';
        const stories = StoryDB.getStories();

        if (stories.length === 0) {
            container.innerHTML = `<p class="text-gray-500">No stories to refine yet.</p>`;
            return;
        }

        stories.forEach(story => {
            const storyItem = document.createElement('div');
            storyItem.className = 'p-2 hover:bg-gray-100 rounded cursor-pointer';
            storyItem.textContent = story.title;
            storyItem.onclick = () => this.showStoryDetail(story.id);
            container.appendChild(storyItem);
        });
    },

    saveStory: function (isDraft = false) {
        const title = document.getElementById('story-title')?.value.trim();
        const date = document.getElementById('story-date')?.value;
        const content = document.getElementById('story-content')?.value.trim();
        const tags = document.getElementById('story-tags')?.value.trim();
        const emotionalImpact = document.querySelector('input[name="emotional-impact"]:checked')?.value || 'medium';

        if (!title || !content) {
            alert('Title and content are required.');
            return;
        }

        const story = {
            id: document.getElementById('story-form')?.dataset.storyId || null,
            title,
            date: date || new Date().toISOString(),
            content,
            tags,
            emotionalImpact,
            status: isDraft ? 'draft' : 'published',
            updatedAt: new Date().toISOString()
        };

        StoryDB.saveStory(story);
        this.showDashboard();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    UIState.init();
});
