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

  const url = `${backendURL}/api/superadmin/approved-admins?search=${query}&sort=${sortBy}&order=${order}`;

  try {
    const response = await fetch(url, {
      credentials: "include",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      usersData = await response.json();

      sortTable(sortBy, order); // Sort table after fetching the data
      renderTable(); // Re-render the table after sorting
      populateFilters(usersData); // Populate dropdown filters dynamically
      filterTable(); // Reapply filters after fetching data
    } else {
      tableBody.innerHTML = '<tr><td colspan="6">No data available.</td></tr>';
      errorNotification("No data available.");
    }
  } catch (error) {
    tableBody.innerHTML = '<tr><td colspan="6">Error loading data.</td></tr>';
    errorNotification(`An error occurred: ${error.message}`);
  }
}

// Render table after sorting and filtering
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

  // Add event listeners to each user row to open the modal
  document.querySelectorAll(".user-row").forEach((row) => {
    row.addEventListener("click", () => openUserModal(row.dataset.id));
  });
}

// Open the user modal and populate it with user data
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

  // Show the modal
  const modal = document.getElementById("userModal");
  modal.style.display = "flex"; // Show modal with flex display (centers it)
}

// Close the modal when the close button is clicked
// Close the modal when the close button (X) is clicked
document.querySelector(".close").addEventListener("click", () => {
  const modal = document.getElementById("userModal");
  modal.style.display = "none"; // Hide modal
});

// Close the modal when the 'Close' button is clicked
document.getElementById("modalClose").addEventListener("click", () => {
  const modal = document.getElementById("userModal");
  modal.style.display = "none"; // Hide modal
});

// Close the modal if clicked outside the modal content
window.addEventListener("click", (event) => {
  const modal = document.getElementById("userModal");
  if (event.target === modal) {
    modal.style.display = "none"; // Hide modal if clicked outside
  }
});

// Close the modal if clicked outside the modal content
window.addEventListener("click", (event) => {
  const modal = document.getElementById("userModal");
  if (event.target === modal) {
    modal.style.display = "none"; // Hide modal if clicked outside
  }
});

// Close the modal when the close button is clicked
document.querySelector(".close").addEventListener("click", () => {
  document.getElementById("userModal").style.display = "none";
});

// Close the modal if clicked outside the modal content
window.addEventListener("click", (event) => {
  const modal = document.getElementById("userModal");
  if (event.target === modal) {
    modal.style.display = "none";
  }
});

// Load users on page load
document.addEventListener("DOMContentLoaded", () => {
  getUsers();
});

// Populate dropdown filters dynamically
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

  // Populate filter dropdowns
  fillDropdown(barangayFilter, barangays);
  fillDropdown(municipalityFilter, municipalities);
  fillDropdown(provinceFilter, provinces);
}

// Helper function to populate a dropdown
function fillDropdown(dropdown, values) {
  dropdown.innerHTML = '<option value="">All</option>';
  values.forEach((value) => {
    dropdown.innerHTML += `<option value="${value}">${value}</option>`;
  });
}
// Sorting logic for ID, First Name, and Last Name columns
document.querySelectorAll(".sortable").forEach((header) => {
  header.addEventListener("click", async () => {
    const column = header.dataset.column;
    let order = header.dataset.order;

    // Toggle sorting order
    order = order === "asc" ? "desc" : "asc";
    header.dataset.order = order;

    // Reset all other sort icons
    document.querySelectorAll(".sort-icon").forEach((icon) => {
      icon.textContent = "";
    });

    // Update the clicked column's icon
    header.querySelector(".sort-icon").textContent =
      order === "asc" ? "▲" : "▼";

    // Fetch sorted data with search query and sorting order
    const searchValue = document.getElementById("searchInput").value;
    await getUsers(searchValue, column, order); // Pass search query with sorting
  });
});

// Filter table when selecting an option
document.querySelectorAll(".dropdown-filter").forEach((select) => {
  select.addEventListener("change", filterTable);
});

function filterTable() {
  const searchValue = document
    .getElementById("searchInput")
    .value.toLowerCase(); // Case insensitive search
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

    // Only show the row if it matches both search and filter criteria
    row.style.display = matchesSearch && matchesFilters ? "" : "none";
  });
}

// Attach event listener to search input
document.getElementById("searchInput").addEventListener("input", filterTable);

// Prevent dropdown from closing when clicking inside it
document.querySelectorAll(".dropdown-toggle").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation(); // Prevent event bubbling

    const filterId = button.dataset.target;
    const dropdown = document.getElementById(filterId);

    // Close all dropdowns except the clicked one
    document.querySelectorAll(".dropdown-filter").forEach((select) => {
      if (select.id !== filterId) {
        select.style.display = "none";
      }
    });

    // Toggle only the clicked dropdown
    dropdown.style.display =
      dropdown.style.display === "none" ? "block" : "none";
  });
});

// Prevent dropdowns from closing when clicking inside
document.querySelectorAll(".dropdown-filter").forEach((dropdown) => {
  dropdown.addEventListener("click", (event) => {
    event.stopPropagation();
  });
});
// General function to sort the table based on the column and order
function sortTable(column, order) {
  const tableBody = document.querySelector("#users_table tbody");

  if (!tableBody) {
    console.error("Users table body not found.");
    return;
  }

  // Sort the usersData array based on the specified column and order
  usersData.sort((a, b) => {
    let valA = a[column];
    let valB = b[column];

    // If sorting by ID, treat as a number (not string)
    if (column === "user_id") {
      valA = parseInt(valA.split("-").join("")); // Handle the formatted user_id
      valB = parseInt(valB.split("-").join("")); // Handle the formatted user_id
    }

    // Sort alphabetically for strings, otherwise numerically for ID
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

  renderTable(); // Re-render the table after sorting
}
