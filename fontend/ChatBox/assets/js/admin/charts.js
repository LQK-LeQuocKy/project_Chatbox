let usersRoleChartInstance = null;
let conversationStatusChartInstance = null;
let scriptsCategoryChartInstance = null;

document.addEventListener("DOMContentLoaded", async function () {
  await loadChartsData();
});

async function loadChartsData() {
  try {
    const data = await apiFetch("/api/admin/charts", {
      method: "GET"
    });

    console.log("Charts API data:", data);

    document.getElementById("chartTotalUsers").textContent = data.totalUsers ?? 0;
    document.getElementById("chartTotalScripts").textContent = data.totalScripts ?? 0;
    document.getElementById("chartTotalConversations").textContent = data.totalConversations ?? 0;
    document.getElementById("chartPendingConversations").textContent = data.pendingConversations ?? 0;

    renderUsersRoleChart(data.usersByRole || []);
    renderConversationStatusChart(data.conversationsByStatus || []);
    renderScriptsCategoryChart(data.scriptsByCategory || []);
  } catch (error) {
    console.error("Lỗi load biểu đồ:", error);
  }
}

function normalizeChartItems(items) {
  if (!Array.isArray(items)) return [];

  return items.map(function (item) {
    let rawLabel = item.label ?? item.name ?? item.role ?? item.status ?? "Không rõ";

    if (rawLabel === "PENDING") rawLabel = "Cần trả lời";
    if (rawLabel === "DONE") rawLabel = "Đã xử lý";

    return {
      label: rawLabel,
      value: Number(item.value ?? item.count ?? 0)
    };
  });
}

function renderUsersRoleChart(items) {
  const ctx = document.getElementById("usersRoleChart");
  if (!ctx) return;

  const normalizedItems = normalizeChartItems(items);

  if (usersRoleChartInstance) {
    usersRoleChartInstance.destroy();
  }

  usersRoleChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: normalizedItems.map(item => item.label),
      datasets: [{
        label: "Người dùng theo role",
        data: normalizedItems.map(item => item.value),
        backgroundColor: [
          "#111827",
          "#2563eb",
          "#10b981",
          "#f59e0b",
          "#ef4444"
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}

function renderConversationStatusChart(items) {
  const ctx = document.getElementById("conversationStatusChart");
  if (!ctx) return;

  const normalizedItems = normalizeChartItems(items);

  if (conversationStatusChartInstance) {
    conversationStatusChartInstance.destroy();
  }

  conversationStatusChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: normalizedItems.map(item => item.label),
      datasets: [{
        label: "Trạng thái hội thoại",
        data: normalizedItems.map(item => item.value),
        backgroundColor: [
          "#f59e0b",
          "#10b981",
          "#3b82f6",
          "#ef4444",
          "#8b5cf6",
          "#6b7280"
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}

function renderScriptsCategoryChart(items) {
  const ctx = document.getElementById("scriptsCategoryChart");
  if (!ctx) return;

  const normalizedItems = normalizeChartItems(items);

  if (scriptsCategoryChartInstance) {
    scriptsCategoryChartInstance.destroy();
  }

  scriptsCategoryChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: normalizedItems.map(item => item.label),
      datasets: [{
        label: "Số lượng kịch bản",
        data: normalizedItems.map(item => item.value),
        backgroundColor: [
          "#111827",
          "#2563eb",
          "#10b981",
          "#f59e0b",
          "#ef4444",
          "#8b5cf6",
          "#14b8a6",
          "#6b7280"
        ],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}