import { backendURL, showNavAdminPages, logout } from "../utils/utils.js";

showNavAdminPages();
// Logout Button
const btn_logout = document.getElementById("btn_logout");
if (btn_logout) {
  btn_logout.addEventListener("click", logout);
}
document.addEventListener("DOMContentLoaded", () => {
  fetchDemographicSummary();
});

async function fetchDemographicSummary() {
  try {
    const response = await fetch(`${backendURL}/api/demo-summary`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    // Ensure the structure of the received data
    if (
      data &&
      data.ageGroups &&
      data.genderDistribution &&
      data.totalPopulation
    ) {
      // Populate Age Group Data
      const ageContainer = document.querySelector(".card-age .card-body");
      if (ageContainer) {
        Object.entries(data.ageGroups).forEach(([group, count]) => {
          const ageGroupDiv = document.createElement("div");
          ageGroupDiv.classList.add("age-group");

          // Age group (right side)
          const groupSpan = document.createElement("span");
          groupSpan.textContent = group;
          ageGroupDiv.appendChild(groupSpan);

          // Age count (left side)
          const countSpan = document.createElement("span");
          countSpan.textContent = count;
          ageGroupDiv.appendChild(countSpan);

          // Append the age group to the container
          ageContainer.appendChild(ageGroupDiv);
        });
      }

      // Populate Gender Distribution
      const genderContainer = document.querySelector(".card-gender .card-body");
      if (genderContainer) {
        // Clear existing content (if needed)
        genderContainer.innerHTML = "";

        // Create a title element for the card
        const title = document.createElement("h5");
        title.textContent = "Gender Distribution";
        title.classList.add("card-title", "fw-bold", "text-start");
        genderContainer.appendChild(title);

        // Create a container for the gender text
        const genderGroupList = document.createElement("div");
        genderGroupList.classList.add("gender-group-list");

        // Loop through gender distribution and add formatted text
        Object.entries(data.genderDistribution).forEach(([gender, count]) => {
          const capitalizedGender =
            gender.charAt(0).toUpperCase() + gender.slice(1);
          const p = document.createElement("p");
          p.textContent = `${capitalizedGender}: ${count}`;
          genderGroupList.appendChild(p);
        });

        // Append the gender text container to the card body
        genderContainer.appendChild(genderGroupList);
      }

      // Populate Population Data
      const populationContainer = document.querySelector(
        ".card-population .card-body"
      );
      if (populationContainer) {
        const populationText = document.createElement("p");
        populationText.classList.add("total-population", "mb-3", "fw-semibold");
        populationText.textContent = `Total Population: ${data.totalPopulation}`;

        // Insert the text above the canvas
        const agePieChartElement = document.getElementById("agePieChart");
        if (agePieChartElement) {
          populationContainer.insertBefore(populationText, agePieChartElement);
        }
      }

      // Render Pie Chart for Age Distribution
      renderAgePieChart(data.ageGroups);
    } else {
      throw new Error("Invalid data structure received.");
    }
  } catch (error) {
    console.error("Error fetching demographic data:", error);
    const errorContainer = document.querySelector(".card-error"); // Specified error container
    if (errorContainer) {
      const errorMessage = document.createElement("p");
      errorMessage.textContent =
        "Failed to load demographic data. Please try again later.";
      errorContainer.appendChild(errorMessage);
    }
  }
}

function renderAgePieChart(ageGroups) {
  const ctx = document.getElementById("agePieChart")?.getContext("2d");

  if (!ctx) {
    console.error("Canvas element with ID 'agePieChart' not found.");
    return;
  }

  // ✅ Define all possible age groups and ensure missing ones are set to 0
  const allAgeGroups = {
    Infant: 0,
    Toddler: 0,
    Child: 0,
    Teenager: 0,
    "Young Adult": 0,
    "Middle-aged Adult": 0,
    Senior: 0,
    Elderly: 0,
  };

  // ✅ Merge API response with predefined age groups
  Object.entries(ageGroups || {}).forEach(([group, count]) => {
    if (allAgeGroups.hasOwnProperty(group)) {
      allAgeGroups[group] = count;
    }
  });

  const labels = Object.keys(allAgeGroups);
  const data = Object.values(allAgeGroups);

  // 🎨 **New Visually Pleasing Colors**
  const backgroundColors = [
    "#FFADAD", // Infant (Soft Red)
    "#FFD6A5", // Toddler (Peach)
    "#FDFFB6", // Child (Soft Yellow)
    "#9BF6FF", // Teenager (Light Blue)
    "#A0C4FF", // Young Adult (Sky Blue)
    "#BDB2FF", // Middle-aged Adult (Lavender)
    "#FFB4A2", // Senior (Warm Orange)
    "#B5EAD7", // Elderly (Mint Green)
  ];

  const borderColors = [
    "#FF6B6B", // Infant (Deep Red)
    "#FFA552", // Toddler (Burnt Orange)
    "#FFE066", // Child (Golden Yellow)
    "#6EC3FF", // Teenager (Bright Blue)
    "#5C9DFF", // Young Adult (Deeper Blue)
    "#7C6FF2", // Middle-aged Adult (Purple)
    "#FF8B6A", // Senior (Darker Orange)
    "#7ED9A3", // Elderly (Deep Green)
  ];

  new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
          labels: {
            font: {
              size: 14,
              weight: "bold",
            },
          },
        },
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

async function loadServices() {
  try {
    const response = await fetch(`${backendURL}/api/services/all`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch services");
    }

    const services = await response.json();
    const serviceCardsContainer = document.getElementById("serviceCards");

    // Clear previous content
    serviceCardsContainer.innerHTML = "";

    // Loop through services and create cards
    services.forEach((service) => {
      const encodedServiceName = encodeURIComponent(service.name); // Ensure service name is safe for URLs

      const serviceCard = `
        <div class="col-md-4">
            <div class="card service-card" data-service-name="${encodedServiceName}">
                <div class="card-body text-start">
                    <h5 class="card-title fw-bold">${service.name}</h5>
                    <p class="totalCitizen" style="font-size: 0.9rem;">
                        Total Citizens: <span id="totalCitizens-${encodedServiceName}">Loading...</span>
                    </p>
                    <canvas id="ageDistributionChart-${encodedServiceName}" width="100" height="100"></canvas>
                </div>
            </div>
        </div>
      `;
      serviceCardsContainer.innerHTML += serviceCard;
    });

    // Fetch the age distribution for each service
    services.forEach((service) => {
      fetchAgeDistribution(service.name); // Pass service name
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    if (typeof errorNotification === "function") {
      errorNotification("Unable to load services. Please try again later.");
    }
  }
}

// ✅ Fetch age distribution data for the service
async function fetchAgeDistribution(serviceName) {
  try {
    const encodedServiceName = encodeURIComponent(serviceName);

    const response = await fetch(
      `${backendURL}/api/service/${encodedServiceName}/age-distribution`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch age distribution data for ${serviceName}`
      );
    }

    const { ageGroups, totalCitizens } = await response.json();

    // ✅ Update total citizens count in the UI
    const totalCitizensElement = document.getElementById(
      `totalCitizens-${encodedServiceName}`
    );
    if (totalCitizensElement) {
      totalCitizensElement.textContent = totalCitizens;
    } else {
      console.warn(
        `Element with ID totalCitizens-${encodedServiceName} not found.`
      );
    }

    // ✅ Create the age distribution chart, ensuring missing groups are set to 0
    createAgeDistributionChart(serviceName, ageGroups);
  } catch (error) {
    console.error(
      `Error fetching age distribution for service ${serviceName}:`,
      error
    );
    if (typeof errorNotification === "function") {
      errorNotification(`Error loading data for service ${serviceName}.`);
    }
  }
}

// ✅ Create the age distribution chart with all age groups
function createAgeDistributionChart(serviceName, ageGroups) {
  const encodedServiceName = encodeURIComponent(serviceName);
  const ctx = document.getElementById(
    `ageDistributionChart-${encodedServiceName}`
  );

  if (!ctx) {
    console.warn(`Canvas for service ${serviceName} not found.`);
    return;
  }

  // ✅ Define all possible age groups and ensure missing ones are set to 0
  const allAgeGroups = {
    Infant: 0,
    Toddler: 0,
    Child: 0,
    Teenager: 0,
    "Young Adult": 0,
    "Middle-aged Adult": 0,
    Senior: 0,
    Elderly: 0,
  };

  // ✅ Merge API response with predefined age groups
  Object.entries(ageGroups || {}).forEach(([group, count]) => {
    if (allAgeGroups.hasOwnProperty(group)) {
      allAgeGroups[group] = count;
    }
  });

  const labels = Object.keys(allAgeGroups);
  const data = Object.values(allAgeGroups);

  // 🎨 **Visually Pleasing Colors**
  const backgroundColors = [
    "#FFADAD", // Infant (Soft Red)
    "#FFD6A5", // Toddler (Peach)
    "#FDFFB6", // Child (Soft Yellow)
    "#9BF6FF", // Teenager (Light Blue)
    "#A0C4FF", // Young Adult (Sky Blue)
    "#BDB2FF", // Middle-aged Adult (Lavender)
    "#FFB4A2", // Senior (Warm Orange)
    "#B5EAD7", // Elderly (Mint Green)
  ];

  const borderColors = [
    "#FF6B6B", // Infant (Deep Red)
    "#FFA552", // Toddler (Burnt Orange)
    "#FFE066", // Child (Golden Yellow)
    "#6EC3FF", // Teenager (Bright Blue)
    "#5C9DFF", // Young Adult (Deeper Blue)
    "#7C6FF2", // Middle-aged Adult (Purple)
    "#FF8B6A", // Senior (Darker Orange)
    "#7ED9A3", // Elderly (Deep Green)
  ];

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: `Age Distribution for ${serviceName}`,
          data: data,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
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
        legend: {
          display: false,
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

// Call loadServices to fetch and display the data
loadServices();

async function loadMonthlyMedicineAvailed() {
  try {
    const response = await fetch(`${backendURL}/api/monthly/medicine`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch monthly medicine availed data");
    }

    const medicineData = await response.json();
    const medicineSummaryContainer = document.getElementById("medicineSummary");

    // Clear previous content
    medicineSummaryContainer.innerHTML = "";

    // Group data by month
    const groupedData = {};
    medicineData.forEach((item) => {
      if (!groupedData[item.month]) {
        groupedData[item.month] = {};
      }
      groupedData[item.month][item.medicine_name] = item.total_availed;
    });

    // Loop through months and create charts
    Object.keys(groupedData).forEach((month) => {
      const encodedMonth = encodeURIComponent(month); // Ensure safe IDs

      const medicineCard = `
        <div class="col-md-6">
          <div class="card service-card">
            <div class="card-body text-start">
              <h5 class="card-title fw-bold">${month}</h5>
              <canvas id="medicineChart-${encodedMonth}" width="100" height="100"></canvas>
            </div>
          </div>
        </div>
      `;
      medicineSummaryContainer.innerHTML += medicineCard;
    });

    // Create charts for each month
    Object.keys(groupedData).forEach((month) => {
      createMedicineChart(month, groupedData[month]);
    });
  } catch (error) {
    console.error("Error fetching medicine data:", error);
    if (typeof errorNotification === "function") {
      errorNotification("Unable to load medicine summary. Please try again.");
    }
  }
}

//  Function to Create Chart
function createMedicineChart(month, medicineData) {
  const encodedMonth = encodeURIComponent(month);
  const ctx = document.getElementById(`medicineChart-${encodedMonth}`);

  if (!ctx) {
    console.warn(`Canvas for month ${month} not found.`);
    return;
  }

  if (!medicineData || Object.keys(medicineData).length === 0) {
    console.warn(`No medicine data available for ${month}`);
    ctx.textContent = "No data available";
    return;
  }

  const labels = Object.keys(medicineData); // Medicine names
  const data = Object.values(medicineData); // Total availed

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: `Medicines Availed in ${month}`,
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
          borderColor: "#00264d",
          borderWidth: 1,
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
              `${tooltipItem.label}: ${tooltipItem.raw} availed`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Total Availed",
          },
        },
      },
    },
  });
}

//  Call function to fetch and display data
loadMonthlyMedicineAvailed();

// Function to fetch BMI data and render chart
async function loadBmiSummary() {
  try {
    const response = await fetch(`${backendURL}/api/bmi`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error(`⚠️ Failed to fetch BMI data (HTTP ${response.status})`);
    }

    const responseData = await response.json();

    if (!responseData.bmi_summary) {
      console.warn("⚠️ No BMI data available.");
      document.getElementById("bmiSummary").innerHTML =
        "<p class='text-center text-muted'>No BMI data available.</p>";
      return;
    }

    renderBmiSummary(responseData.bmi_summary);
    renderBmiChart(responseData.bmi_summary);
  } catch (error) {
    console.error("🚨 Error fetching BMI data:", error);
    document.getElementById("bmiSummary").innerHTML =
      "<p class='text-center'>No BMI summary to load.</p>";
  }
}

//  Function to render the BMI summary section
function renderBmiSummary(bmiData) {
  const bmiSummaryContainer = document.getElementById("bmiSummary");

  if (!bmiSummaryContainer) {
    console.error("🚨 Element #bmiSummary not found!");
    return;
  }

  //  Clear previous content
  bmiSummaryContainer.innerHTML = `
    <div class="row justify-content-center align-items-stretch">
      <!-- Column 1: BMI Chart (Full Height) -->
      <div class="col-md-4 d-flex">
        <div class="card shadow-sm p-4 flex-fill">
          <h5 class="fw-bold text-center">BMI Classification</h5>
          <div class="chart-container" style="height: 100%; min-height: 400px;">
            <canvas id="bmiChart" style="width: 500px; "></canvas>
          </div>
        </div>
      </div>

      <!-- Column 2: Underweight & Normal -->
      <div class="col-md-4">
        <div class="row">
          <div class="col-12 mb-3">
            <div class="card shadow-lg p-4 text-center">
              <h5 class="fw-bold">Underweight</h5>
              <p class="fs-3 fw-bold text-primary">${
                bmiData["Underweight"] || 0
              }</p>
            </div>
          </div>
          <div class="col-12">
            <div class="card shadow-lg p-4 text-center">
              <h5 class="fw-bold">Normal Weight</h5>
              <p class="fs-3 fw-bold text-primary">${
                bmiData["Normal Weight"] || 0
              }</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Column 3: Overweight & Obese -->
      <div class="col-md-4">
        <div class="row">
          <div class="col-12 mb-3">
            <div class="card shadow-lg p-4 text-center">
              <h5 class="fw-bold">Overweight</h5>
              <p class="fs-3 fw-bold text-primary">${
                bmiData["Overweight"] || 0
              }</p>
            </div>
          </div>
          <div class="col-12">
            <div class="card shadow-lg p-4 text-center">
              <h5 class="fw-bold">Obese</h5>
              <p class="fs-3 fw-bold text-primary">${bmiData["Obese"] || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Function to render BMI Bar Chart
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
      plugins: {
        legend: { display: false },
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

// Call function to fetch and display data
loadBmiSummary();
