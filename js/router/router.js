function setRouter() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const user_id = localStorage.getItem("user_id");
  const agency_name = localStorage.getItem("agency_name");

  // If user is logged in, redirect to dashboard if on login or register page
  if (
    (window.location.pathname === "/" ||
      window.location.pathname === "/login.html" ||
      window.location.pathname === "/register.html" ||
      window.location.pathname === "/stakeholder_login.html" ||
      window.location.pathname === "/stakeholder_register.html") &&
    token
  ) {
    window.location.pathname = "/dashboard.html";
    return; // Exit early to prevent further checks
  }

  // If user is not logged in, redirect to home page if accessing protected pages
  if (
    !token &&
    (window.location.pathname === "/admin_report.html" ||
      window.location.pathname === "/add_services.html" ||
      window.location.pathname === "/admin_view_users.html" ||
      window.location.pathname === "/admin.html" ||
      window.location.pathname === "/bhw.html" ||
      window.location.pathname === "/brgy.html" ||
      window.location.pathname === "/citizen.html" ||
      window.location.pathname === "/citizens_bmi_list.html" ||
      window.location.pathname === "/dashboard.html" ||
      window.location.pathname === "/demo.html" ||
      window.location.pathname === "/equipment.html" ||
      window.location.pathname === "/history.html" ||
      window.location.pathname === "/med.html" ||
      window.location.pathname === "/medicine_availment.html" ||
      window.location.pathname === "/municipality_report.html" ||
      window.location.pathname === "/profiling.html" ||
      window.location.pathname === "/province_report.html" ||
      window.location.pathname === "/province.html" ||
      window.location.pathname === "/reports.html" ||
      window.location.pathname === "/service_availment.html" ||
      window.location.pathname === "/service_view.html" ||
      window.location.pathname === "/services.html" ||
      window.location.pathname === "/stake_brgy.html" ||
      window.location.pathname === "/stakeholder_user.html" ||
      window.location.pathname === "/stakeholder-dashboard.html" ||
      window.location.pathname === "/stakeholder.html" ||
      window.location.pathname === "/super_serv.html" ||
      window.location.pathname === "/superadmin_citizen.html" ||
      window.location.pathname === "/superadmin_dashboard.html" ||
      window.location.pathname === "/superadmin_equipment.html" ||
      window.location.pathname === "/superadmin_med-avail.html" ||
      window.location.pathname === "/superadmin_med.html" ||
      window.location.pathname === "/superadmin_report.html" ||
      window.location.pathname === "/superadmin_supplies.html" ||
      window.location.pathname === "/superadmin_history.html" ||
      window.location.pathname === "/superadmin.html" ||
      window.location.pathname === "/supplies.html" ||
      window.location.pathname === "/user_report.html" ||
      window.location.pathname === "/user_view.html" ||
      window.location.pathname === "/users.html" ||
      window.location.pathname === "/view_users.html")
  ) {
    window.location.pathname = "/";
    return; // Exit early to prevent further checks
  }
}

export { setRouter };
