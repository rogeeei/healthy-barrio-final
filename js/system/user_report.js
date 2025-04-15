import {
  backendURL,
  errorNotification,
  showNavAdminPages,
  logout,
} from "../utils/utils.js";

showNavAdminPages();

// Logout Button
const btn_logout = document.getElementById("btn_logout");
if (btn_logout) {
  btn_logout.addEventListener("click", logout);
}

/** ✅ Fetch and Load Barangay Report */
async function fetchBarangayReport() {
  try {
    const response = await fetch(`${backendURL}/api/citizen-report`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok)
      throw new Error(`HTTP ${response.status} - Failed to fetch report data`);

    const data = await response.json();
    console.log("📊 API Response:", data);

    if (!data.success) {
      throw new Error(data.error || "Failed to load report data.");
    }

    displayReport(data);
  } catch (error) {
    console.error("Error fetching report data:", error);
    errorNotification("Failed to load barangay report.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  fetchBarangayReport();

  const medicineCard = document.getElementById("medicine_availment_card");
  if (medicineCard) {
    medicineCard.style.cursor = "pointer"; // optional: show pointer cursor
    medicineCard.addEventListener("click", () => {
      window.location.href = "medicine_availment.html";
    });
  }
});

/** ✅ Display Report Data */
function displayReport(data) {
  document.getElementById("totalPopulation").textContent =
    data.totalPopulation || 0;
  document.getElementById("maleCount").textContent =
    data.genderDistribution?.Male || 0;
  document.getElementById("femaleCount").textContent =
    data.genderDistribution?.Female || 0;

  // ✅ BMI Classification
  document.getElementById("underweightCount").textContent =
    data.bmiData?.Underweight || 0;
  document.getElementById("normalCount").textContent =
    data.bmiData?.Normal || 0;
  document.getElementById("overweightCount").textContent =
    data.bmiData?.Overweight || 0;
  document.getElementById("obeseCount").textContent = data.bmiData?.Obese || 0;

  renderBmiChart(data.bmiData || {});
  renderChart("medicineChart", "Medicine Availment", data.medicineData || []);
  renderChart("serviceChart", "Service Availment", data.serviceData || []);
}

/** ✅ Render Chart */
function renderChart(canvasId, label, dataset) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.warn(`⚠️ Skipping chart: ${canvasId} not found`);
    return;
  }

  const ctx = canvas.getContext("2d");

  if (window[canvasId] instanceof Chart) {
    window[canvasId].destroy();
  }

  if (!Array.isArray(dataset) || dataset.length === 0) {
    console.warn(`⚠️ No data available for ${label}, skipping chart.`);
    return;
  }

  window[canvasId] = new Chart(ctx, {
    type: "pie",
    data: {
      labels: dataset.map(
        (item) => item.medicine_name || item.service_name || "Unknown"
      ),
      datasets: [
        {
          label: label,
          data: dataset.map((item) => item.total_availed || 0),
          backgroundColor: ["#063e4f", "#28a745", "#ffc107", "#dc3545"],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } },
    },
  });
}

/** ✅ Render BMI Chart */
function renderBmiChart(bmiData) {
  console.log("📊 Debugging - BMI Data for Chart:", bmiData);

  if (!bmiData || Object.keys(bmiData).length === 0) {
    console.warn("⚠️ No data available for BMI, skipping chart.");
    document.getElementById("bmiChart").parentNode.innerHTML =
      "<p class='text-center text-muted'>No BMI data available</p>";
    return;
  }

  const canvas = document.getElementById("bmiChart");
  if (!canvas) {
    console.warn("⚠️ Canvas element for BMI chart not found.");
    return;
  }

  const ctx = canvas.getContext("2d");

  if (window.bmiChartInstance instanceof Chart) {
    window.bmiChartInstance.destroy();
  }

  const labels = Object.keys(bmiData);
  const values = Object.values(bmiData);

  window.bmiChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Number of Citizens",
          data: values,
          backgroundColor: ["#1E90FF", "#32CD32", "#FFD700", "#FF4500"],
          borderColor: "#333",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Number of Citizens" },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (tooltipItem) => ` ${tooltipItem.raw} citizen(s)`,
          },
        },
      },
    },
  });
}
