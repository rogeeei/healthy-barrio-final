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
  fetchEquipmentReports();
});

/** Fetch and Display Equipment Reports by Barangay */
async function fetchEquipmentReports() {
  try {
    const response = await fetch(`${backendURL}/api/equipment/barangay`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch equipment data: ${response.status}`);
    }

    const data = await response.json();
    displayEquipmentReports(data);
  } catch (error) {
    console.error("Error fetching equipment reports:", error);
    errorNotification("Failed to load equipment data.");
  }
}

/** Display Equipment Reports */
function displayEquipmentReports(data) {
  const barangayCardsContainer = document.getElementById(
    "barangayEquipmentCards"
  );
  barangayCardsContainer.innerHTML = ""; // Clear previous content

  if (!data || !Array.isArray(data)) {
    console.warn("Invalid equipment data received.");
    return;
  }

  data.forEach((barangayData) => {
    const { barangay, equipment } = barangayData;
    const cardId = `equipmentChart-${barangay}`;

    // Create Barangay Card
    const card = document.createElement("div");
    card.classList.add("col-md-4", "mb-3");
    card.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h5 class="card-title text-center fw-bold">${barangay}</h5>
          <div class="chart-container">
            <canvas id="${cardId}" class="equipment-chart"></canvas>
          </div>
        </div>
      </div>
    `;

    barangayCardsContainer.appendChild(card);
    renderEquipmentChart(cardId, equipment);
  });
}

/** Render Equipment Chart */
function renderEquipmentChart(canvasId, equipment) {
  const ctx = document.getElementById(canvasId);

  if (!ctx) {
    console.warn(`Canvas with ID ${canvasId} not found.`);
    return;
  }

  if (!equipment || equipment.length === 0) {
    console.warn(`No equipment data available for ${canvasId}`);
    ctx.textContent = "No data available";
    return;
  }

  const labels = equipment.map((equip) => equip.name);
  const dataValues = equipment.map((equip) => equip.total_quantity);

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
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: (tooltipItem) =>
              `${labels[tooltipItem.dataIndex]}: ${
                dataValues[tooltipItem.dataIndex]
              }`,
          },
        },
      },
    },
  });
}
