const EXACT = {
  "/": "Dashboard",
  "/login": "Login",
  "/profile": "Profile",
  "/change-password": "Change password",
  "/users": "Users",
  "/vendors": "Vendors",
  "/products": "Products",
  "/orders": "Orders",
  "/transactions": "Transactions",
  "/faqs": "FAQs",
  "/size-chart": "Size chart",
  "/contact-us": "Contact us",
  "/categories": "Categories",
  "/sub-categories": "Sub categories",
  "/banners": "Banners",
  "/cms/about-us": "About us",
  "/cms/privacy-policy": "Privacy policy",
  "/cms/terms-and-conditions": "Terms & conditions",
  "/support-tickets": "Support tickets",
  "/audit-logs": "Audit logs",
  "/vendor-documents": "Vendor documents",
  "/fraud-flags": "Fraud monitoring",
  "/trash": "Trash",
  "/campaigns-flash": "Campaigns & flash sales",
  "/send-notification": "Send notification",
  "/management/admins": "Admin management",
};

export function adminNavbarTitleFromPath(pathname) {
  if (EXACT[pathname]) return EXACT[pathname];
  if (/^\/users\/[^/]+\/orders\/?$/.test(pathname)) return "User orders";
  if (/^\/vendors\/[^/]+\/products\/?$/.test(pathname)) return "Vendor products";
  if (/^\/vendors\/[^/]+\/orders\/?$/.test(pathname)) return "Vendor orders";
  if (/^\/products\/[^/]+\/ratings\/?$/.test(pathname)) return "Product ratings";
  if (/^\/ratings\/[^/]+\/?$/.test(pathname)) return "Rating details";
  if (pathname.startsWith("/users/")) return "User details";
  if (pathname.startsWith("/vendors/")) return "Vendor details";
  if (pathname.startsWith("/products/")) return "Product details";
  if (pathname.startsWith("/orders/")) return "Order details";
  if (pathname.startsWith("/faqs/new")) return "New FAQ";
  if (pathname.startsWith("/faqs/") && pathname.endsWith("/edit"))
    return "Edit FAQ";
  if (pathname.startsWith("/faqs/")) return "FAQ details";
  if (pathname.startsWith("/size-chart/new")) return "New size chart row";
  if (pathname.startsWith("/size-chart/") && pathname.endsWith("/edit"))
    return "Edit size chart row";
  if (pathname.startsWith("/size-chart/")) return "Size chart details";
  if (pathname.startsWith("/support-tickets/")) return "Ticket details";
  if (pathname.startsWith("/categories/new")) return "New category";
  if (pathname.startsWith("/categories/") && pathname.endsWith("/edit"))
    return "Edit category";
  if (pathname.startsWith("/categories/")) return "Category details";
  if (pathname.startsWith("/sub-categories/new")) return "New sub category";
  if (pathname.startsWith("/sub-categories/") && pathname.endsWith("/edit"))
    return "Edit sub category";
  if (pathname.startsWith("/sub-categories/")) return "Sub category details";
  if (pathname.startsWith("/banners/new")) return "New banner";
  if (pathname.startsWith("/banners/") && pathname.endsWith("/edit"))
    return "Edit banner";
  if (pathname.startsWith("/banners/")) return "Banner details";
  if (pathname.startsWith("/management/admins/new")) return "New admin";
  if (pathname.startsWith("/management/admins/") && pathname.endsWith("/edit"))
    return "Edit admin";
  if (pathname.startsWith("/management/admins/")) return "Admin details";
  return "AssalPay Admin";
}
