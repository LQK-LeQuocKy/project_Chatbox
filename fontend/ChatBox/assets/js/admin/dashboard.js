document.addEventListener("DOMContentLoaded", async function () {
  renderAdminInfo();
  await renderDashboardStats();
});

async function renderDashboardStats() {
  const totalUsersEl = document.getElementById("totalUsers");
  const totalScriptsEl = document.getElementById("totalScripts");
  const todayConversationsEl = document.getElementById("todayConversations");
  const pendingRepliesEl = document.getElementById("pendingReplies");

  try {
    const currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};
    const token = localStorage.getItem("accessToken") || currentUser.accessToken;

    if (!token) {
      throw new Error("Không tìm thấy token đăng nhập");
    }

    const response = await fetch("http://localhost:8081/api/admin/dashboard/stats", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      throw new Error("Bạn chưa đăng nhập hoặc token đã hết hạn");
    }

    if (!response.ok) {
      throw new Error("Không thể tải thống kê dashboard");
    }

    const data = await response.json();
    console.log("dashboard stats data =", data);

    if (totalUsersEl) totalUsersEl.textContent = data.totalUsers ?? 0;
    if (totalScriptsEl) totalScriptsEl.textContent = data.totalScripts ?? 0;
    if (todayConversationsEl) todayConversationsEl.textContent = data.todayConversations ?? 0;
    if (pendingRepliesEl) pendingRepliesEl.textContent = data.pendingReplies ?? 0;

  } catch (error) {
    console.error("Lỗi load dashboard stats:", error);

    if (totalUsersEl) totalUsersEl.textContent = "0";
    if (totalScriptsEl) totalScriptsEl.textContent = "0";
    if (todayConversationsEl) todayConversationsEl.textContent = "0";
    if (pendingRepliesEl) pendingRepliesEl.textContent = "0";
  }
}

function renderAdminInfo() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};

  const adminNameEl = document.getElementById("adminName");
  const adminRoleEl = document.getElementById("adminRole");
  const infoAdminUsernameEl = document.getElementById("infoAdminUsername");

  if (adminNameEl) {
    adminNameEl.textContent = currentUser.fullName || currentUser.username || "admin";
  }

  if (adminRoleEl) {
    adminRoleEl.textContent = currentUser.role || "ADMIN";
  }

  if (infoAdminUsernameEl) {
    infoAdminUsernameEl.textContent = currentUser.username || "admin";
  }
}