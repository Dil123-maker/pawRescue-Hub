/* ==========================================
   PawRescue Hub - Application Logic
   Features: LocalStorage, BroadcastChannel Chat,
   Leaflet Maps, Image Compression.
   ========================================== */

// App State
const state = {
  sightings: [],
  chats: [],
  heroes: [],
  privateChats: {},
  currentChatPartner: null,
  isLoggedIn: true,
  totalDonated: 0,
  currentUser: {
    username: 'RescueAngel',
    avatarSeed: 'RescueHero'
  },
  map: {
    main: null,
    miniPicker: null,
    miniDetail: null,
    mainMarkers: {},
    pickerMarker: null,
    detailMarker: null,
    detailTempMarker: null
  },
  currentDetailId: null,
  activeFilter: 'all',
  searchQuery: '',
  theme: 'dark-theme',
  isSharingLocation: false,
  watchId: null,
  activeVolunteers: {}
};

// Initial Mock Heroes
const MOCK_HEROES = [
  { username: 'VetSarah', avatarSeed: 'RescueHero', rescuesCount: 5 },
  { username: 'StreetAngel', avatarSeed: 'StreetAngel', rescuesCount: 3 },
  { username: 'PawsPatrol', avatarSeed: 'CatSaver', rescuesCount: 2 }
];

// Initial Mock Data
const MOCK_SIGHTINGS = [
  {
    id: 'mock-1',
    type: 'puppy',
    urgency: 'urgent',
    status: 'urgent',
    lat: 40.7829,
    lng: -73.9654,
    address: 'Central Park West & 81st St, New York',
    description: 'A small brown puppy shivering under a park bench near the trees. It seems extremely cold and scared, and is backing away if approached. Needs food and someone with a crate.',
    photo: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600',
    contact: 'Mark (Phone: 555-0143)',
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    comments: [
      { author: 'VolunteerSarah', text: 'I am nearby, going to check if it is still there.', time: new Date(Date.now() - 1800000).toISOString() },
      { author: 'VolunteerSarah', text: 'Spotted it! It ran into the bushes. I have put some wet food down.', time: new Date(Date.now() - 1200000).toISOString() }
    ]
  },
  {
    id: 'mock-2',
    type: 'kitten',
    urgency: 'normal',
    status: 'normal',
    lat: 40.7580,
    lng: -73.9855,
    address: 'Times Square Subway Station Exit (42nd St)',
    description: 'Found a tiny calico kitten hiding behind the newsstand booth. It is vocal but very fearful. It has no visible injuries but is covered in soot.',
    photo: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600',
    contact: 'Lisa (Email: lisa.save@email.com)',
    timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    comments: []
  },
  {
    id: 'mock-3',
    type: 'kitten',
    urgency: 'safe',
    status: 'rescued',
    lat: 40.7061,
    lng: -73.9969,
    address: 'Under Brooklyn Bridge (Manhattan Side Walkway)',
    description: 'Black and white kitten seen wandering roadside. A local volunteer has safely caught it and transported it to the Downtown Vet Clinic.',
    photo: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&q=80&w=600',
    contact: 'Anonymous Sighting',
    timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    comments: [
      { author: 'PawsPatrol', text: 'Successfully secured! Transporting to vet now.', time: new Date(Date.now() - 80000000).toISOString() },
      { author: 'PawsPatrol', text: 'Vet says he is healthy! Up for adoption soon.', time: new Date(Date.now() - 70000000).toISOString() }
    ]
  }
];

const MOCK_CHAT_MESSAGES = [
  { id: 'chat-m1', author: 'VetSarah', avatar: 'RescueHero', text: 'Welcome to the PawTalk Rescue Chat! Use this feed to coordinate rides, veterinary care, and food drops.', time: new Date(Date.now() - 10000000).toISOString(), isSystem: false },
  { id: 'chat-m2', author: 'StreetAngel', avatar: 'StreetAngel', text: 'Does anyone have a spare pet carrier near Central Park? Mark needs help catching that puppy.', time: new Date(Date.now() - 3000000).toISOString(), isSystem: false },
  { id: 'chat-m3', author: 'PawsLover', avatar: 'PawsLover', text: 'I have one and can drive it over in 15 minutes! Will coordinate with Sarah.', time: new Date(Date.now() - 2500000).toISOString(), isSystem: false }
];

// BroadcastChannel for cross-tab sync
const chatChannel = new BroadcastChannel('pawrescue_chat_channel');
const sightingChannel = new BroadcastChannel('pawrescue_sighting_channel');

// Default Leaflet Icons using FontAwesome & DivIcon
let kittenMarkerIcon, puppyMarkerIcon, pickerMarkerIcon, volunteerMarkerIcon;

function initLeafletIcons() {
  kittenMarkerIcon = L.divIcon({
    html: '<div class="custom-marker marker-kitten"><i class="fa-solid fa-cat"></i></div>',
    className: 'leaflet-custom-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });

  puppyMarkerIcon = L.divIcon({
    html: '<div class="custom-marker marker-puppy"><i class="fa-solid fa-dog"></i></div>',
    className: 'leaflet-custom-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });

  pickerMarkerIcon = L.divIcon({
    html: '<div class="custom-marker marker-temp"><i class="fa-solid fa-location-crosshairs"></i></div>',
    className: 'leaflet-custom-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });

  volunteerMarkerIcon = L.divIcon({
    html: `
      <div class="volunteer-map-pin">
        <div class="pulse-ring"></div>
        <i class="fa-solid fa-person-running"></i>
      </div>
    `,
    className: 'leaflet-volunteer-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
}

// ----------------------------------------------------
// Startup / Initialization
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initLeafletIcons();
  loadTheme();
  loadUserProfile();
  initLocalStorageData();
  
  // Render main maps and lists
  initMainMap();
  renderSightingGrid();
  renderChatMessages();
  updateDashboardStats();
  renderRescueHeroes();

  // Populate mock volunteers on startup
  initializeMockActiveVolunteers();

  // Attach event listeners
  setupEventListeners();
  
  // Setup real-time simulation bot
  startVolunteerBotInterval();
});

// ----------------------------------------------------
// State & Storage Initialization
// ----------------------------------------------------
function initLocalStorageData() {
  // Load sightings
  const storedSightings = localStorage.getItem('pawrescue_sightings');
  if (storedSightings) {
    state.sightings = JSON.parse(storedSightings);
  } else {
    state.sightings = [...MOCK_SIGHTINGS];
    localStorage.setItem('pawrescue_sightings', JSON.stringify(state.sightings));
  }

  // Load chats
  const storedChats = localStorage.getItem('pawrescue_chats');
  if (storedChats) {
    state.chats = JSON.parse(storedChats);
  } else {
    state.chats = [...MOCK_CHAT_MESSAGES];
    localStorage.setItem('pawrescue_chats', JSON.stringify(state.chats));
  }

  // Load heroes
  const storedHeroes = localStorage.getItem('pawrescue_heroes');
  if (storedHeroes) {
    state.heroes = JSON.parse(storedHeroes);
  } else {
    state.heroes = [...MOCK_HEROES];
    localStorage.setItem('pawrescue_heroes', JSON.stringify(state.heroes));
  }

  // Load private DMs
  const storedPrivateChats = localStorage.getItem('pawrescue_private_chats');
  if (storedPrivateChats) {
    state.privateChats = JSON.parse(storedPrivateChats);
  } else {
    state.privateChats = {};
    localStorage.setItem('pawrescue_private_chats', JSON.stringify(state.privateChats));
  }

  // Load isLoggedIn state (default true as guest)
  const storedLoggedInStatus = localStorage.getItem('pawrescue_logged_in');
  if (storedLoggedInStatus !== null) {
    state.isLoggedIn = storedLoggedInStatus === 'true';
  } else {
    state.isLoggedIn = true;
  }

  // Load donation totals
  state.totalDonated = parseFloat(localStorage.getItem('pawrescue_total_donated') || '0');
}

// ----------------------------------------------------
// Maps Logic
// ----------------------------------------------------
function initMainMap() {
  const mapCenter = [40.75, -73.98]; // Default NYC Midtown
  
  // Main Dashboard Map
  state.map.main = L.map('rescue-map').setView(mapCenter, 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(state.map.main);

  // Sync sightings onto map
  refreshMapMarkers();

  // Create Modal Picker Map (initialize hidden, size is invalidated when modal opens)
  state.map.miniPicker = L.map('modal-map-picker').setView(mapCenter, 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(state.map.miniPicker);

  // Picker Click Handler
  state.map.miniPicker.on('click', (e) => {
    const { lat, lng } = e.latlng;
    updatePickerLocation(lat, lng);
  });

  // Modal Detail Map
  state.map.miniDetail = L.map('modal-detail-map').setView(mapCenter, 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(state.map.miniDetail);

  // Detail Map Click Handler (for relocation mode)
  state.map.miniDetail.on('click', (e) => {
    if (!state.relocationMode) return;
    const { lat, lng } = e.latlng;
    document.getElementById('relocate-lat-text').innerText = lat.toFixed(6);
    document.getElementById('relocate-lng-text').innerText = lng.toFixed(6);

    if (state.map.detailTempMarker) {
      state.map.detailTempMarker.setLatLng([lat, lng]);
    } else {
      state.map.detailTempMarker = L.marker([lat, lng], { icon: pickerMarkerIcon }).addTo(state.map.miniDetail);
    }
  });
}

function updatePickerLocation(lat, lng) {
  document.getElementById('input-latitude').value = lat.toFixed(6);
  document.getElementById('input-longitude').value = lng.toFixed(6);

  if (state.map.pickerMarker) {
    state.map.pickerMarker.setLatLng([lat, lng]);
  } else {
    state.map.pickerMarker = L.marker([lat, lng], { icon: pickerMarkerIcon }).addTo(state.map.miniPicker);
  }
  state.map.miniPicker.panTo([lat, lng]);
}

function refreshMapMarkers() {
  // Clear existing markers
  for (let id in state.map.mainMarkers) {
    state.map.main.removeLayer(state.map.mainMarkers[id]);
  }
  state.map.mainMarkers = {};

  // Add sightings matching filters
  const filtered = filterSightingsList();
  filtered.forEach(s => {
    if (s.status === 'rescued') return; // Do not show rescued stray pins on main map to keep it clean for emergencies, or keep them with low opacity.
    
    const icon = s.type === 'kitten' ? kittenMarkerIcon : puppyMarkerIcon;
    const marker = L.marker([s.lat, s.lng], { icon: icon });
    
    // Custom popup
    const popupContent = `
      <div class="map-popup">
        <h4 style="margin: 0 0 4px 0; color: ${s.type === 'kitten' ? 'var(--color-kitten)' : 'var(--color-puppy)'}; text-transform: capitalize;">
          <i class="${s.type === 'kitten' ? 'fa-solid fa-cat' : 'fa-solid fa-dog'}"></i> ${s.type} reported
        </h4>
        <p style="font-size: 11px; margin: 0 0 6px 0; font-weight: bold; color: var(--text-main);"><i class="fa-solid fa-location-dot" style="color:var(--color-urgent);"></i> ${s.address}</p>
        <button class="btn btn-sm btn-primary" onclick="openSightingDetail('${s.id}')" style="padding: 2px 8px; font-size: 10px; width: 100%;">View Sighting</button>
      </div>
    `;
    
    marker.bindPopup(popupContent);
    marker.addTo(state.map.main);
    state.map.mainMarkers[s.id] = marker;
  });
}

// ----------------------------------------------------
// UI Render Functions
// ----------------------------------------------------
function updateDashboardStats() {
  const urgent = state.sightings.filter(s => s.status === 'urgent').length;
  const active = state.sightings.filter(s => s.status !== 'rescued').length;
  const rescued = state.sightings.filter(s => s.status === 'rescued').length;

  document.getElementById('stat-urgent').innerText = urgent;
  document.getElementById('stat-active').innerText = active;
  document.getElementById('stat-rescued').innerText = rescued;
}

function filterSightingsList() {
  return state.sightings.filter(s => {
    // Type Filter
    const matchesFilter = 
      state.activeFilter === 'all' || 
      (state.activeFilter === 'kitten' && s.type === 'kitten') ||
      (state.activeFilter === 'puppy' && s.type === 'puppy') ||
      (state.activeFilter === 'urgent' && s.status === 'urgent');

    // Search Query (Location or Address)
    const matchesSearch = 
      s.address.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(state.searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });
}

function renderSightingGrid() {
  const container = document.getElementById('sighting-grid-container');
  const emptyState = document.getElementById('feed-empty-state');
  
  // Clear dynamic cards
  const existingCards = container.querySelectorAll('.sighting-card');
  existingCards.forEach(c => c.remove());

  const filtered = filterSightingsList();
  document.getElementById('sighting-count').innerText = `Showing ${filtered.length} reports`;

  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');

  // Sort: active/urgent first, then chronological
  filtered.sort((a, b) => {
    if (a.status === 'urgent' && b.status !== 'urgent') return -1;
    if (b.status === 'urgent' && a.status !== 'urgent') return 1;
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  filtered.forEach(s => {
    const card = document.createElement('div');
    card.className = `sighting-card glass-panel`;
    card.setAttribute('onclick', `openSightingDetail('${s.id}')`);

    const dateStr = formatRelativeTime(s.timestamp);

    // Format photo
    const imageSrc = s.photo || 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=600';

    card.innerHTML = `
      <div class="card-img-box">
        <span class="badge badge-${s.type} badge-left">${s.type}</span>
        <span class="badge urgency-indicator ${s.status} badge-right">${s.status}</span>
        <img src="${imageSrc}" alt="${s.type}">
      </div>
      <div class="card-content">
        <div class="card-address">
          <i class="fa-solid fa-location-dot"></i>
          <span>${s.address}</span>
        </div>
        <p class="card-desc">${s.description}</p>
        <div class="card-assignee" style="font-size: 0.7rem; font-weight: 700; color: var(--color-secondary); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.3rem;">
          <i class="fa-solid fa-user-shield"></i>
          <span>${s.allocatedTo && s.allocatedTo !== 'unassigned' ? 'Assigned: ' + s.allocatedTo : 'Unassigned'}</span>
        </div>
        <div class="card-footer">
          <span><i class="fa-regular fa-clock"></i> ${dateStr}</span>
          <span class="status-badge ${s.status}">${s.status}</span>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

function renderChatMessages() {
  const box = document.getElementById('chat-messages-box');
  box.innerHTML = '';

  state.chats.forEach(msg => {
    const msgElement = document.createElement('div');
    
    if (msg.isSystem) {
      msgElement.className = 'chat-msg system';
      msgElement.innerHTML = `
        <div class="chat-msg-bubble">
          <span class="system-text">${msg.text}</span>
        </div>
      `;
    } else {
      const isSelf = msg.author === state.currentUser.username;
      msgElement.className = `chat-msg ${isSelf ? 'self' : ''}`;
      
      const timeStr = new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.avatar}`;

      // Check if message references a sighting ID
      let sightingCardHtml = '';
      if (msg.sightingRef) {
        const ref = state.sightings.find(s => s.id === msg.sightingRef);
        if (ref) {
          sightingCardHtml = `
            <div class="chat-sighting-card" onclick="event.stopPropagation(); openSightingDetail('${ref.id}')">
              <img src="${ref.photo}" class="chat-sighting-thumb">
              <div class="chat-sighting-info">
                <span class="chat-sighting-title">${ref.type.toUpperCase()} alert: ${ref.status.toUpperCase()}</span>
                <span class="chat-sighting-loc">${ref.address}</span>
              </div>
            </div>
          `;
        }
      }

      msgElement.innerHTML = `
        <div class="chat-msg-avatar">
          <img src="${avatarUrl}" alt="${msg.author} Avatar">
        </div>
        <div class="chat-msg-bubble">
          <div class="chat-msg-header">
            <span class="msg-author">${msg.author}</span>
            <span class="msg-time">${timeStr}</span>
          </div>
          <p class="msg-text">${escapeHTML(msg.text)}</p>
          ${sightingCardHtml}
        </div>
      `;
    }

    box.appendChild(msgElement);
  });

  // Scroll to bottom
  box.scrollTop = box.scrollHeight;
}

// ----------------------------------------------------
// Details Modal Logic
// ----------------------------------------------------
window.openSightingDetail = function(id) {
  const sighting = state.sightings.find(s => s.id === id);
  if (!sighting) return;

  state.currentDetailId = id;

  // Title & Badges
  const detailTitle = document.getElementById('detail-title');
  detailTitle.innerHTML = `<span class="badge badge-${sighting.type}">${sighting.type}</span> Roadside Sighting`;

  // Image & Urgency Banner
  const detailImg = document.getElementById('detail-img');
  detailImg.src = sighting.photo || 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=600';
  
  const detailUrgencyBanner = document.getElementById('detail-urgency-banner');
  detailUrgencyBanner.innerText = `${sighting.status.toUpperCase()} STATUS`;
  detailUrgencyBanner.style.backgroundColor = `var(--color-${sighting.status})`;

  // Text details
  document.getElementById('detail-description-text').innerText = sighting.description;
  document.getElementById('detail-contact-text').innerText = sighting.contact || 'Anonymous Sighting';
  document.getElementById('detail-time-text').innerText = new Date(sighting.timestamp).toLocaleString();
  document.getElementById('detail-address-text').innerText = sighting.address;

  // Dropdown selector state
  document.getElementById('update-sighting-status-select').value = sighting.status;

  // Load allocation state
  const allocatedVal = sighting.allocatedTo || 'unassigned';
  const responderSelect = document.getElementById('allocate-responder-select');
  if (allocatedVal === state.currentUser.username) {
    responderSelect.value = 'self';
  } else if (['paws-patrol', 'hope-shelter', 'vet-clinic', 'unassigned'].includes(allocatedVal)) {
    responderSelect.value = allocatedVal;
  } else {
    // If it's a custom volunteer name
    let optionExists = false;
    for (let i = 0; i < responderSelect.options.length; i++) {
      if (responderSelect.options[i].value === allocatedVal) {
        optionExists = true;
        break;
      }
    }
    if (!optionExists) {
      const opt = document.createElement('option');
      opt.value = allocatedVal;
      opt.innerText = allocatedVal;
      responderSelect.appendChild(opt);
    }
    responderSelect.value = allocatedVal;
  }

  // Reset relocation mode UI
  document.getElementById('relocation-input-panel').classList.add('hidden');
  const relocateBtn = document.getElementById('toggle-relocation-mode-btn');
  relocateBtn.classList.remove('btn-primary');
  relocateBtn.classList.add('btn-outline');
  relocateBtn.innerHTML = '<i class="fa-solid fa-map-pin"></i> Relocate Animal';
  state.relocationMode = false;
  if (state.map.detailTempMarker) {
    state.map.miniDetail.removeLayer(state.map.detailTempMarker);
    state.map.detailTempMarker = null;
  }

  // Google Maps Directions link
  const gmapsLink = document.getElementById('detail-gmaps-link');
  gmapsLink.href = `https://www.google.com/maps/dir/?api=1&destination=${sighting.lat},${sighting.lng}`;

  // Render comments
  renderDetailComments(sighting.comments);

  // Render nearest volunteers relative to this sighting
  renderNearestVolunteers(sighting);

  // Show Modal
  const modal = document.getElementById('detail-modal');
  modal.classList.remove('hidden');

  // Trigger leaflet redraw
  setTimeout(() => {
    state.map.miniDetail.invalidateSize();
    state.map.miniDetail.setView([sighting.lat, sighting.lng], 14);
    
    if (state.map.detailMarker) {
      state.map.detailMarker.setLatLng([sighting.lat, sighting.lng]);
    } else {
      const icon = sighting.type === 'kitten' ? kittenMarkerIcon : puppyMarkerIcon;
      state.map.detailMarker = L.marker([sighting.lat, sighting.lng], { icon: icon }).addTo(state.map.miniDetail);
    }
  }, 100);
};

function renderDetailComments(comments = []) {
  const container = document.getElementById('detail-comments-container');
  container.innerHTML = '';
  
  if (comments.length === 0) {
    container.innerHTML = `<div style="font-size:11px; text-align:center; color:var(--text-muted); padding:1rem;">No updates yet. Add a comment if you check on this animal!</div>`;
    return;
  }

  comments.forEach(c => {
    const bubble = document.createElement('div');
    bubble.className = 'comment-bubble';
    
    const timeStr = formatRelativeTime(c.time);
    bubble.innerHTML = `
      <div class="comment-meta">
        <span>${c.author}</span>
        <span class="comment-time">${timeStr}</span>
      </div>
      <div class="comment-text">${escapeHTML(c.text)}</div>
    `;
    container.appendChild(bubble);
  });
  
  container.scrollTop = container.scrollHeight;
}

// ----------------------------------------------------
// Event Handlers & Forms
// ----------------------------------------------------
function setupEventListeners() {
  // Modal togglers
  const reportModal = document.getElementById('report-modal');
  const detailModal = document.getElementById('detail-modal');

  document.getElementById('report-trigger-btn').addEventListener('click', () => {
    reportModal.classList.remove('hidden');
    // Invalidate Leaflet to redraw inside visible container
    setTimeout(() => {
      state.map.miniPicker.invalidateSize();
      // Try to get user GPS location to auto center
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            updatePickerLocation(latitude, longitude);
          },
          () => {
            // Default Midtown NYC fallback
            updatePickerLocation(40.75, -73.98);
          }
        );
      }
    }, 100);
  });

  document.getElementById('empty-state-report-btn').addEventListener('click', () => {
    document.getElementById('report-trigger-btn').click();
  });

  document.getElementById('close-report-modal').addEventListener('click', () => {
    reportModal.classList.add('hidden');
  });

  document.getElementById('cancel-report-btn').addEventListener('click', () => {
    reportModal.classList.add('hidden');
  });

  document.getElementById('close-detail-modal').addEventListener('click', () => {
    detailModal.classList.add('hidden');
  });

  // GPS Trigger in Form
  document.getElementById('use-gps-btn').addEventListener('click', () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        updatePickerLocation(latitude, longitude);
      }, () => {
        alert('Could not retrieve GPS location. Please click the map.');
      });
    }
  });

  // Submit Report Sighting Form
  document.getElementById('sighting-form').addEventListener('submit', handleReportFormSubmit);

  // Search input event
  document.getElementById('search-input').addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderSightingGrid();
  });

  // Filters click handler
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach(b => b.classList.remove('active'));
      const activeBtn = e.currentTarget;
      activeBtn.classList.add('active');
      state.activeFilter = activeBtn.dataset.filter;
      renderSightingGrid();
      refreshMapMarkers();
    });
  });

  // Chat message submit
  document.getElementById('chat-send-form').addEventListener('submit', handleChatSubmit);

  // Profile Modal setup
  document.getElementById('profile-edit-btn').addEventListener('click', openProfileModal);
  document.getElementById('close-profile-modal').addEventListener('click', closeProfileModal);
  document.getElementById('profile-modal-cancel-btn').addEventListener('click', closeProfileModal);
  
  // Auth Tab triggers inside Profile Modal
  document.getElementById('auth-tab-signin').addEventListener('click', () => toggleAuthTabs('signin'));
  document.getElementById('auth-tab-signup').addEventListener('click', () => toggleAuthTabs('signup'));
  
  // Auth Forms
  document.getElementById('signin-form').addEventListener('submit', handleSignInSubmit);
  document.getElementById('signup-form').addEventListener('submit', handleSignUpSubmit);
  document.getElementById('quick-guest-login-btn').addEventListener('click', handleQuickGuestLogin);
  document.getElementById('profile-logout-btn').addEventListener('click', handleProfileLogout);
  document.getElementById('profile-modal-save-btn').addEventListener('click', handleProfileSave);

  // Avatar Selection inside Profile Modal
  const profileAvatarOptions = document.querySelectorAll('#profile-avatar-options-box .avatar-option');
  profileAvatarOptions.forEach(opt => {
    opt.addEventListener('click', (e) => {
      profileAvatarOptions.forEach(o => o.classList.remove('active'));
      e.target.classList.add('active');
    });
  });

  // Top Navbar Navigation Tabs
  const navTabs = document.querySelectorAll('.nav-tab');
  navTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      navTabs.forEach(t => t.classList.remove('active'));
      e.currentTarget.classList.add('active');
      switchNavigationTab(e.currentTarget.dataset.tab);
    });
  });

  // Donation Tier Card Selector
  const tierCards = document.querySelectorAll('.tier-card');
  tierCards.forEach(card => {
    card.addEventListener('click', (e) => {
      tierCards.forEach(c => {
        c.classList.remove('active');
        c.style.borderColor = 'var(--border-color)';
        c.style.background = 'transparent';
      });
      const activeCard = e.currentTarget;
      activeCard.classList.add('active');
      activeCard.style.borderColor = 'var(--color-primary)';
      activeCard.style.background = 'rgba(245, 158, 11, 0.08)';
      
      const amt = activeCard.dataset.amount;
      document.getElementById('custom-donate-amount').value = '';
      document.getElementById('donate-btn-amount-text').innerText = `$${parseFloat(amt).toFixed(2)}`;
    });
  });

  // Custom Donation Amount change listener
  document.getElementById('custom-donate-amount').addEventListener('input', (e) => {
    const amt = parseFloat(e.target.value);
    if (!isNaN(amt) && amt > 0) {
      tierCards.forEach(c => {
        c.classList.remove('active');
        c.style.borderColor = 'var(--border-color)';
        c.style.background = 'transparent';
      });
      document.getElementById('donate-btn-amount-text').innerText = `$${amt.toFixed(2)}`;
    } else {
      const firstCard = tierCards[0];
      firstCard.classList.add('active');
      firstCard.style.borderColor = 'var(--color-primary)';
      firstCard.style.background = 'rgba(245, 158, 11, 0.08)';
      document.getElementById('donate-btn-amount-text').innerText = `$${parseFloat(firstCard.dataset.amount).toFixed(2)}`;
    }
  });

  // Donation Checkout submit form
  document.getElementById('donation-checkout-form').addEventListener('submit', handleDonationCheckoutSubmit);
  document.getElementById('success-panel-close-btn').addEventListener('click', resetDonationSectionToDashboard);

  // Image Drag & Drop Logic
  setupImageUploadEvents();

  // Status Updater inside Detail View
  document.getElementById('save-status-btn').addEventListener('click', handleDetailStatusUpdate);

  // Sighting Comment Form inside Detail View
  document.getElementById('detail-comment-submit-form').addEventListener('submit', handleDetailCommentSubmit);

  // Allocation & Relocation inside Detail View
  document.getElementById('save-allocation-btn').addEventListener('click', handleAllocationUpdate);
  document.getElementById('toggle-relocation-mode-btn').addEventListener('click', toggleRelocationMode);
  document.getElementById('cancel-relocation-btn').addEventListener('click', () => {
    document.getElementById('relocation-input-panel').classList.add('hidden');
    const btn = document.getElementById('toggle-relocation-mode-btn');
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-outline');
    btn.innerHTML = '<i class="fa-solid fa-map-pin"></i> Relocate Animal';
    state.relocationMode = false;
    if (state.map.detailTempMarker) {
      state.map.miniDetail.removeLayer(state.map.detailTempMarker);
      state.map.detailTempMarker = null;
    }
  });
  document.getElementById('submit-relocation-btn').addEventListener('click', handleRelocationSubmit);

  // Photo Update Event Listeners
  const detailPhotoInput = document.getElementById('detail-photo-input');
  document.getElementById('trigger-photo-update-btn').addEventListener('click', () => {
    detailPhotoInput.click();
  });
  detailPhotoInput.addEventListener('change', handleDetailPhotoChange);

  // Live Geolocation Tracking Button
  document.getElementById('live-location-btn').addEventListener('click', handleLiveLocationToggle);

  // Unload handler to clean up sharing if they close the tab
  window.addEventListener('beforeunload', () => {
    if (state.isSharingLocation && state.watchId !== null) {
      navigator.geolocation.clearWatch(state.watchId);
      sightingChannel.postMessage({ type: 'VOLUNTEER_STOP', username: state.currentUser.username });
    }
  });

  // Private DM Chat Event Listeners
  document.getElementById('close-private-chat-modal').addEventListener('click', () => {
    document.getElementById('private-chat-modal').classList.add('hidden');
    state.currentChatPartner = null;
  });
  document.getElementById('private-send-form').addEventListener('submit', handlePrivateChatSubmit);

  // Theme Toggle Button
  document.getElementById('theme-toggle-btn').addEventListener('click', toggleThemeMode);
}

// ----------------------------------------------------
// Image Upload Processing & Compression
// ----------------------------------------------------
function setupImageUploadEvents() {
  const container = document.getElementById('image-drag-container');
  const input = document.getElementById('image-file-input');
  const previewBox = document.getElementById('image-preview-box');
  const previewImg = document.getElementById('image-preview-element');
  const removeBtn = document.getElementById('remove-preview-btn');

  container.addEventListener('click', (e) => {
    if (e.target !== removeBtn && !removeBtn.contains(e.target)) {
      input.click();
    }
  });

  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    container.style.borderColor = 'var(--color-primary)';
  });

  container.addEventListener('dragleave', () => {
    container.style.borderColor = 'var(--border-color)';
  });

  container.addEventListener('drop', (e) => {
    e.preventDefault();
    container.style.borderColor = 'var(--border-color)';
    if (e.dataTransfer.files.length > 0) {
      processImageFile(e.dataTransfer.files[0]);
    }
  });

  input.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      processImageFile(e.target.files[0]);
    }
  });

  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    input.value = '';
    previewImg.src = '';
    previewBox.classList.add('hidden');
    container.querySelector('i').classList.remove('hidden');
    container.querySelector('p').classList.remove('hidden');
  });
}

function processImageFile(file) {
  if (!file.type.startsWith('image/')) {
    alert('Please upload an image file.');
    return;
  }

  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (event) => {
    const img = new Image();
    img.src = event.target.result;
    img.onload = () => {
      // Compress image using HTML5 Canvas to max 600px width/height
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      const MAX_SIZE = 600;

      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Export compressed base64
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85); // 85% quality Jpeg
      
      const previewBox = document.getElementById('image-preview-box');
      const previewImg = document.getElementById('image-preview-element');
      const container = document.getElementById('image-drag-container');

      previewImg.src = compressedDataUrl;
      previewBox.classList.remove('hidden');
      container.querySelector('i').classList.add('hidden');
      container.querySelector('p').classList.add('hidden');
    };
  };
}

// ----------------------------------------------------
// Form Action Handlers
// ----------------------------------------------------
function handleReportFormSubmit(e) {
  e.preventDefault();

  const type = document.querySelector('input[name="animal-type"]:checked').value;
  const urgency = document.getElementById('sighting-urgency').value;
  const lat = parseFloat(document.getElementById('input-latitude').value);
  const lng = parseFloat(document.getElementById('input-longitude').value);
  const address = document.getElementById('sighting-address').value;
  const description = document.getElementById('sighting-description').value;
  const contact = document.getElementById('sighting-contact').value || 'Anonymous Sighting';
  const previewImg = document.getElementById('image-preview-element');
  const photo = previewImg.src || '';

  if (isNaN(lat) || isNaN(lng)) {
    alert('Please click on the mini map to specify the animal location.');
    return;
  }

  const newSighting = {
    id: 'sighting-' + Date.now(),
    type,
    urgency,
    status: urgency, // Initial status equals urgency
    lat,
    lng,
    address,
    description,
    photo,
    contact,
    timestamp: new Date().toISOString(),
    comments: []
  };

  // Prepend to array
  state.sightings.unshift(newSighting);
  localStorage.setItem('pawrescue_sightings', JSON.stringify(state.sightings));

  // Render & Update UI
  renderSightingGrid();
  refreshMapMarkers();
  updateDashboardStats();

  // Broadcast to other tabs
  sightingChannel.postMessage({ type: 'NEW_SIGHTING', sighting: newSighting });

  // Share inside the public chat automatically to coordinate help
  sendSightingShareMessage(newSighting);

  // Close Modal and Reset Form
  document.getElementById('report-modal').classList.add('hidden');
  e.target.reset();
  
  // Clear map markers and preview boxes
  document.getElementById('remove-preview-btn').click();
  if (state.map.pickerMarker) {
    state.map.miniPicker.removeLayer(state.map.pickerMarker);
    state.map.pickerMarker = null;
  }
}

function handleDetailStatusUpdate() {
  if (!state.currentDetailId) return;

  const newStatus = document.getElementById('update-sighting-status-select').value;
  const index = state.sightings.findIndex(s => s.id === state.currentDetailId);
  
  if (index !== -1) {
    const sighting = state.sightings[index];
    const oldStatus = sighting.status;
    sighting.status = newStatus;
    
    // Check if status changed to rescued -> award Hero status!
    if (newStatus === 'rescued' && oldStatus !== 'rescued') {
      const rescuer = (sighting.allocatedTo && sighting.allocatedTo !== 'unassigned') ? sighting.allocatedTo : state.currentUser.username;
      awardHeroRescue(rescuer);
    }
    
    // Auto system comment
    sighting.comments.push({
      author: 'System Notice',
      text: `Status updated from "${oldStatus}" to "${newStatus}" by ${state.currentUser.username}`,
      time: new Date().toISOString()
    });

    localStorage.setItem('pawrescue_sightings', JSON.stringify(state.sightings));
    
    // Rerender UI details
    renderSightingGrid();
    refreshMapMarkers();
    updateDashboardStats();
    renderDetailComments(sighting.comments);
    
    // Sync status banner
    const detailUrgencyBanner = document.getElementById('detail-urgency-banner');
    detailUrgencyBanner.innerText = `${newStatus.toUpperCase()} STATUS`;
    detailUrgencyBanner.style.backgroundColor = `var(--color-${newStatus})`;

    // Broadcast status change
    sightingChannel.postMessage({ type: 'SIGHTING_UPDATE', sighting: sighting });

    // Send system message in public chat
    sendPublicChatSystemMsg(`${state.currentUser.username} updated the status of the sighting in "${sighting.address}" to "${newStatus.toUpperCase()}".`);
  }
}

function handleDetailCommentSubmit(e) {
  e.preventDefault();
  if (!state.currentDetailId) return;

  const input = document.getElementById('detail-comment-input');
  const commentText = input.value.trim();
  if (!commentText) return;

  const index = state.sightings.findIndex(s => s.id === state.currentDetailId);
  if (index !== -1) {
    const sighting = state.sightings[index];
    const newComment = {
      author: state.currentUser.username,
      text: commentText,
      time: new Date().toISOString()
    };

    sighting.comments.push(newComment);
    localStorage.setItem('pawrescue_sightings', JSON.stringify(state.sightings));

    renderDetailComments(sighting.comments);
    input.value = '';

    // Broadcast comment update
    sightingChannel.postMessage({ type: 'SIGHTING_UPDATE', sighting: sighting });
  }
}

// ----------------------------------------------------
// Public Chat Logic
// ----------------------------------------------------
function handleChatSubmit(e) {
  e.preventDefault();

  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  const newMsg = {
    id: 'chat-' + Date.now(),
    author: state.currentUser.username,
    avatar: state.currentUser.avatarSeed,
    text: text,
    time: new Date().toISOString(),
    isSystem: false
  };

  state.chats.push(newMsg);
  localStorage.setItem('pawrescue_chats', JSON.stringify(state.chats));
  
  renderChatMessages();
  input.value = '';

  // Sync via BroadcastChannel
  chatChannel.postMessage({ type: 'CHAT_MSG', data: newMsg });
}

function sendSightingShareMessage(sighting) {
  const chatMsg = {
    id: 'chat-share-' + Date.now(),
    author: state.currentUser.username,
    avatar: state.currentUser.avatarSeed,
    text: `⚠️ Sighting Alert: I found a stray ${sighting.type} near "${sighting.address}". Please check out the card and coordinate rescue!`,
    time: new Date().toISOString(),
    sightingRef: sighting.id,
    isSystem: false
  };

  state.chats.push(chatMsg);
  localStorage.setItem('pawrescue_chats', JSON.stringify(state.chats));
  renderChatMessages();

  chatChannel.postMessage({ type: 'CHAT_MSG', data: chatMsg });
}

function sendPublicChatSystemMsg(text) {
  const sysMsg = {
    id: 'chat-sys-' + Date.now(),
    text: text,
    time: new Date().toISOString(),
    isSystem: true
  };

  state.chats.push(sysMsg);
  localStorage.setItem('pawrescue_chats', JSON.stringify(state.chats));
  renderChatMessages();
  
  chatChannel.postMessage({ type: 'CHAT_MSG', data: sysMsg });
}

// ----------------------------------------------------
// Volunteer Profile Logic
// ----------------------------------------------------
function loadUserProfile() {
  const storedUser = localStorage.getItem('pawrescue_user');
  if (storedUser) {
    state.currentUser = JSON.parse(storedUser);
  } else {
    // Generate semi-random names
    const suffix = Math.floor(Math.random() * 900 + 100);
    state.currentUser.username = `RescueHero_${suffix}`;
    state.currentUser.avatarSeed = `Seed_${suffix}`;
    localStorage.setItem('pawrescue_user', JSON.stringify(state.currentUser));
  }

  // Set Profile UI elements
  document.getElementById('header-username').innerText = state.currentUser.username;
  document.getElementById('header-avatar').src = `https://api.dicebear.com/7.x/bottts/svg?seed=${state.currentUser.avatarSeed}`;
  document.getElementById('username-input').value = state.currentUser.username;
  
  // Set avatar list active seed
  const avatarOpts = document.querySelectorAll('.avatar-option');
  avatarOpts.forEach(opt => {
    if (opt.dataset.seed === state.currentUser.avatarSeed) {
      opt.classList.add('active');
    } else {
      opt.classList.remove('active');
    }
  });
}

function saveUserProfileChanges() {
  const usernameInput = document.getElementById('username-input').value.trim();
  const activeAvatarElement = document.querySelector('.avatar-option.active');
  const avatarSeed = activeAvatarElement ? activeAvatarElement.dataset.seed : state.currentUser.avatarSeed;

  if (!usernameInput) {
    alert('Username cannot be empty.');
    return;
  }

  const oldUsername = state.currentUser.username;
  state.currentUser.username = usernameInput;
  state.currentUser.avatarSeed = avatarSeed;
  localStorage.setItem('pawrescue_user', JSON.stringify(state.currentUser));

  // Sync profile UI
  document.getElementById('header-username').innerText = state.currentUser.username;
  document.getElementById('header-avatar').src = `https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}`;

  // Hide customizer panel
  document.getElementById('profile-customizer').classList.add('hidden');

  // Emit a system message about name change
  if (oldUsername !== state.currentUser.username) {
    sendPublicChatSystemMsg(`"${oldUsername}" changed their nickname to "${state.currentUser.username}"`);
  }
}

// ----------------------------------------------------
// Theme Toggle Logic
// ----------------------------------------------------
function loadTheme() {
  const storedTheme = localStorage.getItem('pawrescue_theme');
  if (storedTheme) {
    state.theme = storedTheme;
  }
  document.body.className = state.theme;
  updateThemeButtonUI();
}

function toggleThemeMode() {
  if (state.theme === 'dark-theme') {
    state.theme = 'light-theme';
  } else {
    state.theme = 'dark-theme';
  }
  document.body.className = state.theme;
  localStorage.setItem('pawrescue_theme', state.theme);
  updateThemeButtonUI();
}

function updateThemeButtonUI() {
  const icon = document.getElementById('theme-toggle-btn').querySelector('i');
  if (state.theme === 'dark-theme') {
    icon.className = 'fa-solid fa-sun';
  } else {
    icon.className = 'fa-solid fa-moon';
  }
}

// ----------------------------------------------------
// BroadcastChannel Cross-Tab Synchronization
// ----------------------------------------------------
chatChannel.onmessage = (event) => {
  const { type, data } = event.data;
  if (type === 'CHAT_MSG') {
    state.chats.push(data);
    localStorage.setItem('pawrescue_chats', JSON.stringify(state.chats));
    renderChatMessages();
  }
  else if (type === 'PRIVATE_MSG') {
    const partner = data.sender === state.currentUser.username ? data.recipient : data.sender;
    if (!state.privateChats[partner]) {
      state.privateChats[partner] = [];
    }
    state.privateChats[partner].push(data);
    localStorage.setItem('pawrescue_private_chats', JSON.stringify(state.privateChats));
    
    if (state.currentChatPartner === partner) {
      renderPrivateMessages();
    }
  }
  else if (type === 'HEROES_UPDATE') {
    state.heroes = data;
    localStorage.setItem('pawrescue_heroes', JSON.stringify(state.heroes));
    renderRescueHeroes();
  }
};

sightingChannel.onmessage = (event) => {
  const msg = event.data;
  if (msg.type === 'NEW_SIGHTING') {
    state.sightings.unshift(msg.sighting);
    localStorage.setItem('pawrescue_sightings', JSON.stringify(state.sightings));
    
    renderSightingGrid();
    refreshMapMarkers();
    updateDashboardStats();
  } 
  else if (msg.type === 'SIGHTING_UPDATE') {
    const idx = state.sightings.findIndex(s => s.id === msg.sighting.id);
    if (idx !== -1) {
      state.sightings[idx] = msg.sighting;
      localStorage.setItem('pawrescue_sightings', JSON.stringify(state.sightings));
      
      renderSightingGrid();
      refreshMapMarkers();
      updateDashboardStats();
      
      // If currently open in detail modal
      if (state.currentDetailId === msg.sighting.id) {
        const sighting = msg.sighting;
        
        // Update status select & urgency banner
        document.getElementById('update-sighting-status-select').value = sighting.status;
        const banner = document.getElementById('detail-urgency-banner');
        banner.innerText = `${sighting.status.toUpperCase()} STATUS`;
        banner.style.backgroundColor = `var(--color-${sighting.status})`;

        // Update address & coordinates
        document.getElementById('detail-address-text').innerText = sighting.address;
        document.getElementById('detail-gmaps-link').href = `https://www.google.com/maps/dir/?api=1&destination=${sighting.lat},${sighting.lng}`;

        // Update allocation dropdown
        const allocatedVal = sighting.allocatedTo || 'unassigned';
        const responderSelect = document.getElementById('allocate-responder-select');
        if (allocatedVal === state.currentUser.username) {
          responderSelect.value = 'self';
        } else if (['paws-patrol', 'hope-shelter', 'vet-clinic', 'unassigned'].includes(allocatedVal)) {
          responderSelect.value = allocatedVal;
        } else {
          responderSelect.value = allocatedVal;
        }

        // Render comments
        renderDetailComments(sighting.comments);

        // Reposition miniDetail map pin
        if (state.map.detailMarker) {
          state.map.detailMarker.setLatLng([sighting.lat, sighting.lng]);
        }
        state.map.miniDetail.setView([sighting.lat, sighting.lng], 14);
      }
    }
  }
  else if (msg.type === 'VOLUNTEER_MOVE') {
    handleVolunteerMove(msg.username, msg.avatarSeed, msg.lat, msg.lng);
  }
  else if (msg.type === 'VOLUNTEER_STOP') {
    handleVolunteerStop(msg.username);
  }
};

// ----------------------------------------------------
// Active Volunteer Simulation Bots (Lively Chat Feed)
// ----------------------------------------------------
const MOCK_BOT_RESPONSES = [
  { author: 'StreetAngel', avatar: 'StreetAngel', message: 'Just got back from feeding the stray cat colony near Main St. Everyone seems healthy today!' },
  { author: 'KittenWhisperer', avatar: 'CatSaver', message: 'If anyone spots the calico kitten near Times Square, please message me here immediately. I have a rescue trap ready.' },
  { author: 'DoggoSaver', avatar: 'DogWalker', message: 'Heads up: There is lots of highway traffic near the 5th exit. If you spot stray dogs there, do not chase them; try to lure with food.' },
  { author: 'VetSarah', avatar: 'RescueHero', message: 'Our clinic has free veterinary screening slots for street rescues tomorrow morning between 9 AM and 11 AM.' },
  { author: 'PawsPatrol', avatar: 'StreetAngel', message: 'Successful transport! The black and white kitten from Brooklyn Bridge has been dropped off at the rescue center.' },
  { author: 'RescueWrangler', avatar: 'PawsLover', message: 'Just finished driving around Midtown. No new sightings spotted. Good job keeping the streets safe everyone!' },
  { author: 'StreetAngel', avatar: 'StreetAngel', message: 'Quick tip: Carrying canned tuna in your car is an absolute lifesaver for catching scared road-side kittens!' }
];

function startVolunteerBotInterval() {
  // Post initial welcome/update after 15 seconds, then every 30-40 seconds
  setTimeout(() => {
    triggerBotChat();
  }, 10000);

  setInterval(() => {
    triggerBotChat();
  }, 35000);
  
  // Randomly toggle online count slightly to look active
  setInterval(() => {
    const baseVal = 12;
    const flux = Math.floor(Math.random() * 5 - 2); // +/- 2
    document.getElementById('active-volunteers-text').innerText = `${baseVal + flux} Volunteers Online`;
  }, 12000);
}

function triggerBotChat() {
  const randomIndex = Math.floor(Math.random() * MOCK_BOT_RESPONSES.length);
  const botInfo = MOCK_BOT_RESPONSES[randomIndex];

  // Prevent bot from spamming if name matches currentUser
  if (botInfo.author === state.currentUser.username) return;

  const botMsg = {
    id: 'bot-chat-' + Date.now(),
    author: botInfo.author,
    avatar: botInfo.avatar,
    text: botInfo.message,
    time: new Date().toISOString(),
    isSystem: false
  };

  state.chats.push(botMsg);
  
  // Keep only last 100 chat messages to avoid bloating localStorage
  if (state.chats.length > 100) {
    state.chats.shift();
  }
  localStorage.setItem('pawrescue_chats', JSON.stringify(state.chats));

  renderChatMessages();

  // Sync to other tabs
  chatChannel.postMessage({ type: 'CHAT_MSG', data: botMsg });

  // Trigger movement simulation for certain bot profiles
  if (botInfo.author === 'KittenWhisperer' || botInfo.author === 'StreetAngel' || botInfo.author === 'PawsPatrol') {
    const target = state.sightings.find(s => s.status !== 'rescued');
    if (target) {
      startBotMovementSimulation(botInfo.author, botInfo.avatar, target);
    }
  }
}

// ----------------------------------------------------
// Utility Functions
// ----------------------------------------------------
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

function formatRelativeTime(dateIsoString) {
  const now = new Date();
  const ref = new Date(dateIsoString);
  const diffMs = now - ref;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return ref.toLocaleDateString();
}

// ----------------------------------------------------
// Allocation & Relocation Detail Modals Logic
// ----------------------------------------------------
function handleAllocationUpdate() {
  if (!state.currentDetailId) return;

  const select = document.getElementById('allocate-responder-select');
  let responderVal = select.value;
  
  if (responderVal === 'self') {
    responderVal = state.currentUser.username;
  }

  const index = state.sightings.findIndex(s => s.id === state.currentDetailId);
  if (index !== -1) {
    const sighting = state.sightings[index];
    const oldAllocation = sighting.allocatedTo || 'unassigned';
    sighting.allocatedTo = responderVal;

    // Log update
    const displayOld = oldAllocation === 'unassigned' ? 'Unassigned' : oldAllocation;
    const displayNew = responderVal === 'unassigned' ? 'Unassigned' : responderVal;

    sighting.comments.push({
      author: 'System Notice',
      text: `Rescue assignment updated from "${displayOld}" to "${displayNew}" by ${state.currentUser.username}`,
      time: new Date().toISOString()
    });

    localStorage.setItem('pawrescue_sightings', JSON.stringify(state.sightings));

    // Refresh UI
    renderSightingGrid();
    renderDetailComments(sighting.comments);

    // Broadcast update
    sightingChannel.postMessage({ type: 'SIGHTING_UPDATE', sighting: sighting });

    // Broadcast assignment change in public chat
    sendPublicChatSystemMsg(`${state.currentUser.username} assigned the rescue at "${sighting.address}" to "${displayNew}".`);
  }
}

function toggleRelocationMode() {
  if (!state.currentDetailId) return;

  const btn = document.getElementById('toggle-relocation-mode-btn');
  const panel = document.getElementById('relocation-input-panel');
  const sighting = state.sightings.find(s => s.id === state.currentDetailId);
  if (!sighting) return;

  state.relocationMode = !state.relocationMode;

  if (state.relocationMode) {
    btn.classList.remove('btn-outline');
    btn.classList.add('btn-primary');
    btn.innerHTML = '<i class="fa-solid fa-map-location-dot"></i> Relocation Active (Click Map)';
    panel.classList.remove('hidden');

    // Fill current coords
    document.getElementById('relocate-lat-text').innerText = sighting.lat.toFixed(6);
    document.getElementById('relocate-lng-text').innerText = sighting.lng.toFixed(6);
    document.getElementById('relocate-address-input').value = sighting.address;

    // Drop picker marker
    if (state.map.detailTempMarker) {
      state.map.detailTempMarker.setLatLng([sighting.lat, sighting.lng]);
    } else {
      state.map.detailTempMarker = L.marker([sighting.lat, sighting.lng], { icon: pickerMarkerIcon }).addTo(state.map.miniDetail);
    }
  } else {
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-outline');
    btn.innerHTML = '<i class="fa-solid fa-map-pin"></i> Relocate Animal';
    panel.classList.add('hidden');

    if (state.map.detailTempMarker) {
      state.map.miniDetail.removeLayer(state.map.detailTempMarker);
      state.map.detailTempMarker = null;
    }
  }
}

function handleRelocationSubmit() {
  if (!state.currentDetailId) return;

  const lat = parseFloat(document.getElementById('relocate-lat-text').innerText);
  const lng = parseFloat(document.getElementById('relocate-lng-text').innerText);
  const address = document.getElementById('relocate-address-input').value.trim();

  if (isNaN(lat) || isNaN(lng) || !address) {
    alert('Please click on the map to set coordinates and enter a new landmark/address description.');
    return;
  }

  const index = state.sightings.findIndex(s => s.id === state.currentDetailId);
  if (index !== -1) {
    const sighting = state.sightings[index];
    const oldAddress = sighting.address;
    
    sighting.lat = lat;
    sighting.lng = lng;
    sighting.address = address;

    sighting.comments.push({
      author: 'System Notice',
      text: `Animal relocated from "${oldAddress}" to "${address}" by ${state.currentUser.username}`,
      time: new Date().toISOString()
    });

    localStorage.setItem('pawrescue_sightings', JSON.stringify(state.sightings));

    // Deactivate relocation mode
    document.getElementById('relocation-input-panel').classList.add('hidden');
    const btn = document.getElementById('toggle-relocation-mode-btn');
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-outline');
    btn.innerHTML = '<i class="fa-solid fa-map-pin"></i> Relocate Animal';
    state.relocationMode = false;
    
    if (state.map.detailTempMarker) {
      state.map.miniDetail.removeLayer(state.map.detailTempMarker);
      state.map.detailTempMarker = null;
    }

    // Refresh UI
    renderSightingGrid();
    refreshMapMarkers();
    renderDetailComments(sighting.comments);
    document.getElementById('detail-address-text').innerText = address;

    // Update detail map pin
    if (state.map.detailMarker) {
      state.map.detailMarker.setLatLng([lat, lng]);
    }
    state.map.miniDetail.panTo([lat, lng]);

    // Google Maps link
    const gmapsLink = document.getElementById('detail-gmaps-link');
    gmapsLink.href = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

    // Broadcast update
    sightingChannel.postMessage({ type: 'SIGHTING_UPDATE', sighting: sighting });

    // Send public chat alert
    sendPublicChatSystemMsg(`📍 Relocation Alert: ${state.currentUser.username} updated the location of the stray ${sighting.type} to "${address}".`);
  }
}

function handleDetailPhotoChange(e) {
  if (!state.currentDetailId) return;
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('Please upload an image file.');
    return;
  }

  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (event) => {
    const img = new Image();
    img.src = event.target.result;
    img.onload = () => {
      // Compress using Canvas to max 600px width/height
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      const MAX_SIZE = 600;

      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

      // Save to state & storage
      const index = state.sightings.findIndex(s => s.id === state.currentDetailId);
      if (index !== -1) {
        const sighting = state.sightings[index];
        sighting.photo = compressedDataUrl;

        sighting.comments.push({
          author: 'System Notice',
          text: `Sighting photo was updated by ${state.currentUser.username}`,
          time: new Date().toISOString()
        });

        localStorage.setItem('pawrescue_sightings', JSON.stringify(state.sightings));

        // Update UI
        document.getElementById('detail-img').src = compressedDataUrl;
        renderSightingGrid();
        renderDetailComments(sighting.comments);

        // Clear input value
        e.target.value = '';

        // Broadcast update
        sightingChannel.postMessage({ type: 'SIGHTING_UPDATE', sighting: sighting });

        // Send alert to chat
        sendPublicChatSystemMsg(`📸 Photo Update: ${state.currentUser.username} posted a new photo for the stray ${sighting.type} at "${sighting.address}".`);
      }
    };
  };
}

// ----------------------------------------------------
// Live Geolocation Tracking Logic
// ----------------------------------------------------
function handleLiveLocationToggle() {
  const btn = document.getElementById('live-location-btn');
  const span = btn.querySelector('span');
  const icon = btn.querySelector('i');

  if (!state.isSharingLocation) {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    span.innerText = 'Connecting...';
    icon.className = 'fa-solid fa-spinner animate-spin';

    state.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        state.isSharingLocation = true;
        span.innerText = 'Sharing GPS';
        btn.style.backgroundColor = 'var(--color-rescued)';
        btn.style.color = 'white';
        icon.className = 'fa-solid fa-location-dot animate-bounce-slow';

        // Plot own location locally
        handleVolunteerMove(state.currentUser.username, state.currentUser.avatarSeed, latitude, longitude);

        // Broadcast to other tabs
        sightingChannel.postMessage({
          type: 'VOLUNTEER_MOVE',
          username: state.currentUser.username,
          avatarSeed: state.currentUser.avatarSeed,
          lat: latitude,
          lng: longitude
        });
      },
      (error) => {
        console.error('GPS tracking error:', error);
        alert('Could not start live GPS sharing. Please check location permissions.');
        resetLiveLocationButton();
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 8000
      }
    );

    sendPublicChatSystemMsg(`📡 Live GPS Alert: ${state.currentUser.username} started sharing their live location.`);
  } else {
    if (state.watchId !== null) {
      navigator.geolocation.clearWatch(state.watchId);
      state.watchId = null;
    }

    sightingChannel.postMessage({
      type: 'VOLUNTEER_STOP',
      username: state.currentUser.username
    });

    handleVolunteerStop(state.currentUser.username);
    resetLiveLocationButton();

    sendPublicChatSystemMsg(`📡 Live GPS Alert: ${state.currentUser.username} stopped sharing their live location.`);
  }
}

function resetLiveLocationButton() {
  const btn = document.getElementById('live-location-btn');
  const span = btn.querySelector('span');
  const icon = btn.querySelector('i');
  
  state.isSharingLocation = false;
  span.innerText = 'Share Live GPS';
  btn.style.backgroundColor = 'transparent';
  btn.style.color = 'var(--color-rescued)';
  icon.className = 'fa-solid fa-location-crosshairs';
}

function handleVolunteerMove(username, avatarSeed, lat, lng) {
  if (state.activeVolunteers[username]) {
    const vol = state.activeVolunteers[username];
    vol.marker.setLatLng([lat, lng]);
  } else {
    const marker = L.marker([lat, lng], { icon: volunteerMarkerIcon }).addTo(state.map.main);
    
    const popupContent = `
      <div style="text-align:center;">
        <img src="https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}" style="width:28px; height:28px; border-radius:50%; margin-bottom:4px;">
        <div style="font-size:11px; font-weight:bold; color:var(--text-main);">${username}</div>
        <div style="font-size:9px; color:var(--color-rescued); font-weight:bold;">Active Volunteer (Live)</div>
      </div>
    `;
    marker.bindPopup(popupContent);
    
    state.activeVolunteers[username] = {
      marker,
      avatarSeed,
      coords: [lat, lng]
    };
  }
}

function handleVolunteerStop(username) {
  if (state.activeVolunteers[username]) {
    state.map.main.removeLayer(state.activeVolunteers[username].marker);
    delete state.activeVolunteers[username];
  }
}

function startBotMovementSimulation(botName, avatarSeed, targetSighting) {
  if (state.activeVolunteers[botName]) return;

  // Start nearby NYC Midtown with randomized offset
  let currentLat = 40.73 + (Math.random() * 0.04 - 0.02);
  let currentLng = -74.00 + (Math.random() * 0.04 - 0.02);
  
  const destLat = targetSighting.lat;
  const destLng = targetSighting.lng;

  const totalSteps = 10;
  let currentStep = 0;

  sendPublicChatSystemMsg(`📡 Live GPS Alert: ${botName} started sharing their live location heading to "${targetSighting.address}".`);
  
  sightingChannel.postMessage({
    type: 'VOLUNTEER_MOVE',
    username: botName,
    avatarSeed: avatarSeed,
    lat: currentLat,
    lng: currentLng
  });
  handleVolunteerMove(botName, avatarSeed, currentLat, currentLng);

  const intervalId = setInterval(() => {
    currentStep++;
    if (currentStep >= totalSteps) {
      clearInterval(intervalId);
      
      sightingChannel.postMessage({
        type: 'VOLUNTEER_STOP',
        username: botName
      });
      handleVolunteerStop(botName);
      
      const sightingIndex = state.sightings.findIndex(s => s.id === targetSighting.id);
      if (sightingIndex !== -1) {
        state.sightings[sightingIndex].comments.push({
          author: botName,
          text: `I have arrived at the scene. Animal is secure!`,
          time: new Date().toISOString()
        });
        
        // Auto update status to safe/monitored
        if (state.sightings[sightingIndex].status !== 'rescued') {
          state.sightings[sightingIndex].status = 'safe';
        }
        
        localStorage.setItem('pawrescue_sightings', JSON.stringify(state.sightings));
        
        renderSightingGrid();
        refreshMapMarkers();
        updateDashboardStats();
        
        if (state.currentDetailId === targetSighting.id) {
          renderDetailComments(state.sightings[sightingIndex].comments);
          document.getElementById('update-sighting-status-select').value = 'safe';
          const banner = document.getElementById('detail-urgency-banner');
          banner.innerText = 'SAFE STATUS';
          banner.style.backgroundColor = 'var(--color-rescued)';
        }
      }

      sendPublicChatSystemMsg(`🏁 Arrived: ${botName} arrived at sighting location in "${targetSighting.address}".`);
    }
  }, 3000);
}

// ----------------------------------------------------
// Rescue Heroes & Nearest Volunteers DM Logic
// ----------------------------------------------------
function initializeMockActiveVolunteers() {
  state.activeVolunteers['StreetAngel'] = {
    avatarSeed: 'StreetAngel',
    coords: [40.7580, -73.9910]
  };
  state.activeVolunteers['VetSarah'] = {
    avatarSeed: 'RescueHero',
    coords: [40.7810, -73.9610]
  };
  state.activeVolunteers['DoggoSaver'] = {
    avatarSeed: 'DogWalker',
    coords: [40.7410, -73.9780]
  };

  setTimeout(() => {
    for (let name in state.activeVolunteers) {
      const vol = state.activeVolunteers[name];
      if (state.map.main) {
        const marker = L.marker(vol.coords, { icon: volunteerMarkerIcon }).addTo(state.map.main);
        
        const popupContent = `
          <div style="text-align:center;">
            <img src="https://api.dicebear.com/7.x/bottts/svg?seed=${vol.avatarSeed}" style="width:28px; height:28px; border-radius:50%; margin-bottom:4px;">
            <div style="font-size:11px; font-weight:bold; color:var(--text-main);">${name}</div>
            <div style="font-size:9px; color:var(--color-rescued); font-weight:bold;">Active Volunteer (Live)</div>
          </div>
        `;
        marker.bindPopup(popupContent);
        vol.marker = marker;
      }
    }
  }, 600);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function renderNearestVolunteers(sighting) {
  const container = document.getElementById('detail-nearby-volunteers-container');
  if (!container) return;
  container.innerHTML = '';

  const nearby = [];
  
  if (state.isSharingLocation && state.activeVolunteers[state.currentUser.username]) {
    const userCoords = state.activeVolunteers[state.currentUser.username].coords;
    if (userCoords) {
      const dist = calculateDistance(sighting.lat, sighting.lng, userCoords[0], userCoords[1]);
      nearby.push({ username: state.currentUser.username, avatarSeed: state.currentUser.avatarSeed, distance: dist, isSelf: true });
    }
  }

  for (let name in state.activeVolunteers) {
    if (name === state.currentUser.username) continue;
    const vol = state.activeVolunteers[name];
    if (vol.coords) {
      const dist = calculateDistance(sighting.lat, sighting.lng, vol.coords[0], vol.coords[1]);
      nearby.push({ username: name, avatarSeed: vol.avatarSeed, distance: dist, isSelf: false });
    }
  }

  nearby.sort((a, b) => a.distance - b.distance);

  if (nearby.length === 0) {
    container.innerHTML = `<div style="font-size:10px; color:var(--text-muted); text-align:center; padding:0.5rem 0;">No online volunteers sharing live location near this spot right now.</div>`;
    return;
  }

  nearby.forEach(v => {
    const card = document.createElement('div');
    card.className = 'nearby-volunteer-card';
    
    const distText = v.distance < 1 
      ? `${Math.round(v.distance * 1000)} meters away` 
      : `${v.distance.toFixed(2)} km away`;
       
    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${v.avatarSeed}`;

    card.innerHTML = `
      <div class="vol-info">
        <img src="${avatarUrl}" class="vol-avatar">
        <div class="vol-details">
          <span class="vol-name">${v.username} ${v.isSelf ? '(You)' : ''}</span>
          <span class="vol-distance"><i class="fa-solid fa-location-arrow"></i> ${distText}</span>
        </div>
      </div>
      ${v.isSelf ? '' : `<button type="button" class="btn btn-sm btn-primary" onclick="openPrivateChat('${v.username}')" style="padding: 2px 8px; font-size:10px;"><i class="fa-solid fa-comments"></i> Chat</button>`}
    `;
    container.appendChild(card);
  });
}

window.openPrivateChat = function(partnerUsername) {
  state.currentChatPartner = partnerUsername;
  
  document.getElementById('private-chat-title').innerHTML = `<i class="fa-solid fa-comments"></i> Chat with ${partnerUsername}`;
  document.getElementById('private-status-text').innerText = `Active Volunteer (Online)`;
  
  renderPrivateMessages();
  
  document.getElementById('private-chat-modal').classList.remove('hidden');
};

function renderPrivateMessages() {
  const partner = state.currentChatPartner;
  const container = document.getElementById('private-messages-box');
  if (!container || !partner) return;
  container.innerHTML = '';
  
  const messages = state.privateChats[partner] || [];
  
  if (messages.length === 0) {
    container.innerHTML = `<div style="font-size:11px; color:var(--text-muted); text-align:center; padding:1.5rem 0;">No messages yet. Say hello to coordinate keeping or adopting the animal!</div>`;
    return;
  }

  messages.forEach(msg => {
    const isSelf = msg.sender === state.currentUser.username;
    const bubble = document.createElement('div');
    bubble.style.display = 'flex';
    bubble.style.flexDirection = isSelf ? 'row-reverse' : 'row';
    bubble.style.gap = '0.5rem';
    bubble.style.animation = 'fade-in 0.2s ease-out';
    
    // Select correct avatar
    let seed = 'Guest';
    if (isSelf) {
      seed = state.currentUser.avatarSeed;
    } else {
      const partnerObj = state.activeVolunteers[partner];
      if (partnerObj) seed = partnerObj.avatarSeed;
    }
    
    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
    const timeStr = new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    bubble.innerHTML = `
      <div style="flex:1; max-width:85%; background-color:${isSelf ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-secondary)'}; border:1px solid ${isSelf ? 'var(--color-secondary)' : 'var(--border-color)'}; border-radius:${isSelf ? 'var(--radius-md) 0 var(--radius-md) var(--radius-md)' : '0 var(--radius-md) var(--radius-md) var(--radius-md)'}; padding:0.5rem 0.6rem;">
        <div style="display:flex; justify-content:space-between; font-size:10px; font-weight:700; margin-bottom:2px;">
          <span style="color:${isSelf ? 'var(--color-secondary)' : 'var(--color-primary)'};">${msg.sender}</span>
          <span style="color:var(--text-muted); font-weight:400;">${timeStr}</span>
        </div>
        <p style="font-size:11px; word-break:break-word; color:var(--text-main); margin:0;">${escapeHTML(msg.text)}</p>
      </div>
    `;
    container.appendChild(bubble);
  });
  
  container.scrollTop = container.scrollHeight;
}

function handlePrivateChatSubmit(e) {
  e.preventDefault();
  const partner = state.currentChatPartner;
  const input = document.getElementById('private-chat-input');
  const text = input.value.trim();
  
  if (!partner || !text) return;

  const newMsg = {
    id: 'p-chat-' + Date.now(),
    sender: state.currentUser.username,
    recipient: partner,
    text: text,
    time: new Date().toISOString()
  };

  if (!state.privateChats[partner]) {
    state.privateChats[partner] = [];
  }
  state.privateChats[partner].push(newMsg);
  localStorage.setItem('pawrescue_private_chats', JSON.stringify(state.privateChats));

  renderPrivateMessages();
  input.value = '';

  // Broadcast
  chatChannel.postMessage({ type: 'PRIVATE_MSG', data: newMsg });

  // Bot response check
  if (['StreetAngel', 'VetSarah', 'DoggoSaver', 'KittenWhisperer', 'PawsPatrol'].includes(partner)) {
    triggerBotPrivateReply(partner, text);
  }
}

const BOT_PRIVATE_RESPONSES = [
  "Hi! Yes, I am very close to that sighting location. I can keep the animal at my house to foster it tonight, I've got plenty of space and blankets!",
  "I am heading over right now with a carrier. I can foster them until we find a permanent adoption. Let's meet up there!",
  "Hey there! I am near that spot. I have dog/cat kibble ready. Can you meet me there to help catch it?",
  "Yes! I'd love to adopt if we can check its health. I've been looking for a puppy/kitten to foster. Is it friendly?",
  "I am close! I can transport it to the clinic. I've got a pet kennel in my car. See you in 10 minutes!"
];

function triggerBotPrivateReply(botName, userMsg) {
  const statusBar = document.getElementById('private-status-text');
  statusBar.innerHTML = `<span style="color:var(--color-primary);"><i class="fa-solid fa-pen-nib animate-bounce-slow"></i> ${botName} is typing...</span>`;
  
  setTimeout(() => {
    statusBar.innerText = 'Active Volunteer (Online)';
    
    const randomIndex = Math.floor(Math.random() * BOT_PRIVATE_RESPONSES.length);
    const responseText = BOT_PRIVATE_RESPONSES[randomIndex];
    
    const botReply = {
      id: 'p-chat-' + Date.now(),
      sender: botName,
      recipient: state.currentUser.username,
      text: responseText,
      time: new Date().toISOString()
    };

    if (!state.privateChats[botName]) {
      state.privateChats[botName] = [];
    }
    state.privateChats[botName].push(botReply);
    localStorage.setItem('pawrescue_private_chats', JSON.stringify(state.privateChats));

    if (state.currentChatPartner === botName) {
      renderPrivateMessages();
    }

    chatChannel.postMessage({ type: 'PRIVATE_MSG', data: botReply });
  }, 2200);
}

function renderRescueHeroes() {
  const container = document.getElementById('heroes-list-container');
  if (!container) return;
  container.innerHTML = '';

  const sorted = [...state.heroes].sort((a, b) => b.rescuesCount - a.rescuesCount);

  if (sorted.length === 0) {
    container.innerHTML = `<div style="font-size:10px; color:var(--text-muted); padding:0.2rem;">No rescue heroes yet. Be the first to rescue a stray!</div>`;
    return;
  }

  sorted.forEach(h => {
    const heroItem = document.createElement('div');
    heroItem.className = 'hero-item';
    
    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${h.avatarSeed}`;

    heroItem.innerHTML = `
      <div class="hero-avatar-box">
        <i class="fa-solid fa-crown hero-crown"></i>
        <img src="${avatarUrl}" class="hero-avatar" alt="${h.username}">
      </div>
      <span class="hero-label">HERO</span>
      <span class="hero-name">${h.username}</span>
      <span class="hero-count">${h.rescuesCount} Rescues</span>
    `;
    container.appendChild(heroItem);
  });
}

function awardHeroRescue(heroUsername) {
  const index = state.heroes.findIndex(h => h.username === heroUsername);
  let avatarSeed = 'RescueHero';
  
  if (heroUsername === state.currentUser.username) {
    avatarSeed = state.currentUser.avatarSeed;
  } else {
    const botMap = {
      'StreetAngel': 'StreetAngel',
      'VetSarah': 'RescueHero',
      'DoggoSaver': 'DogWalker',
      'KittenWhisperer': 'CatSaver',
      'PawsPatrol': 'StreetAngel'
    };
    avatarSeed = botMap[heroUsername] || `Seed_${Date.now()}`;
  }

  if (index !== -1) {
    state.heroes[index].rescuesCount++;
  } else {
    state.heroes.push({
      username: heroUsername,
      avatarSeed: avatarSeed,
      rescuesCount: 1
    });
  }

  localStorage.setItem('pawrescue_heroes', JSON.stringify(state.heroes));
  renderRescueHeroes();

  chatChannel.postMessage({ type: 'HEROES_UPDATE', data: state.heroes });

  sendPublicChatSystemMsg(`🏆 HERO ALERT: ${heroUsername} successfully rescued a roadside animal and became a Rescue Hero! (Total: ${state.heroes.find(h => h.username === heroUsername).rescuesCount} rescues) 🏆`);
}

// ----------------------------------------------------
// Navigation Tabs, Help, Donation, and Profile Logins
// ----------------------------------------------------
function switchNavigationTab(tabName) {
  const dashboard = document.querySelector('main.app-workspace');
  const helpSection = document.getElementById('help-section');
  const donateSection = document.getElementById('donate-section');

  // Hide all
  dashboard.classList.add('hidden');
  helpSection.classList.add('hidden');
  donateSection.classList.add('hidden');

  // Show selected
  if (tabName === 'dashboard') {
    dashboard.classList.remove('hidden');
    setTimeout(() => {
      if (state.map.main) {
        state.map.main.invalidateSize();
      }
    }, 100);
  } else if (tabName === 'help') {
    helpSection.classList.remove('hidden');
  } else if (tabName === 'donate') {
    donateSection.classList.remove('hidden');
  }
}

function openProfileModal() {
  const loggedOutView = document.getElementById('profile-logged-out-state');
  const loggedInView = document.getElementById('profile-logged-in-state');
  const modalTitle = document.getElementById('profile-modal-title');

  if (!state.isLoggedIn) {
    modalTitle.innerHTML = `<i class="fa-solid fa-sign-in-alt"></i> Sign In / Register`;
    loggedOutView.classList.remove('hidden');
    loggedInView.classList.add('hidden');
  } else {
    modalTitle.innerHTML = `<i class="fa-solid fa-user-circle"></i> Volunteer Profile`;
    loggedOutView.classList.add('hidden');
    loggedInView.classList.remove('hidden');

    // Populate user details
    document.getElementById('profile-view-avatar').src = `https://api.dicebear.com/7.x/bottts/svg?seed=${state.currentUser.avatarSeed}`;
    document.getElementById('profile-view-username').innerText = state.currentUser.username;
    document.getElementById('profile-edit-username').value = state.currentUser.username;

    // Calculate rescues count from heroes
    const heroInfo = state.heroes.find(h => h.username === state.currentUser.username);
    const rescuesCount = heroInfo ? heroInfo.rescuesCount : 0;
    
    // Calculate level rank & role
    let rank = 'BRONZE';
    let role = 'Junior Rescuer';
    let rankColor = 'linear-gradient(135deg, #cd7f32, #a0522d)';
    
    if (rescuesCount >= 1 && rescuesCount <= 3) {
      rank = 'SILVER';
      role = 'Senior Rescuer';
      rankColor = 'linear-gradient(135deg, #c0c0c0, #808080)';
    } else if (rescuesCount > 3) {
      rank = 'GOLD';
      role = 'Rescue Master';
      rankColor = 'linear-gradient(135deg, #ffd700, #ff8c00)';
    }

    const badge = document.getElementById('profile-rank-badge');
    badge.innerText = rank;
    badge.style.background = rankColor;
    document.getElementById('profile-view-role').innerText = role;

    // Set stats numbers
    const reportsCount = state.sightings.filter(s => s.contact && s.contact.toLowerCase().includes(state.currentUser.username.toLowerCase())).length;
    document.getElementById('stat-profile-reported').innerText = reportsCount;
    document.getElementById('stat-profile-rescues').innerText = rescuesCount;
    document.getElementById('stat-profile-donated').innerText = `$${state.totalDonated.toFixed(2)}`;

    // Set active avatar selection highlight
    const options = document.querySelectorAll('#profile-avatar-options-box .avatar-option');
    options.forEach(opt => {
      if (opt.dataset.seed === state.currentUser.avatarSeed) {
        opt.classList.add('active');
      } else {
        opt.classList.remove('active');
      }
    });
  }

  document.getElementById('profile-modal').classList.remove('hidden');
}

function closeProfileModal() {
  document.getElementById('profile-modal').classList.add('hidden');
}

function toggleAuthTabs(tabType) {
  const signinBtn = document.getElementById('auth-tab-signin');
  const signupBtn = document.getElementById('auth-tab-signup');
  const signinForm = document.getElementById('signin-form');
  const signupForm = document.getElementById('signup-form');

  if (tabType === 'signin') {
    signinBtn.classList.add('active');
    signupBtn.classList.remove('active');
    signinForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
  } else {
    signinBtn.classList.remove('active');
    signupBtn.classList.add('active');
    signinForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
  }
}

function handleSignInSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('signin-email').value;
  
  const nickname = email.split('@')[0];
  state.currentUser = {
    username: nickname,
    avatarSeed: 'RescueHero'
  };
  state.isLoggedIn = true;
  localStorage.setItem('pawrescue_logged_in', 'true');
  localStorage.setItem('pawrescue_user', JSON.stringify(state.currentUser));

  // Sync header
  document.getElementById('header-username').innerText = nickname;
  document.getElementById('header-avatar').src = `https://api.dicebear.com/7.x/bottts/svg?seed=${state.currentUser.avatarSeed}`;

  sendPublicChatSystemMsg(`🔑 User Alert: ${nickname} logged in.`);
  
  openProfileModal();
}

function handleSignUpSubmit(e) {
  e.preventDefault();
  const nickname = document.getElementById('signup-nickname').value.trim();
  
  state.currentUser = {
    username: nickname,
    avatarSeed: 'RescueHero'
  };
  state.isLoggedIn = true;
  localStorage.setItem('pawrescue_logged_in', 'true');
  localStorage.setItem('pawrescue_user', JSON.stringify(state.currentUser));

  // Sync header
  document.getElementById('header-username').innerText = nickname;
  document.getElementById('header-avatar').src = `https://api.dicebear.com/7.x/bottts/svg?seed=${state.currentUser.avatarSeed}`;

  sendPublicChatSystemMsg(`🎉 Community Welcome: Volunteer "${nickname}" registered!`);
  
  openProfileModal();
}

function handleQuickGuestLogin() {
  state.currentUser = {
    username: 'GuestRescuer',
    avatarSeed: 'RescueHero'
  };
  state.isLoggedIn = true;
  localStorage.setItem('pawrescue_logged_in', 'true');
  localStorage.setItem('pawrescue_user', JSON.stringify(state.currentUser));

  document.getElementById('header-username').innerText = 'GuestRescuer';
  document.getElementById('header-avatar').src = `https://api.dicebear.com/7.x/bottts/svg?seed=RescueHero`;

  openProfileModal();
}

function handleProfileLogout() {
  state.isLoggedIn = false;
  localStorage.setItem('pawrescue_logged_in', 'false');
  
  state.currentUser = {
    username: 'Guest',
    avatarSeed: 'Guest'
  };
  localStorage.setItem('pawrescue_user', JSON.stringify(state.currentUser));

  document.getElementById('header-username').innerText = 'Guest';
  document.getElementById('header-avatar').src = `https://api.dicebear.com/7.x/bottts/svg?seed=Guest`;

  openProfileModal();
}

function handleProfileSave() {
  const newName = document.getElementById('profile-edit-username').value.trim();
  const selectedOpt = document.querySelector('#profile-avatar-options-box .avatar-option.active');
  const newSeed = selectedOpt ? selectedOpt.dataset.seed : 'RescueHero';

  if (!newName) return;

  state.currentUser.username = newName;
  state.currentUser.avatarSeed = newSeed;
  localStorage.setItem('pawrescue_user', JSON.stringify(state.currentUser));

  // Sync header
  document.getElementById('header-username').innerText = newName;
  document.getElementById('header-avatar').src = `https://api.dicebear.com/7.x/bottts/svg?seed=${newSeed}`;

  closeProfileModal();
}

function handleDonationCheckoutSubmit(e) {
  e.preventDefault();

  const activeCard = document.querySelector('.tier-card.active');
  const customInput = document.getElementById('custom-donate-amount');
  
  let amount = 15;
  let fund = 'Kibble & Food Fund';

  if (customInput.value && parseFloat(customInput.value) > 0) {
    amount = parseFloat(customInput.value);
    fund = 'General Rescue Operations Fund';
  } else if (activeCard) {
    amount = parseFloat(activeCard.dataset.amount);
    fund = activeCard.dataset.fund;
  }

  state.totalDonated += amount;
  localStorage.setItem('pawrescue_total_donated', state.totalDonated.toString());

  document.getElementById('donation-checkout-form').classList.add('hidden');
  document.querySelector('.donation-options-side').classList.add('hidden');
  
  document.getElementById('success-donation-amount').innerText = `$${amount.toFixed(2)}`;
  document.getElementById('success-donation-fund').innerText = fund;
  document.getElementById('donation-success-panel').classList.remove('hidden');

  const user = state.currentUser.username;
  sendPublicChatSystemMsg(`💖 Donation Hero: ${user} donated $${amount.toFixed(2)} to the ${fund}! Thank you for saving lives! 💖`);
}

function resetDonationSectionToDashboard() {
  document.getElementById('donation-checkout-form').reset();
  document.getElementById('custom-donate-amount').value = '';
  
  document.getElementById('donation-checkout-form').classList.remove('hidden');
  document.querySelector('.donation-options-side').classList.remove('hidden');
  document.getElementById('donation-success-panel').classList.add('hidden');

  const cards = document.querySelectorAll('.tier-card');
  cards.forEach(c => {
    c.classList.remove('active');
    c.style.borderColor = 'var(--border-color)';
    c.style.background = 'transparent';
  });
  cards[0].classList.add('active');
  cards[0].style.borderColor = 'var(--color-primary)';
  cards[0].style.background = 'rgba(245, 158, 11, 0.08)';
  document.getElementById('donate-btn-amount-text').innerText = `$${parseFloat(cards[0].dataset.amount).toFixed(2)}`;

  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(t => t.classList.remove('active'));
  tabs[0].classList.add('active');
  switchNavigationTab('dashboard');
}


