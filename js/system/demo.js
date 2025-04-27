import { backendURL, errorNotification, logout } from "../utils/utils.js";

// Logout Button
const btn_logout = document.getElementById("btn_logout");
if (btn_logout) {
  btn_logout.addEventListener("click", logout);
}

/** ✅ Fetch and Load Data on Page Load */
document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const municipality = urlParams.get("municipality");

  if (!municipality) {
    errorNotification("Municipality is required in the URL.");
    console.error("❌ Missing URL parameter: Municipality");
    return;
  }

  await fetchMunicipalityReport(municipality);
});

/** ✅ Fetch Municipality Report */
async function fetchMunicipalityReport(municipality) {
  try {
    // Log the API request to check if data is coming in correctly
    console.log("🌍 Fetching municipality data for:", municipality);

    const response = await fetch(
      `${backendURL}/api/muni-report/${municipality}`,
      {
        credentials: "include",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status} - Failed to fetch municipality report.`
      );
    }

    const data = await response.json();
    // Log the response data for debugging
    console.log("🌍 API response data:", data);

    if (!data.success) {
      throw new Error("Failed to retrieve data.");
    }

    displayMunicipalityDemographics(data);
    const stakeholder = data.stakeholder || {};
    document.getElementById("agency_name").textContent =
      stakeholder.agency_name || "Unknown Agency";
  } catch (error) {
    console.error("❌ Error fetching municipality data:", error);
    errorNotification("Failed to load municipality demographic data.");
  }
}

function displayMunicipalityDemographics(data) {
  // Log the received data to verify it's correct
  console.log("Received data:", data);

  // Update the summary report with the municipality name
  const summaryReportEl = document.getElementById("summaryReport");
  if (summaryReportEl) {
    const municipality =
      data.stakeholder?.municipality || "Unknown Municipality";

    summaryReportEl.textContent = `${municipality} - Summary Report`; // Set municipality to the summary report
  }

  const municipalityEl = document.getElementById("municipality-name");
  if (municipalityEl)
    municipalityEl.innerText = data.municipality || "Unknown Municipality";

  const totalPopulationEl = document.getElementById("totalPopulation");
  if (totalPopulationEl)
    totalPopulationEl.innerText = data.totalPopulation || 0;

  // Gender Distribution
  document.getElementById("maleCount").innerText =
    data.genderDistribution?.Male || 0;
  document.getElementById("femaleCount").innerText =
    data.genderDistribution?.Female || 0;

  // Ensure BMI data exists before updating the UI
  const bmiData = data.bmiData || {};
  document.getElementById("underweightCount").innerText =
    bmiData.Underweight || 0;
  document.getElementById("normalCount").innerText = bmiData.Normal || 0;
  document.getElementById("overweightCount").innerText =
    bmiData.Overweight || 0;
  document.getElementById("obeseCount").innerText = bmiData.Obese || 0;

  // Populate Barangay Dropdown with Redirect Feature
  const barangayDropdown = document.getElementById("provinceDropdown");
  const barangayButton = document.getElementById("provinceDropdownButton");
  if (barangayDropdown) {
    barangayDropdown.innerHTML = ""; // Clear previous entries

    if (data.barangays && data.barangays.length > 0) {
      data.barangays.forEach((barangay) => {
        const listItem = document.createElement("li");
        const button = document.createElement("button");
        button.classList.add("dropdown-item");
        button.textContent = barangay;
        button.type = "button";

        // Redirect to stake_brgy.html with the selected barangay in the URL
        button.addEventListener("click", function () {
          barangayButton.textContent = barangay; // Update button text
          window.location.href = `stake_brgy.html?barangay=${encodeURIComponent(
            barangay
          )}`;
        });

        listItem.appendChild(button);
        barangayDropdown.appendChild(listItem);
      });
    } else {
      barangayDropdown.innerHTML =
        '<li><span class="dropdown-item disabled">No barangays available</span></li>';
    }
  }

  // Render Charts
  renderBmiChart(data.bmiData || {});
  renderListChart("medicineChart", "Citizen Availed", data.medicineData || []);
  renderListChart("serviceChart", "Citizen Availed", data.serviceData || []);
}

/** ✅ Render BMI Chart */
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
