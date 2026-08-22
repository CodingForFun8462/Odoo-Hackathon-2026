/**
 * GlobeTrotter - Client-side Application Controller
 * Built for Odoo Hackathon
 */

const API_BASE = '/api';

// Application State
const state = {
  currentUser: { id: 1, name: 'Alex Rivers', email: 'traveler@odoo.com', role: 'user', home_currency: 'INR' },
  trips: [],
  activeTripId: 1,
  activeTrip: null,
  destinations: [],
  activities: [],
  savedDestinations: [],
  viewerMode: 'timeline',
  mapInstance: null,
  publicMapInstance: null,
  categoryChart: null,
  dailyChart: null,
  authMode: 'login'
};

// Helper: Format Currency (Default: INR ₹)
function formatCurrency(amount, curr = null) {
  const currency = curr || (state.activeTrip ? state.activeTrip.currency : (state.currentUser.home_currency || 'INR'));
  const symbols = { 'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥' };
  const symbol = symbols[currency] || '₹';
  const num = Number(amount || 0);
  try {
    const formattedNum = num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    return `${symbol}${formattedNum}`;
  } catch (e) {
    return `${symbol}${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
}

// Helper: Format Date Range
function formatDateRange(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return '';
  const d1 = new Date(startDateStr);
  const d2 = new Date(endDateStr);
  const opt = { month: 'short', day: 'numeric', year: 'numeric' };
  return `${d1.toLocaleDateString('en-US', opt)} – ${d2.toLocaleDateString('en-US', opt)}`;
}

// Toast Notifications
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️');
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// API Request Wrapper
async function apiRequest(endpoint, method = 'GET', body = null) {
  const headers = {
    'Content-Type': 'application/json',
    'X-User-Id': String(state.currentUser.id)
  };
  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Server request failed');
    }
    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    showToast(err.message, 'error');
    throw err;
  }
}

/* =========================================================================
   ROUTING & VIEW MANAGEMENT
   ========================================================================= */

function initRouter() {
  window.addEventListener('hashchange', handleHashChange);
  handleHashChange();
}

async function handleHashChange() {
  const rawHash = window.location.hash || '#dashboard';
  const parts = rawHash.replace('#', '').split('/');
  const route = parts[0] || 'dashboard';
  const param = parts[1];

  // Update Nav links active status
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.nav === route);
  });

  // Switch Active View Section
  document.querySelectorAll('.view-section').forEach(sec => {
    sec.classList.remove('active');
  });

  const targetSec = document.getElementById(`view-${route}`);
  if (targetSec) {
    targetSec.classList.add('active');
  } else {
    document.getElementById('view-dashboard').classList.add('active');
  }

  // Handle specific view loading
  switch (route) {
    case 'dashboard':
      await loadDashboard();
      break;
    case 'trips':
      await loadTripsList();
      break;
    case 'itinerary-builder':
      if (param) state.activeTripId = parseInt(param);
      await loadItineraryBuilder();
      break;
    case 'itinerary-view':
      if (param) state.activeTripId = parseInt(param);
      await loadItineraryView();
      break;
    case 'explore-cities':
      await loadDestinationsCatalog();
      break;
    case 'explore-activities':
      await loadActivitiesCatalog();
      break;
    case 'budget':
      if (param) state.activeTripId = parseInt(param);
      await loadBudgetView();
      break;
    case 'calendar':
      if (param) state.activeTripId = parseInt(param);
      await loadCalendarView();
      break;
    case 'share':
      if (param) await loadPublicTripView(param);
      break;
    case 'profile':
      await loadProfileView();
      break;
    case 'admin':
      await loadAdminDashboard();
      break;
    case 'login':
      setPageAuthMode('login');
      break;
    case 'signup':
      setPageAuthMode('signup');
      break;
  }
}

/* =========================================================================
   AUTHENTICATION & USER SESSION MANAGEMENT
   ========================================================================= */

async function initUserSession() {
  try {
    const savedUser = localStorage.getItem('globetrotter_user');
    if (savedUser) {
      try {
        state.currentUser = JSON.parse(savedUser);
      } catch (e) {}
    }
    const data = await apiRequest('/auth/me');
    if (data && data.user) {
      state.currentUser = data.user;
      localStorage.setItem('globetrotter_user', JSON.stringify(state.currentUser));
    }
    updateUserInterfaceElements();
  } catch (err) {
    console.warn("Could not fetch current user from server, using active session");
  }
}

function updateUserInterfaceElements() {
  const avatar = document.getElementById('sidebar-user-avatar');
  const name = document.getElementById('sidebar-user-name');
  const role = document.getElementById('sidebar-user-role');
  const curr = document.getElementById('sidebar-user-currency');
  const authLabel = document.getElementById('auth-status-label');

  if (avatar) avatar.src = state.currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
  if (name) name.textContent = state.currentUser.name;
  if (role) role.textContent = (state.currentUser.role || 'USER').toUpperCase();
  if (curr) curr.textContent = `${state.currentUser.home_currency || 'INR'} (₹)`;
  if (authLabel) authLabel.textContent = `${state.currentUser.name.split(' ')[0]} / Switch`;

  // Highlight Demo Switcher Persona Buttons
  document.querySelectorAll('.demo-btn').forEach(btn => btn.classList.remove('active'));
  if (state.currentUser.id === 1) document.getElementById('btn-switch-traveler')?.classList.add('active');
  if (state.currentUser.id === 2) document.getElementById('btn-switch-admin')?.classList.add('active');
  if (state.currentUser.id === 3) document.getElementById('btn-switch-sophia')?.classList.add('active');
}

async function switchDemoUser(userId) {
  state.currentUser.id = userId;
  await initUserSession();
  showToast(`Switched persona to ${state.currentUser.name} (${state.currentUser.role.toUpperCase()})`);
  handleHashChange();
}

function handleLogout() {
  state.currentUser = { id: 1, name: 'Alex Rivers', email: 'traveler@odoo.com', role: 'user', home_currency: 'INR' };
  localStorage.removeItem('globetrotter_user');
  updateUserInterfaceElements();
  showToast("You have been signed out. Redirecting to login...", "info");
  window.location.hash = '#login';
}

function openAuthModal() {
  openModal('modal-auth');
}

function togglePasswordVisibility(inputId, btnElement) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btnElement.textContent = '🙈';
    btnElement.title = 'Hide password';
  } else {
    input.type = 'password';
    btnElement.textContent = '👁️';
    btnElement.title = 'Show password';
  }
}

function autoFillDemoPassword() {
  const pwdInput = document.getElementById('page-auth-password');
  if (pwdInput) pwdInput.value = 'odoo123';
  showToast("Demo password filled: odoo123");
}

function modalFillPassword() {
  const pwdInput = document.getElementById('auth-input-password');
  if (pwdInput) pwdInput.value = 'odoo123';
  showToast("Demo password filled: odoo123");
}

function quickFillAndLogin(email, password) {
  document.getElementById('page-auth-email').value = email;
  document.getElementById('page-auth-password').value = password;
  setPageAuthMode('login');
  document.getElementById('page-auth-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
}

function modalQuickFill(email, password) {
  document.getElementById('auth-input-email').value = email;
  document.getElementById('auth-input-password').value = password;
  switchAuthTab('login');
  document.getElementById('auth-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
}

function setPageAuthMode(mode) {
  state.authMode = mode;
  document.getElementById('pill-auth-login')?.classList.toggle('active', mode === 'login');
  document.getElementById('pill-auth-signup')?.classList.toggle('active', mode === 'signup');
  const nameGroup = document.getElementById('page-auth-group-name');
  if (nameGroup) nameGroup.style.display = mode === 'signup' ? 'block' : 'none';
  
  const title = document.getElementById('page-auth-title');
  const desc = document.getElementById('page-auth-desc');
  const btn = document.getElementById('page-auth-submit-btn');
  const alertBox = document.getElementById('page-auth-alert');
  if (alertBox) alertBox.style.display = 'none';

  if (mode === 'signup') {
    if (title) title.textContent = 'Create GlobeTrotter Account';
    if (desc) desc.textContent = 'Sign up to build dream multi-city itineraries';
    if (btn) btn.textContent = 'Create Account & Start Planning →';
  } else {
    if (title) title.textContent = 'Sign In to GlobeTrotter';
    if (desc) desc.textContent = 'Enter your credentials or pick a 1-click demo account';
    if (btn) btn.textContent = 'Sign In to Dashboard →';
  }
}

async function handlePageAuthSubmit(e) {
  e.preventDefault();
  const alertBox = document.getElementById('page-auth-alert');
  const btn = document.getElementById('page-auth-submit-btn');
  const email = document.getElementById('page-auth-email').value.trim();
  const password = document.getElementById('page-auth-password').value;
  const name = document.getElementById('page-auth-name')?.value.trim() || 'Traveler';

  if (alertBox) alertBox.style.display = 'none';
  const origBtnText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Authenticating... ⏳';

  try {
    let res;
    if (state.authMode === 'signup') {
      res = await apiRequest('/auth/signup', 'POST', { name, email, password });
      state.currentUser = res.user;
      showToast(`Welcome aboard, ${state.currentUser.name}! 🎉`);
    } else {
      res = await apiRequest('/auth/login', 'POST', { email, password });
      state.currentUser = res.user;
      showToast(`Welcome back, ${state.currentUser.name}! ✈️`);
    }

    localStorage.setItem('globetrotter_user', JSON.stringify(state.currentUser));
    updateUserInterfaceElements();
    
    // Redirect smoothly to dashboard
    setTimeout(() => {
      window.location.hash = '#dashboard';
    }, 400);

  } catch (err) {
    if (alertBox) {
      alertBox.style.display = 'block';
      alertBox.style.background = 'rgba(239, 68, 68, 0.15)';
      alertBox.style.color = '#EF4444';
      alertBox.style.border = '1px solid rgba(239, 68, 68, 0.3)';
      alertBox.textContent = `❌ ${err.message || 'Authentication failed'}`;
    }
  } finally {
    btn.disabled = false;
    btn.textContent = origBtnText;
  }
}

function switchAuthTab(mode) {
  state.authMode = mode;
  document.getElementById('tab-auth-login')?.classList.toggle('active', mode === 'login');
  document.getElementById('tab-auth-signup')?.classList.toggle('active', mode === 'signup');
  const nameGroup = document.getElementById('auth-group-name');
  if (nameGroup) nameGroup.style.display = mode === 'signup' ? 'block' : 'none';
  
  const submitBtn = document.getElementById('auth-submit-btn');
  const title = document.getElementById('auth-modal-title');
  const alertBox = document.getElementById('modal-auth-alert');
  if (alertBox) alertBox.style.display = 'none';

  if (submitBtn) submitBtn.textContent = mode === 'signup' ? 'Create Account' : 'Sign In';
  if (title) title.textContent = mode === 'signup' ? 'Create GlobeTrotter Account' : 'Sign In to GlobeTrotter';
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const alertBox = document.getElementById('modal-auth-alert');
  const btn = document.getElementById('auth-submit-btn');
  const email = document.getElementById('auth-input-email').value.trim();
  const password = document.getElementById('auth-input-password').value;
  const name = document.getElementById('auth-input-name')?.value.trim() || 'Traveler';

  if (alertBox) alertBox.style.display = 'none';
  const origBtnText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Processing... ⏳';

  try {
    let res;
    if (state.authMode === 'signup') {
      res = await apiRequest('/auth/signup', 'POST', { name, email, password });
      state.currentUser = res.user;
      showToast(`Account created! Welcome, ${state.currentUser.name}`);
    } else {
      res = await apiRequest('/auth/login', 'POST', { email, password });
      state.currentUser = res.user;
      showToast(`Welcome back, ${state.currentUser.name}!`);
    }

    localStorage.setItem('globetrotter_user', JSON.stringify(state.currentUser));
    closeModal('modal-auth');
    updateUserInterfaceElements();
    handleHashChange();
  } catch (err) {
    if (alertBox) {
      alertBox.style.display = 'block';
      alertBox.style.background = 'rgba(239, 68, 68, 0.15)';
      alertBox.style.color = '#EF4444';
      alertBox.style.border = '1px solid rgba(239, 68, 68, 0.3)';
      alertBox.textContent = `❌ ${err.message || 'Login failed'}`;
    }
  } finally {
    btn.disabled = false;
    btn.textContent = origBtnText;
  }
}

/* =========================================================================
   DASHBOARD VIEW (#dashboard)
   ========================================================================= */

async function loadDashboard() {
  try {
    const data = await apiRequest('/trips');
    state.trips = data.trips;
    document.getElementById('nav-trips-count').textContent = state.trips.length;

    // Compute stats
    const totalTrips = state.trips.length;
    const totalStops = state.trips.reduce((acc, t) => acc + (t.stop_count || 0), 0);
    const totalBudget = state.trips.reduce((acc, t) => acc + (t.total_budget || 0), 0);

    document.getElementById('dash-total-trips').textContent = totalTrips;
    document.getElementById('dash-total-stops').textContent = totalStops;
    document.getElementById('dash-total-budget').textContent = formatCurrency(totalBudget);

    renderDashboardTrips(state.trips.slice(0, 3));
    await loadFeaturedDestinations();
  } catch (err) {
    console.error(err);
  }
}

function renderDashboardTrips(trips) {
  const container = document.getElementById('dashboard-trips-list');
  if (!trips.length) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: var(--bg-surface); border-radius: var(--radius-lg);">
        <p style="color: var(--text-muted); margin-bottom: 16px;">No upcoming trips planned yet.</p>
        <button class="btn btn-primary" onclick="openCreateTripModal()">Plan Your First Multi-City Trip</button>
      </div>`;
    return;
  }

  container.innerHTML = trips.map(trip => createTripCardHtml(trip)).join('');
}

async function loadFeaturedDestinations() {
  const res = await apiRequest('/destinations');
  state.destinations = res.destinations;
  const container = document.getElementById('dashboard-featured-cities');
  const featured = state.destinations.slice(0, 4);
  container.innerHTML = featured.map(dest => createDestinationCardHtml(dest)).join('');
}

/* =========================================================================
   MY TRIPS VIEW (#trips)
   ========================================================================= */

async function loadTripsList() {
  const res = await apiRequest('/trips');
  state.trips = res.trips;
  filterTripsList();
}

function filterTripsList() {
  const filter = document.getElementById('trips-status-filter')?.value || 'All';
  let list = state.trips;
  if (filter !== 'All') {
    list = list.filter(t => t.status === filter);
  }
  const container = document.getElementById('all-trips-grid');
  if (!list.length) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">No trips match the selected filter.</div>`;
    return;
  }
  container.innerHTML = list.map(trip => createTripCardHtml(trip)).join('');
}

function createTripCardHtml(trip) {
  const statusClass = trip.status === 'Completed' ? 'status-completed' : (trip.status === 'Draft' ? 'status-draft' : 'status-upcoming');
  const cities = trip.cities_summary ? trip.cities_summary.split(', ') : [];

  return `
    <div class="trip-card">
      <div class="trip-card-cover">
        <img src="${trip.cover_image || 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600'}" alt="${trip.title}" loading="lazy">
        <div class="trip-status-badge ${statusClass}">${trip.status}</div>
        <div class="trip-quick-actions">
          <button class="trip-quick-btn" title="Duplicate / Fork" onclick="duplicateTrip(${trip.id})">📋</button>
          <button class="trip-quick-btn" title="Share" onclick="openShareModalForTrip(${trip.id}, '${trip.share_slug}')">🔗</button>
          <button class="trip-quick-btn" title="Delete" onclick="deleteTrip(${trip.id})">🗑️</button>
        </div>
      </div>
      <div class="trip-card-body">
        <h4 class="trip-card-title">${trip.title}</h4>
        <div class="trip-card-dates">
          <span>📅 ${formatDateRange(trip.start_date, trip.end_date)}</span>
          <span>•</span>
          <span>${trip.stop_count || 0} Cities</span>
        </div>
        <div class="trip-cities-pills">
          ${cities.map(c => `<span class="city-pill">📍 ${c}</span>`).join('')}
        </div>
        <div class="trip-budget-summary">
          <div>
            <div class="trip-budget-label">Total Spent / Target</div>
            <div class="trip-budget-val">${formatCurrency(trip.total_expenses, trip.currency)} / ${formatCurrency(trip.total_budget, trip.currency)}</div>
          </div>
          <a href="#itinerary-builder/${trip.id}" class="btn btn-primary btn-sm">Manage &rarr;</a>
        </div>
      </div>
    </div>
  `;
}

async function duplicateTrip(tripId) {
  try {
    const res = await apiRequest(`/trips/${tripId}/duplicate`, 'POST');
    showToast("Trip cloned successfully into your account!");
    window.location.hash = `#itinerary-builder/${res.trip_id}`;
  } catch (err) {}
}

async function deleteTrip(tripId) {
  if (!confirm("Are you sure you want to delete this trip and all its stops/activities?")) return;
  try {
    await apiRequest(`/trips/${tripId}`, 'DELETE');
    showToast("Trip deleted.");
    loadTripsList();
  } catch (err) {}
}

/* =========================================================================
   ITINERARY BUILDER VIEW (#itinerary-builder)
   ========================================================================= */

async function loadItineraryBuilder() {
  if (!state.activeTripId && state.trips.length > 0) {
    state.activeTripId = state.trips[0].id;
  }
  if (!state.activeTripId) {
    showToast("No active trip found. Please create one first.", "info");
    window.location.hash = '#trips';
    return;
  }

  const res = await apiRequest(`/trips/${state.activeTripId}`);
  state.activeTrip = res.trip;
  renderItineraryBuilderHeader();
  renderItineraryBuilderStops();
  initTripRouteMap('trip-map-container', state.activeTrip.stops);
}

function renderItineraryBuilderHeader() {
  const trip = state.activeTrip;
  const container = document.getElementById('builder-header-summary');
  container.innerHTML = `
    <div>
      <div style="font-size: 0.8rem; color: var(--primary); font-weight: 700; text-transform: uppercase;">Editing Itinerary</div>
      <h2 style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-heading);">${trip.title}</h2>
      <p style="color: var(--text-muted); font-size: 0.9rem;">${formatDateRange(trip.start_date, trip.end_date)} • ${trip.stats.total_days} Days • ${trip.stats.stop_count} Stops</p>
    </div>
    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
      <a href="#itinerary-view/${trip.id}" class="btn btn-secondary btn-sm">👁️ View Full Plan</a>
      <a href="#budget/${trip.id}" class="btn btn-secondary btn-sm">💰 Budget (${formatCurrency(trip.stats.total_spent, trip.currency)})</a>
      <a href="#calendar/${trip.id}" class="btn btn-secondary btn-sm">📅 Calendar</a>
      <button class="btn btn-accent btn-sm" onclick="openShareModalForTrip(${trip.id}, '${trip.share_slug}')">🔗 Share</button>
    </div>
  `;
}

function renderItineraryBuilderStops() {
  const container = document.getElementById('builder-stops-list');
  const stops = state.activeTrip.stops || [];

  if (!stops.length) {
    container.innerHTML = `
      <div style="background: var(--bg-surface); padding: 30px; border-radius: var(--radius-lg); text-align: center; border: 1px dashed var(--border-strong);">
        <p style="color: var(--text-muted); margin-bottom: 14px;">This trip has no destination stops yet.</p>
        <button class="btn btn-primary btn-sm" onclick="openAddStopModal()">+ Add Your First City Stop</button>
      </div>`;
    return;
  }

  container.innerHTML = stops.map((stop, index) => `
    <div class="stop-card" data-stop-id="${stop.id}">
      <div class="stop-header">
        <div class="stop-city-badge">
          <span class="stop-order-num">${stop.order_index}</span>
          <div>
            <div class="stop-city-title">📍 ${stop.city_name}, ${stop.country}</div>
            <div class="stop-dates-tag">${formatDateRange(stop.arrival_date, stop.departure_date)} • Stay: ${formatCurrency(stop.accommodation_cost, state.activeTrip.currency)}</div>
          </div>
        </div>
        <div style="display: flex; gap: 6px;">
          ${index > 0 ? `<button class="btn btn-secondary btn-sm" title="Move Up" onclick="moveStopOrder(${stop.id}, -1)">▲</button>` : ''}
          ${index < stops.length - 1 ? `<button class="btn btn-secondary btn-sm" title="Move Down" onclick="moveStopOrder(${stop.id}, 1)">▼</button>` : ''}
          <button class="btn btn-secondary btn-sm" title="Add Activity" onclick="openAddActivityModal(${stop.id}, '${stop.arrival_date}')">+ Activity</button>
          <button class="btn btn-secondary btn-sm" style="color: var(--danger);" title="Delete Stop" onclick="deleteStop(${stop.id})">🗑️</button>
        </div>
      </div>

      <div class="activities-list">
        ${(stop.activities && stop.activities.length > 0) ? stop.activities.map(act => `
          <div class="activity-item-card">
            <img src="${act.image_url || 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=200'}" class="activity-thumb" alt="${act.title}">
            <div class="activity-meta">
              <div class="activity-title-row">
                <span class="activity-title" style="${act.status === 'completed' ? 'text-decoration: line-through; opacity: 0.7;' : ''}">${act.title}</span>
                <span class="cat-tag cat-${act.category}">${act.category}</span>
                <span class="badge" style="font-size: 0.7rem; background: var(--bg-surface-elevated); padding: 2px 6px; border-radius: 4px; cursor: pointer;" onclick="toggleActivityStatus(${act.id})">
                  ${act.status === 'booked' ? '✅ Booked' : (act.status === 'completed' ? '🏁 Completed' : '⏳ Planned')}
                </span>
              </div>
              <div class="activity-sub-info">
                <span>🕒 ${act.start_time || '10:00'} (${act.duration_hours}h)</span>
                <span>📅 ${new Date(act.activity_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span>📍 ${act.location || stop.city_name}</span>
              </div>
            </div>
            <div class="activity-cost-pill">${formatCurrency(act.estimated_cost, state.activeTrip.currency)}</div>
            <button class="icon-btn" style="width: 28px; height: 28px;" title="Delete Activity" onclick="deleteActivity(${act.id})">&times;</button>
          </div>
        `).join('') : `
          <div style="font-size: 0.82rem; color: var(--text-muted); padding: 8px 0;">No activities added yet for ${stop.city_name}. Click "+ Activity" or explore catalog.</div>
        `}
      </div>
    </div>
  `).join('');
}

async function moveStopOrder(stopId, direction) {
  const stops = state.activeTrip.stops;
  const idx = stops.findIndex(s => s.id === stopId);
  if (idx === -1) return;
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= stops.length) return;

  const item = stops.splice(idx, 1)[0];
  stops.splice(newIdx, 0, item);
  const orderedIds = stops.map(s => s.id);

  try {
    await apiRequest(`/trips/${state.activeTripId}/reorder-stops`, 'POST', { stop_ids: orderedIds });
    await loadItineraryBuilder();
  } catch (err) {}
}

async function toggleActivityStatus(actId) {
  try {
    const res = await apiRequest(`/activities/${actId}/toggle`, 'POST');
    showToast(`Status updated to ${res.status}`);
    await loadItineraryBuilder();
  } catch (err) {}
}

async function deleteStop(stopId) {
  if (!confirm("Are you sure you want to remove this city stop and its scheduled activities?")) return;
  try {
    await apiRequest(`/stops/${stopId}`, 'DELETE');
    showToast("Stop removed.");
    await loadItineraryBuilder();
  } catch (err) {}
}

async function deleteActivity(actId) {
  try {
    await apiRequest(`/activities/${actId}`, 'DELETE');
    showToast("Activity deleted.");
    await loadItineraryBuilder();
  } catch (err) {}
}

/* =========================================================================
   MAP ENGINE (LEAFLET)
   ========================================================================= */

function initTripRouteMap(containerId, stops) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (state.mapInstance) {
    state.mapInstance.remove();
    state.mapInstance = null;
  }

  // Create Leaflet Map
  const map = L.map(containerId).setView([48.8566, 2.3522], 4);
  state.mapInstance = map;

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const coords = [];
  stops.forEach((stop, i) => {
    const lat = stop.latitude || (45 + i * 2);
    const lng = stop.longitude || (5 + i * 4);
    coords.push([lat, lng]);

    const marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup(`<b>Stop ${stop.order_index}: ${stop.city_name}, ${stop.country}</b><br>${formatDateRange(stop.arrival_date, stop.departure_date)}`);
  });

  if (coords.length > 1) {
    const polyline = L.polyline(coords, { color: '#EA580C', weight: 4, opacity: 0.85, dashArray: '8, 8' }).addTo(map);
    map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
  } else if (coords.length === 1) {
    map.setView(coords[0], 10);
  }
}

/* =========================================================================
   ITINERARY VIEW (PRESENTATION MODE) (#itinerary-view)
   ========================================================================= */

async function loadItineraryView() {
  if (!state.activeTripId && state.trips.length > 0) {
    state.activeTripId = state.trips[0].id;
  }
  if (!state.activeTripId) return;

  const res = await apiRequest(`/trips/${state.activeTripId}`);
  state.activeTrip = res.trip;

  renderItineraryViewerHeader();
  renderItineraryViewerContent();
}

function renderItineraryViewerHeader() {
  const trip = state.activeTrip;
  const container = document.getElementById('viewer-header-summary');
  container.innerHTML = `
    <div>
      <div style="font-size: 0.8rem; color: var(--accent-teal); font-weight: 700; text-transform: uppercase;">Itinerary Summary</div>
      <h2 style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-heading);">${trip.title}</h2>
      <p style="color: var(--text-muted); font-size: 0.9rem;">${formatDateRange(trip.start_date, trip.end_date)} • ${trip.stats.total_days} Days Journey</p>
    </div>
    <div style="display: flex; gap: 10px;">
      <a href="#itinerary-builder/${trip.id}" class="btn btn-secondary btn-sm">✏️ Edit Itinerary</a>
    </div>
  `;
}

function toggleViewerMode(mode) {
  state.viewerMode = mode;
  document.getElementById('btn-view-mode-timeline').classList.toggle('active', mode === 'timeline');
  document.getElementById('btn-view-mode-grouped').classList.toggle('active', mode === 'grouped');
  renderItineraryViewerContent();
}

function renderItineraryViewerContent() {
  const container = document.getElementById('viewer-content-container');
  const trip = state.activeTrip;
  if (!trip || !trip.stops) return;

  if (state.viewerMode === 'grouped') {
    // City Grouped View
    container.innerHTML = trip.stops.map(stop => `
      <div class="chart-card" style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: 12px; margin-bottom: 16px;">
          <div>
            <h3 style="font-size: 1.3rem; font-weight: 700;">📍 ${stop.city_name}, ${stop.country}</h3>
            <div style="font-size: 0.85rem; color: var(--text-muted);">${formatDateRange(stop.arrival_date, stop.departure_date)}</div>
          </div>
          <div style="font-weight: 700; color: var(--primary);">Stay: ${formatCurrency(stop.accommodation_cost, trip.currency)}</div>
        </div>
        <div class="activities-list" style="padding: 0;">
          ${(stop.activities && stop.activities.length > 0) ? stop.activities.map(a => `
            <div class="activity-item-card">
              <img src="${a.image_url || 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=200'}" class="activity-thumb" alt="${a.title}">
              <div class="activity-meta">
                <div class="activity-title-row">
                  <span class="activity-title">${a.title}</span>
                  <span class="cat-tag cat-${a.category}">${a.category}</span>
                </div>
                <div class="activity-sub-info">
                  <span>🕒 ${a.start_time} (${a.duration_hours}h)</span>
                  <span>📍 ${a.location || stop.city_name}</span>
                </div>
              </div>
              <div class="activity-cost-pill">${formatCurrency(a.estimated_cost, trip.currency)}</div>
            </div>
          `).join('') : `<p style="font-size: 0.85rem; color: var(--text-muted);">No activities planned.</p>`}
        </div>
      </div>
    `).join('');
  } else {
    // Timeline / Day-by-Day View
    const allActivities = trip.activities || [];
    container.innerHTML = `
      <div class="stops-timeline-container">
        ${trip.stops.map(stop => `
          <div class="stop-card">
            <div class="stop-header">
              <span class="stop-city-title">📍 Stop ${stop.order_index}: ${stop.city_name}, ${stop.country} (${formatDateRange(stop.arrival_date, stop.departure_date)})</span>
            </div>
            <div class="activities-list">
              ${(stop.activities && stop.activities.length > 0) ? stop.activities.map(a => `
                <div class="activity-item-card">
                  <div class="activity-meta">
                    <div class="activity-title-row">
                      <span class="activity-title">${a.title}</span>
                      <span class="cat-tag cat-${a.category}">${a.category}</span>
                    </div>
                    <div class="activity-sub-info">
                      <span>🕒 ${a.start_time} • ${a.duration_hours} hrs</span>
                      <span>📍 ${a.location || stop.city_name}</span>
                      <span>${a.description || ''}</span>
                    </div>
                  </div>
                  <div class="activity-cost-pill">${formatCurrency(a.estimated_cost, trip.currency)}</div>
                </div>
              `).join('') : '<p style="color: var(--text-muted); font-size: 0.85rem;">No activities.</p>'}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
}

function exportTripPDF() {
  window.print();
}

/* =========================================================================
   CITY & ACTIVITY DISCOVERY (#explore-cities, #explore-activities)
   ========================================================================= */

async function loadDestinationsCatalog() {
  const continent = document.getElementById('filter-city-continent')?.value || 'All';
  const cost = document.getElementById('filter-city-cost')?.value || 'All';

  const res = await apiRequest(`/destinations?continent=${continent}&cost_index=${cost}`);
  state.destinations = res.destinations;

  const container = document.getElementById('catalog-destinations-grid');
  container.innerHTML = state.destinations.map(d => createDestinationCardHtml(d)).join('');
}

function createDestinationCardHtml(dest) {
  const isSaved = dest.is_saved;
  return `
    <div class="dest-card">
      <div class="dest-cover">
        <img src="${dest.image_url}" alt="${dest.name}" loading="lazy">
        <div class="dest-cost-tag">${dest.cost_index} • Avg ${formatCurrency(dest.avg_daily_cost)}/day</div>
        <button class="dest-fav-btn ${isSaved ? 'active' : ''}" title="Save to Wishlist" onclick="toggleSaveDestination(${dest.id})">
          ${isSaved ? '❤️' : '🤍'}
        </button>
      </div>
      <div class="dest-body">
        <div class="dest-title-row">
          <h4 class="dest-name">${dest.name}</h4>
          <span class="dest-country">${dest.country}</span>
        </div>
        <div style="font-size: 0.78rem; color: var(--accent-amber); font-weight: 700; margin-bottom: 6px;">
          ⭐ ${dest.popularity_rating} / 5.0 • Best: ${dest.best_season}
        </div>
        <p class="dest-desc">${dest.description}</p>
        <div class="dest-meta-chips">
          ${(dest.tags || []).map(t => `<span class="meta-chip">#${t}</span>`).join('')}
        </div>
        <button class="btn btn-primary btn-sm" style="margin-top: 10px; width: 100%;" onclick="quickAddCityToTrip('${dest.name}', '${dest.country}', ${dest.latitude}, ${dest.longitude})">
          + Add to Active Trip
        </button>
      </div>
    </div>
  `;
}

async function toggleSaveDestination(destId) {
  try {
    const dest = state.destinations.find(d => d.id === destId);
    if (dest && dest.is_saved) {
      await apiRequest(`/saved-destinations/${destId}`, 'DELETE');
      showToast("Removed from wishlist.");
    } else {
      await apiRequest('/saved-destinations', 'POST', { destination_id: destId });
      showToast("Saved to wishlist! ❤️");
    }
    loadDestinationsCatalog();
  } catch (err) {}
}

async function quickAddCityToTrip(cityName, country, lat, lng) {
  if (!state.activeTripId) {
    showToast("Please create or select a trip first!", "info");
    window.location.hash = '#trips';
    return;
  }
  openAddStopModal();
  document.getElementById('stop-input-city').value = cityName;
  document.getElementById('stop-input-country').value = country;
  document.getElementById('stop-input-lat').value = lat;
  document.getElementById('stop-input-lng').value = lng;
}

async function loadActivitiesCatalog() {
  const city = document.getElementById('filter-act-city')?.value || 'All';
  const category = document.getElementById('filter-act-category')?.value || 'All';

  const res = await apiRequest(`/activities/catalog?city=${city}&category=${category}`);
  state.activities = res.activities;

  const container = document.getElementById('catalog-activities-grid');
  container.innerHTML = state.activities.map(a => `
    <div class="dest-card">
      <div class="dest-cover" style="height: 160px;">
        <img src="${a.image_url}" alt="${a.title}" loading="lazy">
        <div class="dest-cost-tag">${formatCurrency(a.cost, a.currency)} • ${a.duration_hours}h</div>
      </div>
      <div class="dest-body">
        <div class="dest-title-row">
          <h4 class="dest-name" style="font-size: 1rem;">${a.title}</h4>
        </div>
        <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 6px;">
          📍 ${a.city_name}, ${a.country} • <span class="cat-tag cat-${a.category}">${a.category}</span>
        </div>
        <p class="dest-desc">${a.description}</p>
        <button class="btn btn-secondary btn-sm" style="margin-top: 10px; width: 100%;" onclick="quickScheduleActivity('${a.title.replace(/'/g, "\\'")}', '${a.category}', ${a.cost}, '${a.city_name}')">
          + Add to Itinerary
        </button>
      </div>
    </div>
  `).join('');
}

function quickScheduleActivity(title, category, cost, cityName) {
  if (!state.activeTrip) {
    showToast("Open an active trip itinerary first!", "info");
    window.location.hash = '#trips';
    return;
  }
  const matchingStop = (state.activeTrip.stops || []).find(s => s.city_name.toLowerCase() === cityName.toLowerCase());
  if (matchingStop) {
    openAddActivityModal(matchingStop.id, matchingStop.arrival_date);
  } else if (state.activeTrip.stops && state.activeTrip.stops.length > 0) {
    openAddActivityModal(state.activeTrip.stops[0].id, state.activeTrip.stops[0].arrival_date);
  } else {
    showToast(`Add ${cityName} as a stop in your itinerary first!`, "info");
    window.location.hash = `#itinerary-builder/${state.activeTripId}`;
    return;
  }
  document.getElementById('act-input-title').value = title;
  document.getElementById('act-input-cat').value = category;
  document.getElementById('act-input-cost').value = cost;
}

/* =========================================================================
   BUDGET & COST BREAKDOWN (#budget)
   ========================================================================= */

async function loadBudgetView() {
  if (!state.activeTripId && state.trips.length > 0) state.activeTripId = state.trips[0].id;
  if (!state.activeTripId) return;

  const res = await apiRequest(`/trips/${state.activeTripId}`);
  state.activeTrip = res.trip;
  const trip = state.activeTrip;

  // Render Progress Bar & Alerts
  const spent = trip.stats.total_spent;
  const target = trip.stats.total_budget;
  const remaining = target - spent;
  const pct = target > 0 ? Math.min(100, Math.round((spent / target) * 100)) : 0;

  document.getElementById('budget-spent-val').textContent = formatCurrency(spent, trip.currency);
  document.getElementById('budget-target-val').textContent = formatCurrency(target, trip.currency);
  document.getElementById('budget-remaining-val').textContent = formatCurrency(remaining, trip.currency);
  document.getElementById('budget-remaining-val').style.color = remaining < 0 ? 'var(--danger)' : 'var(--success)';
  document.getElementById('budget-percentage-text').textContent = `${pct}%`;

  const bar = document.getElementById('budget-progress-bar');
  bar.style.width = `${pct}%`;
  bar.classList.toggle('overbudget', spent > target);

  const alertArea = document.getElementById('budget-alert-area');
  if (target > 0 && spent > target) {
    alertArea.innerHTML = `
      <div class="alert-banner alert-danger">
        <span>⚠️</span>
        <span><b>Overbudget Alert:</b> Current expenses exceed target budget by <b>${formatCurrency(spent - target, trip.currency)}</b>.</span>
      </div>`;
  } else if (pct >= 85) {
    alertArea.innerHTML = `
      <div class="alert-banner alert-info">
        <span>ℹ️</span>
        <span><b>Budget Warning:</b> You have utilized <b>${pct}%</b> of your allocated funds.</span>
      </div>`;
  } else {
    alertArea.innerHTML = '';
  }

  // Render Recorded Expenses Table
  const tableBody = document.getElementById('expenses-table-body');
  const expenses = trip.expenses || [];
  if (!expenses.length) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No expenses recorded yet.</td></tr>`;
  } else {
    tableBody.innerHTML = expenses.map(e => `
      <tr>
        <td>${e.expense_date}</td>
        <td><span class="cat-tag cat-${e.category}">${e.category}</span></td>
        <td>${e.note || '-'}</td>
        <td>${e.payment_method || 'Card'}</td>
        <td style="font-weight: 700;">${formatCurrency(e.amount, e.currency)}</td>
        <td>
          <button class="icon-btn" style="width: 28px; height: 28px; color: var(--danger);" title="Delete" onclick="deleteExpense(${e.id})">🗑️</button>
        </td>
      </tr>
    `).join('');
  }

  // Render Charts
  renderBudgetCharts(trip);
}

function renderBudgetCharts(trip) {
  // 1. Category Doughnut Chart
  const categories = ['Transport', 'Accommodation', 'Activities', 'Meals', 'Misc'];
  const catSums = { 'Transport': 0, 'Accommodation': 0, 'Activities': 0, 'Meals': 0, 'Misc': 0 };

  (trip.expenses || []).forEach(e => {
    if (catSums[e.category] !== undefined) catSums[e.category] += e.amount;
    else catSums['Misc'] += e.amount;
  });

  // If no expenses, show estimated accommodation & activity costs
  if (trip.expenses.length === 0) {
    (trip.stops || []).forEach(s => catSums['Accommodation'] += (s.accommodation_cost || 0));
    (trip.activities || []).forEach(a => catSums['Activities'] += (a.estimated_cost || 0));
  }

  const ctxCat = document.getElementById('categoryDoughnutChart');
  if (state.categoryChart) state.categoryChart.destroy();
  state.categoryChart = new Chart(ctxCat, {
    type: 'doughnut',
    data: {
      labels: categories,
      datasets: [{
        data: categories.map(c => catSums[c]),
        backgroundColor: ['#2563EB', '#714B67', '#0D9488', '#F59E0B', '#6B7280'],
        borderWidth: 2,
        borderColor: '#111827'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#9CA3AF', font: { family: 'Plus Jakarta Sans' } } }
      }
    }
  });

  // 2. Daily Spending Bar Chart
  const daySums = {};
  (trip.expenses || []).forEach(e => {
    daySums[e.expense_date] = (daySums[e.expense_date] || 0) + e.amount;
  });

  const sortedDates = Object.keys(daySums).sort();
  const dateLabels = sortedDates.length ? sortedDates : [trip.start_date, trip.end_date];
  const dateValues = sortedDates.length ? sortedDates.map(d => daySums[d]) : [0, 0];

  const ctxDaily = document.getElementById('dailySpendingBarChart');
  if (state.dailyChart) state.dailyChart.destroy();
  state.dailyChart = new Chart(ctxDaily, {
    type: 'bar',
    data: {
      labels: dateLabels,
      datasets: [{
        label: `Daily Spending (${trip.currency})`,
        data: dateValues,
        backgroundColor: '#EA580C',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { color: '#9CA3AF' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#9CA3AF' }, grid: { color: 'rgba(255,255,255,0.05)' } }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

async function deleteExpense(expId) {
  try {
    await apiRequest(`/expenses/${expId}`, 'DELETE');
    showToast("Expense deleted.");
    loadBudgetView();
  } catch (err) {}
}

/* =========================================================================
   CALENDAR & TIMELINE VIEW (#calendar)
   ========================================================================= */

async function loadCalendarView() {
  if (!state.activeTripId && state.trips.length > 0) state.activeTripId = state.trips[0].id;
  if (!state.activeTripId) return;

  const res = await apiRequest(`/trips/${state.activeTripId}`);
  state.activeTrip = res.trip;
  const trip = state.activeTrip;

  const container = document.getElementById('calendar-timeline-container');
  const stops = trip.stops || [];

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
      <div class="chart-card">
        <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 16px;">🗓️ Multi-Day Agenda Schedule</h3>
        <div class="stops-timeline-container">
          ${stops.map(s => `
            <div style="background: var(--bg-surface-elevated); padding: 14px 18px; border-radius: var(--radius-md); margin-bottom: 12px;">
              <div style="font-weight: 700; font-size: 1rem; color: var(--primary);">📍 ${s.city_name}</div>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px;">${formatDateRange(s.arrival_date, s.departure_date)}</div>
              ${(s.activities || []).map(a => `
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; padding: 4px 0; border-top: 1px solid var(--border-subtle);">
                  <span>⏰ ${a.start_time} - ${a.title}</span>
                  <span style="font-weight: 600;">${formatCurrency(a.estimated_cost, trip.currency)}</span>
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>
      </div>

      <div class="chart-card">
        <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 16px;">⏱️ Journey Progression</h3>
        <div style="position: relative; padding-left: 20px; border-left: 2px solid var(--primary);">
          ${stops.map(s => `
            <div style="margin-bottom: 24px; position: relative;">
              <div style="position: absolute; left: -27px; top: 0; width: 12px; height: 12px; border-radius: 50%; background: var(--primary); border: 2px solid #FFF;"></div>
              <div style="font-weight: 700;">Arrive in ${s.city_name}, ${s.country}</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">${s.arrival_date} • Check-in</div>
              <div style="font-size: 0.82rem; color: var(--text-dim); margin-top: 4px;">${(s.activities || []).length} scheduled activities</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

/* =========================================================================
   PUBLIC / SHARED TRIP VIEW (#share/:slug)
   ========================================================================= */

async function loadPublicTripView(slug) {
  try {
    const res = await apiRequest(`/public/trips/${slug}`);
    const trip = res.trip;
    const container = document.getElementById('public-share-container');

    container.innerHTML = `
      <div class="hero-banner" style="margin-bottom: 24px; background-image: url('${trip.cover_image}');">
        <div class="hero-content">
          <div class="hero-badge">🌍 Public Shared Itinerary</div>
          <h2 class="hero-title">${trip.title}</h2>
          <p class="hero-sub">${trip.description || 'Explore this curated multi-city travel itinerary.'}</p>
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-primary btn-lg" onclick="forkPublicTrip('${trip.share_slug}')">📋 Copy Trip to My Account</button>
            <button class="btn btn-secondary btn-lg" onclick="exportTripPDF()">📄 Print / PDF</button>
          </div>
        </div>
      </div>

      <div class="itinerary-layout">
        <div>
          <h3 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 16px;">Itinerary Breakdown (${trip.stops.length} Cities)</h3>
          <div class="stops-timeline-container">
            ${trip.stops.map(s => `
              <div class="stop-card">
                <div class="stop-header">
                  <span class="stop-city-title">📍 ${s.order_index}. ${s.city_name}, ${s.country}</span>
                  <span class="stop-dates-tag">${formatDateRange(s.arrival_date, s.departure_date)}</span>
                </div>
                <div class="activities-list">
                  ${(s.activities || []).map(a => `
                    <div class="activity-item-card">
                      <div class="activity-meta">
                        <div class="activity-title">${a.title}</div>
                        <div class="activity-sub-info">🕒 ${a.start_time} • ${a.duration_hours}h • ${a.location || s.city_name}</div>
                      </div>
                      <div class="activity-cost-pill">${formatCurrency(a.estimated_cost, trip.currency)}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div>
          <div class="chart-card">
            <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 12px;">🗺️ Route Map</h4>
            <div id="public-trip-map"></div>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      initTripRouteMap('public-trip-map', trip.stops);
    }, 100);
  } catch (err) {
    document.getElementById('public-share-container').innerHTML = `
      <div style="text-align: center; padding: 60px;">
        <h3>Shared trip not found or expired.</h3>
      </div>`;
  }
}

async function forkPublicTrip(slug) {
  try {
    const res = await apiRequest(`/public/trips/${slug}/fork`, 'POST');
    showToast("Trip copied to your account! Redirecting...");
    window.location.hash = `#itinerary-builder/${res.trip_id}`;
  } catch (err) {}
}

function openShareModalForTrip(tripId, slug) {
  const url = `${window.location.origin}${window.location.pathname}#share/${slug}`;
  document.getElementById('share-link-input').value = url;

  // Render QR Code
  const qrContainer = document.getElementById('qrcode-container');
  qrContainer.innerHTML = '';
  if (window.QRCode) {
    new QRCode(qrContainer, { text: url, width: 140, height: 140 });
  }

  openModal('modal-share-trip');
}

function openShareTripModal() {
  if (state.activeTrip) {
    openShareModalForTrip(state.activeTrip.id, state.activeTrip.share_slug);
  }
}

function copyShareLink() {
  const input = document.getElementById('share-link-input');
  input.select();
  navigator.clipboard.writeText(input.value);
  showToast("Public link copied to clipboard! 📋");
}

function shareSocial(platform) {
  const url = encodeURIComponent(document.getElementById('share-link-input').value);
  const text = encodeURIComponent("Check out my travel itinerary on GlobeTrotter!");
  if (platform === 'twitter') window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  if (platform === 'whatsapp') window.open(`https://api.whatsapp.com/send?text=${text}%20${url}`, '_blank');
}

function openPublicViewDirectly() {
  const slug = state.activeTrip ? state.activeTrip.share_slug : '';
  if (slug) {
    closeModal('modal-share-trip');
    window.location.hash = `#share/${slug}`;
  }
}

/* =========================================================================
   USER PROFILE & SETTINGS (#profile)
   ========================================================================= */

async function loadProfileView() {
  const user = state.currentUser;
  document.getElementById('prof-name').value = user.name;
  document.getElementById('prof-email').value = user.email;
  document.getElementById('prof-avatar').value = user.avatar || '';
  document.getElementById('prof-bio').value = user.bio || '';
  document.getElementById('prof-currency').value = user.home_currency || 'USD';
  document.getElementById('prof-lang').value = user.language || 'en';

  // Load wishlist
  const res = await apiRequest('/saved-destinations');
  state.savedDestinations = res.saved_destinations;
  const grid = document.getElementById('profile-wishlist-grid');
  if (!state.savedDestinations.length) {
    grid.innerHTML = `<p style="grid-column: 1/-1; color: var(--text-muted); font-size: 0.85rem;">No saved destinations yet. Explore cities to add some!</p>`;
  } else {
    grid.innerHTML = state.savedDestinations.map(d => `
      <div class="dest-card">
        <div class="dest-cover" style="height: 120px;">
          <img src="${d.image_url}" alt="${d.name}">
        </div>
        <div class="dest-body" style="padding: 10px;">
          <div style="font-weight: 700; font-size: 0.9rem;">${d.name}, ${d.country}</div>
          <button class="btn btn-secondary btn-sm" style="margin-top: 6px; font-size: 0.75rem;" onclick="quickAddCityToTrip('${d.name}', '${d.country}', ${d.latitude}, ${d.longitude})">+ Add to Trip</button>
        </div>
      </div>
    `).join('');
  }
}

async function handleSaveProfile(e) {
  e.preventDefault();
  const name = document.getElementById('prof-name').value;
  const avatar = document.getElementById('prof-avatar').value;
  const bio = document.getElementById('prof-bio').value;
  const home_currency = document.getElementById('prof-currency').value;
  const language = document.getElementById('prof-lang').value;

  try {
    await apiRequest('/auth/profile', 'PUT', { name, avatar, bio, home_currency, language });
    showToast("Profile updated successfully!");
    await initUserSession();
  } catch (err) {}
}

function exportDataJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ user: state.currentUser, trips: state.trips }, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `globetrotter_backup_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast("JSON data backup exported!");
}

async function resetDemoDatabase() {
  if (!confirm("Are you sure you want to reset the database back to clean hackathon seed data?")) return;
  try {
    await apiRequest('/admin/reset-demo', 'POST');
    showToast("Database reset to demo seed data!");
    await initUserSession();
    window.location.hash = '#dashboard';
  } catch (err) {}
}

/* =========================================================================
   ADMIN DASHBOARD & SQL RELATIONAL INSPECTOR (#admin)
   ========================================================================= */

async function loadAdminDashboard() {
  try {
    const res = await apiRequest('/admin/stats');
    const stats = res.stats;

    // Render Stats
    const container = document.getElementById('admin-stats-cards');
    container.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon-wrapper stat-icon-orange">👥</div>
        <div>
          <div class="stat-val">${stats.total_users}</div>
          <div class="stat-label">Registered Travelers</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrapper stat-icon-purple">✈️</div>
        <div>
          <div class="stat-val">${stats.total_trips}</div>
          <div class="stat-label">Total Trips Created</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrapper stat-icon-teal">🏙️</div>
        <div>
          <div class="stat-val">${stats.total_stops}</div>
          <div class="stat-label">Total City Stops</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrapper stat-icon-blue">💵</div>
        <div>
          <div class="stat-val">${formatCurrency(stats.aggregate_budget)}</div>
          <div class="stat-label">Aggregate Budget</div>
        </div>
      </div>
    `;

    // Render Schema Tables
    const schemaRes = await apiRequest('/admin/tables');
    const tables = schemaRes.tables;
    const schemaContainer = document.getElementById('admin-schema-tables');
    schemaContainer.innerHTML = Object.keys(tables).map(tname => {
      const t = tables[tname];
      return `
        <div style="background: var(--bg-surface-elevated); padding: 14px; border-radius: var(--radius-md); margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; font-weight: 700; margin-bottom: 6px;">
            <span>📋 Table: <code>${tname}</code></span>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${t.row_count} rows</span>
          </div>
          <div style="font-size: 0.78rem; color: var(--text-dim); margin-bottom: 6px;">
            Columns: ${t.columns.map(c => `<b>${c.name}</b> (${c.type})`).join(', ')}
          </div>
          ${t.foreign_keys.length > 0 ? `
            <div style="font-size: 0.75rem; color: var(--accent-teal);">
              🔗 Foreign Keys: ${t.foreign_keys.map(fk => `${fk.from} &rarr; ${fk.table}(${fk.to})`).join(', ')}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    // Execute default query
    executeAdminSQL();
  } catch (err) {}
}

function setAdminQuery(sql) {
  document.getElementById('admin-sql-input').value = sql;
  executeAdminSQL();
}

async function executeAdminSQL() {
  const query = document.getElementById('admin-sql-input').value;
  const resultContainer = document.getElementById('admin-sql-results');
  try {
    const res = await apiRequest('/admin/query', 'POST', { query });
    const rows = res.results || [];
    if (!rows.length) {
      resultContainer.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-muted); padding: 10px;">Query executed successfully (0 rows returned).</p>`;
      return;
    }
    const cols = Object.keys(rows[0]);
    resultContainer.innerHTML = `
      <table class="data-table">
        <thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead>
        <tbody>
          ${rows.map(r => `<tr>${cols.map(c => `<td>${r[c] !== null ? r[c] : '<i>null</i>'}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    resultContainer.innerHTML = `<div class="alert-banner alert-danger">${err.message}</div>`;
  }
}

/* =========================================================================
   MODAL CONTROLS & SUBMISSION HANDLERS
   ========================================================================= */

function openModal(id) {
  document.getElementById(id).classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

function openCreateTripModal() {
  // Set default dates: 20 days from today to 28 days
  const d1 = new Date();
  d1.setDate(d1.getDate() + 15);
  const d2 = new Date();
  d2.setDate(d2.getDate() + 24);
  document.getElementById('trip-input-start').value = d1.toISOString().split('T')[0];
  document.getElementById('trip-input-end').value = d2.toISOString().split('T')[0];
  openModal('modal-create-trip');
}

function selectPresetCover(src) {
  document.getElementById('trip-input-cover').value = src;
}

async function handleCreateTripSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('trip-input-title').value;
  const start_date = document.getElementById('trip-input-start').value;
  const end_date = document.getElementById('trip-input-end').value;
  const total_budget = document.getElementById('trip-input-budget').value;
  const currency = document.getElementById('trip-input-currency').value;
  const description = document.getElementById('trip-input-desc').value;
  const cover_image = document.getElementById('trip-input-cover').value;

  try {
    const res = await apiRequest('/trips', 'POST', { title, start_date, end_date, total_budget, currency, description, cover_image });
    closeModal('modal-create-trip');
    showToast("Trip created! Let's add city stops.");
    window.location.hash = `#itinerary-builder/${res.trip_id}`;
  } catch (err) {}
}

function openAddStopModal() {
  if (state.activeTrip) {
    document.getElementById('stop-input-arrival').value = state.activeTrip.start_date;
    document.getElementById('stop-input-departure').value = state.activeTrip.end_date;
  }
  openModal('modal-add-stop');
}

function handlePresetCitySelect(val) {
  if (!val) return;
  const [city, country, lat, lng] = val.split('|');
  document.getElementById('stop-input-city').value = city;
  document.getElementById('stop-input-country').value = country;
  document.getElementById('stop-input-lat').value = lat;
  document.getElementById('stop-input-lng').value = lng;
}

async function handleAddStopSubmit(e) {
  e.preventDefault();
  const city_name = document.getElementById('stop-input-city').value;
  const country = document.getElementById('stop-input-country').value;
  const arrival_date = document.getElementById('stop-input-arrival').value;
  const departure_date = document.getElementById('stop-input-departure').value;
  const accommodation_cost = document.getElementById('stop-input-cost').value;
  const stay_notes = document.getElementById('stop-input-notes').value;
  const latitude = parseFloat(document.getElementById('stop-input-lat').value) || null;
  const longitude = parseFloat(document.getElementById('stop-input-lng').value) || null;

  try {
    await apiRequest(`/trips/${state.activeTripId}/stops`, 'POST', { city_name, country, arrival_date, departure_date, accommodation_cost, stay_notes, latitude, longitude });
    closeModal('modal-add-stop');
    showToast(`Added ${city_name} to itinerary!`);
    await loadItineraryBuilder();
  } catch (err) {}
}

function openAddActivityModal(stopId, defaultDate) {
  document.getElementById('act-input-stop-id').value = stopId;
  document.getElementById('act-input-date').value = defaultDate || (state.activeTrip ? state.activeTrip.start_date : '');
  openModal('modal-add-activity');
}

async function handleAddActivitySubmit(e) {
  e.preventDefault();
  const stop_id = document.getElementById('act-input-stop-id').value;
  const title = document.getElementById('act-input-title').value;
  const category = document.getElementById('act-input-cat').value;
  const activity_date = document.getElementById('act-input-date').value;
  const start_time = document.getElementById('act-input-time').value;
  const duration_hours = document.getElementById('act-input-duration').value;
  const estimated_cost = document.getElementById('act-input-cost').value;
  const location = document.getElementById('act-input-loc').value;
  const description = document.getElementById('act-input-desc').value;

  try {
    await apiRequest(`/stops/${stop_id}/activities`, 'POST', { title, category, activity_date, start_time, duration_hours, estimated_cost, location, description });
    closeModal('modal-add-activity');
    showToast(`Scheduled activity: ${title}`);
    await loadItineraryBuilder();
  } catch (err) {}
}

function openAddExpenseModal() {
  document.getElementById('exp-input-date').value = new Date().toISOString().split('T')[0];
  openModal('modal-add-expense');
}

async function handleAddExpenseSubmit(e) {
  e.preventDefault();
  const category = document.getElementById('exp-input-cat').value;
  const amount = document.getElementById('exp-input-amount').value;
  const expense_date = document.getElementById('exp-input-date').value;
  const payment_method = document.getElementById('exp-input-method').value;
  const note = document.getElementById('exp-input-note').value;

  try {
    await apiRequest(`/trips/${state.activeTripId}/expenses`, 'POST', { category, amount, expense_date, payment_method, note });
    closeModal('modal-add-expense');
    showToast("Expense recorded!");
    await loadBudgetView();
  } catch (err) {}
}

/* =========================================================================
   GLOBAL SEARCH & THEME TOGGLE
   ========================================================================= */

function handleGlobalSearch(query) {
  const q = query.trim().toLowerCase();
  if (!q) return;
  if (location.hash !== '#explore-cities') {
    location.hash = '#explore-cities';
  }
  const input = document.getElementById('global-search-input');
  if (input) {
    const cards = document.querySelectorAll('#catalog-destinations-grid .dest-card');
    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(q) ? 'flex' : 'none';
    });
  }
}

/* =========================================================================
   TRIP TEMPLATES & ICALENDAR EXPORT
   ========================================================================= */

const TRIP_TEMPLATES = {
  mediterranean: {
    title: "Mediterranean Coastal Odyssey",
    description: "A sun-kissed European adventure across Paris, Nice, Barcelona, and Rome.",
    total_budget: 280000,
    currency: "INR",
    cover_image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1000",
    duration_days: 12
  },
  japan: {
    title: "Japan Sakura & Zen Trail",
    description: "An inspiring cultural expedition from neon Tokyo skyscrapers to tranquil Kyoto bamboo groves and Osaka foodie markets.",
    total_budget: 240000,
    currency: "INR",
    cover_image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1000",
    duration_days: 10
  },
  alps: {
    title: "Swiss Alps & Italian Lakes Expedition",
    description: "Scenic alpine cogwheel railways, snow-capped peaks, and serene lakefronts in Zurich, Lucerne, and Lake Como.",
    total_budget: 310000,
    currency: "INR",
    cover_image: "https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=1000",
    duration_days: 9
  },
  bali: {
    title: "Bali Tropical Explorer & Islands",
    description: "Lush Ubud emerald rice terraces, sacred sea temples, surf breaks, and holistic rejuvenation.",
    total_budget: 140000,
    currency: "INR",
    cover_image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1000",
    duration_days: 8
  }
};

function handleSelectTripTemplate(key) {
  if (!key || !TRIP_TEMPLATES[key]) return;
  const tmpl = TRIP_TEMPLATES[key];
  document.getElementById('trip-input-title').value = tmpl.title;
  document.getElementById('trip-input-desc').value = tmpl.description;
  document.getElementById('trip-input-budget').value = tmpl.total_budget;
  document.getElementById('trip-input-currency').value = tmpl.currency;
  document.getElementById('trip-input-cover').value = tmpl.cover_image;

  // Set start/end dates
  const d1 = new Date();
  d1.setDate(d1.getDate() + 20);
  const d2 = new Date(d1);
  d2.setDate(d2.getDate() + tmpl.duration_days);
  document.getElementById('trip-input-start').value = d1.toISOString().split('T')[0];
  document.getElementById('trip-input-end').value = d2.toISOString().split('T')[0];
  showToast(`Template "${tmpl.title}" applied!`);
}

function exportTripICal() {
  const trip = state.activeTrip;
  if (!trip) {
    showToast("No active trip to export.", "error");
    return;
  }

  let icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GlobeTrotter//Trip Itinerary Planner//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${trip.title}`
  ];

  const formatDateToICS = (dateStr, timeStr = "09:00") => {
    const cleanDate = dateStr.replace(/-/g, '');
    const cleanTime = timeStr.replace(/:/g, '') + '00';
    return `${cleanDate}T${cleanTime}`;
  };

  // Add Stops Events
  (trip.stops || []).forEach((stop, i) => {
    const start = formatDateToICS(stop.arrival_date, "14:00");
    const end = formatDateToICS(stop.departure_date, "11:00");
    icsLines.push(
      "BEGIN:VEVENT",
      `UID:stop-${stop.id}-${Date.now()}@globetrotter`,
      `DTSTAMP:${formatDateToICS(new Date().toISOString().split('T')[0], "00:00")}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:🏨 Stay in ${stop.city_name}, ${stop.country}`,
      `DESCRIPTION:${stop.stay_notes || 'Hotel / Lodging waypoint in ' + stop.city_name}`,
      `LOCATION:${stop.city_name}, ${stop.country}`,
      "END:VEVENT"
    );
  });

  // Add Activity Events
  (trip.activities || []).forEach((act) => {
    const start = formatDateToICS(act.activity_date, act.start_time || "10:00");
    const duration = act.duration_hours || 2;
    const durHours = Math.floor(duration);
    const durMins = Math.round((duration - durHours) * 60);
    const endHour = Math.min(23, parseInt((act.start_time || "10:00").split(':')[0]) + durHours);
    const endStr = `${String(endHour).padStart(2, '0')}:${String(durMins).padStart(2, '0')}`;
    const end = formatDateToICS(act.activity_date, endStr);

    icsLines.push(
      "BEGIN:VEVENT",
      `UID:act-${act.id}-${Date.now()}@globetrotter`,
      `DTSTAMP:${formatDateToICS(new Date().toISOString().split('T')[0], "00:00")}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:🎟️ ${act.title}`,
      `DESCRIPTION:${act.description || ''} (Category: ${act.category})`,
      `LOCATION:${act.location || ''}`,
      "END:VEVENT"
    );
  });

  icsLines.push("END:VCALENDAR");
  const icsData = icsLines.join("\r\n");

  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  const cleanTitle = trip.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
  link.setAttribute('download', `${cleanTitle}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("iCal (.ics) Calendar file exported! Import it into Google or Apple Calendar. 📅");
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  document.getElementById('theme-toggle-btn').textContent = newTheme === 'dark' ? '🌙' : '☀️';
  localStorage.setItem('globetrotter_theme', newTheme);
}

// Initial Boot
document.addEventListener('DOMContentLoaded', async () => {
  const savedTheme = localStorage.getItem('globetrotter_theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.getElementById('theme-toggle-btn').textContent = savedTheme === 'dark' ? '🌙' : '☀️';
  }

  await initUserSession();
  initRouter();
});
