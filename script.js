function setupPageLoader() {
  const existingLoader = document.querySelector('.page-loader');
  if (existingLoader || !document.body) {
    return;
  }

  document.body.classList.add('is-loading');

  const loader = document.createElement('div');
  loader.className = 'page-loader';
  loader.setAttribute('aria-hidden', 'true');
  loader.innerHTML = `
    <div class="page-loader__inner">
      <div class="page-loader__spinner"></div>
      <p class="page-loader__text">Loading assets...</p>
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

  window.addEventListener('load', closeLoader, { once: true });
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
      (ctrlOrCmd && event.shiftKey && (key === 'i' || key === 'j' || key === 'c')) ||
      key === 'f12';

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
const AUTO_RELOAD_MS = 60000;
const statusTextEl = document.getElementById('discordStatusText');
const activityTextEl = document.getElementById('discordActivityText');
const dotEl = document.getElementById('discordDot');
const usernameEl = document.getElementById('discordUsername');
const avatarEl = document.getElementById('discordAvatar');
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

  if (!isListeningToSpotify || !spotifyData) {
    spotifyNowEl.classList.add('hidden');
    return;
  }

  spotifyNowEl.classList.remove('hidden');
  spotifySongEl.textContent = spotifyData.song || 'Unknown song';
  spotifyArtistEl.textContent = spotifyData.artist || 'Unknown artist';

  if (spotifyData.album_art_url) {
    spotifyArtworkEl.src = spotifyData.album_art_url;
  }
}

async function loadDiscordStatus() {
  try {
    const response = await fetch(`https://api.lanyard.rest/v1/users/${USER_ID}?t=${Date.now()}`, {
      cache: 'no-store',
    });
    const payload = await response.json();

    if (!payload.success || !payload.data) {
      throw new Error('Invalid Lanyard response');
    }

    setPresenceStatus(payload.data.discord_status);
    setActivity(payload.data.activities);
    setDiscordUser(payload.data.discord_user);
    setSpotify(payload.data.spotify, payload.data.listening_to_spotify);
  } catch {
    setPresenceStatus('offline');
    if (activityTextEl) {
      activityTextEl.textContent = 'Could not load status';
    }
    setSpotify(null, false);
  }
}

function setupAutoReload() {
  window.setInterval(() => {
    window.location.reload();
  }, AUTO_RELOAD_MS);
}

if (statusTextEl && activityTextEl && dotEl) {
  loadDiscordStatus();
  setInterval(loadDiscordStatus, 20000);
}

setupAutoReload();
