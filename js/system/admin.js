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
document.addEventListener("DOMContentLoaded", () => {
  const btn_logout = document.getElementById("btn_logout");
  if (btn_logout) {
    btn_logout.addEventListener("click", logout);
  }

  // Fetch Users on Page Load
  fetchUsers();

  // Search Input Event Listener
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", searchTable);
    searchInput.addEventListener("keypress", async (e) => {
      if (e.key === "Enter") {
        const query = e.target.value.trim();
        await fetchUsers(query);
      }
    });
  } else {
    console.error("❌ searchInput not found in the DOM!");
  }
});

// Search Function to Filter Table Data
function searchTable() {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) {
    console.error("❌ searchInput not found in the DOM!");
    return;
  }

  const query = searchInput.value.toLowerCase();
  const rows = document.querySelectorAll("table tbody tr");

  rows.forEach((row) => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(query) ? "" : "none";
  });
}

// Fetch Unapproved Users with Role 'user' in the Same Location
async function fetchUsers(query = "") {
  try {
    const response = await fetch(`${backendURL}/api/get-bhw?search=${query}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP-Error: ${response.status}`);
    }

    const responseData = await response.json();

    let tableBody = "";

    if (Array.isArray(responseData.data) && responseData.data.length > 0) {
      responseData.data.forEach((user) => {
        tableBody += `
          <tr id="user-${user.user_id}">
              <td>${user.user_id}</td>
              <td>${user.username}</td>
              <td>${user.firstname}</td>
              <td>${user.lastname || "-"}</td>
              <td>${user.brgy}</td>
              <td>${user.email}</td>
              <td>${user.phone_number}</td>
              <td class="action-buttons">
                <button class="approve-btn btn-success" data-user-id="${
                  user.user_id
                }">Approve</button>
                <button class="decline-btn btn-danger" data-user-id="${
                  user.user_id
                }" style="background-color: #dc3545">Decline</button>
              </td>
          </tr>
        `;
      });
    } else {
      console.warn("⚠️ No unapproved users found.");
      tableBody = `<tr><td colspan="9" class="text-center">No unapproved users found.</td></tr>`;
    }

    const tableBodyElement = document.querySelector("table tbody");
    if (tableBodyElement) {
      tableBodyElement.innerHTML = tableBody;
    } else {
      console.error("❌ Table body not found in the DOM!");
    }
  } catch (error) {
    console.error("Error fetching users:", error);
    errorNotification("An error occurred: " + error.message);
  }
}

// Event Delegation for Approve & Decline Buttons
document.addEventListener("click", function (event) {
  const target = event.target;
  if (target.classList.contains("approve-btn")) {
    const userId = target.getAttribute("data-user-id");
    if (userId) {
      approveUser(userId);
    } else {
      console.error("❌ Missing user ID for approval!");
    }
  } else if (target.classList.contains("decline-btn")) {
    const userId = target.getAttribute("data-user-id");
    if (userId) {
      declineUser(userId);
    } else {
      console.error("❌ Missing user ID for decline!");
    }
  }
});

// Approve User Function
async function approveUser(userId) {
  if (!userId) {
    errorNotification("User ID is missing!");
    return;
  }

  try {
    const response = await fetch(`${backendURL}/api/users/${userId}/approve`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to approve user");
    }

    successNotification("User approved successfully.");
    removeUserRow(userId);
  } catch (error) {
    errorNotification("Error approving user: " + error.message);
  }
}

// Decline User Function
async function declineUser(userId) {
  console.log("❌ Declining user with ID:", userId);

  if (!userId) {
    errorNotification("User ID is missing!");
    return;
  }

  try {
    const response = await fetch(`${backendURL}/api/user/decline/${userId}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to decline user");
    }

    successNotification("User declined successfully.");
    removeUserRow(userId);
  } catch (error) {
    errorNotification("Error declining user: " + error.message);
  }
}

// Remove User Row from Table
function removeUserRow(userId) {
  const userRow = document.getElementById(`user-${userId}`);
  if (userRow) {
    userRow.remove();
  } else {
    console.warn(`⚠️ User row not found: user-${userId}`);
  }
}
