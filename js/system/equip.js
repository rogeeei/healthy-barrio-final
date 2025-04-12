import {
  backendURL,
  showNavAdminPages,
  successNotification,
  errorNotification,
  logout,
  hideBarangayForSuperAdmin,
} from "../utils/utils.js";

showNavAdminPages();
hideBarangayForSuperAdmin();

document.getElementById("btn_logout")?.addEventListener("click", logout);

let currentQuery = "";
let currentColumn = "name"; // Default column for sorting
let currentOrder = "asc"; // Default order for sorting

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const sortButtons = document.querySelectorAll(".sort-button");

  // Initial fetch
  getEquipment();

  // Search handling - Trigger on input change
  searchInput.addEventListener("input", (e) => {
    currentQuery = e.target.value.trim(); // Update search query
    filterAndDisplayEquipment(); // Update table based on search query
  });

  // Sort button handling
  sortButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const column = button.getAttribute("data-column");
      let order = button.getAttribute("data-order");

      // Toggle sorting order if clicking the same column again
      if (currentColumn === column) {
        order = currentOrder === "asc" ? "desc" : "asc";
      } else {
        currentColumn = column;
        order = "asc"; // Default to ascending order when switching columns
      }

      // Set new order to button for visual indication
      button.setAttribute("data-order", order);

      // Update current column and order
      currentOrder = order;

      filterAndDisplayEquipment(); // Update table based on sorting
    });
  });
});

// Fetch equipment data from the API
async function getEquipment() {
  const token = localStorage.getItem("token");
  const tableBody = document.querySelector("#equip_table tbody");

  if (!tableBody) return;

  // Show loading text while fetching data
  tableBody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';

  try {
    const res = await fetch(
      `${backendURL}/api/equipment?search=${encodeURIComponent(
        currentQuery
      )}&column=${currentColumn}&order=${currentOrder}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) throw new Error("Failed to fetch equipment data");

    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("Invalid response format");

    if (data.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5">No data found.</td></tr>';
      return;
    }

    // Store fetched data in a global variable
    window.equipmentData = data;

    // Populate table with the fetched data
    populateTable(data);
  } catch (error) {
    console.error("Error fetching equipment:", error);
    tableBody.innerHTML =
      '<tr><td colspan="5">Error loading data. Please try again later.</td></tr>';
  }
}

function populateTable(data) {
  const tableBody = document.querySelector("#equip_table tbody");

  const rows = data
    .map(
      (equipment) => `
        <tr class="equipment-row" 
            data-id="${equipment.equipment_id}" 
            data-name="${equipment.name}" 
            data-quantity="${equipment.quantity}" 
            data-condition="${equipment.condition}" 
            data-date="${equipment.date_acquired}"
            data-description="${equipment.description}">
          <td>${equipment.equipment_id}</td>
          <td>${equipment.name}</td>
          <td>${equipment.quantity}</td>
          <td>${equipment.condition}</td>
          <td>${equipment.date_acquired}</td>
        </tr>
      `
    )
    .join("");

  tableBody.innerHTML = rows;

  // Attach click event to each row
  document.querySelectorAll(".equipment-row").forEach((row) => {
    row.addEventListener("click", () => {
      const { id, name, quantity, condition, date, description } = row.dataset;
      showEquipmentDetails(id, name, quantity, condition, date, description);
    });
  });
}

// Filter and update the table based on the search query and sorting
function filterAndDisplayEquipment() {
  // Filter equipment based on the search query
  const filteredData = window.equipmentData.filter((equipment) => {
    return (
      equipment.equipment_id
        .toLowerCase()
        .includes(currentQuery.toLowerCase()) ||
      equipment.name.toLowerCase().includes(currentQuery.toLowerCase()) ||
      equipment.quantity.toString().includes(currentQuery) ||
      equipment.condition.toLowerCase().includes(currentQuery.toLowerCase()) ||
      equipment.date_acquired.toLowerCase().includes(currentQuery.toLowerCase())
    );
  });

  // Sort the filtered data based on the current sorting column and order
  const sortedData = filteredData.sort((a, b) => {
    const aValue = a[currentColumn].toString().toLowerCase();
    const bValue = b[currentColumn].toString().toLowerCase();

    if (aValue < bValue) return currentOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return currentOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Update the table with sorted and filtered data
  populateTable(sortedData);
}

function showEquipmentDetails(
  id,
  name,
  quantity,
  condition,
  dateAcquired,
  description
) {
  const modalEl = document.getElementById("equipmentModal");
  modalEl.removeAttribute("inert");
  modalEl.removeAttribute("aria-hidden");

  document.getElementById("equipment_id").textContent = id;
  document.getElementById("equipment_name").textContent = name;
  document.getElementById("equipment_quantity").textContent = quantity;
  document.getElementById("equipment_condition").textContent = condition;
  document.getElementById("equipment_date_acquired").textContent = dateAcquired;
  document.getElementById("equipment_description").textContent =
    description || "N/A";

  const equipmentModal = new bootstrap.Modal(modalEl);
  equipmentModal.show();

  modalEl.addEventListener(
    "hidden.bs.modal",
    () => {
      modalEl.setAttribute("inert", "");
      modalEl.setAttribute("aria-hidden", "true");
    },
    { once: true }
  );
}
