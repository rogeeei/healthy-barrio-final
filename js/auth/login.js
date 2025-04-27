import {
  backendURL,
  successNotification,
  errorNotification,
} from "../utils/utils.js";

document.getElementById("form_login").onsubmit = async (e) => {
  e.preventDefault();

  const loginButton = document.querySelector("#form_login button");
  loginButton.disabled = true;
  loginButton.innerHTML = `<div class="spinner-border me-2" role="status"></div><span></span>`;

  const formData = new FormData(e.target);

  try {
    const response = await fetch(`${backendURL}/api/login`, {
      credentials: "include",
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: formData,
    });

    const contentType = response.headers.get("Content-Type");
    let json = {};
    if (contentType && contentType.includes("application/json")) {
      json = await response.json();
    } else {
      json = { message: "Server responded with unexpected content type." };
    }

    if (response.ok && json.token && json.role) {
      const { token, role } = json;

      localStorage.clear();
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);

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
        errorNotification("Unknown role. Login failed.");
      }
    } else {
      errorNotification(json.message || "Login failed.");
    }
  } catch (error) {
    errorNotification("An error occurred. Please try again.");
    console.error(error); // Log error details to debug
  } finally {
    loginButton.disabled = false;
    loginButton.innerHTML = `Login`;
  }
};
