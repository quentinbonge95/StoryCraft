const API_BASE = "http://localhost:8000";

// Helpers
async function fetchJSON(url, method = "GET", body = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(API_BASE + url, options);
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return await res.json();
}

// Story API functions
const StoryAPI = {
  getAll: () => fetchJSON("/stories/"),
  add: (story) => fetchJSON("/stories/", "POST", story),
  analyze: (id) => fetchJSON(`/stories/${id}/analyze`, "POST"),
  delete: (id) => fetchJSON(`/stories/${id}`, "DELETE"),
  update: (id, story) => fetchJSON(`/stories/${id}`, "PUT", story),
  getPrompt: () => fetchJSON("/prompt/"),
};

// UI Manager
const UI = {
  init: function() {
    this.cacheElements();
    this.bindEvents();
    this.loadStories();
    this.loadPrompt();
  },
  cacheElements: function() {
    this.views = {
      dashboard: document.getElementById("stories-dashboard"),
      addStory: document.getElementById("add-story"),
      refineStory: document.getElementById("refine-story"),
      storyDetail: document.getElementById("story-detail"),
    };
    this.navLinks = {
      stories: document.getElementById("nav-stories"),
      add: document.getElementById("nav-add","nav-add-btn"),
      refine: document.getElementById("nav-refine"),
    };
    this.mobileLinks = {
      stories: document.getElementById("mobile-nav-stories"),
      add: document.getElementById("mobile-nav-add"),
      refine: document.getElementById("mobile-nav-refine"),
    };
    this.promptCard = document.getElementById("prompt-card");
    this.promptText = document.getElementById("prompt-text");

    this.storyForm = document.getElementById("story-form");
    this.publishButton = document.getElementById("publish-story");
    this.saveDraftButton = document.getElementById("save-draft");
    this.dashboardContainer = document.getElementById("stories-grid");
  },
  bindEvents: function() {
    this.navLinks.stories.addEventListener("click", (e) => { e.preventDefault(); this.showView("dashboard"); });
    this.navLinks.add.addEventListener("click", (e) => { e.preventDefault(); this.showView("addStory"); });
    this.navLinks.refine.add.addEventListener("click", (e) => { e.preventDefault(); this.showView("refineStory"); });

    this.mobileLinks.stories.addEventListener("click", (e) => { e.preventDefault(); this.showView("dashboard"); });
    this.mobileLinks.add.addEventListener("click", (e) => { e.preventDefault(); this.showView("addStory"); });
    this.mobileLinks.refine.add.addEventListener("click", (e) => { e.preventDefault(); this.showView("refineStory"); });

    this.publishButton.addEventListener("click", () => this.saveStory(false));
    this.saveDraftButton.addEventListener("click", () => this.saveStory(true));
  },
  showView: function(viewName) {
    Object.values(this.views).forEach(v => v.classList.add("hidden"));
    this.views[viewName].classList.remove("hidden");
  },
  loadStories: async function() {
    try {
      const stories = await StoryAPI.getAll();
      this.dashboardContainer.innerHTML = "";
      if (stories.length === 0) {
        this.dashboardContainer.innerHTML = `<div class="text-center text-gray-500">No stories yet.</div>`;
        return;
      }
      stories.forEach(story => {
        const card = document.createElement("div");
        card.className = "story-card bg-white p-4 rounded shadow cursor-pointer";
        card.innerHTML = `
          <h2 class="text-lg font-bold">${story.title}</h2>
          <p class="text-sm text-gray-600">${new Date(story.date).toLocaleDateString()}</p>
          <p class="mt-2">${story.content.slice(0, 100)}...</p>
          <button class="mt-2 text-blue-500 hover:underline" data-id="${story.id}" data-action="analyze">Analyze</button>
        `;
        card.querySelector("[data-action='analyze']").addEventListener("click", async (e) => {
          e.stopPropagation();
          await this.analyzeStory(story.id);
        });
        this.dashboardContainer.appendChild(card);
      });
    } catch (err) {
      console.error("Failed to load stories:", err);
    }
  },
  saveStory: async function(isDraft) {
    const title = this.storyForm.title.value;
    const date = this.storyForm.date.value;
    const content = this.storyForm.content.value;
    const tags = this.storyForm.tags.value;

    if (!title || !content) {
      alert("Title and Content are required!");
      return;
    }
    try {
      await StoryAPI.add({
        title,
        date,
        content,
        tags,
        emotional_impact: "medium", // default for now
        status: isDraft ? "draft" : "published",
      });
      alert(isDraft ? "Draft saved!" : "Story published!");
      this.showView("dashboard");
      this.loadStories();
    } catch (err) {
      console.error("Failed to save story:", err);
    }
  },
  analyzeStory: async function(storyId) {
    try {
      const result = await StoryAPI.analyze(storyId);
      alert("AI Analysis: " + result.analysis);
    } catch (err) {
      console.error("Failed to analyze story:", err);
    }
  },
  loadPrompt: async function() {
    try {
      const prompt = await StoryAPI.getPrompt();
      this.promptText.innerText = `${prompt.superlative} ${prompt.subject}`;
    } catch (err) {
      console.error("Failed to load prompt:", err);
    }
  },
};

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  UI.init();
});
