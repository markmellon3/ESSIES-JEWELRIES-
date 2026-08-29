// ==========================================
// FIREBASE IMPORTS & CONFIG
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Aliased imports for the Advertisement DB
import { initializeApp as initAdApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getDatabase as getAdDb, ref as refAd, get as getAd, runTransaction as runTransactionAd } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCI1yBIgDhl7cnKjCzOaWt4vK2Q-DcQrac",
  authDomain: "essie-db2aa.firebaseapp.com",
  databaseURL: "https://essie-db2aa-default-rtdb.firebaseio.com",
  projectId: "essie-db2aa",
  storageBucket: "essie-db2aa.appspot.com",
  messagingSenderId: "210132046846",
  appId: "1:210132046846:web:5fac8fedce997553cda6af",
  measurementId: "G-V5GJD82P61" 
};

const firebaseConfigAdv = {
  apiKey: "AIzaSyAq7NeNLiZYobBVvjD7RMeLP7yyq57hWKw",
  authDomain: "advertisement-86114.firebaseapp.com",
  databaseURL: "https://advertisement-86114-default-rtdb.firebaseio.com",
  projectId: "advertisement-86114",
  storageBucket: "advertisement-86114.firebasestorage.app",
  messagingSenderId: "805405982197",
  appId: "1:805405982197:web:2b19eb58607094aa29f4bc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const advApp = initAdApp(firebaseConfigAdv);
const advDb = getAdDb(advApp);

// ==========================================
// FLASH SELLS ENHANCED
// ==========================================
const flashGrid = document.getElementById("flashGrid");
onValue(ref(db, "flashSells"), snap => {
  flashGrid.innerHTML = "";
  if (!snap.exists()) {
    flashGrid.innerHTML = "<p>No flash sells available</p>";
    return;
  }
  
  snap.forEach(itemSnap => {
    const p = itemSnap.val();
    const card = document.createElement("div");
    card.className = "flash-card";
    
    const oldPriceHTML = p.oldPrice ? `<div class="flash-old">UGX ${Number(p.oldPrice).toLocaleString()}</div>` : "";
    const discount = p.oldPrice ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0;
    const soldCount = Math.floor(Math.random() * 50) + 20; // Mock sold count
    const stockProgress = Math.min(100, soldCount * 1.5); // Mock progress
    
    card.innerHTML = `
      <div class="flash-img">
        <div class="discount-tag">-${discount}%</div>
        <img src="${p.image}" onerror="this.src='https://via.placeholder.com/300'">
      </div>
      <div class="flash-body">
        <div class="flash-title">${p.name}</div>
        <div class="flash-price">UGX ${Number(p.price).toLocaleString()}</div>
        ${oldPriceHTML}
        
        <div class="stock-progress-bar">
          <div class="stock-progress-fill" style="width: ${stockProgress}%"></div>
        </div>
        <small class="stock-progress-text">🔥 ${soldCount} Sold</small>
        
        <button class="btn btn-whatsapp buy-btn">
          <i class="fab fa-whatsapp"></i> BUY NOW
        </button>
      </div>
    `;
    
    // FIX: Pass 'p' directly to buyFlash instead of parsing it from HTML attributes
    // This prevents errors when product names contain apostrophes (e.g., Lady's bags)
    card.querySelector("button").addEventListener("click", (e) => {
      e.stopPropagation();
      buyFlash(p);
    });
    
    flashGrid.appendChild(card);
  });
});

// ==========================================
// CATALOGS ENHANCED
// ==========================================
const wrapper = document.getElementById("catalogs");
onValue(ref(db, "catalogs"), snap => {
  wrapper.innerHTML = "";
  wrapper.classList.remove('catalogs-container'); // Remove skeleton container styles
  
  if (!snap.exists()) {
    wrapper.innerHTML = "<p>No catalogs available</p>";
    return;
  }
  
  snap.forEach(categorySnap => {
    const categoryName = categorySnap.key;
    
    // Create Section Title
    const title = document.createElement("h2");
    title.className = "section-title";
    title.innerText = categoryName;
    wrapper.appendChild(title);
    
    // Create Grid
    const grid = document.createElement("div");
    grid.className = "products-grid"; // Reuse standard grid class
    
    categorySnap.forEach(itemSnap => {
      const p = itemSnap.val();
      const card = document.createElement("div");
      card.className = "product-card";
      
      // Generate random rating and sold count for premium look
      const rating = (Math.random() * 1 + 4).toFixed(1); // 4.0 to 5.0
      const reviews = Math.floor(Math.random() * 500) + 10;
      const discount = p.oldPrice ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0;
      
      card.innerHTML = `
        <div class="product-img-container">
          ${discount > 0 ? `<div class="discount-tag">-${discount}%</div>` : '<div class="product-badge badge-new">NEW</div>'}
          <div class="wishlist-btn"><i class="far fa-heart"></i></div>
          <img src="${p.image}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/220'">
          <button class="quick-view-btn"><i class="far fa-eye"></i> Quick View</button>
        </div>
        <div class="product-info">
          <div class="product-rating">
            <span class="stars">★★★★★</span>
            <small>${rating} (${reviews})</small>
          </div>
          <div class="product-name">${p.name}</div>
          <div class="price-row">
            <span class="price-current">UGX ${Number(p.price).toLocaleString()}</span>
            ${p.oldPrice ? `<span class="price-old">UGX ${Number(p.oldPrice).toLocaleString()}</span>` : ''}
          </div>
          <div class="stock-info"><i class="fas fa-check-circle"></i> In Stock</div>
          <button class="btn btn-whatsapp">
            <i class="fab fa-whatsapp"></i> Buy Now
          </button>
        </div>
      `;
      
      // FIX: Pass 'p' directly to buyCatalog
      card.querySelector("button.btn-whatsapp").addEventListener("click", (e) => {
        e.stopPropagation();
        buyCatalog(p);
      });
      
      // Wishlist toggle
      card.querySelector(".wishlist-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        const icon = e.currentTarget.querySelector('i');
        icon.classList.toggle('far');
        icon.classList.toggle('fas');
        icon.style.color = icon.classList.contains('fas') ? '#f14c3a' : '#666';
      });
      
      grid.appendChild(card);
    });
    
    wrapper.appendChild(grid);
  });
});

// ==========================================
// BUY FUNCTIONS
// ==========================================
function buyCatalog(product) {
  const params = new URLSearchParams({
    name: product.name,
    price: product.price,
    oldPrice: product.oldPrice || 0,
    image: product.image,
    discount: product.discount || 0,
    stock: product.stock || "N/A"
  }).toString();
  location.href = "payment.html?" + params;
}

function buyFlash(product) {
  const params = new URLSearchParams({
    name: product.name,
    price: product.price,
    oldPrice: product.oldPrice || 0,
    image: product.image,
    discount: product.discount || 0,
    stock: product.stock || "N/A"
  }).toString();
  location.href = "payment.html?" + params;
}

// ==========================================
// UI INTERACTIONS (SLIDER, FILTERS, ETC)
// ==========================================

// Hero Slider
const slidesWrapper = document.getElementById('slidesWrapper');
const slides = document.querySelectorAll('.slide');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const dotsContainer = document.getElementById('dotsContainer');
let currentSlide = 0;

slides.forEach((_, i) => {
  const dot = document.createElement('span');
  dot.classList.add('dot');
  if (i === 0) dot.classList.add('active');
  dot.addEventListener('click', () => goToSlide(i));
  dotsContainer.appendChild(dot);
});

function goToSlide(index) {
  slidesWrapper.style.transform = `translateX(-${index * 100}%)`;
  document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === index));
  currentSlide = index;
}

function nextSlide() {
  currentSlide = (currentSlide + 1) % slides.length;
  goToSlide(currentSlide);
}
function prevSlide() {
  currentSlide = (currentSlide - 1 + slides.length) % slides.length;
  goToSlide(currentSlide);
}

nextBtn.addEventListener('click', () => { nextSlide(); resetInterval(); });
prevBtn.addEventListener('click', () => { prevSlide(); resetInterval(); });

let slideInterval = setInterval(nextSlide, 5000);
function resetInterval() {
  clearInterval(slideInterval);
  slideInterval = setInterval(nextSlide, 5000);
}

// Countdown Timer
const hoursEl = document.getElementById('hours');
const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');
let hours = 2, minutes = 18, seconds = 34;

setInterval(() => {
  seconds--;
  if (seconds < 0) { seconds = 59; minutes--; }
  if (minutes < 0) { minutes = 59; hours--; }
  if (hours < 0) { hours = 2; minutes = 18; seconds = 34; }
  
  hoursEl.textContent = hours < 10 ? '0' + hours : hours;
  minutesEl.textContent = minutes < 10 ? '0' + minutes : minutes;
  secondsEl.textContent = seconds < 10 ? '0' + seconds : seconds;
}, 1000);

// Filter Sidebar Toggle
const filterSidebar = document.getElementById('filterSidebar');
const filterToggle = document.getElementById('filterToggle');
const closeSidebar = document.getElementById('closeSidebar');
const hamburgerBtn = document.getElementById('hamburgerBtn');

filterToggle.addEventListener('click', () => filterSidebar.classList.add('active'));
closeSidebar.addEventListener('click', () => filterSidebar.classList.remove('active'));
hamburgerBtn.addEventListener('click', () => filterSidebar.classList.add('active'));

// View Toggle (Grid/List)
const gridViewBtn = document.getElementById('gridViewBtn');
const listViewBtn = document.getElementById('listViewBtn');

gridViewBtn.addEventListener('click', () => {
  gridViewBtn.classList.add('active');
  listViewBtn.classList.remove('active');
  document.querySelectorAll('.products-grid').forEach(g => g.classList.remove('list-view'));
});

listViewBtn.addEventListener('click', () => {
  listViewBtn.classList.add('active');
  gridViewBtn.classList.remove('active');
  document.querySelectorAll('.products-grid').forEach(g => g.classList.add('list-view'));
});

// Back to top button
const backToTopBtn = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
  backToTopBtn.classList.toggle('show', window.scrollY > 300);
});
backToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ==========================================
// ADVERTISEMENT POPUP
// ==========================================
(async function showAdPopup() {
  try {
    const snap = await getAd(refAd(advDb, "advertisements"));
    const data = snap.val();

    if (!data || !data.enabled || !data.images) return;

    const ads = Object.entries(data.images);
    if (!ads.length) return;

    const [adId, ad] = ads[Math.floor(Math.random() * ads.length)];

    runTransactionAd(
      refAd(advDb, `advertisements/images/${adId}/impressions`),
      v => (v || 0) + 1
    );

    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position:fixed; inset:0; background:rgba(0,0,0,0.65);
      display:flex; align-items:center; justify-content:center;
      z-index:999999; padding:16px;
    `;

    const box = document.createElement("div");
    box.style.cssText = `
      background:#000; border-radius:18px; width:100%;
      max-width:420px; max-height:90vh; position:relative;
      overflow:hidden; box-shadow:0 30px 60px rgba(0,0,0,.7);
    `;

    const img = document.createElement("img");
    img.src = ad.imageUrl;
    img.alt = "Advertisement";
    img.style.cssText = `
      width:100%; height:auto; max-height:90vh;
      object-fit:contain; display:block; cursor:pointer;
    `;

    img.addEventListener("click", async (e) => {
      e.stopPropagation();
      await runTransactionAd(
        refAd(advDb, `advertisements/images/${adId}/clicks`),
        v => (v || 0) + 1
      );
      if (ad.linkUrl) window.open(ad.linkUrl, "_blank", "noopener");
      overlay.remove();
    });

    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "&times;";
    closeBtn.style.cssText = `
      position:absolute; top:10px; right:10px;
      width:36px; height:36px; border:none; border-radius:50%;
      background:rgba(0,0,0,.65); color:#fff; font-size:22px;
      cursor:pointer; z-index:10;
    `;

    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      overlay.remove();
    });

    box.addEventListener("click", e => e.stopPropagation());

    box.appendChild(img);
    box.appendChild(closeBtn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

  } catch (err) {
    console.error("Advertisement error:", err);
  }
})();