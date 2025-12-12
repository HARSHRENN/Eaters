import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../Firebase";
import { doc, getDoc } from "firebase/firestore";

export default function BillPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return navigate("/login");

    const fetchOrder = async () => {
      const ref = doc(db, "restaurants", uid, "orders", orderId);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setOrder(snap.data());

        // AUTO PRINT
        setTimeout(() => {
          window.print();
        }, 500);
      }
    };

    fetchOrder();
  }, [orderId, navigate]);

  if (!order) return <div className="text-white p-10">Loading bill...</div>;

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-4">Bill #{order.orderNumber}</h1>

      <div className="bg-black/40 p-4 rounded mb-4">
        <p><b>Table:</b> {order.table || "-"}</p>
        <p><b>Payment:</b> {order.payment}</p>
      </div>

      <div className="bg-black/40 p-4 rounded mb-4">
        {Object.values(order.items).map((item) => (
          <div key={item.id} className="flex justify-between border-b border-gray-700 py-2">
            <span>{item.name} × {item.qty}</span>
            <span>₹{item.qty * item.price}</span>
          </div>
        ))}

        <div className="flex justify-between font-bold text-xl mt-3">
          <span>Total</span>
          <span>₹{order.total}</span>
        </div>
      </div>

      <button
        className="bg-gray-700 px-4 py-2 rounded"
        onClick={() => navigate("/dashboard")}
      >
        Back to Dashboard
      </button>
    </div>
  );
}
