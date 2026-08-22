const app = document.getElementById('app');
const navEl = document.getElementById('nav');
let currentUser = null;

function renderNav() {
  if (Api.token) {
    navEl.innerHTML = `
      <a href="#/dashboard">Dashboard</a>
      <a href="#/trips">My Trips</a>
      <a href="#/profile">Profile</a>
      <button id="logoutBtn">Logout</button>`;
    document.getElementById('logoutBtn').onclick = () => { Api.setToken(null); location.hash = '#/login'; };
  } else {
    navEl.innerHTML = `<a href="#/login">Login</a> <a href="#/signup" class="btn-primary">Sign up</a>`;
  }
}

function requireAuth() {
  if (!Api.token) { location.hash = '#/login'; return false; }
  return true;
}

async function router() {
  renderNav();
  const hash = location.hash || '#/dashboard';
  const [, route, param] = hash.split('/');

  try {
    if (route === 'login') return viewLogin();
    if (route === 'signup') return viewSignup();
    if (route === 'trip' && param) { if (!requireAuth()) return; return viewTripDetail(param); }
    if (route === 'trips') { if (!requireAuth()) return; return viewMyTrips(); }
    if (route === 'new-trip') { if (!requireAuth()) return; return viewCreateTrip(); }
    if (route === 'profile') { if (!requireAuth()) return; return viewProfile(); }
    if (route === 'public' && param) return viewPublicTrip(param);
    if (route === 'dashboard') { if (!requireAuth()) return; return viewDashboard(); }
    location.hash = Api.token ? '#/dashboard' : '#/login';
  } catch (err) {
    app.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);

// ---------- AUTH VIEWS ----------

function viewLogin() {
  app.innerHTML = `
    <div class="card" style="max-width:400px;margin:40px auto;">
      <h1>Welcome back</h1>
      <p class="muted">Log in to your GlobeTrotter account.</p>
      <div id="msg"></div>
      <label>Email</label><input id="email" type="email" />
      <label>Password</label><input id="password" type="password" />
      <button class="btn btn-primary" style="width:100%;margin-top:16px;" id="loginBtn">Log In</button>
      <p class="muted" style="margin-top:12px;">No account? <a href="#/signup">Sign up</a></p>
    </div>`;
  document.getElementById('loginBtn').onclick = async () => {
    try {
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const { token } = await Api.post('/auth/login', { email, password });
      Api.setToken(token);
      location.hash = '#/dashboard';
    } catch (err) {
      document.getElementById('msg').innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
    }
  };
}

function viewSignup() {
  app.innerHTML = `
    <div class="card" style="max-width:400px;margin:40px auto;">
      <h1>Create your account</h1>
      <p class="muted">Start planning your next trip.</p>
      <div id="msg"></div>
      <label>Name</label><input id="name" />
      <label>Email</label><input id="email" type="email" />
      <label>Password</label><input id="password" type="password" />
      <button class="btn btn-primary" style="width:100%;margin-top:16px;" id="signupBtn">Sign Up</button>
      <p class="muted" style="margin-top:12px;">Already have an account? <a href="#/login">Log in</a></p>
    </div>`;
  document.getElementById('signupBtn').onclick = async () => {
    try {
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const { token } = await Api.post('/auth/signup', { name, email, password });
      Api.setToken(token);
      location.hash = '#/dashboard';
    } catch (err) {
      document.getElementById('msg').innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
    }
  };
}

// ---------- DASHBOARD ----------

async function viewDashboard() {
  app.innerHTML = `<div class="center">Loading...</div>`;
  const { trips } = await Api.get('/trips');
  const { user } = await Api.get('/auth/me');
  currentUser = user;
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = trips.filter(t => t.end_date >= today).slice(0, 4);
  const past = trips.filter(t => t.end_date < today);

  app.innerHTML = `
    <h1>Welcome back, ${escapeHtml(user.name)} 👋</h1>
    <p class="muted">Here's what's happening with your travel plans.</p>
    <div style="margin:16px 0;">
      <a href="#/new-trip" class="btn btn-primary">+ Plan New Trip</a>
      <a href="#/trips" class="btn">View All Trips</a>
    </div>
    <h2>Upcoming Trips</h2>
    ${upcoming.length ? `<div class="grid grid-2">${upcoming.map(tripCardHtml).join('')}</div>` : `<p class="muted">No upcoming trips yet. Plan one!</p>`}
    ${past.length ? `<h2 style="margin-top:24px;">Past Trips</h2><div class="grid grid-2">${past.slice(0, 4).map(tripCardHtml).join('')}</div>` : ''}
  `;
  bindTripCardClicks();
}

function tripCardHtml(t) {
  return `<div class="card trip-card" data-id="${t.id}">
    <h3>${escapeHtml(t.name)} ${t.visibility === 'public' ? '<span class="badge">Public</span>' : ''}</h3>
    <div class="dates">${t.start_date} → ${t.end_date}</div>
    <p class="muted">${t.stop_count} ${t.stop_count === 1 ? 'city' : 'cities'}</p>
  </div>`;
}

function bindTripCardClicks() {
  document.querySelectorAll('.trip-card').forEach(el => {
    el.onclick = () => location.hash = `#/trip/${el.dataset.id}`;
  });
}

// ---------- MY TRIPS ----------

async function viewMyTrips() {
  app.innerHTML = `<div class="center">Loading...</div>`;
  const { trips } = await Api.get('/trips');
  app.innerHTML = `
    <h1>My Trips</h1>
    <a href="#/new-trip" class="btn btn-primary" style="margin-bottom:16px;display:inline-block;">+ Plan New Trip</a>
    ${trips.length ? `<div class="grid grid-2">${trips.map(t => `
      <div class="card trip-card" data-id="${t.id}">
        <h3>${escapeHtml(t.name)} ${t.visibility === 'public' ? '<span class="badge">Public</span>' : ''}</h3>
        <div class="dates">${t.start_date} → ${t.end_date}</div>
        <p class="muted">${t.stop_count} ${t.stop_count === 1 ? 'city' : 'cities'}</p>
        <button class="btn btn-sm btn-danger" data-del="${t.id}">Delete</button>
      </div>`).join('')}</div>` : `<p class="center">No trips yet. <a href="#/new-trip">Create your first trip</a>.</p>`}
  `;
  bindTripCardClicks();
  document.querySelectorAll('[data-del]').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      if (!confirm('Delete this trip? This cannot be undone.')) return;
      await Api.del(`/trips/${btn.dataset.del}`);
      viewMyTrips();
    };
  });
}

// ---------- CREATE TRIP ----------

function viewCreateTrip() {
  app.innerHTML = `
    <div class="card" style="max-width:520px;">
      <h1>Create a New Trip</h1>
      <div id="msg"></div>
      <label>Trip Name</label><input id="name" placeholder="e.g. Weekend Europe Trip" />
      <label>Description</label><textarea id="description"></textarea>
      <div class="grid grid-2">
        <div><label>Start Date</label><input id="start_date" type="date" /></div>
        <div><label>End Date</label><input id="end_date" type="date" /></div>
      </div>
      <label>Cover Photo URL (optional)</label><input id="cover_photo" placeholder="https://..." />
      <button class="btn btn-primary" style="margin-top:16px;" id="createBtn">Create Trip</button>
    </div>`;
  document.getElementById('createBtn').onclick = async () => {
    try {
      const body = {
        name: document.getElementById('name').value.trim(),
        description: document.getElementById('description').value.trim(),
        start_date: document.getElementById('start_date').value,
        end_date: document.getElementById('end_date').value,
        cover_photo: document.getElementById('cover_photo').value.trim()
      };
      const { trip } = await Api.post('/trips', body);
      location.hash = `#/trip/${trip.id}`;
    } catch (err) {
      document.getElementById('msg').innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
    }
  };
}

// ---------- TRIP DETAIL (itinerary builder + budget + calendar + share) ----------

let activeTab = 'itinerary';

async function viewTripDetail(id) {
  app.innerHTML = `<div class="center">Loading...</div>`;
  const { trip } = await Api.get(`/trips/${id}`);
  renderTripDetail(trip);
}

function renderTripDetail(trip) {
  app.innerHTML = `
    <h1>${escapeHtml(trip.name)}</h1>
    <p class="muted">${trip.start_date} → ${trip.end_date} ${trip.description ? '· ' + escapeHtml(trip.description) : ''}</p>
    <div class="tabs">
      <button data-tab="itinerary" class="${activeTab === 'itinerary' ? 'active' : ''}">Itinerary Builder</button>
      <button data-tab="calendar" class="${activeTab === 'calendar' ? 'active' : ''}">Calendar / Timeline</button>
      <button data-tab="budget" class="${activeTab === 'budget' ? 'active' : ''}">Budget</button>
      <button data-tab="share" class="${activeTab === 'share' ? 'active' : ''}">Share</button>
    </div>
    <div id="tabContent"></div>
  `;
  document.querySelectorAll('.tabs button').forEach(btn => {
    btn.onclick = () => { activeTab = btn.dataset.tab; renderTripDetail(trip); };
  });
  const content = document.getElementById('tabContent');
  if (activeTab === 'itinerary') renderItineraryTab(content, trip);
  if (activeTab === 'calendar') renderCalendarTab(content, trip);
  if (activeTab === 'budget') renderBudgetTab(content, trip);
  if (activeTab === 'share') renderShareTab(content, trip);
}

// --- Itinerary tab ---

async function renderItineraryTab(content, trip) {
  content.innerHTML = `
    <div class="card">
      <h2>Add a City / Stop</h2>
      <div id="citySearchResults"></div>
      <label>Search cities</label>
      <input id="citySearch" placeholder="Search by city, country or region..." />
      <div id="cityResults"></div>
    </div>
    <div id="stopsList"></div>
  `;
  document.getElementById('citySearch').oninput = debounce(async (e) => {
    const q = e.target.value.trim();
    const { cities } = await Api.get(`/cities${q ? '?search=' + encodeURIComponent(q) : ''}`);
    document.getElementById('cityResults').innerHTML = cities.slice(0, 8).map(c => `
      <div class="city-pill">
        <div><strong>${escapeHtml(c.name)}</strong>, ${escapeHtml(c.country)} <span class="muted">(cost index ${c.cost_index})</span></div>
        <button class="btn btn-sm btn-primary" data-city="${c.id}">Add</button>
      </div>`).join('');
    document.querySelectorAll('[data-city]').forEach(btn => {
      btn.onclick = () => promptAddStop(trip, btn.dataset.city);
    });
  }, 300);

  renderStopsList(document.getElementById('stopsList'), trip);
}

function promptAddStop(trip, cityId) {
  const start = prompt(`Stop start date (YYYY-MM-DD), within ${trip.start_date} to ${trip.end_date}:`, trip.start_date);
  if (!start) return;
  const end = prompt('Stop end date (YYYY-MM-DD):', start);
  if (!end) return;
  Api.post(`/trips/${trip.id}/stops`, { city_id: Number(cityId), start_date: start, end_date: end })
    .then(() => viewTripDetail(trip.id))
    .catch(err => alert(err.message));
}

function renderStopsList(el, trip) {
  if (!trip.stops.length) {
    el.innerHTML = `<p class="muted">No cities added yet. Search above to add your first stop.</p>`;
    return;
  }
  el.innerHTML = trip.stops.map(stop => `
    <div class="card stop-block">
      <h3>${escapeHtml(stop.city.name)}, ${escapeHtml(stop.city.country)}
        <button class="btn btn-sm btn-danger" data-delstop="${stop.id}">Remove City</button>
      </h3>
      <p class="muted">${stop.start_date} → ${stop.end_date}</p>
      <div id="acts-${stop.id}"></div>
      <button class="btn btn-sm" data-addact="${stop.id}">+ Add Activity</button>
      <div id="actSearch-${stop.id}" style="margin-top:10px;"></div>
    </div>
  `).join('');

  trip.stops.forEach(stop => {
    document.getElementById(`acts-${stop.id}`).innerHTML = stop.activities.length
      ? stop.activities.map(a => `
        <div class="activity-row">
          <span>${a.date} · ${escapeHtml(a.name)} <span class="muted">(${a.category}, ${a.duration_hours}h)</span></span>
          <span>₹${a.estimated_cost} <button class="btn btn-sm btn-danger" data-delact="${a.id}">✕</button></span>
        </div>`).join('')
      : `<p class="muted">No activities yet.</p>`;
  });

  document.querySelectorAll('[data-delstop]').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('Remove this city and all its activities?')) return;
      await Api.del(`/stops/${btn.dataset.delstop}`);
      viewTripDetail(trip.id);
    };
  });
  document.querySelectorAll('[data-delact]').forEach(btn => {
    btn.onclick = async () => {
      await Api.del(`/trip-activities/${btn.dataset.delact}`);
      viewTripDetail(trip.id);
    };
  });
  document.querySelectorAll('[data-addact]').forEach(btn => {
    btn.onclick = () => showActivitySearch(btn.dataset.addact, trip);
  });
}

async function showActivitySearch(stopId, trip) {
  const stop = trip.stops.find(s => String(s.id) === String(stopId));
  const box = document.getElementById(`actSearch-${stopId}`);
  const { activities } = await Api.get(`/activities?city_id=${stop.city_id}`);
  if (!activities.length) { box.innerHTML = `<p class="muted">No activities available for this city yet.</p>`; return; }
  box.innerHTML = `
    <label>Choose an activity</label>
    <select id="actSelect-${stopId}">
      ${activities.map(a => `<option value="${a.id}">${escapeHtml(a.name)} — ${a.category} — ₹${a.estimated_cost}</option>`).join('')}
    </select>
    <label>Date</label>
    <input type="date" id="actDate-${stopId}" min="${stop.start_date}" max="${stop.end_date}" value="${stop.start_date}" />
    <button class="btn btn-sm btn-primary" style="margin-top:8px;" id="confirmAct-${stopId}">Add to Itinerary</button>
  `;
  document.getElementById(`confirmAct-${stopId}`).onclick = async () => {
    try {
      const activity_id = Number(document.getElementById(`actSelect-${stopId}`).value);
      const date = document.getElementById(`actDate-${stopId}`).value;
      await Api.post(`/stops/${stopId}/activities`, { activity_id, date });
      viewTripDetail(trip.id);
    } catch (err) {
      alert(err.message);
    }
  };
}

// --- Calendar / timeline tab ---

function renderCalendarTab(content, trip) {
  const byDate = {};
  trip.stops.forEach(stop => {
    stop.activities.forEach(a => {
      byDate[a.date] = byDate[a.date] || [];
      byDate[a.date].push({ ...a, cityName: stop.city.name });
    });
  });
  const dates = Object.keys(byDate).sort();
  content.innerHTML = `
    <div class="card">
      <h2>Day-wise Timeline</h2>
      ${dates.length ? dates.map(d => `
        <div class="day-header">${d}</div>
        ${byDate[d].sort((a, b) => a.sequence - b.sequence).map(a => `
          <div class="activity-row">
            <span>${escapeHtml(a.name)} <span class="muted">— ${escapeHtml(a.cityName)}, ${a.duration_hours}h</span></span>
            <span>₹${a.estimated_cost}</span>
          </div>`).join('')}
      `).join('') : `<p class="muted">Add activities in the Itinerary Builder tab to see them on the timeline.</p>`}
    </div>
  `;
}

// --- Budget tab ---

function renderBudgetTab(content, trip) {
  const b = trip.budget;
  content.innerHTML = `
    <div class="card">
      <h2>Trip Budget</h2>
      <div class="budget-total">₹${b.total_cost}</div>
      <p class="muted">Total estimated cost across ${b.days} day(s) — average ₹${b.average_daily_cost}/day</p>
      <h3 style="margin-top:16px;">By Category</h3>
      ${Object.entries(b.by_category).map(([cat, amt]) => `
        <div class="budget-row"><span>${escapeHtml(cat)}</span><span>₹${amt}</span></div>`).join('') || '<p class="muted">No expenses yet.</p>'}
    </div>
    <div class="card">
      <h2>Add Expense</h2>
      <div id="expMsg"></div>
      <label>Category</label>
      <select id="expCategory">
        <option>Transportation</option><option>Accommodation</option><option>Meals</option><option>Other</option>
      </select>
      <label>Description</label><input id="expDesc" />
      <label>Amount</label><input id="expAmount" type="number" min="0" step="0.01" />
      <button class="btn btn-primary" style="margin-top:10px;" id="addExpBtn">Add Expense</button>
    </div>
  `;
  document.getElementById('addExpBtn').onclick = async () => {
    try {
      const amount = Number(document.getElementById('expAmount').value);
      if (!amount || amount <= 0) throw new Error('Enter a valid amount');
      await Api.post(`/trips/${trip.id}/expenses`, {
        category: document.getElementById('expCategory').value,
        description: document.getElementById('expDesc').value,
        amount
      });
      viewTripDetail(trip.id);
    } catch (err) {
      document.getElementById('expMsg').innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
    }
  };
}

// --- Share tab ---

function renderShareTab(content, trip) {
  const publicUrl = trip.share_slug ? `${location.origin}${location.pathname}#/public/${trip.share_slug}` : null;
  content.innerHTML = `
    <div class="card">
      <h2>Sharing</h2>
      <p class="muted">Visibility: <strong>${trip.visibility}</strong></p>
      ${trip.visibility === 'public'
        ? `<div class="share-box"><input readonly value="${publicUrl}" id="shareUrl" /><button class="btn" id="copyBtn">Copy</button></div>
           <button class="btn btn-danger" style="margin-top:12px;" id="unpublishBtn">Make Private</button>`
        : `<button class="btn btn-primary" id="publishBtn">Publish Trip Publicly</button>`}
    </div>
  `;
  if (trip.visibility === 'public') {
    document.getElementById('copyBtn').onclick = () => {
      navigator.clipboard.writeText(publicUrl);
      alert('Link copied!');
    };
    document.getElementById('unpublishBtn').onclick = async () => {
      await Api.put(`/trips/${trip.id}/publish`, { visibility: 'private' });
      viewTripDetail(trip.id);
    };
  } else {
    document.getElementById('publishBtn').onclick = async () => {
      await Api.put(`/trips/${trip.id}/publish`, { visibility: 'public' });
      viewTripDetail(trip.id);
    };
  }
}

// ---------- PUBLIC TRIP VIEW ----------

async function viewPublicTrip(slug) {
  app.innerHTML = `<div class="center">Loading...</div>`;
  try {
    const { trip, owner } = await Api.get(`/public/${slug}`);
    app.innerHTML = `
      <div class="card">
        <h1>${escapeHtml(trip.name)}</h1>
        <p class="muted">By ${escapeHtml(owner)} · ${trip.start_date} → ${trip.end_date}</p>
        ${trip.description ? `<p>${escapeHtml(trip.description)}</p>` : ''}
        <p><strong>Estimated cost:</strong> ₹${trip.budget.total_cost}</p>
        ${Api.token ? `<button class="btn btn-primary" id="copyTripBtn">Copy This Trip</button>` : `<p class="muted"><a href="#/login">Log in</a> to copy this trip.</p>`}
      </div>
      ${trip.stops.map(stop => `
        <div class="card stop-block">
          <h3>${escapeHtml(stop.city.name)}, ${escapeHtml(stop.city.country)}</h3>
          <p class="muted">${stop.start_date} → ${stop.end_date}</p>
          ${stop.activities.map(a => `
            <div class="activity-row">
              <span>${a.date} · ${escapeHtml(a.name)}</span><span>₹${a.estimated_cost}</span>
            </div>`).join('') || '<p class="muted">No activities listed.</p>'}
        </div>`).join('')}
    `;
    if (Api.token) {
      document.getElementById('copyTripBtn').onclick = async () => {
        const { trip: newTrip } = await Api.post(`/public/${slug}/copy`);
        location.hash = `#/trip/${newTrip.id}`;
      };
    }
  } catch (err) {
    app.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
  }
}

// ---------- PROFILE ----------

async function viewProfile() {
  const { user } = await Api.get('/auth/me');
  app.innerHTML = `
    <div class="card" style="max-width:420px;">
      <h1>Profile & Settings</h1>
      <div id="msg"></div>
      <label>Name</label><input id="name" value="${escapeHtml(user.name)}" />
      <label>Email</label><input value="${escapeHtml(user.email)}" disabled />
      <label>Language</label>
      <select id="language">
        <option value="en" ${user.language === 'en' ? 'selected' : ''}>English</option>
        <option value="hi" ${user.language === 'hi' ? 'selected' : ''}>Hindi</option>
        <option value="es" ${user.language === 'es' ? 'selected' : ''}>Spanish</option>
      </select>
      <button class="btn btn-primary" style="margin-top:14px;" id="saveBtn">Save Changes</button>
    </div>`;
  document.getElementById('saveBtn').onclick = async () => {
    try {
      await Api.put('/auth/profile', {
        name: document.getElementById('name').value.trim(),
        language: document.getElementById('language').value
      });
      document.getElementById('msg').innerHTML = `<div class="success">Saved.</div>`;
    } catch (err) {
      document.getElementById('msg').innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
    }
  };
}

// ---------- utils ----------

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
