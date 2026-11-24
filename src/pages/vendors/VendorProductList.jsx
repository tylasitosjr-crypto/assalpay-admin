import { Link, useParams } from "react-router-dom";
import ProductList from "../products/ProductList.jsx";

export default function VendorProductList() {
  const { id } = useParams();
  return (
    <div className="stack" style={{ gap: "1rem" }}>
      <div>
        <Link className="btn" to={`/vendors/${id}`}>
          ← Back to vendor
        </Link>
      </div>
      <ProductList fixedVendorId={id} />
    </div>
  );
}
