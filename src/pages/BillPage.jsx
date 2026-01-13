import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../Firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Printer,
  ChefHat,
  Calendar,
  CreditCard,
  CheckCircle2,
  PackageCheck
} from "lucide-react";

export default function BillPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return navigate("/login");

    const fetchOrder = async () => {
      try {
        const ref = doc(db, "restaurants", uid, "orders", orderId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setOrder(snap.data());
          // AUTO PRINT
          setTimeout(() => {
            // window.print(); // Commented out to avoid annoyance during dev, but ready for production
          }, 800);
        }
      } catch (e) {
        console.error("Bill load error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-t-2 border-orange-500 rounded-full"
        />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 font-bold uppercase tracking-widest">
        Bill Not Found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 sm:p-10 pb-32">

      {/* Action Header */}
      <div className="max-w-md mx-auto mb-10 flex items-center justify-between no-print">
        <motion.button
          whileHover={{ x: -2 }}
          onClick={() => navigate("/dashboard")}
          className="text-zinc-500 hover:text-white transition-colors flex items-center gap-2 text-xs font-black uppercase tracking-widest"
        >
          <ArrowLeft size={16} />
          Back
        </motion.button>
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={() => window.print()}
            className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl text-orange-500 hover:bg-zinc-800 transition-all shadow-xl"
          >
            <Printer size={20} />
          </motion.button>
        </div>
      </div>

      {/* RECEIPT CONTAINER */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto bg-white text-zinc-950 rounded-4xl sm:rounded-[2.5rem] p-6 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden print:shadow-none print:p-0 print:rounded-none"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-orange-500 via-red-500 to-orange-500" />

        {/* Restaurant Branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-zinc-950 rounded-2xl mb-4 no-print text-white">
            <ChefHat size={32} />
          </div>
          <h1 className="text-2xl font-black tracking-tighter uppercase mb-1">EATERS BILL</h1>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Restaurant Bill</p>
        </div>

        {/* Invoice Metadata */}
        <div className="space-y-4 mb-8 border-y-2 border-zinc-100 py-6">
          <div className="flex justify-between items-center text-xs">
            <span className="font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2"><Calendar size={12} /> Date</span>
            <span className="font-bold text-zinc-950">
              {order.createdAt?.toDate?.().toLocaleString() || new Date().toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2"><CheckCircle2 size={12} /> Bill No</span>
            <span className="font-black text-zinc-950">#{order.orderNumber}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2"><CreditCard size={12} /> Payment</span>
            <span className={`font-black uppercase tracking-widest ${order.payment === 'completed' ? 'text-emerald-600' : 'text-amber-500'}`}>
              {order.payment === 'completed' ? 'Paid' : 'Not Paid'}
            </span>
          </div>
        </div>

        {/* Itemized list */}
        <div className="space-y-4 mb-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.4em]">Items</span>
            <div className="h-px bg-zinc-100 flex-1" />
          </div>

          <div className="space-y-3">
            {Object.values(order.items).map((item, idx) => (
              <div key={idx} className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <p className="text-sm font-black text-zinc-900 leading-none mb-1 uppercase tracking-tight">{item.name}</p>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Qty: {item.qty} × ₹{item.price}</p>
                </div>
                <span className="text-sm font-black text-zinc-950 font-mono">₹{item.qty * item.price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Totalizer */}
        <div className="bg-zinc-50 rounded-3xl p-6 mb-8 border border-zinc-100">
          <div className="flex justify-between items-center text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">
            <span>Total Amount</span>
            <span>Rupees</span>
          </div>
          <div className="flex justify-between items-end">
            <div className="bg-emerald-500 h-1.5 w-8 rounded-full mb-2" />
            <p className="text-4xl font-black text-zinc-950 tracking-tighter">₹{order.total}</p>
          </div>
        </div>

        {/* Compliance info */}
        <div className="text-center pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 border-2 border-zinc-100 rounded-full mb-6 print:border-zinc-200">
            <PackageCheck size={14} className="text-emerald-500" />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Verified Bill</span>
          </div>
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em] leading-relaxed">
            Thank you for dining with us.<br className="hidden sm:block" />
            Please pay at the counter.
          </p>

          <div className="mt-8 flex justify-center gap-1 opacity-20 no-print">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 bg-zinc-950 rounded-full" />
            ))}
          </div>
        </div>

      </motion.div>

      {/* Print Specific Footer Padding */}
      <div className="print:hidden h-20" />
    </div>
  );
}
