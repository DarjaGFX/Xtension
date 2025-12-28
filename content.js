// Unique ID for custom events to avoid conflicts
const EVENT_PREFIX = 'xtension_';

// In-memory cache: handle -> { status: 'pending'|'done'|'error', location: string }
let locationCache = new Map();

// Helper: load persisted map from chrome.storage.local key 'xt_locations'
function loadStoredMap() {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get(['xt_locations'], (res) => {
        const obj = res.xt_locations || {};
        for (const [key, value] of Object.entries(obj)) {
          locationCache.set(key, value);
        }
        resolve();
      });
    } catch (error) {
      console.error('Error loading stored map:', error);
      resolve();
    }
  });
}

// Helper: persist current map to chrome.storage.local
function saveStoredMap() {
  try {
    const obj = Object.fromEntries(locationCache);
    chrome.storage.local.set({ xt_locations: obj });
  } catch (error) {
    console.error('Error saving stored map:', error);
  }
}

// Function to inject the page script if not already done
function injectPageScript() {
  if (document.getElementById('xtension-page-script')) return;
  const script = document.createElement('script');
  script.id = 'xtension-page-script';
  script.src = chrome.runtime.getURL('page.js');
  document.head.appendChild(script);
}

// Listen for responses from page script
window.addEventListener(EVENT_PREFIX + 'location_fetched', (event) => {
  const { handle, location } = event.detail;
  if (!handle) return;

  // Save to cache and persist
  locationCache.set(handle, { status: 'done', location: location || '' });
  saveStoredMap();

  // Update any visible tweets for this handle
  updateVisibleTweets(handle, location || '');
});

// Request flow using persistent storage to avoid duplicates
async function getUserLocation(handle) {
  // If we have a record
  if (locationCache.has(handle)) {
    const rec = locationCache.get(handle);
    if (rec && rec.status === 'done') return rec.location || '';
    // If pending or error, do not send another request
    return null;
  }

  // Not present: mark pending in cache + persist, then dispatch fetch
  locationCache.set(handle, { status: 'pending', location: '' });
  saveStoredMap();

  const event = new CustomEvent(EVENT_PREFIX + 'fetch_location', { detail: { handle } });
  window.dispatchEvent(event);

  return null; // caller should wait for event to provide location via updateVisibleTweets
}

// Update visible tweets for a handle with provided location
function updateVisibleTweets(handle, location) {
  if (!handle) return;
  const tweets = document.querySelectorAll('[data-testid="tweet"]');
  tweets.forEach((tweet) => {
    try {
      // find handle link
      const anchors = tweet.querySelectorAll('a[href^="/"]');
      let found = false;
      for (const a of anchors) {
        const href = a.getAttribute('href');
        if (href && new RegExp('^\\/' + handle + '$').test(href)) {
          found = true;
          break;
        }
      }
      if (!found) return;

      // ensure not already injected near time
      const timeEl = tweet.querySelector('time');
      if (!timeEl) return;
      const container = timeEl.closest('a')?.parentElement || timeEl.parentElement;
      if (!container) return;
      if (container.querySelector('.xtension-location-time')) return;

      // insert location
      const span = document.createElement('span');
      span.className = 'xtension-location-time';
      span.textContent = ` . ${location}`;
      span.style.color = '#657786';
      span.style.marginLeft = '6px';
      span.style.fontSize = '0.95em';
      container.insertBefore(span, container.querySelector('time')?.nextSibling || null);
    } catch (e) {
      // ignore per-tweet failures
    }
  });
}

// Function to process a single tweet element
async function processTweet(tweet) {
  // get handle
  const nameElement = tweet.querySelector('[data-testid="User-Name"]');
  if (!nameElement) return;

  const handleLink = nameElement.querySelector('a[href^="/"]');
  if (!handleLink) return;
  const handle = handleLink.getAttribute('href').slice(1);

  if (!handle) return;

  // If we already injected for this tweet near the time, skip
  const timeElCheck = tweet.querySelector('time');
  if (timeElCheck) {
    const container = timeElCheck.closest('a')?.parentElement || timeElCheck.parentElement;
    if (container && container.querySelector('.xtension-location-time')) return;
  }

  // If we have a stored done location, add it immediately to this tweet
  if (locationCache.has(handle)) {
    const rec = locationCache.get(handle);
    if (rec && rec.status === 'done' && rec.location) {
      addLocationToTweet(tweet, rec.location);
      return;
    }
    // if pending or error, do nothing (request already in-flight)
    return;
  }

  // Not present in storage: mark pending and dispatch request
  await getUserLocation(handle);
}

// Insert location span into a specific tweet element (if not already present)
function addLocationToTweet(tweet, location) {
  try {
    if (!location) return;
    const timeEl = tweet.querySelector('time');
    if (!timeEl) return;
    const container = timeEl.closest('a')?.parentElement || timeEl.parentElement;
    if (!container) return;
    if (container.querySelector('.xtension-location-time')) return;

    const span = document.createElement('span');
    span.className = 'xtension-location-time';
    span.textContent = ` . ${location}`;
    span.style.color = '#657786';
    span.style.marginLeft = '6px';
    span.style.fontSize = '0.95em';
    container.insertBefore(span, timeEl.nextSibling);
  } catch (e) {
    // ignore
  }
}

// Function to process all tweets on the page (only those without location added)
function processAllTweets() {
  const tweets = document.querySelectorAll('[data-testid="tweet"]:not([data-xtension-processed])');
  tweets.forEach((tweet) => {
    processTweet(tweet);
    tweet.setAttribute('data-xtension-processed', 'true'); // Mark as processed to avoid re-processing
  });
}

// MutationObserver to detect new tweets
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.getAttribute('data-testid') === 'tweet' && !node.getAttribute('data-xtension-processed')) {
            processTweet(node);
            node.setAttribute('data-xtension-processed', 'true');
          } else {
            const newTweets = node.querySelectorAll('[data-testid="tweet"]:not([data-xtension-processed])');
            newTweets.forEach((tweet) => {
              processTweet(tweet);
              tweet.setAttribute('data-xtension-processed', 'true');
            });
          }
        }
      });
    }
  });
});

// Start observing the timeline container
function initObserver() {
  const timeline = document.querySelector('[data-testid="primaryColumn"]');
  if (timeline) {
    observer.observe(timeline, { childList: true, subtree: true });
    processAllTweets();
  } else {
    setTimeout(initObserver, 500);
  }
}

// Initialize: load stored map first, then inject page script and start observer
(async function init() {
  await loadStoredMap();
  injectPageScript();
  initObserver();
})();