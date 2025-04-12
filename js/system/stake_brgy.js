import { backendURL, errorNotification, logout } from "../utils/utils.js";

// Logout Button
const btn_logout = document.getElementById("btn_logout");
if (btn_logout) {
  btn_logout.addEventListener("click", logout);
}

/** ✅ Fetch and Load Data on Page Load */
document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const barangay = urlParams.get("barangay"); // ✅ Change to barangay instead of municipality

  if (!barangay) {
    errorNotification("Barangay is required in the URL.");
    console.error("❌ Missing URL parameter: Barangay");
    return;
  }

  console.log(`📍 Fetching data for barangay: ${barangay}`);
  await fetchBarangayReport(barangay);
});

/** ✅ Fetch Barangay Report */
async function fetchBarangayReport(barangay) {
  try {
    const response = await fetch(
      `${backendURL}/api/stakeholder/brgy-report/${barangay}`, // ✅ Change to barangay-level API endpoint
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status} - Failed to fetch barangay report.`
      );
    }

    const data = await response.json();
    console.log("📊 API Response:", data);

    if (!data.success) {
      throw new Error("Failed to retrieve data.");
    }

    displayBarangayDemographics(data);
  } catch (error) {
    console.error("❌ Error fetching barangay data:", error);
    errorNotification("Failed to load barangay demographic data.");
  }
}

/** ✅ Display Barangay Demographics */
function displayBarangayDemographics(data) {
  console.log("📊 Debugging - Barangay Data:", data);

  const barangayEl = document.getElementById("barangay-name");
  if (barangayEl) barangayEl.innerText = data.barangay || "Unknown";

  const municipalityEl = document.getElementById("municipality-name");
  if (municipalityEl) municipalityEl.innerText = data.municipality || "Unknown";

  const provinceEl = document.getElementById("province-name");
  if (provinceEl) provinceEl.innerText = data.province || "Unknown";

  const totalPopulationEl = document.getElementById("totalPopulation");
  if (totalPopulationEl)
    totalPopulationEl.innerText = data.totalPopulation || 0;

  // ✅ Gender Distribution
  document.getElementById("maleCount").innerText =
    data.genderDistribution?.Male || 0;
  document.getElementById("femaleCount").innerText =
    data.genderDistribution?.Female || 0;

  // ✅ Ensure BMI data exists before updating the UI
  const bmiData = data.bmiData || {};
  document.getElementById("underweightCount").innerText =
    bmiData.Underweight || 0;
  document.getElementById("normalCount").innerText = bmiData.Normal || 0;
  document.getElementById("overweightCount").innerText =
    bmiData.Overweight || 0;
  document.getElementById("obeseCount").innerText = bmiData.Obese || 0;

  // ✅ Render Charts
  renderBmiChart(data.bmiData || {});
  renderListChart("medicineChart", "Citizen Availed", data.medicineData || []);
  renderListChart("serviceChart", "Citizen Availed", data.serviceData || []);
}

/** ✅ Render BMI Chart */
function renderBmiChart(bmiData) {
  console.log("📊 Debugging - BMI Data for Chart:", bmiData);

  const canvas = document.getElementById("bmiChart");
  if (!canvas) return console.warn("⚠️ BMI Chart canvas not found.");

  if (!bmiData || Object.keys(bmiData).length === 0) {
    console.warn("⚠️ No data available for BMI, skipping chart.");
    canvas.parentNode.innerHTML =
      "<p class='text-center text-muted'>No BMI data available</p>";
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
          title: {
            display: true,
            text: "Number of Citizens",
          },
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

/** ✅ Render List Charts */
function renderListChart(canvasId, label, dataList) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.warn(`⚠️ Skipping chart: ${canvasId} not found`);
    return;
  }

  const ctx = canvas.getContext("2d");

  if (window[canvasId] instanceof Chart) {
    window[canvasId].destroy();
  }

  if (!Array.isArray(dataList) || dataList.length === 0) {
    console.warn(`⚠️ No data available for ${label}, skipping chart.`);
    canvas.parentNode.innerHTML = `<p class='text-center text-muted'>No data available</p>`;
    return;
  }

  const labels = dataList.map(
    (item) => item.medicine_name || item.service_name || "Unknown"
  );
  const values = dataList.map((item) => item.total_availed || 0);

  window[canvasId] = new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          label: label,
          data: values,
          backgroundColor: ["#063E4F", "#F4A261", "#E76F51", "#2A9D8F"],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}
