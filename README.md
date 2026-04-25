# BAHA — Haryt Bahasy / Рейтинг Товаров
> Product review platform for Turkmenistan

---

## 📁 File Structure

```
baha/
├── index.html          ← Homepage (search, categories, top products)
├── product.html        ← Product detail page (reviews, rating, write review)
├── style.css           ← Global styles
├── app.js              ← Firebase logic (auth, products, reviews)
├── firebase-config.js  ← Firebase config (YOU MUST FILL THIS IN)
└── README.md           ← This file
```

---

## 🚀 Setup Steps

### Step 1 — Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click **"Add project"** → Name it `baha-tm`
3. Disable Google Analytics (not needed now) → Create project

### Step 2 — Register Web App
1. Click the **Web icon** (`</>`) on the project overview
2. Register app name `baha-web`
3. Copy the `firebaseConfig` object

### Step 3 — Paste Config
Open `firebase-config.js` and replace the placeholder values:
```js
const firebaseConfig = {
  apiKey:            "your-real-key-here",
  authDomain:        "baha-tm.firebaseapp.com",
  projectId:         "baha-tm",
  storageBucket:     "baha-tm.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123:web:abc"
};
```

### Step 4 — Enable Firestore
1. In Firebase console → **Build → Firestore Database**
2. Click **Create database** → Start in **production mode**
3. Choose a region close to Turkmenistan: `europe-west1` (closest)
4. Paste the security rules from `firebase-config.js` (bottom of file)

### Step 5 — Enable Google Auth
1. **Build → Authentication → Sign-in method**
2. Enable **Google** provider
3. Set your support email

### Step 6 — Enable Storage (for product images later)
1. **Build → Storage** → Get started

### Step 7 — Add Your First Products
In Firestore console, create a `products` collection and add a document:
```
name_ru:      "Toyota Camry"
name_tm:      "Toyota Camry"
brand:        "Toyota"
category:     "cars"
emoji:        "🚗"
avgRating:    0
reviewCount:  0
createdAt:    (timestamp - now)
```

---

## 💻 Running Locally

Option A — Simple (open directly in browser):
```
Just open index.html in Chrome
Note: Firebase may require a local server for modules
```

Option B — Local server (recommended):
```bash
# With Python
python -m http.server 8080
# Open http://localhost:8080

# With Node.js
npx serve .
# Open http://localhost:3000
```

---

## 🌐 Deploying (Free with Firebase Hosting)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize
firebase init hosting
# → Select your baha-tm project
# → Public directory: . (current folder)
# → Single-page app: No

# Deploy
firebase deploy
```
Your site will be live at: `https://baha-tm.web.app`

---

## 💰 Google AdSense Setup

1. Go to https://adsense.google.com
2. Add your site URL (after deployment)
3. Get approval (requires some content)
4. Replace the `<div class="ad-placeholder">` in both HTML files with your AdSense snippet:
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXX" crossorigin="anonymous"></script>
<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXXXXXX" data-ad-slot="XXXXXXXXXX" data-ad-format="auto"></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
```

---

## 🗺️ Roadmap

- [x] Phase 1 — MVP (homepage, product page, reviews, Firebase)
- [ ] Phase 2 — Auth + Add Products form + Bilingual refinement
- [ ] Phase 3 — AdSense + SEO meta tags + sitemap
- [ ] Phase 4 — PWA (offline support) + Social sharing + Brand claims

---

## 📧 Categories

| Key         | Russian      | Turkmen       |
|-------------|--------------|---------------|
| cars        | Автомобили   | Awtomobiller  |
| phones      | Телефоны     | Telefonlar    |
| food        | Продукты     | Azyk harytlary|
| appliances  | Техника      | Tehnika       |
| cosmetics   | Косметика    | Kosmetika     |
| medicine    | Аптека       | Dermanhana    |
| clothing    | Одежда       | Egin-eşik     |
| internet    | Интернет     | Internet      |
