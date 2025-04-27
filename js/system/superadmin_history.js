import {
  backendURL,
  showNavAdminPages,
  errorNotification,
  successNotification,
  fetchUserDetails,
  updateSideNav,
  logout,
} from "../utils/utils.js";

const btn_logout = document.getElementById("btn_logout");
if (btn_logout) {
  btn_logout.addEventListener("click", logout);
}
let currentPage = 1;
const itemsPerPage = 15;
let currentSearchQuery = "";
let currentSortOrder = "asc";

document.addEventListener("DOMContentLoaded", () => {
  fetchCitizensByBarangay(currentPage, currentSearchQuery);
  addSortEventListeners();
  showNavAdminPages();
  fetchUserDetails();
  updateSideNav();
});

async function fetchCitizensByBarangay(page, query) {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(
      `${backendURL}/api/citizens/barangay?page=${page}&per_page=${itemsPerPage}&query=${query}`,
      {
        credentials: "include",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch citizens.");

    const data = await response.json();
    if (data.success) {
      displayCitizens(data.data);
      updatePaginationControls(data.totalPages);
    } else {
      errorNotification(data.message || "No citizens found.");
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
    tableBody.innerHTML = citizens
      .map(
        (citizen) => ` 
        <tr>
          <td>${citizen.lastname || "N/A"}</td>
          <td>${citizen.firstname || "N/A"}</td>
          <td>${citizen.gender || "N/A"}</td>
          <td>${calculateAge(citizen.date_of_birth) || "N/A"}</td>
          <td>${citizen.barangay || "N/A"}</td>
        </tr>`
      )
      .join("");
  } else {
    tableBody.innerHTML = "<tr><td colspan='6'>No citizens found.</td></tr>";
  }
}

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

document.getElementById("searchInput").addEventListener("input", (e) => {
  currentSearchQuery = e.target.value;
  currentPage = 1;
  fetchCitizensByBarangay(currentPage, currentSearchQuery);
});

function sortTable(column, order) {
  const tbody = document.querySelector("table tbody");
  const rows = Array.from(tbody.querySelectorAll("tr"));

  const columnIndices = {
    "last name": 0,
    "first name": 1,
    gender: 2,
    age: 3,
    barangay: 4,
  };

  const columnIndex = columnIndices[column.toLowerCase()];

  rows.sort((rowA, rowB) => {
    let cellA = rowA.cells[columnIndex].textContent.trim();
    let cellB = rowB.cells[columnIndex].textContent.trim();

    if (column === "age") {
      cellA = parseInt(cellA, 10);
      cellB = parseInt(cellB, 10);
    }

    if (order === "asc") {
      return cellA > cellB ? 1 : cellA < cellB ? -1 : 0;
    } else {
      return cellA < cellB ? 1 : cellA > cellB ? -1 : 0;
    }
  });

  rows.forEach((row) => tbody.appendChild(row));
}

function addSortEventListeners() {
  const sortButtons = document.querySelectorAll(".sort-button");

  sortButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      const buttonClicked = e.target.closest("button");
      const column = buttonClicked
        .closest("th")
        .textContent.trim()
        .toLowerCase();
      currentSortOrder = buttonClicked.dataset.order === "asc" ? "desc" : "asc";
      buttonClicked.dataset.order = currentSortOrder;

      currentSortColumn = column;

      sortTable(column, currentSortOrder);

      toggleSortIcons(buttonClicked);
    });
  });
}

function toggleSortIcons(buttonClicked) {
  const iconUp = buttonClicked.querySelector("i.fa-arrow-up");
  const iconDown = buttonClicked.querySelector("i.fa-arrow-down");

  const allButtons = document.querySelectorAll(".sort-button");
  allButtons.forEach((btn) => {
    const upIcon = btn.querySelector("i.fa-arrow-up");
    const downIcon = btn.querySelector("i.fa-arrow-down");
    if (upIcon) upIcon.classList.remove("active");
    if (downIcon) downIcon.classList.remove("active");
  });

  if (iconUp && currentSortOrder === "asc") {
    iconUp.classList.add("active");
  } else if (iconDown && currentSortOrder === "desc") {
    iconDown.classList.add("active");
  }
}

// Handle search input keypress (Enter key)
document
  .getElementById("searchInput")
  .addEventListener("keypress", async (e) => {
    if (e.key === "Search") {
      const query = e.target.value;
      await fetchCitizensByBarangay(query);
    }
  });

document.addEventListener("DOMContentLoaded", () => {
  const table = document.getElementById("citizen_table");
  const tbody = table.querySelector("tbody");

  // Function to sort table rows
  function sortTable(order) {
    const rowsArray = Array.from(tbody.querySelectorAll("tr"));

    rowsArray.sort((rowA, rowB) => {
      const lastNameA = rowA.cells[0].textContent.trim();
      const lastNameB = rowB.cells[0].textContent.trim();

      if (order === "Ascending") {
        return lastNameA.localeCompare(lastNameB);
      } else {
        return lastNameB.localeCompare(lastNameA);
      }
    });

    // Append sorted rows
    rowsArray.forEach((row) => tbody.appendChild(row));
  }

  // Event listener for dropdown menu
  document.querySelectorAll(".dropdown-menu .dropdown-item").forEach((item) => {
    item.addEventListener("click", (event) => {
      const order = event.target.textContent;
      sortTable(order);
    });
  });

  // Function to search through table
  function searchTable() {
    const searchInput = document
      .getElementById("searchInput")
      .value.toLowerCase();
    const rows = tbody.querySelectorAll("tr");

    rows.forEach((row) => {
      const cells = Array.from(row.cells);
      const matched = cells.some((cell) =>
        cell.textContent.toLowerCase().includes(searchInput)
      );
      row.style.display = matched ? "" : "none";
    });
  }

  // Event listener for search input
  document.getElementById("searchInput").addEventListener("input", searchTable);
});
