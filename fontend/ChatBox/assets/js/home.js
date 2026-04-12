const homeProducts = [
  {
    id: 1,
    name: "Áo sơ mi nam slim fit",
    price: 399000,
    image: "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=800&q=80",
    desc: "Thiết kế lịch lãm, phù hợp đi làm và đi chơi.",
    badge: "BEST SELLER",
    meta: ["Slim fit", "Cotton"]
  },
  {
    id: 2,
    name: "Áo polo nam basic",
    price: 299000,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80",
    desc: "Phong cách trẻ trung, dễ phối đồ.",
    badge: "NEW",
    meta: ["Basic", "Easy match"]
  },
  {
    id: 3,
    name: "Quần tây nam form đứng",
    price: 459000,
    image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80",
    desc: "Chất liệu đẹp, phù hợp môi trường công sở.",
    badge: "HOT",
    meta: ["Office", "Form đứng"]
  },
  {
    id: 4,
    name: "Áo blazer nam hiện đại",
    price: 799000,
    image: "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=800&q=80",
    desc: "Tăng vẻ lịch lãm, sang trọng.",
    badge: "PREMIUM",
    meta: ["Blazer", "Formal"]
  }
];

document.addEventListener("DOMContentLoaded", function () {
  renderFeaturedProducts();
});

function renderFeaturedProducts() {
  const featuredContainer = document.getElementById("featuredProducts");
  if (!featuredContainer) return;

  featuredContainer.innerHTML = homeProducts.map(renderProductCard).join("");

  bindFeaturedChatButtons();
}

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

function getSelectedProductChatKey() {
  return `mf_selected_product_chat_${getCurrentUserKey()}`;
}

function saveProductForChat(product) {
  if (!product) return;

  localStorage.setItem(
    getSelectedProductChatKey(),
    JSON.stringify({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      desc: product.desc
    })
  );
}

function goToChatWithProduct(product) {
  if (!product) return;

  saveProductForChat(product);
  window.location.href = "ChatBox.html";
}

function bindFeaturedChatButtons() {
  document.querySelectorAll(".featured-chat-btn").forEach((btn) => {
    btn.onclick = function () {
      const productId = Number(btn.dataset.id);
      const product = homeProducts.find((item) => item.id === productId);

      if (!product) return;

      goToChatWithProduct(product);
    };
  });
}

function renderProductCard(product) {
  return `
    <div class="product-card">
      <div class="product-card-badge">${product.badge}</div>
      <img src="${product.image}" alt="${product.name}" />
      <div class="product-card-content">
        <h3>${product.name}</h3>
        <p>${product.desc}</p>

        <div class="product-meta">
          ${product.meta.map(item => `<span>${item}</span>`).join("")}
        </div>

        <div class="product-price">${formatPrice(product.price)}</div>

        <div class="product-actions">
          <button class="btn btn-dark featured-chat-btn" data-id="${product.id}" type="button">
            Chat tư vấn
          </button>
          <a href="SanPham.html" class="btn btn-outline">Xem thêm</a>
        </div>
      </div>
    </div>
  `;
}