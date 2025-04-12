import {
  backendURL,
  successNotification,
  errorNotification,
  showNavAdminPages,
  logout,
  hideBarangayForSuperAdmin,
} from "../utils/utils.js";
showNavAdminPages();
hideBarangayForSuperAdmin();
// Get Barangay from URL
function getBarangayFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("barangay"); // Get the 'barangay' parameter
}
// Logout Button
const btn_logout = document.getElementById("btn_logout");
if (btn_logout) {
  btn_logout.addEventListener("click", logout);
}
//  Fetch Barangay Data on Page Load
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const barangay = getBarangayFromURL(); // Get barangay from URL parameter

    if (barangay) {
      fetchDemographicSummary(barangay);
      loadServices(barangay); // Fetch services for the selected barangay
    } else {
      // If no barangay parameter is found, display an error
      console.error("Barangay parameter is missing in the URL.");
      errorNotification("Barangay not specified in URL.");
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    errorNotification("Failed to fetch data.");
  }
});

/**  Fetch Demographic Summary */
async function fetchDemographicSummary(barangay) {
  try {
    const encodedBarangay = encodeURIComponent(barangay);
    const apiUrl = `${backendURL}/api/demo/brgy/${encodedBarangay}`;

    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    displayDemographics(barangay, data);
  } catch (error) {
    console.error("Error fetching demographic data:", error);
    errorNotification("Failed to fetch demographic data.");
  }
}

/** Display Demographic Data */
function displayDemographics(barangay, data) {
  //  Update Barangay Title
  const barangayTitle = document.getElementById("barangay-title");
  if (barangayTitle) {
    barangayTitle.textContent = `Demographics for ${barangay}`;
  }

  //  Update Total Population Display
  const totalPopulationElement = document.getElementById("totalPopulation");
  if (totalPopulationElement) {
    totalPopulationElement.textContent = `Total Population: ${
      data.totalPopulation || 0
    }`;
  }

  //  Update Gender Distribution Display
  const genderChartElement = document.getElementById("genderChart");
  if (genderChartElement) {
    const maleCount = data.genderDistribution?.Male || 0;
    const femaleCount = data.genderDistribution?.Female || 0;

    genderChartElement.innerHTML = `
      <p>Male: ${maleCount}</p>
      <p>Female: ${femaleCount}</p>
    `;
  }

  //  Display Age Distribution List
  const ageGroupList = document.querySelector(".age-group-list");
  if (ageGroupList) {
    ageGroupList.innerHTML = ""; // Clear previous data

    const ageGroups = data.ageGroups || {};
    if (Object.keys(ageGroups).length === 0) {
      ageGroupList.innerHTML =
        "<p style='font-size: 1.2rem;'>No age group data available.</p>";
    } else {
      Object.entries(ageGroups).forEach(([ageGroup, count]) => {
        const listItem = document.createElement("p");
        listItem.textContent = `${ageGroup}: ${count}`;
        listItem.style.fontSize = "1.2rem";
        ageGroupList.appendChild(listItem);
      });
    }
  }

  //  Render Age Distribution Chart
  renderAgePieChart(data.ageGroups || {});
}

/**  Render Age Distribution Pie Chart */
function renderAgePieChart(ageGroups) {
  const ctx = document.getElementById("ageDistributionChart");

  if (!ctx) {
    console.warn("Canvas for age distribution not found.");
    return;
  }

  if (Object.keys(ageGroups).length === 0) {
    console.warn("No age group data available.");
    ctx.textContent = "No data available";
    return;
  }

  const labels = Object.keys(ageGroups);
  const dataValues = Object.values(ageGroups);

  new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Age Distribution",
          data: dataValues,
          backgroundColor: [
            "#0056b3",
            "#003f7f",
            "#006eff",
            "#0099ff",
            "#00b3ff",
            "#00ccff",
            "#00e6ff",
            "#005ea1",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        tooltip: {
          callbacks: {
            label: (tooltipItem) =>
              `${tooltipItem.label}: ${tooltipItem.raw} citizens`,
          },
        },
      },
    },
  });
}

/**  Fetch and Display Services for Selected Barangay */
async function loadServices(barangay) {
  try {
    const encodedBarangay = encodeURIComponent(barangay);
    const response = await fetch(
      `${backendURL}/api/services/brgy?barangay=${encodedBarangay}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch services");
    }

    const services = await response.json();
    const serviceCardsContainer = document.getElementById("serviceCards");

    // Clear previous content
    serviceCardsContainer.innerHTML = "";

    if (services.length === 0) {
      serviceCardsContainer.innerHTML = `<p>No services available for ${barangay}.</p>`;
      return;
    }

    // Loop through services and create cards
    services.forEach((service) => {
      const serviceCard = document.createElement("div");
      serviceCard.classList.add(
        "service-card",
        "card",
        "p-3",
        "shadow-sm",
        "ms-3"
      );
      serviceCard.dataset.serviceId = service.name;

      serviceCard.innerHTML = `
        <div class="card-body">
          <h5 class="card-title fw-bold text-center">${service.name}</h5>
          <p class="totalCitizen text-center">
            Total Citizens: <span id="totalCitizens-${service.name}">Loading...</span>
          </p>
          <div class="chart-container">
            <canvas id="ageDistributionChart-${service.name}" width="300" height="100"></canvas>
          </div>
        </div>
      `;

      serviceCardsContainer.appendChild(serviceCard);
    });

    //  Fetch the age distribution for each service
    services.forEach((service) => {
      fetchAgeDistribution(service.name, barangay);
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    errorNotification(
      `Unable to load services for ${barangay}. Please try again later.`
    );
  }
}

/** Fetch Age Distribution for Services */
async function fetchAgeDistribution(serviceName, barangay) {
  try {
    const response = await fetch(
      `${backendURL}/api/services/${encodeURIComponent(
        serviceName
      )}/age?barangay=${encodeURIComponent(barangay)}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch age distribution for service ${serviceName}`
      );
    }

    const { ageGroups, totalCitizens } = await response.json();

    //  Update total citizens display
    const totalCitizensElement = document.getElementById(
      `totalCitizens-${serviceName}`
    );
    if (totalCitizensElement) {
      totalCitizensElement.textContent = totalCitizens;
    } else {
      console.warn(
        `❌ Element with ID totalCitizens-${serviceName} not found.`
      );
    }

    //  Create the age distribution chart
    createAgeDistributionChart(serviceName, ageGroups);
  } catch (error) {
    console.error(
      `❌ Error fetching age distribution for service ${serviceName}:`,
      error
    );
    errorNotification(`Error loading data for service ${serviceName}.`);
  }
}
/** Create the Age Distribution Chart for Each Service */
function createAgeDistributionChart(serviceName, ageGroups) {
  const canvasId = `ageDistributionChart-${serviceName}`;
  const ctx = document.getElementById(canvasId);

  if (!ctx) {
    console.warn(`❌ Canvas for service ${serviceName} not found.`);
    return;
  }

  // Convert `ageGroups` object into an array of labels and values
  const labels = Object.keys(ageGroups); // ["Infant", "Toddler", "Child"]
  const data = Object.values(ageGroups); // [1, 2, 3]

  if (labels.length === 0) {
    console.warn(`No age group data available for service ${serviceName}`);
    ctx.textContent = "No data available";
    return;
  }

  //  Destroy any existing chart before creating a new one
  if (window.chartInstances && window.chartInstances[canvasId]) {
    window.chartInstances[canvasId].destroy();
  }

  //  Create a new chart
  const chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          label: `Age Distribution for ${serviceName}`,
          data: data,
          backgroundColor: [
            "#0056b3",
            "#003f7f",
            "#006eff",
            "#0099ff",
            "#00b3ff",
            "#00ccff",
            "#00e6ff",
            "#005ea1",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" },
        tooltip: {
          callbacks: {
            label: (tooltipItem) =>
              `${tooltipItem.label}: ${tooltipItem.raw} citizens`,
          },
        },
      },
    },
  });

  //  Store chart instance
  if (!window.chartInstances) {
    window.chartInstances = {};
  }
  window.chartInstances[canvasId] = chart;
}

// Read Barangay from URL and Load Services
loadServices(getBarangayFromURL());

async function loadMonthlyMedicineAvailed() {
  try {
    //  Get barangay from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    let barangay = urlParams.get("barangay")?.trim();

    if (!barangay) {
      console.error("🚨 Barangay parameter is missing or empty.");
      document.getElementById("medicineSummary").innerHTML =
        "<p class='text-center text-muted'>No barangay selected.</p>";
      return;
    }

    //  Fetch data from API
    const response = await fetch(
      `${backendURL}/api/barangay-availed-by-med?barangay=${encodeURIComponent(
        barangay
      )}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `⚠️ Failed to fetch medicine data (HTTP ${response.status})`
      );
    }

    const responseData = await response.json();

    if (!responseData.success || !responseData.data.length) {
      console.warn(`⚠️ No medicine data found for barangay: "${barangay}"`);
      document.getElementById(
        "medicineSummary"
      ).innerHTML = `<p class='text-center text-muted'>No medicine data available for ${barangay}.</p>`;
      return;
    }

    renderMedicineCharts(responseData.data);
  } catch (error) {
    console.error("🚨 Error fetching medicine data:", error);
    document.getElementById("medicineSummary").innerHTML =
      "<p class='text-center'>No medicine summary to load.</p>";
  }
}

//  Function to Create Chart
function renderMedicineCharts(medicineData) {
  const medicineSummaryContainer = document.getElementById("medicineSummary");

  if (!medicineSummaryContainer) {
    console.error("🚨 Element #medicineSummary not found!");
    return;
  }

  // Clear previous content
  medicineSummaryContainer.innerHTML = "";

  //  Group data by month
  const groupedData = {};
  medicineData.forEach((item) => {
    if (!groupedData[item.month]) {
      groupedData[item.month] = [];
    }
    groupedData[item.month].push({
      name: item.medicine_name,
      total: item.total_availed,
    });
  });

  //  Loop through months and create cards
  Object.keys(groupedData).forEach((month) => {
    const canvasId = `chart-${month.replace(/\s/g, "-")}`;

    const medicineCard = `
      <div class="col-md-6">
        <div class="card service-card">
          <div class="card-body text-start">
            <h5 class="card-title fw-bold">${month}</h5>
            <canvas id="${canvasId}" width="100" height="100"></canvas>
          </div>
        </div>
      </div>
    `;
    medicineSummaryContainer.innerHTML += medicineCard;
  });

  //  Generate charts with a delay to ensure rendering
  setTimeout(() => {
    Object.keys(groupedData).forEach((month) => {
      createMedicineChart(
        `chart-${month.replace(/\s/g, "-")}`,
        groupedData[month]
      );
    });
  }, 500);
}

// Function to Create Chart
function createMedicineChart(canvasId, medicineData) {
  const ctx = document.getElementById(canvasId);

  if (!ctx) {
    console.error(`🚨 Canvas with ID "${canvasId}" not found!`);
    return;
  }

  if (!medicineData || medicineData.length === 0) {
    console.warn(`⚠️ No medicine data available for ${canvasId}`);
    ctx.textContent = "No data available";
    return;
  }

  const labels = medicineData.map((item) => item.name);
  const data = medicineData.map((item) => item.total);

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: `Medicines Availed`,
          data: data,
          backgroundColor: ["#0056b3", "#003f7f", "#006eff", "#0099ff"],
          borderColor: "#00264d",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" },
        tooltip: {
          callbacks: {
            label: (tooltipItem) =>
              `${tooltipItem.label}: ${tooltipItem.raw} availed`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Total Availed" },
        },
      },
    },
  });
}

// Call function to fetch and display data
loadMonthlyMedicineAvailed();

//  Function to fetch and display BMI summary based on barangay from the URL
async function loadBmiSummary() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    let barangay = urlParams.get("barangay")?.trim();

    if (!barangay) {
      console.error("🚨 Barangay parameter is missing or empty.");
      document.getElementById("bmiSummary").innerHTML =
        "<p class='text-center text-muted'>No barangay selected.</p>";
      return;
    }

    // Fetch BMI summary for the selected barangay
    const response = await fetch(
      `${backendURL}/api/bmi/barangay?barangay=${encodeURIComponent(barangay)}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `⚠️ Failed to fetch BMI data for ${barangay} (HTTP ${response.status})`
      );
    }

    const responseData = await response.json();

    if (!responseData.bmi_summary) {
      console.warn(`⚠️ No BMI data available for barangay: "${barangay}"`);
      document.getElementById(
        "bmiSummary"
      ).innerHTML = `<p class='text-center text-muted'>No BMI data available for ${barangay}.</p>`;
      return;
    }

    renderBmiCards(responseData.bmi_summary, barangay);
    renderBmiChart(responseData.bmi_summary);
  } catch (error) {
    console.error("🚨 Error fetching BMI data:", error);
    document.getElementById("bmiSummary").innerHTML =
      "<p class='text-center'>No BMI summary to load.</p>";
  }
}

// Function to generate BMI summary layout
function renderBmiCards(bmiData, barangay) {
  const bmiSummaryContainer = document.getElementById("bmiSummary");

  if (!bmiSummaryContainer) {
    console.error("🚨 Element #bmiSummary not found!");
    return;
  }

  // Clear previous content
  bmiSummaryContainer.innerHTML = `
    <div class="row">
      <div class="col-12 text-center">
        
      </div>
    </div>
    <div class="row">
      <!-- Column 1: BMI Chart -->
      <div class="col-md-4">
        <div class="card shadow-sm p-4">
          <h6 class="fw-bold text-center">BMI Classification</h6>
          <div class="chart-container" style="height: 350px;">
            <canvas id="bmiChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Column 2: Underweight & Normal -->
      <div class="col-md-4">
        <div class="row">
          <div class="col-md-12 mb-3">
            <div class="card shadow-sm p-4 text-center">
              <h5 class="fw-bold">Underweight</h5>
              <p class="fs-3 fw-bold text-primary">${
                bmiData["Underweight"] || 0
              }</p>
            </div>
          </div>
          <div class="col-md-12">
            <div class="card shadow-sm p-4 text-center">
              <h5 class="fw-bold">Normal Weight</h5>
              <p class="fs-3 fw-bold text-success">${
                bmiData["Normal Weight"] || 0
              }</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Column 3: Overweight & Obese -->
      <div class="col-md-4">
        <div class="row">
          <div class="col-md-12 mb-3">
            <div class="card shadow-sm p-4 text-center">
              <h5 class="fw-bold">Overweight</h5>
              <p class="fs-3 fw-bold text-warning">${
                bmiData["Overweight"] || 0
              }</p>
            </div>
          </div>
          <div class="col-md-12">
            <div class="card shadow-sm p-4 text-center">
              <h5 class="fw-bold">Obese</h5>
              <p class="fs-3 fw-bold text-danger">${bmiData["Obese"] || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

//  Function to render BMI Bar Chart
function renderBmiChart(bmiData) {
  const ctx = document.getElementById("bmiChart").getContext("2d");

  if (!ctx) {
    console.error("🚨 Chart canvas #bmiChart not found!");
    return;
  }

  const labels = Object.keys(bmiData);
  const data = Object.values(bmiData);

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Number of Citizens",
          data: data,
          backgroundColor: ["#0056b3", "#003f7f", "#006eff", "#0099ff"],
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
    },
  });
}

//  Call function to fetch and display data
loadBmiSummary();
