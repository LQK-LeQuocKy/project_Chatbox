let products = [];
let filteredProducts = [];

document.addEventListener("DOMContentLoaded", async function () {
  await loadProductsFromAPI();
  initProductFilter();
  initModalEvents();
});

// ================= LOAD API =================
async function loadProductsFromAPI() {
  try {
    const response = await fetch("http://localhost:8081/api/products");
    const data = await response.json();

    products = data.map(p => ({
      id: p.id,
      name: p.name,
      price: Number(p.price) || 0,
      category: mapCategory(p.categoryId),
      image: buildImageUrl(p.imageUrl),
      desc: p.description || "Sản phẩm chất lượng",
      badge: p.badge || "NEW",
      material: p.material || "Cotton",
      colors: parseList(p.color),
      sizes: parseList(p.size),
      details: p.description || "Không có mô tả"
    }));

    filteredProducts = [...products];

    renderProducts(products);
    updateResultCount(products.length);

  } catch (err) {
    console.error("Lỗi load sản phẩm:", err);
  }
}

// ================= RENDER =================
function renderProducts(productArray) {
  const productList = document.getElementById("productList");
  if (!productList) return;

  if (productArray.length === 0) {
    productList.innerHTML = `<h3>Không có sản phẩm</h3>`;
    return;
  }

  productList.innerHTML = productArray
    .map((product, index) => renderProductCard(product, index))
    .join("");

  attachDetailButtonEvents();
}

function buildImageUrl(imageUrl) {
  const base = "http://localhost:8081";

  if (!imageUrl) return base + "/img/no-image.png";

  if (imageUrl.startsWith("http")) return imageUrl;
  if (imageUrl.startsWith("img/")) return base + "/" + imageUrl;
  if (imageUrl.startsWith("/img/")) return base + imageUrl;

  return base + "/img/" + imageUrl;
}

function renderProductCard(product, index) {
  return `
    <div class="product-card" style="animation-delay:${index * 0.03}s">
      <div class="product-badge">${product.badge}</div>

      <div class="product-image">
        <img src="${product.image}" alt="${product.name}" />
      </div>

      <div class="product-card-content">
        <h3>${product.name}</h3>
        <p>${product.desc}</p>

        <div class="product-price">${formatPrice(product.price)}</div>

        <div class="product-actions">
          <button class="btn detail-btn" data-id="${product.id}">
            Xem chi tiết
          </button>

          <button class="btn modal-chat-btn chat-btn" type="button" data-id="${product.id}">
            Chat tư vấn
          </button>
        </div>
      </div>
    </div>
  `;
}

document.addEventListener("click", function (e) {
  const chatBtn = e.target.closest(".chat-btn");
  if (!chatBtn) return;

  const productId = Number(chatBtn.dataset.id);
  const product = products.find(p => p.id === productId);

  if (!product) return;

  goToChatWithProduct(product);
});


// ================= HELPER =================
function formatPrice(price) {
  return price.toLocaleString("vi-VN") + "đ";
}


function parseList(str) {
  if (!str) return ["N/A"];
  return str.split(",").map(s => s.trim());
}

function mapCategory(id) {
  switch (id) {
    case 1: return "shirt";
    case 2: return "polo";
    case 3: return "pants";
    case 4: return "blazer";
    case 5: return "shoes";
    case 6: return "tie";
    default: return "shirt";
  }
}

// ================= EVENTS =================
function attachDetailButtonEvents() {
  document.querySelectorAll(".detail-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const productId = Number(btn.dataset.id);
      openProductModal(productId);
    });
  });
}

function initModalEvents() {
  const modalOverlay = document.getElementById("productModalOverlay");
  const closeModalBtn = document.getElementById("closeModalBtn");

  if (modalOverlay) {
    modalOverlay.addEventListener("click", closeProductModal);
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeProductModal);
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeProductModal();
    }
  });
}

function openProductModal(productId) {
  const modal = document.getElementById("productModal");
  const modalBody = document.getElementById("modalBody");
  const product = products.find(item => item.id === productId);

  if (!modal || !modalBody || !product) return;

  modalBody.innerHTML = `
    <div class="modal-image">
      <img src="${product.image}" alt="${product.name}" />
    </div>

    <div class="modal-info">
      <span class="modal-category">${getCategoryName(product.category)}</span>
      <h2>${product.name}</h2>
      <div class="modal-price">${formatPrice(product.price)}</div>
      <p class="modal-desc">${product.details || product.desc || "Không có mô tả"}</p>

      <div class="modal-section">
        <h4>Chất liệu</h4>
        <div class="modal-list">
          <span>${product.material || "Đang cập nhật"}</span>
        </div>
      </div>

      <div class="modal-section">
        <h4>Màu sắc</h4>
        <div class="modal-list">
          ${(product.colors || []).map(color => `<span>${color}</span>`).join("")}
        </div>
      </div>

      <div class="modal-section">
        <h4>Size có sẵn</h4>
        <div class="modal-size-list">
          ${(product.sizes || []).map(size => `<span>${size}</span>`).join("")}
        </div>
      </div>

      <div class="modal-section">
        <h4>Mô tả ngắn</h4>
        <div class="modal-list">
          <span>${product.desc || "Sản phẩm chất lượng"}</span>
          <span>${product.badge || "NEW"}</span>
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn btn-dark modal-chat-btn" type="button" data-id="${product.id}">
          Chat tư vấn sản phẩm này
        </button>
        <button class="btn btn-outline" type="button" onclick="closeProductModal()">Đóng</button>
      </div>
    </div>
  `;

  const modalChatBtn = modalBody.querySelector(".modal-chat-btn");
  if (modalChatBtn) {
    modalChatBtn.addEventListener("click", function () {
      goToChatWithProduct(product);
    });
  }

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function getCategoryName(category) {
  const categoryMap = {
    shirt: "Áo sơ mi",
    polo: "Áo polo",
    pants: "Quần",
    blazer: "Blazer",
    shoes: "Giày",
    tie: "Cà vạt"
  };

  return categoryMap[category] || "Sản phẩm";
}

function closeProductModal() {
  const modal = document.getElementById("productModal");
  if (!modal) return;

  modal.classList.add("hidden");
  document.body.style.overflow = "";
}

function updateResultCount(count) {
  const el = document.getElementById("resultCount");
  if (el) el.textContent = count + " sản phẩm";
}

// ================= FILTER =================
function initProductFilter() {
  // nếu chưa cần filter thì để trống cũng OK
}

function initModalEvents() {}

function getCurrentUserKey() {
  const possibleUserKeys = ["currentUser", "user", "userInfo", "authUser"];

  for (const key of possibleUserKeys) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      if (parsed?.id) return "user_" + parsed.id;
      if (parsed?.username) return "username_" + parsed.username;
      if (parsed?.email) return "email_" + parsed.email;
    } catch (e) {}
  }

  const username = localStorage.getItem("username");
  if (username) return "username_" + username;

  return "guest";
}

function getChatStorageKey() {
  const userKey = getCurrentUserKey();
  return `mf_selected_product_chat_${userKey}`;
}

function saveProductForChat(product) {
  if (!product) return;

  localStorage.setItem(getChatStorageKey(), JSON.stringify({
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    desc: product.desc
  }));
}


function goToChatWithProduct(product) {
  if (!product) return;

  saveProductForChat(product);
  window.location.href = "ChatBox.html";
}