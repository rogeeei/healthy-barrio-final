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
let currentSortColumn = "";
let currentSortOrder = "asc";

document.addEventListener("DOMContentLoaded", () => {
  fetchCitizensByBarangay(currentPage, currentSearchQuery);
  addSortEventListeners();
  showNavAdminPages();
  fetchUserDetails();
  updateSideNav();
});

// Handle search input across all columns
document.getElementById("searchInput").addEventListener("input", (e) => {
  currentSearchQuery = e.target.value.trim(); // Get the search query
  currentPage = 1; // Reset to the first page when search is triggered
  fetchCitizensByBarangay(currentPage, currentSearchQuery);
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
          <td>${citizen.municipality || "N/A"}</td>
          <td>${citizen.province || "N/A"}</td>
          <td>
            <button class="view_btn btn-sm viewCitizen" data-citizen-id="${
              citizen.citizen_id
            }">
              View
            </button>
          </td>
        </tr>`
      )
      .join("");
  } else {
    tableBody.innerHTML = "<tr><td colspan='6'>No citizens found.</td></tr>";
  }

  // Apply sorting after the citizens are displayed
  if (currentSortColumn) {
    sortTable(currentSortColumn, currentSortOrder);
  }
}

function updatePaginationControls(totalPages) {
  const prevPageBtn = document.getElementById("prev_page");
  const nextPageBtn = document.getElementById("next_page");

  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages;

  prevPageBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      fetchCitizensByBarangay(currentPage, currentSearchQuery);
    }
  };

  nextPageBtn.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      fetchCitizensByBarangay(currentPage, currentSearchQuery);
    }
  };
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

document.addEventListener("click", (event) => {
  if (event.target.classList.contains("viewCitizen")) {
    const citizenId = event.target.dataset.citizenId;
    viewCitizen(citizenId);
  }
});

function viewCitizen(citizenId) {
  window.location.href = `/profiling.html?citizen_id=${citizenId}`;
}

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
