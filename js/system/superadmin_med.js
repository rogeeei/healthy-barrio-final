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
let allMedicineData = []; // Store fetched data globally for filtering

document.addEventListener("DOMContentLoaded", async () => {
  await fetchMedicineReports();

  // Add event listeners for dropdown filters
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

/** Fetch and Display Medicine Reports by Barangay */
async function fetchMedicineReports() {
  try {
    const response = await fetch(`${backendURL}/api/medicines/by-barangay`, {
      credentials: "include",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch medicine data: ${response.status}`);
    }

    const data = await response.json();
    allMedicineData = data; // Store for filtering

    populateDropdownFilters(data); // Populate filters once
    displayMedicineReports(data); // Display full data initially
  } catch (error) {
    console.error("Error fetching medicine reports:", error);
    errorNotification("Failed to load medicine data.");
  }
}

function displayMedicineReports(data) {
  const tbody = document.querySelector("#medicineTable tbody");
  tbody.innerHTML = ""; // Clear previous content

  // Check if there's no data to display
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

  // Populate the table with the data
  data.forEach((barangayData) => {
    const { barangay, municipality, province, medicines } = barangayData;

    medicines.forEach((medicine) => {
      const row = document.createElement("tr");

      row.innerHTML = `
  <td style="text-align: center; font-family: 'Helvetica', 'Arial', sans-serif !important">${medicine.name}</td>
  <td style="text-align: center; font-family: 'Helvetica', 'Arial', sans-serif !important">${medicine.total_quantity}</td>
  <td style="text-align: center; font-family: 'Helvetica', 'Arial', sans-serif !important">${medicine.unit}</td>
  <td style="text-align: center; font-family: 'Helvetica', 'Arial', sans-serif !important">${medicine.expiration_date}</td>
  <td style="text-align: center; font-family: 'Helvetica', 'Arial', sans-serif !important">${barangay}</td>
  <td style="text-align: center; font-family: 'Helvetica', 'Arial', sans-serif !important">${municipality}</td>
  <td style="text-align: center; font-family: 'Helvetica', 'Arial', sans-serif !important">${province}</td>
`;

      tbody.appendChild(row);
    });
  });
}

/** Populate filter dropdowns with unique values */
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

/** Helper to fill a dropdown with sorted options */
function fillDropdown(dropdownId, values) {
  const select = document.getElementById(dropdownId);
  select.innerHTML = '<option value="">All</option>'; // Reset

  values.sort().forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

/** Apply filters based on dropdown selections */
function applyFilters() {
  const selectedBarangay = document.getElementById("barangayFilter").value;
  const selectedMunicipality =
    document.getElementById("municipalityFilter").value;
  const selectedProvince = document.getElementById("provinceFilter").value;

  const filteredData = allMedicineData.filter((item) => {
    const matchBarangay =
      selectedBarangay === "" || item.barangay === selectedBarangay;
    const matchMunicipality =
      selectedMunicipality === "" || item.municipality === selectedMunicipality;
    const matchProvince =
      selectedProvince === "" || item.province === selectedProvince;

    return matchBarangay && matchMunicipality && matchProvince;
  });

  // Check if filtered data is empty and show "No data available" message if true
  if (filteredData.length === 0) {
    const tbody = document.querySelector("#medicineTable tbody");
    tbody.innerHTML = ""; // Clear any existing rows
    const row = document.createElement("tr");
    row.innerHTML = `
      <td colspan="6" style="text-align: center; color: gray; font-style: italic;">
        No data available.
      </td>
    `;
    tbody.appendChild(row);
  } else {
    displayMedicineReports(filteredData); // Display filtered data
  }
}
