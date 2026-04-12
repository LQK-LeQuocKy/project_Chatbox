let allReplyConversations = [];
let filteredReplyConversations = [];
let selectedConversationId = null;
let selectedConversation = null;

document.addEventListener("DOMContentLoaded", async function () {
  renderAdminInfo();
  initReplySearch();
  initReplyForm();
  await loadReplyConversations();
});

function initReplySearch() {
  const searchInput = document.getElementById("replySearchConversation");
  if (!searchInput) return;

  searchInput.addEventListener("input", function () {
    renderReplyConversationList();
  });
}

function initReplyForm() {
  const replyForm = document.getElementById("replyForm");
  const markDoneBtn = document.getElementById("markDoneBtn");

  if (replyForm) {
    replyForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      await submitAdminReply();
    });
  }

  if (markDoneBtn) {
    markDoneBtn.addEventListener("click", async function () {
      if (!selectedConversationId) return;
      await markConversationDone(selectedConversationId);
    });
  }
}

async function loadReplyConversations() {
  const listEl = document.getElementById("replyConversationList");
  const countEl = document.getElementById("replyConversationCount");

  if (listEl) {
    listEl.innerHTML = `<div class="empty-box">Đang tải danh sách hội thoại...</div>`;
  }

  try {
    const data = await apiFetch("/api/admin/replies/conversations", {
      method: "GET"
    });

    allReplyConversations = Array.isArray(data) ? data : [];
    filteredReplyConversations = [...allReplyConversations];

    if (countEl) {
      countEl.textContent = `${allReplyConversations.length} hội thoại`;
    }

    renderReplyConversationList();

    // Nếu đã chọn 1 hội thoại trước đó thì load lại
    if (selectedConversationId) {
      const stillExists = allReplyConversations.find(
        x => Number(x.conversationId) === Number(selectedConversationId)
      );

      if (stillExists) {
        await selectReplyConversation(stillExists.conversationId);
      } else {
        resetReplyChatBox();
      }
    }
  } catch (error) {
    console.error("Lỗi loadReplyConversations:", error);
    if (listEl) {
      listEl.innerHTML = `<div class="empty-box">Không tải được danh sách hội thoại.</div>`;
    }
  }
}

function renderReplyConversationList() {
  const listEl = document.getElementById("replyConversationList");
  const countEl = document.getElementById("replyConversationCount");
  const searchInput = document.getElementById("replySearchConversation");

  if (!listEl) return;

  const keyword = (searchInput?.value || "").trim().toLowerCase();

  filteredReplyConversations = allReplyConversations.filter(function (item) {
    const customerName = (item.customerName || "").toLowerCase();
    const username = (item.customerUsername || item.username || "").toLowerCase();
    const sessionCode = (item.sessionCode || "").toLowerCase();
    const lastMessage = (item.lastMessage || item.customerQuestion || "").toLowerCase();

    return (
      customerName.includes(keyword) ||
      username.includes(keyword) ||
      sessionCode.includes(keyword) ||
      lastMessage.includes(keyword)
    );
  });

  if (countEl) {
    countEl.textContent = `${filteredReplyConversations.length} hội thoại`;
  }

  listEl.innerHTML = "";

  if (!filteredReplyConversations.length) {
    listEl.innerHTML = `<div class="empty-box">Không tìm thấy hội thoại phù hợp.</div>`;
    return;
  }

  filteredReplyConversations.forEach(function (item) {
    const card = document.createElement("div");
    const isActive = Number(item.conversationId) === Number(selectedConversationId);
    const status = (item.status || "PENDING").toLowerCase();
    const statusText = status === "done" ? "Đã xử lý" : "Cần trả lời";
    const statusClass = status === "done" ? "status-done" : "status-pending";

    card.className = `reply-conversation-item ${isActive ? "active" : ""}`;
    card.innerHTML = `
      <div class="reply-conversation-top">
        <div class="reply-conversation-name">
          ${escapeHtml(item.customerUsername || item.username || item.customerName || "Khách hàng")}
        </div>
        <span class="status-badge ${statusClass}">${statusText}</span>
      </div>

      <div class="reply-conversation-meta">
        ${escapeHtml(item.sessionCode || "Không rõ phiên chat")}
      </div>

      <div class="reply-conversation-preview">
        ${escapeHtml(shortenText(item.lastMessage || item.customerQuestion || "Chưa có nội dung", 70))}
      </div>

      <div class="reply-conversation-time">
        ${escapeHtml(formatDateTime(item.updatedAt || item.createdAt))}
      </div>
    `;

    card.addEventListener("click", async function () {
      await selectReplyConversation(item.conversationId);
    });

    listEl.appendChild(card);
  });
}

async function selectReplyConversation(conversationId) {
  selectedConversationId = conversationId;

  const emptyEl = document.getElementById("replyChatEmpty");
  const chatBoxEl = document.getElementById("replyChatBox");
  const messagesEl = document.getElementById("replyMessages");
  const replyMessageEl = document.getElementById("replyMessage");

  if (emptyEl) emptyEl.classList.add("hidden");
  if (chatBoxEl) chatBoxEl.classList.remove("hidden");
  if (messagesEl) {
    messagesEl.innerHTML = `<div class="empty-box">Đang tải nội dung hội thoại...</div>`;
  }
  if (replyMessageEl) replyMessageEl.textContent = "";

  renderReplyConversationList();

  try {
    const detail = await apiFetch(`/api/admin/replies/conversations/${conversationId}`, {
      method: "GET"
    });

    console.log("reply conversations =", detail);

    selectedConversation = detail || null;
    renderReplyChatHeader(detail);
    renderReplyMessages(detail?.messages || []);
    renderReplyConversationList();
  } catch (error) {
    console.error("Lỗi selectReplyConversation:", error);
    if (messagesEl) {
      messagesEl.innerHTML = `<div class="empty-box">Không tải được nội dung hội thoại.</div>`;
    }
  }
}

function renderReplyChatHeader(detail) {
  const nameEl = document.getElementById("replyCustomerName");
  const metaEl = document.getElementById("replyConversationMeta");
  const badgeEl = document.getElementById("replyStatusBadge");

  const customerName = detail?.customerName || detail?.username || "Khách hàng";
  const sessionCode = detail?.sessionCode || "Không rõ phiên chat";
  const status = (detail?.status || "PENDING").toLowerCase();

  if (nameEl) {
    nameEl.textContent = customerName;
  }

  if (metaEl) {
    metaEl.textContent = `Phiên chat: ${sessionCode}`;
  }

  if (badgeEl) {
    badgeEl.textContent = status === "done" ? "Đã xử lý" : "Cần trả lời";
    badgeEl.className = `status-badge ${status === "done" ? "status-done" : "status-pending"}`;
  }
}

function renderReplyMessages(messages) {
  const messagesEl = document.getElementById("replyMessages");
  if (!messagesEl) return;

  if (!Array.isArray(messages) || messages.length === 0) {
    messagesEl.innerHTML = `<div class="empty-box">Hội thoại chưa có tin nhắn.</div>`;
    return;
  }

  messagesEl.innerHTML = messages.map(renderReplyMessageHtml).join("");
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function renderReplyMessageHtml(msg) {
  const senderType = String(msg.senderType || msg.sender || "").toUpperCase();

  let bubbleClass = "bot";
  let senderLabel = "Bot";

  if (senderType === "CUSTOMER" || senderType === "USER") {
    bubbleClass = "user";
    senderLabel = "Khách hàng";
  } else if (senderType === "ADMIN") {
    bubbleClass = "admin";
    senderLabel = "Admin";
  }

  return `
    <div class="reply-message ${bubbleClass}">
      <div class="reply-message-sender">${senderLabel}</div>
      <div class="reply-message-text">${escapeHtml(msg.message || msg.text || "")}</div>
      <div class="reply-message-time">${escapeHtml(formatDateTime(msg.sentAt || msg.createdAt || msg.time))}</div>
    </div>
  `;
}

async function submitAdminReply() {
  const inputEl = document.getElementById("replyInput");

  const text = (inputEl?.value || "").trim();
  if (!selectedConversationId) {
    showReplyMessage("Vui lòng chọn hội thoại trước.", "error");
    return;
  }

  if (!text) {
    showReplyMessage("Vui lòng nhập nội dung phản hồi.", "error");
    return;
  }

  try {
    await apiFetch(`/api/admin/replies/conversations/${selectedConversationId}/reply`, {
      method: "POST",
      body: JSON.stringify({
        reply: text
      }),
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (inputEl) inputEl.value = "";
    showReplyMessage("Gửi phản hồi thành công.", "success");

    await loadReplyConversations();
    await selectReplyConversation(selectedConversationId);
  } catch (error) {
    console.error("Lỗi submitAdminReply:", error);
    showReplyMessage("Không gửi được phản hồi cho khách hàng.", "error");
  }
}

async function markConversationDone(conversationId) {
  try {
    await apiFetch(`/api/admin/conversations/${conversationId}/toggle-status`, {
      method: "PUT"
    });

    showReplyMessage("Đã cập nhật trạng thái hội thoại.", "success");

    await loadReplyConversations();

    const stillExists = allReplyConversations.find(
      x => Number(x.conversationId) === Number(conversationId)
    );

    if (stillExists) {
      await selectReplyConversation(conversationId);
    } else {
      resetReplyChatBox();
    }
  } catch (error) {
    console.error("Lỗi markConversationDone:", error);
    showReplyMessage("Không cập nhật được trạng thái hội thoại.", "error");
  }
}

function resetReplyChatBox() {
  selectedConversationId = null;
  selectedConversation = null;

  const emptyEl = document.getElementById("replyChatEmpty");
  const chatBoxEl = document.getElementById("replyChatBox");
  const messagesEl = document.getElementById("replyMessages");
  const inputEl = document.getElementById("replyInput");
  const messageEl = document.getElementById("replyMessage");

  if (emptyEl) emptyEl.classList.remove("hidden");
  if (chatBoxEl) chatBoxEl.classList.add("hidden");
  if (messagesEl) messagesEl.innerHTML = "";
  if (inputEl) inputEl.value = "";
  if (messageEl) messageEl.textContent = "";

  renderReplyConversationList();
}

function showReplyMessage(message, type) {
  const el = document.getElementById("replyMessage");
  if (!el) return;

  el.textContent = message;
  el.style.color = type === "success" ? "#198c44" : "#d63e40";
}

function shortenText(text, maxLength) {
  const value = String(text || "");
  return value.length > maxLength ? value.slice(0, maxLength) + "..." : value;
}

function formatDateTime(value) {
  if (!value) return "Không rõ thời gian";

  const date = new Date(value);
  if (isNaN(date.getTime())) return String(value);

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${hours}:${minutes} ${day}/${month}/${year}`;
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}