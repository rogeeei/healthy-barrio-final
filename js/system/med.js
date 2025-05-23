import {
  backendURL,
  successNotification,
  errorNotification,
  logout,
  showNavAdminPages,
} from "../utils/utils.js";

showNavAdminPages();
// Logout Button
const btn_logout = document.getElementById("btn_logout");
if (btn_logout) {
  btn_logout.addEventListener("click", logout);
}

// Track medicines that were updated to prevent re-highlighting
const updatedMedicines = new Set();

// Fetch and display medicine data
async function getMedicine(query = "") {
  const token = localStorage.getItem("token");
  const tableBody = document.querySelector("#medicine_table tbody");

  if (!token) {
    console.error("Token is missing or invalid.");
    return;
  }

  tableBody.innerHTML = '<tr><td colspan="8">Loading...</td></tr>';

  try {
    const response = await fetch(`${backendURL}/api/medicine?search=${query}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      tableBody.innerHTML =
        '<tr><td colspan="8">Failed to load data.</td></tr>';
      errorNotification("Failed to fetch medicine data.");
      return;
    }

    const json = await response.json();
    if (!json.length) {
      tableBody.innerHTML =
        '<tr><td colspan="8">No medicine data available.</td></tr>';
      return;
    }

    // Flag for the specific notification (low stock or near expiration)
    let lowStockNotified = false;
    let expirationNotified = false;

    const tableContent = json
      .filter((m) => m.quantity > 0)
      .map((m) => {
        const low = m.quantity < 10 && !updatedMedicines.has(m.medicine_id);

        // Check if expiration date is near (within 7 days)
        const expirationDate = new Date(m.expiration_date);
        const today = new Date();
        const timeDiff = expirationDate - today;
        const daysToExpire = timeDiff / (1000 * 3600 * 24); // Convert ms to days

        // Highlight in red if quantity is low or expiration is near (within 7 days)
        const isExpirationNear = daysToExpire <= 7;

        // Notify when stock is low
        if (low && !lowStockNotified) {
          errorNotification(`Medicine "${m.name}" is running low on stock.`);
          lowStockNotified = true;
        }

        // Notify when expiration is near
        if (isExpirationNear && !expirationNotified) {
          errorNotification(`Medicine "${m.name}" is nearing expiration.`);
          expirationNotified = true;
        }

        return `
      <tr data-id="${m.medicine_id}" class="${
          low || isExpirationNear ? "table-danger" : ""
        }">
        <td>${m.medicine_id}</td>
        <td>${m.name}</td>
        <td>${m.quantity}</td>
        <td>${m.expiration_date}</td>
        <td>${m.date_acquired}</td>
        <td>
          <button class="btn btn-sm update-btn" data-id="${m.medicine_id}">
            Update
          </button>
        </td>
      </tr>`;
      })
      .join("");

    tableBody.innerHTML = tableContent;

    // Remove red from duplicates (old batch rows)
    const seen = new Set();
    document.querySelectorAll("#medicine_table tbody tr").forEach((row) => {
      const id = row.getAttribute("data-id");
      if (seen.has(id)) {
        row.classList.remove("table-danger");
      } else {
        seen.add(id);
      }
    });

    // Attach row-click and update-button listeners
    document.querySelectorAll("#medicine_table tbody tr").forEach((row) => {
      row.addEventListener("click", (e) => {
        if (!e.target.classList.contains("update-btn")) {
          showMedicineDetailsModal(row.dataset.id);
        }
      });
    });

    document.querySelectorAll(".update-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        showModal(btn.dataset.id);
      });
    });
  } catch (err) {
    tableBody.innerHTML = '<tr><td colspan="8">Error loading data.</td></tr>';
    errorNotification("An error occurred: " + err.message);
  }
}

// Handle the update medicine form submission
document.addEventListener("DOMContentLoaded", function () {
  const updateForm = document.getElementById("form_update_medicine");
  if (updateForm) {
    updateForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const medicineIdInput = document.getElementById("update_medicine_id");
      const quantityInput = document.getElementById("update_quantity");
      const dateAcquiredInput = document.getElementById("update_date_acquired");
      const expiredDateInput = document.getElementById(
        "update_expiration_date"
      );
      const batchNumberInput = document.getElementById("update_batch_no");
      const saveButton = document.querySelector(".btn_save");

      if (!medicineIdInput || !quantityInput || !dateAcquiredInput) {
        errorNotification("Some form elements are missing.");
        return;
      }

      const medicineId = medicineIdInput.value;
      const quantity = quantityInput.value;
      const dateAcquired = dateAcquiredInput.value;
      const expiredDate = expiredDateInput.value;
      const batchNumber = batchNumberInput.value;

      if (
        !medicineId ||
        !quantity ||
        !dateAcquired ||
        !expiredDate ||
        !batchNumber
      ) {
        errorNotification("All fields are required.");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        console.log("Unauthorized: Missing authentication token.");
        return;
      }

      try {
        saveButton.innerHTML =
          'Saving... <span class="spinner-border spinner-border-sm"></span>';
        saveButton.disabled = true;

        const response = await fetch(
          `${backendURL}/api/medicine/${medicineId}/update-stock`,
          {
            credentials: "include",
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              quantity: parseInt(quantity, 10),
              date_acquired: dateAcquired,
              expiration_date: expiredDate,
              batch_no: batchNumber,
            }),
          }
        );

        const result = await response.json();

        if (response.ok) {
          // Track this medicine as updated so it doesn't get red highlight again
          updatedMedicines.add(medicineId);

          // Refresh medicine data to reflect changes
          await getMedicine();

          // Close the modal
          const closeButton = document.querySelector(
            '[data-bs-dismiss="modal"]'
          );
          if (closeButton) {
            closeButton.click();
          }

          // Clear the update form
          clearForm();
        } else {
          errorNotification(
            result.message || "Failed to update medicine stock."
          );
        }
      } catch (error) {
        errorNotification("An error occurred: " + error.message);
      } finally {
        saveButton.innerHTML = "Save";
        saveButton.disabled = false;
      }
    });
  }
});

// Function to show the Medicine Details Modal
function showMedicineDetailsModal(medicineId) {
  const modalElement = document.getElementById("medicineModal");

  // Initialize the Bootstrap modal
  const medicineModal = new bootstrap.Modal(modalElement);

  // Fetch medicine details based on medicineId
  const token = localStorage.getItem("token");

  if (!token) {
    console.error("Token is missing or invalid.");
    return;
  }

  fetch(`${backendURL}/api/medicine/${medicineId}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => response.json())
    .then((medicine) => {
      // Populate modal fields with fetched data
      document.getElementById("medicine_id").textContent = medicine.medicine_id;
      document.getElementById("medicine_name").textContent = medicine.name;
      document.getElementById("medicine_usage_description").textContent =
        medicine.usage_description;
      document.getElementById("medicine_unit").textContent = medicine.unit;
      document.getElementById("medicine_batch_no").textContent =
        medicine.batch_no;
      document.getElementById("medicine_quantity").textContent =
        medicine.quantity;
      document.getElementById("medicine_status").textContent =
        medicine.medicine_status;
      document.getElementById("medicine_expiration_date").textContent =
        medicine.expiration_date;
      document.getElementById("medicine_date_acquired").textContent =
        medicine.date_acquired;

      // Show the modal
      medicineModal.show();
    })
    .catch((error) => {
      console.error("Error fetching medicine details:", error);
    });
}

// Sorting functionality
let sortOrder = {
  0: "asc", // ID column
  1: "asc", // Name column
  2: "asc", // Quantity column
  3: "asc", // Expiration Date column
  4: "asc", // Acquired Date column
};

// Sort table data based on the column and order
function sortTable(columnIndex) {
  const tableBody = document.querySelector("#medicine_table tbody");
  const rows = Array.from(tableBody.rows);

  const sortedRows = rows.sort((rowA, rowB) => {
    const cellA = rowA.cells[columnIndex].textContent.trim();
    const cellB = rowB.cells[columnIndex].textContent.trim();

    let comparison = 0;

    // Sort data based on type (numeric or string)
    if (columnIndex === 2) {
      // Quantity column
      comparison = parseInt(cellA) - parseInt(cellB);
    } else if (columnIndex === 3 || columnIndex === 4) {
      // Date columns
      comparison = new Date(cellA) - new Date(cellB);
    } else {
      // String columns (ID, Name)
      comparison = cellA.localeCompare(cellB);
    }

    // Reverse the order if it's descending
    if (sortOrder[columnIndex] === "desc") {
      comparison = -comparison;
    }

    return comparison;
  });

  // Clear existing rows and append sorted rows
  tableBody.innerHTML = "";
  tableBody.append(...sortedRows);

  // Toggle the sort order for the next click
  sortOrder[columnIndex] = sortOrder[columnIndex] === "asc" ? "desc" : "asc";

  // Update the sort arrows for each column
  updateSortArrows(columnIndex);
}

// Update sort arrows for each column
function updateSortArrows(columnIndex) {
  const allSortButtons = document.querySelectorAll(".sort-button");

  allSortButtons.forEach((button) => {
    const targetColumn = button.getAttribute("data-column");
    const icon = button.querySelector("i");

    if (parseInt(targetColumn) === columnIndex) {
      icon.classList.remove("fa-arrow-up", "fa-arrow-down");
      if (sortOrder[columnIndex] === "asc") {
        icon.classList.add("fa-arrow-up");
      } else {
        icon.classList.add("fa-arrow-down");
      }
    } else {
      icon.classList.remove("fa-arrow-up", "fa-arrow-down");
      icon.classList.add("fa-arrow-up");
    }
  });
}

document.querySelectorAll(".sort-button").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();

    const buttonEl = event.currentTarget;
    const columnIndex = parseInt(buttonEl.getAttribute("data-column"));
    const order = buttonEl.getAttribute("data-order");

    // Update sort order explicitly
    sortOrder[columnIndex] = order;
    sortTable(columnIndex);
  });
});

// Debounce function for search input (optional, improves performance)
function debounce(func, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}

// Client-side search: filter table rows based on search input
function filterTable(query) {
  query = query.toLowerCase();
  const table = document.getElementById("medicine_table");
  const tbody = table.querySelector("tbody");
  const rows = tbody.getElementsByTagName("tr");

  // Loop through all table rows and hide those that don't match
  Array.from(rows).forEach((row, rowIndex) => {
    // Skip header if it's in tbody, else loop all
    const cells = row.getElementsByTagName("td");
    let rowMatches = false;
    Array.from(cells).forEach((cell) => {
      if (cell.textContent.toLowerCase().indexOf(query) > -1) {
        rowMatches = true;
      }
    });
    row.style.display = rowMatches ? "" : "none";
  });
}

// Setup event listeners when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Fetch medicine data initially (without filtering)
  getMedicine();

  // Setup search input functionality for client-side filtering
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    // Debounce the search for performance
    const debouncedFilter = debounce(() => {
      const query = searchInput.value.trim();
      // Call client-side filter function
      filterTable(query);
    }, 300);
    searchInput.addEventListener("input", debouncedFilter);
  }
});
// Function to show the modal
function showModal(medicineId) {
  const modalElement = document.getElementById("update_medicine_modal");

  // Initialize the Bootstrap modal
  const updateMedicineModal = new bootstrap.Modal(modalElement);

  // Set the medicine ID in the hidden input field for the modal form
  document.getElementById("update_medicine_id").value = medicineId;

  // Show the modal using Bootstrap's JS method
  updateMedicineModal.show();

  // Ensure the first input field is focused (if necessary)
  document.getElementById("update_quantity").focus();

  // Remove the backdrop in case it covers the modal (optional)
  const backdrop = document.querySelector(".modal-backdrop");
  if (backdrop) {
    backdrop.parentNode.removeChild(backdrop);
  }
}
// Clear update form fields after update
function clearForm() {
  document.getElementById("update_medicine_id").value = "";
  document.getElementById("update_quantity").value = "";
  document.getElementById("update_date_acquired").value = "";
}
