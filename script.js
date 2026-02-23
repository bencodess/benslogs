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
const statusTextEl = document.getElementById('discordStatusText');
const activityTextEl = document.getElementById('discordActivityText');
const dotEl = document.getElementById('discordDot');
const usernameEl = document.getElementById('discordUsername');
const avatarEl = document.getElementById('discordAvatar');

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

async function loadDiscordStatus() {
  try {
    const response = await fetch(`https://api.lanyard.rest/v1/users/${USER_ID}`);
    const payload = await response.json();

    if (!payload.success || !payload.data) {
      throw new Error('Invalid Lanyard response');
    }

    setPresenceStatus(payload.data.discord_status);
    setActivity(payload.data.activities);
    setDiscordUser(payload.data.discord_user);
  } catch {
    setPresenceStatus('offline');
    if (activityTextEl) {
      activityTextEl.textContent = 'Could not load status';
    }
  }
}

if (statusTextEl && activityTextEl && dotEl) {
  loadDiscordStatus();
  setInterval(loadDiscordStatus, 20000);
}
