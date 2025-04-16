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

let allEquipmentData = []; // Global storage for filterable data

document.addEventListener("DOMContentLoaded", async () => {
  await fetchEquipmentReports();

  // Event listeners for dropdown filters
  document
    .getElementById("barangayFilter")
    .addEventListener("change", applyFilters);
  document
    .getElementById("municipalityFilter")
    .addEventListener("change", applyFilters);
  document
    .getElementById("provinceFilter")
    .addEventListener("change", applyFilters);
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
    allEquipmentData = data;

    populateDropdownFilters(data); // Populate filters
    displayEquipmentReports(data); // Display full table
  } catch (error) {
    console.error("Error fetching equipment reports:", error);
    errorNotification("Failed to load equipment data.");
  }
}

/** Display Equipment Reports in a Table */
function displayEquipmentReports(data) {
  const tbody = document.querySelector("#equipmentTable tbody");
  tbody.innerHTML = ""; // Clear previous rows

  if (!data || !Array.isArray(data) || data.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td colspan="6" style="text-align: center; color: gray; font-style: italic;">
        No data available.
      </td>
    `;
    tbody.appendChild(row);
    return;
  }

  data.forEach((barangayData) => {
    const { barangay, municipality, province, equipment } = barangayData;

    equipment.forEach((equip) => {
      const row = document.createElement("tr");

      row.innerHTML = `
  <td style="text-align: center; font-family: 'Helvetica', 'Arial', sans-serif !important">${equip.name}</td>
  <td style="text-align: center; font-family: 'Helvetica', 'Arial', sans-serif !important">${equip.total_quantity}</td>
  <td style="text-align: center; font-family: 'Helvetica', 'Arial', sans-serif !important">${barangay}</td>
  <td style="text-align: center; font-family: 'Helvetica', 'Arial', sans-serif !important">${municipality}</td>
  <td style="text-align: center; font-family: 'Helvetica', 'Arial', sans-serif !important">${province}</td>
`;

      tbody.appendChild(row);
    });
  });
}

/** Populate filter dropdowns */
function populateDropdownFilters(data) {
  const barangaySet = new Set();
  const municipalitySet = new Set();
  const provinceSet = new Set();

  data.forEach((item) => {
    barangaySet.add(item.barangay);
    municipalitySet.add(item.municipality);
    provinceSet.add(item.province);
  });

  fillDropdown("barangayFilter", Array.from(barangaySet));
  fillDropdown("municipalityFilter", Array.from(municipalitySet));
  fillDropdown("provinceFilter", Array.from(provinceSet));
}

/** Fill a dropdown with sorted values */
function fillDropdown(dropdownId, values) {
  const select = document.getElementById(dropdownId);
  select.innerHTML = '<option value="">All</option>';

  values.sort().forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

/** Apply filters */
function applyFilters() {
  const selectedBarangay = document.getElementById("barangayFilter").value;
  const selectedMunicipality =
    document.getElementById("municipalityFilter").value;
  const selectedProvince = document.getElementById("provinceFilter").value;

  const filteredData = allEquipmentData.filter((item) => {
    const matchBarangay =
      selectedBarangay === "" || item.barangay === selectedBarangay;
    const matchMunicipality =
      selectedMunicipality === "" || item.municipality === selectedMunicipality;
    const matchProvince =
      selectedProvince === "" || item.province === selectedProvince;

    return matchBarangay && matchMunicipality && matchProvince;
  });

  displayEquipmentReports(filteredData);
}
