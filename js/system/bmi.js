import {
  backendURL,
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

// Function to fetch citizens based on BMI category
function fetchCitizensByBmi() {
  // Extract BMI category from URL
  const urlParams = new URLSearchParams(window.location.search);
  let bmiCategory = urlParams.get("bmi") || urlParams.get("classification");

  console.log("BMI Category from URL:", bmiCategory);

  // Format the BMI category properly (capitalize first letter only)
  if (bmiCategory) {
    bmiCategory =
      bmiCategory.charAt(0).toUpperCase() + bmiCategory.slice(1).toLowerCase();

    // Fetch citizens based on the BMI category
    const token = localStorage.getItem("token");
    if (!token) {
      errorNotification("User is not authenticated.");
      return;
    }

    console.log("Fetching citizens with BMI category:", bmiCategory);

    fetch(`${backendURL}/bmi-citizens?classification=${bmiCategory}`, {
      credentials: "include",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        console.log("Response Status:", res.status);
        if (!res.ok) {
          throw new Error("Failed to fetch citizens. Status: " + res.status);
        }
        return res.json();
      })
      .then((data) => {
        console.log("API Response:", data); // Log the entire response

        const tbody = document.querySelector("#bmi_table tbody");

        // Check if the response is successful and contains data
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          tbody.innerHTML = ""; // Clear existing rows

          // Loop through the citizens and display their information
          data.data.forEach((citizen) => {
            console.log("Citizen Data:", citizen); // Log each citizen's data
            const row = document.createElement("tr");
            row.innerHTML = `
              <td>${citizen.lastname || "N/A"}</td>
              <td>${citizen.firstname || "N/A"}</td>
              <td>${citizen.barangay || "N/A"}</td>
              <td>${citizen.municipality || "N/A"}</td>
              <td>${citizen.province || "N/A"}</td>
            `;
            tbody.appendChild(row);
          });
        } else {
          tbody.innerHTML = `<tr><td colspan="5" class="text-center">No citizens found for this BMI classification.</td></tr>`;
        }
      })
      .catch((err) => {
        console.error("Error fetching filtered citizens:", err);
        errorNotification("Error fetching filtered citizens.");
      });
  } else {
    // No BMI category provided
    const tbody = document.querySelector("#bmi_table tbody");
    tbody.innerHTML = `<tr><td colspan="5" class="text-center">No BMI category provided.</td></tr>`;
  }
}

// Call the function to fetch citizens based on BMI category
fetchCitizensByBmi();
