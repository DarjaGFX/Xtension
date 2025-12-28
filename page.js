// Page script: Runs in page context with access to cookies/auth
const EVENT_PREFIX = 'xtension_';

window.addEventListener(EVENT_PREFIX + 'fetch_location', async (event) => {
  const handle = event.detail.handle;
  try {
    // Extract CSRF token from cookies
    const csrfToken = document.cookie.split('; ').find(row => row.startsWith('ct0='))?.split('=')[1] || '';
                 
    const url = 'https://x.com/i/api/graphql/zs_jFPFT78rBpXv9Z3U2YQ/AboutAccountQuery';
    const variables = {
      screenName: handle
    //   withSafetyModeUserFields: true
    };
    const features = {
      hidden_profile_likes_enabled: true,
      hidden_profile_subscriptions_enabled: true,
      responsive_web_graphql_exclude_directive_enabled: true,
      verified_phone_label_enabled: false,
      subscriptions_verification_info_is_identity_verified_enabled: true,
      subscriptions_verification_info_verified_since_enabled: true,
      highlights_tweets_tab_ui_enabled: true,
      responsive_web_twitter_article_notes_tab_enabled: true,
      creator_subscriptions_tweet_preview_api_enabled: true,
      responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
      responsive_web_graphql_timeline_navigation_enabled: true
    };
    const fieldToggles = {
      withAuxiliaryUserLabels: false
    };
    const queryString = '?variables=' + encodeURIComponent(JSON.stringify(variables));// +
    //   '&features=' + encodeURIComponent(JSON.stringify(features)) +
    //   '&fieldToggles=' + encodeURIComponent(JSON.stringify(fieldToggles));
    const response = await fetch(url + queryString, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
        'x-csrf-token': csrfToken
      },
      credentials: 'include' // Ensures cookies are sent
    });
    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
    const json = await response.json();
    const location = json.data?.user_result_by_screen_name?.result?.about_profile?.account_based_in || '';
    const customEvent = new CustomEvent(EVENT_PREFIX + 'location_fetched', { detail: { handle, location } });
    window.dispatchEvent(customEvent);
  } catch (error) {
    console.error('Error fetching location:', error);
    const customEvent = new CustomEvent(EVENT_PREFIX + 'location_fetched', { detail: { handle, location: '' } });
    window.dispatchEvent(customEvent);
  }
});