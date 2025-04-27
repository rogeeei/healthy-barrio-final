import {
  backendURL,
  successNotification,
  errorNotification,
  showNavAdminPages,
  logout,
} from "../utils/utils.js";

showNavAdminPages();

const btn_logout = document.getElementById("btn_logout");
if (btn_logout) {
  btn_logout.addEventListener("click", logout);
}

let currentPage = 1;
let lastPage = 1;

document.addEventListener("DOMContentLoaded", () => {
  viewService(1);

  const prevBtn = document.querySelector(".prev-btn");
  const nextBtn = document.querySelector(".next-btn");

  if (prevBtn) prevBtn.addEventListener("click", () => changePage(-1));
  if (nextBtn) nextBtn.addEventListener("click", () => changePage(1));
});

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
        credentials: "include",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!response.ok) {
      errorNotification("Failed to fetch data.");
      return;
    }

    const data = await response.json();

    if (!data || !data.service_name || !data.citizens) {
      errorNotification("Service data is incomplete.");
      return;
    }

    document.getElementById("service-summary-header").textContent =
      data.service_name || "Service Name Not Available";

    const descriptionElement = document.querySelector(
      ".description-card .card-text"
    );
    descriptionElement.textContent =
      data.service_description || "No description available.";

    const citizens = data.citizens || [];
    let tableBody = "";

    if (citizens.length > 0 && !citizens[0].message) {
      citizens.forEach((citizen) => {
        const purok = citizen.purok || "N/A";
        const lastname = citizen.lastname || "N/A";
        const firstname = citizen.firstname || "N/A";
        const createdAt = citizen.created_at || "N/A";

        tableBody += `
          <tr>
            <td>${purok}</td>
            <td>${lastname}</td>
            <td>${firstname}</td>
            <td>${createdAt}</td>
          </tr>
        `;
      });
    } else {
      tableBody = `<tr><td colspan="4" class="text-center">No citizens have availed this service.</td></tr>`;
    }

    document.querySelector("#citizen-table-body").innerHTML = tableBody;

    currentPage = data.pagination?.current_page || 1;
    lastPage = data.pagination?.last_page || 1;

    const pageDisplay = document.querySelector(".page-number");
    if (pageDisplay) {
      pageDisplay.textContent = `Page ${currentPage} of ${lastPage}`;
    }

    updatePaginationButtons();
  } catch (error) {
    errorNotification(`An error occurred: ${error.message}`);
  }
}

function changePage(offset) {
  const newPage = currentPage + offset;
  if (newPage >= 1 && newPage <= lastPage) {
    viewService(newPage);
  }
}

function updatePaginationButtons() {
  const prevBtn = document.querySelector(".prev-btn");
  const nextBtn = document.querySelector(".next-btn");

  if (prevBtn) prevBtn.disabled = currentPage === 1;
  if (nextBtn) nextBtn.disabled = currentPage === lastPage;
}
