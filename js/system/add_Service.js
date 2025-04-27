import {
  backendURL,
  showNavAdminPages,
  successNotification,
  errorNotification,
  fetchUserDetails,
  logout,
  serviceColors,
  iconColors,
  DEFAULT_ICON_COLOR,
  hideBarangayForSuperAdmin,
} from "../utils/utils.js";

// Show Admin Pages
showNavAdminPages();
fetchUserDetails();
hideBarangayForSuperAdmin();

// Logout Button
const btn_logout = document.getElementById("btn_logout");
if (btn_logout) {
  btn_logout.addEventListener("click", logout);
}

const iconPickerButton = document.getElementById("iconPickerButton");
const iconPickerPopup = document.getElementById("iconPickerPopup");
const iconGrid = document.getElementById("iconGrid");
const selectedIconInput = document.getElementById("selectedIcon");
const selectedIconPreview = document.getElementById("selectedIconPreview");

const icons = [
  { class: "fa-stethoscope", name: "Stethoscope", color: "#E57373" },
  { class: "fa-user-nurse", name: "Nurse", color: "#64B5F6" },
  { class: "fa-heartbeat", name: "Heartbeat", color: "#E76F51" },
  { class: "fa-syringe", name: "Syringe", color: "#81C784" },
  { class: "fa-pills", name: "Pills", color: "#FFD54F" },
  { class: "fa-hospital", name: "Hospital", color: "#BA68C8" },
  { class: "fa-ambulance", name: "Ambulance", color: "#FFB74D" },
  { class: "fa-first-aid", name: "First Aid", color: "#F06292" },
  { class: "fa-dna", name: "DNA", color: "#4DD0E1" },
  { class: "fa-notes-medical", name: "Medical Notes", color: "#264653" },
  { class: "fa-clinic-medical", name: "Clinic", color: "#2A9D8F" },
  { class: "fa-thermometer", name: "Thermometer", color: "#F4A261" },
  { class: "fa-bone", name: "Bone", color: "#8D99AE" },
  { class: "fa-tooth", name: "Dentist", color: "#A8DADC" },
  { class: "fa-brain", name: "Brain", color: "#F4E285" },
  { class: "fa-eye", name: "Eye Care", color: "#8E44AD" },
  { class: "fa-lungs", name: "Lungs", color: "#457B9D" },
  { class: "fa-hands-helping", name: "Assistance", color: "#16A085" },
  { class: "fa-procedures", name: "Bed Patient", color: "#C0392B" },
  { class: "fa-x-ray", name: "X-ray", color: "#7F8C8D" },
  { class: "fa-vial", name: "Lab Test", color: "#D35400" },
  { class: "fa-vials", name: "Lab Samples", color: "#1ABC9C" },
  { class: "fa-microscope", name: "Microscope", color: "#9B59B6" },
  { class: "fa-biohazard", name: "Biohazard", color: "#FF0000" },
  { class: "fa-virus", name: "Virus", color: "#27AE60" },
  { class: "fa-viruses", name: "Viruses", color: "#D35400" },
  { class: "fa-user-md", name: "Doctor", color: "#3498DB" },
  {
    class: "fa-hand-holding-medical",
    name: "Medical Assistance",
    color: "#2ECC71",
  },
  { class: "fa-blood", name: "Blood Donation", color: "#E74C3C" },

  // ✅ New Barangay Health Center-Related Icons
  { class: "fa-baby", name: "Prenatal Care", color: "#F06292" },
  { class: "fa-baby-carriage", name: "Postnatal Care", color: "#FFB74D" },
  { class: "fa-syringe", name: "Immunization", color: "#4DD0E1" },
  { class: "fa-user-check", name: "Check-up", color: "#64B5F6" },
  { class: "fa-tooth", name: "Dental Check-up", color: "#FFD54F" },
  { class: "fa-viruses", name: "Deworming", color: "#81C784" },
  { class: "fa-hands-wash", name: "Sanitation Program", color: "#F4A261" },
  { class: "fa-people-roof", name: "Family Planning", color: "#8E44AD" },
  { class: "fa-lungs-virus", name: "TB Screening", color: "#20C997" },
  {
    class: "fa-hand-holding-heart",
    name: "Mental Health Counseling",
    color: "#6F42C1",
  },
  { class: "fa-user-injured", name: "Emergency Care", color: "#E76F51" },
  { class: "fa-heart", name: "Hypertension Screening", color: "#D63384" },
  { class: "fa-weight", name: "Child Growth Monitoring", color: "#795548" },
  { class: "fa-user-shield", name: "Senior Citizen Health", color: "#FD7E14" },
];

// Populate the icon grid
icons.forEach((icon) => {
  const iconElement = document.createElement("div");
  iconElement.classList.add("icon-option");
  iconElement.innerHTML = `<i class="fa ${icon.class}"></i>`;
  iconElement.style.color = icon.color; // Apply color to icon
  iconElement.dataset.icon = icon.class;

  // Click event to select an icon
  iconElement.addEventListener("click", function () {
    selectedIconPreview.className = `fa ${icon.class}`;
    selectedIconPreview.style.color = icon.color;
    selectedIconInput.value = icon.class;
    iconPickerPopup.style.display = "none"; // Hide popup
  });

  iconGrid.appendChild(iconElement);
});

// Toggle the icon picker popup
iconPickerButton.addEventListener("click", () => {
  iconPickerPopup.style.display =
    iconPickerPopup.style.display === "block" ? "none" : "block";
});

// Hide the popup when clicking outside
document.addEventListener("click", (event) => {
  if (
    !iconPickerButton.contains(event.target) &&
    !iconPickerPopup.contains(event.target)
  ) {
    iconPickerPopup.style.display = "none";
  }
});

async function getServices(query = "") {
  try {
    const response = await fetch(
      `${backendURL}/api/services${query ? `?search=${query}` : ""}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (response.ok) {
      const services = await response.json();
      let cardHTML = "";

      services.forEach((service) => {
        // ✅ Check if it's a predefined service or a newly added one
        const iconColor =
          serviceColors[service.name] ||
          iconColors[service.icon] ||
          DEFAULT_ICON_COLOR;

        cardHTML += `
  <div class="service-card card mb-3 text-center p-3" style="width: 15rem; height: 15rem;" data-id="${service.id}">
      <div class="card-body d-flex flex-column align-items-center justify-content-center">
          <i class="fa ${service.icon}" style="font-size: 7rem; color: ${iconColor};"></i>
          <h5 class="card-title mt-auto">${service.name}</h5>
      </div>
  </div>`;
      });

      document.getElementById("servicesContainer").innerHTML = cardHTML;
    } else {
      errorNotification(
        `Failed to load services: HTTP Error ${response.status}`
      );
    }
  } catch (error) {
    errorNotification(
      "An error occurred while fetching services: " + error.message
    );
  }
}

// ✅ Call function to display services
getServices();

document
  .getElementById("addServiceForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = `<div class="spinner-border me-2" role="status"></div><span>Saving...</span>`;

    // ✅ Get the selected icon value
    const selectedIconValue = document.getElementById("selectedIcon").value;

    // ✅ Ensure all required fields are present
    const serviceData = {
      name: document.getElementById("serviceName").value.trim(),
      description: document.getElementById("serviceDescription").value.trim(),
      icon: selectedIconValue || "fa-question-circle", // Default icon if none selected
    };

    try {
      const response = await fetch(`${backendURL}/api/services`, {
        credentials: "include",
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ services: [serviceData] }), // ✅ Wrap in an array
      });

      if (response.ok) {
        successNotification("Service added successfully.");
        document.getElementById("addServiceForm").reset();

        // Hide the modal
        const modalElement = document.getElementById("addServiceModal");
        const modal =
          bootstrap.Modal.getInstance(modalElement) ||
          new bootstrap.Modal(modalElement);
        modal.hide();

        await getServices(); // ✅ Refresh the services list
      } else {
        const json = await response.json();
        errorNotification(json.message);
      }
    } catch (error) {
      errorNotification("An error occurred: " + error.message);
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = `Add Service`;
    }
  });

//  Search Services
document.getElementById("searchInput").addEventListener("input", function () {
  const filter = this.value.trim().toLowerCase();
  const serviceCards = document.querySelectorAll(".service-card");

  serviceCards.forEach((card) => {
    const serviceName = card
      .querySelector(".card-title")
      .textContent.toLowerCase();
    card.style.display = serviceName.includes(filter) ? "block" : "none";
  });
});
