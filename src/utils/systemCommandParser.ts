import { SystemActionCommand } from '../types';

export interface LaunchResult {
  opened: boolean;
  blockedByPopup: boolean;
}

/**
 * Executes direct launch of target system URL.
 * Attempts window.open and fallback link dispatch.
 */
export function launchSystemUrl(url: string): LaunchResult {
  if (!url || typeof window === 'undefined') return { opened: false, blockedByPopup: false };

  try {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      return { opened: false, blockedByPopup: true };
    }
    try {
      win.focus();
    } catch {}
    return { opened: true, blockedByPopup: false };
  } catch (err) {
    console.log('[System Action] Popup blocked by browser policy:', err);
    return { opened: false, blockedByPopup: true };
  }
}

/**
 * Advanced Multi-Lingual System Action Parser for J.A.R.V.I.S.
 * Understands natural English, Hindi, and Hinglish voice/text commands to control apps, websites, and internal systems.
 */
export function parseSystemAction(rawInput: string): SystemActionCommand | null {
  if (!rawInput || typeof rawInput !== 'string') return null;

  const text = rawInput.trim();
  let lower = text.toLowerCase()
    .replace(/[?.!,;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Strip conversational wrappers & common filler words (e.g. "open google so", "hey jarvis please open youtube")
  let clean = lower
    .replace(/^(?:hey|ok|okay|hi|hello)?\s*jarvis\s*,?\s*/i, '')
    .replace(/^(?:please|kripya|bhai|can you|could you|would you|just)\s+/i, '')
    .replace(/\s+(?:please|so|na|bhai|now|jaldi|sir|for me|na yaar|karo na)$/i, '')
    .trim();

  // 1. YOUTUBE COMMANDS ("youtube kholo", "open youtube", "youtube chalao", "search youtube for ...", "play ... on youtube")
  const isYoutubeOpen =
    clean === 'youtube kholo' ||
    clean === 'open youtube' ||
    clean === 'launch youtube' ||
    clean === 'youtube chalao' ||
    clean === 'yt kholo' ||
    clean === 'open yt' ||
    clean === 'start youtube' ||
    clean === 'youtube open karo' ||
    clean === 'kholo youtube' ||
    clean === 'youtube' ||
    clean.startsWith('open youtube') ||
    clean.startsWith('youtube khol');

  // Check if it's a YouTube search / playback command
  const ytSearchMatch =
    clean.match(/(?:search youtube for|youtube par search karo|youtube pe search karo|search on youtube for)\s+(.+)/i) ||
    clean.match(/(?:play|chalao|sunao)\s+(.+)\s+(?:on youtube|youtube par|youtube pe)/i) ||
    clean.match(/(?:youtube par|youtube pe)\s+(.+)\s+(?:chalao|search karo|play karo|sunao)/i);

  if (ytSearchMatch && ytSearchMatch[1]) {
    const query = ytSearchMatch[1].trim();
    return {
      id: `sys-${Date.now()}`,
      type: 'search_web',
      target: 'YouTube',
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      label: `Searching YouTube for "${query}"`,
      category: 'youtube',
      voiceResponse: `Searching YouTube for ${query}, sir. Launching player now.`,
      timestamp: new Date().toLocaleTimeString()
    };
  }

  if (isYoutubeOpen || clean.includes('youtube') || clean === 'yt') {
    const isSongRequest = clean.includes('gana') || clean.includes('song') || clean.includes('music') || clean.includes('video');
    return {
      id: `sys-${Date.now()}`,
      type: 'open_url',
      target: 'YouTube',
      url: 'https://www.youtube.com',
      label: isSongRequest ? 'Opening YouTube Music & Video Matrix' : 'Opening YouTube',
      category: 'youtube',
      voiceResponse: 'Right away, sir. Opening YouTube for you now.',
      timestamp: new Date().toLocaleTimeString()
    };
  }

  // 2. GOOGLE & GENERAL SEARCH COMMANDS ("google kholo", "open google", "open google so", "search google for ...")
  const googleSearchMatch =
    clean.match(/(?:search google for|google par search karo|google pe search karo|search on google for|google search)\s+(.+)/i) ||
    clean.match(/(?:search for|dhoondho|pata lagao)\s+(.+)\s+(?:on google|google par)/i);

  if (googleSearchMatch && googleSearchMatch[1]) {
    const query = googleSearchMatch[1].trim();
    return {
      id: `sys-${Date.now()}`,
      type: 'search_web',
      target: 'Google Search',
      url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      label: `Searching Google for "${query}"`,
      category: 'google',
      voiceResponse: `Searching Google archives for ${query}, sir.`,
      timestamp: new Date().toLocaleTimeString()
    };
  }

  const isGoogleOpen =
    clean === 'google kholo' ||
    clean === 'open google' ||
    clean === 'launch google' ||
    clean === 'google open karo' ||
    clean === 'kholo google' ||
    clean === 'google' ||
    clean.startsWith('open google') ||
    clean.startsWith('google khol');

  if (isGoogleOpen || clean.includes('google')) {
    return {
      id: `sys-${Date.now()}`,
      type: 'open_url',
      target: 'Google',
      url: 'https://www.google.com',
      label: 'Opening Google Search',
      category: 'google',
      voiceResponse: 'Opening Google portal, sir.',
      timestamp: new Date().toLocaleTimeString()
    };
  }

  // 3. SPOTIFY / MUSIC COMMANDS ("spotify kholo", "gaana chalao", "play music", "music chalao")
  if (
    lower === 'spotify kholo' ||
    lower === 'open spotify' ||
    lower === 'gaana chalao' ||
    lower === 'gana chalao' ||
    lower === 'gaane sunao' ||
    lower === 'play music' ||
    lower === 'music chalao' ||
    lower === 'spotify chalao' ||
    lower.includes('spotify')
  ) {
    const songMatch = lower.match(/(?:play|chalao|sunao)\s+(.+)\s+(?:on spotify|spotify par)/i);
    const query = songMatch ? songMatch[1].trim() : '';
    const url = query
      ? `https://open.spotify.com/search/${encodeURIComponent(query)}`
      : 'https://open.spotify.com';

    return {
      id: `sys-${Date.now()}`,
      type: 'open_url',
      target: 'Spotify',
      url,
      label: query ? `Playing "${query}" on Spotify` : 'Opening Spotify Music Matrix',
      category: 'spotify',
      voiceResponse: query
        ? `Accessing Spotify for ${query}, sir.`
        : 'Accessing audio telemetry on Spotify, sir.',
      timestamp: new Date().toLocaleTimeString()
    };
  }

  // 4. GITHUB COMMANDS ("github kholo", "open github")
  if (lower === 'github kholo' || lower === 'open github' || lower === 'open git' || lower === 'git kholo') {
    return {
      id: `sys-${Date.now()}`,
      type: 'open_url',
      target: 'GitHub',
      url: 'https://github.com',
      label: 'Opening GitHub Repositories',
      category: 'github',
      voiceResponse: 'Opening your GitHub repository console, sir.',
      timestamp: new Date().toLocaleTimeString()
    };
  }

  // 5. CHATGPT & GEMINI ("chatgpt kholo", "open chatgpt", "gemini kholo")
  if (lower === 'chatgpt kholo' || lower === 'open chatgpt' || lower === 'open openai') {
    return {
      id: `sys-${Date.now()}`,
      type: 'open_url',
      target: 'ChatGPT',
      url: 'https://chatgpt.com',
      label: 'Opening ChatGPT Interface',
      category: 'ai',
      voiceResponse: 'Establishing link to secondary neural network, sir.',
      timestamp: new Date().toLocaleTimeString()
    };
  }

  if (lower === 'gemini kholo' || lower === 'open gemini') {
    return {
      id: `sys-${Date.now()}`,
      type: 'open_url',
      target: 'Google Gemini',
      url: 'https://gemini.google.com',
      label: 'Opening Google Gemini',
      category: 'ai',
      voiceResponse: 'Opening Gemini intelligence core, sir.',
      timestamp: new Date().toLocaleTimeString()
    };
  }

  // 6. WHATSAPP & SOCIALS
  if (lower === 'whatsapp kholo' || lower === 'open whatsapp' || lower === 'wa kholo') {
    return {
      id: `sys-${Date.now()}`,
      type: 'open_url',
      target: 'WhatsApp Web',
      url: 'https://web.whatsapp.com',
      label: 'Opening WhatsApp Web',
      category: 'social',
      voiceResponse: 'Opening WhatsApp communications uplink, sir.',
      timestamp: new Date().toLocaleTimeString()
    };
  }

  if (lower === 'instagram kholo' || lower === 'open instagram' || lower === 'insta kholo' || lower === 'open insta') {
    return {
      id: `sys-${Date.now()}`,
      type: 'open_url',
      target: 'Instagram',
      url: 'https://www.instagram.com',
      label: 'Opening Instagram Feed',
      category: 'social',
      voiceResponse: 'Opening Instagram for you, sir.',
      timestamp: new Date().toLocaleTimeString()
    };
  }

  if (lower === 'twitter kholo' || lower === 'open twitter' || lower === 'x kholo' || lower === 'open x') {
    return {
      id: `sys-${Date.now()}`,
      type: 'open_url',
      target: 'X / Twitter',
      url: 'https://x.com',
      label: 'Opening X (Twitter) Feed',
      category: 'social',
      voiceResponse: 'Connecting to X feed, sir.',
      timestamp: new Date().toLocaleTimeString()
    };
  }

  if (lower === 'netflix kholo' || lower === 'open netflix') {
    return {
      id: `sys-${Date.now()}`,
      type: 'open_url',
      target: 'Netflix',
      url: 'https://www.netflix.com',
      label: 'Opening Netflix Cinema',
      category: 'social',
      voiceResponse: 'Preparing entertainment sequence on Netflix, sir.',
      timestamp: new Date().toLocaleTimeString()
    };
  }

  if (lower === 'reddit kholo' || lower === 'open reddit') {
    return {
      id: `sys-${Date.now()}`,
      type: 'open_url',
      target: 'Reddit',
      url: 'https://www.reddit.com',
      label: 'Opening Reddit Archives',
      category: 'social',
      voiceResponse: 'Accessing Reddit forums, sir.',
      timestamp: new Date().toLocaleTimeString()
    };
  }

  // 7. GMAIL / MAIL
  if (lower === 'gmail kholo' || lower === 'open gmail' || lower === 'mail kholo' || lower === 'email kholo' || lower === 'open email') {
    return {
      id: `sys-${Date.now()}`,
      type: 'open_url',
      target: 'Gmail',
      url: 'https://mail.google.com',
      label: 'Opening Google Mail Inbox',
      category: 'tool',
      voiceResponse: 'Accessing your primary mail inbox, sir.',
      timestamp: new Date().toLocaleTimeString()
    };
  }

  // 8. GOOGLE MAPS
  if (lower === 'maps kholo' || lower === 'open maps' || lower === 'google maps kholo' || lower === 'open google maps') {
    return {
      id: `sys-${Date.now()}`,
      type: 'open_url',
      target: 'Google Maps',
      url: 'https://maps.google.com',
      label: 'Opening Global Geospatial Maps',
      category: 'tool',
      voiceResponse: 'Initializing satellite navigation grid, sir.',
      timestamp: new Date().toLocaleTimeString()
    };
  }

  // 9. CALCULATOR
  if (lower === 'calculator kholo' || lower === 'open calculator') {
    return {
      id: `sys-${Date.now()}`,
      type: 'open_url',
      target: 'Calculator',
      url: 'https://www.google.com/search?q=calculator',
      label: 'Opening Mathematical Calculator',
      category: 'tool',
      voiceResponse: 'Displaying calculation console, sir.',
      timestamp: new Date().toLocaleTimeString()
    };
  }

  // 10. GENERIC URL LAUNCHER ("open [anything].com" or "[site] kholo")
  const openGenericMatch = lower.match(/^(?:open|launch|kholo)\s+([a-z0-9-]+(?:\.[a-z]{2,})+)/i) ||
                           lower.match(/^([a-z0-9-]+(?:\.[a-z]{2,}))\s+(?:kholo|open karo)/i);
  if (openGenericMatch && openGenericMatch[1]) {
    const domain = openGenericMatch[1];
    const url = domain.startsWith('http') ? domain : `https://${domain}`;
    return {
      id: `sys-${Date.now()}`,
      type: 'open_url',
      target: domain,
      url,
      label: `Opening ${domain}`,
      category: 'tool',
      voiceResponse: `Directing browser to ${domain}, sir.`,
      timestamp: new Date().toLocaleTimeString()
    };
  }

  // 11. IN-APP J.A.R.V.I.S. SYSTEM CONTROLS
  // Screen vision / Eyes
  if (
    lower === 'screen dekho' ||
    lower === 'screen check karo' ||
    lower === 'inspect screen' ||
    lower === 'eyes on' ||
    lower === 'dekho screen' ||
    lower === 'screen inspect karo'
  ) {
    return {
      id: `sys-${Date.now()}`,
      type: 'system_control',
      target: 'SCREEN_VISION',
      label: 'Engaging Optical Screen Inspection',
      category: 'internal',
      voiceResponse: 'Optical sensors calibrated, sir. Inspecting screen frame now.',
      timestamp: new Date().toLocaleTimeString()
    };
  }

  // Audio Mute / Unmute
  if (
    lower === 'chup ho jao' ||
    lower === 'mute' ||
    lower === 'shant raho' ||
    lower === 'awaz band karo' ||
    lower === 'be quiet' ||
    lower === 'silence'
  ) {
    return {
      id: `sys-${Date.now()}`,
      type: 'system_control',
      target: 'MUTE_AUDIO',
      label: 'Muting Butler Voice Output',
      category: 'internal',
      voiceResponse: 'Silencing audio output, sir.',
      timestamp: new Date().toLocaleTimeString()
    };
  }

  if (
    lower === 'unmute' ||
    lower === 'awaz chalu karo' ||
    lower === 'boliye' ||
    lower === 'speak'
  ) {
    return {
      id: `sys-${Date.now()}`,
      type: 'system_control',
      target: 'UNMUTE_AUDIO',
      label: 'Unmuting Butler Voice Output',
      category: 'internal',
      voiceResponse: 'Vocal synthesizers restored to full volume, sir.',
      timestamp: new Date().toLocaleTimeString()
    };
  }

  // Diagnostics
  if (
    lower === 'diagnostics kholo' ||
    lower === 'system check' ||
    lower === 'system check karo' ||
    lower === 'diagnostics run karo' ||
    lower === 'run diagnostics'
  ) {
    return {
      id: `sys-${Date.now()}`,
      type: 'system_control',
      target: 'OPEN_DIAGNOSTICS',
      label: 'Running J.A.R.V.I.S. Core Diagnostics',
      category: 'internal',
      voiceResponse: 'Initiating full diagnostic telemetry scan, sir.',
      timestamp: new Date().toLocaleTimeString()
    };
  }

  // Brain Swap
  if (
    lower === 'model change karo' ||
    lower === 'brain switch karo' ||
    lower === 'swap brain' ||
    lower === 'brain swap kholo' ||
    lower === 'change model'
  ) {
    return {
      id: `sys-${Date.now()}`,
      type: 'system_control',
      target: 'OPEN_BRAIN_SWAP',
      label: 'Opening Neural Brain Matrix',
      category: 'internal',
      voiceResponse: 'Opening neural model selector, sir.',
      timestamp: new Date().toLocaleTimeString()
    };
  }

  // View modes
  if (lower === 'galaxy view' || lower === 'galaxy dikhao' || lower === 'show galaxy') {
    return {
      id: `sys-${Date.now()}`,
      type: 'system_control',
      target: 'VIEW_GALAXY',
      label: 'Switching to 3D Galaxy Map',
      category: 'internal',
      voiceResponse: 'Rendering 3D knowledge galaxy, sir.',
      timestamp: new Date().toLocaleTimeString()
    };
  }

  if (lower === 'core view' || lower === 'reactor view' || lower === 'reactor dikhao' || lower === 'show core') {
    return {
      id: `sys-${Date.now()}`,
      type: 'system_control',
      target: 'VIEW_CORE',
      label: 'Switching to Arc Reactor Core HUD',
      category: 'internal',
      voiceResponse: 'Aligning focus with primary Arc Reactor core, sir.',
      timestamp: new Date().toLocaleTimeString()
    };
  }

  if (lower === 'hybrid view' || lower === 'hybrid dikhao' || lower === 'show hybrid') {
    return {
      id: `sys-${Date.now()}`,
      type: 'system_control',
      target: 'VIEW_HYBRID',
      label: 'Switching to Hybrid Tactical View',
      category: 'internal',
      voiceResponse: 'Enabling dual-layer tactical HUD, sir.',
      timestamp: new Date().toLocaleTimeString()
    };
  }

  return null;
}
