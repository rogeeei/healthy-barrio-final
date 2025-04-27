import {
  backendURL,
  showNavAdminPages,
  successNotification,
  errorNotification,
  logout,
} from "../utils/utils.js";

// Show Admin Pages
showNavAdminPages();

// Logout Button
const btn_logout = document.getElementById("btn_logout");
if (btn_logout) {
  btn_logout.addEventListener("click", logout);
}

document.addEventListener("DOMContentLoaded", () => {
  fetchStakeholder();
});

async function fetchStakeholder() {
  try {
    const response = await fetch(`${backendURL}/api/stakeholder`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (response.ok) {
      const stakeholders = await response.json();
      let tableBody = "";

      const filteredUsers = stakeholders.filter((user) => !user.approved);

      if (filteredUsers.length === 0) {
        tableBody = `
          <tr>
            <td colspan="6" class="text-center text-muted py-4">
              No data available
            </td>
          </tr>
        `;
      } else {
        filteredUsers.forEach((stakeholder) => {
          tableBody += `
            <tr id="stakeholder-${stakeholder.id}">
                <td>${stakeholder.agency_name}</td>
                <td>${stakeholder.username}</td>
                <td>${stakeholder.barangay}</td>
                <td>${stakeholder.municipality}</td>
                <td>${stakeholder.province}</td>
                <td class="action-buttons">
                  <button class="approve-btn btn-success" onclick="approveStakeholder(${stakeholder.id})" style="margin-left:100px;">Approve</button>
                  <button class="decline-btn btn-danger" onclick="declineStakeholder(${stakeholder.id})" style="background-color: #dc3545;">Decline</button>
                </td>
            </tr>
          `;
        });
      }

      document.querySelector("table tbody").innerHTML = tableBody;
      searchTable(); // Ensure the search function works after the table is populated
    } else {
      const errorData = await response.json();
      errorNotification(errorData.message || "Failed to fetch stakeholders.");
    }
  } catch (error) {
    errorNotification("An error occurred: " + error.message);
  }
}

// Approve Stakeholder
async function approveStakeholder(id) {
  try {
    const response = await fetch(
      `${backendURL}/api/stakeholders/${id}/approve`,
      {
        method: "POST", // Use POST as per backend configuration
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (response.ok) {
      successNotification("Stakeholder approved successfully.");
      removeUserRow(id); // Remove row from the table
    } else {
      const errorData = await response.json();
      errorNotification(errorData.message || "Failed to approve stakeholder.");
    }
  } catch (error) {
    errorNotification("An error occurred: " + error.message);
  }
}

// Decline Stakeholder
async function declineStakeholder(id) {
  try {
    const response = await fetch(
      `${backendURL}/api/stakeholders/${id}/decline`,
      {
        credentials: "include",
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (response.ok) {
      successNotification("Stakeholder declined successfully.");
      removeUserRow(id);
    } else {
      const errorData = await response.json();
      errorNotification(errorData.message || "Failed to decline stakeholder.");
    }
  } catch (error) {
    errorNotification("An error occurred: " + error.message);
  }
}

// Remove stakeholder row from the table
function removeUserRow(stakeholderId) {
  const row = document.getElementById(`stakeholder-${stakeholderId}`);
  if (row) {
    row.remove();
  }
}

// Make the functions accessible globally
window.approveStakeholder = approveStakeholder;
window.declineStakeholder = declineStakeholder;

// Handle search input keypress (Enter key)
document
  .getElementById("searchInput")
  .addEventListener("keypress", async (e) => {
    if (e.key === "Search") {
      const query = e.target.value;
      await fetchCitizensByBarangay(query);
    }
  });

// Add the event listener for search input using the 'input' event
document.getElementById("searchInput").addEventListener("input", searchTable);

function searchTable() {
  const searchInput = document
    .getElementById("searchInput")
    .value.toLowerCase();
  const rows = document.querySelectorAll("table tbody tr");

  rows.forEach((row) => {
    const cells = Array.from(row.cells);
    const matched = cells.some((cell) =>
      cell.textContent.toLowerCase().includes(searchInput)
    );
    row.style.display = matched ? "" : "none";
  });
}
