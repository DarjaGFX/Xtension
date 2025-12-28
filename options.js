document.getElementById('save').addEventListener('click', async () => {
  const bearerToken = document.getElementById('bearerToken').value;
  await chrome.storage.sync.set({ bearerToken });
  const status = document.getElementById('status');
  status.textContent = 'Saved!';
  setTimeout(() => { status.textContent = ''; }, 2000);
});

// Load existing token
chrome.storage.sync.get('bearerToken', ({ bearerToken }) => {
  document.getElementById('bearerToken').value = bearerToken || '';
});