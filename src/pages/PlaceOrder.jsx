import { useEffect, useState } from "react"
import { auth, db } from "../Firebase"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  Search,
  ShoppingCart,
  ChevronRight,
  Plus,
  Minus,
  Check,
  CreditCard,
  Utensils,
  ShoppingBag,
  Hash,
  CheckCircle2
} from "lucide-react"
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  addDoc,
  updateDoc,
  setDoc
} from "firebase/firestore"

// --- Helper Functions ---
const getNextOrderNumber = async (uid) => {
  const counterRef = doc(db, "restaurants", uid, "metadata", "orderCounter")
  const snap = await getDoc(counterRef)
  let next = 1
  if (!snap.exists()) {
    await setDoc(counterRef, { current: 1 })
  } else {
    next = snap.data().current + 1
    await updateDoc(counterRef, { current: next })
  }
  return next
}

export default function PlaceOrder() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [menuItems, setMenuItems] = useState([])
  const [cart, setCart] = useState({})
  const [orderType, setOrderType] = useState("dine-in")
  const [paymentStatus, setPaymentStatus] = useState("pending")
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [tableNo, setTableNo] = useState("")
  const [saving, setSaving] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return navigate("/login")

    return onSnapshot(collection(db, "restaurants", uid, "menu"), (snapshot) => {
      setMenuItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [navigate])

  const addToCart = (item, type) => {
    const key = `${item.id}_${type}`
    setCart(prev => ({
      ...prev,
      [key]: {
        id: item.id,
        name: item.name,
        type,
        price: type === "Full" ? item.priceFull : item.priceHalf,
        qty: (prev[key]?.qty || 0) + 1
      }
    }))
  }

  const removeFromCart = (key) => {
    setCart(prev => {
      if (!prev[key]) return prev
      const updated = { ...prev }
      if (updated[key].qty > 1) {
        updated[key].qty -= 1
      } else {
        delete updated[key]
      }
      return updated
    })
  }

  const cartTotal = Object.values(cart).reduce((sum, it) => sum + (it.price * it.qty), 0)
  const cartCount = Object.values(cart).reduce((sum, it) => sum + it.qty, 0)

  const placeOrder = async () => {
    if (!cartCount) return
    setSaving(true)
    try {
      const uid = auth.currentUser.uid
      const orderNumber = await getNextOrderNumber(uid)
      await addDoc(collection(db, "restaurants", uid, "orders"), {
        orderNumber,
        items: cart,
        total: cartTotal,
        payment: paymentStatus,
        status: "pending",
        type: orderType,
        tableNo,
        createdAt: new Date()
      })
      setCart({}); setTableNo(""); setShowCheckout(false)
      alert(`Order #${orderNumber} Synchronized`)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const categories = [...new Set(menuItems.map(i => i.category))]
  const filteredItems = menuItems.filter(i =>
    (activeCategory === "all" || i.category === activeCategory) &&
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    i.available !== false
  )

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="rounded-full h-12 w-12 border-t-2 border-orange-500" />
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-orange-500/30 pb-40">
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <motion.button whileHover={{ x: -2 }} onClick={() => navigate("/dashboard")} className="text-zinc-500 hover:text-white"><ArrowLeft size={20} /></motion.button>
            <div className="h-8 w-px bg-white/5 mx-1 hidden sm:block" />
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest leading-none mb-1">Food Ordering</h1>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none uppercase">Place Order</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative group flex-1 sm:w-48 lg:w-64 text-left">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-orange-500 transition-colors" size={14} />
              <input placeholder="Search catalog..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all placeholder:text-zinc-700" />
            </div>
            <div className="flex bg-zinc-900 p-1 rounded-xl border border-white/5">
              <button onClick={() => setOrderType("dine-in")} className={`p-2 rounded-lg transition-all ${orderType === 'dine-in' ? 'bg-orange-500 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}><Utensils size={14} /></button>
              <button onClick={() => setOrderType("take-away")} className={`p-2 rounded-lg transition-all ${orderType === 'take-away' ? 'bg-orange-500 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}><ShoppingBag size={14} /></button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4 sm:-mx-0 sm:px-0">
          <button onClick={() => setActiveCategory("all")} className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${activeCategory === "all" ? "bg-white text-black border-white shadow-xl" : "bg-transparent text-zinc-500 border-white/5 hover:border-white/10"}`}>All Items</button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${activeCategory === cat ? "bg-white text-black border-white shadow-xl" : "bg-transparent text-zinc-500 border-white/5 hover:border-white/10"}`}>{cat}</button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {filteredItems.map(item => {
              const fullKey = `${item.id}_Full`;
              const halfKey = `${item.id}_Half`;
              const fullQty = cart[fullKey]?.qty || 0;
              const halfQty = cart[halfKey]?.qty || 0;

              return (
                <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} key={item.id} className="glass-dark rounded-[2rem] p-5 flex flex-col justify-between border-white/5 hover:border-white/10 transition-colors group">
                  <div className="mb-6 text-left">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-sm font-black text-zinc-200 uppercase tracking-tight group-hover:text-orange-500 transition-colors leading-snug">{item.name}</h3>
                      <div className="bg-orange-500/10 p-1.5 rounded-lg text-orange-500"><Hash size={12} /></div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[9px] font-black font-mono text-emerald-500 uppercase tracking-tighter">F: ₹{item.priceFull}</span>
                      <span className="text-[9px] font-black font-mono text-amber-500 uppercase tracking-tighter">H: ₹{item.priceHalf}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {/* Full Selector */}
                    <div className="flex items-center justify-between bg-white/5 rounded-xl p-1 px-2 border border-white/5">
                      <span className="text-[9px] font-black uppercase text-zinc-500">Full</span>
                      <div className="flex items-center gap-3">
                        {fullQty > 0 && (
                          <>
                            <button onClick={() => removeFromCart(fullKey)} className="p-1.5 hover:text-red-400 transition-colors"><Minus size={12} /></button>
                            <span className="text-[10px] font-black font-mono w-3 text-center">{fullQty}</span>
                          </>
                        )}
                        <button onClick={() => addToCart(item, "Full")} className="p-1.5 hover:text-emerald-400 transition-colors"><Plus size={12} /></button>
                      </div>
                    </div>
                    {/* Half Selector */}
                    <div className="flex items-center justify-between bg-white/5 rounded-xl p-1 px-2 border border-white/5">
                      <span className="text-[9px] font-black uppercase text-zinc-500">Half</span>
                      <div className="flex items-center gap-3">
                        {halfQty > 0 && (
                          <>
                            <button onClick={() => removeFromCart(halfKey)} className="p-1.5 hover:text-red-400 transition-colors"><Minus size={12} /></button>
                            <span className="text-[10px] font-black font-mono w-3 text-center">{halfQty}</span>
                          </>
                        )}
                        <button onClick={() => addToCart(item, "Half")} className="p-1.5 hover:text-amber-400 transition-colors"><Plus size={12} /></button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-0 left-0 right-0 p-4 sm:p-8 flex justify-center z-50 pointer-events-none">
            <div className="w-full max-w-2xl glass-dark rounded-[2.5rem] p-1.5 border-white/5 shadow-2xl pointer-events-auto overflow-hidden">
              <div className="bg-zinc-900/40 rounded-[2rem] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto text-left">
                  <div className="bg-linear-to-br from-orange-500 to-red-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-500/20 relative">
                    <ShoppingCart size={20} />
                    <div className="absolute -top-1 -right-1 bg-white text-black text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-zinc-900">{cartCount}</div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] leading-none mb-1">Transmission Value</p>
                    <p className="text-2xl font-black text-white font-mono leading-none tracking-tighter">₹{cartTotal}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input placeholder="TABLE #" value={tableNo} onChange={e => setTableNo(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest w-full sm:w-24 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all placeholder:text-zinc-700" />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCheckout(true)}
                    className="btn-primary flex items-center gap-3 !px-8 !py-3 text-xs font-black uppercase tracking-widest cursor-pointer shadow-orange-500/40"
                  >
                    <span className="text-[11px] uppercase tracking-widest font-black">Dispatch</span>
                    <ChevronRight size={16} />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCheckout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCheckout(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative glass-dark rounded-[3rem] p-6 sm:p-10 border-white/10 w-full max-w-lg shadow-2xl">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-8 text-left">Execute Dispatch</h2>
              <div className="space-y-4 mb-10 overflow-y-auto max-h-[40vh] pr-2 scrollbar-hide text-left">
                {Object.keys(cart).map(key => {
                  const it = cart[key]
                  return (
                    <div key={key} className="flex justify-between items-center py-3 border-b border-white/5">
                      <div className="flex-1 text-left">
                        <p className="text-xs font-black text-zinc-100 uppercase tracking-wide leading-none mb-1">{it.name}</p>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{it.type} × {it.qty}</p>
                      </div>
                      <p className="text-sm font-black text-white font-mono">₹{it.price * it.qty}</p>
                    </div>
                  )
                })}
              </div>
              <div className="grid grid-cols-2 gap-4 mb-10">
                <button onClick={() => setPaymentStatus("pending")} className={`flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all ${paymentStatus === 'pending' ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-transparent border-white/5 text-zinc-600 hover:text-zinc-400'}`}>
                  <CreditCard size={24} className="mb-2" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Unpaid</span>
                </button>
                <button onClick={() => setPaymentStatus("completed")} className={`flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all ${paymentStatus === 'completed' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-transparent border-white/5 text-zinc-600 hover:text-zinc-400'}`}>
                  <CheckCircle2 size={24} className="mb-2" />
                  <span className="text-[10px] font-black uppercase tracking-widest">In-Full</span>
                </button>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowCheckout(false)} className="flex-1 glass py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500">Cancel</button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={placeOrder} disabled={saving} className="flex-[2] btn-primary !py-4 text-[10px] font-black uppercase tracking-widest shadow-orange-500/30 flex items-center justify-center gap-2">
                  {saving ? "Syncing..." : <><Check size={18} /> Confirm</>}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
