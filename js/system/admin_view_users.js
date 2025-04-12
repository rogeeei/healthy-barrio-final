import {
  backendURL,
  showNavAdminPages,
  successNotification,
  errorNotification,
  logout,
} from "../utils/utils.js";

// Logout Button
const btn_logout = document.getElementById("btn_logout");
if (btn_logout) {
  btn_logout.addEventListener("click", logout);
}

// Function to display tables based on type (admin/user/stakeholder)
function showTable(type) {
  const tables = ["users_table", "stakeholders_table"];
  tables.forEach((table) => {
    document.getElementById(table).classList.toggle("d-none", table !== type);
  });
}

// Initial call to show the admin table on load
document.addEventListener("DOMContentLoaded", function () {
  showTable("users_table"); // Show the admin table by default
  getUsers(); // Fetch and display data for the admin table
});

// Fetch and display data (generic function)
async function fetchData(url, token, tableBody, mapFn, errorMsg) {
  tableBody.innerHTML = '<tr><td colspan="8">Loading...</td></tr>';
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const json = await response.json();
      tableBody.innerHTML = json.length
        ? json.map(mapFn).join("")
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

// Fetch and display users data
async function getUsers(query = "", order = "asc") {
  const token = localStorage.getItem("token");
  const tableBody = document.querySelector("#users_table tbody");
  const url = `${backendURL}/api/bhw?search=${query}&order=${order}`;

  await fetchData(
    url,
    token,
    tableBody,
    (user) => `
      <tr>
        <td>${user.user_id}</td>
        <td>${user.firstname}</td>
        <td>${user.lastname}</td>
        <td>${user.middle_name}</td>
        <td>${user.email}</td>
        <td>${user.phone_number}</td>
      </tr>`,
    "Failed to fetch User data."
  );
}

// Fetch and display stakeholder data
async function getStakeholder(query = "", order = "asc") {
  const token = localStorage.getItem("token");
  const tableBody = document.querySelector("#stakeholders_table tbody");
  const url = `${backendURL}/api/approved-stakeholder?search=${query}&order=${order}`;

  await fetchData(
    url,
    token,
    tableBody,
    (stakeholder) => `
      <tr>
        <td>${stakeholder.agency_name}</td>
        <td>${stakeholder.purok}</td>
        <td>${stakeholder.barangay}</td>
        <td>${stakeholder.municipality}</td>
        <td>${stakeholder.province}</td>
      </tr>`,
    "Failed to fetch Stakeholder data."
  );
}

// Switch between tables using tabs
document.getElementById("user_tab_button").addEventListener("click", () => {
  showTable("users_table");
  getUsers();
});

document
  .getElementById("stakeholder_tab_button")
  .addEventListener("click", () => {
    showTable("stakeholders_table");
    getStakeholder();
  });

// Function to search through a table
function searchTable(query) {
  const activeTable = document.querySelector("table:not(.d-none) tbody");
  const rows = activeTable.querySelectorAll("tr");
  rows.forEach((row) => {
    const cells = Array.from(row.cells);
    const matched = cells.some((cell) =>
      cell.textContent.toLowerCase().includes(query.toLowerCase())
    );
    row.style.display = matched ? "" : "none";
  });
}

// Search and sort event listeners
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");

  searchButton.addEventListener("click", () => {
    const query = searchInput.value;
    searchTable(query);
  });

  searchInput.addEventListener("input", () => {
    const query = searchInput.value;
    searchTable(query);
  });
});
