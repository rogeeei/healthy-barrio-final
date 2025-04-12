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
document.addEventListener("DOMContentLoaded", async () => {
  const servicesContainer = document.getElementById("servicesContainer");
  const userRole = localStorage.getItem("role");

  const barangayNameElement = document.getElementById("barangay-name");
  if (userRole === "super_admin" && barangayNameElement) {
    barangayNameElement.style.display = "none";
  }

  try {
    const response = await fetch(`${backendURL}/api/province`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    console.log("API Response:", result); // ✅ Debugging

    if (!result.success || !result.data.length) {
      throw new Error("No provinces found.");
    }

    result.data.forEach((province) => {
      const colDiv = document.createElement("div");
      colDiv.classList.add("col-md-4", "mb-3");

      colDiv.innerHTML = `
        <div class="card province-card">
          <div class="card-body">
            <h6 class="card-title">${province}</h6> <!-- ✅ Fix: Use province directly -->
          </div>
        </div>
      `;

      colDiv.addEventListener("click", () => {
        const encodedProvince = encodeURIComponent(province);
        window.location.href = `province_report.html?province=${encodedProvince}`;
      });

      servicesContainer.appendChild(colDiv);
    });
  } catch (error) {
    console.error("Error fetching provinces:", error);
    errorNotification("Failed to load provinces.");
  }
});
