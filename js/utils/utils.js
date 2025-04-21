import { setRouter } from "../router/router.js";

// Set Router
setRouter();

// Backend URL
const backendURL = "https://capstone-system-production-7c08.up.railway.app/";

// Function to handle response
async function handleResponse(response) {
  if (response.ok) {
    const json = await response.json();

    // Update user ID
    if (document.getElementById("user_id")) {
      document.getElementById("user_id").value = json.id;
    }
  } else {
    const json = await response.json();
    errorNotification(json.message, 10);
  }
}
// Logout function
export async function logout() {
  try {
    const response = await fetchWithAuth(`${backendURL}/api/logout`);
    if (response.ok) {
      localStorage.clear();
      successNotification("Logout Successful.");
      window.location.pathname = "/";
    } else {
      const json = await response.json();
      errorNotification(`Logout failed: ${json.message}`, 10);
    }
  } catch (error) {
    errorNotification("An error occurred during logout: " + error.message);
  }
}

export async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Authentication token not found. Please log in again.");
  }

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const contentType = response.headers.get("Content-Type");
      if (contentType && contentType.includes("application/json")) {
        const errorJson = await response.json();
        throw new Error(errorJson.message || "An unknown error occurred.");
      } else {
        const errorText = await response.text(); // Fallback for non-JSON responses
        throw new Error(errorText || "An unknown error occurred.");
      }
    }

    return response; // Return the response if everything is OK
  } catch (error) {
    console.error("Error with fetch request:", error.message);
    throw error;
  }
}

// Show Admin Pages Navigation
function showNavAdminPages() {
  const role = localStorage.getItem("role");

  // Get the navigation container
  const navContainer = document.getElementById("nav_admin_pages");

  if (role === "admin") {
    // Admin links
    navContainer.innerHTML = `
    <a class="nav-link" href="user_report.html" onclick="setActiveLink(this)">
      <div class="sb-nav-link-icon"><i class="fa-solid fa-file"></i></div>
       Services
    </a>
    <a class="nav-link" href="admin.html" onclick="setActiveLink(this)">
      <div class="sb-nav-link-icon"><i class="fa-solid fa-user-tie"></i></div>
      Admin
    </a>
  `;
  } else if (role === "super_admin") {
    // Super Admin links
    navContainer.innerHTML = `
     <a class="nav-link" href="add_services.html" onclick="setActiveLink(this)">
      <div class="sb-nav-link-icon"><i class="fa-solid fa-file"></i></div>
       Services
    </a>
    <a class="nav-link dropdown-toggle" href="#" id="userManagementDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false" onclick="setActiveLink(this)">
      <div class="sb-nav-link-icon"><i class="fas fa-users"></i></div>
      Manage User
    </a>
    <ul class="dropdown-menu" aria-labelledby="userManagementDropdown">
      <li><a class="dropdown-item" href="superadmin.html" onclick="setActiveLink(this)">BHW</a></li>
      <li><a class="dropdown-item" href="stakeholder.html" onclick="setActiveLink(this)">Stakeholders</a></li>
    </ul>
    <a class="nav-link dropdown-toggle" href="#" id="userViewDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false" onclick="setActiveLink(this)">
      <div class="sb-nav-link-icon"><i class="fa-solid fa-users-viewfinder"></i></div>
      View User
    </a>
    <ul class="dropdown-menu" aria-labelledby="userViewDropdown">
      <li><a class="dropdown-item" href="users.html" onclick="setActiveLink(this)">Admin</a></li>
      <li><a class="dropdown-item" href="view_users.html" onclick="setActiveLink(this)">BHW</a></li>
      <li><a class="dropdown-item" href="user_view.html" onclick="setActiveLink(this)">Stakeholders</a></li>
    </ul>
  `;
  } else if (role === "user") {
    // User links
    navContainer.innerHTML = `
    <a class="nav-link" href="user_report.html" onclick="setActiveLink(this)">
      <div class="sb-nav-link-icon"><i class="fa-solid fa-file"></i></div>
      Services
    </a>
  `;
  }

  // Set the active link on page load based on the current URL
  const currentPage = window.location.href;
  const links = navContainer.querySelectorAll("a");

  links.forEach((link) => {
    if (link.href === currentPage) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

// Function to set the active link
function setActiveLink(clickedLink) {
  // Get all the links inside the navigation container
  const links = document.querySelectorAll("#nav_admin_pages .nav-link");

  // Remove 'active' class from all links
  links.forEach((link) => {
    link.classList.remove("active");
  });

  // Add 'active' class to the clicked link
  clickedLink.classList.add("active");
}

// Routing
document.addEventListener("DOMContentLoaded", () => {
  const userRole = localStorage.getItem("role"); // Get user role from storage
  const backLink = document.getElementById("backLink"); // Get the back button

  // ✅ Role-based redirection for back button
  if (backLink) {
    const roleBasedBackLinks = {
      super_admin: "superadmin_citizen.html",
      admin: "citizen.html",
      user: "citizen.html",
    };

    // Set the correct back link based on user role
    backLink.setAttribute(
      "href",
      roleBasedBackLinks[userRole] || "citizen.html"
    );
  }

  // ✅ Role-based redirection for navbar links
  const roleBasedRedirects = {
    "dashboard.html": {
      super_admin: "superadmin_dashboard.html",
      admin: "dashboard.html",
      user: "dashboard.html",
    },
    "citizen.html": {
      super_admin: "superadmin_citizen.html",
      admin: "citizen.html",
      user: "citizen.html",
    },
    "supplies.html": {
      super_admin: "superadmin_supplies.html",
      admin: "supplies.html",
      user: "supplies.html",
    },
    "history.html": {
      super_admin: "superadmin_history.html",
      admin: "history.html",
      user: "history.html",
    },
    "reports.html": {
      super_admin: "reports.html",
      admin: "user_report.html",
      user: "user_report.html",
    },
    "admin.html": {
      super_admin: "superadmin.html",
      admin: "admin.html",
    },
  };

  // Attach click event listener to all nav links
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      const targetHref = link.getAttribute("href");

      if (roleBasedRedirects[targetHref]) {
        e.preventDefault();
        const redirectPage =
          roleBasedRedirects[targetHref][userRole] || targetHref;
        window.location.href = redirectPage;
      }
    });
  });
});

// Success Notification
function successNotification(message, timeout = 5) {
  const notificationElement = document.getElementById("successNotification");
  if (!notificationElement) {
    console.error("Notification element not found.");
    return;
  }

  notificationElement.textContent = message;
  notificationElement.style.display = "block";

  setTimeout(() => {
    notificationElement.classList.add("show");
  }, 50);

  // Hide after timeout
  setTimeout(() => {
    notificationElement.classList.remove("show");
    setTimeout(() => {
      notificationElement.style.display = "none";
    }, 500);
  }, timeout * 1000);
}

// Error Notification
function errorNotification(message, timeout = 5) {
  const notificationElement = document.getElementById("errorNotification");
  if (!notificationElement) {
    console.error("Notification element not found.");
    return;
  }

  notificationElement.textContent = message;
  notificationElement.style.display = "block";

  setTimeout(() => {
    notificationElement.classList.add("show");
  }, 10);

  // Hide after timeout
  setTimeout(() => {
    notificationElement.classList.remove("show"); // Fade out
    setTimeout(() => {
      notificationElement.style.display = "none"; // Hide completely
    }, 500);
  }, timeout * 1000);
}

// Fetch user details and update side navigation
async function fetchUserDetails() {
  const token = localStorage.getItem("token");

  if (!token) {
    console.error("User is not authenticated.");
    return;
  }

  try {
    const response = await fetchWithAuth(`${backendURL}/api/user-details`, {
      method: "GET",
    });

    const userData = await response.json();

    if (response.ok) {
      // ✅ Store user role and barangay in localStorage
      if (userData.role) {
        localStorage.setItem("role", userData.role);
      } else {
      }

      if (userData.barangay) {
        localStorage.setItem("barangay", userData.barangay);
      } else {
        console.warn(" User barangay not found!");
      }

      updateSideNav(userData);
    } else {
      console.error("❌ Error response from server:", userData); // Debug log
      errorNotification(userData.message || "An error occurred.", 10);
    }
  } catch (error) {
    console.error("❌ Error fetching user details:", error);
    errorNotification("An error occurred while fetching user details.", 10);
  }
}

export function hideBarangayForSuperAdmin() {
  const userRole = localStorage.getItem("role"); // ✅ Get user role from localStorage

  if (userRole === "super admin") {
    console.log("👤 Super Admin detected. Hiding barangay elements...");

    // Select all elements that display barangay names and hide them
    document.querySelectorAll(".barangay-name").forEach((el) => {
      el.style.display = "none"; // ✅ Hide barangay name
    });
  }
}

function updateSideNav(userData) {
  if (!userData) {
    console.error("No user data available.");
    return;
  }

  // Update the barangay address
  const barangayName = document.getElementById("barangay-name");
  if (barangayName && userData.barangay) {
    barangayName.innerHTML = `<strong>${userData.barangay}</strong>`;

    // Apply styles for centering the text
    barangayName.style.display = "flex";
    barangayName.style.justifyContent = "center"; // Horizontally center the text
    barangayName.style.alignItems = "center"; // Vertically center the text (if there's enough space)

    // Ensure that the text container adjusts to the text length
    barangayName.style.width = "auto"; // The width will now adjust based on text length
    barangayName.style.margin = "0 auto"; // Horizontally center the container itself
  }

  // Update the user name (first name + last name)
  const userID = document.getElementById("user_logged");
  if (userID && userData.firstname && userData.lastname) {
    userID.textContent = `${userData.firstname} ${userData.lastname}`;
  }

  // Optionally update the profile image
  const userImage = document.querySelector("#layoutSidenav_nav img");
  if (userImage && userData.profile_picture) {
    userImage.src = userData.profile_picture;
  }
}

// Initialize user data
document.addEventListener("DOMContentLoaded", () => {
  fetchUserDetails();
});
function showCustomAlert(message, duration = 3000) {
  const alertBox = document.getElementById("customAlert");
  const alertMessage = document.getElementById("alertMessage");

  alertMessage.textContent = message;
  alertBox.style.display = "block";

  setTimeout(() => {
    alertBox.style.display = "none";
  }, duration); // Alert disappears after `duration` milliseconds
}

// ✅ Colors for medical service icons
export const iconColors = {
  "fa-stethoscope": "#063e4f",
  "fa-user-nurse": "#17a2b8",
  "fa-heartbeat": "#dc3545",
  "fa-syringe": "#28a745",
  "fa-pills": "#ffc107",
  "fa-hospital": "#6610f2",
  "fa-ambulance": "#fd7e14",
  "fa-first-aid": "#e83e8c",
  "fa-dna": "#20c997",
  "fa-notes-medical": "#6f42c1",
  "fa-clinic-medical": "#063e4f",
  "fa-thermometer": "#e74c3c",
  "fa-bone": "#343a40",
  "fa-tooth": "#5bc0de",
  "fa-brain": "#f39c12",
  "fa-eye": "#8e44ad",
  "fa-lungs": "#2c3e50",
  "fa-hands-helping": "#16a085",
  "fa-procedures": "#c0392b",
  "fa-x-ray": "#7f8c8d",
  "fa-vial": "#d35400",
  "fa-vials": "#1abc9c",
  "fa-microscope": "#9b59b6",
  "fa-biohazard": "#ff0000",
  "fa-virus": "#27ae60",
  "fa-viruses": "#d35400",
  "fa-user-md": "#3498db",
  "fa-hand-holding-medical": "#2ecc71",
  "fa-blood": "#e74c3c",
};

export const serviceColors = {
  "General Consultation": "#063E4F", // Deep Teal
  "Dental Check-up": "#D9BF77", // Soft Pastel Yellow
  Vaccination: "#F4A261", // Warm Muted Orange
  "Family Planning": "#FF66B2", // Same as before
  "Emergency Medical Care": "#E76F51", // Earthy Red
  "Mental Health Counseling": "#264653", // Deep Slate Blue
  "Prenatal Care": "#E83E8C", // Same as before
  "Postnatal Care": "#2A9D8F", // Soft Cyan-Teal
  "Child Growth Monitoring": "#D9BF77", // Muted Gold
  "Senior Citizen Health": "#8D99AE", // Soft Gray-Blue
  "Tuberculosis Screening": "#A8DADC", // Light Aqua
  "HIV/AIDS Counseling": "#E60000", // Same as before
  "Diabetes Screening": "#457B9D", // Cool Blue
  "Hypertension Screening": "#D63384", // Same as before
  "Nutrition Counseling": "#063E4F", // Deep Teal
  "Deworming Program": "#F4A261", // Warm Muted Orange
  "Malaria Prevention": "#2A9D8F", // Soft Cyan-Teal
  Immunization: "#A8DADC", // Light Aqua
};
// ✅ Default color if icon/service is missing
export const DEFAULT_ICON_COLOR = "#6c757d";

export {
  backendURL,
  showNavAdminPages,
  successNotification,
  errorNotification,
  fetchUserDetails,
  updateSideNav,
  showCustomAlert,
};
