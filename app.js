const state = {
  profile: {
    name: "陳阿姨",
    gender: "",
    birthday: "",
    language: "國語為主，可以穿插台語",
    topics: "老照片、家庭料理、以前的台北、工作故事、人生選擇",
  },
  onboarded: false,
  loginStep: 0,
  createStep: 0,
  selectedImage: null,
  imageDrafts: [],
  audioDraft: null,
  stories: [],
  online: false,
  scrapbookPage: 0,
  audiencePage: 0,
  timerId: null,
  secondsLeft: 15 * 60,
};

const storageKey = "story-album-prototype-v1";

const els = {
  appShell: document.querySelectorAll(".app-shell"),
  onboarding: document.querySelector("#onboarding"),
  loginForm: document.querySelector("#loginForm"),
  loginSteps: document.querySelectorAll(".login-step"),
  loginCrumbs: document.querySelectorAll(".crumb"),
  loginName: document.querySelector("#loginName"),
  loginGender: document.querySelector("#loginGender"),
  birthYear: document.querySelector("#birthYear"),
  birthMonth: document.querySelector("#birthMonth"),
  birthDay: document.querySelector("#birthDay"),
  birthdayHint: document.querySelector("#birthdayHint"),
  loginBackBtn: document.querySelector("#loginBackBtn"),
  loginNextBtn: document.querySelector("#loginNextBtn"),
  reLoginBtn: document.querySelector("#reLoginBtn"),
  audienceToggleBtn: document.querySelector("#audienceToggleBtn"),
  navButtons: document.querySelectorAll(".nav-btn"),
  views: document.querySelectorAll(".view"),
  onlineStatus: document.querySelector("#onlineStatus"),
  profileForm: document.querySelector("#profileForm"),
  elderName: document.querySelector("#elderName"),
  languageMode: document.querySelector("#languageMode"),
  profileTopics: document.querySelector("#profileTopics"),
  imageInput: document.querySelector("#imageInput"),
  galleryImageInput: document.querySelector("#galleryImageInput"),
  createSteps: document.querySelectorAll("#create .create-step"),
  createCrumbs: document.querySelectorAll("#create .crumb"),
  createBackBtn: document.querySelector("#createBackBtn"),
  createNextBtn: document.querySelector("#createNextBtn"),
  saveStoryBtn: document.querySelector("#saveStoryBtn"),
  cancelStoryBtn: document.querySelector("#cancelStoryBtn"),
  storyPreviewImage: document.querySelector("#storyPreviewImage"),
  storyPreviewTitle: document.querySelector("#storyPreviewTitle"),
  storyPreviewNoteTitle: document.querySelector("#storyPreviewNoteTitle"),
  storyPreviewSummary: document.querySelector("#storyPreviewSummary"),
  storyPreviewKeywords: document.querySelector("#storyPreviewKeywords"),
  storyPreviewAudio: document.querySelector("#storyPreviewAudio"),
  previewStrip: document.querySelector("#previewStrip"),
  storyForm: document.querySelector("#storyForm"),
  storyTitle: document.querySelector("#storyTitle"),
  storySummary: document.querySelector("#storySummary"),
  recordBtn: document.querySelector("#recordBtn"),
  stopRecordBtn: document.querySelector("#stopRecordBtn"),
  clearAudioBtn: document.querySelector("#clearAudioBtn"),
  audioPlayback: document.querySelector("#audioPlayback"),
  recordHint: document.querySelector("#recordHint"),
  recordStatus: document.querySelector("#recordStatus"),
  scrapbookShell: document.querySelector("#scrapbookShell"),
  scrapbookSpread: document.querySelector("#scrapbookSpread"),
  prevPageBtn: document.querySelector("#prevPageBtn"),
  nextPageBtn: document.querySelector("#nextPageBtn"),
  pageIndicator: document.querySelector("#pageIndicator"),
  emptyGallery: document.querySelector("#emptyGallery"),
  todayList: document.querySelector("#todayList"),
  toggleOnlineBtn: document.querySelector("#toggleOnlineBtn"),
  searchInput: document.querySelector("#searchInput"),
  searchResults: document.querySelector("#searchResults"),
  audienceSearchPanel: document.querySelector("#audienceSearchPanel"),
  audienceBookPanel: document.querySelector("#audienceBookPanel"),
  audienceScrapbookSpread: document.querySelector("#audienceScrapbookSpread"),
  audienceBackToSearchBtn: document.querySelector("#audienceBackToSearchBtn"),
  audiencePrevPageBtn: document.querySelector("#audiencePrevPageBtn"),
  audienceNextPageBtn: document.querySelector("#audienceNextPageBtn"),
  audiencePageIndicator: document.querySelector("#audiencePageIndicator"),
  chatForm: document.querySelector("#chatForm"),
  chatInput: document.querySelector("#chatInput"),
  chatLog: document.querySelector("#chatLog"),
  inviteBtn: document.querySelector("#inviteBtn"),
  classroomImage: document.querySelector("#classroomImage"),
  endClassBtn: document.querySelector("#endClassBtn"),
  startTimerBtn: document.querySelector("#startTimerBtn"),
  timer: document.querySelector("#timer"),
  drawCanvas: document.querySelector("#drawCanvas"),
  clearCanvasBtn: document.querySelector("#clearCanvasBtn"),
  translateBtn: document.querySelector("#translateBtn"),
  translateText: document.querySelector("#translateText"),
  translationOutput: document.querySelector("#translationOutput"),
  storyTemplate: document.querySelector("#storyCardTemplate"),
};

let mediaRecorder = null;
let audioChunks = [];

function loadState() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return;
  try {
    const parsed = JSON.parse(saved);
    state.profile = parsed.profile || state.profile;
    state.onboarded = Boolean(parsed.onboarded);
    state.stories = parsed.stories || [];
    state.online = Boolean(parsed.online);
  } catch {
    localStorage.removeItem(storageKey);
  }
}

function saveState() {
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      profile: state.profile,
      onboarded: state.onboarded,
      stories: state.stories,
      online: state.online,
    })
  );
}

function showView(id) {
  document.body.classList.toggle("classroom-mode", id === "classroom");
  document.body.classList.toggle("audience-mode", id === "audience");
  document.body.classList.toggle("create-mode", id === "create");
  els.views.forEach((view) => view.classList.toggle("active", view.id === id));
  els.navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === id);
  });
  if (id === "classroom") updateClassroomImage();
  if (id === "audience") renderSearch();
  if (id === "create") showCreateStep(0);
  els.audienceToggleBtn.textContent =
    id === "audience" ? "測試用：回到策展人視角" : "測試用：觀眾視角";
}

function showCreateStep(step) {
  state.createStep = Math.max(0, Math.min(2, step));
  els.createSteps.forEach((panel) => {
    panel.classList.toggle("active", Number(panel.dataset.step) === state.createStep);
  });
  els.createCrumbs.forEach((crumb) => {
    const crumbStep = Number(crumb.dataset.createStep);
    crumb.classList.toggle("active", crumbStep === state.createStep);
    crumb.classList.toggle("done", crumbStep < state.createStep);
  });
  els.createBackBtn.disabled = state.createStep === 0;
  els.createNextBtn.classList.toggle("is-hidden", state.createStep === 2);
  els.saveStoryBtn.classList.toggle("is-hidden", state.createStep !== 2);
  if (state.createStep === 2) renderStoryPreview();
}

function resetStoryDraft() {
  if (mediaRecorder?.state === "recording") mediaRecorder.stop();
  state.selectedImage = null;
  state.imageDrafts = [];
  state.audioDraft = null;
  els.storyForm.reset();
  els.audioPlayback.removeAttribute("src");
  renderPreviews();
  clearAudioDraft();
  showCreateStep(0);
}

function cancelStoryDraft() {
  resetStoryDraft();
  showView("gallery");
}

function goToNextCreateStep() {
  if (state.createStep === 0 && !state.selectedImage) {
    alert("請先選擇一張照片。");
    return;
  }
  if (state.createStep === 1 && !els.storyTitle.value.trim() && !els.storySummary.value.trim()) {
    alert("請先填一個標題或一兩句故事主軸。");
    return;
  }
  showCreateStep(state.createStep + 1);
}

function renderStoryPreview() {
  const title = els.storyTitle.value.trim() || state.selectedImage?.name?.replace(/\.[^.]+$/, "") || "照片故事";
  const summary = els.storySummary.value.trim() || "這張照片有一段想慢慢說的故事。";
  const keywords = makeKeywords(`${title} ${summary}`);
  if (state.selectedImage) els.storyPreviewImage.src = state.selectedImage.src;
  els.storyPreviewTitle.textContent = title;
  els.storyPreviewNoteTitle.textContent = title;
  els.storyPreviewSummary.textContent = summary;
  els.storyPreviewKeywords.innerHTML = "";
  keywords.forEach((keyword) => {
    const tag = document.createElement("span");
    tag.textContent = keyword;
    els.storyPreviewKeywords.append(tag);
  });
  els.storyPreviewAudio.innerHTML = "";
  if (state.audioDraft) {
    const audio = document.createElement("audio");
    audio.controls = true;
    audio.src = state.audioDraft;
    els.storyPreviewAudio.append(audio);
  } else {
    els.storyPreviewAudio.textContent = "尚未錄音";
  }
}

function showLoginStep(step) {
  state.loginStep = Math.max(0, Math.min(2, step));
  els.loginSteps.forEach((panel) => {
    panel.classList.toggle("active", Number(panel.dataset.step) === state.loginStep);
  });
  els.loginCrumbs.forEach((crumb) => {
    const crumbStep = Number(crumb.dataset.loginStep);
    crumb.classList.toggle("active", crumbStep === state.loginStep);
    crumb.classList.toggle("done", crumbStep < state.loginStep);
  });
  els.loginBackBtn.disabled = state.loginStep === 0;
  els.loginNextBtn.textContent = state.loginStep === 2 ? "完成，進入相冊" : "下一步";
}

function showOnboarding() {
  document.body.classList.remove("classroom-mode");
  document.body.classList.remove("audience-mode");
  document.body.classList.remove("create-mode");
  els.onboarding.classList.remove("is-hidden");
  els.appShell.forEach((node) => node.classList.add("is-hidden"));
  els.reLoginBtn.classList.add("is-hidden");
  els.audienceToggleBtn.classList.add("is-hidden");
  showLoginStep(0);
}

function showApp() {
  document.body.classList.remove("classroom-mode");
  document.body.classList.remove("audience-mode");
  document.body.classList.remove("create-mode");
  els.onboarding.classList.add("is-hidden");
  els.appShell.forEach((node) => node.classList.remove("is-hidden"));
  els.reLoginBtn.classList.remove("is-hidden");
  els.audienceToggleBtn.classList.remove("is-hidden");
  showView("gallery");
}

function completeLogin() {
  state.profile.name = els.loginName.value.trim() || "說故事者";
  state.profile.gender = els.loginGender.value;
  state.profile.birthday = getBirthdayValue();
  state.onboarded = true;
  saveState();
  showApp();
}

function handleLoginSubmit(event) {
  event.preventDefault();
  if (state.loginStep === 0) {
    if (!els.loginName.value.trim()) {
      els.loginName.focus();
      return;
    }
    showLoginStep(1);
    els.loginGender.focus();
    return;
  }
  if (state.loginStep === 1) {
    if (!els.loginGender.value) {
      els.loginGender.focus();
      return;
    }
    showLoginStep(2);
    els.birthYear.focus();
    return;
  }
  if (!getBirthdayValue()) {
    els.birthdayHint.textContent = "請完整選擇出生年、月、日。";
    els.birthYear.focus();
    return;
  }
  completeLogin();
}

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function getBirthdayValue() {
  if (!els.birthYear.value || !els.birthMonth.value || !els.birthDay.value) return "";
  return `${els.birthYear.value}-${padNumber(els.birthMonth.value)}-${padNumber(els.birthDay.value)}`;
}

function fillSelect(select, values, placeholder) {
  select.innerHTML = `<option value="">${placeholder}</option>`;
  values.forEach(({ value, label }) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.append(option);
  });
}

function setupBirthdayFields() {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear - 55; year >= currentYear - 110; year -= 1) {
    years.push({ value: year, label: `${year} 年` });
  }
  fillSelect(els.birthYear, years, "選擇年");
  fillSelect(
    els.birthMonth,
    Array.from({ length: 12 }, (_, index) => ({ value: index + 1, label: `${index + 1} 月` })),
    "選擇月"
  );
  updateBirthdayDays();
}

function updateBirthdayDays() {
  const year = Number(els.birthYear.value) || 1940;
  const month = Number(els.birthMonth.value) || 1;
  const selectedDay = Number(els.birthDay.value);
  const daysInMonth = new Date(year, month, 0).getDate();
  fillSelect(
    els.birthDay,
    Array.from({ length: daysInMonth }, (_, index) => ({ value: index + 1, label: `${index + 1} 日` })),
    "選擇日"
  );
  if (selectedDay && selectedDay <= daysInMonth) els.birthDay.value = selectedDay;
}

function setBirthdayFields(value) {
  if (!value) return;
  const [year, month, day] = value.split("-");
  els.birthYear.value = year || "";
  els.birthMonth.value = month ? String(Number(month)) : "";
  updateBirthdayDays();
  els.birthDay.value = day ? String(Number(day)) : "";
}

function dataUrlFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function handleImages(files) {
  const imageFiles = [...files].filter((file) => file.type.startsWith("image/"));
  const drafts = await Promise.all(
    imageFiles.map(async (file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      src: await dataUrlFromFile(file),
    }))
  );
  state.imageDrafts = drafts;
  state.selectedImage = drafts[0] || null;
  renderPreviews();
}

async function pasteImagesToScrapbook(files) {
  const imageFiles = [...files].filter((file) => file.type.startsWith("image/"));
  if (!imageFiles.length) return;
  const stories = await Promise.all(
    imageFiles.map(async (file) => {
      const title = file.name.replace(/\.[^.]+$/, "") || "新照片";
      return {
        id: crypto.randomUUID(),
        title,
        summary: "先把照片貼進相冊，之後可以補上一兩句故事或錄音。",
        image: await dataUrlFromFile(file),
        audio: null,
        keywords: makeKeywords(title),
        today: false,
        createdAt: new Date().toISOString(),
      };
    })
  );
  state.stories.push(...stories);
  state.scrapbookPage = Math.max(0, Math.ceil(state.stories.length / 2) - 1);
  saveState();
  renderAll();
  showView("gallery");
}

function renderPreviews() {
  els.previewStrip.innerHTML = "";
  state.imageDrafts.forEach((image) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = image.id === state.selectedImage?.id ? "selected" : "";
    button.setAttribute("aria-label", `選擇 ${image.name}`);
    button.innerHTML = `<img src="${image.src}" alt="${image.name}" />`;
    button.addEventListener("click", () => {
      state.selectedImage = image;
      renderPreviews();
    });
    els.previewStrip.append(button);
  });
}

function makeKeywords(text) {
  const base = text
    .replace(/[，。！？、；：「」『』（）()]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 2)
    .slice(0, 5);
  return [...new Set(base.length ? base : ["生命故事", "照片", "聊天"])];
}

function addStory(event) {
  event.preventDefault();
  if (!state.selectedImage) {
    alert("請先選擇一張照片。");
    return;
  }
  const title = els.storyTitle.value.trim() || state.selectedImage.name.replace(/\.[^.]+$/, "");
  const summary = els.storySummary.value.trim() || "這張照片有一段想慢慢說的故事。";
  state.stories.push({
    id: crypto.randomUUID(),
    title,
    summary,
    image: state.selectedImage.src,
    audio: state.audioDraft,
    keywords: makeKeywords(`${title} ${summary}`),
    today: true,
    createdAt: new Date().toISOString(),
  });
  state.scrapbookPage = Math.max(0, Math.ceil(state.stories.length / 2) - 1);
  resetStoryDraft();
  saveState();
  renderAll();
  showView("gallery");
}

async function toggleRecording() {
  if (mediaRecorder?.state === "recording") {
    mediaRecorder.stop();
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    alert("這個瀏覽器不支援錄音。請用 Chrome、Edge 或 Safari 新版，並從 localhost 開啟。");
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (event) => audioChunks.push(event.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType || "audio/webm" });
      const reader = new FileReader();
      reader.onload = () => {
        state.audioDraft = reader.result;
        els.audioPlayback.src = state.audioDraft;
        els.recordHint.textContent = "錄好了，可以先播放確認。";
      };
      reader.readAsDataURL(blob);
      stream.getTracks().forEach((track) => track.stop());
      els.recordBtn.textContent = "重新錄音";
      els.recordBtn.classList.remove("recording");
    };
    mediaRecorder.start();
    els.recordBtn.textContent = "停止錄音";
    els.recordBtn.classList.add("recording");
    els.recordHint.textContent = "正在錄音，說完後按停止。";
  } catch (error) {
    alert("無法取得麥克風權限。請確認瀏覽器允許此頁使用麥克風。");
  }
}

function clearAudioDraft() {
  state.audioDraft = null;
  els.audioPlayback.removeAttribute("src");
  els.recordHint.textContent = "按下開始後，講 10 到 30 秒就可以。";
  els.recordBtn.textContent = "開始錄音";
}

async function startRecording() {
  if (!navigator.mediaDevices?.getUserMedia) {
    alert("這個瀏覽器不支援錄音。請用 Chrome、Edge 或 Safari 新版，並從 localhost 開啟。");
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (event) => audioChunks.push(event.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType || "audio/webm" });
      const reader = new FileReader();
      reader.onload = () => {
        state.audioDraft = reader.result;
        els.audioPlayback.src = state.audioDraft;
        els.recordHint.textContent = "錄好了。可以先播放確認，不滿意再重新錄。";
        els.recordStatus.textContent = "已錄好，可以播放";
        els.recordStatus.className = "record-status ready";
      };
      reader.readAsDataURL(blob);
      stream.getTracks().forEach((track) => track.stop());
      els.recordBtn.disabled = false;
      els.stopRecordBtn.disabled = true;
      els.recordBtn.textContent = "重新錄故事";
    };
    mediaRecorder.start();
    els.recordBtn.disabled = true;
    els.stopRecordBtn.disabled = false;
    els.recordStatus.textContent = "正在錄音";
    els.recordStatus.className = "record-status recording";
    els.recordHint.textContent = "正在錄音。說完後按紅色按鈕停止。";
  } catch (error) {
    alert("無法取得麥克風權限。請確認瀏覽器允許此頁使用麥克風。");
  }
}

function stopRecording() {
  if (mediaRecorder?.state === "recording") mediaRecorder.stop();
}

toggleRecording = startRecording;
clearAudioDraft = function () {
  state.audioDraft = null;
  els.audioPlayback.removeAttribute("src");
  els.recordHint.textContent = "先按「開始錄故事」，講完後按「停止並存下來」。";
  els.recordStatus.textContent = "尚未錄音";
  els.recordStatus.className = "record-status";
  els.recordBtn.textContent = "開始錄故事";
  els.recordBtn.disabled = false;
  els.stopRecordBtn.disabled = true;
};

function renderStoryCard(story, index, mode = "gallery") {
  const node = els.storyTemplate.content.firstElementChild.cloneNode(true);
  node.classList.toggle("today", story.today);
  node.querySelector(".story-image").src = story.image;
  node.querySelector(".story-image").alt = story.title;
  node.querySelector("h3").textContent = story.title;
  node.querySelector(".summary").textContent = story.summary;
  node.querySelector(".tag-pill").textContent = story.today ? "今天想聊" : "收藏";
  const audio = node.querySelector("audio");
  if (story.audio) {
    audio.src = story.audio;
  } else {
    audio.remove();
  }
  const keywords = node.querySelector(".keywords");
  story.keywords.forEach((keyword) => {
    const tag = document.createElement("span");
    tag.textContent = keyword;
    keywords.append(tag);
  });

  const actions = node.querySelector(".card-actions");
  if (mode === "search") {
    node.classList.add("audience-result-card");
    node.querySelector(".story-image").setAttribute("role", "button");
    node.querySelector(".story-image").setAttribute("tabindex", "0");
    node.querySelector(".story-image").title = "點擊打開觀眾視角相冊";
    node.querySelector(".story-image").addEventListener("click", () => openAudienceBook(index));
    node.querySelector(".story-image").addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") openAudienceBook(index);
    });
    actions.innerHTML = "";
    const openBookButton = document.createElement("button");
    openBookButton.className = "secondary-btn small";
    openBookButton.textContent = "打開相冊";
    openBookButton.addEventListener("click", () => openAudienceBook(index));
    actions.append(openBookButton);
    return node;
  }

  actions.addEventListener("click", (event) => mutateStoryAction(event, story, index));
  return node;
}

function mutateStoryAction(event, story, index) {
  const action = event.target.dataset.action;
  if (!action) return;
  if (action === "delete") state.stories = state.stories.filter((item) => item.id !== story.id);
  if (action === "today") story.today = !story.today;
  if (action === "up" && index > 0) {
    [state.stories[index - 1], state.stories[index]] = [state.stories[index], state.stories[index - 1]];
  }
  if (action === "down" && index < state.stories.length - 1) {
    [state.stories[index + 1], state.stories[index]] = [state.stories[index], state.stories[index + 1]];
  }
  const maxPage = Math.max(0, Math.ceil((state.stories.length + 1) / 2) - 1);
  state.scrapbookPage = Math.min(state.scrapbookPage, maxPage);
  saveState();
  renderAll();
}

function makeScrapbookPage(story, index) {
  const page = document.createElement("article");
  page.className = "scrapbook-page";
  page.innerHTML = `
    <div class="scrapbook-photo-wrap">
      <img src="${story.image}" alt="${story.title}" />
      <div class="scrapbook-caption">
        <h3>${story.title}</h3>
        <span class="tag-pill">${story.today ? "今天想聊" : "收藏"}</span>
      </div>
    </div>
    <div class="paper-note">
      <p>${story.summary}</p>
      <div class="keywords"></div>
    </div>
    <div>
      <div class="scrapbook-audio"></div>
      <div class="scrapbook-page-actions">
        <button class="ghost-btn small" data-action="up">上移</button>
        <button class="ghost-btn small" data-action="down">下移</button>
        <button class="secondary-btn small" data-action="today">${story.today ? "取消今天" : "今天想聊"}</button>
        <button class="danger-btn small" data-action="delete">刪除</button>
      </div>
    </div>
  `;

  const keywords = page.querySelector(".keywords");
  story.keywords.forEach((keyword) => {
    const tag = document.createElement("span");
    tag.textContent = keyword;
    keywords.append(tag);
  });

  const audioWrap = page.querySelector(".scrapbook-audio");
  if (story.audio) {
    const audio = document.createElement("audio");
    audio.controls = true;
    audio.src = story.audio;
    audioWrap.append(audio);
  } else {
    audioWrap.textContent = "尚未錄音";
  }

  page.querySelector(".scrapbook-page-actions").addEventListener("click", (event) => {
    mutateStoryAction(event, story, index);
  });
  return page;
}

function makeReadonlyScrapbookPage(story) {
  const page = document.createElement("article");
  page.className = "scrapbook-page readonly-page";
  page.innerHTML = `
    <div class="scrapbook-photo-wrap">
      <img src="${story.image}" alt="${story.title}" />
      <div class="scrapbook-caption">
        <h3>${story.title}</h3>
        <button class="tag-pill interest-btn" type="button">有興趣</button>
      </div>
    </div>
    <div class="paper-note">
      <p>${story.summary}</p>
      <div class="keywords"></div>
    </div>
    <div class="scrapbook-audio"></div>
  `;
  page.querySelector(".interest-btn").addEventListener("click", () => showView("messages"));
  const keywords = page.querySelector(".keywords");
  story.keywords.forEach((keyword) => {
    const tag = document.createElement("span");
    tag.textContent = keyword;
    keywords.append(tag);
  });
  const audioWrap = page.querySelector(".scrapbook-audio");
  if (story.audio) {
    const audio = document.createElement("audio");
    audio.controls = true;
    audio.src = story.audio;
    audioWrap.append(audio);
  } else {
    audioWrap.textContent = "這張照片尚未附錄音";
  }
  return page;
}

function makeReadonlyEmptyPage() {
  const page = document.createElement("article");
  page.className = "scrapbook-page empty readonly-page";
  page.innerHTML = "<p>這一頁還沒有故事。</p>";
  return page;
}

function makeEmptyScrapbookPage() {
  const emptyPage = document.createElement("article");
  emptyPage.className = "scrapbook-page empty";
  emptyPage.innerHTML = `
    <button class="paste-photo-button" type="button">
      <span class="big-symbol">+</span>
      <span>在這一頁新增故事</span>
      <small>點一下開始上傳照片、錄音；也可以把照片拖到書頁上</small>
    </button>
  `;
  emptyPage.querySelector("button").addEventListener("click", () => showView("create"));
  emptyPage.addEventListener("dragover", (event) => {
    event.preventDefault();
    emptyPage.classList.add("drag-over");
  });
  emptyPage.addEventListener("dragleave", () => emptyPage.classList.remove("drag-over"));
  emptyPage.addEventListener("drop", (event) => {
    event.preventDefault();
    emptyPage.classList.remove("drag-over");
    pasteImagesToScrapbook(event.dataTransfer.files);
  });
  return emptyPage;
}

function renderGallery() {
  els.scrapbookSpread.innerHTML = "";
  const pageCount = Math.max(1, Math.ceil((state.stories.length + 1) / 2));
  state.scrapbookPage = Math.min(state.scrapbookPage, pageCount - 1);
  const start = state.scrapbookPage * 2;
  const spreadStories = state.stories.slice(start, start + 2);

  for (let slot = 0; slot < 2; slot += 1) {
    const story = spreadStories[slot];
    if (story) {
      els.scrapbookSpread.append(makeScrapbookPage(story, start + slot));
    } else {
      els.scrapbookSpread.append(makeEmptyScrapbookPage());
    }
  }

  els.pageIndicator.textContent = `第 ${state.scrapbookPage + 1} / ${pageCount} 頁`;
  els.prevPageBtn.disabled = state.scrapbookPage === 0;
  els.nextPageBtn.disabled = state.scrapbookPage >= pageCount - 1;
  els.scrapbookShell.style.display = "block";
  els.emptyGallery.style.display = state.stories.length ? "none" : "block";
}

function openAudienceBook(storyIndex = 0) {
  state.audiencePage = Math.floor(storyIndex / 2);
  els.audienceSearchPanel.classList.add("is-hidden");
  els.audienceBookPanel.classList.remove("is-hidden");
  renderAudienceBook();
}

function showAudienceSearch() {
  els.audienceBookPanel.classList.add("is-hidden");
  els.audienceSearchPanel.classList.remove("is-hidden");
  renderSearch();
}

function renderAudienceBook() {
  els.audienceScrapbookSpread.innerHTML = "";
  const pageCount = Math.max(1, Math.ceil(state.stories.length / 2));
  state.audiencePage = Math.min(state.audiencePage, pageCount - 1);
  const start = state.audiencePage * 2;
  const spreadStories = state.stories.slice(start, start + 2);
  for (let slot = 0; slot < 2; slot += 1) {
    const story = spreadStories[slot];
    els.audienceScrapbookSpread.append(story ? makeReadonlyScrapbookPage(story) : makeReadonlyEmptyPage());
  }
  els.audiencePageIndicator.textContent = `第 ${state.audiencePage + 1} / ${pageCount} 頁`;
  els.audiencePrevPageBtn.disabled = state.audiencePage === 0;
  els.audienceNextPageBtn.disabled = state.audiencePage >= pageCount - 1;
}

function renderLive() {
  els.onlineStatus.textContent = state.online ? "目前上線接課" : "目前離線";
  els.onlineStatus.classList.toggle("online", state.online);
  els.toggleOnlineBtn.textContent = state.online ? "關閉接課" : "打開接課";
  els.toggleOnlineBtn.classList.toggle("danger-state", state.online);
  els.todayList.innerHTML = "";
  const todayStories = state.stories.filter((story) => story.today);
  if (!todayStories.length) {
    els.todayList.innerHTML = `<p class="empty-state">${state.stories.length ? "目前沒有開放聊天的照片。" : "相冊裡還沒有照片。"}</p>`;
  }
  todayStories.forEach((story) => {
    const item = document.createElement("div");
    item.className = "compact-item";
    item.innerHTML = `
      <img src="${story.image}" alt="${story.title}" />
      <strong>${story.title}</strong>
      <button class="danger-btn small" type="button">取消今天想聊</button>
    `;
    item.querySelector("button").addEventListener("click", () => {
      story.today = false;
      saveState();
      renderGallery();
      renderLive();
    });
    els.todayList.append(item);
  });
  renderSearch();
}

function renderSearch() {
  const query = els.searchInput.value.trim().toLowerCase();
  const pool = state.online
    ? state.stories.map((story, index) => ({ story, index })).filter((item) => item.story.today)
    : [];
  const results = pool.filter(({ story }) => {
    const haystack = `${story.title} ${story.summary} ${story.keywords.join(" ")}`.toLowerCase();
    return !query || haystack.includes(query);
  });
  els.searchResults.innerHTML = "";
  results.forEach(({ story, index }) => els.searchResults.append(renderStoryCard(story, index, "search")));
  if (!results.length) {
    els.searchResults.innerHTML = `<p class="empty-state">${state.online ? "沒有符合的照片。" : "長輩目前離線，所以搜尋頁不顯示課程。"}</p>`;
  }
  if (!els.audienceBookPanel.classList.contains("is-hidden")) renderAudienceBook();
}

function renderAll() {
  renderGallery();
  renderLive();
  updateClassroomImage();
}

function addChatBubble(text, speaker) {
  const bubble = document.createElement("div");
  bubble.className = `bubble ${speaker}`;
  bubble.textContent = text;
  els.chatLog.append(bubble);
  els.chatLog.scrollTop = els.chatLog.scrollHeight;
}

function addClassroomLinkBubble() {
  const bubble = document.createElement("div");
  bubble.className = "bubble link-bubble";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "classroom-link";
  button.textContent = "連結";
  button.addEventListener("click", () => showView("classroom"));
  bubble.append(button);
  els.chatLog.append(bubble);
  els.chatLog.scrollTop = els.chatLog.scrollHeight;
}

function sendChat(event) {
  event.preventDefault();
  const text = els.chatInput.value.trim();
  if (!text) return;
  addChatBubble(text, "elder");
  els.chatInput.value = "";
}

function sendInvite() {
  addChatBubble("我發送了 15 分鐘聊天邀請。你可以從連結進入教室。", "elder");
  addClassroomLinkBubble();
  setTimeout(() => addChatBubble("謝謝！我準備好了。", "visitor"), 500);
}

function updateClassroomImage() {
  const story = state.stories.find((item) => item.today) || state.stories[0];
  if (story) {
    els.classroomImage.src = story.image;
    els.classroomImage.alt = story.title;
  } else {
    els.classroomImage.removeAttribute("src");
    els.classroomImage.alt = "尚未選擇照片";
  }
}

function formatTime(seconds) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const rest = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}

function startTimer() {
  clearInterval(state.timerId);
  state.secondsLeft = 15 * 60;
  els.timer.textContent = formatTime(state.secondsLeft);
  state.timerId = setInterval(() => {
    state.secondsLeft -= 1;
    els.timer.textContent = formatTime(state.secondsLeft);
    if (state.secondsLeft <= 0) clearInterval(state.timerId);
  }, 1000);
}

function setupCanvas() {
  const canvas = els.drawCanvas;
  const context = canvas.getContext("2d");
  context.lineWidth = 5;
  context.lineCap = "round";
  context.strokeStyle = "#2456a6";
  let drawing = false;

  function point(event) {
    const rect = canvas.getBoundingClientRect();
    const source = event.touches ? event.touches[0] : event;
    return {
      x: ((source.clientX - rect.left) / rect.width) * canvas.width,
      y: ((source.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function start(event) {
    drawing = true;
    const p = point(event);
    context.beginPath();
    context.moveTo(p.x, p.y);
    event.preventDefault();
  }

  function move(event) {
    if (!drawing) return;
    const p = point(event);
    context.lineTo(p.x, p.y);
    context.stroke();
    event.preventDefault();
  }

  function stop() {
    drawing = false;
  }

  canvas.addEventListener("mousedown", start);
  canvas.addEventListener("mousemove", move);
  window.addEventListener("mouseup", stop);
  canvas.addEventListener("touchstart", start, { passive: false });
  canvas.addEventListener("touchmove", move, { passive: false });
  window.addEventListener("touchend", stop);
  els.clearCanvasBtn.addEventListener("click", () => context.clearRect(0, 0, canvas.width, canvas.height));
}

function translateDemo() {
  const text = els.translateText.value.trim();
  if (!text) return;
  const dictionary = [
    ["這張照片", "This photo"],
    ["以前", "old"],
    ["市場", "market"],
    ["拍的", "was taken"],
    ["家庭", "family"],
    ["料理", "cooking"],
    ["台北", "Taipei"],
  ];
  let output = text;
  dictionary.forEach(([zh, en]) => {
    output = output.replaceAll(zh, en);
  });
  els.translationOutput.textContent =
    output === text ? "Translation preview: " + text : output + " (draft translation)";
}

function bindEvents() {
  els.loginForm.addEventListener("submit", handleLoginSubmit);
  els.loginBackBtn.addEventListener("click", () => showLoginStep(state.loginStep - 1));
  els.birthYear.addEventListener("change", updateBirthdayDays);
  els.birthMonth.addEventListener("change", updateBirthdayDays);
  els.loginCrumbs.forEach((crumb) => {
    crumb.addEventListener("click", () => showLoginStep(Number(crumb.dataset.loginStep)));
  });
  els.reLoginBtn.addEventListener("click", () => {
    state.onboarded = false;
    saveState();
    showOnboarding();
  });
  els.audienceToggleBtn.addEventListener("click", () => {
    if (document.body.classList.contains("audience-mode")) {
      showView("gallery");
    } else {
      showAudienceSearch();
      showView("audience");
    }
  });
  els.navButtons.forEach((button) => button.addEventListener("click", () => showView(button.dataset.view)));
  document.querySelectorAll("[data-view-link]").forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.viewLink));
  });
  els.profileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.profile = {
      name: els.elderName.value.trim(),
      language: els.languageMode.value,
      topics: els.profileTopics.value.trim(),
    };
    saveState();
    showView("create");
  });
  els.imageInput.addEventListener("change", (event) => handleImages(event.target.files));
  els.galleryImageInput.addEventListener("change", (event) => {
    pasteImagesToScrapbook(event.target.files);
    event.target.value = "";
  });
  els.storyForm.addEventListener("submit", addStory);
  els.createNextBtn.addEventListener("click", goToNextCreateStep);
  els.createBackBtn.addEventListener("click", () => showCreateStep(state.createStep - 1));
  els.cancelStoryBtn.addEventListener("click", cancelStoryDraft);
  els.createCrumbs.forEach((crumb) => {
    crumb.addEventListener("click", () => {
      const targetStep = Number(crumb.dataset.createStep);
      if (targetStep > 0 && !state.selectedImage) return;
      showCreateStep(targetStep);
    });
  });
  els.recordBtn.addEventListener("click", toggleRecording);
  els.stopRecordBtn.addEventListener("click", stopRecording);
  els.clearAudioBtn.addEventListener("click", clearAudioDraft);
  els.prevPageBtn.addEventListener("click", () => {
    state.scrapbookPage = Math.max(0, state.scrapbookPage - 1);
    renderGallery();
  });
  els.nextPageBtn.addEventListener("click", () => {
    const maxPage = Math.max(0, Math.ceil((state.stories.length + 1) / 2) - 1);
    state.scrapbookPage = Math.min(maxPage, state.scrapbookPage + 1);
    renderGallery();
  });
  els.toggleOnlineBtn.addEventListener("click", () => {
    state.online = !state.online;
    saveState();
    renderLive();
  });
  els.searchInput.addEventListener("input", renderSearch);
  els.audienceBackToSearchBtn.addEventListener("click", showAudienceSearch);
  els.audiencePrevPageBtn.addEventListener("click", () => {
    state.audiencePage = Math.max(0, state.audiencePage - 1);
    renderAudienceBook();
  });
  els.audienceNextPageBtn.addEventListener("click", () => {
    const maxPage = Math.max(0, Math.ceil(state.stories.length / 2) - 1);
    state.audiencePage = Math.min(maxPage, state.audiencePage + 1);
    renderAudienceBook();
  });
  els.chatForm.addEventListener("submit", sendChat);
  els.inviteBtn.addEventListener("click", sendInvite);
  els.endClassBtn.addEventListener("click", () => showView("messages"));
  els.startTimerBtn.addEventListener("click", startTimer);
  els.translateBtn.addEventListener("click", translateDemo);
}

function init() {
  loadState();
  setupBirthdayFields();
  els.loginName.value = state.profile.name || "";
  els.loginGender.value = state.profile.gender || "";
  setBirthdayFields(state.profile.birthday);
  if (els.elderName) els.elderName.value = state.profile.name;
  if (els.languageMode) els.languageMode.value = state.profile.language;
  if (els.profileTopics) els.profileTopics.value = state.profile.topics;
  bindEvents();
  setupCanvas();
  renderAll();
  if (state.onboarded) {
    showApp();
  } else {
    showOnboarding();
  }
}

init();
