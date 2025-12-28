# Twitter Location Revealer

A Chrome extension that displays user location information on Twitter/X tweets.

## Features

- Automatically fetches user location data from the X.com API
- Displays location info next to each tweet's username
- Caches location data to reduce API calls
- Works with tweets, replies, and retweets
- Non-intrusive display format: `username | based in [location]`

## Installation

1. **Load the extension in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the extension folder containing `manifest.json`

2. **Usage:**
   - Navigate to https://x.com or https://twitter.com
   - The extension will automatically start showing location info for tweets
   - Location data is fetched from the official X.com API

## Files

- `manifest.json` - Extension configuration
- `content.js` - Main script that injects location data into tweets
- `background.js` - Service worker for extension lifecycle management

## How it Works

1. The content script monitors the DOM for new tweets
2. For each tweet, it extracts the author's screen name
3. It sends a request to the X.com AboutAccountQuery API endpoint
4. The location is extracted and displayed next to the username
5. Results are cached to improve performance

## Notes

- The extension requires the page to have loaded successfully
- Location data comes from user profiles on X.com
- The extension respects X.com's API rate limiting
- Requires active internet connection to fetch location data
## Caution

- **Rate Limiting:** This extension can hit X.com's API rate limits very quickly. Rapid scrolling through many tweets will likely trigger temporary blocks.
- **Usage Tip:** To ensure consistent performance, scroll through the feed slowly and do not rush. This allows the extension to stay within rate limits and effectively utilize its cache.
