import {
  backendURL,
  showNavAdminPages,
  errorNotification,
  logout,
  hideBarangayForSuperAdmin,
} from "../utils/utils.js";

showNavAdminPages();
hideBarangayForSuperAdmin();
// Logout Button
const btn_logout = document.getElementById("btn_logout");
if (btn_logout) {
  btn_logout.addEventListener("click", logout);
}
/** ✅ Fetch and Load Barangay Data on Page Load */
document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const province = urlParams.get("province");
  const municipality = urlParams.get("municipality");
  const barangay = urlParams.get("barangay");

  if (!province || !municipality || !barangay) {
    errorNotification(
      "Province, municipality, and barangay are required in the URL."
    );
    console.error(
      "Missing URL parameters: Province, Municipality, or Barangay"
    );
    return;
  }

  console.log(
    `📍 Fetching data for: ${province}, ${municipality}, ${barangay}`
  );

  await fetchBarangayReport(province, municipality, barangay);
});

/** ✅ Fetch Barangay Report */
async function fetchBarangayReport(province, municipality, barangay) {
  try {
    const response = await fetch(
      `${backendURL}/api/barangay-report/${encodeURIComponent(
        province
      )}/${encodeURIComponent(municipality)}/${encodeURIComponent(barangay)}`,
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

    displayBarangayDemographics(province, municipality, barangay, data);
  } catch (error) {
    console.error("❌ Error fetching barangay data:", error);
    errorNotification("Failed to load barangay demographic data.");
  }
}

/** ✅ Display Barangay Demographic Data */
function displayBarangayDemographics(province, municipality, barangay, data) {
  document.getElementById("municipality-name").innerText = barangay;

  // ✅ Total Population
  document.getElementById("totalPopulation").innerText =
    data.totalPopulation || 0;

  // ✅ Gender Distribution
  document.getElementById("maleCount").innerText =
    data.genderDistribution?.Male || 0;
  document.getElementById("femaleCount").innerText =
    data.genderDistribution?.Female || 0;

  // ✅ Age Distribution
  const ageGroupList = document.querySelector(".age-group-list");
  ageGroupList.innerHTML = ""; // Clear previous content

  const ageGroups = [
    "Infant",
    "Toddler",
    "Child",
    "Teenager",
    "Young Adult",
    "Middle-aged Adult",
    "Senior",
    "Elderly",
  ];

  const ageGroupData = [];
  ageGroups.forEach((group) => {
    const count = data.ageGroups?.[group] || 0; // Default to 0 if no data
    const listItem = document.createElement("div");
    listItem.textContent = `${group}: ${count}`;
    listItem.classList.add("age-group-item");
    ageGroupList.appendChild(listItem);
    ageGroupData.push(count); // Collecting the counts for the chart
  });

  // ✅ Render Age Distribution Pie Chart
  renderAgeChart(ageGroups, ageGroupData);

  // ✅ Render other charts
  renderBmiChart(data.bmiData || {});
  renderListChart("medicineChart", "Citizen Availed", data.medicineData || []);
  renderListChart("serviceChart", "Citizen Availed", data.serviceData || []);

  // ✅ BMI Classification
  document.getElementById("underweightCount").innerText =
    data.bmiData?.Underweight || 0;
  document.getElementById("normalCount").innerText = data.bmiData?.Normal || 0;
  document.getElementById("overweightCount").innerText =
    data.bmiData?.Overweight || 0;
  document.getElementById("obeseCount").innerText = data.bmiData?.Obese || 0;
}

/** ✅ Render Age Distribution Pie Chart */
function renderAgeChart(labels, data) {
  const ctx = document.getElementById("ageDistributionChart").getContext("2d");

  // Destroy previous chart instance if it exists
  if (window.ageChart instanceof Chart) {
    window.ageChart.destroy();
  }

  // Create new Pie Chart
  window.ageChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: [
            "#063E4F", // Deep Teal
            "#F4A261", // Warm Muted Orange
            "#E76F51", // Earthy Red
            "#2A9D8F", // Soft Cyan-Teal
            "#264653", // Deep Slate Blue
            "#F4E285", // Soft Pastel Yellow
            "#D9BF77", // Muted Gold
            "#A8DADC", // Light Aqua
            "#457B9D", // Cool Blue
            "#8D99AE", // Soft Gray-Blue
          ],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
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
          backgroundColor: ["#063e4f", "#28a745", "#ffc107", "#dc3545"],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}
