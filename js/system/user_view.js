import {
  backendURL,
  showNavAdminPages,
  successNotification,
  errorNotification,
  logout,
} from "../utils/utils.js";

showNavAdminPages();

const btn_logout = document.getElementById("btn_logout");
if (btn_logout) {
  btn_logout.addEventListener("click", logout);
}

let stakeholderData = [];

async function fetchData(url, token, tableBody, mapFn, errorMsg) {
  tableBody.innerHTML = '<tr><td colspan="8">Loading...</td></tr>';
  try {
    const response = await fetch(url, {
      credentials: "include",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      stakeholderData = await response.json(); // Save for filtering
      tableBody.innerHTML = stakeholderData.length
        ? stakeholderData.map(mapFn).join("")
        : '<tr><td colspan="8">No data available.</td></tr>';
    } else {
      tableBody.innerHTML =
        '<tr><td colspan="8">Failed to load data.</td></tr>';
      errorNotification(errorMsg);
    }
  } catch (error) {
    tableBody.innerHTML = '<tr><td colspan="8">Error loading data.</td></tr>';
    errorNotification(`An error occurred: ${error.message}`);
  }
}

async function getStakeholder(query = "", order = "asc") {
  const token = localStorage.getItem("token");
  const tableBody = document.querySelector("#myTable tbody");
  if (!tableBody) return;

  const url = `${backendURL}/api/approved-stakeholder?search=${query}&order=${order}`;
  await fetchData(
    url,
    token,
    tableBody,
    (s) => `
      <tr>
        <td>${s.agency_name}</td>
        <td>${s.username}</td>
        <td>${s.barangay}</td>
        <td>${s.municipality}</td>
        <td>${s.province}</td>
      </tr>`,
    "Failed to fetch Stakeholder data."
  );

  populateDropdowns(); // Populate filters after data is fetched
  applyFilters(); // Filter rows based on dropdowns (initially show all)
}

document.addEventListener("DOMContentLoaded", () => {
  getStakeholder();
});

// SEARCH
document.getElementById("searchInput")?.addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase();
  applyFilters(query); // Apply both search and dropdown filters
});

// FILTER EVENT LISTENERS
["barangayFilter", "municipalityFilter", "provinceFilter"].forEach((id) => {
  document.getElementById(id)?.addEventListener("change", () => {
    applyFilters(); // Trigger filtering on any dropdown change
  });
});

// APPLY FILTERS TO TABLE
function applyFilters(searchQuery = "") {
  const brgy = document.getElementById("barangayFilter")?.value || "";
  const muni = document.getElementById("municipalityFilter")?.value || "";
  const prov = document.getElementById("provinceFilter")?.value || "";

  const tableBody = document.querySelector("#myTable tbody");

  const filtered = stakeholderData.filter((s) => {
    const matchesSearch =
      s.agency_name.toLowerCase().includes(searchQuery) ||
      s.username.toLowerCase().includes(searchQuery);
    const matchesBrgy = !brgy || s.barangay === brgy;
    const matchesMuni = !muni || s.municipality === muni;
    const matchesProv = !prov || s.province === prov;

    return matchesSearch && matchesBrgy && matchesMuni && matchesProv;
  });

  tableBody.innerHTML = filtered.length
    ? filtered
        .map(
          (s) => `
      <tr>
        <td>${s.agency_name}</td>
        <td>${s.username}</td>
        <td>${s.barangay}</td>
        <td>${s.municipality}</td>
        <td>${s.province}</td>
      </tr>`
        )
        .join("")
    : '<tr><td colspan="8">No matching stakeholders found.</td></tr>';
}

// POPULATE DROPDOWN FILTERS
function populateDropdowns() {
  const getUnique = (key) => [
    ...new Set(stakeholderData.map((s) => s[key]).filter(Boolean)),
  ];

  populateFilter("barangayFilter", getUnique("barangay"));
  populateFilter("municipalityFilter", getUnique("municipality"));
  populateFilter("provinceFilter", getUnique("province"));
}

function populateFilter(id, values) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML =
    '<option value="">All</option>' +
    values.map((v) => `<option value="${v}">${v}</option>`).join("");
}
