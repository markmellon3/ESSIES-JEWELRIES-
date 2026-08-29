// ==========================================
// FIREBASE IMPORTS & CONFIG
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Aliased imports for the Advertisement DB to prevent variable conflicts
import { initializeApp as initAdApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getDatabase as getAdDb, ref as refAd, get as getAd, runTransaction as runTransactionAd } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-database.js";

// Main App Config (Essie Jewelries)
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

// Ad App Config
const firebaseConfigAdv = {
 apiKey: "AIzaSyAq7NeNLiZYobBVvjD7RMeLP7yyq57hWKw",
 authDomain: "advertisement-86114.firebaseapp.com",
 databaseURL: "https://advertisement-86114-default-rtdb.firebaseio.com",
 projectId: "advertisement-86114",
 storageBucket: "advertisement-86114.firebasestorage.app",
 messagingSenderId: "805405982197",
 appId: "1:805405982197:web:2b19eb58607094aa29f4bc"
};

// Initialize Main Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Initialize Ad Firebase
const advApp = initAdApp(firebaseConfigAdv);
const advDb = getAdDb(advApp);


/* ===== FLASH SELLS ===== */
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
  card.className = "flash-card"; // Using style.css class
  
  const oldPriceHTML = p.oldPrice ? `<div class="flash-old">UGX ${Number(p.oldPrice).toLocaleString()}</div>` : "";
  
  card.innerHTML = `
      <div class="flash-img">
        <img src="${p.image}" onerror="this.src='https://via.placeholder.com/300'">
      </div>
      <div class="flash-body">
        <div class="flash-title">${p.name}</div>
        <div class="flash-price">UGX ${Number(p.price).toLocaleString()}</div>
        ${oldPriceHTML}
        <button class="buy-btn">BUY NOW</button>
      </div>
    `;
  card.querySelector("button").addEventListener("click", () => {
   buyFlash(p);
  });
  flashGrid.appendChild(card);
 });
});

/* ===== CATALOGS ===== */
const wrapper = document.getElementById("catalogs");
onValue(ref(db, "catalogs"), snap => {
 wrapper.innerHTML = "";
 
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
  grid.className = "products-grid"; // Using style.css class
  
  categorySnap.forEach(itemSnap => {
   const p = itemSnap.val();
   const card = document.createElement("div");
   card.className = "product-card"; // Using style.css class
   
   card.innerHTML = `
        <div class="product-img-container">
          <img src="${p.image}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/220'">
        </div>
        <div class="product-info">
          <div class="product-name">${p.name}</div>
          <div>
            <span class="price-current">UGX ${Number(p.price).toLocaleString()}</span>
            <span class="price-old">UGX ${Number(p.oldPrice || 0).toLocaleString()}</span>
          </div>
          <button class="btn" style="width: 100%; margin-top: 10px; text-align: center;">BUY NOW</button>
        </div>
      `;
   card.querySelector("button").addEventListener("click", () => {
    buyCatalog(p);
   });
   grid.appendChild(card);
  });
  
  wrapper.appendChild(grid);
 });
});

/* ===== BUY FUNCTIONS ===== */
// Send product info to payment.html via URL parameters
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

/* ===== SHOW AD POPUP ===== */
(async function showAdPopup() {
 try {
  const snap = await getAd(refAd(advDb, "advertisements"));
  const data = snap.val();
  
  if (!data || !data.enabled || !data.images) return;
  
  const ads = Object.entries(data.images);
  if (!ads.length) return;
  
  /* PICK RANDOM AD */
  const [adId, ad] = ads[Math.floor(Math.random() * ads.length)];
  
  /* TRACK IMPRESSION */
  runTransactionAd(
   refAd(advDb, `advertisements/images/${adId}/impressions`),
   v => (v || 0) + 1
  );
  
  /* OVERLAY */
  const overlay = document.createElement("div");
  overlay.style.cssText = `
      position:fixed;
      inset:0;
      background:rgba(0,0,0,0.65);
      display:flex;
      align-items:center;
      justify-content:center;
      z-index:999999;
      padding:16px;
    `;
  
  /* AD CONTAINER */
  const box = document.createElement("div");
  box.style.cssText = `
      background:#000;
      border-radius:18px;
      width:100%;
      max-width:420px;
      max-height:90vh;
      position:relative;
      overflow:hidden;
      box-shadow:0 30px 60px rgba(0,0,0,.7);
    `;
  
  /* AD IMAGE (CLICKABLE) */
  const img = document.createElement("img");
  img.src = ad.imageUrl;
  img.alt = "Advertisement";
  img.style.cssText = `
      width:100%;
      height:auto;
      max-height:90vh;
      object-fit:contain;
      display:block;
      cursor:pointer;
    `;
  
  img.addEventListener("click", async (e) => {
   e.stopPropagation();
   
   await runTransactionAd(
    refAd(advDb, `advertisements/images/${adId}/clicks`),
    v => (v || 0) + 1
   );
   
   if (ad.linkUrl) {
    window.open(ad.linkUrl, "_blank", "noopener");
   }
   
   overlay.remove();
  });
  
  /* CLOSE BUTTON */
  const closeBtn = document.createElement("button");
  closeBtn.innerHTML = "&times;";
  closeBtn.style.cssText = `
      position:absolute;
      top:10px;
      right:10px;
      width:36px;
      height:36px;
      border:none;
      border-radius:50%;
      background:rgba(0,0,0,.65);
      color:#fff;
      font-size:22px;
      cursor:pointer;
      z-index:10;
    `;
  
  closeBtn.addEventListener("click", (e) => {
   e.stopPropagation();
   overlay.remove();
  });
  
  /* BLOCK PROPAGATION */
  box.addEventListener("click", e => e.stopPropagation());
  
  /* BUILD DOM */
  box.appendChild(img);
  box.appendChild(closeBtn);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  
 } catch (err) {
  console.error("Advertisement error:", err);
 }
})();