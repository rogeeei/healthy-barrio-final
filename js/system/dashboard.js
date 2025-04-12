import {
  backendURL,
  showNavAdminPages,
  successNotification,
  errorNotification,
  fetchUserDetails,
  logout,
  hideBarangayForSuperAdmin,
  serviceColors, // ✅ Import predefined service colors
  iconColors, // ✅ Import icon colors for new services
  DEFAULT_ICON_COLOR,
} from "../utils/utils.js";

showNavAdminPages();
fetchUserDetails();
hideBarangayForSuperAdmin();
// Logout Button
const btn_logout = document.getElementById("btn_logout");
if (btn_logout) {
  btn_logout.addEventListener("click", logout);
}
// ✅ Fetch predefined services from backend
async function getPredefinedServices() {
  try {
    const response = await fetch(`${backendURL}/api/services`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) throw new Error("Failed to fetch predefined services.");
    return await response.json();
  } catch (error) {
    console.error("Error fetching predefined services:", error.message);
    return [];
  }
}

// ✅ Fetch services assigned to the user's barangay
async function getServicesByBarangay() {
  try {
    const response = await fetch(`${backendURL}/api/barangay/services`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) throw new Error("Failed to fetch barangay services.");

    const services = await response.json();
    displaySelectedServices(services);
  } catch (error) {
    errorNotification("Error fetching services: " + error.message);
  }
}

function displaySelectedServices(services) {
  const servicesContainer = document.getElementById("servicesContainer");
  servicesContainer.innerHTML = "";

  services.forEach((service) => {
    // ✅ Check predefined service color first, then icon color
    const iconColor =
      serviceColors[service.name] ||
      iconColors[service.icon] ||
      DEFAULT_ICON_COLOR;

    const serviceCard = document.createElement("div");
    serviceCard.classList.add("col-md-3", "mb-3"); // ✅ 4 per row
    serviceCard.setAttribute("data-service-id", service.id);

    serviceCard.innerHTML = `
      <div class="card service-card text-center p-3">
        <div class="card-body">
          <i class="fa ${service.icon} fa-3x mb-3" style="color: ${iconColor};  font-size: 8rem;"></i>
          <h5 class="card-title">${service.name}</h5>
        </div>
      </div>
    `;

    // ✅ Click event to view service details
    serviceCard.addEventListener("click", () => {
      const serviceId = serviceCard.getAttribute("data-service-id");
      if (serviceId) {
        window.location.href = `service_view.html?service_id=${serviceId}`;
      } else {
        console.error("Service ID not found!");
      }
    });

    servicesContainer.appendChild(serviceCard);
  });
}
async function renderServiceSelection() {
  const modalContainer = document.getElementById("modalServiceContainer");
  modalContainer.innerHTML = ""; // ✅ Clear previous content

  try {
    const [predefinedServices, assignedServicesResponse] = await Promise.all([
      getPredefinedServices(),
      fetch(`${backendURL}/api/barangay/services`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }),
    ]);

    if (!assignedServicesResponse.ok) {
      throw new Error("Failed to fetch barangay services.");
    }

    const assignedServices = await assignedServicesResponse.json();
    const assignedServiceIds = new Set(assignedServices.map((s) => s.id));

    // ✅ Create a container div for rows
    const container = document.createElement("div");
    container.classList.add("service-card-container");
    modalContainer.appendChild(container);

    predefinedServices.forEach((service) => {
      if (assignedServiceIds.has(service.id)) return; // ✅ Skip already assigned services

      // ✅ Check predefined service color first, then icon color
      const iconColor =
        serviceColors[service.name] ||
        iconColors[service.icon] ||
        DEFAULT_ICON_COLOR;

      const card = document.createElement("div");
      card.classList.add("col-md-4");

      card.innerHTML = `
        <div class="modal-service-card text-center p-3" data-service-id="${service.id}">
          <i class="fa ${service.icon} fa-3x mb-3" style="color: ${iconColor};"></i>
          <h5>${service.name}</h5>
        </div>
      `;

      // ✅ Add selection effect on click
      card
        .querySelector(".modal-service-card")
        .addEventListener("click", function () {
          this.classList.toggle("selected"); // ✅ Toggle selected state
        });

      container.appendChild(card);
    });
  } catch (error) {
    errorNotification("Error loading services: " + error.message);
  }
}

// ✅ Open Modal & Load Services
document
  .querySelector(".plus_btn")
  .addEventListener("click", renderServiceSelection);

// ✅ Save Selected Services to Database
document
  .getElementById("saveServicesBtn")
  .addEventListener("click", async () => {
    const selectedServices = document.querySelectorAll(
      ".modal-service-card.selected"
    );

    if (selectedServices.length === 0) {
      errorNotification("Please select at least one service.");
      return;
    }

    // ✅ Prepare data for saving
    const serviceData = Array.from(selectedServices).map((card) => ({
      service_id: card.getAttribute("data-service-id"),
    }));

    console.log(
      "Sending services data:",
      JSON.stringify({ services: serviceData })
    );

    try {
      const response = await fetch(`${backendURL}/api/barangay/services`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ services: serviceData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save services.");
      }

      successNotification("Services saved successfully!");
      getServicesByBarangay(); // ✅ Refresh services after saving

      // ✅ Close the modal
      const modalElement = document.getElementById("addServiceModal");
      const modal = bootstrap.Modal.getInstance(modalElement);
      modal.hide();
    } catch (error) {
      errorNotification("An error occurred: " + error.message);
    }
  });

// ✅ Fetch services when the page loads
getServicesByBarangay();
