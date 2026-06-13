// API base URL
const API = '';

// Toast notifications
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container') || (() => {
    const c = document.createElement('div');
    c.id = 'toast-container'; c.className = 'toast-container';
    document.body.appendChild(c); return c;
  })();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : '✕'}</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(20px)'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// Auth helpers
async function getUser() {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (res.ok) return await res.json();
  } catch (e) {}
  return null;
}

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  window.location.href = '/';
}

// Cart count
async function updateCartCount() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  try {
    const res = await fetch('/api/cart', { credentials: 'include' });
    if (res.ok) {
      const items = await res.json();
      const count = items.reduce((s, i) => s + i.quantity, 0);
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    } else { badge.style.display = 'none'; }
  } catch (e) { badge.style.display = 'none'; }
}

// Stars render
function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let stars = '★'.repeat(full);
  if (half) stars += '½';
  stars += '☆'.repeat(5 - full - (half ? 1 : 0));
  return stars;
}

// Format currency
function formatPrice(p) { return `$${parseFloat(p).toFixed(2)}`; }

// Format date
function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Add to cart
async function addToCart(productId, quantity = 1) {
  const user = await getUser();
  if (!user) { showToast('Please login to add items to cart', 'error'); window.location.href = '/login'; return; }
  const res = await fetch('/api/cart/add', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_id: productId, quantity })
  });
  if (res.ok) { showToast('Added to cart! 🛒'); updateCartCount(); }
  else { const d = await res.json(); showToast(d.error || 'Failed to add', 'error'); }
}

// Initialize nav auth state
async function initNav() {
  const user = await getUser();
  const authLinks = document.getElementById('auth-links');
  if (authLinks) {
    if (user) {
      authLinks.innerHTML = `
        <a href="/orders">📦 Orders</a>
        <span style="color:var(--text2);font-size:14px;padding:0 8px">Hi, ${user.name.split(' ')[0]}</span>
        <a href="#" onclick="logout()" style="color:var(--red)">Logout</a>`;
    } else {
      authLinks.innerHTML = `<a href="/login">Login</a><a href="/register" style="background:var(--accent);color:#000;padding:8px 16px;border-radius:8px;font-weight:600">Sign Up</a>`;
    }
  }
  updateCartCount();
}

window.addEventListener('DOMContentLoaded', initNav);
