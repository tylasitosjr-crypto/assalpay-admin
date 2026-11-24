import { Link, useParams } from "react-router-dom";
import OrderList from "../orders/OrderList.jsx";

export default function VendorOrderList() {
  const { id } = useParams();
  return (
    <div className="stack" style={{ gap: "1rem" }}>
      <div>
        <Link className="btn" to={`/vendors/${id}`}>
          ← Back to vendor
        </Link>
      </div>
      <OrderList fixedVendorId={id} />
    </div>
  );
}
