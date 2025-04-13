import {
  backendURL,
  successNotification,
  errorNotification,
} from "../utils/utils.js";

// Listen for the form submission
document.getElementById("form_stakeholder").onsubmit = async (e) => {
  e.preventDefault(); // Prevent default form submission

  const loginButton = document.querySelector("#form_stakeholder button");
  loginButton.disabled = true;
  loginButton.innerHTML = `
    <div class="spinner-border me-2" role="status"></div>
    
  `;

  // Get the form data and convert it to a plain object
  const formData = new FormData(e.target);
  const formObject = Object.fromEntries(formData.entries());

  try {
    console.log("Form Data:", formObject); // Debugging form data

    // Make a POST request to the backend with the form data as JSON
    const response = await fetch(`${backendURL}/api/stakeholders/login`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json", // Ensure the server knows we are sending JSON
      },
      body: JSON.stringify(formObject), // Convert form data to JSON
    });

    const json = await response.json(); // Parse the response as JSON

    if (response.ok) {
      const token = json.data?.token;
      const stakeholderId = json.data?.id; // Directly access `id` from `data`
      const agencyName = json.data?.agency_name; // Directly access `agency_name` from `data`

      if (token && stakeholderId && agencyName) {
        // Store the login data in localStorage
        localStorage.setItem("token", token);
        localStorage.setItem("agency_name", agencyName);
        localStorage.setItem("stakeholder_id", stakeholderId);

        successNotification("Successfully logged in as Stakeholder.");

        // Redirect to the dashboard page after successful login
        window.location.href = "/stakeholder-dashboard.html"; // Use `window.location.href` for redirection
      } else {
        errorNotification("Login failed. Invalid response from server.");
      }
    } else {
      errorNotification(json.message || "An error occurred during login.");
    }
  } catch (error) {
    console.error("Fetch error:", error);
    errorNotification("An error occurred. Please try again.");
  } finally {
    loginButton.disabled = false;
    loginButton.innerHTML = `Login`; // Reset button text
  }
};
