document.addEventListener("DOMContentLoaded", function () {
  applySavedTheme();
  setupThemeToggle();
  updateAuthUI();
  setupLogout();
});

function applySavedTheme() {
  const savedTheme = localStorage.getItem("themeMode");

  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }

  updateThemeIcon();
}

function setupThemeToggle() {
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  if (!themeToggleBtn) return;

  themeToggleBtn.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");

    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("themeMode", isDark ? "dark" : "light");

    updateThemeIcon();
  });
}

function updateThemeIcon() {
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  if (!themeToggleBtn) return;

  themeToggleBtn.textContent = document.body.classList.contains("dark-mode")
    ? "☀"
    : "🌙";
}

function updateAuthUI() {
  const loginNav = document.getElementById("loginNav");
  const logoutBtn = document.getElementById("logoutBtn");
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  if (currentUser) {
    if (loginNav) {
      loginNav.textContent = currentUser.username;
      loginNav.href = "#";
    }
    if (logoutBtn) {
      logoutBtn.classList.remove("hidden");
    }
  } else {
    if (loginNav) {
      loginNav.textContent = "Đăng nhập";
      loginNav.href = "DangNhap.html";
    }
  }
}

function setupLogout() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", function () {
    localStorage.removeItem("currentUser");
    window.location.href = "DangNhap.html";
  });
}

function formatPrice(price) {
  return price.toLocaleString("vi-VN") + "đ";
}