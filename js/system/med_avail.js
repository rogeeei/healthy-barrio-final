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

let originalDataset = [];

async function fetchMedicineAvailmentReport() {
  try {
    const response = await fetch(`${backendURL}/api/medicine-availment`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok)
      throw new Error(
        `HTTP ${response.status} - Failed to fetch availment data`
      );

    const data = await response.json();
    console.log("📊 API Response:", data);

    if (!data || !data.data) {
      throw new Error("Failed to load availment data.");
    }

    originalDataset = data.data;
    displayReport(data);
  } catch (error) {
    console.error("Error fetching availment data:", error);
    errorNotification("Failed to load medicine availment data.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  fetchMedicineAvailmentReport();
});

function displayReport(data) {
  const locationInfoElement = document.getElementById("location_info");
  if (locationInfoElement) {
    const locationInfo = `
      <strong>Barangay:</strong> ${data.barangay} <br>
      <strong>Municipality:</strong> ${data.municipality} <br>
      <strong>Province:</strong> ${data.province} <br>
    `;
    locationInfoElement.innerHTML = locationInfo;
  }

  renderTable("medicine_table", "Medicine Availment", originalDataset);
  addSearchingFunctionality();
  addSortingFunctionality();
}

function renderTable(tableId, label, dataset) {
  const table = document.getElementById(tableId);
  if (!table) {
    console.warn(`⚠️ Skipping table rendering: ${tableId} not found`);
    return;
  }

  const tbody = table.querySelector("tbody");
  tbody.innerHTML = "";

  if (!Array.isArray(dataset) || dataset.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td colspan="3" class="text-center text-muted">No data available.</td>
    `;
    tbody.appendChild(row);
    return;
  }

  dataset.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.id || "N/A"}</td>
      <td>${item.name || "Unknown"}</td>
      <td>${item.availment_count || 0}</td>
    `;
    tbody.appendChild(row);
  });
}

function addSearchingFunctionality() {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;

  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();

    const filtered = originalDataset.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query)
    );

    const dataToRender = query === "" ? originalDataset : filtered;
    renderTable("medicine_table", "Medicine Availment", dataToRender);
  });
}

function addSortingFunctionality() {
  const sortButtons = document.querySelectorAll(".sort-button");
  sortButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const column = parseInt(button.getAttribute("data-column"));
      const order = button.getAttribute("data-order");

      const sorted = [...originalDataset].sort((a, b) => {
        let valA, valB;
        if (column === 0) {
          valA = a.id.toLowerCase();
          valB = b.id.toLowerCase();
        } else if (column === 1) {
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
        } else if (column === 2) {
          valA = a.availment_count;
          valB = b.availment_count;
        }

        if (order === "asc") return valA > valB ? 1 : -1;
        else return valA < valB ? 1 : -1;
      });

      renderTable("medicine_table", "Medicine Availment", sorted);
    });
  });
}
