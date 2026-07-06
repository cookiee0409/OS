(() => {
  const apps = window.CookieLabApps || [];
  const environmentStorageKey = "cookielab-os-environment";
  const musicStorageKey = "cookielab-os-music";
  const petStorageKey = "cookielab-os-pet";
  const scheduleStorageKey = "cookielab-os-schedules";

  // 상단 헤더 전광판에 표시할 주요 코인 (CoinGecko id 기준).
  const cryptoTickerCoins = [
    { id: "bitcoin", symbol: "BTC", label: "비트코인" },
    { id: "ethereum", symbol: "ETH", label: "이더리움" },
    { id: "solana", symbol: "SOL", label: "솔라나" },
    { id: "ripple", symbol: "XRP", label: "리플" },
    { id: "hyperliquid", symbol: "HYPE", label: "하이퍼리퀴드" },
    { id: "lighter", symbol: "LIT", label: "라이터" },
  ];
  const cryptoPriceEndpoint =
    "https://api.coingecko.com/api/v3/simple/price?ids=" +
    cryptoTickerCoins.map((coin) => coin.id).join(",") +
    "&vs_currencies=usd&include_24hr_change=true";
  const pinnedAppIds = [
    "music-player",
    "crypto-dashboard",
    "ipo-dashboard",
    "trend-collector",
  ];

  const wallpaperOptions = [
    {
      id: "sky",
      name: "Glass Sky",
      description: "파란 하늘빛과 라일락이 섞인 기본 글래스 배경",
    },
    {
      id: "sunset",
      name: "Soft Sunset",
      description: "오렌지, 핑크, 라일락이 부드럽게 이어지는 배경",
    },
    {
      id: "mint",
      name: "Mint Beam",
      description: "민트와 시안, 블루가 맑게 번지는 배경",
    },
    {
      id: "night",
      name: "Violet Night",
      description: "짙은 남색과 보라, 핑크가 흐르는 야간형 배경",
    },
  ];

  const densityOptions = [
    { id: "compact", name: "Compact" },
    { id: "normal", name: "Normal" },
    { id: "spacious", name: "Spacious" },
  ];

  const musicTracks = [
    {
      id: "mint-boot",
      name: "Mint Boot Loop",
      mood: "Bright chiptune",
      bpm: 112,
      wave: "square",
      lead: ["E5", "G5", "B5", "G5", "D5", "E5", "G5", "B4"],
      bass: ["E2", "E2", "B2", "B2", "D3", "D3", "A2", "A2"],
      accent: "mint",
    },
    {
      id: "glass-terminal",
      name: "Glass Terminal",
      mood: "Soft ambient",
      bpm: 78,
      wave: "sine",
      lead: ["A4", "C5", "E5", "C5", "G4", "B4", "D5", "B4"],
      bass: ["A2", "A2", "E3", "E3", "G2", "G2", "D3", "D3"],
      accent: "blue",
    },
    {
      id: "peach-cache",
      name: "Peach Cache",
      mood: "Warm data groove",
      bpm: 96,
      wave: "triangle",
      lead: ["F5", "A5", "C6", "A5", "E5", "G5", "C6", "G5"],
      bass: ["F2", "F2", "C3", "C3", "E2", "E2", "G2", "G2"],
      accent: "yellow",
    },
  ];

  const localAudioTracks = [
    {
      id: "black-box-south-korea",
      name: "South Korea",
      artist: "BLACK BOX",
      license: "Local MP3",
      src: "./assets/audio/BLACK BOX - South Korea.mp3",
    },
    {
      id: "cookielab-loop",
      name: "CookieLab Local Loop",
      artist: "CookieLab OS",
      license: "Original demo loop",
      src: "./assets/audio/cookielab-loop.wav",
    },
    {
      id: "water-afro-pop",
      name: "Water Afro Pop Music",
      artist: "kontraa",
      license: "Local MP3",
      src: "./assets/audio/kontraa-water-afro-pop-music-445661.mp3",
    },
    {
      id: "no-copyright-music",
      name: "No Copyright Music",
      artist: "sigmamusicart",
      license: "Local MP3",
      src: "./assets/audio/sigmamusicart-no-copyright-music-537751.mp3",
    },
    {
      id: "light-world-hope-song",
      name: "빛의 세상으로(희망가)",
      artist: "소향 보컬 버전",
      license: "Local MP3",
      src: "./assets/audio/빛의 세상으로(희망가) 소향 보컬 버전.mp3",
    },
  ];

  const dockSizeOptions = [
    { id: "compact", name: "Compact", label: "좁게", height: 128 },
    { id: "normal", name: "Normal", label: "기본", height: 166 },
    { id: "large", name: "Large", label: "넓게", height: 220 },
  ];

  const defaultEnvironment = {
    wallpaper: "sky",
    grid: true,
    glow: true,
    density: "normal",
  };

  const defaultMusic = {
    mode: "local",
    trackId: "mint-boot",
    localTrackId: "cookielab-loop",
    volume: 0.42,
    localAudioDockSize: "normal",
    // 미니 플레이어(도크) 드래그 위치 / 리사이즈 크기. null 이면 CSS 기본값.
    dockX: null,
    dockY: null,
    dockWidth: null,
    dockHeight: null,
    trackDurations: {},
    playing: false,
    localPlaying: false,
    step: 0,
  };

  function loadEnvironment() {
    try {
      const parsed = JSON.parse(localStorage.getItem(environmentStorageKey) || "{}");
      return {
        ...defaultEnvironment,
        ...parsed,
        wallpaper: wallpaperOptions.some((item) => item.id === parsed.wallpaper)
          ? parsed.wallpaper
          : defaultEnvironment.wallpaper,
        density: densityOptions.some((item) => item.id === parsed.density)
          ? parsed.density
          : defaultEnvironment.density,
      };
    } catch {
      return { ...defaultEnvironment };
    }
  }

  function loadMusicSettings() {
    try {
      const parsed = JSON.parse(localStorage.getItem(musicStorageKey) || "{}");
      const parsedMode = parsed.mode === "soundcloud" ? "local" : parsed.mode;
      const parsedDockSize = parsed.localAudioDockSize || parsed.soundCloudDockSize;
      return {
        ...defaultMusic,
        ...parsed,
        playing: false,
        localPlaying: false,
        step: 0,
        // Synth sequencer 제거로 항상 로컬 오디오 모드.
        mode: "local",
        trackId: musicTracks.some((track) => track.id === parsed.trackId)
          ? parsed.trackId
          : defaultMusic.trackId,
        localTrackId: localAudioTracks.some((track) => track.id === parsed.localTrackId)
          ? parsed.localTrackId
          : defaultMusic.localTrackId,
        volume:
          typeof parsed.volume === "number"
            ? Math.min(1, Math.max(0, parsed.volume))
            : defaultMusic.volume,
        localAudioDockSize: dockSizeOptions.some(
          (item) => item.id === parsedDockSize,
        )
          ? parsedDockSize
          : defaultMusic.localAudioDockSize,
        dockX: typeof parsed.dockX === "number" ? parsed.dockX : null,
        dockY: typeof parsed.dockY === "number" ? parsed.dockY : null,
        dockWidth: typeof parsed.dockWidth === "number" ? parsed.dockWidth : null,
        dockHeight: typeof parsed.dockHeight === "number" ? parsed.dockHeight : null,
      };
    } catch {
      return { ...defaultMusic };
    }
  }

  function loadPetEnabled() {
    return localStorage.getItem(petStorageKey) !== "off";
  }

  function loadSchedules() {
    try {
      const raw = localStorage.getItem(scheduleStorageKey);
      const parsed = raw ? JSON.parse(raw) : null;
      if (!parsed || typeof parsed !== "object") {
        return {};
      }
      // 날짜키 → 일정 배열 형태만 남긴다.
      const clean = {};
      Object.keys(parsed).forEach((key) => {
        if (Array.isArray(parsed[key]) && parsed[key].length) {
          clean[key] = parsed[key]
            .filter((item) => item && typeof item.title === "string")
            .map((item) => ({
              id: String(item.id || `sch-${Math.random().toString(36).slice(2, 9)}`),
              time: typeof item.time === "string" ? item.time : "",
              title: item.title,
            }));
        }
      });
      return clean;
    } catch (error) {
      return {};
    }
  }

  const state = {
    bootPhase: "booting",
    selectedAppId: "",
    windows: {},
    nextZIndex: 10,
    focusedWindowId: "",
    startOpen: false,
    notice: "",
    now: new Date(),
    environment: loadEnvironment(),
    music: loadMusicSettings(),
    pet: {
      enabled: loadPetEnabled(),
    },
    crypto: {
      prices: {},
      status: "loading",
      updatedAt: null,
      // true 가 되기 전까지는 우측에서 슬라이드로 등장하는 최초 진입 연출을 보여준다.
      entered: false,
      // 무한 루프 전환 시각. 재렌더 후에도 마퀴 위치가 이어지도록 기준으로 쓴다.
      animEpoch: 0,
    },
    calendar: {
      viewYear: new Date().getFullYear(),
      viewMonth: new Date().getMonth(),
      selectedDate: "",
    },
    schedules: loadSchedules(),
  };

  const root = document.getElementById("app");
  let initialWindowsOpened = false;
  let activeWindowGesture = null;
  let activeDockGesture = null;
  let suppressDockClick = false;
  const audioEngine = {
    context: null,
    masterGain: null,
    timer: null,
  };
  const audioController = (() => {
    const element = document.createElement("audio");
    element.id = "persistent-audio";
    element.preload = "metadata";
    element.loop = false;
    element.style.display = "none";
    document.body.appendChild(element);

    return {
      element,
      load(track) {
        const nextSrc = new URL(track.src, window.location.href).href;
        if (element.src !== nextSrc) {
          element.src = track.src;
          element.load();
        }
        element.title = track.name;
      },
      play() {
        return element.play();
      },
      pause() {
        element.pause();
      },
      setVolume(value) {
        element.volume = value;
      },
      seek(value) {
        if (Number.isFinite(value) && Number.isFinite(element.duration)) {
          element.currentTime = clamp(value, 0, element.duration);
        }
      },
      get currentTime() {
        return element.currentTime || 0;
      },
      get duration() {
        return Number.isFinite(element.duration) ? element.duration : 0;
      },
    };
  })();
  const petMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const petState = {
    element: null,
    rafId: 0,
    initialized: false,
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    facing: 1,
    speed: 48,
    mode: "idle",
    modeUntil: 0,
    lastTime: 0,
    reducedMotion: petMotionQuery.matches,
  };

  const bootLines = [
    "CookieLab OS boot ROM v0.1.0",
    "",
    "checking project modules...",
    "loading dashboard apps...",
    "mounting research tools...",
    "syncing visual interface...",
    "starting desktop environment...",
    "launching CookieLab OS...",
  ];

  const statusMeta = {
    LIVE: "live",
    PROTOTYPE: "prototype",
    WIP: "wip",
    EXPERIMENT: "experiment",
    ARCHIVED: "archived",
  };

  const appById = (id) => apps.find((app) => app.id === id);
  const pad = (value) => String(value).padStart(2, "0");
  const formatTime = (date = state.now) =>
    `${pad(date.getHours())}:${pad(date.getMinutes())}`;

  const escapeHtml = (value) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  function formatDuration(seconds) {
    if (!Number.isFinite(seconds) || seconds <= 0) {
      return "--:--";
    }

    const rounded = Math.floor(seconds);
    return `${Math.floor(rounded / 60)}:${pad(rounded % 60)}`;
  }

  const desktopFrame = {
    top: 42,
    bottom: 50,
    margin: 12,
  };

  const windowDefaults = {
    welcome: { x: 24, y: 20, width: 560, height: 300 },
    "system-folder": { x: 200, y: 58, width: 620, height: 650 },
    "music-player": { x: 260, y: 52, width: 500, height: 690 },
    "app-detail": { x: 340, y: 126, width: 500, height: 430 },
    scheduler: { x: 360, y: 360, width: 440, height: 326 },
  };

  const weekdayNames = ["일", "월", "화", "수", "목", "금", "토"];

  function dateKey(year, month, day) {
    return `${year}-${pad(month + 1)}-${pad(day)}`;
  }

  function parseDateKey(value) {
    const [year, month, day] = String(value)
      .split("-")
      .map((part) => Number(part));
    if (!year || !month || !day) {
      return null;
    }
    return new Date(year, month - 1, day);
  }

  function todayKey() {
    const now = state.now instanceof Date ? state.now : new Date();
    return dateKey(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function schedulesForDate(key) {
    const list = state.schedules[key] || [];
    return list.slice().sort((a, b) => {
      // 종일(시간 없음) 일정은 아래로, 시간 있는 일정은 시간순.
      if (!a.time && !b.time) return 0;
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });
  }

  function formatKoreanDate(key) {
    const date = parseDateKey(key);
    if (!date) {
      return "";
    }
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${weekdayNames[date.getDay()]})`;
  }

  function formatCryptoPrice(value) {
    if (!Number.isFinite(value)) {
      return "$--";
    }
    if (value >= 1000) {
      return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
    }
    if (value >= 1) {
      return `$${value.toFixed(2)}`;
    }
    return `$${value.toFixed(4)}`;
  }

  function formatCryptoChange(value) {
    if (!Number.isFinite(value)) {
      return "";
    }
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  }

  function cryptoChangeTone(value) {
    if (!Number.isFinite(value) || value === 0) {
      return "flat";
    }
    return value > 0 ? "up" : "down";
  }

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const interactiveControlSelector = "button, a, input, textarea, select";
  const safeExternalUrl = (url = "") => (/^https?:\/\//i.test(url) ? url : "#");
  const isImageIcon = (icon = "") => /^\.\/assets\/icons\/.+\.png$/i.test(icon);

  function IconAsset(icon, className = "app-icon-img", size = 32) {
    const safeIcon = escapeHtml(icon);

    if (isImageIcon(icon)) {
      return `<img class="${escapeHtml(className)}" src="${safeIcon}" alt="" width="${size}" height="${size}" loading="lazy" decoding="async" />`;
    }

    return `<span class="${escapeHtml(className)} icon-text" aria-hidden="true">${safeIcon}</span>`;
  }

  function isCompactWindowMode() {
    return window.matchMedia("(max-width: 860px)").matches;
  }

  function getWindowWorkArea() {
    return {
      width: Math.max(320, window.innerWidth),
      height: Math.max(260, window.innerHeight - desktopFrame.top - desktopFrame.bottom),
    };
  }

  function getWindowId(kind, appId = "") {
    return kind === "app-detail" ? `app-detail:${appId}` : kind;
  }

  function getWindowTitle(windowState) {
    if (windowState.kind === "welcome") {
      return "Welcome to CookieLab OS";
    }

    if (windowState.kind === "scheduler") {
      return "Scheduler";
    }

    const app = appById(windowState.appId);
    return app?.name || "Window";
  }

  function getDefaultWindowBounds(kind) {
    const base = windowDefaults[kind] || windowDefaults["app-detail"];
    const offset = (Object.keys(state.windows).length % 6) * 28;

    // 뮤직 플레이어 창은 미니 플레이어(도크) 바로 위에서 열리도록 배치한다.
    if (kind === "music-player") {
      const dock = document.querySelector(".local-audio-dock");
      if (dock) {
        const rect = dock.getBoundingClientRect();
        return {
          x: Math.round(rect.left),
          // 창 하단이 도크 상단 바로 위에 오도록. window-layer(top: 42px) 기준 보정.
          y: Math.round(rect.top - desktopFrame.top - base.height - 12),
          width: base.width,
          height: base.height,
        };
      }
    }

    // 스케줄러 창은 달력 패널 바로 아래에 나타나도록 배치한다.
    if (kind === "scheduler") {
      const panel = document.querySelector(".calendar-panel");
      if (panel) {
        const rect = panel.getBoundingClientRect();
        const width = Math.min(base.width, Math.round(rect.width));
        return {
          x: Math.round(rect.left),
          y: Math.round(rect.bottom - desktopFrame.top + 14),
          width,
          height: base.height,
        };
      }
    }

    // 프로젝트 앱(app-detail) 창은 "CookieLab Workstation" 패널 바로 아래에서 열고,
    // 여러 개 열면 오른쪽 아래로 계단식(cascade)으로 배치한다.
    if (kind === "app-detail") {
      const panel = document.querySelector(".desktop-identity-panel");
      if (panel) {
        const rect = panel.getBoundingClientRect();
        const openDetailCount = Object.values(state.windows).filter(
          (item) => item.kind === "app-detail",
        ).length;
        const cascade = openDetailCount * 34;
        return {
          // 창 좌표는 window-layer(inset: 42px 0 74px) 기준이므로 top(42px)만큼 보정.
          x: Math.round(rect.left + cascade),
          y: Math.round(rect.bottom - desktopFrame.top + 16 + cascade),
          width: base.width,
          height: base.height,
        };
      }
    }

    return {
      x: base.x + offset,
      y: base.y + offset,
      width: base.width,
      height: base.height,
    };
  }

  function normalizeWindowBounds(windowState) {
    if (!windowState || isCompactWindowMode()) {
      return;
    }

    const area = getWindowWorkArea();
    const margin = desktopFrame.margin;
    const maxWidth = Math.max(300, area.width - margin * 2);
    const maxHeight = Math.max(220, area.height - margin * 2);
    const minWidth = Math.min(320, maxWidth);
    const minHeight = Math.min(220, maxHeight);

    windowState.width = clamp(Number(windowState.width) || minWidth, minWidth, maxWidth);
    windowState.height = clamp(Number(windowState.height) || minHeight, minHeight, maxHeight);
    windowState.x = clamp(
      Number(windowState.x) || margin,
      margin,
      Math.max(margin, area.width - windowState.width - margin),
    );
    windowState.y = clamp(
      Number(windowState.y) || margin,
      margin,
      Math.max(margin, area.height - windowState.height - margin),
    );
  }

  function syncSelectedAppFromFocus() {
    const focusedWindow = state.windows[state.focusedWindowId];
    state.selectedAppId = focusedWindow?.appId || "";
  }

  function topVisibleWindow() {
    return Object.values(state.windows)
      .filter((windowState) => !windowState.minimized)
      .sort((a, b) => b.zIndex - a.zIndex)[0];
  }

  function focusWindowElement(id) {
    requestAnimationFrame(() => {
      const target = document.getElementById(id);
      target?.focus({ preventScroll: true });
      syncWindowDomState();
    });
  }

  function focusStartButton() {
    requestAnimationFrame(() => {
      document.querySelector(".start-button")?.focus({ preventScroll: true });
      syncWindowDomState();
    });
  }

  function blurActiveInteractiveControl() {
    const activeElement = document.activeElement;
    if (
      !activeElement ||
      activeElement === document.body ||
      !activeElement.closest?.(interactiveControlSelector)
    ) {
      return false;
    }

    activeElement.blur();
    return true;
  }

  function syncWindowDomState() {
    document.querySelectorAll(".window-panel[data-window-id]").forEach((element) => {
      const windowState = state.windows[element.dataset.windowId];
      if (!windowState) {
        return;
      }

      element.style.zIndex = windowState.zIndex;
      element.classList.toggle("is-focused", windowState.id === state.focusedWindowId);
      element.classList.toggle("is-maximized", Boolean(windowState.maximized));
    });
  }

  function focusWindow(id, options = {}) {
    const { renderNow = true, restore = true } = options;
    const windowState = state.windows[id];
    if (!windowState) {
      return;
    }

    if (restore) {
      windowState.minimized = false;
    }

    windowState.zIndex = ++state.nextZIndex;
    state.focusedWindowId = id;
    state.notice = "";
    syncSelectedAppFromFocus();

    if (renderNow) {
      render();
      focusWindowElement(id);
      return;
    }

    syncWindowDomState();
  }

  function openWindow(kind, options = {}) {
    const { appId = "", focus = true, renderNow = true } = options;
    const id = getWindowId(kind, appId);
    let windowState = state.windows[id];

    if (!windowState) {
      windowState = {
        id,
        kind,
        appId,
        ...getDefaultWindowBounds(kind),
        zIndex: ++state.nextZIndex,
        minimized: false,
        maximized: isCompactWindowMode(),
        prevBounds: null,
        opening: true,
        liquidGlass: false,
      };
      normalizeWindowBounds(windowState);
      state.windows[id] = windowState;
    } else {
      windowState.minimized = false;
    }

    state.startOpen = false;
    state.notice = "";

    if (focus) {
      focusWindow(id, { renderNow: false });
    }

    if (renderNow) {
      render();
      focusWindowElement(id);
    }

    return windowState;
  }

  function closeWindow(id, options = {}) {
    const { renderNow = true } = options;
    const windowState = state.windows[id];
    if (!windowState) {
      return;
    }

    delete state.windows[id];

    if (state.focusedWindowId === id) {
      const nextWindow = topVisibleWindow();
      state.focusedWindowId = nextWindow?.id || "";
      if (nextWindow) {
        nextWindow.zIndex = ++state.nextZIndex;
      }
    }

    state.notice = "";
    syncSelectedAppFromFocus();

    if (renderNow) {
      render();
      if (state.focusedWindowId) {
        focusWindowElement(state.focusedWindowId);
      } else {
        focusStartButton();
      }
    }
  }

  function minimizeWindow(id) {
    const windowState = state.windows[id];
    if (!windowState) {
      return;
    }

    // 이미 최소화 상태면 원래 크기로 복원(노란 버튼 토글).
    if (windowState.minimized) {
      focusWindow(id);
      return;
    }

    windowState.minimized = true;
    if (state.focusedWindowId === id) {
      const nextWindow = topVisibleWindow();
      state.focusedWindowId = nextWindow?.id || "";
      if (nextWindow) {
        nextWindow.zIndex = ++state.nextZIndex;
      }
    }

    syncSelectedAppFromFocus();
    render();
    if (state.focusedWindowId) {
      focusWindowElement(state.focusedWindowId);
    } else {
      focusStartButton();
    }
  }

  function toggleWindowLiquidGlass(id) {
    const windowState = state.windows[id];
    if (!windowState) {
      return;
    }

    windowState.liquidGlass = !windowState.liquidGlass;
    render();
    focusWindowElement(id);
  }

  function toggleMaximizeWindow(id) {
    const windowState = state.windows[id];
    if (!windowState) {
      return;
    }

    if (isCompactWindowMode()) {
      windowState.maximized = true;
      focusWindow(id);
      return;
    }

    if (windowState.maximized) {
      const previous = windowState.prevBounds;
      if (previous) {
        Object.assign(windowState, previous);
      }
      windowState.prevBounds = null;
      windowState.maximized = false;
      normalizeWindowBounds(windowState);
    } else {
      windowState.prevBounds = {
        x: windowState.x,
        y: windowState.y,
        width: windowState.width,
        height: windowState.height,
      };
      windowState.maximized = true;
    }

    focusWindow(id);
  }

  function ensureInitialWindows() {
    if (initialWindowsOpened) {
      return;
    }

    initialWindowsOpened = true;
    openWindow("welcome", { focus: false, renderNow: false });
    focusWindow("welcome", { renderNow: false });
  }

  function updateClockNodes() {
    document.querySelectorAll("[data-current-time]").forEach((element) => {
      element.textContent = formatTime();
      if (element.tagName === "TIME") {
        element.setAttribute("datetime", state.now.toISOString());
      }
    });
  }

  function saveEnvironment() {
    localStorage.setItem(environmentStorageKey, JSON.stringify(state.environment));
  }

  function saveSchedules() {
    try {
      localStorage.setItem(scheduleStorageKey, JSON.stringify(state.schedules));
    } catch (error) {
      /* 저장 실패는 조용히 무시 (용량 초과 등) */
    }
  }

  async function fetchCryptoPrices() {
    try {
      const response = await fetch(cryptoPriceEndpoint, {
        headers: { accept: "application/json" },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      state.crypto.prices = data;
      state.crypto.status = "live";
      state.crypto.updatedAt = Date.now();
    } catch (error) {
      // 실패해도 마지막 가격은 유지하고, 최초 실패만 error 로 표시한다.
      state.crypto.status = state.crypto.updatedAt ? "live" : "error";
    }
    updateCryptoTickerNodes();
  }

  function updateCryptoTickerNodes() {
    const prices = state.crypto.prices || {};
    cryptoTickerCoins.forEach((coin) => {
      const entry = prices[coin.id];
      const priceText = entry ? formatCryptoPrice(entry.usd) : "$--";
      const changeValue = entry ? entry.usd_24h_change : NaN;
      const changeText = formatCryptoChange(changeValue);
      const tone = cryptoChangeTone(changeValue);

      document
        .querySelectorAll(`[data-crypto-price="${coin.id}"]`)
        .forEach((node) => {
          node.textContent = priceText;
        });
      document
        .querySelectorAll(`[data-crypto-change="${coin.id}"]`)
        .forEach((node) => {
          node.textContent = changeText;
          node.dataset.tone = tone;
        });
    });

    document.querySelectorAll(".crypto-ticker").forEach((node) => {
      node.dataset.status = state.crypto.status;
    });
  }

  function saveMusicSettings() {
    localStorage.setItem(
      musicStorageKey,
      JSON.stringify({
        trackId: state.music.trackId,
        localTrackId: state.music.localTrackId,
        volume: state.music.volume,
        mode: state.music.mode,
        localAudioDockSize: state.music.localAudioDockSize,
        dockX: state.music.dockX,
        dockY: state.music.dockY,
        dockWidth: state.music.dockWidth,
        dockHeight: state.music.dockHeight,
      }),
    );
  }

  function applyEnvironment() {
  }

  function selectedMusicTrack() {
    return musicTracks.find((track) => track.id === state.music.trackId) || musicTracks[0];
  }

  function selectedLocalAudioTrack() {
    return (
      localAudioTracks.find((track) => track.id === state.music.localTrackId) ||
      localAudioTracks[0]
    );
  }

  function selectedDockSize() {
    return (
      dockSizeOptions.find((item) => item.id === state.music.localAudioDockSize) ||
      dockSizeOptions[1]
    );
  }

  function noteToFrequency(note) {
    const match = /^([A-G])(#?)(\d)$/.exec(note);
    if (!match) {
      return 440;
    }

    const semitones = {
      C: 0,
      "C#": 1,
      D: 2,
      "D#": 3,
      E: 4,
      F: 5,
      "F#": 6,
      G: 7,
      "G#": 8,
      A: 9,
      "A#": 10,
      B: 11,
    };
    const pitch = `${match[1]}${match[2]}`;
    const octave = Number(match[3]);
    const midi = (octave + 1) * 12 + semitones[pitch];

    return 440 * 2 ** ((midi - 69) / 12);
  }

  async function ensureAudioEngine() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      showNotice("This browser does not support Web Audio playback.");
      return null;
    }

    if (!audioEngine.context) {
      audioEngine.context = new AudioContextClass();
      audioEngine.masterGain = audioEngine.context.createGain();
      audioEngine.masterGain.gain.value = state.music.volume;
      audioEngine.masterGain.connect(audioEngine.context.destination);
    }

    if (audioEngine.context.state === "suspended") {
      await audioEngine.context.resume();
    }

    return audioEngine.context;
  }

  function playTone(note, startAt, duration, gainValue, wave) {
    const context = audioEngine.context;
    if (!context || !audioEngine.masterGain) {
      return;
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const frequency = noteToFrequency(note);
    const safeGain = Math.max(0.0001, gainValue);

    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(frequency, startAt);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(safeGain, startAt + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

    oscillator.connect(gain);
    gain.connect(audioEngine.masterGain);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.02);
  }

  function playClickPercussion(startAt) {
    const context = audioEngine.context;
    if (!context || !audioEngine.masterGain) {
      return;
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(110, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(48, startAt + 0.11);
    gain.gain.setValueAtTime(0.12, startAt);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.12);

    oscillator.connect(gain);
    gain.connect(audioEngine.masterGain);
    oscillator.start(startAt);
    oscillator.stop(startAt + 0.14);
  }

  function scheduleMusicStep() {
    if (!state.music.playing || !audioEngine.context) {
      return;
    }

    const track = selectedMusicTrack();
    const stepDuration = 60 / track.bpm / 2;
    const startAt = audioEngine.context.currentTime + 0.015;
    const leadNote = track.lead[state.music.step % track.lead.length];
    const bassNote = track.bass[Math.floor(state.music.step / 2) % track.bass.length];

    playTone(leadNote, startAt, stepDuration * 0.72, 0.1, track.wave);

    if (state.music.step % 2 === 0) {
      playTone(bassNote, startAt, stepDuration * 1.35, 0.075, "sawtooth");
    }

    if (state.music.step % 4 === 0) {
      playClickPercussion(startAt);
    }

    state.music.step = (state.music.step + 1) % 32;
  }

  async function startMusic() {
    const context = await ensureAudioEngine();
    if (!context) {
      return;
    }

    pauseLocalAudioElement();
    const track = selectedMusicTrack();
    const stepDurationMs = (60 / track.bpm / 2) * 1000;

    clearInterval(audioEngine.timer);
    state.music.mode = "synth";
    state.music.playing = true;
    state.music.localPlaying = false;
    saveMusicSettings();
    scheduleMusicStep();
    audioEngine.timer = window.setInterval(scheduleMusicStep, stepDurationMs);
    render();
  }

  function stopMusic() {
    clearInterval(audioEngine.timer);
    audioEngine.timer = null;
    state.music.playing = false;
    render();
  }

  function updateLocalAudioProgressNodes() {
    const track = selectedLocalAudioTrack();
    const duration = audioController.duration || state.music.trackDurations[track.id] || 0;
    const currentTime = audioController.currentTime;
    const currentLabel = formatDuration(currentTime);
    const durationLabel = formatDuration(duration);
    const combinedLabel = `${currentLabel} / ${durationLabel}`;

    document.querySelectorAll("[data-local-audio-current]").forEach((element) => {
      element.textContent = currentLabel;
    });
    document.querySelectorAll("[data-local-audio-duration]").forEach((element) => {
      element.textContent = durationLabel;
    });
    document.querySelectorAll("[data-local-audio-time]").forEach((element) => {
      element.textContent = combinedLabel;
    });
    document.querySelectorAll(".local-audio-progress").forEach((element) => {
      element.max = duration || 0;
      if (document.activeElement !== element) {
        element.value = currentTime;
      }
    });
    document
      .querySelectorAll(`[data-local-track-duration="${track.id}"]`)
      .forEach((element) => {
        element.textContent = durationLabel;
      });
  }

  function pauseLocalAudioElement() {
    audioController.pause();
  }

  function playLocalAudioElement() {
    const audioTrack = selectedLocalAudioTrack();
    audioController.load(audioTrack);
    audioController.setVolume(state.music.volume);
    audioController.play().catch(() => {
      state.music.localPlaying = false;
      render();
      focusMusicPlayer();
    });
  }

  function previousMusicTrack() {
    const currentIndex = musicTracks.findIndex(
      (track) => track.id === state.music.trackId,
    );
    const previousTrack =
      musicTracks[(currentIndex - 1 + musicTracks.length) % musicTracks.length];
    selectMusicTrack(previousTrack.id);
  }

  function selectMusicTrack(id) {
    if (!musicTracks.some((track) => track.id === id)) {
      return;
    }

    const wasPlaying = state.music.playing;
    state.music.mode = "synth";
    state.music.trackId = id;
    state.music.step = 0;
    state.music.localPlaying = false;
    pauseLocalAudioElement();
    saveMusicSettings();

    if (wasPlaying) {
      clearInterval(audioEngine.timer);
      audioEngine.timer = null;
      startMusic();
      return;
    }

    render();
    focusMusicPlayer();
  }

  function setMusicVolume(value) {
    const volume = Math.min(1, Math.max(0, Number(value)));
    if (Number.isNaN(volume)) {
      return;
    }

    state.music.volume = volume;
    if (audioEngine.masterGain) {
      audioEngine.masterGain.gain.setValueAtTime(
        volume,
        audioEngine.context.currentTime,
      );
    }

    audioController.setVolume(volume);

    saveMusicSettings();
    document.querySelectorAll("[data-volume-label]").forEach((volumeLabel) => {
      volumeLabel.textContent = `${Math.round(volume * 100)}%`;
    });
  }

  function setMusicMode(mode) {
    if (!["local", "synth"].includes(mode)) {
      return;
    }

    if (mode === state.music.mode) {
      focusMusicPlayer();
      return;
    }

    if (mode === "local") {
      clearInterval(audioEngine.timer);
      audioEngine.timer = null;
      state.music.playing = false;
      state.music.localPlaying = false;
    } else {
      pauseLocalAudioElement();
      state.music.localPlaying = false;
    }

    state.music.mode = mode;
    saveMusicSettings();
    render();
    focusMusicPlayer();
  }

  function selectLocalAudioTrack(id, options = {}) {
    if (!localAudioTracks.some((track) => track.id === id)) {
      return;
    }

    const { autoplay = state.music.localPlaying, focus = true } = options;
    clearInterval(audioEngine.timer);
    audioEngine.timer = null;
    state.music.playing = false;
    state.music.mode = "local";
    state.music.localTrackId = id;
    state.music.localPlaying = autoplay;
    saveMusicSettings();
    audioController.load(selectedLocalAudioTrack());
    render();
    if (focus) {
      focusMusicPlayer();
    }
    updateLocalAudioProgressNodes();
    if (autoplay) {
      playLocalAudioElement();
    }
  }

  function previousLocalAudioTrack(options = {}) {
    const currentIndex = localAudioTracks.findIndex(
      (track) => track.id === state.music.localTrackId,
    );
    const previousTrack =
      localAudioTracks[
        (currentIndex - 1 + localAudioTracks.length) % localAudioTracks.length
      ];
    selectLocalAudioTrack(previousTrack.id, options);
  }

  function nextLocalAudioTrack(options = {}) {
    const currentIndex = localAudioTracks.findIndex(
      (track) => track.id === state.music.localTrackId,
    );
    const nextTrack = localAudioTracks[(currentIndex + 1) % localAudioTracks.length];
    selectLocalAudioTrack(nextTrack.id, options);
  }

  function toggleLocalAudioPlayback() {
    if (state.music.localPlaying) {
      pauseLocalAudioElement();
      state.music.localPlaying = false;
      saveMusicSettings();
      render();
      focusMusicPlayer();
      return;
    }

    clearInterval(audioEngine.timer);
    audioEngine.timer = null;
    state.music.mode = "local";
    state.music.playing = false;
    state.music.localPlaying = true;
    saveMusicSettings();
    audioController.load(selectedLocalAudioTrack());
    render();
    focusMusicPlayer();
    playLocalAudioElement();
  }

  function setLocalAudioDockSize(size) {
    if (!dockSizeOptions.some((item) => item.id === size)) {
      return;
    }

    state.music.localAudioDockSize = size;
    saveMusicSettings();
    render();
    focusMusicPlayer();
  }

  function setLocalAudioProgress(value) {
    const seconds = Number(value);
    if (Number.isNaN(seconds)) {
      return;
    }

    audioController.seek(seconds);
    updateLocalAudioProgressNodes();
  }

  function initializeLocalAudioController() {
    audioController.load(selectedLocalAudioTrack());
    audioController.setVolume(state.music.volume);
    updateLocalAudioProgressNodes();
  }

  function syncLocalAudioPlaybackState(isPlaying) {
    if (state.music.localPlaying === isPlaying) {
      return;
    }

    state.music.localPlaying = isPlaying;
    if (isPlaying) {
      state.music.mode = "local";
      state.music.playing = false;
    }
    render();
    updateLocalAudioProgressNodes();
  }

  audioController.element.addEventListener("loadedmetadata", () => {
    const track = selectedLocalAudioTrack();
    state.music.trackDurations[track.id] = audioController.duration;
    updateLocalAudioProgressNodes();
  });

  audioController.element.addEventListener("durationchange", updateLocalAudioProgressNodes);
  audioController.element.addEventListener("timeupdate", updateLocalAudioProgressNodes);
  audioController.element.addEventListener("play", () => {
    syncLocalAudioPlaybackState(true);
  });
  audioController.element.addEventListener("pause", () => {
    if (!audioController.element.ended) {
      syncLocalAudioPlaybackState(false);
    }
  });
  audioController.element.addEventListener("ended", () => {
    nextLocalAudioTrack({ autoplay: true, focus: false });
  });

  const randomBetween = (min, max) => min + Math.random() * (max - min);

  function getPetActivityArea() {
    const petSize = 64;
    const minX = Math.round(window.innerWidth * 0.55);
    const maxX = window.innerWidth - petSize - 24;
    const minY = Math.round(window.innerHeight * 0.6);
    const maxY = window.innerHeight - petSize - 104;

    return {
      minX: Math.min(minX, maxX),
      maxX: Math.max(minX, maxX),
      minY: Math.min(minY, maxY),
      maxY: Math.max(minY, maxY),
    };
  }

  function updateDesktopPetElement() {
    const element = petState.element;
    if (!element) {
      return;
    }

    element.dataset.mode = petState.mode;
    element.style.transform = `translate3d(${petState.x}px, ${petState.y}px, 0) scaleX(${petState.facing})`;
  }

  function clampDesktopPetToArea() {
    const area = getPetActivityArea();
    petState.x = clamp(petState.x, area.minX, area.maxX);
    petState.y = clamp(petState.y, area.minY, area.maxY);
    petState.targetX = clamp(petState.targetX, area.minX, area.maxX);
    petState.targetY = clamp(petState.targetY, area.minY, area.maxY);
    updateDesktopPetElement();
  }

  function setDesktopPetMode(mode, now = performance.now()) {
    const area = getPetActivityArea();
    petState.mode = mode;

    if (mode === "walk") {
      petState.targetX = Math.round(randomBetween(area.minX, area.maxX));
      petState.targetY = Math.round(randomBetween(area.minY, area.maxY));
      petState.facing = petState.targetX >= petState.x ? 1 : -1;
      petState.speed = randomBetween(40, 60);
      petState.modeUntil = now + 12000;
    } else if (mode === "sit") {
      petState.modeUntil = now + randomBetween(4000, 8000);
    } else if (mode === "sleep") {
      petState.modeUntil = now + randomBetween(8000, 15000);
    } else if (mode === "react") {
      petState.modeUntil = now + 800;
    } else {
      petState.mode = "idle";
      petState.modeUntil = now + randomBetween(2000, 5000);
    }

    updateDesktopPetElement();
  }

  function chooseNextDesktopPetMode(now = performance.now()) {
    if (petState.reducedMotion) {
      setDesktopPetMode("sit", now);
      return;
    }

    const roll = Math.random();
    if (roll < 0.6) {
      setDesktopPetMode("walk", now);
    } else if (roll < 0.85) {
      setDesktopPetMode("sit", now);
    } else {
      setDesktopPetMode("sleep", now);
    }
  }

  function tickDesktopPet(now) {
    if (!state.pet.enabled || document.hidden || petState.reducedMotion) {
      petState.rafId = 0;
      return;
    }

    const elapsed = Math.min(0.08, (now - petState.lastTime) / 1000 || 0);
    petState.lastTime = now;

    if (petState.mode === "walk") {
      const dx = petState.targetX - petState.x;
      const dy = petState.targetY - petState.y;
      const distance = Math.hypot(dx, dy);
      const step = petState.speed * elapsed;

      if (distance <= Math.max(1, step) || now >= petState.modeUntil) {
        petState.x = petState.targetX;
        petState.y = petState.targetY;
        setDesktopPetMode("idle", now);
      } else {
        petState.x += (dx / distance) * step;
        petState.y += (dy / distance) * step;
        petState.facing = dx >= 0 ? 1 : -1;
        updateDesktopPetElement();
      }
    } else if (now >= petState.modeUntil) {
      chooseNextDesktopPetMode(now);
    } else {
      updateDesktopPetElement();
    }

    petState.rafId = requestAnimationFrame(tickDesktopPet);
  }

  function startDesktopPetLoop() {
    if (petState.rafId || petState.reducedMotion || document.hidden || !state.pet.enabled) {
      return;
    }

    petState.lastTime = performance.now();
    petState.rafId = requestAnimationFrame(tickDesktopPet);
  }

  function stopDesktopPetLoop() {
    if (!petState.rafId) {
      return;
    }

    cancelAnimationFrame(petState.rafId);
    petState.rafId = 0;
  }

  function placeDesktopPetAtRest() {
    const area = getPetActivityArea();
    petState.x = area.maxX;
    petState.y = area.maxY;
    petState.targetX = petState.x;
    petState.targetY = petState.y;
    petState.facing = -1;
    petState.mode = "sit";
    petState.modeUntil = Number.POSITIVE_INFINITY;
    updateDesktopPetElement();
  }

  function syncDesktopPet() {
    if (!petState.element) {
      return;
    }

    petState.element.hidden = !state.pet.enabled;
    if (!state.pet.enabled || document.hidden) {
      stopDesktopPetLoop();
      return;
    }

    if (petState.reducedMotion) {
      stopDesktopPetLoop();
      placeDesktopPetAtRest();
      return;
    }

    clampDesktopPetToArea();
    startDesktopPetLoop();
  }

  function burstDesktopPetParticle() {
    if (!petState.element) {
      return;
    }

    const particle = document.createElement("span");
    particle.className = "desktop-pet-particle";
    particle.textContent = Math.random() > 0.5 ? "♥" : "✦";
    petState.element.appendChild(particle);
    particle.addEventListener("animationend", () => particle.remove(), { once: true });
  }

  function reactDesktopPet() {
    setDesktopPetMode("react");
    burstDesktopPetParticle();
    syncDesktopPet();
  }

  function initializeDesktopPet() {
    if (petState.initialized) {
      return;
    }

    const element = document.createElement("div");
    element.id = "desktop-pet";
    element.className = "desktop-pet";
    element.setAttribute("aria-hidden", "true");
    element.innerHTML = `
      <div class="desktop-pet-inner">
        <img src="./assets/pet/cat_3d.png" alt="" width="64" height="64" draggable="false" />
        <span class="desktop-pet-fallback">🐈</span>
        <span class="desktop-pet-zzz">Zzz</span>
      </div>
    `;
    element.querySelector("img")?.addEventListener("error", () => {
      element.classList.add("image-missing");
    });
    element.addEventListener("click", reactDesktopPet);
    document.body.appendChild(element);

    petState.element = element;
    petState.initialized = true;
    placeDesktopPetAtRest();
    setDesktopPetMode(petState.reducedMotion ? "sit" : "idle");
    syncDesktopPet();
  }

  function handleDesktopPetResize() {
    if (!petState.element || !state.pet.enabled) {
      return;
    }

    if (petState.reducedMotion) {
      placeDesktopPetAtRest();
      return;
    }

    clampDesktopPetToArea();
  }

  function savePetSettings() {
    localStorage.setItem(petStorageKey, state.pet.enabled ? "on" : "off");
  }

  function toggleDesktopPet() {
    state.pet.enabled = !state.pet.enabled;
    savePetSettings();
    syncDesktopPet();
    render();
    focusSystemFolder();
  }

  function handleDesktopPetMotionPreference(event) {
    petState.reducedMotion = event.matches;
    syncDesktopPet();
  }

  if (petMotionQuery.addEventListener) {
    petMotionQuery.addEventListener("change", handleDesktopPetMotionPreference);
  } else {
    petMotionQuery.addListener(handleDesktopPetMotionPreference);
  }

  function StatusBadge(status) {
    const tone = statusMeta[status] || "archived";
    return `<span class="status-badge status-${tone}">${escapeHtml(status)}</span>`;
  }

  function WindowPanel({
    id,
    title,
    className = "",
    children = "",
    actions = "",
    closeAction = "",
    focusable = false,
    windowState = null,
  }) {
    const titleId = `${id}-title`;
    const windowId = windowState?.id || id;
    const isFocused = windowState?.id === state.focusedWindowId;
    const windowClasses = [
      "window-panel",
      className,
      windowState?.minimized ? "is-minimized" : "",
      windowState?.maximized ? "is-maximized" : "",
      windowState?.opening ? "is-opening" : "",
      isFocused ? "is-focused" : "",
      windowState?.liquidGlass ? "is-liquid-glass" : "",
    ]
      .filter(Boolean)
      .join(" ");
    const windowStyle = windowState
      ? `left: ${windowState.x}px; top: ${windowState.y}px; width: ${windowState.width}px; height: ${windowState.height}px; z-index: ${windowState.zIndex};`
      : "";
    const maximizeDisabled = Boolean(windowState && isCompactWindowMode());
    const maximizeLabel = windowState?.maximized ? "복원" : "최대화";
    const trafficControls = windowState
      ? `
          <button
            type="button"
            class="control-dot control-danger"
            data-action="window-close"
            data-window-id="${escapeHtml(windowId)}"
            aria-label="${escapeHtml(title)} 닫기"
            title="닫기"
          ></button>
          <button
            type="button"
            class="control-dot control-warning"
            data-action="window-minimize"
            data-window-id="${escapeHtml(windowId)}"
            aria-label="${escapeHtml(title)} 최소화"
            title="최소화"
          ></button>
          <button
            type="button"
            class="control-dot control-success${maximizeDisabled ? " is-disabled" : ""}"
            data-action="window-maximize"
            data-window-id="${escapeHtml(windowId)}"
            aria-label="${escapeHtml(title)} ${maximizeLabel}"
            aria-disabled="${maximizeDisabled ? "true" : "false"}"
            title="${maximizeLabel}"
            ${maximizeDisabled ? "disabled" : ""}
          ></button>
        `
      : `
          <span class="control-dot control-danger"></span>
          <span class="control-dot control-warning"></span>
          <span class="control-dot control-success"></span>
        `;
    const closeButton = !windowState && closeAction
      ? `<button class="window-close" type="button" data-action="${closeAction}" aria-label="${escapeHtml(title)} 닫기">×</button>`
      : "";
    const glassOn = Boolean(windowState?.liquidGlass);
    const glassToggle = windowState
      ? `<button
            type="button"
            class="window-glass-toggle${glassOn ? " is-on" : ""}"
            data-action="toggle-window-liquid-glass"
            data-window-id="${escapeHtml(windowId)}"
            aria-pressed="${glassOn ? "true" : "false"}"
            aria-label="${escapeHtml(title)} Liquid Glass ${glassOn ? "끄기" : "켜기"}"
            title="Liquid Glass ${glassOn ? "끄기" : "켜기"}"
          >✎</button>`
      : "";

    return `
      <section
        id="${id}"
        class="${windowClasses}"
        aria-labelledby="${titleId}"
        ${windowState ? `data-window-id="${escapeHtml(windowId)}"` : ""}
        ${windowStyle ? `style="${windowStyle}"` : ""}
        ${focusable || windowState ? 'tabindex="-1"' : ""}
      >
        <header class="window-titlebar">
          <span class="window-controls">
            ${trafficControls}
          </span>
          <h2 id="${titleId}" class="window-title">${escapeHtml(title)}</h2>
          ${glassToggle}
          ${closeButton}
        </header>
        <div class="window-body">
          ${children}
        </div>
        ${actions ? `<footer class="window-actions">${actions}</footer>` : ""}
        ${
          windowState
            ? `<span class="window-resize-handle window-resize-handle-east" data-window-resize-handle data-resize-edge="e" aria-hidden="true"></span>
               <span class="window-resize-handle window-resize-handle-south" data-window-resize-handle data-resize-edge="s" aria-hidden="true"></span>
               <span class="window-resize-handle window-resize-handle-corner" data-window-resize-handle data-resize-edge="se" aria-hidden="true"></span>`
            : ""
        }
      </section>
    `;
  }

  function BootScreen() {
    const phaseClass = state.bootPhase === "hiding" ? " is-hiding" : "";
    const lines = bootLines
      .map(
        (line, index) => `
          <div class="boot-line" style="--line-index: ${index}">
            ${line ? escapeHtml(line) : "&nbsp;"}
          </div>
        `,
      )
      .join("");

    return `
      <section class="boot-screen${phaseClass}" role="status" aria-label="CookieLab OS boot screen">
        <div class="boot-terminal">
          <div class="boot-terminal-glow" aria-hidden="true"></div>
          ${lines}
          <div class="boot-prompt">root@cookielab:~$ <span class="boot-cursor">_</span></div>
        </div>
      </section>
    `;
  }

  function CryptoTicker() {
    const prices = state.crypto.prices || {};
    const buildCoin = (coin) => {
      const entry = prices[coin.id];
      const priceText = entry ? formatCryptoPrice(entry.usd) : "$--";
      const changeValue = entry ? entry.usd_24h_change : NaN;
      const changeText = formatCryptoChange(changeValue);
      const tone = cryptoChangeTone(changeValue);
      return `
        <span class="crypto-coin" title="${escapeHtml(coin.label)}">
          <span class="crypto-coin-symbol">${escapeHtml(coin.symbol)}</span>
          <span class="crypto-coin-price" data-crypto-price="${escapeHtml(coin.id)}">${escapeHtml(priceText)}</span>
          <span class="crypto-coin-change" data-crypto-change="${escapeHtml(coin.id)}" data-tone="${tone}">${escapeHtml(changeText)}</span>
        </span>
      `;
    };
    // 끊김 없는 루프를 위해 동일 목록을 두 번 반복한다.
    const items = cryptoTickerCoins.map(buildCoin).join("");

    // 최초 진입 시에는 우측 화면 밖에서 슬라이드로 등장하고,
    // 등장이 끝난 뒤부터 무한 루프로 전환한다(재렌더에도 위상 유지를 위해 음수 딜레이 사용).
    const trackClass = state.crypto.entered
      ? "crypto-ticker-track is-looping"
      : "crypto-ticker-track is-entering";
    const trackStyle = state.crypto.entered
      ? ` style="animation-delay: -${((Date.now() - state.crypto.animEpoch) / 1000).toFixed(2)}s"`
      : "";

    return `
      <div class="crypto-ticker" data-status="${state.crypto.status}" aria-label="주요 코인 실시간 시세">
        <div class="${trackClass}"${trackStyle}>
          ${items}${items}
        </div>
      </div>
    `;
  }

  function TopMenuBar() {
    return `
      <header class="top-menu-bar">
        <nav class="top-menu-left" aria-label="OS menu">
          <span class="status-light" aria-hidden="true"></span>
          <strong class="os-brand">CookieLab OS</strong>
          <span class="top-menu-item">File</span>
          <span class="top-menu-item">Apps</span>
          <span class="top-menu-item">Projects</span>
          <span class="top-menu-item">Tools</span>
          <span class="top-menu-item">View</span>
          <span class="top-menu-item">Help</span>
        </nav>
        ${CryptoTicker()}
        <div class="top-menu-right" aria-label="System status">
          <span class="network-state">NETWORK: ONLINE</span>
          <span class="data-mode">DATA MODE: SAMPLE</span>
          <time data-current-time datetime="${state.now.toISOString()}">${formatTime()}</time>
          <button
            class="settings-button"
            type="button"
            data-action="select-app"
            data-app-id="system-folder"
            aria-label="System Folder 열기"
            title="System Folder"
          >◌</button>
        </div>
      </header>
    `;
  }

  function appHasOpenWindow(appId) {
    return Object.values(state.windows).some((win) => win.appId === appId);
  }

  function AppIcon(app, variant = "grid") {
    // 창이 열려 있는 모든 앱 아이콘에 선택 표시(마지막 클릭만이 아니라).
    const selected = appHasOpenWindow(app.id) ? " is-selected" : "";
    const systemIcon = app.system ? " is-system-icon" : "";
    const tone = statusMeta[app.status] || "archived";

    if (variant === "list") {
      return `
        <button
          class="app-icon app-icon-list${selected}${systemIcon}"
          type="button"
          data-action="select-app"
          data-app-id="${escapeHtml(app.id)}"
          aria-label="${escapeHtml(app.name)} 소개 창 열기"
          title="${escapeHtml(app.name)}"
        >
          <span class="app-icon-status status-${tone}" aria-label="${escapeHtml(app.status)}"></span>
          <span class="app-icon-visual" aria-hidden="true">${IconAsset(app.icon)}</span>
          <span class="app-icon-list-text">
            <span class="app-icon-name">${escapeHtml(app.name)}</span>
            <span class="app-icon-desc">${escapeHtml(app.description || app.category || "")}</span>
          </span>
        </button>
      `;
    }

    return `
      <button
        class="app-icon${selected}${systemIcon}"
        type="button"
        data-action="select-app"
        data-app-id="${escapeHtml(app.id)}"
        aria-label="${escapeHtml(app.name)} 소개 창 열기"
        title="${escapeHtml(app.name)}"
      >
        <span class="app-icon-status status-${tone}" aria-label="${escapeHtml(app.status)}"></span>
        <span class="app-icon-visual" aria-hidden="true">${IconAsset(app.icon)}</span>
        <span class="app-icon-name">${escapeHtml(app.name)}</span>
      </button>
    `;
  }

  function DesktopIconColumn({ id, title, subtitle, side, apps: columnApps }) {
    // 우측(프로젝트) 컬럼은 아이콘+설명 리스트형, 좌측은 기존 그리드형.
    const isList = side === "right";
    const icons = columnApps
      .map((app) => AppIcon(app, isList ? "list" : "grid"))
      .join("");

    return `
      <section class="desktop-icons desktop-icons-${escapeHtml(side)}" aria-labelledby="${escapeHtml(id)}-title">
        <div class="desktop-icons-header">
          <h1 id="${escapeHtml(id)}-title">${escapeHtml(title)}</h1>
          <span>${escapeHtml(subtitle)}</span>
        </div>
        <div id="${escapeHtml(id)}-grid" class="app-grid${isList ? " app-list" : ""}">
          ${icons}
        </div>
      </section>
    `;
  }

  function DesktopIdentityPanel() {
    const { viewYear, viewMonth } = state.calendar;
    const today = todayKey();
    const selected = state.calendar.selectedDate;

    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const startDow = firstOfMonth.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    // 이번 달을 담는 데 필요한 주 수(4~6)만큼만 칸을 만든다.
    const totalCells = Math.ceil((startDow + daysInMonth) / 7) * 7;
    // 이번 달 1일이 속한 주의 일요일부터 시작.
    const gridStart = new Date(viewYear, viewMonth, 1 - startDow);

    const weekdayHeader = weekdayNames
      .map((name, index) => {
        const tone =
          index === 0 ? " is-sunday" : index === 6 ? " is-saturday" : "";
        return `<span class="calendar-weekday${tone}">${name}</span>`;
      })
      .join("");

    const cells = Array.from({ length: totalCells }, (_, i) => {
      const day = new Date(gridStart);
      day.setDate(gridStart.getDate() + i);
      const key = dateKey(day.getFullYear(), day.getMonth(), day.getDate());
      const isOutside = day.getMonth() !== viewMonth;
      const isToday = key === today;
      const isSelected = key === selected;
      const dow = day.getDay();
      const count = (state.schedules[key] || []).length;
      const weekendClass =
        dow === 0 ? " is-sunday" : dow === 6 ? " is-saturday" : "";
      const classes = [
        "calendar-cell",
        isOutside ? "is-outside" : "",
        isToday ? "is-today" : "",
        isSelected ? "is-selected" : "",
        count ? "has-schedule" : "",
        weekendClass.trim(),
      ]
        .filter(Boolean)
        .join(" ");
      const badge = count
        ? `<span class="calendar-cell-count">일정 ${count}건</span>`
        : "";
      return `
        <button
          type="button"
          class="${classes}"
          data-action="open-scheduler"
          data-date="${key}"
          aria-label="${formatKoreanDate(key)}, 일정 ${count}건"
          aria-pressed="${isSelected ? "true" : "false"}"
        >
          <span class="calendar-cell-date">${day.getDate()}</span>
          ${badge}
        </button>
      `;
    }).join("");

    const monthLabel = `${viewYear}.${pad(viewMonth + 1)}`;

    return `
      <section class="desktop-identity-panel calendar-panel" aria-label="일정 달력">
        <div class="calendar-head">
          <div class="identity-stamp">
            <span>CookieLab Workstation</span>
            <strong>CL-07</strong>
          </div>
          <div class="calendar-nav" role="group" aria-label="달력 이동">
            <button type="button" class="calendar-nav-button" data-action="calendar-prev-month" aria-label="이전 달">‹</button>
            <span class="calendar-title" aria-live="polite">${monthLabel}</span>
            <button type="button" class="calendar-nav-button" data-action="calendar-next-month" aria-label="다음 달">›</button>
            <button type="button" class="calendar-today-button" data-action="calendar-today">오늘</button>
          </div>
        </div>
        <div class="calendar-weekdays" aria-hidden="true">${weekdayHeader}</div>
        <div class="calendar-grid">${cells}</div>
      </section>
    `;
  }

  function WelcomeWindow(windowState) {
    return WindowPanel({
      id: windowState.id,
      title: "Welcome to CookieLab OS",
      className: "welcome-window",
      windowState,
      children: `
        <p class="lead-text">
          여러 분석 도구와 실험 프로젝트를 하나의 OS 환경에서 실행합니다.
        </p>
        <p>
          Crypto, Stocks, IPO, News, Trend, Visual Tools, 그리고 실험적인 인터랙티브 프로젝트들을 선택해 실행하세요.
        </p>
      `,
    });
  }

  function SystemFolderWindow(app, windowState) {
    const environment = state.environment;
    const wallpaperButtons = wallpaperOptions
      .map((option) => {
        const active = environment.wallpaper === option.id ? " is-active" : "";
        return `
          <button
            class="wallpaper-option wallpaper-${escapeHtml(option.id)}${active}"
            type="button"
            data-action="set-wallpaper"
            data-wallpaper="${escapeHtml(option.id)}"
            aria-pressed="${active ? "true" : "false"}"
          >
            <span class="wallpaper-preview" aria-hidden="true"></span>
            <span>
              <strong>${escapeHtml(option.name)}</strong>
              <small>${escapeHtml(option.description)}</small>
            </span>
          </button>
        `;
      })
      .join("");

    const densityButtons = densityOptions
      .map((option) => {
        const active = environment.density === option.id ? " is-active" : "";
        return `
          <button
            class="segmented-option${active}"
            type="button"
            data-action="set-density"
            data-density="${escapeHtml(option.id)}"
            aria-pressed="${active ? "true" : "false"}"
          >
            ${escapeHtml(option.name)}
          </button>
        `;
      })
      .join("");

    return WindowPanel({
      id: windowState.id,
      title: app.name,
      className: "system-folder-window",
      closeAction: "close-detail",
      focusable: true,
      windowState,
      children: `
        <div class="folder-header">
          <span class="folder-icon" aria-hidden="true">${IconAsset(app.icon, "folder-icon-img", 36)}</span>
          <div>
            <p class="detail-kicker">${escapeHtml(app.category)}</p>
            <p class="folder-copy">
              배경화면과 화면 효과를 조정합니다. 변경 사항은 이 브라우저에 저장됩니다.
            </p>
          </div>
        </div>
        <section class="settings-section" aria-labelledby="wallpaper-settings-title">
          <h3 id="wallpaper-settings-title">Wallpaper</h3>
          <div class="wallpaper-grid">
            ${wallpaperButtons}
          </div>
        </section>
        <section class="settings-section" aria-labelledby="visual-settings-title">
          <h3 id="visual-settings-title">Visual Effects</h3>
          <div class="toggle-list">
            ${SettingToggle("grid", "Glass Grid", "배경의 미세한 유리 격자 패턴을 켜거나 끕니다.")}
            ${SettingToggle("glow", "Ambient Orbs", "배경의 은은한 컬러 글로우를 켜거나 끕니다.")}
            ${DesktopPetToggle()}
          </div>
        </section>
        <section class="settings-section" aria-labelledby="density-settings-title">
          <h3 id="density-settings-title">Icon Spacing</h3>
          <div class="segmented-control" role="group" aria-label="Icon spacing">
            ${densityButtons}
          </div>
        </section>
        <section class="settings-section music-methods" aria-labelledby="music-settings-title">
          <h3 id="music-settings-title">Music Module</h3>
          <p>
            Music Player는 무료 절차적 신스 루프와 로컬 오디오 플레이어를 전환해 사용할 수 있습니다.
          </p>
          <button class="retro-button" type="button" data-action="select-app" data-app-id="music-player">Open Music Player</button>
        </section>
      `,
      actions: `
        <button class="retro-button" type="button" data-action="reset-environment">Reset Environment</button>
        <button class="retro-button ghost" type="button" data-action="close-detail">Close Folder</button>
      `,
    });
  }

  function MusicPlayerWindow(app, windowState) {
    const track = selectedMusicTrack();
    const audioTrack = selectedLocalAudioTrack();
    const isLocalAudioMode = state.music.mode === "local";
    const isLocalPlaying = isLocalAudioMode && state.music.localPlaying;
    const localDuration = audioController.duration || state.music.trackDurations[audioTrack.id] || 0;
    const localCurrentTime = audioController.currentTime;
    const trackButtons = musicTracks
      .map((item) => {
        const active = item.id === track.id ? " is-active" : "";
        return `
          <button
            class="music-track${active}"
            type="button"
            data-action="select-music-track"
            data-track-id="${escapeHtml(item.id)}"
            aria-pressed="${active ? "true" : "false"}"
          >
            <span class="track-led track-${escapeHtml(item.accent)}" aria-hidden="true"></span>
            <span>
              <strong>${escapeHtml(item.name)}</strong>
              <small>${escapeHtml(item.mood)} · ${item.bpm} BPM</small>
            </span>
          </button>
        `;
      })
      .join("");
    const sourceSwitch = `
      <div class="music-source-switch" role="group" aria-label="Music source">
        <button
          class="segmented-option${!isLocalAudioMode ? " is-active" : ""}"
          type="button"
          data-action="set-music-mode"
          data-mode="synth"
          aria-pressed="${!isLocalAudioMode ? "true" : "false"}"
        >Procedural</button>
        <button
          class="segmented-option${isLocalAudioMode ? " is-active" : ""}"
          type="button"
          data-action="set-music-mode"
          data-mode="local"
          aria-pressed="${isLocalAudioMode ? "true" : "false"}"
        >Local Audio</button>
      </div>
    `;
    const localAudioButtons = localAudioTracks
      .map((item) => {
        const isActive = item.id === audioTrack.id;
        const isPlaying = isActive && state.music.localPlaying && isLocalAudioMode;
        const duration = state.music.trackDurations[item.id];
        return `
          <button
            class="local-audio-track${isActive ? " is-active" : ""}${isPlaying ? " is-playing" : ""}"
            type="button"
            data-action="play-local-audio-track"
            data-track-id="${escapeHtml(item.id)}"
            aria-pressed="${isActive ? "true" : "false"}"
            ${isPlaying ? 'aria-current="true"' : ""}
          >
            <span class="local-audio-track-indicator" aria-hidden="true">${isPlaying ? "▶" : ""}</span>
            <span>
              <strong>${escapeHtml(item.name)}</strong>
              <small>${escapeHtml(item.artist)} · ${escapeHtml(item.license)}</small>
            </span>
            <span class="local-audio-track-duration" data-local-track-duration="${escapeHtml(item.id)}">
              ${formatDuration(duration)}
            </span>
          </button>
        `;
      })
      .join("");
    const dockSizeButtons = dockSizeOptions
      .map((option) => {
        const active = option.id === state.music.localAudioDockSize;
        return `
          <button
            class="segmented-option${active ? " is-active" : ""}"
            type="button"
            data-action="set-local-audio-dock-size"
            data-size="${escapeHtml(option.id)}"
            aria-pressed="${active ? "true" : "false"}"
          >${escapeHtml(option.name)}</button>
        `;
      })
      .join("");
    const volumeControl = `
      <section class="settings-section" aria-labelledby="volume-title">
        <h3 id="volume-title">Volume</h3>
        <label class="volume-control">
          <span data-volume-label>${Math.round(state.music.volume * 100)}%</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value="${state.music.volume}"
            data-action="set-music-volume"
            aria-label="Music volume"
          />
        </label>
      </section>
    `;
    const localProgress = `
      <label class="local-audio-progress-control">
        <span data-local-audio-current>${formatDuration(localCurrentTime)}</span>
        <input
          class="local-audio-progress"
          type="range"
          min="0"
          max="${localDuration || 0}"
          step="0.1"
          value="${localCurrentTime}"
          data-action="set-local-audio-progress"
          aria-label="Local audio playback position"
        />
        <span data-local-audio-duration>${formatDuration(localDuration)}</span>
      </label>
    `;
    const localTransport = `
      <div class="local-audio-window-transport" role="group" aria-label="로컬 오디오 재생 제어">
        <button
          class="music-control-button"
          type="button"
          data-action="previous-local-audio-track"
          aria-label="이전 곡"
          title="이전 곡"
        >‹</button>
        <button
          class="music-control-button music-control-play"
          type="button"
          data-action="toggle-local-audio-playback"
          aria-label="${isLocalPlaying ? "일시정지" : "재생"}"
          title="${isLocalPlaying ? "일시정지" : "재생"}"
        >${isLocalPlaying ? "Ⅱ" : "▶"}</button>
        <button
          class="music-control-button"
          type="button"
          data-action="next-local-audio-track"
          aria-label="다음 곡"
          title="다음 곡"
        >›</button>
        ${localProgress}
      </div>
    `;
    const synthContent = `
      <div class="music-visualizer" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
      <section class="settings-section" aria-labelledby="track-list-title">
        <h3 id="track-list-title">Free Procedural Tracks</h3>
        <div class="music-track-list">
          ${trackButtons}
        </div>
      </section>
      <section class="settings-section music-license" aria-labelledby="music-license-title">
        <h3 id="music-license-title">Usage Scope</h3>
        <p>
          이 모드는 상용 음원, 샘플팩, 외부 스트리밍을 사용하지 않습니다.
          멜로디와 베이스 패턴은 이 프로젝트 코드 안에서 직접 생성됩니다.
        </p>
      </section>
    `;
    const synthPlayAction = state.music.playing ? "stop-music" : "play-music";
    const synthPlayLabel = state.music.playing ? "일시정지" : "재생";
    const synthTransport = `
      <div class="music-transport synth-transport" role="group" aria-label="절차적 트랙 재생 제어">
        <button
          class="music-control-button"
          type="button"
          data-action="previous-music-track"
          aria-label="뒤로"
          title="뒤로"
        >‹</button>
        <button
          class="music-control-button music-control-play"
          type="button"
          data-action="${synthPlayAction}"
          aria-label="${synthPlayLabel}"
          title="${synthPlayLabel}"
        >${state.music.playing ? "Ⅱ" : "▶"}</button>
        <button
          class="music-control-button"
          type="button"
          data-action="next-music-track"
          aria-label="앞으로"
          title="앞으로"
        >›</button>
      </div>
    `;
    const actions = `
      <button class="retro-button ghost" type="button" data-action="close-detail">Close Player</button>
    `;

    return WindowPanel({
      id: windowState.id,
      title: app.name,
      className: `music-player-window${state.music.playing || isLocalPlaying ? " is-playing" : ""}`,
      closeAction: "close-detail",
      focusable: true,
      windowState,
      children: `
        <div class="music-header">
          <span class="music-disc" aria-hidden="true">
            <span></span>
          </span>
          <div>
            <p class="detail-kicker">Local Audio Library</p>
            <p class="music-title">${escapeHtml(audioTrack.name)}</p>
            <p class="folder-copy">
              ${escapeHtml(audioTrack.artist)} · ${escapeHtml(audioTrack.license)}
            </p>
          </div>
        </div>
        <section class="local-audio-console" aria-labelledby="local-audio-now-title">
          <div class="local-audio-now">
            <div class="local-audio-art" aria-hidden="true">♪</div>
            <div>
              <h3 id="local-audio-now-title">Now Loaded</h3>
              <strong>${escapeHtml(audioTrack.name)}</strong>
              <span>${escapeHtml(audioTrack.artist)} · <span data-local-audio-time>${formatDuration(localCurrentTime)} / ${formatDuration(localDuration)}</span></span>
            </div>
          </div>
          ${localTransport}
          ${volumeControl}
        </section>
        <section class="settings-section local-audio-section" aria-labelledby="local-audio-title">
          <div class="local-audio-library-header">
            <h3 id="local-audio-title">Tracks (${localAudioTracks.length})</h3>
            <span>클릭하면 바로 재생됩니다.</span>
          </div>
          <div class="local-audio-track-list" aria-label="Local audio tracks">
            ${localAudioButtons}
          </div>
        </section>
      `,
      actions,
    });
  }

  function SettingToggle(key, label, description) {
    const isOn = Boolean(state.environment[key]);

    return `
      <button
        class="setting-toggle${isOn ? " is-on" : ""}"
        type="button"
        data-action="toggle-environment"
        data-setting="${escapeHtml(key)}"
        aria-pressed="${isOn ? "true" : "false"}"
      >
        <span>
          <strong>${escapeHtml(label)}</strong>
          <small>${escapeHtml(description)}</small>
        </span>
        <span class="toggle-state">${isOn ? "ON" : "OFF"}</span>
      </button>
    `;
  }

  function DesktopPetToggle() {
    const isOn = Boolean(state.pet.enabled);

    return `
      <button
        class="setting-toggle${isOn ? " is-on" : ""}"
        type="button"
        data-action="toggle-desktop-pet"
        aria-pressed="${isOn ? "true" : "false"}"
      >
        <span>
          <strong>Desktop Pet</strong>
          <small>우측 하단에서 움직이는 작은 데스크탑 펫을 켜거나 끕니다.</small>
        </span>
        <span class="toggle-state">${isOn ? "ON" : "OFF"}</span>
      </button>
    `;
  }

  // 데일리 미션 대시보드는 개발이 보류 상태라, 화면 구성 확인용 임시 데이터로 채워둔다.
  const dailyMissionSeed = [
    { project: "Hyperliquid", task: "일일 체크인 완료", reward: "+20P", done: true },
    { project: "Lighter", task: "거래량 $500 이상 달성", reward: "+50P", done: false },
    { project: "Monad Testnet", task: "테스트넷 트랜잭션 3건 전송", reward: "+15P", done: false },
    { project: "Berachain", task: "일일 스테이킹 유지", reward: "+10P", done: true },
    { project: "Fuel", task: "브릿지 1회 이상 사용", reward: "+25P", done: false },
  ];

  function DailyMissionWindow(app, windowState) {
    const doneCount = dailyMissionSeed.filter((mission) => mission.done).length;
    const items = dailyMissionSeed
      .map(
        (mission) => `
          <li class="mission-item${mission.done ? " is-done" : ""}">
            <span class="mission-check" aria-hidden="true">${mission.done ? "✓" : ""}</span>
            <span class="mission-body">
              <span class="mission-project">${escapeHtml(mission.project)}</span>
              <span class="mission-task">${escapeHtml(mission.task)}</span>
            </span>
            <span class="mission-reward">${escapeHtml(mission.reward)}</span>
          </li>
        `,
      )
      .join("");

    return WindowPanel({
      id: windowState.id,
      title: app.name,
      className: "daily-mission-window",
      closeAction: "close-detail",
      focusable: true,
      windowState,
      children: `
        <div class="mission-summary">
          <span>오늘 완료 ${doneCount} / ${dailyMissionSeed.length}</span>
          <span class="mission-summary-note">준비 중 · 임시 데이터</span>
        </div>
        <ul class="mission-list">
          ${items}
        </ul>
        <p class="window-note">
          매일 수행해야 하는 에어드랍 미션을 모아보는 대시보드입니다. 현재 개발이 보류된 상태이며,
          위 항목들은 화면 구성을 보여주기 위한 임시 데이터입니다.
        </p>
      `,
      actions: `
        <button class="retro-button ghost" type="button" data-action="close-detail">Close</button>
      `,
    });
  }

  function AppDetailWindow(windowState) {
    const app = appById(windowState.appId);
    if (!app) {
      return "";
    }

    if (app.id === "system-folder") {
      return SystemFolderWindow(app, windowState);
    }

    if (app.id === "music-player") {
      return MusicPlayerWindow(app, windowState);
    }

    if (app.id === "daily-mission") {
      return DailyMissionWindow(app, windowState);
    }

    const appUrl = safeExternalUrl(app.url);
    const openable = appUrl !== "#";
    const launched = Boolean(windowState.launched && openable);
    const openAction = openable
      ? launched
        ? `<button class="retro-button" type="button" data-action="show-app-info" data-window-id="${escapeHtml(windowState.id)}">Back to Info</button>
           <a class="retro-button ghost" href="${escapeHtml(appUrl)}" target="_blank" rel="noreferrer">Open Externally</a>`
        : `<button class="retro-button primary" type="button" data-action="launch-app" data-window-id="${escapeHtml(windowState.id)}">Open App</button>`
      : `<button class="retro-button is-disabled" type="button" disabled aria-disabled="true">Preparing</button>`;
    const detailContent = launched
      ? `
        <div class="project-runner">
          <iframe
            class="project-runner-frame"
            src="${escapeHtml(appUrl)}"
            title="${escapeHtml(app.name)} 실행 화면"
            loading="lazy"
            referrerpolicy="no-referrer"
            allow="clipboard-read; clipboard-write; fullscreen"
          ></iframe>
        </div>
      `
      : `
        <div class="detail-heading">
          <span class="detail-icon" aria-hidden="true">${IconAsset(app.icon, "detail-icon-img", 38)}</span>
          <div>
            <p class="detail-kicker">${escapeHtml(app.category)}</p>
            ${StatusBadge(app.status)}
          </div>
        </div>
        <dl class="detail-meta">
          <div>
            <dt>Category</dt>
            <dd>${escapeHtml(app.category)}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>${StatusBadge(app.status)}</dd>
          </div>
        </dl>
        <p class="detail-description">${escapeHtml(app.description)}</p>
        ${
          openable
            ? ""
            : '<p class="window-note">이 앱은 준비 중입니다. 소개 창은 열 수 있지만 외부 링크 이동은 비활성화되어 있습니다.</p>'
        }
      `;

    return WindowPanel({
      id: windowState.id,
      title: app.name,
      className: `app-detail-window${launched ? " is-running" : ""}`,
      closeAction: "close-detail",
      focusable: true,
      windowState,
      children: detailContent,
      actions: `
        ${openAction}
        <button class="retro-button ghost" type="button" data-action="close-detail">Close</button>
      `,
    });
  }

  function StartMenu() {
    if (!state.startOpen) {
      return "";
    }

    const pinnedApps = pinnedAppIds
      .map(appById)
      .filter(Boolean)
      .map(
        (app) => `
          <button class="start-menu-item" type="button" role="menuitem" data-action="select-app" data-app-id="${escapeHtml(app.id)}">
            <span aria-hidden="true">${IconAsset(app.icon, "start-menu-icon-img", 24)}</span>
            <span>${escapeHtml(app.name)}</span>
          </button>
        `,
      )
      .join("");

    return `
      <aside id="start-menu" class="start-menu" data-start-zone role="menu" aria-label="CookieLab OS start menu">
        <div class="start-menu-brand">
          <span class="status-light" aria-hidden="true"></span>
          <strong>CookieLab OS</strong>
        </div>
        <div class="start-menu-section">
          <p>Pinned Apps</p>
          ${pinnedApps}
        </div>
        <div class="start-menu-section">
          <p>System</p>
          <button class="start-menu-item" type="button" role="menuitem" data-action="select-app" data-app-id="system-folder">
            <span aria-hidden="true">⚙</span>
            <span>Settings</span>
          </button>
          <button class="start-menu-item" type="button" role="menuitem" data-action="show-notice" data-notice="CookieLab OS is a visual project launcher shell.">
            <span aria-hidden="true">?</span>
            <span>About</span>
          </button>
        </div>
      </aside>
    `;
  }

  function Taskbar() {
    const focusedWindow = state.windows[state.focusedWindowId];
    const currentTrack = selectedMusicTrack();
    const currentLocalTrack = selectedLocalAudioTrack();
    const currentLabel = state.music.playing
      ? `Music: ${currentTrack.name}`
      : state.music.localPlaying
        ? `Music: ${currentLocalTrack.name}`
      : focusedWindow
        ? getWindowTitle(focusedWindow)
        : "Desktop ready";
    const openWindowButtons = Object.values(state.windows)
      .sort((a, b) => b.zIndex - a.zIndex)
      .map((windowState) => {
        const app = windowState.appId ? appById(windowState.appId) : null;
        const active = windowState.id === state.focusedWindowId ? " is-active" : "";
        const minimized = windowState.minimized ? " is-minimized" : "";
        const icon = app?.icon || "OS";
        const title = getWindowTitle(windowState);
        const buttonTitle = windowState.minimized
          ? `${title} minimized - click to restore`
          : title;
        const label = windowState.minimized ? `Restore ${title}` : title;

        return `
          <button
            class="taskbar-window${active}${minimized}"
            type="button"
            data-action="focus-window"
            data-window-id="${escapeHtml(windowState.id)}"
            aria-label="${escapeHtml(buttonTitle)}"
            title="${escapeHtml(buttonTitle)}"
          >
            <span>${IconAsset(icon, "taskbar-window-icon-img", 18)}</span>
            <strong>${escapeHtml(label)}</strong>
          </button>
        `;
      })
      .join("");
    const pinnedApps = pinnedAppIds
      .map(appById)
      .filter(Boolean)
      .map(
        (app) => `
          <button
            class="taskbar-app"
            type="button"
            data-action="select-app"
            data-app-id="${escapeHtml(app.id)}"
            aria-label="${escapeHtml(app.name)} 열기"
            title="${escapeHtml(app.name)}"
          >${IconAsset(app.icon, "taskbar-app-img", 32)}</button>
        `,
      )
      .join("");

    return `
      <footer class="taskbar" data-start-zone>
        <button
          class="start-button"
          type="button"
          data-action="toggle-start"
          aria-expanded="${state.startOpen ? "true" : "false"}"
          aria-controls="start-menu"
        >
          Start
        </button>
        <div class="taskbar-pinned" aria-label="Pinned applications">
          ${pinnedApps}
        </div>
        <div class="taskbar-open-windows" aria-label="Open windows">
          ${openWindowButtons}
        </div>
        <div class="taskbar-current" aria-live="polite">
          ${escapeHtml(currentLabel)}
        </div>
        <div class="taskbar-system">
          <time data-current-time datetime="${state.now.toISOString()}">${formatTime()}</time>
        </div>
      </footer>
    `;
  }

  function LocalAudioDockPlayer() {
    const audioTrack = selectedLocalAudioTrack();
    if (!audioTrack) {
      return "";
    }

    const playLabel = state.music.localPlaying ? "일시정지" : "재생";
    const playSymbol = state.music.localPlaying ? "Ⅱ" : "▶";
    const localDuration = audioController.duration || state.music.trackDurations[audioTrack.id] || 0;
    // 드래그 이동 위치 / 리사이즈 크기가 있으면 인라인 스타일로 반영.
    const dockStyleParts = [];
    if (typeof state.music.dockX === "number" && typeof state.music.dockY === "number") {
      dockStyleParts.push(
        `left:${state.music.dockX}px`,
        `top:${state.music.dockY}px`,
        "right:auto",
        "bottom:auto",
      );
    }
    if (typeof state.music.dockWidth === "number") {
      dockStyleParts.push(`width:${state.music.dockWidth}px`);
    }
    if (typeof state.music.dockHeight === "number") {
      dockStyleParts.push(`height:${state.music.dockHeight}px`);
    }
    const dockStyle = dockStyleParts.length ? ` style="${dockStyleParts.join(";")}"` : "";
    return `
      <aside class="local-audio-dock dock-size-normal${state.music.localPlaying ? " is-playing" : ""}" aria-label="Local audio player"${dockStyle}>
        <div class="local-audio-dock-header" data-dock-drag>
          <span class="track-led track-mint" aria-hidden="true"></span>
          <button
            class="local-audio-dock-title"
            type="button"
            data-action="select-app"
            data-app-id="music-player"
            title="Music Player 열기"
          >${escapeHtml(audioTrack.name)}</button>
          <span class="local-audio-license">${escapeHtml(audioTrack.license)}</span>
        </div>
        <div class="local-audio-dock-transport" role="group" aria-label="로컬 오디오 재생 제어">
          <button
            class="local-audio-dock-button"
            type="button"
            data-action="previous-local-audio-track"
            aria-label="뒤로"
            title="뒤로"
          >‹</button>
          <button
            class="local-audio-dock-button local-audio-dock-play"
            type="button"
            data-action="toggle-local-audio-playback"
            aria-label="${playLabel}"
            title="${playLabel}"
          >${playSymbol}</button>
          <button
            class="local-audio-dock-button"
            type="button"
            data-action="next-local-audio-track"
            aria-label="앞으로"
            title="앞으로"
          >›</button>
          <span class="local-audio-dock-time" data-local-audio-time>${formatDuration(audioController.currentTime)} / ${formatDuration(localDuration)}</span>
        </div>
        <span class="local-audio-dock-resize" data-dock-resize aria-hidden="true"></span>
      </aside>
    `;
  }

  function SchedulerWindow(windowState) {
    const key = state.calendar.selectedDate || todayKey();
    const list = schedulesForDate(key);
    const items = list.length
      ? list
          .map(
            (item) => `
              <li class="scheduler-item">
                <span class="scheduler-item-time">${item.time ? escapeHtml(item.time) : "종일"}</span>
                <span class="scheduler-item-title">${escapeHtml(item.title)}</span>
                <button
                  type="button"
                  class="scheduler-item-del"
                  data-action="delete-schedule"
                  data-date="${escapeHtml(key)}"
                  data-schedule-id="${escapeHtml(item.id)}"
                  aria-label="일정 삭제"
                  title="삭제"
                >×</button>
              </li>
            `,
          )
          .join("")
      : `<li class="scheduler-empty">등록된 일정이 없습니다. 아래에서 새 일정을 추가하세요.</li>`;

    const children = `
      <div class="scheduler-head">
        <p class="scheduler-date">${escapeHtml(formatKoreanDate(key))}</p>
        <span class="scheduler-count">일정 ${list.length}건</span>
      </div>
      <ul class="scheduler-list">
        ${items}
      </ul>
      <form class="scheduler-form" data-scheduler-form data-date="${escapeHtml(key)}" autocomplete="off">
        <input
          type="time"
          class="scheduler-time-input"
          data-scheduler-time
          aria-label="일정 시간"
        />
        <input
          type="text"
          class="scheduler-title-input"
          data-scheduler-title
          maxlength="80"
          placeholder="일정 내용을 입력하세요"
          aria-label="일정 내용"
        />
        <button type="submit" class="retro-button primary scheduler-add">추가</button>
      </form>
    `;

    return WindowPanel({
      id: windowState.id,
      title: "Scheduler",
      className: "scheduler-window",
      focusable: true,
      windowState,
      children,
      actions: `
        <button class="retro-button ghost" type="button" data-action="close-detail">Close</button>
      `,
    });
  }

  function RenderWindow(windowState) {
    if (windowState.kind === "welcome") {
      return WelcomeWindow(windowState);
    }

    if (windowState.kind === "scheduler") {
      return SchedulerWindow(windowState);
    }

    return AppDetailWindow(windowState);
  }

  function WindowLayer() {
    const windows = Object.values(state.windows)
      .sort((a, b) => a.zIndex - b.zIndex)
      .map(RenderWindow)
      .join("");

    return `<div class="window-layer" aria-label="Open windows">${windows}</div>`;
  }

  function Desktop() {
    const systemApps = apps.filter((app) => app.system);
    const projectApps = apps.filter((app) => !app.system);
    const environment = state.environment;
    const desktopClasses = [
      "desktop-shell",
      `wallpaper-${environment.wallpaper}`,
      `density-${environment.density}`,
      environment.grid ? "" : "grid-off",
      environment.glow ? "" : "glow-off",
    ]
      .filter(Boolean)
      .join(" ");

    return `
      <div class="${desktopClasses}">
        ${TopMenuBar()}
        <main class="desktop-main" id="desktop-main">
          <div class="desktop-layout">
            ${DesktopIconColumn({
              id: "system-app",
              title: "System Disk",
              subtitle: `${systemApps.length} folders`,
              side: "left",
              apps: systemApps,
            })}
            <div class="center-stack">
              ${DesktopIdentityPanel()}
            </div>
            ${DesktopIconColumn({
              id: "app",
              title: "Project Files",
              subtitle: `${projectApps.length} apps`,
              side: "right",
              apps: projectApps,
            })}
          </div>
          ${WindowLayer()}
        </main>
        ${StartMenu()}
        ${state.notice ? `<div class="desktop-toast" role="status">${escapeHtml(state.notice)}</div>` : ""}
        ${LocalAudioDockPlayer()}
        ${Taskbar()}
      </div>
    `;
  }

  function render() {
    applyEnvironment();
    root.innerHTML = `
      ${state.bootPhase !== "ready" ? BootScreen() : ""}
      ${state.bootPhase === "ready" ? Desktop() : ""}
    `;
    Object.values(state.windows).forEach((windowState) => {
      windowState.opening = false;
    });
  }

  function selectApp(id) {
    const app = appById(id);
    if (!app) {
      return;
    }

    const kind = getAppWindowKind(id);
    const windowId = getWindowId(kind, id);
    const existingWindow = state.windows[windowId];
    if (existingWindow && !existingWindow.minimized) {
      closeWindow(windowId);
      return;
    }

    openWindow(kind, { appId: app.id });
  }

  function goToCalendarMonth(deltaMonths) {
    const next = new Date(state.calendar.viewYear, state.calendar.viewMonth + deltaMonths, 1);
    state.calendar.viewYear = next.getFullYear();
    state.calendar.viewMonth = next.getMonth();
    render();
  }

  function goToToday() {
    const now = state.now instanceof Date ? state.now : new Date();
    state.calendar.viewYear = now.getFullYear();
    state.calendar.viewMonth = now.getMonth();
    render();
  }

  function openScheduler(dateStr) {
    const date = parseDateKey(dateStr);
    if (!date) {
      return;
    }
    state.calendar.selectedDate = dateStr;
    // 다른 달의 날짜를 눌렀다면 그 달로 뷰를 옮긴다.
    state.calendar.viewYear = date.getFullYear();
    state.calendar.viewMonth = date.getMonth();
    openWindow("scheduler");
  }

  function focusSchedulerTitleInput() {
    requestAnimationFrame(() => {
      document
        .querySelector(".scheduler-window [data-scheduler-title]")
        ?.focus({ preventScroll: true });
    });
  }

  function addScheduleFromForm(form) {
    if (!form) {
      return;
    }
    const dateStr = form.dataset.date;
    if (!parseDateKey(dateStr)) {
      return;
    }
    const titleInput = form.querySelector("[data-scheduler-title]");
    const timeInput = form.querySelector("[data-scheduler-time]");
    const title = (titleInput?.value || "").trim();
    if (!title) {
      titleInput?.focus();
      return;
    }
    const time = timeInput?.value || "";
    if (!Array.isArray(state.schedules[dateStr])) {
      state.schedules[dateStr] = [];
    }
    state.schedules[dateStr].push({
      id: `sch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      time,
      title,
    });
    saveSchedules();
    render();
    focusSchedulerTitleInput();
  }

  function deleteSchedule(dateStr, scheduleId) {
    const list = state.schedules[dateStr];
    if (!Array.isArray(list)) {
      return;
    }
    state.schedules[dateStr] = list.filter((item) => item.id !== scheduleId);
    if (!state.schedules[dateStr].length) {
      delete state.schedules[dateStr];
    }
    saveSchedules();
    render();
  }

  function closeDetail(id = state.focusedWindowId) {
    if (id) {
      closeWindow(id);
      return;
    }

    state.notice = "";
    render();
  }

  function launchAppInWindow(id) {
    const windowState = state.windows[id];
    const app = windowState?.appId ? appById(windowState.appId) : null;
    const appUrl = safeExternalUrl(app?.url);
    if (!windowState || !app || appUrl === "#") {
      return;
    }

    windowState.launched = true;
    windowState.minimized = false;
    if (!windowState.maximized && !isCompactWindowMode()) {
      windowState.width = Math.max(windowState.width, 920);
      windowState.height = Math.max(windowState.height, 640);
      normalizeWindowBounds(windowState);
    }

    focusWindow(id, { renderNow: false });
    render();
    focusWindowElement(id);
  }

  function showAppInfo(id) {
    const windowState = state.windows[id];
    if (!windowState) {
      return;
    }

    windowState.launched = false;
    focusWindow(id, { renderNow: false });
    render();
    focusWindowElement(id);
  }

  function showNotice(message) {
    state.notice = message;
    state.startOpen = false;
    render();
  }

  function focusSystemFolder() {
    focusWindow("system-folder", { renderNow: false });
    focusWindowElement("system-folder");
  }

  function focusMusicPlayer() {
    focusWindow("music-player", { renderNow: false });
    focusWindowElement("music-player");
  }

  function getAppWindowKind(id) {
    if (id === "system-folder") {
      return "system-folder";
    }

    if (id === "music-player") {
      return "music-player";
    }

    return "app-detail";
  }

  function nextMusicTrack() {
    const currentIndex = musicTracks.findIndex(
      (track) => track.id === state.music.trackId,
    );
    const nextTrack = musicTracks[(currentIndex + 1) % musicTracks.length];
    selectMusicTrack(nextTrack.id);
  }

  function setWallpaper(id) {
    if (!wallpaperOptions.some((option) => option.id === id)) {
      return;
    }

    state.environment.wallpaper = id;
    state.notice = "";
    saveEnvironment();
    render();
    focusSystemFolder();
  }

  function setDensity(id) {
    if (!densityOptions.some((option) => option.id === id)) {
      return;
    }

    state.environment.density = id;
    state.notice = "";
    saveEnvironment();
    render();
    focusSystemFolder();
  }

  function toggleEnvironmentSetting(key) {
    if (!Object.prototype.hasOwnProperty.call(defaultEnvironment, key)) {
      return;
    }

    state.environment[key] = !state.environment[key];
    state.notice = "";
    saveEnvironment();
    render();
    focusSystemFolder();
  }

  function resetEnvironment() {
    state.environment = { ...defaultEnvironment };
    state.notice = "Desktop environment restored to defaults.";
    saveEnvironment();
    render();
    focusSystemFolder();
  }

  function updateWindowGesture(event) {
    if (!activeWindowGesture) {
      return;
    }

    const windowState = state.windows[activeWindowGesture.id];
    const element = document.getElementById(activeWindowGesture.id);
    if (!windowState || !element) {
      return;
    }

    const area = getWindowWorkArea();
    const margin = desktopFrame.margin;
    const dx = event.clientX - activeWindowGesture.startClientX;
    const dy = event.clientY - activeWindowGesture.startClientY;

    if (activeWindowGesture.type === "drag") {
      activeWindowGesture.x = clamp(
        activeWindowGesture.startX + dx,
        margin,
        Math.max(margin, area.width - activeWindowGesture.startWidth - margin),
      );
      activeWindowGesture.y = clamp(
        activeWindowGesture.startY + dy,
        margin,
        Math.max(margin, area.height - activeWindowGesture.startHeight - margin),
      );
      element.style.left = `${activeWindowGesture.x}px`;
      element.style.top = `${activeWindowGesture.y}px`;
      return;
    }

    const resizeEdge = activeWindowGesture.edge || "se";
    if (resizeEdge.includes("e")) {
      activeWindowGesture.width = clamp(
        activeWindowGesture.startWidth + dx,
        320,
        Math.max(320, area.width - activeWindowGesture.startX - margin),
      );
      element.style.width = `${activeWindowGesture.width}px`;
    }

    if (resizeEdge.includes("s")) {
      activeWindowGesture.height = clamp(
        activeWindowGesture.startHeight + dy,
        220,
        Math.max(220, area.height - activeWindowGesture.startY - margin),
      );
      element.style.height = `${activeWindowGesture.height}px`;
    }
  }

  function finishWindowGesture(event) {
    if (!activeWindowGesture) {
      return;
    }

    updateWindowGesture(event);

    const gesture = activeWindowGesture;
    const windowState = state.windows[gesture.id];
    const element = document.getElementById(gesture.id);

    if (windowState) {
      if (gesture.type === "drag") {
        windowState.x = gesture.x;
        windowState.y = gesture.y;
      } else {
        windowState.width = gesture.width;
        windowState.height = gesture.height;
      }
      normalizeWindowBounds(windowState);
    }

    if (element && windowState && !windowState.maximized) {
      element.style.left = `${windowState.x}px`;
      element.style.top = `${windowState.y}px`;
      element.style.width = `${windowState.width}px`;
      element.style.height = `${windowState.height}px`;
    }

    element?.classList.remove("is-moving", "is-resizing");
    activeWindowGesture = null;
    if (gesture.id) {
      focusWindowElement(gesture.id);
    }
  }

  // ── 미니 플레이어(도크) 드래그/리사이즈 ─────────────────────────────
  function startDockGesture(event) {
    if (activeDockGesture) {
      return;
    }
    const dock = event.target.closest(".local-audio-dock");
    if (!dock) {
      return;
    }
    // 재생 컨트롤(이전/재생/다음)은 드래그 대상에서 제외 — 클릭만 동작.
    if (event.target.closest(".local-audio-dock-transport")) {
      return;
    }
    const isResize = Boolean(event.target.closest("[data-dock-resize]"));
    const isDragZone = isResize || Boolean(event.target.closest("[data-dock-drag]"));
    if (!isDragZone) {
      return;
    }

    const rect = dock.getBoundingClientRect();
    activeDockGesture = {
      pointerId: event.pointerId,
      type: isResize ? "resize" : "drag",
      startClientX: event.clientX,
      startClientY: event.clientY,
      startLeft: rect.left,
      startTop: rect.top,
      startWidth: rect.width,
      startHeight: rect.height,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      moved: false,
    };

    if (isResize) {
      // 리사이즈는 클릭과 헷갈릴 일이 없으므로 즉시 캡처.
      event.preventDefault();
      dock.setPointerCapture?.(event.pointerId);
      dock.classList.add("is-resizing");
      activeDockGesture.moved = true;
    }
  }

  function updateDockGesture(event) {
    if (!activeDockGesture || event.pointerId !== activeDockGesture.pointerId) {
      return;
    }
    const dock = document.querySelector(".local-audio-dock");
    if (!dock) {
      return;
    }
    const dx = event.clientX - activeDockGesture.startClientX;
    const dy = event.clientY - activeDockGesture.startClientY;

    // 드래그는 4px 이상 움직여야 시작 → 제목 버튼 단순 클릭을 방해하지 않음.
    if (activeDockGesture.type === "drag" && !activeDockGesture.moved) {
      if (Math.hypot(dx, dy) < 4) {
        return;
      }
      activeDockGesture.moved = true;
      event.preventDefault();
      dock.setPointerCapture?.(activeDockGesture.pointerId);
      dock.classList.add("is-moving");
    }

    if (activeDockGesture.type === "drag") {
      const maxLeft = window.innerWidth - activeDockGesture.width - 8;
      const maxTop = window.innerHeight - activeDockGesture.height - 8;
      activeDockGesture.left = clamp(
        activeDockGesture.startLeft + dx,
        8,
        Math.max(8, maxLeft),
      );
      activeDockGesture.top = clamp(
        activeDockGesture.startTop + dy,
        desktopFrame.top,
        Math.max(desktopFrame.top, maxTop),
      );
      dock.style.left = `${activeDockGesture.left}px`;
      dock.style.top = `${activeDockGesture.top}px`;
      dock.style.right = "auto";
      dock.style.bottom = "auto";
    } else {
      activeDockGesture.width = clamp(activeDockGesture.startWidth + dx, 248, 560);
      activeDockGesture.height = clamp(activeDockGesture.startHeight + dy, 108, 420);
      dock.style.width = `${activeDockGesture.width}px`;
      dock.style.height = `${activeDockGesture.height}px`;
    }
  }

  function finishDockGesture(event) {
    if (
      !activeDockGesture ||
      (event.pointerId != null && event.pointerId !== activeDockGesture.pointerId)
    ) {
      return;
    }
    const gesture = activeDockGesture;
    const dock = document.querySelector(".local-audio-dock");
    activeDockGesture = null;
    dock?.classList.remove("is-moving", "is-resizing");

    if (!gesture.moved) {
      // 단순 클릭 — 제목 버튼 기본 동작(뮤직 플레이어 열기)을 유지.
      return;
    }

    if (gesture.type === "drag") {
      state.music.dockX = Math.round(gesture.left);
      state.music.dockY = Math.round(gesture.top);
    } else {
      state.music.dockWidth = Math.round(gesture.width);
      state.music.dockHeight = Math.round(gesture.height);
    }
    saveMusicSettings();

    // 드래그 직후 발생하는 click 한 번을 삼켜 제목이 눌리지 않게 한다.
    suppressDockClick = true;
    window.setTimeout(() => {
      suppressDockClick = false;
    }, 0);
  }

  root.addEventListener("pointerdown", startDockGesture);
  document.addEventListener("pointermove", updateDockGesture);
  document.addEventListener("pointerup", finishDockGesture);
  document.addEventListener("pointercancel", finishDockGesture);

  root.addEventListener("pointerdown", (event) => {
    const panel = event.target.closest(".window-panel[data-window-id]");
    if (!panel) {
      return;
    }

    const id = panel.dataset.windowId;
    const windowState = state.windows[id];
    if (!windowState) {
      return;
    }

    focusWindow(id, { renderNow: false, restore: !windowState.minimized });

    const resizeHandle = event.target.closest("[data-window-resize-handle]");
    const isResize = Boolean(resizeHandle);
    const isTitlebar = Boolean(event.target.closest(".window-titlebar"));
    const isChromeControl = Boolean(
      event.target.closest(`.window-controls, ${interactiveControlSelector}`),
    );

    if (!isChromeControl) {
      panel.focus({ preventScroll: true });
    }

    if (
      isCompactWindowMode() ||
      windowState.maximized ||
      (!isResize && (!isTitlebar || isChromeControl))
    ) {
      return;
    }

    event.preventDefault();
    panel.setPointerCapture?.(event.pointerId);
    activeWindowGesture = {
      id,
      pointerId: event.pointerId,
      type: isResize ? "resize" : "drag",
      edge: resizeHandle?.dataset.resizeEdge || "se",
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: windowState.x,
      startY: windowState.y,
      startWidth: windowState.width,
      startHeight: windowState.height,
      x: windowState.x,
      y: windowState.y,
      width: windowState.width,
      height: windowState.height,
    };
    panel.classList.add(isResize ? "is-resizing" : "is-moving");
  });

  root.addEventListener("dblclick", (event) => {
    const titlebar = event.target.closest(".window-titlebar");
    const panel = event.target.closest(".window-panel[data-window-id]");
    if (!titlebar || !panel || event.target.closest(".window-controls")) {
      return;
    }

    toggleMaximizeWindow(panel.dataset.windowId);
  });

  document.addEventListener("pointermove", updateWindowGesture);
  document.addEventListener("pointerup", finishWindowGesture);
  document.addEventListener("pointercancel", finishWindowGesture);

  root.addEventListener("click", (event) => {
    // 미니 플레이어를 드래그로 옮긴 직후의 click 은 무시(제목이 눌리지 않게).
    if (suppressDockClick && event.target.closest(".local-audio-dock")) {
      suppressDockClick = false;
      return;
    }

    const trigger = event.target.closest("[data-action]");
    if (!trigger) {
      return;
    }

    const action = trigger.dataset.action;

    if (action === "focus-window") {
      focusWindow(trigger.dataset.windowId);
      return;
    }

    if (action === "window-close") {
      closeWindow(trigger.dataset.windowId);
      return;
    }

    if (action === "window-minimize") {
      minimizeWindow(trigger.dataset.windowId);
      return;
    }

    if (action === "window-maximize") {
      toggleMaximizeWindow(trigger.dataset.windowId);
      return;
    }

    if (action === "toggle-window-liquid-glass") {
      toggleWindowLiquidGlass(trigger.dataset.windowId);
      return;
    }

    if (action === "toggle-start") {
      state.startOpen = !state.startOpen;
      state.notice = "";
      render();
      return;
    }

    if (action === "select-app") {
      selectApp(trigger.dataset.appId);
      return;
    }

    if (action === "calendar-prev-month") {
      goToCalendarMonth(-1);
      return;
    }

    if (action === "calendar-next-month") {
      goToCalendarMonth(1);
      return;
    }

    if (action === "calendar-today") {
      goToToday();
      return;
    }

    if (action === "open-scheduler") {
      openScheduler(trigger.dataset.date);
      return;
    }

    if (action === "delete-schedule") {
      deleteSchedule(trigger.dataset.date, trigger.dataset.scheduleId);
      return;
    }

    if (action === "close-detail") {
      closeDetail(trigger.closest(".window-panel")?.dataset.windowId);
      return;
    }

    if (action === "launch-app") {
      launchAppInWindow(trigger.dataset.windowId);
      return;
    }

    if (action === "show-app-info") {
      showAppInfo(trigger.dataset.windowId);
      return;
    }

    if (action === "view-all-apps") {
      document.getElementById("app-grid")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (action === "show-notice") {
      showNotice(trigger.dataset.notice || "This control is visual only.");
      return;
    }

    if (action === "set-wallpaper") {
      setWallpaper(trigger.dataset.wallpaper);
      return;
    }

    if (action === "set-density") {
      setDensity(trigger.dataset.density);
      return;
    }

    if (action === "toggle-environment") {
      toggleEnvironmentSetting(trigger.dataset.setting);
      return;
    }

    if (action === "toggle-desktop-pet") {
      toggleDesktopPet();
      return;
    }

    if (action === "reset-environment") {
      resetEnvironment();
      return;
    }

    if (action === "play-music") {
      startMusic();
      return;
    }

    if (action === "stop-music") {
      stopMusic();
      return;
    }

    if (action === "select-music-track") {
      selectMusicTrack(trigger.dataset.trackId);
      return;
    }

    if (action === "previous-music-track") {
      previousMusicTrack();
      return;
    }

    if (action === "next-music-track") {
      nextMusicTrack();
      return;
    }

    if (action === "set-music-mode") {
      setMusicMode(trigger.dataset.mode);
      return;
    }

    if (action === "select-local-audio-track") {
      selectLocalAudioTrack(trigger.dataset.trackId);
      return;
    }

    if (action === "play-local-audio-track") {
      selectLocalAudioTrack(trigger.dataset.trackId, { autoplay: true });
      return;
    }

    if (action === "previous-local-audio-track") {
      previousLocalAudioTrack();
      return;
    }

    if (action === "next-local-audio-track") {
      nextLocalAudioTrack();
      return;
    }

    if (action === "toggle-local-audio-playback") {
      toggleLocalAudioPlayback();
      return;
    }

    if (action === "set-local-audio-dock-size") {
      setLocalAudioDockSize(trigger.dataset.size);
      return;
    }
  });

  root.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-scheduler-form]");
    if (!form) {
      return;
    }
    event.preventDefault();
    addScheduleFromForm(form);
  });

  root.addEventListener("input", (event) => {
    const trigger = event.target.closest("[data-action]");
    if (!trigger) {
      return;
    }

    if (trigger.dataset.action === "set-music-volume") {
      setMusicVolume(trigger.value);
    }

    if (trigger.dataset.action === "set-local-audio-progress") {
      setLocalAudioProgress(trigger.value);
    }
  });

  root.addEventListener("keydown", (event) => {
    if (!event.key.startsWith("Arrow")) {
      return;
    }

    const panel = event.target.closest(".window-panel[data-window-id]");
    if (
      !panel ||
      isCompactWindowMode() ||
      event.target.closest(interactiveControlSelector) ||
      (event.target !== panel && !event.target.closest(".window-titlebar"))
    ) {
      return;
    }

    const windowState = state.windows[panel.dataset.windowId];
    if (!windowState || windowState.maximized || windowState.minimized) {
      return;
    }

    const step = event.shiftKey ? 60 : 20;
    const shouldResize = event.ctrlKey || event.metaKey;
    event.preventDefault();

    if (shouldResize && event.key === "ArrowLeft") {
      windowState.width -= step;
    } else if (shouldResize && event.key === "ArrowRight") {
      windowState.width += step;
    } else if (shouldResize && event.key === "ArrowUp") {
      windowState.height -= step;
    } else if (shouldResize && event.key === "ArrowDown") {
      windowState.height += step;
    } else if (event.key === "ArrowLeft") {
      windowState.x -= step;
    } else if (event.key === "ArrowRight") {
      windowState.x += step;
    } else if (event.key === "ArrowUp") {
      windowState.y -= step;
    } else if (event.key === "ArrowDown") {
      windowState.y += step;
    }

    normalizeWindowBounds(windowState);
    render();
    focusWindowElement(windowState.id);
  });

  document.addEventListener("click", (event) => {
    if (!state.startOpen || event.target.closest("[data-start-zone]")) {
      return;
    }

    state.startOpen = false;
    render();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    if (blurActiveInteractiveControl()) {
      event.preventDefault();
      return;
    }

    if (state.startOpen || state.notice) {
      state.startOpen = false;
      state.notice = "";
      render();
      return;
    }

    if (state.focusedWindowId) {
      closeWindow(state.focusedWindowId);
    }
  });

  window.addEventListener("resize", () => {
    Object.values(state.windows).forEach((windowState) => {
      normalizeWindowBounds(windowState);
      if (isCompactWindowMode()) {
        windowState.maximized = true;
      }
    });
    handleDesktopPetResize();

    if (state.bootPhase === "ready") {
      render();
      if (state.focusedWindowId) {
        focusWindowElement(state.focusedWindowId);
      }
    }
  });

  document.addEventListener("visibilitychange", syncDesktopPet);

  function initGlassCursor() {
    if (document.getElementById("glass-cursor-field")) {
      return;
    }

    const field = document.createElement("div");
    field.id = "glass-cursor-field";
    field.className = "glass-cursor-field";
    field.setAttribute("aria-hidden", "true");
    field.innerHTML = `
      <svg class="glass-cursor-defs" width="0" height="0" aria-hidden="true" focusable="false">
        <filter id="glassCursorRipple" x="-35%" y="-35%" width="170%" height="170%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.009 0.013" numOctaves="2" seed="7" result="noise">
            <animate attributeName="baseFrequency" dur="18s" values="0.009 0.013;0.013 0.009;0.009 0.013" repeatCount="indefinite" />
          </feTurbulence>
          <feGaussianBlur in="noise" stdDeviation="1.4" result="softNoise" />
          <feDisplacementMap in="SourceGraphic" in2="softNoise" scale="12" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div class="glass-cursor-lens"></div>
      <div class="glass-cursor-sheen"></div>
    `;
    document.body.appendChild(field);

    // SVG 필터를 backdrop-filter 안에서 지원하는지 확인 (사실상 크로미움 계열만).
    const supportsRefraction =
      (window.CSS &&
        (CSS.supports("backdrop-filter", "url(#glassCursorRipple)") ||
          CSS.supports("-webkit-backdrop-filter", "url(#glassCursorRipple)"))) ||
      false;
    field.classList.toggle("has-refraction", supportsRefraction);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let rafId = null;
    let idleTimer = null;
    let pending = null;

    function applyPosition() {
      rafId = null;
      if (!pending) {
        return;
      }
      field.style.setProperty("--glass-cx", `${pending.x}px`);
      field.style.setProperty("--glass-cy", `${pending.y}px`);
    }

    function handlePointerMove(event) {
      if (reduceMotion.matches) {
        return;
      }
      pending = { x: event.clientX, y: event.clientY };
      if (rafId === null) {
        rafId = requestAnimationFrame(applyPosition);
      }
      field.classList.add("is-active");
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        field.classList.remove("is-active");
      }, 280);
    }

    document.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("pointerdown", handlePointerMove, { passive: true });
  }

  initializeLocalAudioController();
  initializeDesktopPet();
  initGlassCursor();
  render();

  setTimeout(() => {
    state.bootPhase = "hiding";
    render();

    setTimeout(() => {
      state.bootPhase = "ready";
      state.now = new Date();
      ensureInitialWindows();
      render();
      // 상단 전광판 시세: 즉시 1회 조회 후 주기적으로 갱신(몇 분 지연 허용).
      fetchCryptoPrices();
      setInterval(fetchCryptoPrices, 60_000);
      // 우측에서 슬라이드로 들어오는 진입 연출이 끝나면 무한 루프 모드로 전환.
      setTimeout(() => {
        state.crypto.entered = true;
        state.crypto.animEpoch = Date.now();
        render();
      }, 1200);
    }, 380);
  }, 1250);

  setInterval(() => {
    state.now = new Date();
    if (state.bootPhase === "ready") {
      updateClockNodes();
    }
  }, 60_000);
})();
