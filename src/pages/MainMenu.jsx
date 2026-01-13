import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { db } from "../Firebase"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  ChefHat,
  ShoppingCart,
  Hash,
  CheckCircle2,
  Terminal,
  Plus,
  Minus,
  UtensilsCrossed
} from "lucide-react"
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp
} from "firebase/firestore"

export default function MainMenu() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const [restaurant, setRestaurant] = useState(null)
  const [menu, setMenu] = useState([])
  const [cart, setCart] = useState({})
  const [orderNumber, setOrderNumber] = useState("")
  const [loading, setLoading] = useState(true)
  const [ordering, setOrdering] = useState(false)

  /* ================= LOAD RESTAURANT + MENU ================= */

  useEffect(() => {
    const unsubscribeRestaurant = onSnapshot(
      query(collection(db, "restaurants"), where("slug", "==", slug)),
      (snapshot) => {
        if (snapshot.empty) {
          setLoading(false)
          return
        }

        const restDoc = snapshot.docs[0]
        setRestaurant({ id: restDoc.id, ...restDoc.data() })

        onSnapshot(
          collection(db, "restaurants", restDoc.id, "menu"),
          (menuSnap) => {
            setMenu(
              menuSnap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(item => item.available)
            )
            setLoading(false)
          }
        )
      }
    )

    return () => unsubscribeRestaurant()
  }, [slug])

  /* ================= CART ================= */

  const updateQty = (item, qty) => {
    setCart(prev => {
      if (qty <= 0) {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      }

      return {
        ...prev,
        [item.id]: {
          name: item.name,
          price: item.priceFull || item.price || 0, // Fallback to price if priceFull isn't there
          qty
        }
      }
    })
  }

  const total = Object.values(cart).reduce(
    (sum, i) => sum + i.price * i.qty,
    0
  )

  /* ================= PLACE ORDER ================= */

  const placeOrder = async () => {
    if (!orderNumber) return alert("Enter order number")
    if (Object.keys(cart).length === 0) return alert("Cart is empty")

    setOrdering(true)
    try {
      await addDoc(
        collection(db, "restaurants", restaurant.id, "orders"),
        {
          orderNumber,
          items: cart,
          total,
          status: "pending",
          createdAt: serverTimestamp()
        }
      )

      setCart({})
      setOrderNumber("")
      alert("✅ Order injected to Kitchen")
    } catch (e) {
      alert("Fail: " + e.message)
    } finally {
      setOrdering(false)
    }
  }

  /* ================= UI ================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-t-2 border-emerald-500 rounded-full"
        />
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-center">
        <h1 className="text-white font-black text-2xl uppercase tracking-widest">Secure Node Not Found</h1>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-emerald-500/30 pb-40">

      {/* Station Header */}
      <div className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 p-2 rounded-xl">
              <Terminal size={18} className="text-emerald-500 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-black uppercase tracking-widest leading-none mb-1">{restaurant.name}</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] sm:text-[10px] font-black text-zinc-600 uppercase tracking-widest">Terminal Active</span>
              </div>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/dashboard")}
            className="text-zinc-600 hover:text-white transition-colors p-2"
          >
            <ArrowLeft size={20} />
          </motion.button>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 py-10">

        {/* Order Identifier */}
        <div className="mb-10 space-y-2">
          <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-2">Session Identifier</label>
          <div className="relative group">
            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <input
              placeholder="000 or TABLE-X"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all placeholder:text-zinc-700"
            />
          </div>
        </div>

        {/* Catalog */}
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Service Catalog</h2>
            <div className="h-px bg-white/5 flex-1" />
          </div>

          <AnimatePresence>
            {menu.map((item, idx) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={item.id}
                className="glass-dark rounded-2xl p-4 flex justify-between items-center group hover:border-white/10 transition-colors"
              >
                <div>
                  <p className="font-bold text-zinc-200 uppercase tracking-wide text-xs group-hover:text-emerald-500 transition-colors">{item.name}</p>
                  <p className="text-[10px] font-black font-mono text-zinc-500 mt-0.5">₹{item.priceFull || item.price}</p>
                </div>

                <div className="flex items-center gap-4 bg-zinc-800/50 rounded-xl p-1 shadow-inner border border-white/5">
                  <button
                    className="w-10 h-10 flex items-center justify-center text-zinc-600 hover:text-red-400 transition-all active:scale-90"
                    onClick={() => updateQty(item, (cart[item.id]?.qty || 0) - 1)}
                  >
                    <Minus size={16} />
                  </button>

                  <span className="text-xs font-black text-white w-5 text-center font-mono">
                    {cart[item.id]?.qty || 0}
                  </span>

                  <button
                    className="w-10 h-10 flex items-center justify-center text-zinc-600 hover:text-emerald-400 transition-all active:scale-90"
                    onClick={() => updateQty(item, (cart[item.id]?.qty || 0) + 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Execution Bar */}
      <AnimatePresence>
        {total > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 z-50 pointer-events-none"
          >
            <div className="max-w-xl mx-auto glass-dark rounded-[2rem] sm:rounded-3xl p-4 sm:p-6 border-emerald-500/20 shadow-2xl pointer-events-auto flex items-center justify-between gap-4">
              <div className="text-left">
                <p className="text-[9px] sm:text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-1">Payload Value</p>
                <p className="text-xl sm:text-2xl font-black text-white font-mono leading-none">₹{total}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={placeOrder}
                disabled={ordering}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-800 text-black font-black px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-3 transition-all text-[10px] sm:text-[11px] uppercase tracking-widest shadow-xl shadow-emerald-500/20"
              >
                {ordering ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full"
                  />
                ) : (
                  <>
                    <UtensilsCrossed size={16} />
                    Deploy Order
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
