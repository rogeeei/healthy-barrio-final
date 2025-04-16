import { backendURL, successNotification, logout } from "../utils/utils.js";

// Logout Button
const btn_logout = document.getElementById("btn_logout");
if (btn_logout) {
  btn_logout.addEventListener("click", logout);
}

document.addEventListener("DOMContentLoaded", () => {
  fetchStakeholderProvinceReport();
});
async function fetchStakeholderProvinceReport() {
  try {
    const response = await fetch(`${backendURL}/api/stakeholder/province`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch report data");
    }

    updateDashboard(data);
    populateMunicipalityDropdown(data.municipalities || []);

    const stakeholder = data.stakeholder || {};
    document.getElementById("agency_name").textContent =
      stakeholder.agency_name || "Unknown Agency";
  } catch (error) {
    console.error("Error fetching province report:", error);
    errorNotification("Failed to fetch province report.");
  }
}

function updateDashboard(data) {
  document.getElementById("totalPopulation").textContent =
    data.totalPopulation || 0;
  document.getElementById("maleCount").textContent =
    data.genderDistribution?.Male || 0;
  document.getElementById("femaleCount").textContent =
    data.genderDistribution?.Female || 0;
  document.getElementById("underweightCount").textContent =
    data.bmiData?.Underweight || 0;
  document.getElementById("normalCount").textContent =
    data.bmiData?.Normal || 0;
  document.getElementById("overweightCount").textContent =
    data.bmiData?.Overweight || 0;
  document.getElementById("obeseCount").textContent = data.bmiData?.Obese || 0;

  renderBmiChart(data.bmiData || {});
  renderMedicineChart(data.medicineData || []);
  renderServiceChart(data.serviceData || []);
}

function populateMunicipalityDropdown(municipalities) {
  const dropdown = document.getElementById("provinceDropdown");
  dropdown.innerHTML = ""; // Clear existing items

  if (municipalities.length === 0) {
    dropdown.innerHTML =
      '<li><span class="dropdown-item disabled">No municipalities available</span></li>';
    return;
  }

  municipalities.forEach((municipality) => {
    const listItem = document.createElement("li");
    const link = document.createElement("a");
    link.classList.add("dropdown-item");
    link.href = `demo.html?municipality=${encodeURIComponent(municipality)}`;
    link.textContent = municipality;
    listItem.appendChild(link);
    dropdown.appendChild(listItem);
  });
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

function renderMedicineChart(medicineData) {
  const ctx = document.getElementById("medicineChart")?.getContext("2d");
  if (!ctx) return;

  if (window.medicineChartInstance) {
    window.medicineChartInstance.destroy();
  }

  window.medicineChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: medicineData.map((m) => m.medicine_name),
      datasets: [
        {
          data: medicineData.map((m) => m.total_availed),
          backgroundColor: ["#063e4f", "#28a745", "#ffc107", "#dc3545"],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top", // Place the legend at the top (default is 'top')
          align: "center", // Align the legend items in the center
          labels: {
            boxWidth: 20, // Adjust the size of the legend color boxes
            padding: 10, // Adjust the spacing between legend items
            font: {
              size: 14, // Adjust font size of legend text
            },
          },
        },
        tooltip: {
          callbacks: {
            label: (tooltipItem) => ` ${tooltipItem.raw} citizen(s)`, // Custom tooltip format
          },
        },
      },
    },
  });
}

function renderServiceChart(serviceData) {
  const ctx = document.getElementById("serviceChart")?.getContext("2d");
  if (!ctx) return;

  if (window.serviceChartInstance) {
    window.serviceChartInstance.destroy();
  }

  window.serviceChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: serviceData.map((s) => s.service_name),
      datasets: [
        {
          data: serviceData.map((s) => s.total_availed),
          backgroundColor: ["#063e4f", "#28a745", "#ffc107", "#dc3545"],
        },
      ],
    },
  });
}

function errorNotification(message) {
  const errorDiv = document.getElementById("errorNotification");
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = "block";
    setTimeout(() => {
      errorDiv.style.display = "none";
    }, 3000);
  }
}
