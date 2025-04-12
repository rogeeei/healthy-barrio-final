import {
  backendURL,
  showNavAdminPages,
  successNotification,
  errorNotification,
  logout,
} from "../utils/utils.js";

showNavAdminPages();

// Logout Button
const btn_logout = document.getElementById("btn_logout");
if (btn_logout) {
  btn_logout.addEventListener("click", logout);
}

let usersData = []; // Store the fetched users data

async function getUsers(query = "", sortBy = "user_id", order = "asc") {
  const token = localStorage.getItem("token");
  const tableBody = document.querySelector("#users_table tbody");

  if (!tableBody) {
    console.error("Users table body not found.");
    return;
  }

  const url = `${backendURL}/api/bhw?search=${query}&sort=${sortBy}&order=${order}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      usersData = await response.json();
      console.log("Fetched Users:", usersData);

      sortTable(sortBy, order);
      renderTable();
      populateFilters(usersData);
      filterTable();
    } else {
      tableBody.innerHTML =
        '<tr><td colspan="6">Failed to load data.</td></tr>';
      errorNotification("Failed to fetch User data.");
    }
  } catch (error) {
    tableBody.innerHTML = '<tr><td colspan="6">Error loading data.</td></tr>';
    errorNotification(`An error occurred: ${error.message}`);
  }
}

function renderTable() {
  const tableBody = document.querySelector("#users_table tbody");

  tableBody.innerHTML = usersData.length
    ? usersData
        .map(
          (user) => `
      <tr class="user-row" data-id="${user.user_id}">
        <td>${user.user_id}</td>
        <td>${user.firstname}</td>
        <td>${user.lastname}</td>
        <td>${user.brgy}</td>
        <td>${user.municipality}</td>
        <td>${user.province}</td>
      </tr>`
        )
        .join("")
    : '<tr><td colspan="6">No data available.</td></tr>';

  document.querySelectorAll(".user-row").forEach((row) => {
    row.addEventListener("click", () => openUserModal(row.dataset.id));
  });
}

function openUserModal(userId) {
  const user = usersData.find((u) => u.user_id === userId);
  if (!user) {
    errorNotification("User not found.");
    return;
  }

  const userDetails = document.getElementById("userDetails");
  userDetails.innerHTML = `
    <p><strong>User ID:</strong> ${user.user_id}</p>
    <p><strong>First Name:</strong> ${user.firstname}</p>
    <p><strong>Middle Name:</strong> ${user.middle_name || "N/A"}</p>
    <p><strong>Last Name:</strong> ${user.lastname}</p>
    <p><strong>Suffix:</strong> ${user.suffix || "N/A"}</p>
    <p><strong>Email:</strong> ${user.email}</p>
    <p><strong>Phone Number:</strong> ${user.phone_number}</p>
    <p><strong>Birthdate:</strong> ${user.birthdate}</p>
    <p><strong>Barangay:</strong> ${user.brgy}</p>
    <p><strong>Purok:</strong> ${user.purok || "N/A"}</p>
    <p><strong>Municipality:</strong> ${user.municipality}</p>
    <p><strong>Province:</strong> ${user.province}</p>
    <p><strong>Role:</strong> ${user.role}</p>
    <p><strong>Username:</strong> ${user.username}</p>
  `;

  const modal = document.getElementById("userModal");
  modal.style.display = "flex";
}

document.querySelector(".close").addEventListener("click", () => {
  document.getElementById("userModal").style.display = "none";
});

window.addEventListener("click", (event) => {
  const modal = document.getElementById("userModal");
  if (event.target === modal) {
    modal.style.display = "none";
  }
});

document.addEventListener("DOMContentLoaded", () => {
  getUsers();
});

function populateFilters(users) {
  const barangayFilter = document.getElementById("barangayFilter");
  const municipalityFilter = document.getElementById("municipalityFilter");
  const provinceFilter = document.getElementById("provinceFilter");

  const barangays = new Set();
  const municipalities = new Set();
  const provinces = new Set();

  users.forEach((user) => {
    barangays.add(user.brgy);
    municipalities.add(user.municipality);
    provinces.add(user.province);
  });

  fillDropdown(barangayFilter, barangays);
  fillDropdown(municipalityFilter, municipalities);
  fillDropdown(provinceFilter, provinces);
}

function fillDropdown(dropdown, values) {
  dropdown.innerHTML = '<option value="">All</option>';
  values.forEach((value) => {
    dropdown.innerHTML += `<option value="${value}">${value}</option>`;
  });
}

document.querySelectorAll(".sortable").forEach((header) => {
  header.addEventListener("click", async () => {
    const column = header.dataset.column;
    let order = header.dataset.order;

    order = order === "asc" ? "desc" : "asc";
    header.dataset.order = order;

    document.querySelectorAll(".sort-icon").forEach((icon) => {
      icon.textContent = "";
    });

    header.querySelector(".sort-icon").textContent =
      order === "asc" ? "▲" : "▼";

    const searchValue = document.getElementById("searchInput").value;
    await getUsers(searchValue, column, order);
  });
});

document.querySelectorAll(".dropdown-filter").forEach((select) => {
  select.addEventListener("change", filterTable);
});

function filterTable() {
  const searchValue = document
    .getElementById("searchInput")
    .value.toLowerCase();
  const barangayValue = document
    .getElementById("barangayFilter")
    .value.toLowerCase();
  const municipalityValue = document
    .getElementById("municipalityFilter")
    .value.toLowerCase();
  const provinceValue = document
    .getElementById("provinceFilter")
    .value.toLowerCase();

  document.querySelectorAll("#users_table tbody tr").forEach((row) => {
    const idCell = (row.cells[0]?.textContent || "").toLowerCase();
    const firstNameCell = (row.cells[1]?.textContent || "").toLowerCase();
    const lastNameCell = (row.cells[2]?.textContent || "").toLowerCase();
    const barangayCell = (row.cells[3]?.textContent || "").toLowerCase();
    const municipalityCell = (row.cells[4]?.textContent || "").toLowerCase();
    const provinceCell = (row.cells[5]?.textContent || "").toLowerCase();

    const matchesSearch =
      searchValue === "" ||
      idCell.includes(searchValue) ||
      firstNameCell.includes(searchValue) ||
      lastNameCell.includes(searchValue);

    const matchesFilters =
      (barangayValue === "" || barangayCell.includes(barangayValue)) &&
      (municipalityValue === "" ||
        municipalityCell.includes(municipalityValue)) &&
      (provinceValue === "" || provinceCell.includes(provinceValue));

    row.style.display = matchesSearch && matchesFilters ? "" : "none";
  });
}

document.getElementById("searchInput").addEventListener("input", filterTable);

document.addEventListener("click", () => {
  document.querySelectorAll(".dropdown-filter").forEach((dropdown) => {
    dropdown.style.display = "none";
  });
});

document.querySelectorAll(".dropdown-toggle").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();

    const filterId = button.dataset.target;
    const dropdown = document.getElementById(filterId);

    document.querySelectorAll(".dropdown-filter").forEach((select) => {
      if (select.id !== filterId) {
        select.style.display = "none";
      }
    });

    dropdown.style.display =
      dropdown.style.display === "none" ? "block" : "none";
  });
});

document.querySelectorAll(".dropdown-filter").forEach((dropdown) => {
  dropdown.addEventListener("click", (event) => {
    event.stopPropagation();
  });
});

function sortTable(column, order) {
  const tableBody = document.querySelector("#users_table tbody");

  if (!tableBody) {
    console.error("Users table body not found.");
    return;
  }

  usersData.sort((a, b) => {
    let valA = a[column];
    let valB = b[column];

    if (column === "user_id") {
      valA = parseInt(valA.split("-").join(""));
      valB = parseInt(valB.split("-").join(""));
    }

    if (typeof valA === "string") {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }

    if (order === "asc") {
      return valA > valB ? 1 : valA < valB ? -1 : 0;
    } else {
      return valA < valB ? 1 : valA > valB ? -1 : 0;
    }
  });

  renderTable();
}
