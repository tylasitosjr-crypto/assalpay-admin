import { NavLink, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  MdDashboard,
  MdPeople,
  MdInventory2,
  MdShoppingCart,
  MdReceiptLong,
  MdHelpOutline,
  MdMailOutline,
  MdCategory,
  MdSubdirectoryArrowRight,
  MdImage,
  MdArticle,
  MdNotificationsActive,
  MdAdminPanelSettings,
  MdPerson,
  MdLock,
  MdStorefront,
  MdUndo,
  MdAccountBalance,
  MdPercent,
  MdLocalOffer,
  MdStar,
  MdHome,
  MdAssignment,
  MdHistory,
  MdSecurity,
  MdDeleteOutline,
  MdLocalFireDepartment,
  MdStraighten,
} from "react-icons/md";
import { useEffect, useState } from "react";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { confirmLogout } from "../../utils/swalConfirm.js";

const linkStyle = ({ isActive }) => ({
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  padding: "0.55rem 0.85rem",
  borderRadius: 8,
  color: isActive ? "#fff" : "rgba(255,255,255,0.88)",
  background: isActive ? "rgba(255,255,255,0.14)" : "transparent",
  textDecoration: "none",
  fontSize: "0.9rem",
});

function Group({ title, children }) {
  return (
    <div style={{ marginBottom: "1.1rem" }}>
      <div
        style={{
          fontSize: "0.68rem",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.48)",
          marginBottom: "0.35rem",
          paddingLeft: "0.85rem",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

export default function Sidebar({ onNavigate }) {
  const navigate = useNavigate();
  const { logout, can, isSuperAdmin } = useAuth();
  const [pending, setPending] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const body = unwrap(await axiosInstance.get("/admin/meta/pending-counts"));
        if (alive) setPending(body);
      } catch {
        /* offline / forbidden */
      }
    };
    load();
    const t = setInterval(load, 45_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const handleLogout = async () => {
    const ok = await confirmLogout();
    if (!ok) return;
    logout();
    toast.success("Logged out");
    navigate("/login");
    onNavigate?.();
  };

  const Item = ({ to, icon: Icon, label, end }) => (
    <NavLink to={to} style={linkStyle} end={end} onClick={() => onNavigate?.()}>
      {Icon ? <Icon size={18} /> : null}
      {label}
    </NavLink>
  );

  const Badge = ({ n }) =>
    n > 0 ? (
      <span
        style={{
          marginLeft: "0.35rem",
          fontSize: "0.72rem",
          background: "#ef4444",
          color: "#fff",
          borderRadius: 999,
          padding: "0.08rem 0.4rem",
          fontWeight: 700,
        }}
      >
        {n > 99 ? "99+" : n}
      </span>
    ) : null;

  const ItemIf = ({ to, icon: Icon, label, end, perm, anyOf, badge }) => {
    const ok =
      isSuperAdmin ||
      (perm && can(perm)) ||
      (anyOf && anyOf.some((p) => can(p)));
    if (!ok) return null;
    return (
      <NavLink to={to} style={linkStyle} end={end} onClick={() => onNavigate?.()}>
        {Icon ? <Icon size={18} /> : null}
        {label}
        {badge != null ? <Badge n={badge} /> : null}
      </NavLink>
    );
  };

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__brand">ASSALPAY ADMIN</div>
      <nav className="admin-sidebar__nav" aria-label="Main navigation">
        <Group title="Overview">
          <Item to="/" icon={MdDashboard} label="Dashboard" end />
        </Group>
        <Group title="Marketplace">
          <ItemIf to="/users" icon={MdPeople} label="Users" anyOf={["users", "users_ro"]} />
          <ItemIf to="/vendors" icon={MdStorefront} label="Vendors" perm="vendors" />
          <ItemIf
            to="/products"
            icon={MdInventory2}
            label="Products"
            perm="products"
            badge={pending?.product_approvals}
          />
          <ItemIf to="/orders" icon={MdShoppingCart} label="Orders" anyOf={["orders", "orders_ro"]} />
          <ItemIf to="/transactions" icon={MdReceiptLong} label="Transactions" perm="transactions" />
          <ItemIf
            to="/refund-requests"
            icon={MdUndo}
            label="Refunds"
            anyOf={["refunds", "refunds_ro"]}
            badge={pending?.refunds}
          />
          <ItemIf
            to="/withdrawals"
            icon={MdAccountBalance}
            label="Withdrawals"
            perm="withdrawals"
            badge={pending?.withdrawals}
          />
          <ItemIf to="/coupons" icon={MdLocalOffer} label="Coupons" perm="coupons" />
          <ItemIf to="/commissions/vendors" icon={MdPercent} label="Commissions" perm="commissions" />
        </Group>
        <Group title="Platform">
          {/* <ItemIf
            to="/vendor-documents"
            icon={MdStorefront}
            label="Vendor verification"
            perm="vendors"
            badge={pending?.vendor_documents}
          /> */}
          <ItemIf to="/campaigns-flash" icon={MdLocalFireDepartment} label="Campaigns & flash" perm="campaigns" />
          <ItemIf
            to="/fraud-flags"
            icon={MdSecurity}
            label="Fraud monitor"
            perm="fraud"
            badge={pending?.fraud_flags}
          />
          <ItemIf to="/trash" icon={MdDeleteOutline} label="Trash" perm="trash" />
          <ItemIf to="/audit-logs" icon={MdHistory} label="Audit logs" perm="audit_logs" />
        </Group>
        <Group title="Content">
          <ItemIf to="/categories" icon={MdCategory} label="Categories" perm="categories" />
          <ItemIf
            to="/sub-categories"
            icon={MdSubdirectoryArrowRight}
            label="Sub categories"
            perm="subcategories"
          />
          <ItemIf to="/banners" icon={MdImage} label="Banners" perm="banners" />
          <ItemIf to="/featured" icon={MdStar} label="Featured manager" perm="featured" />
          <ItemIf to="/homepage-sections" icon={MdHome} label="Homepage sections" perm="homepage_sections" />
          <ItemIf to="/faqs" icon={MdHelpOutline} label="FAQs" perm="faqs" />
          <ItemIf
            to="/size-chart"
            icon={MdStraighten}
            label="Size chart"
            perm="size_chart"
          />
          <ItemIf to="/cms/about-us" icon={MdArticle} label="About us" perm="cms" />
          <ItemIf to="/cms/privacy-policy" icon={MdArticle} label="Privacy policy" perm="cms" />
          <ItemIf
            to="/cms/terms-and-conditions"
            icon={MdArticle}
            label="Terms & conditions"
            perm="cms"
          />
        </Group>
        <Group title="Support">
          <ItemIf
            to="/support-tickets"
            icon={MdAssignment}
            label="Support tickets"
            perm="support_tickets"
            badge={pending?.support_tickets}
          />
          <ItemIf to="/contact-us" icon={MdMailOutline} label="Contact us" anyOf={["contact_ro", "orders"]} />
        </Group>
        {isSuperAdmin && (
          <Group title="Super admin">
            <Item
              to="/send-notification"
              icon={MdNotificationsActive}
              label="Send notification"
            />
            <Item
              to="/management/admins"
              icon={MdAdminPanelSettings}
              label="Admin management"
            />
            <Item to="/management/roles" icon={MdAdminPanelSettings} label="Roles" />
          </Group>
        )}
        <Group title="Account">
          <Item to="/profile" icon={MdPerson} label="Profile" />
          <Item to="/change-password" icon={MdLock} label="Change password" />
        </Group>
      </nav>
      <div className="admin-sidebar__footer">
        <button
          type="button"
          className="btn ghost admin-sidebar__logout"
          onClick={handleLogout}
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
