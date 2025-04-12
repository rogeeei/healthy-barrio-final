import {
  backendURL,
  successNotification,
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
document.addEventListener("DOMContentLoaded", () => {
  viewService(1); // Load first page by default

  // Pagination button event listeners
  document
    .querySelector(".pagination .fa-angle-left")
    .parentElement.addEventListener("click", () => changePage(-1));
  document
    .querySelector(".pagination .fa-angle-right")
    .parentElement.addEventListener("click", () => changePage(1));
});

let currentPage = 1;
let lastPage = 1; // This will be updated dynamically

async function viewService(page) {
  const urlParams = new URLSearchParams(window.location.search);
  const serviceId = urlParams.get("service_id");

  if (!serviceId) {
    errorNotification("Service ID is missing.");
    return;
  }

  try {
    const response = await fetch(
      `${backendURL}/api/show/availed-citizens/${serviceId}?page=${page}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!response.ok) {
      return;
    }

    const data = await response.json();

    // Update service name in header
    document.getElementById("service-summary-header").textContent =
      data.service_name || "Service Name Not Available";

    // Update service description
    const descriptionElement = document.querySelector(
      ".description-card .card-text"
    );
    descriptionElement.textContent =
      data.service_description || "No description available.";

    // Handle citizen data
    const citizens = data.citizens || [];
    let tableBody = "";

    if (citizens.length > 0) {
      citizens.forEach((citizen) => {
        tableBody += `
          <tr>
              <td>${citizen.purok}</td>
              <td>${citizen.lastname}</td>
              <td>${citizen.firstname}</td>
              <td>${citizen.created_at}</td>
          </tr>
        `;
      });
    } else {
      tableBody = `<tr><td colspan="6" class="text-center">No citizens have availed this service.</td></tr>`;
    }

    document.querySelector("#citizen-table-body").innerHTML = tableBody;

    // Update pagination
    currentPage = data.pagination.current_page;
    lastPage = data.pagination.last_page;
    document.querySelector(
      ".page-number"
    ).textContent = `Page ${currentPage} of ${lastPage}`;

    // Disable pagination buttons if necessary
    document.querySelector(".fa-angle-left").parentElement.disabled =
      currentPage === 1;
    document.querySelector(".fa-angle-right").parentElement.disabled =
      currentPage === lastPage;
  } catch (error) {
    errorNotification(`An error occurred: ${error.message}`);
  }
}

// Change page function
function changePage(offset) {
  const newPage = currentPage + offset;
  if (newPage >= 1 && newPage <= lastPage) {
    viewService(newPage);
  }
}
