import {
  backendURL,
  errorNotification,
  showNavAdminPages,
  logout,
} from "../utils/utils.js";

showNavAdminPages();

const btn_logout = document.getElementById("btn_logout");
if (btn_logout) {
  btn_logout.addEventListener("click", logout);
}

let originalMedicineData = []; // Stores all medicine availment data

/** ✅ Fetch and Load Barangay Report with optional from/to date filtering */
async function fetchBarangayReport(fromDate = "", toDate = "") {
  try {
    // Build URL with optional query params
    let url = new URL(`${backendURL}/api/citizen-report`);

    if (fromDate && toDate) {
      url.searchParams.append("from", fromDate);
      url.searchParams.append("to", toDate);
    }

    const response = await fetch(url.toString(), {
      credentials: "include",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok)
      throw new Error(`HTTP ${response.status} - Failed to fetch report data`);

    const data = await response.json();
    console.log("📊 API Response:", data);

    if (!data.success) {
      throw new Error(data.error || "Failed to load report data.");
    }

    displayReport(data);
  } catch (error) {
    console.error("Error fetching report data:", error);
    errorNotification("Failed to load barangay report.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  fetchBarangayReport();

  const medicineCard = document.getElementById("medicineChart");
  if (medicineCard) {
    medicineCard.style.cursor = "pointer";
    medicineCard.addEventListener("click", () => {
      document.getElementById("fromDate").value = "";
      document.getElementById("toDate").value = "";
      renderChart("medicineChart", "Medicine Availment", originalMedicineData);
      window.location.href = "medicine_availment.html";
    });
  }

  const serviceCard = document.getElementById("serviceChart");
  if (serviceCard) {
    serviceCard.style.cursor = "pointer";
    serviceCard.addEventListener("click", () => {
      window.location.href = "service_availment.html";
    });
  }

  // 🔍 Date filter logic
  document.getElementById("filterBtn")?.addEventListener("click", () => {
    const fromDate = document.getElementById("fromDate").value;
    const toDate = document.getElementById("toDate").value;

    if (!fromDate || !toDate) {
      errorNotification("Please select both From and To dates.");
      return;
    }

    fetchBarangayReport(fromDate, toDate); // Fetch with date filter
  });

  document.getElementById("reset")?.addEventListener("click", () => {
    document.getElementById("fromDate").value = "";
    document.getElementById("toDate").value = "";
    fetchBarangayReport(); // Fetch full report again with no filter
  });
});

function displayReport(data) {
  document.getElementById("totalPopulation").textContent =
    data.totalPopulation || 0;
  document.getElementById("maleCount").textContent =
    data.genderDistribution?.Male || 0;
  document.getElementById("femaleCount").textContent =
    data.genderDistribution?.Female || 0;

  document.getElementById("underweightCount").textContent =
    data.bmiData?.Underweight || 0;
  document.getElementById("normalCount").textContent =
    data.bmiData?.Normal || 0;
  document.getElementById("overweightCount").textContent =
    data.bmiData?.Overweight || 0;
  document.getElementById("obeseCount").textContent = data.bmiData?.Obese || 0;

  renderBmiChart(data.bmiData || {});
  originalMedicineData = data.medicineData || [];
  renderChart("medicineChart", "Medicine Availment", originalMedicineData);
  renderChart("serviceChart", "Service Availment", data.serviceData || []);
}

function renderChart(canvasId, label, dataset) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.warn(`⚠️ Skipping chart: ${canvasId} not found`);
    return;
  }

  const ctx = canvas.getContext("2d");

  if (window[canvasId] instanceof Chart) {
    window[canvasId].destroy();
  }

  if (!Array.isArray(dataset) || dataset.length === 0) {
    console.warn(`⚠️ No data available for ${label}, skipping chart.`);
    return;
  }

  window[canvasId] = new Chart(ctx, {
    type: "pie",
    data: {
      labels: dataset.map(
        (item) => item.medicine_name || item.service_name || "Unknown"
      ),
      datasets: [
        {
          label: label,
          data: dataset.map((item) => item.total_availed || 0),
          backgroundColor: [
            "#063e4f",
            "#28a745",
            "#ffc107",
            "#dc3545",
            "#17a2b8",
            "#6f42c1",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        datalabels: {
          color: "#fff",
          font: {
            weight: "bold",
            size: 14,
          },
          formatter: () => null,
        },
        tooltip: {
          callbacks: {
            label: (tooltipItem) => {
              const value = tooltipItem.raw || 0;
              const label = tooltipItem.label || "";
              return `${label}: ${value} citizen${value !== 1 ? "s" : ""}`;
            },
          },
        },
      },
    },
    plugins: [ChartDataLabels],
  });
}

function renderBmiChart(bmiData) {
  console.log("📊 Debugging - BMI Data for Chart:", bmiData);

  if (!bmiData || Object.keys(bmiData).length === 0) {
    console.warn("⚠️ No data available for BMI, skipping chart.");
    document.getElementById("bmiChart").parentNode.innerHTML =
      "<p class='text-center text-muted'>No BMI data available</p>";
    return;
  }

  const canvas = document.getElementById("bmiChart");
  if (!canvas) {
    console.warn("⚠️ Canvas element for BMI chart not found.");
    return;
  }

  const ctx = canvas.getContext("2d");

  if (window.bmiChartInstance instanceof Chart) {
    window.bmiChartInstance.destroy();
  }

  const labels = ["Underweight", "Normal", "Overweight", "Obese"];
  const values = labels.map((label) => bmiData[label] || 0);

  window.bmiChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Number of Citizens",
          data: values,
          backgroundColor: ["#1E90FF", "#32CD32", "#FFD700", "#FF4500"],
          borderColor: "#333",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Number of Citizens" },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (tooltipItem) => ` ${tooltipItem.raw} citizen(s)`,
          },
        },
      },
    },
  });
}

const downloadBtn = document.getElementById("download-pdf");

downloadBtn.addEventListener("click", async () => {
  const reportElement = document.getElementById("dashboard_content");
  const originalButton = downloadBtn;

  originalButton.style.display = "none";

  const printable = reportElement.cloneNode(true);
  const dateFilterSection = printable.querySelector(".mt-3.text-center");
  if (dateFilterSection) {
    dateFilterSection.remove(); // Remove the From/To filter UI
  }

  printable.style.width = "100%";
  printable.style.padding = "20px";
  printable.style.backgroundColor = "white";
  printable.style.textAlign = "left";
  printable.style.margin = "0 auto";
  printable.style.display = "block";

  const clonedSummary = printable.querySelector("#summaryReport");
  if (clonedSummary) {
    clonedSummary.style.fontSize = "12px";
  }

  const cards = printable.querySelectorAll(".row.g-3.mt-2 .card");
  cards.forEach((card) => {
    card.style.padding = "1.5rem";
    card.style.fontSize = "0.7rem";
    card.style.minHeight = "130px";

    const h6 = card.querySelector("h6");
    const h4 = card.querySelector("h4");

    if (h6) h6.style.fontSize = "0.rem";
    if (h4) h4.style.fontSize = "1rem";
  });

  const originalCanvases = reportElement.querySelectorAll("canvas");
  const clonedCanvases = printable.querySelectorAll("canvas");

  for (let i = 0; i < originalCanvases.length; i++) {
    const originalCanvas = originalCanvases[i];
    const clonedCanvas = clonedCanvases[i];

    const image = new Image();
    image.src = originalCanvas.toDataURL("image/png");
    image.className = "chart-img";
    image.style.width = "100%";
    image.style.height = "auto";

    clonedCanvas.parentNode.replaceChild(image, clonedCanvas);
  }

  const container = document.createElement("div");
  container.style.display = "block";
  container.style.padding = "1rem";
  container.appendChild(printable);
  document.body.appendChild(container);

  const opt = {
    margin: 0.5,
    filename: `Barangay_Report_${new Date().toISOString().slice(0, 10)}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
  };

  await html2pdf().set(opt).from(container).save();

  document.body.removeChild(container);
  originalButton.style.display = "inline-block";
});
