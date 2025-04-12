import {
  backendURL,
  successNotification,
  errorNotification,
} from "../utils/utils.js";

document.getElementById("form_login").onsubmit = async (e) => {
  e.preventDefault();

  // Disable login button and show loading spinner
  const loginButton = document.querySelector("#form_login button");
  loginButton.disabled = true;
  loginButton.innerHTML = `<div class="spinner-border me-2" role="status"></div><span></span>`;

  const formData = new FormData(e.target);

  try {
    const response = await fetch(`${backendURL}/api/login`, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: formData,
    });

    const json = await response.json();
    console.log("Login Response:", json);

    if (response.ok && json.token && json.role) {
      const { token, role } = json;

      // Store token & user info
      localStorage.clear();
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);

      console.log("Stored Token:", token);

      // Redirect based on role
      const dashboardRoutes = {
        super_admin: "/superadmin_dashboard.html",
        admin: "/dashboard.html",
        user: "/dashboard.html",
      };

      if (dashboardRoutes[role]) {
        successNotification(
          `Successfully logged in as ${role.replace("_", " ")}.`
        );
        window.location.replace(dashboardRoutes[role]);
      } else {
        console.error("Unknown role. Login failed.");
      }
    } else {
      console.error(json.message || "Login failed.");
    }
  } catch (error) {
    console.error("Login Error:", error);
    console.error("An error occurred. Please try again.");
  } finally {
    loginButton.disabled = false;
    loginButton.innerHTML = `Login`;
  }
};
