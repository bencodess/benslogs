function normalizePath(pathname) {
  if (!pathname) {
    return '/';
  }
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function isContactPath(pathname) {
  const path = normalizePath(pathname);
  return /\/contact(?:\.html|\/index\.html)?$/.test(path);
}

function isProjectsIndexPath(pathname) {
  const path = normalizePath(pathname);
  return /\/projects(?:\.html|\/index\.html)?$/.test(path);
}

function isProjectDetailPath(pathname) {
  const path = normalizePath(pathname);
  return /\/projects\/[^/]+(?:\/index\.html)?$/.test(path) && !isProjectsIndexPath(path);
}

let hasFirstLanyardSuccess = false;
let resolveFirstLanyardSuccess = null;
const firstLanyardSuccessPromise = new Promise((resolve) => {
  resolveFirstLanyardSuccess = resolve;
});

function markFirstLanyardSuccess() {
  if (hasFirstLanyardSuccess) {
    return;
  }

  hasFirstLanyardSuccess = true;
  if (typeof resolveFirstLanyardSuccess === 'function') {
    resolveFirstLanyardSuccess();
  }
}

function setupPageLoader() {
  const existingLoader = document.querySelector('.page-loader');
  if (existingLoader || !document.body) {
    return;
  }

  const path = window.location.pathname;
  const isContactPage = isContactPath(path);
  const isProjectDetailPage = isProjectDetailPath(path);
  const loaderText = isProjectDetailPage
    ? 'Loading project...'
    : isContactPage
      ? 'Loading Discord presence...'
      : 'Loading assets...';

  document.body.classList.add('is-loading');

  const loader = document.createElement('div');
  loader.className = 'page-loader';
  loader.setAttribute('aria-hidden', 'true');
  loader.innerHTML = `
    <div class="page-loader__inner">
      <div class="page-loader__spinner"></div>
      <p class="page-loader__text">${loaderText}</p>
    </div>
  `;
  document.body.appendChild(loader);

  let isClosed = false;
  const closeLoader = () => {
    if (isClosed) {
      return;
    }
    isClosed = true;
    document.body.classList.remove('is-loading');
    loader.classList.add('is-hidden');
    window.setTimeout(() => loader.remove(), 420);
  };

  const pageLoadedPromise = new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve();
      return;
    }

    window.addEventListener('load', resolve, { once: true });
  });

  if (isContactPage) {
    Promise.all([pageLoadedPromise, firstLanyardSuccessPromise]).then(closeLoader);
    window.setTimeout(closeLoader, 15000);
    return;
  }

  pageLoadedPromise.then(closeLoader);
  window.setTimeout(closeLoader, 10000);
}

setupPageLoader();

function setupContentProtection() {
  document.addEventListener('selectstart', (event) => {
    event.preventDefault();
  });

  document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
  });

  document.addEventListener('dragstart', (event) => {
    const target = event.target;
    if (target instanceof HTMLImageElement || target instanceof HTMLAnchorElement) {
      event.preventDefault();
    }
  });

  document.querySelectorAll('img').forEach((img) => {
    img.setAttribute('draggable', 'false');
  });

  document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    const ctrlOrCmd = event.ctrlKey || event.metaKey;

    const blockedCombos =
      (ctrlOrCmd && key === 's') ||
      (ctrlOrCmd && key === 'u') ||
      (ctrlOrCmd && key === 'p') ||
      (ctrlOrCmd && event.shiftKey && (key === 'i' || key === 'j' || key === 'c'));

    if (blockedCombos) {
      event.preventDefault();
    }
  });
}

setupContentProtection();

const revealItems = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 }
);

revealItems.forEach((item, index) => {
  item.style.transitionDelay = `${index * 70}ms`;
  observer.observe(item);
});

document.getElementById('year').textContent = new Date().getFullYear();

const USER_ID = '1033745912071192688';
const FEEDBACK_WEBHOOK_URL =
  'https://discord.com/api/webhooks/1473065432880775179/i2kwPxElK6jr-jJiTUrRr4vPmC0m6MFnBYiEbGzTHuoThO5bbdnrkHrFpypFXB9-NG4D';
const FEEDBACK_BLOCKED_TERMS = [
  'hitler',
  'nigga',
  'nigger',
  'heil',
  'nazis',
  'nazi',
];
const DEFAULT_SITE_CONFIG = {
  feedback: true,
};
const AUTO_RELOAD_MS = 60000;
const LANYARD_STALE_MS = 5 * 1000;
const OUTAGE_START_KEY = `lanyard_outage_start_${USER_ID}`;
const statusTextEl = document.getElementById('discordStatusText');
const activityTextEl = document.getElementById('discordActivityText');
const dotEl = document.getElementById('discordDot');
const usernameEl = document.getElementById('discordUsername');
const avatarEl = document.getElementById('discordAvatar');
const discordPanelEl = document.querySelector('.discord-panel');
const discordWarningEl = document.getElementById('discordWarning');
const spotifyNowEl = document.getElementById('spotifyNow');
const spotifyArtworkEl = document.getElementById('spotifyArtwork');
const spotifySongEl = document.getElementById('spotifySong');
const spotifyArtistEl = document.getElementById('spotifyArtist');

const presenceLabels = {
  online: 'Online',
  idle: 'Idle',
  dnd: 'Do Not Disturb',
  offline: 'Offline',
};

function setPresenceStatus(presence) {
  if (!dotEl || !statusTextEl) {
    return;
  }

  const finalPresence = presence || 'offline';
  dotEl.className = 'status-dot';
  dotEl.classList.add(finalPresence);
  statusTextEl.textContent = `Status: ${presenceLabels[finalPresence] || 'Unknown'}`;
}

function setActivity(activities = []) {
  if (!activityTextEl) {
    return;
  }

  const preferred = activities.find((item) => item.type === 0 && item.name);

  if (preferred) {
    activityTextEl.textContent = `Playing: ${preferred.name}`;
    return;
  }

  const fallback = activities.find((item) => item.name);
  activityTextEl.textContent = fallback ? `Activity: ${fallback.name}` : 'No current activity';
}

function getDiscordAvatarUrl(discordUser) {
  if (!discordUser || !discordUser.id || !discordUser.avatar) {
    return null;
  }

  const isAnimated = discordUser.avatar.startsWith('a_');
  const ext = isAnimated ? 'gif' : 'png';
  return `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.${ext}?size=256`;
}

function setDiscordUser(discordUser) {
  if (usernameEl) {
    const username = discordUser?.global_name || discordUser?.username || 'Unknown user';
    usernameEl.textContent = username;
  }

  if (avatarEl) {
    const avatarUrl = getDiscordAvatarUrl(discordUser);
    if (avatarUrl) {
      avatarEl.src = avatarUrl;
    }
  }

}

function setSpotify(spotifyData, isListeningToSpotify) {
  if (!spotifyNowEl || !spotifyArtworkEl || !spotifySongEl || !spotifyArtistEl) {
    return;
  }

  const spotifyEnd = Number(spotifyData?.timestamps?.end || 0);
  const isStaleSpotify = spotifyEnd > 0 && Date.now() > spotifyEnd + 5 * 60 * 1000;

  if (!isListeningToSpotify || !spotifyData || isStaleSpotify) {
    spotifyNowEl.classList.add('hidden');
    spotifySongEl.classList.remove('is-marquee');
    spotifySongEl.removeAttribute('data-song-title');
    spotifySongEl.textContent = '-';
    spotifyArtistEl.textContent = '-';
    return;
  }

  const songTitle = spotifyData.song || 'Unknown song';
  spotifyNowEl.classList.remove('hidden');
  setSongMarquee(songTitle);
  spotifyArtistEl.textContent = spotifyData.artist || 'Unknown artist';

  if (spotifyData.album_art_url) {
    spotifyArtworkEl.src = spotifyData.album_art_url;
  }
}

function setSongMarquee(songTitle) {
  if (!spotifySongEl) {
    return;
  }

  if (spotifySongEl.dataset.songTitle === songTitle) {
    return;
  }

  spotifySongEl.dataset.songTitle = songTitle;
  spotifySongEl.classList.remove('is-marquee');
  spotifySongEl.style.removeProperty('--marquee-shift');
  spotifySongEl.style.removeProperty('--marquee-duration');
  spotifySongEl.textContent = songTitle;

  window.requestAnimationFrame(() => {
    if (!spotifySongEl || spotifyNowEl?.classList.contains('hidden')) {
      return;
    }

    if (spotifySongEl.clientWidth <= 0) {
      return;
    }

    const overflows = spotifySongEl.scrollWidth > spotifySongEl.clientWidth + 2;
    if (!overflows) {
      return;
    }

    const trackA = document.createElement('span');
    trackA.className = 'marquee-track';
    trackA.textContent = songTitle;

    const gap = document.createElement('span');
    gap.className = 'marquee-gap';
    gap.textContent = '•';

    const trackB = document.createElement('span');
    trackB.className = 'marquee-track';
    trackB.textContent = songTitle;

    const inner = document.createElement('span');
    inner.className = 'marquee-inner';
    inner.append(trackA, gap, trackB);

    spotifySongEl.textContent = '';
    spotifySongEl.appendChild(inner);
    spotifySongEl.classList.add('is-marquee');

    const shift = Math.max(80, trackA.offsetWidth + gap.offsetWidth);
    const duration = Math.max(7, Math.min(14, shift / 32));
    spotifySongEl.style.setProperty('--marquee-shift', `${shift}px`);
    spotifySongEl.style.setProperty('--marquee-duration', `${duration}s`);
  });
}

function getOutageStart() {
  try {
    const value = Number(window.localStorage.getItem(OUTAGE_START_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function setOutageStartIfMissing() {
  try {
    if (!window.localStorage.getItem(OUTAGE_START_KEY)) {
      window.localStorage.setItem(OUTAGE_START_KEY, String(Date.now()));
    }
  } catch {
    // ignore storage errors
  }
}

function clearOutageStart() {
  try {
    window.localStorage.removeItem(OUTAGE_START_KEY);
  } catch {
    // ignore storage errors
  }
}

function isLanyardStale() {
  const outageStart = getOutageStart();
  return Boolean(outageStart && Date.now() - outageStart >= LANYARD_STALE_MS);
}

function setLanyardWarningState(isStale) {
  if (discordPanelEl) {
    discordPanelEl.classList.toggle('data-stale', isStale);
  }
  if (discordWarningEl) {
    discordWarningEl.classList.toggle('hidden', !isStale);
  }
}

async function loadDiscordStatus() {
  try {
    const response = await fetch(`https://api.lanyard.rest/v1/users/${USER_ID}?t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });
    const payload = await response.json();

    if (!payload.success || !payload.data) {
      throw new Error('Invalid Lanyard response');
    }

    setPresenceStatus(payload.data.discord_status);
    setActivity(payload.data.activities);
    setDiscordUser(payload.data.discord_user);
    setSpotify(payload.data.spotify, payload.data.listening_to_spotify);
    markFirstLanyardSuccess();
    clearOutageStart();
    setLanyardWarningState(false);
  } catch {
    setOutageStartIfMissing();
    const staleOutage = isLanyardStale();
    setLanyardWarningState(staleOutage);
    setPresenceStatus('offline');
    if (activityTextEl) {
      activityTextEl.textContent = staleOutage
        ? 'Data unavailable for over 5 seconds'
        : 'Could not load status';
    }
    setSpotify(null, false);
  }
}




function setupAutoReload() {
  if (isContactPath(window.location.pathname)) {
    return;
  }

  window.setInterval(() => {
    window.location.reload();
  }, AUTO_RELOAD_MS);
}

function setupFeedbackForm() {
  const form = document.getElementById('feedbackForm');
  const nameEl = document.getElementById('feedbackName');
  const messageEl = document.getElementById('feedbackMessage');
  const statusEl = document.getElementById('feedbackStatus');
  const toggleBtn = document.getElementById('feedbackToggleBtn');
  const panelEl = document.getElementById('feedbackPanel');

  if (!form || !nameEl || !messageEl || !statusEl) {
    return;
  }

  const syncTextareaHeight = () => {
    const maxHeight = 300;
    messageEl.style.height = 'auto';
    const nextHeight = Math.min(messageEl.scrollHeight, maxHeight);
    messageEl.style.height = `${nextHeight}px`;
    messageEl.style.overflowY = messageEl.scrollHeight > maxHeight ? 'auto' : 'hidden';
  };

  syncTextareaHeight();
  messageEl.addEventListener('input', syncTextareaHeight);

  if (toggleBtn && panelEl) {
    const setPanelState = (isOpen) => {
      panelEl.classList.toggle('is-collapsed', !isOpen);
      toggleBtn.textContent = isOpen ? 'Close' : 'Open';
      toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

      if (isOpen) {
        window.setTimeout(syncTextareaHeight, 120);
      }
    };

    setPanelState(false);
    toggleBtn.addEventListener('click', () => {
      const isOpen = panelEl.classList.contains('is-collapsed');
      setPanelState(isOpen);
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = nameEl.value.trim();
    const feedback = messageEl.value.trim();

    if (!name || !feedback) {
      statusEl.textContent = 'Please enter your name and feedback.';
      statusEl.className = 'feedback-status err';
      return;
    }

    const loweredName = name.toLowerCase();
    const hasBlockedTerm = FEEDBACK_BLOCKED_TERMS.some((term) => loweredName.includes(term));
    if (hasBlockedTerm) {
      statusEl.textContent = 'Please use a different name.';
      statusEl.className = 'feedback-status err';
      return;
    }

    statusEl.textContent = 'Sending feedback...';
    statusEl.className = 'feedback-status';

    const safeName = name.slice(0, 256);
    const safeFeedback = feedback.slice(0, 1000);
    const payload = {
      username: 'Website Feedback',
      embeds: [
        {
          title: 'New feedback from contact page',
          color: 10247679,
          fields: [
            { name: 'Name', value: safeName || '-', inline: false },
            { name: 'Message', value: safeFeedback || '-', inline: false },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    };

    try {
      const response = await fetch(FEEDBACK_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed (${response.status})`);
      }

      statusEl.textContent = 'Feedback sent. Thank you!';
      statusEl.className = 'feedback-status ok';
      form.reset();
      syncTextareaHeight();
    } catch {
      statusEl.textContent = 'Could not send feedback. Please try again.';
      statusEl.className = 'feedback-status err';
    }
  });
}

async function loadSiteConfig() {
  const candidates = ['config.json', '../config.json', '../../config.json'];

  for (const path of candidates) {
    try {
      const response = await fetch(path, { cache: 'no-store' });
      if (!response.ok) {
        continue;
      }

      const raw = await response.json();
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return { ...DEFAULT_SITE_CONFIG };
      }

      return { ...DEFAULT_SITE_CONFIG, ...raw };
    } catch {
      // try next path
    }
  }

  return { ...DEFAULT_SITE_CONFIG };
}

function applySiteConfig(config) {
  const feedbackBlockEl = document.getElementById('feedbackBlock');
  if (feedbackBlockEl) {
    if (config.feedback === false) {
      feedbackBlockEl.classList.add('hidden');
    } else {
      feedbackBlockEl.classList.remove('hidden');
    }
  }
}

function setupProjectCards() {
  const cards = document.querySelectorAll('.project-card--interactive');
  if (!cards.length) {
    return;
  }

  const openProjectPage = (card) => {
    const slug = card.getAttribute('data-project');
    if (!slug) {
      return;
    }
    window.location.href = `projects/${slug}/`;
  };

  cards.forEach((card) => {
    card.addEventListener('click', (event) => {
      if (event.target instanceof Element && event.target.closest('a')) {
        return;
      }
      openProjectPage(card);
    });

    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openProjectPage(card);
      }
    });
  });
}

if (statusTextEl && activityTextEl && dotEl) {
  loadDiscordStatus();
  setInterval(loadDiscordStatus, 5000);
}

setupAutoReload();
setupProjectCards();

void (async () => {
  const config = await loadSiteConfig();
  applySiteConfig(config);
  if (config.feedback !== false) {
    setupFeedbackForm();
  }
})();
