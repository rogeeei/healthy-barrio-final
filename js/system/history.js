import {
  backendURL,
  showNavAdminPages,
  successNotification,
  errorNotification,
  fetchUserDetails,
  updateSideNav,
  logout,
} from "../utils/utils.js";

// Show Admin Pages
showNavAdminPages();
fetchUserDetails();
updateSideNav();

// Logout Button
const btn_logout = document.getElementById("btn_logout");
if (btn_logout) {
  btn_logout.addEventListener("click", logout);
}

// Select Table Body
const historyTableBody = document.querySelector("table tbody");

// Fetch and Display Citizen History
async function fetchCitizenHistory() {
  try {
    let url = new URL(`${backendURL}/api/citizen-overview`);

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();

    //Directly check if data is an array
    if (Array.isArray(data) && data.length > 0) {
      renderHistoryTable(data);
    } else {
      errorNotification("No citizen history found.");
      renderHistoryTable([]);
    }
  } catch (error) {
    errorNotification(`Error: ${error.message}`);
  }
}

// Render Citizen History Table
function renderHistoryTable(citizens) {
  historyTableBody.innerHTML =
    citizens.length === 0
      ? `<tr><td colspan="5" class="text-center text-muted">No citizen history found.</td></tr>`
      : citizens
          .map(
            (citizen) => `
        <tr>
          <td>${citizen.lastname || "N/A"}</td>
          <td>${citizen.firstname || "N/A"}</td>
          <td>${
            citizen.gender
              ? citizen.gender.charAt(0).toUpperCase() + citizen.gender.slice(1)
              : "N/A"
          }</td>
          <td>${calculateAge(citizen.date_of_birth) || "N/A"}</td>
          <td>${citizen.purok || "N/A"}</td>
        </tr>
      `
          )
          .join("");
}

// Calculate Age
function calculateAge(birthdate) {
  if (!birthdate) return "N/A";
  const birthDate = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  if (
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

// Initialize on Page Load
document.addEventListener("DOMContentLoaded", fetchCitizenHistory);
