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
  fetchAdmin();
});

async function fetchAdmin(query = "") {
  try {
    const response = await fetch(`${backendURL}/api/superadmin`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (response.ok) {
      const users = await response.json();
      let tableBody = "";

      // Filter out approved users
      const filteredUsers = users.filter(
        (user) => !user.approved && user.role !== "super_admin"
      );

      filteredUsers.forEach((user) => {
        tableBody += `
            <tr id="user-${user.user_id}">
                <td>${user.user_id}</td>
                <td>${user.username}</td>
                <td>${user.firstname}</td>
                <td>${user.lastname}</td>
                <td>${user.brgy}</td>
                <td>${user.email}</td>
                <td>${user.phone_number}</td>
                
                <td class="action-buttons">
                    <button class="approve-btn btn-success" data-user-id="${user.user_id}">Approve</button>
                    <button class="decline-btn btn-danger" data-user-id="${user.user_id}" style="background-color: #dc3545;">Decline</button>
                </td>
            </tr>
        `;
      });

      document.querySelector("table tbody").innerHTML = tableBody;
    } else {
      errorNotification("HTTP-Error: " + response.status);
    }
  } catch (error) {
    errorNotification("An error occurred: " + error.message);
  }
}

// Attach event delegation to the table
document
  .querySelector("table tbody")
  .addEventListener("click", function (event) {
    const target = event.target;

    if (target.classList.contains("approve-btn")) {
      const userId = target.getAttribute("data-user-id");
      approveUser(userId);
    } else if (target.classList.contains("decline-btn")) {
      const userId = target.getAttribute("data-user-id");
      declineUser(userId);
    }
  });

function removeUserRow(userId) {
  const userRow = document.getElementById(`user-${userId}`);
  if (userRow) {
    userRow.remove();
  }
}

function approveUser(userId) {
  const token = localStorage.getItem("token");
  const url = `${backendURL}/api/users/${userId}/approve`;

  fetch(url, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error("Failed to approve user");
      }
    })
    .then((data) => {
      successNotification("User approved successfully.");
      removeUserRow(userId);
    })
    .catch((error) => {
      console.error("Error:", error);
      errorNotification("Error approving user: " + error.message);
    });
}

window.declineUser = async function (userId) {
  try {
    const response = await fetch(`${backendURL}/api/user/decline/${userId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to decline user");
    }

    successNotification("User declined successfully.");
    removeUserRow(userId);
    fetchAdmin();
  } catch (error) {
    errorNotification("Error declining user: " + error.message);
  }
};
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
  const rows = document.querySelectorAll("table tbody tr"); // Select all rows in the table

  rows.forEach((row) => {
    const cells = Array.from(row.cells); // Get all cells in the row
    const matched = cells.some(
      (cell) => cell.textContent.toLowerCase().includes(searchInput) // Check if the cell text matches the search input
    );
    row.style.display = matched ? "" : "none"; // Hide or show the row based on match
  });
}
