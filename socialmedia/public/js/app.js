/* ═══════════════════════════════════════
   Friendzy Social — Frontend App Logic
   ═══════════════════════════════════════ */

let currentUser = null;
let currentFeedType = 'all';
let activeCommentPostId = null;

// ─── Init ───────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await checkSession();
});

async function checkSession() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (data.loggedIn) {
      currentUser = data.user;
      showApp();
    } else {
      showAuth();
    }
  } catch (e) {
    showAuth();
  }
}

function showAuth() {
  document.getElementById('authModal').classList.add('active');
  document.getElementById('app').classList.add('hidden');
}

function showApp() {
  document.getElementById('authModal').classList.remove('active');
  document.getElementById('authModal').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  updateSidebarUser();
  showPage('feed');
  loadSuggestedUsers();
}

function updateSidebarUser() {
  if (!currentUser) return;
  const initial = currentUser.username[0].toUpperCase();
  document.getElementById('sidebarAvatar').textContent = initial;
  document.getElementById('sidebarUsername').textContent = '@' + currentUser.username;
  document.getElementById('createPostAvatar').textContent = initial;
  document.getElementById('commentAvatar').textContent = initial;
}

// ─── Auth ────────────────────────────────
function switchTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const tabs = document.querySelectorAll('.auth-tab');
  tabs.forEach(t => t.classList.remove('active'));
  document.getElementById('loginError').classList.add('hidden');
  document.getElementById('registerError').classList.add('hidden');
  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    tabs[0].classList.add('active');
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    tabs[1].classList.add('active');
  }
}

async function login() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  errEl.classList.add('hidden');
  if (!username || !password) {
    showError(errEl, 'Please fill in all fields.'); return;
  }
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) { showError(errEl, data.error); return; }
    currentUser = data.user;
    showApp();
  } catch (e) {
    showError(errEl, 'Something went wrong. Try again.');
  }
}

async function register() {
  const username = document.getElementById('regUsername').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const errEl = document.getElementById('registerError');
  errEl.classList.add('hidden');
  if (!username || !email || !password) {
    showError(errEl, 'Please fill in all fields.'); return;
  }
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    if (!res.ok) { showError(errEl, data.error); return; }
    currentUser = data.user;
    showApp();
  } catch (e) {
    showError(errEl, 'Something went wrong. Try again.');
  }
}

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  currentUser = null;
  document.getElementById('authModal').classList.remove('hidden');
  document.getElementById('authModal').classList.add('active');
  document.getElementById('app').classList.add('hidden');
  document.getElementById('loginUsername').value = '';
  document.getElementById('loginPassword').value = '';
  switchTab('login');
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

// ─── Navigation ──────────────────────────
function showPage(page) {
  ['feedPage', 'explorePage', 'profilePage'].forEach(p => {
    document.getElementById(p).classList.add('hidden');
  });
  document.getElementById(page + 'Page').classList.remove('hidden');

  // Update nav active states
  ['navFeed', 'navExplore', 'navProfile'].forEach(n => {
    document.getElementById(n).classList.remove('active');
  });
  ['mNavFeed', 'mNavExplore', 'mNavProfile'].forEach(n => {
    const el = document.getElementById(n);
    if (el) el.classList.remove('active');
  });

  if (page === 'feed') {
    document.getElementById('navFeed').classList.add('active');
    const mNav = document.getElementById('mNavFeed');
    if (mNav) mNav.classList.add('active');
    loadFeed();
  } else if (page === 'explore') {
    document.getElementById('navExplore').classList.add('active');
    const mNav = document.getElementById('mNavExplore');
    if (mNav) mNav.classList.add('active');
    loadAllUsers();
  }
}

function goToMyProfile() {
  if (currentUser) loadProfile(currentUser.username);
}

// ─── Feed ─────────────────────────────────
function switchFeed(type, btn) {
  currentFeedType = type;
  document.querySelectorAll('.feed-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  loadFeed();
}

async function loadFeed() {
  const container = document.getElementById('postsContainer');
  container.innerHTML = '<div class="loader">Loading posts…</div>';
  try {
    const res = await fetch(`/api/posts/feed?type=${currentFeedType}`);
    const posts = await res.json();
    renderPosts(posts, container);
  } catch (e) {
    container.innerHTML = '<div class="empty-state"><p>Failed to load posts.</p></div>';
  }
}

function renderPosts(posts, container) {
  if (!posts.length) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        <p>No posts yet. Be the first to post!</p>
      </div>`;
    return;
  }
  container.innerHTML = posts.map(p => renderPostCard(p)).join('');
}

function renderPostCard(p) {
  const initial = p.username[0].toUpperCase();
  const isOwn = currentUser && p.user_id === currentUser.id;
  const timeAgo = formatTime(p.created_at);
  return `
    <div class="post-card" id="post-${p.id}">
      <div class="post-header">
        <div class="post-avatar" style="cursor:pointer" onclick="loadProfile('${p.username}')">${initial}</div>
        <div class="post-user-info">
          <a class="post-username" onclick="loadProfile('${p.username}')">${p.username}</a>
          <div class="post-time">${timeAgo}</div>
        </div>
        ${isOwn ? `<button class="action-btn post-delete" onclick="deletePost('${p.id}')" title="Delete post">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>` : ''}
      </div>
      <div class="post-content">${escapeHtml(p.content)}</div>
      <div class="post-actions">
        <button class="action-btn ${p.user_liked ? 'liked' : ''}" onclick="toggleLike('${p.id}', this)" id="like-${p.id}">
          <svg viewBox="0 0 24 24" fill="${p.user_liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          <span id="likeCount-${p.id}">${p.like_count}</span>
        </button>
        <button class="action-btn" onclick="openComments('${p.id}', \`${escapeHtml(p.content)}\`)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          <span>${p.comment_count}</span>
        </button>
      </div>
    </div>`;
}

async function createPost() {
  const content = document.getElementById('postContent').value.trim();
  if (!content) return;
  try {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    const post = await res.json();
    if (!res.ok) { alert(post.error); return; }
    document.getElementById('postContent').value = '';
    document.getElementById('charCount').textContent = '0';
    // Prepend to feed
    const container = document.getElementById('postsContainer');
    const emptyState = container.querySelector('.empty-state');
    if (emptyState) container.innerHTML = '';
    container.insertAdjacentHTML('afterbegin', renderPostCard(post));
  } catch (e) {
    alert('Failed to create post.');
  }
}

async function deletePost(postId) {
  if (!confirm('Delete this post?')) return;
  try {
    const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
    if (res.ok) {
      const el = document.getElementById(`post-${postId}`);
      if (el) el.remove();
    }
  } catch (e) {
    alert('Failed to delete post.');
  }
}

async function toggleLike(postId, btn) {
  try {
    const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
    const data = await res.json();
    btn.classList.toggle('liked', data.liked);
    const svg = btn.querySelector('svg');
    svg.setAttribute('fill', data.liked ? 'currentColor' : 'none');
    document.getElementById(`likeCount-${postId}`).textContent = data.count;
  } catch (e) {}
}

function updateCharCount() {
  const len = document.getElementById('postContent').value.length;
  document.getElementById('charCount').textContent = len;
}

// ─── Comments ─────────────────────────────
function openComments(postId, content) {
  activeCommentPostId = postId;
  document.getElementById('commentsPostPreview').textContent = content;
  document.getElementById('commentsList').innerHTML = '<div class="loader">Loading…</div>';
  document.getElementById('commentsModal').classList.remove('hidden');
  loadComments(postId);
}

function closeComments() {
  document.getElementById('commentsModal').classList.add('hidden');
  activeCommentPostId = null;
}

async function loadComments(postId) {
  const list = document.getElementById('commentsList');
  try {
    const res = await fetch(`/api/posts/${postId}/comments`);
    const comments = await res.json();
    if (!comments.length) {
      list.innerHTML = '<div class="empty-state"><p>No comments yet.</p></div>';
      return;
    }
    list.innerHTML = comments.map(c => {
      const isOwn = currentUser && c.user_id === currentUser.id;
      return `
        <div class="comment-item" id="comment-${c.id}">
          <div class="post-avatar avatar-sm" onclick="loadProfile('${c.username}')" style="cursor:pointer">${c.username[0].toUpperCase()}</div>
          <div class="comment-body">
            <div class="comment-meta">
              <span class="comment-username" onclick="loadProfile('${c.username}')">${c.username}</span>
              <span class="comment-time">${formatTime(c.created_at)}</span>
              ${isOwn ? `<button class="comment-delete" onclick="deleteComment('${postId}','${c.id}')">✕</button>` : ''}
            </div>
            <div class="comment-text">${escapeHtml(c.content)}</div>
          </div>
        </div>`;
    }).join('');
  } catch (e) {
    list.innerHTML = '<div class="empty-state"><p>Failed to load comments.</p></div>';
  }
}

async function submitComment() {
  const input = document.getElementById('commentInput');
  const content = input.value.trim();
  if (!content || !activeCommentPostId) return;
  try {
    const res = await fetch(`/api/posts/${activeCommentPostId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    const comment = await res.json();
    if (!res.ok) { alert(comment.error); return; }
    input.value = '';
    loadComments(activeCommentPostId);
    // Update comment count in feed
    const btn = document.querySelector(`#post-${activeCommentPostId} .action-btn:nth-child(2) span`);
    if (btn) btn.textContent = parseInt(btn.textContent || 0) + 1;
  } catch (e) {
    alert('Failed to post comment.');
  }
}

async function deleteComment(postId, commentId) {
  try {
    const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, { method: 'DELETE' });
    if (res.ok) loadComments(postId);
  } catch (e) {}
}

// ─── Profile ─────────────────────────────
async function loadProfile(username) {
  showPage('profile');
  document.getElementById('navProfile').classList.add('active');
  const mNav = document.getElementById('mNavProfile');
  if (mNav) mNav.classList.add('active');

  const content = document.getElementById('profileContent');
  content.innerHTML = '<div class="loader">Loading profile…</div>';

  try {
    const res = await fetch(`/api/users/${username}`);
    if (!res.ok) { content.innerHTML = '<div class="empty-state"><p>User not found.</p></div>'; return; }
    const data = await res.json();
    renderProfile(data, content);
  } catch (e) {
    content.innerHTML = '<div class="empty-state"><p>Failed to load profile.</p></div>';
  }
}

function renderProfile(data, container) {
  const { user, posts, followerCount, followingCount, isFollowing, isOwnProfile } = data;
  const initial = user.username[0].toUpperCase();
  container.innerHTML = `
    <div class="profile-info-card">
      <div class="profile-cover"></div>
      <div class="profile-avatar-wrap">
        <div class="avatar-lg avatar-xl">${initial}</div>
      </div>
      <div class="profile-meta">
        <div class="profile-names">
          <h2>${user.username}</h2>
          <p>@${user.username}</p>
        </div>
        <div>
          ${isOwnProfile
            ? `<button class="btn-outline" onclick="openEditProfile('${escapeHtml(user.bio || '')}')">Edit Profile</button>`
            : `<button class="btn-outline ${isFollowing ? 'following-btn' : ''}" id="followBtn" onclick="toggleFollow('${user.id}', '${user.username}')">${isFollowing ? 'Following' : 'Follow'}</button>`
          }
        </div>
      </div>
      ${user.bio ? `<p class="profile-bio">${escapeHtml(user.bio)}</p>` : ''}
      <div class="profile-stats">
        <div class="stat-item">
          <span class="stat-num">${posts.length}</span>
          <span class="stat-label">Posts</span>
        </div>
        <div class="stat-item" onclick="showFollowList('${user.id}', 'followers')">
          <span class="stat-num" id="followerCount">${followerCount}</span>
          <span class="stat-label">Followers</span>
        </div>
        <div class="stat-item" onclick="showFollowList('${user.id}', 'following')">
          <span class="stat-num">${followingCount}</span>
          <span class="stat-label">Following</span>
        </div>
      </div>
    </div>
    <div id="profilePosts">${posts.length ? posts.map(p => renderPostCard(p)).join('') : '<div class="empty-state"><p>No posts yet.</p></div>'}</div>
  `;
}

async function toggleFollow(userId, username) {
  const btn = document.getElementById('followBtn');
  try {
    const res = await fetch(`/api/users/${userId}/follow`, { method: 'POST' });
    const data = await res.json();
    btn.textContent = data.following ? 'Following' : 'Follow';
    btn.classList.toggle('following-btn', data.following);
    // Update follower count
    const countEl = document.getElementById('followerCount');
    if (countEl) {
      countEl.textContent = parseInt(countEl.textContent) + (data.following ? 1 : -1);
    }
    loadSuggestedUsers();
  } catch (e) {}
}

async function showFollowList(userId, type) {
  try {
    const res = await fetch(`/api/users/${userId}/${type}`);
    const users = await res.json();
    // Simple alert-style display via a modal reuse
    const listHtml = users.length
      ? users.map(u => `<div class="search-result-item" onclick="closeFollowModal();loadProfile('${u.username}')">
          <div class="post-avatar avatar-sm">${u.username[0].toUpperCase()}</div>
          <div><div class="search-result-name">${u.username}</div><div class="search-result-bio">${u.bio || ''}</div></div>
        </div>`).join('')
      : '<div class="empty-state" style="padding:24px"><p>No ${type} yet.</p></div>';
    showFollowModal(type === 'followers' ? 'Followers' : 'Following', listHtml);
  } catch (e) {}
}

function showFollowModal(title, html) {
  const existing = document.getElementById('followModal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'followModal';
  modal.innerHTML = `
    <div class="modal modal-large">
      <div class="modal-header">
        <h2>${title}</h2>
        <button class="close-btn" onclick="closeFollowModal()">✕</button>
      </div>
      <div style="max-height:360px;overflow-y:auto;border:1px solid var(--gray-200);border-radius:8px">${html}</div>
    </div>`;
  document.body.appendChild(modal);
}
function closeFollowModal() {
  const el = document.getElementById('followModal');
  if (el) el.remove();
}

// ─── Edit Profile ────────────────────────
function openEditProfile(bio) {
  document.getElementById('editBio').value = bio;
  document.getElementById('editProfileModal').classList.remove('hidden');
}
function closeEditProfile() {
  document.getElementById('editProfileModal').classList.add('hidden');
}
async function updateProfile() {
  const bio = document.getElementById('editBio').value.trim();
  try {
    const res = await fetch('/api/users/profile/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio })
    });
    if (res.ok) {
      closeEditProfile();
      loadProfile(currentUser.username);
    }
  } catch (e) {}
}

// ─── Explore ─────────────────────────────
async function loadAllUsers() {
  const container = document.getElementById('allUsers');
  container.innerHTML = '<div class="loader">Loading…</div>';
  try {
    const res = await fetch('/api/users/search/users?q=');
    const users = await res.json();
    // Fallback: fetch all via a broader search
    const res2 = await fetch('/api/users/search/users?q=%');
    const all = await res2.json();
    renderUserCards(all.length ? all : users, container);
  } catch (e) {
    container.innerHTML = '<div class="empty-state"><p>Failed to load users.</p></div>';
  }
}

function renderUserCards(users, container) {
  if (!users.length) {
    container.innerHTML = '<div class="empty-state"><p>No users found.</p></div>';
    return;
  }
  container.innerHTML = users.map(u => `
    <div class="user-card">
      <div class="post-avatar" onclick="loadProfile('${u.username}')" style="cursor:pointer">${u.username[0].toUpperCase()}</div>
      <div class="user-card-info">
        <div class="user-card-name" onclick="loadProfile('${u.username}')">${u.username}</div>
        <div class="user-card-bio">${u.bio || 'No bio yet'}</div>
      </div>
      ${currentUser && u.id !== currentUser.id ? `<button class="btn-outline" onclick="quickFollow('${u.id}', this)">Follow</button>` : ''}
    </div>`).join('');
}

async function quickFollow(userId, btn) {
  try {
    const res = await fetch(`/api/users/${userId}/follow`, { method: 'POST' });
    const data = await res.json();
    btn.textContent = data.following ? 'Following' : 'Follow';
    btn.classList.toggle('following-btn', data.following);
  } catch (e) {}
}

let searchTimeout;
function searchUsers(q) {
  clearTimeout(searchTimeout);
  const results = document.getElementById('searchResults');
  const explore = document.getElementById('exploreContent');
  if (!q.trim()) {
    results.classList.add('hidden');
    explore.classList.remove('hidden');
    return;
  }
  searchTimeout = setTimeout(async () => {
    try {
      const res = await fetch(`/api/users/search/users?q=${encodeURIComponent(q)}`);
      const users = await res.json();
      explore.classList.add('hidden');
      results.classList.remove('hidden');
      if (!users.length) {
        results.innerHTML = '<div class="empty-state" style="padding:24px"><p>No users found.</p></div>';
        return;
      }
      results.innerHTML = users.map(u => `
        <div class="search-result-item" onclick="loadProfile('${u.username}')">
          <div class="post-avatar avatar-sm">${u.username[0].toUpperCase()}</div>
          <div>
            <div class="search-result-name">${u.username}</div>
            <div class="search-result-bio">${u.bio || ''}</div>
          </div>
        </div>`).join('');
    } catch (e) {}
  }, 300);
}

// ─── Suggested Users ─────────────────────
async function loadSuggestedUsers() {
  const container = document.getElementById('suggestedUsers');
  try {
    const res = await fetch('/api/users/search/users?q=%');
    const users = await res.json();
    const filtered = users.filter(u => u.id !== currentUser?.id).slice(0, 5);
    if (!filtered.length) {
      container.innerHTML = '<p style="font-size:.85rem;color:var(--gray-400)">No suggestions yet.</p>';
      return;
    }
    container.innerHTML = filtered.map(u => `
      <div class="suggested-user">
        <div class="post-avatar avatar-sm" onclick="loadProfile('${u.username}')" style="cursor:pointer">${u.username[0].toUpperCase()}</div>
        <div class="suggested-info">
          <div class="suggested-name" onclick="loadProfile('${u.username}')">${u.username}</div>
          <div class="suggested-bio">${u.bio || 'No bio yet'}</div>
        </div>
        ${currentUser && u.id !== currentUser.id ? `<button class="btn-outline" style="font-size:.78rem;padding:4px 10px" onclick="quickFollow('${u.id}', this)">Follow</button>` : ''}
      </div>`).join('');
  } catch (e) {}
}

// ─── Helpers ─────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
  return d.toLocaleDateString();
}

// Allow Enter key on login/register forms
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    if (!loginForm.classList.contains('hidden')) login();
    else if (!registerForm.classList.contains('hidden')) register();
  }
});
