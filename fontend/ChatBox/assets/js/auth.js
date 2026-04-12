window.API_BASE_URL = "http://localhost:8081";

function authGetToken() {
  return localStorage.getItem("accessToken");
}

function authGetCurrentUser() {
  const raw = localStorage.getItem("currentUser");
  return raw ? JSON.parse(raw) : null;
}

function authGetRoles() {
  const user = authGetCurrentUser();
  return user?.roles || [];
}

function hasRole(roleName) {
  return authGetRoles().includes(roleName);
}

function isAdmin() {
  return hasRole("ROLE_ADMIN");
}

function isStaff() {
  return hasRole("ROLE_STAFF");
}

function isCustomer() {
  return hasRole("ROLE_CUSTOMER");
}

function isAdminOrStaff() {
  return isAdmin() || isStaff();
}

function authLogout(redirectPath = "../DangNhap.html") {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("tokenType");
  localStorage.removeItem("currentUser");
  window.location.href = redirectPath;
}

async function apiFetch(endpoint, options = {}) {
  const token = authGetToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${window.API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  let data;
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (response.status === 401) {
    alert("Phiên đăng nhập đã hết hạn hoặc bạn chưa đăng nhập.");
    authLogout();
    throw new Error("Unauthorized");
  }

  if (response.status === 403) {
    alert("Bạn không có quyền truy cập chức năng này.");
    throw new Error("Forbidden");
  }

  if (!response.ok) {
    const errorMessage = data?.message || "Có lỗi xảy ra khi gọi API.";
    throw new Error(errorMessage);
  }

  return data;
}

function requireLogin(redirectPath = "../DangNhap.html") {
  const token = authGetToken();
  const user = authGetCurrentUser();

  if (!token || !user) {
    window.location.href = redirectPath;
  }
}

function requireAdminOrStaff(redirectPath = "../DangNhap.html") {
  requireLogin(redirectPath);

  if (!isAdminOrStaff()) {
    alert("Bạn không có quyền vào trang quản trị.");
    window.location.href = redirectPath;
  }
}

function requireAdmin(redirectPath = "../DangNhap.html") {
  requireLogin(redirectPath);

  if (!isAdmin()) {
    alert("Chỉ admin mới có quyền truy cập.");
    window.location.href = redirectPath;
  }
}

function renderAdminInfo() {
  const user = authGetCurrentUser();

  const username = user?.username || user?.fullName || "admin";

  let role = "ADMIN";
  if (user?.roles?.includes("ROLE_ADMIN")) {
    role = "ADMIN";
  } else if (user?.roles?.includes("ROLE_STAFF")) {
    role = "STAFF";
  } else if (user?.roles?.includes("ROLE_CUSTOMER")) {
    role = "CUSTOMER";
  }

  const nameEl = document.getElementById("adminName");
  const roleEl = document.getElementById("adminRole");

  if (nameEl) nameEl.textContent = username;
  if (roleEl) roleEl.textContent = role;
}