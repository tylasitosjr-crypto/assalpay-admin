import { Link, useParams } from "react-router-dom";
import OrderList from "../orders/OrderList.jsx";

export default function UserOrderList() {
  const { id } = useParams();
  return (
    <div className="stack" style={{ gap: "1rem" }}>
      <div>
        <Link className="btn" to={`/users/${id}`}>
          ← Back to user
        </Link>
      </div>
      <OrderList fixedUserId={id} />
    </div>
  );
}
