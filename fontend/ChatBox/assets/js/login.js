

document.addEventListener("DOMContentLoaded", function () {
  initTabs();
  initLogin();
  initRegister();
  initTogglePasswords();
  loadRememberedUsername();
  redirectIfAlreadyLoggedIn();
});

const API_BASE_URL = "http://localhost:8081";

function initTabs() {
  const tabLogin = document.getElementById("tabLogin");
  const tabRegister = document.getElementById("tabRegister");
  const loginFormWrap = document.getElementById("loginFormWrap");
  const registerFormWrap = document.getElementById("registerFormWrap");
  const loginMessage = document.getElementById("loginMessage");
  const registerMessage = document.getElementById("registerMessage");

  if (!tabLogin || !tabRegister || !loginFormWrap || !registerFormWrap) return;

  tabLogin.addEventListener("click", function () {
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    loginFormWrap.classList.add("active");
    registerFormWrap.classList.remove("active");
    clearMessage(loginMessage);
    clearMessage(registerMessage);
  });

  tabRegister.addEventListener("click", function () {
    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");
    registerFormWrap.classList.add("active");
    loginFormWrap.classList.remove("active");
    clearMessage(loginMessage);
    clearMessage(registerMessage);
  });
}

function initLogin() {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const usernameInput = document.getElementById("loginUsername");
    const passwordInput = document.getElementById("loginPassword");
    const rememberMeInput = document.getElementById("rememberMe");
    const loginMessage = document.getElementById("loginMessage");

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      showMessage(loginMessage, "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.", "error");
      return;
    }

    try {
      showMessage(loginMessage, "Đang đăng nhập...", "success");

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: username,
          password: password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage(loginMessage, data.message || "Đăng nhập thất bại.", "error");
        return;
      }

      saveAuth(data);

      if (rememberMeInput.checked) {
        localStorage.setItem("rememberedUsername", username);
      } else {
        localStorage.removeItem("rememberedUsername");
      }

      showMessage(loginMessage, "Đăng nhập thành công. Đang chuyển hướng...", "success");

      setTimeout(function () {
        const roles = data.roles || [];

        if (roles.includes("ROLE_ADMIN") || roles.includes("ROLE_STAFF")) {
          window.location.href = "admin/dashboard.html";
        } else {
          window.location.href = "TrangChu.html";
        }
      }, 800);

    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      showMessage(loginMessage, "Không thể kết nối tới server backend.", "error");
    }
  });
}

function initRegister() {
  const registerForm = document.getElementById("registerForm");
  if (!registerForm) return;

  registerForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const fullNameInput = document.getElementById("registerFullName");
    const usernameInput = document.getElementById("registerUsername");
    const emailInput = document.getElementById("registerEmail");
    const phoneInput = document.getElementById("registerPhone");
    const passwordInput = document.getElementById("registerPassword");
    const confirmPasswordInput = document.getElementById("registerConfirmPassword");
    const registerMessage = document.getElementById("registerMessage");

    const fullName = fullNameInput ? fullNameInput.value.trim() : "";
    const username = usernameInput.value.trim();
    const email = emailInput ? emailInput.value.trim() : "";
    const phone = phoneInput ? phoneInput.value.trim() : "";
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    if (!fullName || !username || !password || !confirmPassword) {
      showMessage(registerMessage, "Vui lòng nhập đầy đủ thông tin đăng ký.", "error");
      return;
    }

    if (username.length < 3) {
      showMessage(registerMessage, "Tên đăng nhập phải có ít nhất 3 ký tự.", "error");
      return;
    }

    if (password.length < 6) {
      showMessage(registerMessage, "Mật khẩu phải có ít nhất 6 ký tự.", "error");
      return;
    }

    if (password !== confirmPassword) {
      showMessage(registerMessage, "Mật khẩu nhập lại không khớp.", "error");
      return;
    }

    try {
      showMessage(registerMessage, "Đang tạo tài khoản...", "success");

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: username,
          password: password,
          fullName: fullName,
          email: email,
          phone: phone
        })
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage(registerMessage, data.message || "Đăng ký thất bại.", "error");
        return;
      }

      registerForm.reset();
      showMessage(registerMessage, "Đăng ký thành công. Bạn có thể đăng nhập ngay.", "success");

      setTimeout(function () {
        const tabLogin = document.getElementById("tabLogin");
        const loginUsername = document.getElementById("loginUsername");

        if (tabLogin) {
          tabLogin.click();
        }

        if (loginUsername) {
          loginUsername.value = username;
        }
      }, 700);

    } catch (error) {
      console.error("Lỗi đăng ký:", error);
      showMessage(registerMessage, "Không thể kết nối tới server backend.", "error");
    }
  });
}

function initTogglePasswords() {
  setupPasswordToggle("loginPassword", "toggleLoginPassword");
  setupPasswordToggle("registerPassword", "toggleRegisterPassword");
  setupPasswordToggle("registerConfirmPassword", "toggleConfirmPassword");
}

function setupPasswordToggle(inputId, buttonId) {
  const input = document.getElementById(inputId);
  const button = document.getElementById(buttonId);

  if (!input || !button) return;

  button.addEventListener("click", function () {
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    button.textContent = isPassword ? "Ẩn" : "Hiện";
  });
}

function loadRememberedUsername() {
  const loginUsername = document.getElementById("loginUsername");
  const rememberMe = document.getElementById("rememberMe");

  if (!loginUsername || !rememberMe) return;

  const rememberedUsername = localStorage.getItem("rememberedUsername");

  if (rememberedUsername) {
    loginUsername.value = rememberedUsername;
    rememberMe.checked = true;
  }
}

function saveAuth(authData) {
  localStorage.setItem("accessToken", authData.token);
  localStorage.setItem("tokenType", authData.type || "Bearer");

  const currentUser = {
    userId: authData.userId,
    username: authData.username,
    fullName: authData.fullName,
    roles: authData.roles || []
  };

  localStorage.setItem("currentUser", JSON.stringify(currentUser));
}

function getToken() {
  return localStorage.getItem("accessToken");
}

function getCurrentUser() {
  const raw = localStorage.getItem("currentUser");
  return raw ? JSON.parse(raw) : null;
}

function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("tokenType");
  localStorage.removeItem("currentUser");
  window.location.href = "../DangNhap.html";
}

function redirectIfAlreadyLoggedIn() {
  const token = getToken();
  const currentUser = getCurrentUser();

  if (!token || !currentUser) return;

  const currentPath = window.location.pathname.toLowerCase();
  const isLoginPage = currentPath.includes("dangnhap") || currentPath.includes("login");

  if (!isLoginPage) return;

  const roles = currentUser.roles || [];
  if (roles.includes("ROLE_ADMIN") || roles.includes("ROLE_STAFF")) {
    window.location.href = "dashboard.html";
  } else {
    window.location.href = "TrangChu.html";
  }
}

function showMessage(element, message, type) {
  if (!element) return;
  element.textContent = message;
  element.style.color = type === "success" ? "#1b7a35" : "#d32f2f";
}

function clearMessage(element) {
  if (!element) return;
  element.textContent = "";
}