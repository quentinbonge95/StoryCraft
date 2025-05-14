//const API = "http://localhost:8000";
const API = "";   // “/stories/…” and “/prompt/…” become relative to port 80

async function fetchJSON(path, opts = {}) {
  const res = await fetch(API + path, {
    headers: { "Content-Type": "application/json" },
    ...opts
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

const StoryAPI = {
  getAll: () => fetchJSON("/stories/"),
  add:  s => fetchJSON("/stories/", { method: "POST", body: JSON.stringify(s) }),
  analyze: id => fetchJSON(`/stories/${id}/analyze`, { method: "POST" }),
  getPrompt: () => fetchJSON("/prompt/")
};

const UI = {
  init() {
    this.cache(); this.bind(); this.loadStories(); this.loadPrompt();
  },
  cache() {
    this.views = {
      dash:   document.getElementById("stories-dashboard"),
      add:    document.getElementById("add-story"),
      refine: document.getElementById("refine-story")
    };
    this.grid      = document.getElementById("stories-grid");
    this.promptC   = document.getElementById("prompt-card");
    this.promptT   = document.getElementById("prompt-text");
    this.form      = document.getElementById("story-form");
    this.nav       = {
      stories: document.getElementById("nav-stories"),
      add:     document.getElementById("nav-add"),
      refine:  document.getElementById("nav-refine"),
      addBtn:  document.getElementById("nav-add-btn")
    };
    this.btn = {
      publish:    document.getElementById("publish-story"),
      saveDraft:  document.getElementById("save-draft")
    };
  },
  bind() {
    this.nav.stories.onclick = e => { e.preventDefault(); this.show("dash"); };
    this.nav.add.onclick     = e => { e.preventDefault(); this.show("add"); };
    this.nav.addBtn.onclick  = () => this.show("add");
    this.nav.refine.onclick  = e => { e.preventDefault(); this.show("refine"); };
    this.btn.publish.onclick = () => this.save(false);
    this.btn.saveDraft.onclick = () => this.save(true);
  },
  show(v) {
    Object.values(this.views).forEach(s => s.classList.add("hidden"));
    this.views[v].classList.remove("hidden");
  },
  async loadStories() {
    try {
      const arr = await StoryAPI.getAll();
      this.grid.innerHTML = arr.length
        ? arr.map(s=>`
            <div class="p-4 bg-white rounded shadow">
              <h3 class="font-semibold">${s.title}</h3>
              <p class="text-sm text-gray-500">${new Date(s.date).toLocaleDateString()}</p>
              <p class="mt-2">${s.content.slice(0,100)}…</p>
              <button class="mt-2 text-blue-500" onclick="UI.analyze(${s.id})">Analyze</button>
            </div>
          `).join("")
        : `<div class="text-gray-500">No stories yet.</div>`;
    } catch(e){ console.error(e) }
  },
  async save(isDraft) {
    const f = this.form;
    const data = {
      title: f.title.value,
      date:  f.date.value||new Date().toISOString().slice(0,10),
      content: f.content.value,
      tags: f.tags.value,
      emotional_impact: "medium",
      status: isDraft?"draft":"published"
    };
    if (!data.title || !data.content) {
      return alert("Title & content required");
    }
    try {
      await StoryAPI.add(data);
      this.show("dash");
      this.loadStories();
    } catch(e){ console.error(e) }
  },
  async analyze(id) {
    try {
      const { analysis } = await StoryAPI.analyze(id);
      alert("AI says:\n\n" + analysis);
    } catch(e){ console.error(e) }
  },
  async loadPrompt() {
    try {
      const { prompt } = await StoryAPI.getPrompt();
      this.promptT.textContent = prompt;
      this.promptC.classList.remove("hidden");
    } catch(e){ console.error(e) }
  }
};

window.onload = () => UI.init();
