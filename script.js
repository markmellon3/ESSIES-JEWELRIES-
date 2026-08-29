// ==========================================
// FIREBASE IMPORTS & CONFIG
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, onValue, runTransaction } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Separate imports for Advertisement DB
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

// Initialize Main Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const productsRef = ref(db, 'products');

// ==========================================
// RENDER PRODUCTS & SEARCH
// ==========================================
function renderProducts(products, filter = '', targetGridId = 'productsGrid') {
  const grid = document.getElementById(targetGridId) || document.getElementById('productsGrid');
  if (!grid) return;
  
  // Clear "Loading..." or previous items if it's the main grid
  if (targetGridId === 'productsGrid') grid.innerHTML = '';

  let itemsAdded = 0;
  const maxItems = targetGridId === 'productsGrid' ? 100 : 8; // Limit section items

  Object.entries(products).forEach(([id, product]) => {
    if (itemsAdded >= maxItems) return;

    if (filter && 
        !product.name.toLowerCase().includes(filter.toLowerCase()) && 
        !product.category.toLowerCase().includes(filter.toLowerCase())) {
      return;
    }

    const discount = product.discount ? `<div class="discount-tag">-${product.discount}%</div>` : '';
    const oldPrice = product.oldPrice ? `<span class="price-old">₦ ${product.oldPrice.toLocaleString()}</span>` : '';
    const stock = product.stock !== undefined ? `<div class="stock-info">In Stock</div>` : '';

    const card = `
      <div class="product-card" onclick="window.location.href='product.html?id=${id}'">
        <div class="product-img-container">
          ${discount}
          <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="product-info">
          <div class="product-name">${product.name}</div>
          <div>
            <span class="price-current">₦ ${product.price.toLocaleString()}</span>
            ${oldPrice}
          </div>
          ${stock}
        </div>
      </div>
    `;
    grid.innerHTML += card;
    itemsAdded++;
  });
}

// Real-time listener - Main Products Grid
onValue(productsRef, (snapshot) => {
  const products = snapshot.val() || {};
  renderProducts(products);
  
  // Populate other sections dynamically (Trending, Best Sellers, etc.)
  const productArray = Object.values(products);
  if (productArray.length > 0) {
    renderProducts(products, '', 'trendingGrid'); // First 8 items
    renderProducts(products, '', 'bestSellersGrid');
    renderProducts(products, '', 'newArrivalsGrid');
    renderProducts(products, '', 'recommendedGrid');
  }
});

// Search
document.getElementById('searchBtn').addEventListener('click', () => {
  const term = document.getElementById('searchInput').value.trim();
  get(productsRef).then(snapshot => {
    renderProducts(snapshot.val() || {}, term);
  });
});

// Press Enter in search bar
document.getElementById('searchInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('searchBtn').click();
  }
});

// Category filter (Original listener)
document.querySelectorAll('.category-card, .mega-menu-col ul li a').forEach(card => {
  card.addEventListener('click', (e) => {
    e.preventDefault();
    const category = card.dataset.category;
    if (category) {
      get(productsRef).then(snapshot => {
        renderProducts(snapshot.val() || {}, category);
      });
    }
  });
});

// ==========================================
// CATEGORY MODAL & SEARCH SUGGESTIONS
// ==========================================
const modal = document.getElementById("categoryModal");
const modalTitle = document.getElementById("modalTitle");
const modalItems = document.getElementById("modalItems");
const closeBtn = document.querySelector(".close");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const suggestionsBox = document.getElementById("searchSuggestions");

let allProducts = [];

/* LOAD ALL PRODUCTS ONCE (FAST SEARCH) */
async function preloadProducts() {
  const snap = await get(ref(db, "catalogs"));
  if (!snap.exists()) return;

  allProducts = [];
  snap.forEach(catSnap => {
    const category = catSnap.key;
    catSnap.forEach(itemSnap => {
      allProducts.push({
        ...itemSnap.val(),
        category
      });
    });
  });
}
preloadProducts();

/* LIVE SEARCH WHILE TYPING */
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase().trim();
  suggestionsBox.innerHTML = "";

  if (!query) {
    suggestionsBox.style.display = "none";
    return;
  }

  const matches = allProducts.filter(item =>
    item.name?.toLowerCase().includes(query) ||
    item.category?.toLowerCase().includes(query)
  ).slice(0, 6);

  if (!matches.length) {
    suggestionsBox.style.display = "none";
    return;
  }

  suggestionsBox.style.display = "block";

  matches.forEach(item => {
    const priceUGX = item.price
      ? `UGX ${Number(item.price).toLocaleString("en-UG")}`
      : "UGX 0";

    const div = document.createElement("div");
    div.innerHTML = `
      <img src="${item.image || 'https://via.placeholder.com/40'}" alt="${item.name}">
      <div class="sugg-info">
        <strong>${item.name}</strong><br>
        <small>${item.category} • ${priceUGX}</small>
      </div>
    `;

    div.onclick = () => {
      searchInput.value = item.name;
      suggestionsBox.style.display = "none";
      openSearchResults(item.name);
    };

    suggestionsBox.appendChild(div);
  });
});

document.addEventListener("click", (e) => {
  if (!e.target.closest('.search-bar')) {
    suggestionsBox.style.display = "none";
  }
});

/* ENTER KEY SEARCH */
searchInput.addEventListener("keyup", e => {
  if (e.key === "Enter") openSearchResults(searchInput.value);
});

/* SEARCH BUTTON */
searchBtn.addEventListener("click", () => {
  openSearchResults(searchInput.value);
});

/* OPEN SEARCH RESULTS IN MODAL */
function openSearchResults(query) {
  query = query.toLowerCase().trim();
  if (!query) return;

  modal.style.display = "flex";
  modalTitle.innerText = `Search results for "${query}"`;
  modalItems.innerHTML = "";

  let found = false;
  allProducts.forEach(item => {
    const match =
      item.name?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query);

    if (match) {
      found = true;
      renderItemCard(item);
    }
  });

  if (!found) {
    modalItems.innerHTML = "<p>No matching products found</p>";
  }
  suggestionsBox.style.display = "none";
}

/* SEARCH PRODUCTS FALLBACK */
async function searchProducts() {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) return;

  modal.style.display = "flex";
  modalTitle.innerText = `Search Results for "${query}"`;
  modalItems.innerHTML = "Searching...";

  const snap = await get(ref(db, "catalogs"));
  modalItems.innerHTML = "";

  if (!snap.exists()) {
    modalItems.innerHTML = "<p>No products found</p>";
    return;
  }

  let found = false;
  snap.forEach(catSnap => {
    const category = catSnap.key;
    catSnap.forEach(itemSnap => {
      const item = itemSnap.val();
      const match =
        item.name?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        category.toLowerCase().includes(query);

      if (match) {
        found = true;
        renderItemCard(item);
      }
    });
  });

  if (!found) modalItems.innerHTML = "<p>No matching products found</p>";
}

/* RENDER CATEGORY SNAPSHOT */
function renderItems(snapshot) {
  modalItems.innerHTML = "";
  if (!snapshot.exists()) {
    modalItems.innerHTML = "<p>No items found</p>";
    return;
  }
  snapshot.forEach(child => renderItemCard(child.val()));
}

/* RENDER SINGLE ITEM */
function renderItemCard(item) {
  const priceUGX = item.price ? `UGX ${Number(item.price).toLocaleString("en-UG")}` : "UGX 0";
  const oldPriceUGX = item.oldPrice ? `UGX ${Number(item.oldPrice).toLocaleString("en-UG")}` : "-";
  const discountText = item.discount ? `${item.discount}%` : "-";
  const stockText = item.stock ?? "0";
  const phoneText = item.phone ?? "N/A";
  const descriptionText = item.description ?? "-";

  const message = encodeURIComponent(
    `🛒 *Product Purchase Inquiry*\n\n` +
    `*Name:* ${item.name}\n` +
    `*Price:* ${priceUGX}\n` +
    `*Old Price:* ${oldPriceUGX}\n` +
    `*Discount:* ${discountText}\n` +
    `*Stock:* ${stockText}\n` +
    `*Contact Phone:* ${phoneText}\n` +
    `*Description:* ${descriptionText}\n` +
    `*Image Link:* ${item.image}\n\n` +
    `Please let me know how I can proceed. Thank you 🙏`
  );

  const whatsappLink = `https://wa.me/256740840693?text=${message}`;

  modalItems.innerHTML += `
    <div class="item-card" style="border:1px solid #ddd; padding:12px; margin-bottom:12px; border-radius:10px;">
      <img src="${item.image}" style="width:100%; max-width:220px; border-radius:8px;" onerror="this.src='https://via.placeholder.com/220'">
      <h4>${item.name}</h4>
      <p><strong>${priceUGX}</strong></p>
      <p>Old Price: ${oldPriceUGX}</p>
      <p>Discount: ${discountText}</p>
      <p>Stock: ${stockText}</p>
      <p>Phone: ${phoneText}</p>
      <p>${descriptionText}</p>
      <a href="${whatsappLink}" target="_blank" style="display:inline-block;margin-top:8px;padding:10px 16px;background:#25D366;color:white;border-radius:6px;text-decoration:none;">Buy</a>
    </div>
  `;
}

/* CLOSE MODAL */
closeBtn.onclick = () => modal.style.display = "none";
window.onclick = e => { if (e.target === modal) modal.style.display = "none"; };

// ==========================================
// FLASH SALES
// ==========================================
const flashContainer = document.getElementById("flashContainer");

onValue(ref(db, "flashSells"), snap => {
  flashContainer.innerHTML = "";

  if (!snap.exists()) {
    flashContainer.innerHTML = "<p>No flash sell items available</p>";
    return;
  }

  snap.forEach(child => {
    const item = child.val();

    const priceUGX = item.price ? `UGX ${Number(item.price).toLocaleString("en-UG")}` : "UGX 0";
    const oldPriceUGX = item.oldPrice ? `UGX ${Number(item.oldPrice).toLocaleString("en-UG")}` : "";
    const discountText = item.discount ? `${item.discount}% OFF` : "";
    const descriptionText = item.description ?? "-";

    const message = encodeURIComponent(
      `🛒 *Flash Sell Purchase*\n\n` +
      `*Name:* ${item.name}\n` +
      `*Price:* ${priceUGX}\n` +
      `*Old Price:* ${oldPriceUGX}\n` +
      `*Discount:* ${discountText}\n` +
      `*Description:* ${descriptionText}\n` +
      `*Image:* ${item.image}\n\n` +
      `Hello, I’d like to buy this item.`
    );

    const whatsappLink = `https://wa.me/2567408406993?text=${message}`;

    flashContainer.innerHTML += `
      <div class="flash-card">
        <div class="flash-img">
          <img src="${item.image}" onerror="this.src='https://via.placeholder.com/300'">
        </div>
        <div class="flash-body">
          <div class="flash-title">${item.name}</div>
          <div class="flash-price">${priceUGX}</div>
          ${oldPriceUGX ? `<div class="flash-old">${oldPriceUGX}</div>` : ""}
          ${discountText ? `<div class="flash-badge">${discountText}</div>` : ""}
          <p><small>${descriptionText}</small></p>
          <a href="${whatsappLink}" target="_blank" class="buy-btn">Buy now</a>
        </div>
      </div>
    `;
  });
});

// ==========================================
// HERO SLIDER LOGIC
// ==========================================
const slidesWrapper = document.getElementById('slidesWrapper');
const slides = document.querySelectorAll('.slide');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const dotsContainer = document.getElementById('dotsContainer');

let currentSlide = 0;
let slideInterval;

// Create dots
slides.forEach((_, i) => {
  const dot = document.createElement('span');
  dot.classList.add('dot');
  if (i === 0) dot.classList.add('active');
  dot.addEventListener('click', () => goToSlide(i));
  dotsContainer.appendChild(dot);
});

function goToSlide(index) {
  slidesWrapper.style.transform = `translateX(-${index * 100}%)`;
  document.querySelectorAll('.dot').forEach((d, i) => {
    d.classList.toggle('active', i === index);
  });
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

nextBtn.addEventListener('click', () => {
  nextSlide();
  resetInterval();
});
prevBtn.addEventListener('click', () => {
  prevSlide();
  resetInterval();
});

function resetInterval() {
  clearInterval(slideInterval);
  slideInterval = setInterval(nextSlide, 5000);
}
resetInterval();

// ==========================================
// COUNTDOWN TIMER
// ==========================================
const hoursEl = document.getElementById('hours');
const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');

let hours = 2;
let minutes = 18;
let seconds = 34;

setInterval(() => {
  seconds--;
  if (seconds < 0) {
    seconds = 59;
    minutes--;
  }
  if (minutes < 0) {
    minutes = 59;
    hours--;
  }
  if (hours < 0) {
    hours = 2;
    minutes = 18;
    seconds = 34;
  }

  hoursEl.textContent = hours < 10 ? '0' + hours : hours;
  minutesEl.textContent = minutes < 10 ? '0' + minutes : minutes;
  secondsEl.textContent = seconds < 10 ? '0' + seconds : seconds;
}, 1000);

// ==========================================
// BACK TO TOP BUTTON
// ==========================================
const backToTopBtn = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
  if (window.scrollY > 300) {
    backToTopBtn.classList.add('show');
  } else {
    backToTopBtn.classList.remove('show');
  }
});

backToTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ==========================================
// MAINTENANCE MODE
// ==========================================
const overlay = document.getElementById("maintenanceOverlay");
const maintenanceRef = ref(db, "maintenance");

onValue(maintenanceRef, snapshot => {
  const isMaintenance = snapshot.exists() && snapshot.val() === true;

  if(isMaintenance){
    overlay.style.display = "flex";
    document.body.style.overflow = "hidden";
  } else {
    overlay.style.display = "none";
    document.body.style.overflow = "auto";
  }
});

// ==========================================
// VISITOR COUNTER
// ==========================================
(function countVisitor() {
  const hasVisited = localStorage.getItem("hasVisited");
  if (!hasVisited) {
    const visitorRef = ref(db, "totalVisitors");
    runTransaction(visitorRef, (currentCount) => {
      return (currentCount || 0) + 1;
    });
    localStorage.setItem("hasVisited", "true");
  }
})();

// ==========================================
// ADVERTISEMENT POPUP
// ==========================================
const firebaseConfigAdv = {
  apiKey: "AIzaSyAq7NeNLiZYobBVvjD7RMeLP7yyq57hWKw",
  authDomain: "advertisement-86114.firebaseapp.com",
  databaseURL: "https://advertisement-86114-default-rtdb.firebaseio.com",
  projectId: "advertisement-86114",
  storageBucket: "advertisement-86114.firebasestorage.app",
  messagingSenderId: "805405982197",
  appId: "1:805405982197:web:2b19eb58607094aa29f4bc"
};

const advApp = initAdApp(firebaseConfigAdv);
const advDb = getAdDb(advApp);

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

    const advOverlay = document.createElement("div");
    advOverlay.style.cssText = `
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
      advOverlay.remove();
    });

    const advCloseBtn = document.createElement("button");
    advCloseBtn.innerHTML = "&times;";
    advCloseBtn.style.cssText = `
      position:absolute; top:10px; right:10px;
      width:36px; height:36px; border:none; border-radius:50%;
      background:rgba(0,0,0,.65); color:#fff; font-size:22px;
      cursor:pointer; z-index:10;
    `;

    advCloseBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      advOverlay.remove();
    });

    box.addEventListener("click", e => e.stopPropagation());

    box.appendChild(img);
    box.appendChild(advCloseBtn);
    advOverlay.appendChild(box);
    document.body.appendChild(advOverlay);

  } catch (err) {
    console.error("Advertisement error:", err);
  }
})();