import {
  backendURL,
  showNavAdminPages,
  errorNotification,
  fetchUserDetails,
  updateSideNav,
  successNotification,
  logout,
  fetchWithAuth,
  hideBarangayForSuperAdmin,
} from "../utils/utils.js";

// Show Admin Pages
showNavAdminPages();
fetchUserDetails();
updateSideNav();
hideBarangayForSuperAdmin();

// Logout Button
const btn_logout = document.getElementById("btn_logout");
if (btn_logout) {
  btn_logout.addEventListener("click", logout);
}

// Helper function to display error notifications
function handleError(message) {
  console.error(message);
}

document.addEventListener("DOMContentLoaded", () => {
  fetchCitizensByBarangay();
});

async function fetchCitizensByBarangay() {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${backendURL}/api/citizens/barangay`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Failed to fetch citizens.");

    const data = await response.json();

    if (data.success) {
      displayCitizens(data.data);
    } else {
    }
  } catch (error) {
    console.error("Error fetching citizens:", error);
  }
}

function displayCitizens(citizens) {
  const tableBody = document.querySelector("table tbody");

  if (!tableBody) {
    console.error("Table body not found.");
    return;
  }

  if (Array.isArray(citizens) && citizens.length > 0) {
    citizens.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    tableBody.innerHTML = citizens
      .map(
        (citizen) => `
        <tr>
          <td>${citizen.lastname || "N/A"}</td>
          <td>${citizen.firstname || "N/A"}</td>
          <td>${citizen.gender || "N/A"}</td>
          <td>${calculateAge(citizen.date_of_birth) || "N/A"}</td>
          <td>${citizen.purok || "N/A"}</td>
          <td>
            <button class="add_btn btn-sm" data-citizen-id="${
              citizen.citizen_id
            }">
              Add Transaction
            </button>
          </td>
          <td>
            <button class="view_btn btn-sm viewCitizen" data-citizen-id="${
              citizen.citizen_id
            }">
              View
            </button>
          </td>
          <td>
            <button class="edit_btn btn-sm editCitizen" data-citizen-id="${
              citizen.citizen_id
            }">
              Edit
            </button>
          </td> 
        </tr>`
      )
      .join("");

    //  Attach event listeners immediately after updating table
    document.querySelectorAll(".viewCitizen").forEach((button) => {
      button.addEventListener("click", function () {
        const citizenId = this.dataset.citizenId;

        viewCitizen(citizenId);
      });
    });

    document.querySelectorAll(".editCitizen").forEach((button) => {
      button.addEventListener("click", function () {
        const citizenId = this.dataset.citizenId;

        editCitizen(citizenId);
      });
    });
  } else {
    tableBody.innerHTML = "<tr><td colspan='8'>No citizens found.</td></tr>";
  }
}

// Function to fetch services and populate the dropdown
async function fetchServices() {
  try {
    const response = await fetchWithAuth(
      `${backendURL}/api/services-by-barangay`
    );
    if (!response.ok) throw new Error("Failed to fetch services");

    const services = await response.json();
    const serviceSelect = document.getElementById("serviceAvailed");

    serviceSelect.innerHTML =
      '<option value="" selected disabled>Select a Service</option>';

    services.forEach((service) => {
      const option = document.createElement("option");
      option.value = service.id;
      option.textContent = service.name;
      serviceSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error fetching services:", error);
  }
}

// Function to fetch medicines and populate the dropdown
async function fetchMedicines() {
  try {
    const response = await fetch(`${backendURL}/api/medicines/available`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    // Find all medicine dropdowns
    const medicineDropdowns = document.querySelectorAll(".medicineAvailed");

    if (!medicineDropdowns.length) {
      console.error("No medicine dropdown found.");
      return;
    }

    // Populate each dropdown
    medicineDropdowns.forEach((selectElement) => {
      selectElement.innerHTML = ""; // Clear existing options

      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Select a Medicine";
      defaultOption.disabled = true;
      defaultOption.selected = true;
      selectElement.appendChild(defaultOption);

      data.forEach((medicine) => {
        const option = document.createElement("option");
        option.value = medicine.medicine_id;
        option.textContent = medicine.name;
        selectElement.appendChild(option);
      });
    });
  } catch (error) {
    console.error("Error fetching medicines:", error);
  }
}

//Add Transaction Button
window.addTransaction = function (citizenId) {
  // Ensure the citizen ID is set before showing the modal
  document.getElementById("citizen_id").value = citizenId;

  fetchServices();
  fetchMedicines();

  const transactionModal = new bootstrap.Modal(
    document.getElementById("transactionModal")
  );
  transactionModal.show();
};

//Handle Add Transaction
document.addEventListener("DOMContentLoaded", function () {
  document.addEventListener("click", function (event) {
    if (event.target && event.target.classList.contains("add_btn")) {
      const citizenId = event.target.getAttribute("data-citizen-id");
      addTransaction(citizenId);
    }
  });

  document.getElementById("addMedicine").addEventListener("click", function () {
    const medicineList = document.getElementById("medicineList");

    const newRow = document.createElement("div");
    newRow.classList.add(
      "medicine-row",
      "d-flex",
      "align-items-center",
      "mt-2"
    );

    newRow.innerHTML = `
      <select class="form-select medicineAvailed" required>
        <option value="" selected disabled>Select a Medicine</option>
      </select>
      <input type="number" class="form-control medicineQuantity ms-2" min="1" value="1" placeholder="Quantity" required />
      <input type="text" class="form-control medicineUnitInput ms-2" placeholder="Enter Unit" required />
      <button type="button" class="btn btn-danger ms-2 removeMedicine">❌</button>
    `;

    medicineList.appendChild(newRow);
    populateMedicineDropdown(newRow.querySelector(".medicineAvailed"));

    //  Remove medicine row when clicking the remove button
    newRow
      .querySelector(".removeMedicine")
      .addEventListener("click", function () {
        newRow.remove();
      });
  });

  document
    .getElementById("transactionForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const submitButton = e.target.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.innerHTML = `<div class="spinner-border me-2" role="status"></div><span>Saving...</span>`;

      const citizenId = document.getElementById("citizen_id").value;
      const serviceId = document.getElementById("serviceAvailed").value;

      const medicineRows = document.querySelectorAll(".medicine-row");
      let medicines = [];

      medicineRows.forEach((row) => {
        const medicineSelect = row.querySelector(".medicineAvailed");
        const medicineId = medicineSelect ? medicineSelect.value : null;
        const quantityInput = row.querySelector(".medicineQuantity");
        const quantity = quantityInput ? parseInt(quantityInput.value, 10) : 0;
        const unitInput = row.querySelector(".medicineUnitInput");

        let unit =
          unitInput && unitInput.value.trim() ? unitInput.value.trim() : "N/A";

        if (medicineId && quantity > 0) {
          medicines.push({
            medicine_id: medicineId,
            quantity: quantity,
            unit: unit,
          });
        }
      });

      const bloodPressureInput = document.getElementById("blood_pressure");
      const bloodPressure = bloodPressureInput
        ? bloodPressureInput.value.trim()
        : null;

      const transactionData = {
        citizen_id: citizenId,
        service_id: serviceId,
        blood_pressure: bloodPressure,
        medicines: medicines,
      };

      try {
        const response = await fetch(`${backendURL}/api/transactions`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(transactionData),
        });

        const jsonResponse = await response.json();

        if (response.ok) {
          document.getElementById("transactionForm").reset();
          bootstrap.Modal.getInstance(
            document.getElementById("transactionModal")
          )?.hide();
        } else {
          errorNotification(jsonResponse.message);
        }
      } catch (error) {
        errorNotification("An error occurred: " + error.message);
      } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = `Submit`;
      }
    });

  function populateMedicineDropdown(selectElement) {
    fetch(`${backendURL}/api/medicine`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (!data || data.length === 0) {
          console.warn("No medicines found for this user.");
          selectElement.innerHTML = `<option value="" selected disabled>No Medicines Available</option>`;
          return;
        }

        selectElement.innerHTML = `<option value="" selected disabled>Select a Medicine</option>`;
        data.forEach((medicine) => {
          selectElement.innerHTML += `<option value="${medicine.medicine_id}" data-quantity="${medicine.quantity}">${medicine.name}</option>`;
        });
      })
      .catch((error) => console.error("Error fetching medicines:", error));
  }
});

// Function to calculate age from birthdate
function calculateAge(birthdate) {
  if (!birthdate) return "N/A";
  const birthDate = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

// Open "Add Citizen" form modal
function addCitizen() {
  document.getElementById("form_citizen").reset();
  document.getElementById("citizen_id").value = "";

  const modalElement = document.getElementById("citizen_form_modal");
  if (!modalElement) {
    console.error("Modal element not found!");
    return;
  }

  //  Ensure barangay dropdown is populated when adding a citizen
  populateBarangayDropdown();

  const myModal = new bootstrap.Modal(modalElement);
  myModal.show();
}

// Viewing Citizen
function viewCitizen(citizenId) {
  if (!citizenId) {
    console.error("Citizen ID is missing!");
    return;
  }

  //  Force page navigation
  window.location.assign(`/profiling.html?citizen_id=${citizenId}`);
}

// Editing Citizen
async function editCitizen(id) {
  try {
    const response = await fetchWithAuth(`${backendURL}/api/citizen/${id}`);

    if (response.ok) {
      const citizen = await response.json();

      //  Load barangays first, then populate the form
      await populateBarangayDropdown(citizen.barangay);
      populateCitizenForm(citizen);

      const modalElement = document.getElementById("citizen_form_modal");
      if (!modalElement) {
        console.error("Modal element not found!");
        return;
      }

      const modal = new bootstrap.Modal(modalElement, { keyboard: false });
      modal.show();
    } else {
      console.error("Failed to fetch citizen. HTTP-Error: " + response.status);
    }
  } catch (error) {
    console.error("An error occurred while fetching citizen data:", error);
  }
}

// Populate citizen form for editing
function populateCitizenForm(citizen) {
  const fields = [
    "citizen_id",
    "firstname",
    "middle_name",
    "lastname",
    "suffix",
    "purok",
    "municipality",
    "province",
    "date_of_birth",
    "blood_type",
    "height",
    "weight",
    "allergies",
    "medication",
    "emergency_contact_name",
    "emergency_contact_no",
  ];

  // Set values for text inputs
  fields.forEach((field) => {
    const inputElement = document.getElementById(field);
    if (inputElement) {
      inputElement.value = citizen[field] || "";
    }
  });

  //  Set Barangay in Dropdown
  const barangaySelect = document.getElementById("barangay");
  if (barangaySelect) {
    barangaySelect.value = citizen.barangay || "";
  }

  //  Set the gender dropdown
  const genderSelect = document.getElementById("gender");
  if (genderSelect) {
    const genderValue = citizen.gender || "";
    const genderOption = genderSelect.querySelector(
      `option[value="${genderValue}"]`
    );

    if (genderOption) {
      genderSelect.value = genderValue;
    } else {
      console.warn(
        `Gender value "${genderValue}" not found in dropdown options.`
      );
    }
  }
}

// Populate Barangay Dropdown
async function populateBarangayDropdown(selectedBarangay = "") {
  const barangaySelect = document.getElementById("barangay");

  if (!barangaySelect) {
    console.error("Dropdown element #barangay not found!");
    return;
  }

  barangaySelect.innerHTML = `<option value="" disabled selected>Loading...</option>`;

  try {
    const response = await fetch(`${backendURL}/api/all-barangays`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok)
      throw new Error(`Failed to fetch barangays: ${response.status}`);

    const data = await response.json();

    if (!data.barangays || data.barangays.length === 0) {
      barangaySelect.innerHTML = `<option value="" disabled>No Barangays Found</option>`;
      return;
    }

    // Populate dropdown with fetched barangays
    barangaySelect.innerHTML = `<option value="" disabled selected></option>`;
    data.barangays.forEach((barangay) => {
      const option = document.createElement("option");
      option.value = barangay;
      option.textContent = barangay;
      if (barangay === selectedBarangay) {
        option.selected = true;
      }
      barangaySelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error fetching barangays:", error);
    barangaySelect.innerHTML = `<option value="" disabled>Error loading data</option>`;
  }
}

// Run function when the page loads
document.addEventListener("DOMContentLoaded", async function () {
  await populateBarangayDropdown();
});

// Handle Form Submission for Citizen
document
  .getElementById("form_citizen")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = `<div class="me-2" role="status"></div><span>Saving...</span>`;

    try {
      const formData = new FormData(document.getElementById("form_citizen"));
      const formObject = Object.fromEntries(formData.entries());
      const citizenId = document.getElementById("citizen_id").value;

      const method = citizenId ? "PUT" : "POST";
      const endpoint = citizenId
        ? `${backendURL}/api/citizen/${citizenId}`
        : `${backendURL}/api/citizen`;

      const response = await fetchWithAuth(endpoint, {
        method,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formObject),
      });

      if (response.ok) {
        // Reset the form properly before hiding
        document.getElementById("form_citizen").reset();

        // Hide the modal properly
        const modalElement = document.getElementById("citizen_form_modal");
        if (modalElement) {
          const modalInstance = bootstrap.Modal.getInstance(modalElement);
          if (modalInstance) {
            modalInstance.hide();
          } else {
            console.warn(
              "Modal instance not found, trying alternative method."
            );
            const modal = new bootstrap.Modal(modalElement);
            modal.hide();
          }
        } else {
          console.error("Modal element not found!");
        }

        // Refresh the citizen list
        fetchCitizensByBarangay();
      } else {
        const jsonResponse = await response.json();
        errorNotification(jsonResponse.message || "An error occurred");
      }
    } catch (error) {
      errorNotification("An error occurred: " + error.message);
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = `Submit`;
    }
  });

//Blood Pressure
document
  .getElementById("serviceAvailed")
  .addEventListener("change", function () {
    const selectedService = this.options[this.selectedIndex].text.toLowerCase();
    const bloodPressureField = document
      .getElementById("blood_pressure")
      .closest(".form-floating");

    if (
      selectedService.includes("bp") ||
      selectedService.includes("blood pressure")
    ) {
      bloodPressureField.style.display = "block";
    } else {
      bloodPressureField.style.display = "none";
      document.getElementById("blood_pressure").value = ""; // Reset value when hidden
    }
  });

document.addEventListener("DOMContentLoaded", function () {
  const table = document.getElementById("citizen_table");
  const tbody = table.querySelector("tbody");
  const searchInput = document.getElementById("searchInput");
  const sortButtons = table.querySelectorAll(".sort-button");

  if (!table || !tbody) {
    console.error("❌ Table or tbody not found!");
    return;
  }

  //  Search Function
  function searchTable() {
    const filter = searchInput.value.toLowerCase();
    const rows = tbody.querySelectorAll("tr");

    rows.forEach((row) => {
      const cells = Array.from(row.cells);
      const matches = cells.some((cell) =>
        cell.textContent.toLowerCase().includes(filter)
      );
      row.style.display = matches ? "" : "none";
    });
  }

  // Attach search event listeners
  searchInput.addEventListener("input", searchTable);
  searchInput.addEventListener("keypress", async (e) => {
    if (e.key === "Enter") {
      const query = e.target.value.trim();
      await fetchCitizensByBarangay(query);
    }
  });

  // Sorting functionality
  sortButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const columnIndex = Array.from(this.closest("tr").children).indexOf(
        this.closest("th")
      );
      const order = this.getAttribute("data-order") || "asc";

      sortTable(tbody, columnIndex, order);

      // Toggle sort order for next click
      this.setAttribute("data-order", order === "asc" ? "desc" : "asc");
    });
  });

  function sortTable(tbody, columnIndex, order) {
    const rows = Array.from(tbody.querySelectorAll("tr"));

    rows.sort((rowA, rowB) => {
      const cellA = rowA.cells[columnIndex].textContent.trim();
      const cellB = rowB.cells[columnIndex].textContent.trim();

      if (!isNaN(cellA) && !isNaN(cellB)) {
        return order === "asc"
          ? Number(cellA) - Number(cellB)
          : Number(cellB) - Number(cellA);
      } else {
        return order === "asc"
          ? cellA.localeCompare(cellB)
          : cellB.localeCompare(cellA);
      }
    });

    rows.forEach((row) => tbody.appendChild(row));
  }
});

//citizen modal
document.addEventListener("DOMContentLoaded", async () => {
  await loadPurokOptions();
  populateDropdown("weight", generateNumberOptions(20, 200, "kg"));
  populateDropdown("height", generateNumberOptions(50, 250, "cm"));
});

/** ✅ Load Purok Options Dynamically */
async function loadPurokOptions() {
  try {
    const response = await fetch(`${backendURL}/api/puroks`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const puroks = await response.json();

    const purokSelect = document.getElementById("purok");
    purokSelect.innerHTML = ``; // Reset dropdown

    if (Array.isArray(puroks.data) && puroks.data.length > 0) {
      puroks.data.forEach((purok) => {
        const option = document.createElement("option");
        option.value = purok;
        option.textContent = purok;
        purokSelect.appendChild(option);
      });
    } else {
      console.warn("⚠️ No purok data found.");
    }
  } catch (error) {
    console.error("❌ Error loading purok options:", error);
  }
}

/** ✅ Generate Number Options (For Weight & Height) */
function generateNumberOptions(min, max, unit) {
  let options = ``;
  for (let i = min; i <= max; i++) {
    options += `<option value="${i}">${i} ${unit}</option>`;
  }
  return options;
}

/** ✅ Populate a Dropdown with Given Options */
function populateDropdown(elementId, optionsHTML) {
  const selectElement = document.getElementById(elementId);
  if (selectElement) {
    selectElement.innerHTML = optionsHTML;
  } else {
    console.error(`❌ Dropdown ${elementId} not found!`);
  }
}
