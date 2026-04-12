let allUsers = [];

document.addEventListener("DOMContentLoaded", async function () {
  const searchInput = document.getElementById("searchUser");
  const filterRole = document.getElementById("filterRole");

  if (searchInput) {
    searchInput.addEventListener("input", renderUsers);
  }

  if (filterRole) {
    filterRole.addEventListener("change", renderUsers);
  }

  await loadUsers();
});

async function loadUsers() {
  const tbody = document.getElementById("userTableBody");
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="5" class="empty-state">Đang tải dữ liệu người dùng...</td>
    </tr>
  `;

  try {
    const data = await apiFetch("/api/admin/users", {
      method: "GET"
    });

    allUsers = Array.isArray(data) ? data : [];
    renderUsers();
  } catch (error) {
    console.error("Lỗi load users:", error);
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">Không tải được danh sách người dùng.</td>
      </tr>
    `;
  }
}

function renderUsers() {
  const tbody = document.getElementById("userTableBody");
  const searchInput = document.getElementById("searchUser");
  const filterRole = document.getElementById("filterRole");

  if (!tbody) return;

  const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const selectedRole = filterRole ? filterRole.value : "ALL";

  const filteredUsers = allUsers.filter(function (user) {
    const username = (user.username || "").toLowerCase();
    const role = user.role || "CUSTOMER";

    const matchKeyword = username.includes(keyword);
    const matchRole = selectedRole === "ALL" || role === selectedRole;

    return matchKeyword && matchRole;
  });

  tbody.innerHTML = "";

  if (filteredUsers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">Không tìm thấy người dùng phù hợp.</td>
      </tr>
    `;
    return;
  }

  filteredUsers.forEach(function (user) {
    const role = user.role || "CUSTOMER";
    const roleClass =
      role === "ADMIN" ? "role-admin" :
      role === "STAFF" ? "role-staff" :
      "role-customer";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(user.username || "")}</td>
      <td>${escapeHtml(maskEmail(user.email || ""))}</td>
      <td><span class="role-badge ${roleClass}">${escapeHtml(role)}</span></td>
      <td>${formatDateTime(user.createdAt)}</td>
      <td>${formatDateTime(user.updatedAt)}</td>
    `;

    tbody.appendChild(tr);
  });
}

function maskEmail(email) {
  if (!email || !email.includes("@")) return "";

  const parts = email.split("@");
  const localPart = parts[0];
  const domain = parts[1];

  if (localPart.length <= 5) {
    return `${localPart.slice(0, 2)}*******@${domain}`;
  }

  const firstTwo = localPart.slice(0, 2);
  const lastThree = localPart.slice(-3);

  return `${firstTwo}*******${lastThree}@${domain}`;
}

function formatDateTime(dateTimeString) {
  if (!dateTimeString) return "";

  const date = new Date(dateTimeString);
  if (isNaN(date.getTime())) return "";

  const pad = (num) => String(num).padStart(2, "0");

  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();

  return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}