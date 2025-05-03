import { backendURL, showNavAdminPages, logout } from "../utils/utils.js";

showNavAdminPages();

// Logout Button
const btn_logout = document.getElementById("btn_logout");
if (btn_logout) {
  btn_logout.addEventListener("click", logout);
}
let medicineChartInstance = null;

document.addEventListener("DOMContentLoaded", async () => {
  await fetchUserProvinces();
  fetchServiceAvailmentStats();
  fetchDemographicSummary();
  loadBmiSummary();
  loadOverallMedicineAvailed();
});

document.getElementById("serviceChart")?.addEventListener("click", () => {
  window.location.href = "super_serv.html";
});

document.getElementById("medicineChart")?.addEventListener("click", () => {
  window.location.href = "superadmin_med-avail.html";
});

/** ✅ Fetch and Populate Province Dropdown */
async function fetchUserProvinces() {
  try {
    const response = await fetch(`${backendURL}/api/user-provinces`, {
      credentials: "include",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok)
      throw new Error(`HTTP ${response.status} - Unable to fetch provinces.`);

    const data = await response.json();
    const dropdownMenu = document.getElementById("provinceDropdown");
    dropdownMenu.innerHTML = "";

    if (!data.success || !data.provinces?.length) {
      dropdownMenu.innerHTML = `<li><span class="dropdown-item disabled">No provinces available</span></li>`;
      return;
    }

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

function selectProvince(province) {
  document.getElementById("provinceDropdownButton").textContent = province;
  window.location.href = `province_report.html?province=${encodeURIComponent(
    province
  )}`;
}

async function fetchDemographicSummary() {
  try {
    const response = await fetch(`${backendURL}/api/demo-summary`, {
      credentials: "include",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();

    if (data?.ageGroups && data.genderDistribution && data.totalPopulation) {
      const totalPopulationElement = document.getElementById("totalPopulation");
      if (totalPopulationElement)
        totalPopulationElement.textContent = data.totalPopulation;

      const maleCountElement = document.getElementById("maleCount");
      const femaleCountElement = document.getElementById("femaleCount");

      if (maleCountElement && femaleCountElement) {
        maleCountElement.textContent = data.genderDistribution.Male || 0;
        femaleCountElement.textContent = data.genderDistribution.Female || 0;
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

const fromInput = document.getElementById("from");
const toInput = document.getElementById("to");
const filterBtn = document.getElementById("filter");
const resetBtn = document.getElementById("resetbtn");
const loadingSpinner = document.getElementById("loadingSpinner");
const messageBox = document.getElementById("messageBox");
let serviceChartInstance = null;

async function fetchServiceAvailmentStats(fromDate = "", toDate = "") {
  try {
    loadingSpinner.style.display = "block";
    messageBox.textContent = ""; // Clear previous messages

    const queryParams = new URLSearchParams();
    if (fromDate) queryParams.append("from", fromDate);
    if (toDate) queryParams.append("to", toDate);

    const url = `${backendURL}/api/service-availment-stats?${queryParams.toString()}`;

    const response = await fetch(url, {
      credentials: "include",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();

    const canvas = document.getElementById("serviceChart");
    const ctx = canvas?.getContext("2d");

    // Clear previous chart if any
    if (serviceChartInstance) {
      serviceChartInstance.destroy();
      serviceChartInstance = null;
    }

    // Handle case where there is no data
    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
      renderServiceAvailmentChart(data.data);
    } else {
      messageBox.textContent =
        "No service availment data available for the selected dates.";
      renderEmptyChart();
    }
  } catch (error) {
    console.error("Error:", error);
    messageBox.textContent = "No data available.";
  } finally {
    loadingSpinner.style.display = "none";
  }
}

function renderServiceAvailmentChart(serviceData) {
  const canvas = document.getElementById("serviceChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  const labels = serviceData.map((s) => s.name);
  const data = serviceData.map((s) => s.citizen_count);

  serviceChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          label: "Citizens Who Availed the Service",
          data,
          backgroundColor: [
            "#063E4F",
            "#F4A261",
            "#E76F51",
            "#2A9D8F",
            "#264653",
            "#F4E285",
            "#D9BF77",
            "#A8DADC",
            "#457B9D",
            "#8D99AE",
          ],
          borderColor: "#333",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
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

// Function to render an empty chart when no data is available
function renderEmptyChart() {
  const canvas = document.getElementById("serviceChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  serviceChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["No Data Available"],
      datasets: [
        {
          data: [1],
          backgroundColor: ["#D3D3D3"],
          borderColor: "#333",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: () => "No data available",
          },
        },
      },
    },
  });
}

// Event listeners
filterBtn.addEventListener("click", () => {
  const fromDate = fromInput.value;
  const toDate = toInput.value;

  // Optional: validate date range
  if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
    messageBox.textContent = "'From' date must be earlier than 'To' date.";
    return;
  }

  fetchServiceAvailmentStats(fromDate, toDate);
});

resetBtn.addEventListener("click", () => {
  fromInput.value = "";
  toInput.value = "";
  fetchServiceAvailmentStats(); // Unfiltered
});

// Initial chart load
fetchServiceAvailmentStats();

async function loadBmiSummary() {
  try {
    const response = await fetch(`${backendURL}/api/bmi`, {
      credentials: "include",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok)
      throw new Error(`Failed to fetch BMI data (HTTP ${response.status})`);

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

function renderBmiSummary(bmiData) {
  document.getElementById("underweightCount").textContent =
    bmiData["Underweight"] || 0;
  document.getElementById("normalCount").textContent =
    bmiData["Normal Weight"] || 0;
  document.getElementById("overweightCount").textContent =
    bmiData["Overweight"] || 0;
  document.getElementById("obeseCount").textContent = bmiData["Obese"] || 0;
}

function renderBmiChart(bmiData) {
  const canvas = document.getElementById("bmiChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const labels = Object.keys(bmiData);
  const data = Object.values(bmiData);

  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Number of Citizens",
          data,
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

async function loadOverallMedicineAvailed(from = null, to = null) {
  try {
    let url = `${backendURL}/api/overall/medicine`;
    if (from && to)
      url += `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

    const response = await fetch(url, {
      credentials: "include",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok)
      throw new Error("Failed to fetch overall medicine availed data");

    const responseData = await response.json();
    const medicineData = responseData.data;

    const container = document.getElementById("medicineChart")?.parentElement;
    if (!medicineData?.length) {
      if (container) {
        container.innerHTML += `<p class='text-muted text-center'>No data available</p>`;
      }
      return;
    }

    const ctx = document.getElementById("medicineChart")?.getContext("2d");
    if (!ctx) return;

    // 🔥 Destroy existing chart instance before creating new one
    if (medicineChartInstance) {
      medicineChartInstance.destroy();
    }

    const labels = medicineData.map((item) => item.name);
    const data = medicineData.map((item) => Number(item.total_availed));

    // 🎯 Create new chart and store instance
    medicineChartInstance = new Chart(ctx, {
      type: "pie",
      data: {
        labels,
        datasets: [
          {
            label: "Total Medicines Availed",
            data,
            backgroundColor: [
              "#063E4F",
              "#F4A261",
              "#E76F51",
              "#2A9D8F",
              "#264653",
              "#F4E285",
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

document.addEventListener("DOMContentLoaded", () => {
  const filterBtn = document.getElementById("filterBtn");
  const resetBtn = document.getElementById("reset");

  filterBtn.addEventListener("click", () => {
    const fromDate = document.getElementById("fromDate").value;
    const toDate = document.getElementById("toDate").value;

    // ✅ Only call the function if both dates are selected
    if (fromDate && toDate) {
      loadOverallMedicineAvailed(fromDate, toDate);
    } else {
      alert("Please select both FROM and TO dates.");
    }
  });

  resetBtn.addEventListener("click", () => {
    // Clear the date inputs
    document.getElementById("fromDate").value = "";
    document.getElementById("toDate").value = "";

    // Reload all data without filters
    loadOverallMedicineAvailed();
  });
});

// ✅ PDF Download Button
const downloadBtn = document.getElementById("download-pdf");

downloadBtn?.addEventListener("click", async () => {
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
  if (clonedSummary) clonedSummary.style.fontSize = "12px";

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

  // Minor delay to ensure full render
  await new Promise((resolve) => setTimeout(resolve, 500));

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
