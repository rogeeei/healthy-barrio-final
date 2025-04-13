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
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: formData,
    });

    const json = await response.json();

    if (response.ok && json.token && json.role) {
      const { token, role } = json;

      localStorage.clear();
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);

      console.log("Stored Token:", token);

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
  } finally {
    loginButton.disabled = false;
    loginButton.innerHTML = `Login`;
  }
};
