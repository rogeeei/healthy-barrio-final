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

      // Filter unapproved stakeholders
      const filteredUsers = stakeholders.filter((user) => !user.approved);

      // Build table rows
      filteredUsers.forEach((stakeholder) => {
        tableBody += `
          <tr id="stakeholder-${stakeholder.id}">
              <td>${stakeholder.agency_name}</td>
              <td>${stakeholder.purok}</td>
              <td>${stakeholder.barangay}</td>
              <td>${stakeholder.municipality}</td>
              <td>${stakeholder.province}</td>
              <td>${new Date(stakeholder.created_at).toLocaleString()}</td>
              <td class="action-buttons">
                  <button class="btn btn-success" onclick="approveStakeholder(${
                    stakeholder.id
                  })">Approve</button>
                  <button class="btn-danger" 
                  style="background-color: #dc3545;color: white; border-radius: 0.25rem;" 
                  onclick="declineStakeholder(${
                    stakeholder.id
                  })">Decline</button>
              </td>
          </tr>
        `;
      });

      document.querySelector("table tbody").innerHTML = tableBody;
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
