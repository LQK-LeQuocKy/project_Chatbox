let allConversations = [];

document.addEventListener("DOMContentLoaded", async function () {
  initConversationFilters();
  await loadConversationStats();
  await loadConversations();
});

function initConversationFilters() {
  const searchInput = document.getElementById("searchConversation");
  const filterStatus = document.getElementById("filterConversationStatus");

  if (searchInput) {
    searchInput.addEventListener("input", renderConversations);
  }

  if (filterStatus) {
    filterStatus.addEventListener("change", renderConversations);
  }
}

async function loadConversationStats() {
  try {
    const data = await apiFetch("/api/admin/conversations/stats", {
      method: "GET"
    });

    const totalEl = document.getElementById("conversationTotal");
    const todayEl = document.getElementById("conversationToday");
    const pendingEl = document.getElementById("conversationPending");

    if (totalEl) totalEl.textContent = data.total ?? 0;
    if (todayEl) todayEl.textContent = data.today ?? 0;
    if (pendingEl) pendingEl.textContent = data.pending ?? 0;
  } catch (error) {
    console.error("Lỗi loadConversationStats:", error);
  }
}

async function loadConversations() {
  const listEl = document.getElementById("conversationList");
  if (listEl) {
    listEl.innerHTML = `<div class="empty-box">Đang tải danh sách hội thoại...</div>`;
  }

  try {
    const data = await apiFetch("/api/admin/conversations", {
      method: "GET"
    });

    allConversations = Array.isArray(data) ? data : [];
    renderConversations();
  } catch (error) {
    console.error("Lỗi loadConversations:", error);
    if (listEl) {
      listEl.innerHTML = `<div class="empty-box">Không tải được danh sách hội thoại.</div>`;
    }
  }
}

function renderConversations() {
  const listEl = document.getElementById("conversationList");
  const searchInput = document.getElementById("searchConversation");
  const filterStatus = document.getElementById("filterConversationStatus");

  if (!listEl) return;

  const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const selectedStatus = filterStatus ? filterStatus.value.toLowerCase() : "all";

  const filteredConversations = allConversations.filter(function (item) {
    const sessionCode = (item.sessionCode || "").toLowerCase();
    const question = (item.customerQuestion || "").toLowerCase();
    const status = (item.status || "").toLowerCase();

    const matchKeyword =
      sessionCode.includes(keyword) || question.includes(keyword);

    const matchStatus =
      selectedStatus === "all" || status === selectedStatus;

    return matchKeyword && matchStatus;
  });

  listEl.innerHTML = "";

  if (filteredConversations.length === 0) {
    listEl.innerHTML = `<div class="empty-box">Chưa có hội thoại nào.</div>`;
    return;
  }

  filteredConversations.forEach(function (item) {
    const card = document.createElement("div");
    card.className = "conversation-card";

    const status = (item.status || "PENDING").toLowerCase();
    const statusClass = status === "done" ? "status-done" : "status-pending";
    const statusText = status === "done" ? "Đã xử lý" : "Cần trả lời";

    card.innerHTML = `
      <div class="conversation-top">
        <div>
          <div class="conversation-customer">Phiên chat: ${escapeHtml(item.sessionCode || "Không rõ")}</div>
          <div class="conversation-meta">
            <span class="time-badge">${escapeHtml(formatDateTime(item.createdAt))}</span>
            <span class="status-badge ${statusClass}">${statusText}</span>
          </div>
        </div>
      </div>

      <div class="conversation-preview">${escapeHtml(item.customerQuestion || "")}</div>

      <div class="conversation-actions">
        <button class="action-btn btn-role" onclick="toggleConversationStatus(${item.conversationId})">
          Đổi trạng thái
        </button>
        <button class="action-btn btn-delete" onclick="deleteConversation(${item.conversationId})">
          Xóa
        </button>
      </div>
    `;

    listEl.appendChild(card);
  });
}

async function toggleConversationStatus(conversationId) {
  try {
    await apiFetch(`/api/admin/conversations/${conversationId}/toggle-status`, {
      method: "PUT"
    });

    await loadConversationStats();
    await loadConversations();
  } catch (error) {
    console.error("Lỗi toggleConversationStatus:", error);
    alert("Không đổi được trạng thái hội thoại.");
  }
}

async function deleteConversation(conversationId) {
  const confirmed = confirm("Bạn có chắc muốn xóa hội thoại này?");
  if (!confirmed) return;

  try {
    await apiFetch(`/api/admin/conversations/${conversationId}`, {
      method: "DELETE"
    });

    await loadConversationStats();
    await loadConversations();
  } catch (error) {
    console.error("Lỗi deleteConversation:", error);
    alert("Không xóa được hội thoại.");
  }
}

function formatDateTime(value) {
  if (!value) return "Không rõ thời gian";

  const date = new Date(value);
  if (isNaN(date.getTime())) return "Không rõ thời gian";

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${hours}:${minutes} ${day}/${month}/${year}`;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}