// Background service worker for handling extension lifecycle
chrome.runtime.onInstalled.addListener(() => {
  console.log('Twitter Location Revealer extension installed');
});
