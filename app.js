// ============================================================
//  BAHA — app.js
//  Core logic: Auth, Language, Products, Reviews
// ============================================================

import { db, auth, googleProvider } from './firebase-config.js';
import {
  collection, doc, addDoc, getDoc, getDocs,
  query, where, orderBy, limit,
  updateDoc, serverTimestamp, runTransaction, increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ============================================================
//  STATE
// ============================================================
let currentLang = localStorage.getItem('baha_lang') || 'ru';
let currentUser  = null;

// ============================================================
//  LANGUAGE SWITCHER
// ============================================================
function applyLang(lang) {
  currentLang = lang;
  localStorage.setItem('baha_lang', lang);

  document.querySelectorAll('[data-ru]').forEach(el => {
    el.innerHTML = el.dataset[lang] || el.dataset.ru;
  });

  document.querySelectorAll('[data-placeholder-ru]').forEach(el => {
    el.placeholder = el.dataset[`placeholder${lang.charAt(0).toUpperCase()+lang.slice(1)}`] || el.dataset.placeholderRu;
  });

  const btn = document.getElementById('langToggle');
  if (btn) btn.textContent = lang === 'ru' ? 'TM' : 'RU';
}

function t(ru, tm) {
  return currentLang === 'tm' ? tm : ru;
}

// ============================================================
//  AUTH
// ============================================================
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  renderAuthUI(user);
});

function renderAuthUI(user) {
  const loginBtn  = document.getElementById('loginBtn');
  const userArea  = document.getElementById('userArea');
  const loginNote = document.querySelector('.login-required');

  if (!loginBtn && !userArea) return;

  if (user) {
    const initials = user.displayName
      ? user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
      : '?';
    if (loginBtn) loginBtn.style.display = 'none';
    if (userArea) {
      userArea.innerHTML = `
        <div class="user-info">
          <div class="user-avatar">${initials}</div>
          <span style="font-size:14px;font-weight:500">${user.displayName?.split(' ')[0] || ''}</span>
        </div>
        <button class="btn-logout" id="logoutBtn">${t('Выйти', 'Çykmak')}</button>
      `;
      userArea.style.display = 'flex';
      userArea.style.gap = '10px';
      userArea.style.alignItems = 'center';
      document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
    }
    if (loginNote) loginNote.classList.remove('visible');
  } else {
    if (loginBtn) loginBtn.style.display = '';
    if (userArea) userArea.innerHTML = '';
    if (loginNote) loginNote.classList.add('visible');
  }
}

async function handleLogin() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user   = result.user;
    // Save/update user doc
    await updateDoc(doc(db, 'users', user.uid), {
      displayName: user.displayName,
      email: user.email,
    }).catch(() =>
      addDoc(collection(db, 'users'), {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        reviewCount: 0,
        joinedAt: serverTimestamp()
      })
    );
    showToast(t('Вы вошли!', 'Ulgama girdińiz!'), 'success');
  } catch (e) {
    if (e.code !== 'auth/popup-closed-by-user') {
      showToast(t('Ошибка входа', 'Giriş ýalňyşlygy'), 'error');
    }
  }
}

async function handleLogout() {
  await signOut(auth);
  showToast(t('Вы вышли', 'Ulgamdan çykdyńyz'), 'success');
}

// ============================================================
//  STARS RENDERER
// ============================================================
function renderStars(rating, size = 'normal') {
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  const sz    = size === 'large' ? '22px' : '16px';
  let html    = '<span class="stars">';
  for (let i = 0; i < full;  i++) html += `<span class="star filled" style="font-size:${sz}">★</span>`;
  if (half)                        html += `<span class="star half"   style="font-size:${sz}">★</span>`;
  for (let i = 0; i < empty; i++) html += `<span class="star empty"  style="font-size:${sz}">★</span>`;
  html += '</span>';
  return html;
}

// ============================================================
//  PRODUCTS — HOMEPAGE
// ============================================================
async function loadTopProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  try {
    const q = query(
      collection(db, 'products'),
      orderBy('avgRating', 'desc'),
      limit(8)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      // Show demo products if DB is empty
      grid.innerHTML = getDemoProducts().map(renderProductCard).join('');
      return;
    }

    grid.innerHTML = '';
    snap.forEach(docSnap => {
      const p = { id: docSnap.id, ...docSnap.data() };
      grid.innerHTML += renderProductCard(p);
    });
  } catch (e) {
    console.warn('Firebase not configured yet — showing demo products.');
    grid.innerHTML = getDemoProducts().map(renderProductCard).join('');
  }
}

function renderProductCard(p) {
  const name = currentLang === 'tm' ? (p.name_tm || p.name_ru) : p.name_ru;
  return `
    <div class="product-card" onclick="location.href='product.html?id=${p.id}'">
      <div class="product-card-img">${p.emoji || '📦'}</div>
      <div class="product-card-body">
        <div class="product-card-category">${getCategoryLabel(p.category)}</div>
        <div class="product-card-name">${name}</div>
        <div class="product-card-brand">${p.brand || ''}</div>
        <div class="rating-row">
          ${renderStars(p.avgRating || 0)}
          <span class="rating-number">${(p.avgRating || 0).toFixed(1)}</span>
          <span class="rating-count">(${p.reviewCount || 0} ${t('отзывов', 'syn')})</span>
        </div>
      </div>
    </div>
  `;
}

function getCategoryLabel(cat) {
  const labels = {
    cars:       { ru: 'Автомобили',  tm: 'Awtomobiller' },
    phones:     { ru: 'Телефоны',    tm: 'Telefonlar' },
    food:       { ru: 'Продукты',    tm: 'Azyk' },
    appliances: { ru: 'Техника',     tm: 'Tehnika' },
    cosmetics:  { ru: 'Косметика',   tm: 'Kosmetika' },
    medicine:   { ru: 'Аптека',      tm: 'Dermanhana' },
    clothing:   { ru: 'Одежда',      tm: 'Egin-eşik' },
    internet:   { ru: 'Интернет',    tm: 'Internet' },
  };
  return labels[cat]?.[currentLang] || cat;
}

// ============================================================
//  SEARCH
// ============================================================
async function searchProducts(queryText) {
  if (!queryText.trim()) { loadTopProducts(); return; }
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  grid.innerHTML = '<div class="product-card skeleton"></div>'.repeat(4);

  try {
    // Simple prefix search — for production use Algolia or full-text search
    const snap = await getDocs(collection(db, 'products'));
    const q    = queryText.toLowerCase();
    const results = [];
    snap.forEach(d => {
      const p = { id: d.id, ...d.data() };
      const searchable = `${p.name_ru} ${p.name_tm} ${p.brand} ${p.category}`.toLowerCase();
      if (searchable.includes(q)) results.push(p);
    });

    if (results.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted);font-size:15px">
        ${t('Ничего не найдено', 'Hiç zat tapylmady')} 😕
      </div>`;
      return;
    }
    grid.innerHTML = results.map(renderProductCard).join('');
  } catch (e) {
    console.warn('Search failed:', e);
  }
}

// ============================================================
//  PRODUCT PAGE — load single product
// ============================================================
async function loadProduct() {
  const params    = new URLSearchParams(location.search);
  const productId = params.get('id');
  if (!productId) return;

  try {
    // Try Firebase first
    const docSnap = await getDoc(doc(db, 'products', productId));
    if (docSnap.exists()) {
      renderProduct({ id: docSnap.id, ...docSnap.data() });
    } else {
      // Fallback to demo data
      const demo = getDemoProducts().find(p => p.id === productId);
      if (demo) renderProduct(demo);
    }
  } catch (e) {
    // Firebase not configured — use demo
    const demo = getDemoProducts().find(p => p.id === productId);
    if (demo) renderProduct(demo);
  }
}

function renderProduct(p) {
  const name = currentLang === 'tm' ? (p.name_tm || p.name_ru) : p.name_ru;

  // Breadcrumb
  const bc = document.getElementById('breadcrumb');
  if (bc) bc.innerHTML = `
    <a href="index.html">${t('Главная', 'Baş sahypa')}</a>
    <span class="breadcrumb-sep">›</span>
    <span>${getCategoryLabel(p.category)}</span>
    <span class="breadcrumb-sep">›</span>
    <span>${name}</span>
  `;

  // Product details
  const container = document.getElementById('productDetail');
  if (!container) return;

  const ratingBars = [5,4,3,2,1].map(star => {
    const pct = p.ratingBreakdown?.[star]
      ? Math.round((p.ratingBreakdown[star] / (p.reviewCount || 1)) * 100)
      : 0;
    return `
      <div class="rating-bar-row">
        <span>${star}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
        <span>${pct}%</span>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="product-hero">
      <div class="product-image-box">${p.emoji || '📦'}</div>
      <div class="product-meta">
        <span class="product-category-tag">${getCategoryLabel(p.category)}</span>
        <h1 class="product-title">${name}</h1>
        <p class="product-brand">${p.brand || ''}</p>
        <div class="rating-big">
          <span class="score">${(p.avgRating || 0).toFixed(1)}</span>
          <div>
            ${renderStars(p.avgRating || 0, 'large')}
            <div class="count">${p.reviewCount || 0} ${t('отзывов', 'syn')}</div>
          </div>
        </div>
        <div class="rating-bars">${ratingBars}</div>
        <button class="btn-write-review" id="writeReviewBtn">
          ✏️ ${t('Написать отзыв', 'Syn ýaz')}
        </button>
        <div class="login-required ${currentUser ? '' : 'visible'}">
          ${t('Чтобы оставить отзыв, нужно войти через Google', 'Syn ýazmak üçin Google arkaly giriň')}
        </div>
      </div>
    </div>
  `;

  document.title = `${name} — BAHA`;

  // Store product id for review form
  document.getElementById('writeReviewBtn')?.addEventListener('click', () => {
    if (!currentUser) {
      showToast(t('Сначала войдите в систему', 'Ilki ulgama giriň'), 'error');
      return;
    }
    openModal(p.id, name);
  });

  loadReviews(p.id);
}

// ============================================================
//  REVIEWS — load for product page
// ============================================================
async function loadReviews(productId) {
  const container = document.getElementById('reviewsList');
  if (!container) return;

  try {
    const q = query(
      collection(db, 'reviews'),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc'),
      limit(30)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      container.innerHTML = `
        <div class="empty-reviews">
          <div class="empty-icon">💬</div>
          <p>${t('Отзывов пока нет. Будьте первым!', 'Entek syn ýok. Ilkinji boluň!')}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    snap.forEach(d => {
      const r = d.data();
      container.innerHTML += renderReview(r);
    });
  } catch (e) {
    container.innerHTML = `
      <div class="empty-reviews">
        <div class="empty-icon">💬</div>
        <p>${t('Отзывов пока нет. Будьте первым!', 'Entek syn ýok. Ilkinji boluň!')}</p>
      </div>
    `;
  }
}

function renderReview(r) {
  const initials = r.userName
    ? r.userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';
  const date = r.createdAt?.toDate?.()
    ? r.createdAt.toDate().toLocaleDateString(currentLang === 'ru' ? 'ru-RU' : 'tk-TM', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';
  return `
    <div class="review-card">
      <div class="review-header">
        <div class="reviewer-info">
          <div class="reviewer-avatar">${initials}</div>
          <div>
            <div class="reviewer-name">${r.userName || t('Аноним', 'Näbelli')}</div>
            <div class="review-date">${date}</div>
          </div>
        </div>
        ${renderStars(r.stars)}
      </div>
      ${r.text ? `<p class="review-text">${r.text}</p>` : ''}
    </div>
  `;
}

// ============================================================
//  SUBMIT REVIEW
// ============================================================
async function submitReview(productId, productName, stars, text) {
  if (!currentUser) { showToast(t('Войдите в систему', 'Ulgama giriň'), 'error'); return; }
  if (!stars || stars < 1) { showToast(t('Выберите оценку', 'Baha saýlaň'), 'error'); return; }

  const btn = document.getElementById('submitReviewBtn');
  if (btn) { btn.disabled = true; btn.textContent = '...'; }

  try {
    const reviewData = {
      productId,
      userId:    currentUser.uid,
      userName:  currentUser.displayName || t('Пользователь', 'Ulanyjy'),
      stars:     Number(stars),
      text:      text.trim(),
      lang:      currentLang,
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, 'reviews'), reviewData);

    // Update product avg rating via transaction
    await runTransaction(db, async (tx) => {
      const pRef    = doc(db, 'products', productId);
      const pSnap   = await tx.get(pRef);
      if (!pSnap.exists()) return;
      const d       = pSnap.data();
      const newCount = (d.reviewCount || 0) + 1;
      const newAvg   = ((d.avgRating || 0) * (d.reviewCount || 0) + Number(stars)) / newCount;
      tx.update(pRef, {
        avgRating:   Math.round(newAvg * 10) / 10,
        reviewCount: newCount
      });
    });

    closeModal();
    showToast(t('Отзыв опубликован!', 'Syn çap edildi!'), 'success');

    // Reload reviews
    const params = new URLSearchParams(location.search);
    loadReviews(params.get('id'));

  } catch (e) {
    console.error(e);
    showToast(t('Ошибка. Попробуйте ещё раз.', 'Ýalňyşlyk. Gaýtadan synanyşyň.'), 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = t('Опубликовать', 'Çap et'); }
  }
}

// ============================================================
//  REVIEW MODAL
// ============================================================
function openModal(productId, productName) {
  const overlay = document.getElementById('reviewModal');
  if (!overlay) return;
  overlay.dataset.productId = productId;
  document.getElementById('modalProductName').textContent = productName;
  overlay.classList.add('open');
}

function closeModal() {
  const overlay = document.getElementById('reviewModal');
  if (overlay) overlay.classList.remove('open');
}

// ============================================================
//  TOAST NOTIFICATION
// ============================================================
function showToast(msg, type = 'success') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = `toast ${type}`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================================
//  DEMO PRODUCTS (shown before Firebase is configured)
// ============================================================
function getDemoProducts() {
  return [
    { id: 'demo-1', name_ru: 'Toyota Camry',          name_tm: 'Toyota Camry',                brand: 'Toyota',    category: 'cars',       emoji: '🚗', avgRating: 4.7, reviewCount: 124 },
    { id: 'demo-2', name_ru: 'Samsung Galaxy S24',    name_tm: 'Samsung Galaxy S24',          brand: 'Samsung',   category: 'phones',     emoji: '📱', avgRating: 4.5, reviewCount: 89 },
    { id: 'demo-3', name_ru: 'Оливковое масло Borges',name_tm: 'Borges zeýtun ýagy',          brand: 'Borges',    category: 'food',       emoji: '🫒', avgRating: 4.8, reviewCount: 56 },
    { id: 'demo-4', name_ru: 'Мука Беларусь',         name_tm: 'Belarus uny',                 brand: 'Беларусь',  category: 'food',       emoji: '🌾', avgRating: 4.3, reviewCount: 43 },
    { id: 'demo-5', name_ru: 'LG Холодильник',        name_tm: 'LG sowadyjy',                 brand: 'LG',        category: 'appliances', emoji: '🏠', avgRating: 4.4, reviewCount: 67 },
    { id: 'demo-6', name_ru: 'iPhone 15',             name_tm: 'iPhone 15',                   brand: 'Apple',     category: 'phones',     emoji: '📱', avgRating: 4.9, reviewCount: 201 },
    { id: 'demo-7', name_ru: 'TMCELL (интернет)',     name_tm: 'TMCELL (internet)',            brand: 'TMCELL',    category: 'internet',   emoji: '📡', avgRating: 3.2, reviewCount: 318 },
    { id: 'demo-8', name_ru: 'Нурмахан Аптека',      name_tm: 'Nurmahan dermanhana',         brand: 'Нурмахан',  category: 'medicine',   emoji: '💊', avgRating: 4.1, reviewCount: 29 },
  ];
}

// ============================================================
//  CATEGORY PAGE FILTER
// ============================================================
async function filterByCategory(category) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  grid.innerHTML = '<div class="product-card skeleton"></div>'.repeat(4);
  try {
    const q = query(
      collection(db, 'products'),
      where('category', '==', category),
      orderBy('avgRating', 'desc')
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      grid.innerHTML = getDemoProducts()
        .filter(p => p.category === category)
        .map(renderProductCard).join('');
      return;
    }
    grid.innerHTML = '';
    snap.forEach(d => { grid.innerHTML += renderProductCard({ id: d.id, ...d.data() }); });
  } catch (e) {
    grid.innerHTML = getDemoProducts()
      .filter(p => p.category === category)
      .map(renderProductCard).join('');
  }
}

// ============================================================
//  INIT — runs on every page
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // Language
  applyLang(currentLang);
  document.getElementById('langToggle')?.addEventListener('click', () => {
    applyLang(currentLang === 'ru' ? 'tm' : 'ru');
    loadTopProducts(); // re-render with new language
  });

  // Auth
  document.getElementById('loginBtn')?.addEventListener('click', handleLogin);

  // Homepage
  if (document.getElementById('productsGrid')) {
    loadTopProducts();

    // Search
    const searchBtn   = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    searchBtn?.addEventListener('click', () => searchProducts(searchInput.value));
    searchInput?.addEventListener('keypress', e => {
      if (e.key === 'Enter') searchProducts(searchInput.value);
    });

    // Category cards
    document.querySelectorAll('.category-card').forEach(card => {
      card.addEventListener('click', e => {
        e.preventDefault();
        filterByCategory(card.dataset.category);
        document.getElementById('productsGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  // Product page
  if (document.getElementById('productDetail')) {
    loadProduct();

    // Modal
    document.getElementById('closeModal')?.addEventListener('click', closeModal);
    document.getElementById('reviewModal')?.addEventListener('click', e => {
      if (e.target === e.currentTarget) closeModal();
    });

    document.getElementById('reviewForm')?.addEventListener('submit', async e => {
      e.preventDefault();
      const overlay   = document.getElementById('reviewModal');
      const productId = overlay.dataset.productId;
      const productName = document.getElementById('modalProductName').textContent;
      const stars     = document.querySelector('.star-input input:checked')?.value;
      const text      = document.getElementById('reviewText').value;
      await submitReview(productId, productName, stars, text);
    });
  }
});

// Export for inline use
window.bahaApp = { showToast, renderStars, getCategoryLabel, t };
