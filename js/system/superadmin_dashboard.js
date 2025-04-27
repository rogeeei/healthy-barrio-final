import { backendURL, showNavAdminPages, logout } from "../utils/utils.js";

showNavAdminPages();
// Logout Button
const btn_logout = document.getElementById("btn_logout");
if (btn_logout) {
  btn_logout.addEventListener("click", logout);
}
document.addEventListener("DOMContentLoaded", () => {
  fetchServiceAvailmentStats();
  fetchDemographicSummary();
});
document
  .getElementById("service_availment_card")
  ?.addEventListener("click", () => {
    window.location.href = "super_serv.html"; // ✅ Update to the correct target page
  });

/** ✅ Fetch and Populate Province Dropdown */
async function fetchUserProvinces() {
  try {
    const response = await fetch(`${backendURL}/api/user-provinces`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - Unable to fetch provinces.`);
    }

    const data = await response.json();

    const dropdownMenu = document.getElementById("provinceDropdown");
    dropdownMenu.innerHTML = ""; // Clear previous entries

    if (!data.success || !data.provinces || data.provinces.length === 0) {
      dropdownMenu.innerHTML = `<li><span class="dropdown-item disabled">No provinces available</span></li>`;
      return;
    }

    // Populate the dropdown with provinces
    data.provinces.forEach((province) => {
      const listItem = document.createElement("li");
      listItem.innerHTML = `<a class="dropdown-item" href="#">${province}</a>`;
      listItem.addEventListener("click", () => selectProvince(province));
      dropdownMenu.appendChild(listItem);
    });
  } catch (error) {
    console.error("❌ Error fetching user provinces:", error);
    errorNotification("Failed to load provinces.");
  }
}

/** ✅ Handle Province Selection and Redirect */
function selectProvince(province) {
  document.getElementById("provinceDropdownButton").textContent = province;

  // ✅ Redirect to province report page
  window.location.href = `province_report.html?province=${encodeURIComponent(
    province
  )}`;
}

/** ✅ Fetch Data on Page Load */
document.addEventListener("DOMContentLoaded", async () => {
  await fetchUserProvinces();
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
      // ✅ Update Total Population
      const totalPopulationElement = document.getElementById("totalPopulation");
      if (totalPopulationElement) {
        totalPopulationElement.textContent = data.totalPopulation;
      } else {
        console.warn("Element #totalPopulation not found.");
      }

      // ✅ Update Male & Female Count
      const maleCountElement = document.getElementById("maleCount");
      const femaleCountElement = document.getElementById("femaleCount");

      if (maleCountElement && femaleCountElement) {
        maleCountElement.textContent = data.genderDistribution.Male || 0;
        femaleCountElement.textContent = data.genderDistribution.Female || 0;
      } else {
        console.warn("One or more gender count elements not found.");
      }
    } else {
      throw new Error("Invalid data structure received.");
    }
  } catch (error) {
    console.error("Error fetching demographic data:", error);
    const errorContainer = document.querySelector(".card-error");
    if (errorContainer) {
      const errorMessage = document.createElement("p");
      errorMessage.textContent =
        "Failed to load demographic data. Please try again later.";
      errorContainer.appendChild(errorMessage);
    }
  }
}

// ✅ Fetch Service Availment Data from Backend
async function fetchServiceAvailmentStats() {
  try {
    const response = await fetch(`${backendURL}/api/service-availment-stats`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch service availment data`);
    }

    const serviceData = await response.json();
    renderServiceAvailmentChart(serviceData);
  } catch (error) {
    console.error("Error fetching service availment stats:", error);
  }
}

// ✅ Render Bar Chart for Service Availment
function renderServiceAvailmentChart(serviceData) {
  const ctx = document.getElementById("serviceChart").getContext("2d");

  if (!ctx) {
    console.error("Canvas element with ID 'serviceChart' not found.");
    return;
  }

  // Extracting service names and citizen counts
  const labels = serviceData.map((service) => service.name);
  const data = serviceData.map((service) => service.citizen_count);

  new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Citizens Who Availed the Service",
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
            label: (tooltipItem) =>
              `${tooltipItem.label}: ${tooltipItem.raw} citizens`,
          },
        },
      },
    },
  });
}

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
  const underweightCount = document.getElementById("underweightCount");
  const normalCount = document.getElementById("normalCount");
  const overweightCount = document.getElementById("overweightCount");
  const obeseCount = document.getElementById("obeseCount");

  if (!underweightCount || !normalCount || !overweightCount || !obeseCount) {
    console.error("🚨 One or more BMI classification elements not found!");
    return;
  }

  // ✅ Update classification values
  underweightCount.textContent = bmiData["Underweight"] || 0;
  normalCount.textContent = bmiData["Normal Weight"] || 0;
  overweightCount.textContent = bmiData["Overweight"] || 0;
  obeseCount.textContent = bmiData["Obese"] || 0;
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
          backgroundColor: ["#1E90FF", "#32CD32", "#FFD700", "#FF4500"],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          type: "logarithmic",
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

document.addEventListener("DOMContentLoaded", () => {
  loadOverallMedicineAvailed();
});

async function loadOverallMedicineAvailed() {
  try {
    const response = await fetch(`${backendURL}/api/overall/medicine`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch overall medicine availed data");
    }

    const medicineData = await response.json();

    // ✅ Check if there's valid data
    if (!medicineData || medicineData.length === 0) {
      console.warn("🚨 No overall medicine data available.");
      document.getElementById(
        "medicineChart"
      ).parentElement.innerHTML += `<p class='text-muted text-center'>No data available</p>`;
      return;
    }

    const ctx = document.getElementById("medicineChart")?.getContext("2d");
    if (!ctx) {
      console.error("🚨 Canvas #medicineChart not found!");
      return;
    }

    // ✅ Extract labels and values from the response, converting `total_availed` to numbers
    const labels = medicineData.map((item) => item.name); // Medicine names
    const data = medicineData.map((item) => Number(item.total_availed)); // Convert to number

    new Chart(ctx, {
      type: "pie", // Change to "bar" if needed
      data: {
        labels: labels,
        datasets: [
          {
            label: "Total Medicines Availed",
            data: data,
            backgroundColor: [
              "#063E4F", // Deep Teal
              "#F4A261", // Warm Muted Orange
              "#E76F51", // Earthy Red
              "#2A9D8F", // Soft Cyan-Teal
              "#264653", // Deep Slate Blue
              "#F4E285", // Soft Pastel Yellow
            ],
            borderColor: "#fff",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top" },
          tooltip: {
            callbacks: {
              label: (tooltipItem) =>
                `${tooltipItem.label}: ${tooltipItem.raw} availed`,
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching overall medicine data:", error);
  }
}
document.getElementById("medicineAvail")?.addEventListener("click", () => {
  window.location.href = "superadmin_med-avail.html"; // Redirect to the correct page
});

const downloadBtn = document.getElementById("download-pdf");

downloadBtn.addEventListener("click", async () => {
  const reportElement = document.getElementById("dashboard_content");
  const originalButton = downloadBtn;

  originalButton.style.display = "none";

  const printable = reportElement.cloneNode(true);
  printable.style.width = "100%";
  printable.style.padding = "20px";
  printable.style.backgroundColor = "white";
  printable.style.textAlign = "left";
  printable.style.margin = "0 auto";
  printable.style.display = "block";

  const clonedSummary = printable.querySelector("#summaryReport");
  if (clonedSummary) {
    clonedSummary.style.fontSize = "12px";
  }

  const cards = printable.querySelectorAll(".row.g-3.mt-2 .card");
  cards.forEach((card) => {
    card.style.padding = "1.5rem";
    card.style.fontSize = "0.7rem";
    card.style.minHeight = "130px";

    const h6 = card.querySelector("h6");
    const h4 = card.querySelector("h4");

    if (h6) h6.style.fontSize = "0.8rem";
    if (h4) h4.style.fontSize = "1rem";
  });

  const originalCanvases = reportElement.querySelectorAll("canvas");
  const clonedCanvases = printable.querySelectorAll("canvas");

  for (let i = 0; i < originalCanvases.length; i++) {
    const originalCanvas = originalCanvases[i];
    const clonedCanvas = clonedCanvases[i];

    const image = new Image();
    image.src = originalCanvas.toDataURL("image/png");
    image.className = "chart-img";
    image.style.width = "100%";
    image.style.height = "auto";

    clonedCanvas.parentNode.replaceChild(image, clonedCanvas);
  }

  const container = document.createElement("div");
  container.style.display = "block";
  container.style.padding = "1rem";
  container.appendChild(printable);
  document.body.appendChild(container);

  const opt = {
    margin: 0.5,
    filename: `Barangay_Report_${new Date().toISOString().slice(0, 10)}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
  };

  await html2pdf().set(opt).from(container).save();

  document.body.removeChild(container);
  originalButton.style.display = "inline-block";
});
