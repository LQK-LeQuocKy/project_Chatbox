let syncInterval = null;

function startMessageSync() {
  if (syncInterval) clearInterval(syncInterval);

  syncInterval = setInterval(() => {
    syncMessagesFromServer();
  }, 3000); // mỗi 3 giây
}

const STORAGE_KEY_PREFIX = {
  CHAT_SESSIONS: "mf_chat_sessions",
  ACTIVE_CHAT_ID: "mf_active_chat_id",
  CUSTOMER_INFO: "customerInfo",
  SELECTED_PRODUCT_CHAT: "mf_selected_product_chat"
};

function getAccessToken() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  return localStorage.getItem("accessToken") || currentUser.accessToken || "";
}

function getCurrentUserKey() {
  // Ưu tiên lấy từ user info đã lưu sau khi đăng nhập
  const possibleUserKeys = ["currentUser", "user", "userInfo", "authUser"];

  for (const key of possibleUserKeys) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      if (parsed?.id) return "user_" + parsed.id;
      if (parsed?.username) return "username_" + parsed.username;
      if (parsed?.email) return "email_" + parsed.email;
    } catch (e) {
      // nếu không phải JSON thì bỏ qua
    }
  }

  // fallback: thử lấy username riêng lẻ
  const username = localStorage.getItem("username");
  if (username) return "username_" + username;

  // fallback cuối: nếu chưa đăng nhập thì xem là guest
  return "guest";
}

function getStorageKeys() {
  const userKey = getCurrentUserKey();

  return {
    CHAT_SESSIONS: `${STORAGE_KEY_PREFIX.CHAT_SESSIONS}_${userKey}`,
    ACTIVE_CHAT_ID: `${STORAGE_KEY_PREFIX.ACTIVE_CHAT_ID}_${userKey}`,
    CUSTOMER_INFO: `${STORAGE_KEY_PREFIX.CUSTOMER_INFO}_${userKey}`,
    SELECTED_PRODUCT_CHAT: `${STORAGE_KEY_PREFIX.SELECTED_PRODUCT_CHAT}_${userKey}`
  };
}


const API_BASE_URL = "http://localhost:8081/api/chat";
const DEFAULT_FIRST_MESSAGE = {
  sender: "bot",
  text: "Xin chào bạn 👋 Mình là trợ lý của Men Fashion. Bạn cần tư vấn size, phối đồ, giao hàng hay đổi trả cứ nhắn mình nha 😎",
  time: getCurrentTime(),
  responseType: "TEXT"
};

let currentProductChat = null;
let currentConsultProduct = null;

async function loadSelectedProductForChat() {
  const keys = getStorageKeys();
  const raw = localStorage.getItem(keys.SELECTED_PRODUCT_CHAT);
  if (!raw) return;

  try {
    const product = JSON.parse(raw);
    if (!product) return;

    currentProductChat = product;

    // Gọi backend để bot tự trả lời mở đầu cho sản phẩm
    await openProductConsultation(product);

    localStorage.removeItem(keys.SELECTED_PRODUCT_CHAT);
  } catch (error) {
    console.error("Lỗi đọc sản phẩm chat:", error);
    localStorage.removeItem(keys.SELECTED_PRODUCT_CHAT);
  }
}

async function openProductConsultation(product) {
  if (!product?.id) return;

  const activeSession = getActiveSession();
  if (!activeSession) return;

  const alreadyHasConsultIntro = activeSession.messages?.some(
    (msg) =>
      msg.sender === "bot" &&
      msg.metadata?.productId === product.id &&
      msg.responseType === "PRODUCT_INFO"
  );

  if (alreadyHasConsultIntro) return;

  currentProductChat = {
    id: product.id,
    name: product.name
  };

  currentConsultProduct = {
    id: product.id,
    name: product.name
  };

  updateActiveSession((session) => {
    return {
      ...session,
      context: {
        ...(session.context || {}),
        productId: product.id,
        productName: product.name,
        chatType: "PRODUCT"
      }
    };
  });

  // thêm dòng này để hiện phía khách hàng
  addUserMessage("tư vấn");

  showTypingMessage();

  try {
    const token = getAccessToken();

    const response = await fetch("http://localhost:8081/api/chat/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        message: "tư vấn",
        productId: product.id,
        productName: product.name,
        chatType: "PRODUCT",
        sessionCode: String(getActiveChatId()).startsWith("chat_")
        ? null
        : getActiveChatId()
      })
    });

    removeTypingMessage();

    if (!response.ok) {
      const errorText = await response.text();
      console.error("HTTP error:", response.status, errorText);

      addBotMessage(
        `Bạn cần tư vấn gì với mẫu ${product.name}? Mình có thể hỗ trợ:
- Size
- Giá
- Màu sắc
- Chất liệu
- Còn hàng không
- Mô tả chi tiết`,
        {
          responseType: "PRODUCT_INFO",
          metadata: {
            productId: product.id,
            productName: product.name
          }
        }
      );
      return;
    }

    const data = await response.json();

    addBotMessage(
      data.message || `Bạn cần tư vấn gì với mẫu ${product.name}?`,
      {
        responseType: data.responseType || "PRODUCT_INFO",
        products: data.products || [],
        metadata: data.metadata || {
          productId: product.id,
          productName: product.name
        }
      }
    );
  } catch (err) {
    removeTypingMessage();
    console.error("Lỗi mở tư vấn sản phẩm:", err);

    addBotMessage(
      `Bạn cần tư vấn gì với mẫu ${product.name}? Mình có thể hỗ trợ:
- Size
- Giá
- Màu sắc
- Chất liệu
- Còn hàng không
- Mô tả chi tiết`,
      {
        responseType: "PRODUCT_INFO",
        metadata: {
          productId: product.id,
          productName: product.name
        }
      }
    );
  }
}

document.addEventListener("DOMContentLoaded", function () {
  initializeChatApp();
  initQuickButtons();
  initSaveCustomerInfo();
  loadSelectedProductForChat();

  syncMessagesFromServer();
  startMessageSync();

  const chatInput = document.getElementById("chatInput");
  if (chatInput) {
    chatInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        if (e.ctrlKey || e.shiftKey) return;

        e.preventDefault();

        const message = chatInput.value.trim();
        if (!message) return;

        sendUserMessage(message);

        chatInput.value = "";
        chatInput.style.height = "auto";
      }
    });
  }
});

function initializeChatApp() {
  createDefaultSessionIfNeeded();
  renderHistoryList();
  renderActiveChat();

  initChatForm();
  initHistoryActions();
  initNewChatButton();
  initClearCurrentChatButton();
}

function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getCurrentDateTime() {
  const now = new Date();
  return now.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function generateId() {
  return "chat_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
}

function getStoredSessions() {
  const keys = getStorageKeys();
  return JSON.parse(localStorage.getItem(keys.CHAT_SESSIONS)) || [];
}

function saveSessions(sessions) {
  const keys = getStorageKeys();
  localStorage.setItem(keys.CHAT_SESSIONS, JSON.stringify(sessions));
}

function getActiveChatId() {
  const keys = getStorageKeys();
  return localStorage.getItem(keys.ACTIVE_CHAT_ID);
}

function setActiveChatId(chatId) {
  const keys = getStorageKeys();
  localStorage.setItem(keys.ACTIVE_CHAT_ID, chatId);
}

function createDefaultSessionIfNeeded() {
  const sessions = getStoredSessions();

  if (!sessions.length) {
    const newSession = {
      id: generateId(),
      title: "Cuộc trò chuyện mới",
      createdAt: getCurrentDateTime(),
      updatedAt: getCurrentDateTime(),
      context: {},
      messages: [DEFAULT_FIRST_MESSAGE]
    };

    saveSessions([newSession]);
    setActiveChatId(newSession.id);
    return;
  }

  const activeId = getActiveChatId();
  const sessionExists = sessions.some((session) => session.id === activeId);

  const normalized = sessions.map((session) => ({
    ...session,
    context: session.context || {},
    messages: (session.messages || []).map((msg) => ({
      responseType: "TEXT",
      products: [],
      metadata: null,
      ...msg
    }))
  }));

  saveSessions(normalized);

  if (!activeId || !sessionExists) {
    setActiveChatId(normalized[0].id);
  }
}

function getActiveSession() {
  const sessions = getStoredSessions();
  const activeId = getActiveChatId();
  return sessions.find((session) => session.id === activeId) || sessions[0];
}

function updateActiveSession(sessionUpdater) {
  const sessions = getStoredSessions();
  const activeId = getActiveChatId();

  const updatedSessions = sessions.map((session) => {
    if (session.id !== activeId) return session;

    const updated = sessionUpdater(session);

    return {
      ...updated,
      updatedAt: getCurrentDateTime(),
      title: buildChatTitle(updated.messages)
    };
  });

  saveSessions(updatedSessions);
}

function buildChatTitle(messages) {
  const firstUserMessage = messages.find((msg) => msg.sender === "user");
  if (!firstUserMessage) return "Cuộc trò chuyện mới";

  const plainText = firstUserMessage.text.trim();
  return plainText.length > 28 ? plainText.slice(0, 28) + "..." : plainText;
}

function renderActiveChat() {
  const activeSession = getActiveSession();
  const chatMessages = document.getElementById("chatMessages");

  if (!chatMessages || !activeSession) return;

  chatMessages.innerHTML = activeSession.messages
    .map((msg) => renderMessageHtml(msg))
    .join("");

  bindDynamicChatActions();
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function renderMessageHtml(msg) {
  let messageClass = "bot";

  if (msg.sender === "user") {
    messageClass = "user";
  } else if (msg.sender === "admin" || msg.metadata?.senderType === "ADMIN") {
    messageClass = "admin";
  }

  const senderLabel =
    msg.sender === "user"
      ? "Bạn"
      : (msg.sender === "admin" || msg.metadata?.senderType === "ADMIN")
        ? "Admin"
        : "Bot";

  const textHtml = `
    <div class="message-sender-label">${escapeHtml(senderLabel)}</div>
    <div class="message-text">${escapeHtml(msg.text || "")}</div>
  `;

  let extraHtml = "";

  if (
    msg.sender === "bot" &&
    msg.responseType === "SUGGESTION" &&
    msg.metadata?.suggestions
  ) {
    extraHtml += `
      <div class="chat-suggestion-box">
        ${msg.metadata.suggestions.map(item => `
          <button type="button" class="chat-suggestion-btn" data-message="${item}">
            Các mẫu ${item}
          </button>
        `).join("")}
      </div>
    `;
  }

  if (msg.sender === "bot" && msg.responseType === "PRODUCT_LIST" && Array.isArray(msg.products) && msg.products.length) {
    const sliderId = "slider_" + Math.random().toString(36).slice(2, 10);

    extraHtml += `
      <div class="chat-products-wrapper">
        <div class="chat-products-topbar">
          <button class="chat-scroll-btn" type="button" onclick="scrollProductSlider('${sliderId}', -1)">‹</button>
          <button class="chat-scroll-btn" type="button" onclick="scrollProductSlider('${sliderId}', 1)">›</button>
        </div>
        ${renderProductsHtml(msg.products, sliderId)}
      </div>
    `;
  }

  if (msg.sender === "bot" && msg.responseType === "NAVIGATE" && msg.metadata?.targetUrl) {
    extraHtml += `
      <div class="chat-action-box">
        <button 
          class="chat-confirm-btn" 
          type="button"
          data-url="${escapeHtml(msg.metadata.targetUrl)}">
          ${escapeHtml(msg.metadata.confirmText || "Xác nhận")}
        </button>
        <button class="chat-cancel-btn" type="button">
          ${escapeHtml(msg.metadata.cancelText || "Hủy")}
        </button>
      </div>
    `;
  }

  return `
    <div class="message ${messageClass}">
      ${textHtml}
      ${extraHtml}
      <small>${msg.time || getCurrentTime()}</small>
    </div>
  `;
}

function renderProductsHtml(products, sliderId = "") {
  return `
    <div class="chat-products-viewport">
      <div class="chat-products-slider" id="${sliderId}">
        ${products.map((product) => {
          const price = formatPrice(product.price);

          const rawImage =
            product.imageUrl ||
            product.image ||
            product.image_url ||
            product.thumbnail ||
            product.thumbnailUrl ||
            "";

          const imageUrl = buildImageUrl(rawImage);

          const productUrl =
            product.productUrl ||
            product.url ||
            (product.id ? `SanPhamChiTiet.html?id=${product.id}` : "#");

          return `
            <div class="chat-product-slide">
              <div class="chat-product-card">
                <img 
                  src="${escapeHtml(imageUrl)}" 
                  alt="${escapeHtml(product.name || "Sản phẩm")}" 
                  class="chat-product-image"
                  onerror="this.onerror=null; this.src='http://localhost:8081/img/no-image.png';"
                />
                <div class="chat-product-body">
                  <h4 class="chat-product-name">${escapeHtml(product.name || "Sản phẩm")}</h4>
                  <p class="chat-product-price">${escapeHtml(price)}</p>
                  <p class="chat-product-desc">${escapeHtml(shortenText(product.description || "", 70))}</p>
                  <div class="chat-product-actions">
                    <a href="${escapeHtml(productUrl)}" class="chat-product-link">Xem chi tiết</a>

                    <button 
                      class="chat-product-consult-btn"
                      data-id="${product.id}"
                      data-name="${escapeHtml(product.name)}">
                      Tư vấn
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function bindDynamicChatActions() {
  // ===== NÚT GỢI Ý =====
  document.querySelectorAll(".chat-suggestion-btn").forEach((btn) => {
    btn.onclick = function () {
      const message = btn.dataset.message;
      if (!message) return;
      sendUserMessage(message);
    };
  });

  // ===== NÚT TƯ VẤN SẢN PHẨM =====
  document.querySelectorAll(".chat-product-consult-btn").forEach((btn) => {
    btn.onclick = function () {
      const id = Number(btn.dataset.id);
      const name = btn.dataset.name;

      currentProductChat = { id, name };
      currentConsultProduct = { id, name };

      sendUserMessage("tư vấn");
    };
  });

  // ===== NÚT XÁC NHẬN ĐIỀU HƯỚNG =====
  document.querySelectorAll(".chat-confirm-btn").forEach((button) => {
    button.onclick = function () {
      const url = button.dataset.url;
      if (url) {
        window.location.href = url;
      }
    };
  });

  // ===== NÚT HỦY =====
  document.querySelectorAll(".chat-cancel-btn").forEach((button) => {
    button.onclick = function () {
      const actionBox = button.closest(".chat-action-box");
      if (actionBox) {
        actionBox.remove();
      }
    };
  });
}


function renderHistoryList() {
  const historyList = document.getElementById("historyList");
  if (!historyList) return;

  const sessions = getStoredSessions();
  const activeId = getActiveChatId();

  if (!sessions.length) {
    historyList.innerHTML = `<div class="history-empty">Chưa có lịch sử trò chuyện.</div>`;
    return;
  }

  const sortedSessions = [...sessions].sort((a, b) => {
    return new Date(parseVNDate(b.updatedAt)) - new Date(parseVNDate(a.updatedAt));
  });

  historyList.innerHTML = sortedSessions
    .map((session) => {
      const previewMessage =
        session.messages[session.messages.length - 1]?.text || "Chưa có nội dung";

      return `
        <div class="history-item ${session.id === activeId ? "active" : ""}" data-id="${session.id}">
          <div class="history-item-title">${escapeHtml(session.title)}</div>
          <div class="history-item-preview">${escapeHtml(shortenText(previewMessage, 48))}</div>
          <div class="history-item-time">${session.updatedAt}</div>
        </div>
      `;
    })
    .join("");
}

function parseVNDate(dateString) {
  if (!dateString) return new Date();

  const [timePart, datePart] = dateString.split(" ");
  if (!timePart || !datePart) return new Date();

  const [day, month, year] = datePart.split("/");
  return `${year}-${month}-${day}T${timePart}:00`;
}

function shortenText(text, maxLength) {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
}

function initHistoryActions() {
  const historyList = document.getElementById("historyList");
  if (!historyList) return;

  historyList.addEventListener("click", function (e) {
    const historyItem = e.target.closest(".history-item");
    if (!historyItem) return;

    const chatId = historyItem.dataset.id;
    setActiveChatId(chatId);
    renderHistoryList();
    renderActiveChat();
    syncMessagesFromServer();
  });
}

function initNewChatButton() {
  const newChatBtn = document.getElementById("newChatBtn");
  if (!newChatBtn) return;

  newChatBtn.addEventListener("click", function () {
    // reset trạng thái tư vấn cũ
    currentProductChat = null;
    currentConsultProduct = null;
    localStorage.removeItem(getStorageKeys().SELECTED_PRODUCT_CHAT);

    const sessions = getStoredSessions();

    const newSession = {
      id: generateId(),
      title: "Cuộc trò chuyện mới",
      createdAt: getCurrentDateTime(),
      updatedAt: getCurrentDateTime(),
      context: {},
      messages: [
        {
          sender: "bot",
          text: "Xin chào bạn 👋 Đây là cuộc trò chuyện mới. Bạn muốn mình tư vấn gì nè?",
          time: getCurrentTime(),
          responseType: "TEXT",
          products: [],
          metadata: null
        }
      ]
    };

    sessions.unshift(newSession);
    saveSessions(sessions);
    setActiveChatId(newSession.id);

    const chatInput = document.getElementById("chatInput");
    if (chatInput) {
      chatInput.value = "";
      chatInput.style.height = "auto";
      chatInput.focus();
    }

    renderHistoryList();
    renderActiveChat();
  });
}

function initClearCurrentChatButton() {
  const clearBtn = document.getElementById("clearCurrentChatBtn");
  if (!clearBtn) return;

  clearBtn.addEventListener("click", function () {
    const activeId = getActiveChatId();
    let sessions = getStoredSessions();

    currentProductChat = null;
    currentConsultProduct = null;
    localStorage.removeItem(getStorageKeys().SELECTED_PRODUCT_CHAT);

    sessions = sessions.filter((session) => session.id !== activeId);

    if (!sessions.length) {
      const newSession = {
        id: generateId(),
        title: "Cuộc trò chuyện mới",
        createdAt: getCurrentDateTime(),
        updatedAt: getCurrentDateTime(),
        context: {},
        messages: [
          {
            sender: "bot",
            text: "Xin chào bạn 👋 Đây là cuộc trò chuyện mới. Mình hỗ trợ bạn ngay đây.",
            time: getCurrentTime(),
            responseType: "TEXT",
            products: [],
            metadata: null
          }
        ]
      };

      sessions.unshift(newSession);
      saveSessions(sessions);
      setActiveChatId(newSession.id);
    } else {
      saveSessions(sessions);
      setActiveChatId(sessions[0].id);
    }

    renderHistoryList();
    renderActiveChat();
  });
}

function initChatForm() {
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");

  if (!chatForm || !chatInput) return;

  chatForm.addEventListener("submit", function (e) {
    e.preventDefault(); // vẫn giữ

    const text = chatInput.value.trim();
    if (!text) return;

    chatInput.value = "";
    autoResizeTextarea(chatInput);

    sendUserMessage(text);
  });

  chatInput.addEventListener("input", function () {
    autoResizeTextarea(chatInput);
  });
}

function autoResizeTextarea(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = textarea.scrollHeight + "px";
}

function initQuickButtons() {
  const buttons = document.querySelectorAll(".quick-btn");

  if (!buttons.length) return;

  buttons.forEach((button) => {
    button.addEventListener("click", async function () {
      const message = button.dataset.message || "";
      await sendUserMessage(message, null);
    });
  });
}

function initSaveCustomerInfo() {
  const saveBtn = document.getElementById("saveContactBtn");
  if (!saveBtn) return;

  saveBtn.addEventListener("click", function () {
    const name = document.getElementById("customerName");
    const phone = document.getElementById("customerPhone");
    const contactMessage = document.getElementById("contactMessage");

    const customerName = name.value.trim();
    const customerPhone = phone.value.trim();

    if (!customerName || !customerPhone) {
      contactMessage.style.color = "#d32f2f";
      contactMessage.textContent = "Vui lòng nhập đầy đủ họ tên và số điện thoại.";
      return;
    }

    const keys = getStorageKeys();

      localStorage.setItem(
        keys.CUSTOMER_INFO,
        JSON.stringify({
          name: customerName,
          phone: customerPhone
        })
      );

    contactMessage.style.color = "#198754";
    contactMessage.textContent = "Đã lưu thông tin. Tư vấn viên sẽ liên hệ sớm.";

    name.value = "";
    phone.value = "";
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.innerText = text ?? "";
  return div.innerHTML;
}

function addMessageToActiveSession(sender, text, options = {}) {
  updateActiveSession((session) => {
    const messages = [...session.messages];
    messages.push({
      sender,
      text,
      time: getCurrentTime(),
      responseType: options.responseType || "TEXT",
      products: options.products || [],
      metadata: options.metadata || null
    });

    return {
      ...session,
      messages
    };
  });

  renderActiveChat();
  renderHistoryList();
}

function addUserMessage(text) {
  addMessageToActiveSession("user", text, {
    responseType: "TEXT",
    products: [],
    metadata: null
  });
}

function addBotMessage(text, options = {}) {
  addMessageToActiveSession("bot", text, {
    responseType: options.responseType || "TEXT",
    products: options.products || [],
    metadata: options.metadata || null
  });
}

function showTypingMessage() {
  const chatMessages = document.getElementById("chatMessages");
  if (!chatMessages) return null;

  const typingEl = document.createElement("div");
  typingEl.className = "message bot typing-message";
  typingEl.id = "typingMessage";
  typingEl.innerHTML = `Đang trả lời...<small>${getCurrentTime()}</small>`;

  chatMessages.appendChild(typingEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  return typingEl;
}

function removeTypingMessage() {
  const typingEl = document.getElementById("typingMessage");
  if (typingEl) typingEl.remove();
}

async function sendUserMessage(message) {
  const messageToSend = (message || "").trim();
  if (!messageToSend) return;

  const activeSession = getActiveSession();
  const sessionContext = activeSession?.context || {};

  const effectiveProductId =
    currentConsultProduct?.id ||
    currentProductChat?.id ||
    sessionContext.productId ||
    null;

  const effectiveProductName =
    currentConsultProduct?.name ||
    currentProductChat?.name ||
    sessionContext.productName ||
    null;

  const effectiveChatType =
    effectiveProductId ? "PRODUCT" : "GENERAL";

  addUserMessage(messageToSend);
  showTypingMessage();

  try {
    const token = getAccessToken();

    const response = await fetch("http://localhost:8081/api/chat/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        message: messageToSend,
        productId: effectiveProductId,
        productName: effectiveProductName,
        chatType: effectiveChatType,
        sessionCode: String(getActiveChatId()).startsWith("chat_")
        ? null
        : getActiveChatId()
      })
    });

    removeTypingMessage();

    if (!response.ok) {
      const errorText = await response.text();
      console.error("HTTP error:", response.status, errorText);
      addBotMessage("⚠️ Server trả về lỗi " + response.status);
      return;
    }

    const data = await response.json();
    if (data.sessionCode) {
      replaceLocalSessionWithServerSession(data.sessionCode);
    }

    addBotMessage(
      data.message || data.reply || "Mình đã nhận được tin nhắn của bạn.",
      {
        responseType: data.responseType,
        products: data.products || [],
        metadata: data.metadata || null
      }
    );
  } catch (err) {
    removeTypingMessage();
    console.error("Lỗi gọi API chat:", err);
    addBotMessage("⚠️ Lỗi kết nối server");
  }
}

function replaceLocalSessionWithServerSession(serverSessionCode) {
  if (!serverSessionCode) return;

  const sessions = getStoredSessions();
  const activeId = getActiveChatId();

  const updatedSessions = sessions.map((session) => {
    if (session.id !== activeId) return session;

    return {
      ...session,
      id: String(serverSessionCode)
    };
  });

  saveSessions(updatedSessions);
  setActiveChatId(String(serverSessionCode));
  renderHistoryList();
  renderActiveChat();
  syncMessagesFromServer();
}

function buildImageUrl(imageUrl) {
  const base = "http://localhost:8081";

  if (!imageUrl || typeof imageUrl !== "string") {
    return base + "/img/no-image.png";
  }

  const cleaned = imageUrl.trim();

  if (!cleaned) {
    return base + "/img/no-image.png";
  }

  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
    return cleaned;
  }

  if (cleaned.startsWith("/")) {
    return base + cleaned;
  }

  if (
    cleaned.startsWith("img/") ||
    cleaned.startsWith("uploads/") ||
    cleaned.startsWith("images/")
  ) {
    return base + "/" + cleaned;
  }

  return base + "/img/" + cleaned;
}

function formatPrice(price) {
  if (price === null || price === undefined || price === "") {
    return "Liên hệ";
  }

  const number = Number(price);
  if (Number.isNaN(number)) {
    return "Liên hệ";
  }

  return number.toLocaleString("vi-VN") + " đ";
}

function scrollProductSlider(sliderId, direction) {
  const slider = document.getElementById(sliderId);
  if (!slider) return;

  const firstSlide = slider.querySelector(".chat-product-slide");
  if (!firstSlide) return;

  const slideStyle = window.getComputedStyle(firstSlide);
  const slideWidth = firstSlide.offsetWidth;
  const gap = parseInt(slideStyle.marginRight) || 16;

  const visibleCount = window.innerWidth <= 768 ? 1 : 3;
  const scrollAmount = (slideWidth + gap) * visibleCount * direction;

  slider.scrollBy({
    left: scrollAmount,
    behavior: "smooth"
  });
}

function mapServerSenderToClient(senderType) {
  const sender = String(senderType || "").toUpperCase();

  if (sender === "CUSTOMER" || sender === "USER") return "user";
  if (sender === "ADMIN") return "admin"; 
  if (sender === "BOT") return "bot";

  return "bot";
}

function formatServerTime(dateTime) {
  if (!dateTime) return getCurrentTime();

  const date = new Date(dateTime);
  if (isNaN(date.getTime())) return getCurrentTime();

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function buildMessageFingerprint(message) {
  return [
    message.sender,
    (message.text || "").trim(),
    message.time || ""
  ].join("||");
}

async function syncMessagesFromServer() {
  const activeSession = getActiveSession();
  if (!activeSession?.id) return;

  // Nếu là id local dạng chat_xxx thì không gọi history từ server
  if (String(activeSession.id).startsWith("chat_")) {
    return;
  }

  try {
    const token = getAccessToken();
    console.log("TOKEN CHAT =", token);
    console.log("AUTH HEADER =", token ? `Bearer ${token}` : "KHÔNG CÓ TOKEN");

    const response = await fetch(`http://localhost:8081/api/chat/history/${encodeURIComponent(activeSession.id)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      }
    });

    if (!response.ok) return;

    const serverMessages = await response.json();
    if (!Array.isArray(serverMessages)) return;

    let hasNewMessage = false;

    updateActiveSession((session) => {
      const localMessages = [...(session.messages || [])];
      const existingFingerprints = new Set(localMessages.map(buildMessageFingerprint));

      const mappedServerMessages = serverMessages.map((msg) => {
        let sender = mapServerSenderToClient(msg.senderType);
        let text = msg.message || "";
        let time = formatServerTime(msg.createdAt || msg.sentAt);

        return {
          sender,
          text,
          time,
          responseType: "TEXT",
          products: [],
          metadata: {
            source: "server",
            senderType: msg.senderType || ""
          }
        };
      });

      mappedServerMessages.forEach((msg) => {
        const key = buildMessageFingerprint(msg);
        if (!existingFingerprints.has(key)) {
          localMessages.push(msg);
          existingFingerprints.add(key);
          hasNewMessage = true;
        }
      });

      return {
        ...session,
        messages: localMessages
      };
    });

    if (hasNewMessage) {
      renderActiveChat();
      renderHistoryList();
    }
  } catch (error) {
    console.error("Lỗi syncMessagesFromServer:", error);
  }
}