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
document.addEventListener("DOMContentLoaded", async () => {
  fetchMedicineReports();
});

/** Fetch and Display Medicine Reports by Barangay */
async function fetchMedicineReports() {
  try {
    const response = await fetch(`${backendURL}/api/medicines/by-barangay`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch medicine data: ${response.status}`);
    }

    const data = await response.json();
    displayMedicineReports(data);
  } catch (error) {
    console.error("Error fetching medicine reports:", error);
    errorNotification("Failed to load medicine data.");
  }
}

/**  Display Medicine Reports */
function displayMedicineReports(data) {
  const barangayCardsContainer = document.getElementById("barangayCards");
  barangayCardsContainer.innerHTML = ""; // Clear previous content

  if (!data || !Array.isArray(data)) {
    console.warn("Invalid medicine data received.");
    return;
  }

  data.forEach((barangayData) => {
    const { barangay, medicines } = barangayData;
    const cardId = `medicineChart-${barangay.replace(/\s+/g, "-")}`;

    //  Create Barangay Card
    const card = document.createElement("div");
    card.classList.add("col-lg-3", "col-md-4", "col-sm-6", "mb-2", "px-1");

    card.innerHTML = `
      <div class="card medicine-card">
        <div class="card-body">
          <h6 class="card-title text-center fw-bold">${barangay}</h6> 
          <div class="chart-container">
            <canvas id="${cardId}" class="medicine-chart"></canvas>
          </div>
        </div>
      </div>
    `;

    barangayCardsContainer.appendChild(card);
    renderMedicineChart(cardId, medicines);
  });
}

/** Render Medicine Chart (Pie Chart) */
function renderMedicineChart(canvasId, medicines) {
  const ctx = document.getElementById(canvasId);

  if (!ctx) {
    console.warn(`Canvas with ID ${canvasId} not found.`);
    return;
  }

  if (!medicines || medicines.length === 0) {
    console.warn(`No medicine data available for ${canvasId}`);
    ctx.textContent = "No data available";
    return;
  }

  const labels = medicines.map((med) => med.name);
  const dataValues = medicines.map((med) => med.total_quantity);
  const units = medicines.map((med) => med.unit || "unit");

  const backgroundColors = [
    "#0056b3",
    "#003f7f",
    "#006eff",
    "#0099ff",
    "#00b3ff",
    "#00ccff",
    "#00e6ff",
    "#005ea1",
  ];

  new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Quantity",
          data: dataValues,
          backgroundColor: backgroundColors,
          hoverOffset: 10,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" },
        tooltip: {
          callbacks: {
            label: (tooltipItem) => {
              const index = tooltipItem.dataIndex;
              return `${labels[index]}: ${dataValues[index]} ${units[index]}`;
            },
          },
        },
      },
    },
  });
}
