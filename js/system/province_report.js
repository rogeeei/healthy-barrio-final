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
/** ✅ Fetch and Populate Municipality Dropdown */
async function fetchMunicipalities(province) {
  try {
    const response = await fetch(
      `${backendURL}/api/user-municipalities?province=${encodeURIComponent(
        province
      )}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!response.ok)
      throw new Error(
        `HTTP ${response.status} - Unable to fetch municipalities.`
      );

    const data = await response.json();

    const dropdownMenu = document.getElementById("municipalityDropdown");
    dropdownMenu.innerHTML = ""; // Clear previous entries

    if (
      !data.success ||
      !data.municipalities ||
      data.municipalities.length === 0
    ) {
      dropdownMenu.innerHTML = `<li><span class="dropdown-item disabled">No municipalities available</span></li>`;
      return;
    }

    // Populate the dropdown with municipalities
    data.municipalities.forEach((municipality) => {
      const listItem = document.createElement("li");
      listItem.innerHTML = `<a class="dropdown-item" href="#">${municipality}</a>`;
      listItem.addEventListener("click", () =>
        selectMunicipality(municipality, province)
      );
      dropdownMenu.appendChild(listItem);
    });
  } catch (error) {
    console.error("❌ Error fetching municipalities:", error);
    errorNotification("Failed to load municipalities.");
  }
}

/** ✅ Handle Municipality Selection and Redirect */
function selectMunicipality(municipality, province) {
  document.getElementById("municipalityDropdownButton").textContent =
    municipality;

  // ✅ Redirect to municipality report page with province & municipality in URL
  window.location.href = `municipality_report.html?province=${encodeURIComponent(
    province
  )}&municipality=${encodeURIComponent(municipality)}`;
}

/** ✅ Fetch and Load Data on Page Load */
document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const province = urlParams.get("province");

  if (!province) {
    errorNotification("No province specified in URL.");
    return;
  }

  await fetchMunicipalities(province); // ✅ Fetch municipalities for the province

  try {
    const response = await fetch(
      `${backendURL}/api/province-report/${encodeURIComponent(province)}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status} - Failed to fetch province data.`
      );
    }

    const data = await response.json();

    displayDemographics(province, data);
  } catch (error) {
    console.error("❌ Error fetching province data:", error);
    errorNotification("Failed to load province demographic data.");
  }
});

/** ✅ Display Province Demographic Data */
function displayDemographics(province, data) {
  // Update Province Name
  document.getElementById("province").innerText = province;

  // Total Population
  document.getElementById("totalPopulation").innerText =
    data.totalPopulation || 0;

  // Gender Distribution
  document.getElementById("maleCount").innerText =
    data.genderDistribution?.Male || 0;
  document.getElementById("femaleCount").innerText =
    data.genderDistribution?.Female || 0;

  // Age Distribution - Update the existing HTML structure
  const ageGroupList = document.querySelector(".age-group-list");
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

  // Update Age Group Data Dynamically
  ageGroupList.innerHTML = ""; // Clear previous content
  ageGroups.forEach((group) => {
    const ageData = data.ageGroups?.[group] || 0;
    const ageElement = document.createElement("div");
    ageElement.innerHTML = `<b>${group}:</b> ${ageData}`;
    ageGroupList.appendChild(ageElement);
  });

  // Render Age Distribution Pie Chart
  const ageData = ageGroups.map((group) => data.ageGroups?.[group] || 0);
  renderAgeChart(ageGroups, ageData);

  // Render Other Charts
  renderBmiChart(data.bmiData || {});
  renderListChart("medicineChart", "Citizen Availed", data.medicineData || []);
  renderListChart("serviceChart", "Citizen Availed", data.serviceData || []);

  // BMI Classification
  document.getElementById("underweightCount").innerText =
    data.bmiData?.Underweight || 0;
  document.getElementById("normalCount").innerText = data.bmiData?.Normal || 0;
  document.getElementById("overweightCount").innerText =
    data.bmiData?.Overweight || 0;
  document.getElementById("obeseCount").innerText = data.bmiData?.Obese || 0;
}

/** Render Age Distribution Pie Chart */
function renderAgeChart(labels, data) {
  const ctx = document.getElementById("ageDistributionChart").getContext("2d");

  // Destroy previous chart instance if it exists
  if (window.ageChart instanceof Chart) {
    window.ageChart.destroy();
  }

  // Create a new Pie Chart
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
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: function (tooltipItem) {
              return `${tooltipItem.label}: ${tooltipItem.raw} people`;
            },
          },
        },
      },
    },
  });
}

/**  Render BMI Chart */
function renderBmiChart(bmiData) {
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

/**  Render List Charts */
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
