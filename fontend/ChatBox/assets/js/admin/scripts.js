const API_BASE = "http://localhost:8081/api";

let allScripts = [];
let pendingOverwritePayload = null;
let pendingOverwriteId = null;

document.addEventListener("DOMContentLoaded", async () => {
  bindScriptEvents();
  await loadScripts();
});

function bindScriptEvents() {
  const form = document.getElementById("scriptForm");
  const resetBtn = document.getElementById("resetScriptFormBtn");
  const searchInput = document.getElementById("searchScript");
  const filterStatus = document.getElementById("filterScriptStatus");
  const confirmBtn = document.getElementById("confirmDuplicateBtn");
  const cancelBtn = document.getElementById("cancelDuplicateBtn");

  form?.addEventListener("submit", submitScriptForm);
  resetBtn?.addEventListener("click", resetScriptForm);
  searchInput?.addEventListener("input", filterScripts);
  filterStatus?.addEventListener("change", filterScripts);
  confirmBtn?.addEventListener("click", confirmOverwriteScenario);
  cancelBtn?.addEventListener("click", closeDuplicateModal);
}

async function loadScripts() {
  const listBox = document.getElementById("scriptList");
  if (listBox) {
    listBox.innerHTML = `<div class="empty-state">Đang tải danh sách kịch bản...</div>`;
  }

  try {
    const data = await apiFetch("/api/admin/chatbot-scenarios", {
      method: "GET"
    });

    if (!Array.isArray(data)) {
      console.error("Dữ liệu trả về không phải mảng:", data);
      if (listBox) {
        listBox.innerHTML = `<div class="empty-state">Dữ liệu kịch bản không hợp lệ.</div>`;
      }
      return;
    }

    allScripts = data;
    renderScriptList(allScripts);
  } catch (err) {
    console.error("Lỗi loadScripts:", err);
    if (listBox) {
      listBox.innerHTML = `<div class="empty-state">Không tải được danh sách kịch bản.</div>`;
    }
  }
}

function renderScriptList(list) {
  const box = document.getElementById("scriptList");
  if (!box) return;

  if (!Array.isArray(list)) {
    box.innerHTML = `<div class="empty-state">Dữ liệu không hợp lệ.</div>`;
    return;
  }

  if (list.length === 0) {
    box.innerHTML = `<div class="empty-state">Chưa có kịch bản nào.</div>`;
    return;
  }

  box.innerHTML = list.map(script => `
    <div class="script-item">
      <div class="script-item-top">
        <div class="script-item-content">
          <h3>${escapeHtml(script.title || "Không có tiêu đề")}</h3>
          <p><strong>Mẫu câu hỏi:</strong> ${escapeHtml(script.questionPattern || "")}</p>
          <p><strong>Từ khóa:</strong> ${escapeHtml(script.keywords || "")}</p>
          <p>
            <strong>Loại:</strong> ${escapeHtml(script.scenarioType || "TEXT")}
            |
            <strong>Phạm vi:</strong> ${escapeHtml(script.scopeType || "GENERAL")}
          </p>
          <p>
            <strong>Trạng thái:</strong>
            ${script.active ? "Đang hoạt động" : "Đã tắt"}
          </p>
        </div>

        <div class="script-actions">
          <button type="button" class="secondary-btn" onclick="editScript(${script.id})">Sửa</button>
          <button type="button" class="danger-btn" onclick="deleteScript(${script.id})">Xóa</button>
        </div>
      </div>

      <div class="script-answer-preview">
        ${escapeHtml(script.answer || "")}
      </div>
    </div>
  `).join("");
}

function filterScripts() {
  const keyword = (document.getElementById("searchScript")?.value || "").toLowerCase().trim();
  const status = document.getElementById("filterScriptStatus")?.value || "ALL";

  let filtered = [...allScripts];

  if (keyword) {
    filtered = filtered.filter(item =>
      (item.title || "").toLowerCase().includes(keyword) ||
      (item.questionPattern || "").toLowerCase().includes(keyword) ||
      (item.keywords || "").toLowerCase().includes(keyword) ||
      (item.answer || "").toLowerCase().includes(keyword)
    );
  }

  if (status === "ACTIVE") {
    filtered = filtered.filter(item => item.active === true);
  } else if (status === "INACTIVE") {
    filtered = filtered.filter(item => item.active === false);
  }

  renderScriptList(filtered);
}

function editScript(id) {
  const script = allScripts.find(item => item.id === id);
  if (!script) {
    alert("Không tìm thấy kịch bản cần sửa.");
    return;
  }

  document.getElementById("scriptId").value = script.id ?? "";
  document.getElementById("scriptTitle").value = script.title ?? "";
  document.getElementById("scriptPattern").value = script.questionPattern ?? "";
  document.getElementById("scriptKeywords").value = script.keywords ?? "";
  document.getElementById("scriptAnswer").value = script.answer ?? "";
  document.getElementById("scriptScenarioType").value = script.scenarioType || "TEXT";
  document.getElementById("scriptScopeType").value = script.scopeType || "GENERAL";
  document.getElementById("scriptActive").checked = !!script.active;

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function resetScriptForm() {
  const form = document.getElementById("scriptForm");
  if (form) form.reset();

  document.getElementById("scriptId").value = "";
  document.getElementById("scriptScenarioType").value = "TEXT";
  document.getElementById("scriptScopeType").value = "GENERAL";
  document.getElementById("scriptActive").checked = true;
}

async function submitScriptForm(e) {
  e.preventDefault();

  const id = document.getElementById("scriptId").value.trim();
  const title = document.getElementById("scriptTitle").value.trim();
  const questionPattern = document.getElementById("scriptPattern").value.trim();
  const keywords = document.getElementById("scriptKeywords").value.trim();
  const answer = document.getElementById("scriptAnswer").value.trim();

  if (!title) {
    alert("Vui lòng nhập tiêu đề kịch bản.");
    return;
  }

  if (!questionPattern) {
    alert("Vui lòng nhập mẫu câu hỏi.");
    return;
  }

  if (!answer) {
    alert("Vui lòng nhập câu trả lời.");
    return;
  }

  const payload = {
    title,
    questionPattern,
    keywords,
    answer,
    scenarioType: document.getElementById("scriptScenarioType").value,
    scopeType: document.getElementById("scriptScopeType").value,
    active: document.getElementById("scriptActive").checked,
    overwrite: false
  };

  await saveScenario(payload, id);
}

async function saveScenario(payload, id = "") {
  try {
    const url = id
      ? `/api/admin/chatbot-scenarios/${id}`
      : "/api/admin/chatbot-scenarios";

    const method = id ? "PUT" : "POST";

    const data = await apiFetch(url, {
      method,
      body: JSON.stringify(payload)
    });

    if (data?.duplicated) {
      pendingOverwritePayload = { ...payload, overwrite: true };
      pendingOverwriteId = id;
      openDuplicateModal(
        data.message || "Kịch bản này đã có rồi. Bạn có muốn thêm này vào không?"
      );
      return;
    }

    if (data && data.success === false) {
      alert(data.message || "Lưu kịch bản thất bại.");
      return;
    }

    alert(data?.message || "Lưu kịch bản thành công!");
    resetScriptForm();
    await loadScripts();
  } catch (err) {
    console.error("Lỗi saveScenario:", err);
    alert("Có lỗi xảy ra khi lưu kịch bản.");
  }
}

async function deleteScript(id) {
  if (!confirm("Bạn có chắc muốn xóa kịch bản này không?")) return;

  try {
    await apiFetch(`/api/admin/chatbot-scenarios/${id}`, {
      method: "DELETE"
    });

    alert("Đã xóa kịch bản!");
    await loadScripts();
  } catch (err) {
    console.error("Lỗi deleteScript:", err);
    alert("Có lỗi khi xóa kịch bản.");
  }
}

function openDuplicateModal(message) {
  const modal = document.getElementById("duplicateModal");
  const text = document.getElementById("duplicateModalMessage");

  if (text) {
    text.textContent = message;
  }

  modal?.classList.remove("hidden");
}

function closeDuplicateModal() {
  document.getElementById("duplicateModal")?.classList.add("hidden");
  pendingOverwritePayload = null;
  pendingOverwriteId = null;
}

async function confirmOverwriteScenario() {
  if (!pendingOverwritePayload) return;

  const payload = { ...pendingOverwritePayload };
  const id = pendingOverwriteId;

  closeDuplicateModal();
  await saveScenario(payload, id);
}

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}