import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "./context/AuthContext.jsx";
import { TOKEN_KEY } from "./api/axiosInstance.js";
import AdminLayout from "./components/layout/AdminLayout.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Profile from "./pages/Profile.jsx";
import ChangePassword from "./pages/ChangePassword.jsx";
import UserList from "./pages/users/UserList.jsx";
import UserDetail from "./pages/users/UserDetail.jsx";
import UserOrderList from "./pages/users/UserOrderList.jsx";
import VendorList from "./pages/vendors/VendorList.jsx";
import VendorDetail from "./pages/vendors/VendorDetail.jsx";
import VendorProductList from "./pages/vendors/VendorProductList.jsx";
import VendorOrderList from "./pages/vendors/VendorOrderList.jsx";
import ProductList from "./pages/products/ProductList.jsx";
import ProductDetail from "./pages/products/ProductDetail.jsx";
import ProductRatingsList from "./pages/products/ProductRatingsList.jsx";
import RatingDetail from "./pages/ratings/RatingDetail.jsx";
import OrderList from "./pages/orders/OrderList.jsx";
import OrderDetail from "./pages/orders/OrderDetail.jsx";
import TransactionList from "./pages/transactions/TransactionList.jsx";
import FaqList from "./pages/faqs/FaqList.jsx";
import FaqDetail from "./pages/faqs/FaqDetail.jsx";
import FaqForm from "./pages/faqs/FaqForm.jsx";
import SizeChartList from "./pages/sizeChart/SizeChartList.jsx";
import SizeChartDetail from "./pages/sizeChart/SizeChartDetail.jsx";
import SizeChartForm from "./pages/sizeChart/SizeChartForm.jsx";
import ContactList from "./pages/contact/ContactList.jsx";
import ContactDetail from "./pages/contact/ContactDetail.jsx";
import CategoryList from "./pages/categories/CategoryList.jsx";
import CategoryDetail from "./pages/categories/CategoryDetail.jsx";
import CategoryForm from "./pages/categories/CategoryForm.jsx";
import SubcategoryList from "./pages/subcategories/SubcategoryList.jsx";
import SubcategoryDetail from "./pages/subcategories/SubcategoryDetail.jsx";
import SubcategoryForm from "./pages/subcategories/SubcategoryForm.jsx";
import BannerList from "./pages/banners/BannerList.jsx";
import BannerDetail from "./pages/banners/BannerDetail.jsx";
import BannerForm from "./pages/banners/BannerForm.jsx";
import CmsEditor from "./pages/cms/CmsEditor.jsx";
import SendNotification from "./pages/super/SendNotification.jsx";
import AdminList from "./pages/management/admins/AdminList.jsx";
import AdminDetail from "./pages/management/admins/AdminDetail.jsx";
import AdminForm from "./pages/management/admins/AdminForm.jsx";
import RefundList from "./pages/refunds/RefundList.jsx";
import RefundDetail from "./pages/refunds/RefundDetail.jsx";
import WithdrawalList from "./pages/withdrawals/WithdrawalList.jsx";
import WithdrawalDetail from "./pages/withdrawals/WithdrawalDetail.jsx";
import CouponList from "./pages/coupons/CouponList.jsx";
import CouponForm from "./pages/coupons/CouponForm.jsx";
import CommissionVendorList from "./pages/commissions/CommissionVendorList.jsx";
import CommissionVendorDetail from "./pages/commissions/CommissionVendorDetail.jsx";
import FeaturedManager from "./pages/featured/FeaturedManager.jsx";
import HomepageSections from "./pages/homepage/HomepageSections.jsx";
import RoleList from "./pages/management/roles/RoleList.jsx";
import AuditLogs from "./pages/platform/AuditLogs.jsx";
import SupportTicketList from "./pages/platform/SupportTicketList.jsx";
import SupportTicketDetail from "./pages/platform/SupportTicketDetail.jsx";
import VendorDocuments from "./pages/platform/VendorDocuments.jsx";
import FraudFlags from "./pages/platform/FraudFlags.jsx";
import TrashBin from "./pages/platform/TrashBin.jsx";
import CampaignsFlash from "./pages/platform/CampaignsFlash.jsx";

function PermissionRoute({ children, anyOf = [] }) {
  const { user, can } = useAuth();
  if (!user && localStorage.getItem(TOKEN_KEY)) {
    return <p className="muted" style={{ padding: "1rem" }}>Loading…</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  const ok = anyOf.length === 0 || anyOf.some((p) => can(p));
  if (!ok) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function PrivateRoute({ children }) {
  if (!localStorage.getItem(TOKEN_KEY)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function SuperAdminRoute({ children }) {
  const { user } = useAuth();
  if (!user && localStorage.getItem(TOKEN_KEY)) {
    return <p className="muted" style={{ padding: "1rem" }}>Loading…</p>;
  }
  if (!user || user.role !== "super_admin") {
    return <Navigate to="/" replace />;
  }
  return children;
}

function AuthBootstrap({ children }) {
  const { refreshMe, logout } = useAuth();
  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (t) {
      refreshMe().catch(() => logout());
    }
  }, [refreshMe, logout]);
  return children;
}

export default function App() {
  return (
    <AuthBootstrap>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <AdminLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="change-password" element={<ChangePassword />} />

          <Route path="users" element={<UserList />} />
          <Route path="users/:id/orders" element={<UserOrderList />} />
          <Route path="users/:id" element={<UserDetail />} />

          <Route path="vendors" element={<VendorList />} />
          <Route path="vendors/:id/orders" element={<VendorOrderList />} />
          <Route path="vendors/:id/products" element={<VendorProductList />} />
          <Route path="vendors/:id" element={<VendorDetail />} />

          <Route path="products" element={<ProductList />} />
          <Route path="products/:id/ratings" element={<ProductRatingsList />} />
          <Route path="products/:id" element={<ProductDetail />} />

          <Route path="ratings/:id" element={<RatingDetail />} />

          <Route path="orders" element={<OrderList />} />
          <Route path="orders/:id" element={<OrderDetail />} />

          <Route path="transactions" element={<TransactionList />} />

          <Route path="refund-requests" element={<RefundList />} />
          <Route path="refund-requests/:id" element={<RefundDetail />} />
          <Route path="withdrawals" element={<WithdrawalList />} />
          <Route path="withdrawals/:id" element={<WithdrawalDetail />} />
          <Route path="coupons" element={<CouponList />} />
          <Route path="coupons/new" element={<CouponForm />} />
          <Route path="coupons/:id" element={<CouponForm />} />
          <Route path="commissions/vendors" element={<CommissionVendorList />} />
          <Route path="commissions/vendors/:vendorId" element={<CommissionVendorDetail />} />
          <Route path="featured" element={<FeaturedManager />} />
          <Route path="homepage-sections" element={<HomepageSections />} />

          <Route
            path="audit-logs"
            element={
              <PermissionRoute anyOf={["audit_logs"]}>
                <AuditLogs />
              </PermissionRoute>
            }
          />
          <Route
            path="support-tickets"
            element={
              <PermissionRoute anyOf={["support_tickets"]}>
                <SupportTicketList />
              </PermissionRoute>
            }
          />
          <Route
            path="support-tickets/:id"
            element={
              <PermissionRoute anyOf={["support_tickets"]}>
                <SupportTicketDetail />
              </PermissionRoute>
            }
          />
          <Route
            path="vendor-documents"
            element={
              <PermissionRoute anyOf={["vendors"]}>
                <VendorDocuments />
              </PermissionRoute>
            }
          />
          <Route
            path="fraud-flags"
            element={
              <PermissionRoute anyOf={["fraud"]}>
                <FraudFlags />
              </PermissionRoute>
            }
          />
          <Route
            path="trash"
            element={
              <PermissionRoute anyOf={["trash"]}>
                <TrashBin />
              </PermissionRoute>
            }
          />
          <Route
            path="campaigns-flash"
            element={
              <PermissionRoute anyOf={["campaigns"]}>
                <CampaignsFlash />
              </PermissionRoute>
            }
          />

          <Route path="faqs" element={<FaqList />} />
          <Route path="faqs/new" element={<FaqForm />} />
          <Route path="faqs/:id/edit" element={<FaqForm />} />
          <Route path="faqs/:id" element={<FaqDetail />} />

          <Route
            path="size-chart"
            element={
              <PermissionRoute anyOf={["size_chart"]}>
                <SizeChartList />
              </PermissionRoute>
            }
          />
          <Route
            path="size-chart/new"
            element={
              <PermissionRoute anyOf={["size_chart"]}>
                <SizeChartForm />
              </PermissionRoute>
            }
          />
          <Route
            path="size-chart/:id/edit"
            element={
              <PermissionRoute anyOf={["size_chart"]}>
                <SizeChartForm />
              </PermissionRoute>
            }
          />
          <Route
            path="size-chart/:id"
            element={
              <PermissionRoute anyOf={["size_chart"]}>
                <SizeChartDetail />
              </PermissionRoute>
            }
          />

          <Route path="contact-us" element={<ContactList />} />
          <Route path="contact-us/:id" element={<ContactDetail />} />

          <Route path="categories" element={<CategoryList />} />
          <Route path="categories/new" element={<CategoryForm />} />
          <Route path="categories/:id/edit" element={<CategoryForm />} />
          <Route path="categories/:id" element={<CategoryDetail />} />

          <Route path="sub-categories" element={<SubcategoryList />} />
          <Route path="sub-categories/new" element={<SubcategoryForm />} />
          <Route path="sub-categories/:id/edit" element={<SubcategoryForm />} />
          <Route path="sub-categories/:id" element={<SubcategoryDetail />} />

          <Route path="banners" element={<BannerList />} />
          <Route path="banners/new" element={<BannerForm />} />
          <Route path="banners/:id/edit" element={<BannerForm />} />
          <Route path="banners/:id" element={<BannerDetail />} />

          <Route path="cms/:slug" element={<CmsEditor />} />

          <Route
            path="send-notification"
            element={
              <SuperAdminRoute>
                <SendNotification />
              </SuperAdminRoute>
            }
          />
          <Route
            path="management/admins"
            element={
              <SuperAdminRoute>
                <AdminList />
              </SuperAdminRoute>
            }
          />
          <Route
            path="management/admins/new"
            element={
              <SuperAdminRoute>
                <AdminForm />
              </SuperAdminRoute>
            }
          />
          <Route
            path="management/admins/:id/edit"
            element={
              <SuperAdminRoute>
                <AdminForm />
              </SuperAdminRoute>
            }
          />
          <Route
            path="management/admins/:id"
            element={
              <SuperAdminRoute>
                <AdminDetail />
              </SuperAdminRoute>
            }
          />
          <Route
            path="management/roles"
            element={
              <SuperAdminRoute>
                <RoleList />
              </SuperAdminRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthBootstrap>
  );
}
