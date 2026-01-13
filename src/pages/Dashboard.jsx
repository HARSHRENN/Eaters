import { useEffect, useState, useRef } from "react"
import { signOut, onAuthStateChanged } from "firebase/auth"
import { auth, db } from "../Firebase"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus,
  LogOut,
  History,
  Menu as MenuIcon,
  Clock,
  CheckCircle2,
  ChefHat,
  X,
  Edit2,
  Trash2,
  Utensils,
  ExternalLink,
  PlusCircle,
  ShoppingCart,
  Share2,
  TrendingUp,
  Package,
  Printer
} from "lucide-react"
import {
  doc,
  getDoc,
  setDoc,
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  addDoc
} from "firebase/firestore"

// --- Helper Functions ---
const generateSlug = (name) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")

const timeAgo = (d) => {
  if (!d) return ""
  const diff = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// --- Sub-Components ---
const QuickAction = ({ icon: Icon, label, onClick, color }) => (
  <motion.button
    whileHover={{ scale: 1.02, translateY: -2 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="glass p-4 sm:p-6 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all hover:bg-white/10 group relative overflow-hidden"
  >
    <div className={`p-3 rounded-2xl bg-white/5 ${color} group-hover:scale-110 transition-transform`}>
      <Icon size={24} />
    </div>
    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">
      {label}
    </span>
  </motion.button>
)

const OrderCard = ({ order, onUpdate, onDelete, onPrint, onAddItems }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="glass-dark rounded-[2rem] overflow-hidden border-white/5 group hover:border-white/10 transition-all shadow-2xl"
  >
    <div className="p-5 bg-white/5 flex justify-between items-center border-b border-white/5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center font-black text-lg group-hover:text-orange-500 transition-colors">
          #{order.orderNumber}
        </div>
        <div>
          <div className="text-[10px] text-zinc-500 flex items-center gap-1 uppercase font-bold tracking-tighter">
            <Clock size={12} /> {timeAgo(order.createdAt)}
          </div>
          <div className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Order ID: {order.id.slice(-6).toUpperCase()}</div>
        </div>
      </div>
      <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${order.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
        order.status === 'preparing' ? 'bg-blue-500/10 text-blue-500' :
          order.status === 'ready' ? 'bg-emerald-500/10 text-emerald-500' :
            'bg-zinc-800 text-zinc-500'
        }`}>
        {order.status}
      </div>
    </div>

    <div className="p-5 space-y-3">
      <div className="max-h-48 overflow-y-auto pr-2 scrollbar-hide space-y-2">
        {Object.values(order.items || {}).map((it, i) => (
          <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-orange-500 w-6">×{it.qty}</span>
              <div>
                <p className="text-xs font-black text-zinc-200 uppercase tracking-tight">{it.name}</p>
                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{it.type}</p>
              </div>
            </div>
            <span className="text-xs font-black font-mono text-zinc-400">₹{it.price * it.qty}</span>
          </div>
        ))}
      </div>
      <div className="pt-3 flex justify-between items-center">
        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Total Value</span>
        <span className="text-xl font-black text-white font-mono tracking-tighter">₹{order.total}</span>
      </div>
    </div>

    <div className="p-5 flex gap-2">
      {order.status === "pending" && (
        <button onClick={() => onUpdate(order.id, "preparing")} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Start Cooking</button>
      )}
      {order.status === "preparing" && (
        <button onClick={() => onUpdate(order.id, "ready")} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Food Ready</button>
      )}
      {order.status === "ready" && (
        <button onClick={() => onUpdate(order.id, "completed")} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Done</button>
      )}
      <button onClick={() => onPrint(order.id)} className="px-4 bg-zinc-900/50 hover:bg-white/10 text-zinc-600 hover:text-white rounded-xl transition-all border border-white/5" title="Print Bill"><Printer size={16} /></button>
      <button onClick={() => onAddItems && onAddItems(order.id)} className="px-4 bg-zinc-900/50 hover:bg-emerald-500/10 text-zinc-600 hover:text-emerald-500 rounded-xl transition-all border border-white/5" title="Add Items"><PlusCircle size={16} /></button>
      <button onClick={() => onDelete(order.id)} className="px-4 bg-zinc-900/50 hover:bg-red-500/10 text-zinc-600 hover:text-red-500 rounded-xl transition-all border border-white/5"><Trash2 size={16} /></button>
    </div>
  </motion.div>
)

const MenuItemCard = ({ item, onDelete, onEditClick, isEditing, editData, onCancelEdit, onPriceChange, onNameChange, onSave, onToggleAvailability }) => (
  <motion.div
    layout
    className="glass-dark rounded-3xl overflow-hidden border-white/5 group hover:border-white/10 transition-all"
  >
    {isEditing ? (
      <div className="p-5 space-y-4">
        <div className="space-y-1">
          <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1">Label</label>
          <input value={editData.name} onChange={e => onNameChange(e.target.value)} className="input-field !py-2 text-xs" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1">Full (₹)</label>
            <input type="number" value={editData.pF} onChange={e => onPriceChange('f', e.target.value)} className="input-field !py-2 text-xs font-mono" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1">Half (₹)</label>
            <input type="number" value={editData.pH} onChange={e => onPriceChange('h', e.target.value)} className="input-field !py-2 text-xs font-mono" />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onSave} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest">Sync</button>
          <button onClick={onCancelEdit} className="flex-1 bg-zinc-800 text-zinc-500 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest">Abort</button>
        </div>
      </div>
    ) : (
      <>
        <div className="p-5 border-b border-white/5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="text-sm font-black text-zinc-200 uppercase tracking-tight leading-none mb-1.5">{item.name}</h4>
              <button
                onClick={() => onToggleAvailability(item)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border transition-all ${item.available ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-red-500/10 border-red-500/20 text-red-500"
                  }`}
              >
                <div className={`w-1 h-1 rounded-full ${item.available ? "bg-emerald-500" : "bg-red-500"}`} />
                {item.available ? "Available" : "Not Available"}
              </button>
            </div>
            <div className="p-2 bg-zinc-900 rounded-xl text-zinc-600">
              <Package size={14} />
            </div>
          </div>
          <div className="flex gap-6">
            <div className="space-y-0.5">
              <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Full Plate</p>
              <p className="text-sm font-black text-white font-mono">₹{item.priceFull}</p>
            </div>
            <div className="space-y-0.5 border-l border-white/5 pl-6">
              <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Half Plate</p>
              <p className="text-sm font-black text-white font-mono">₹{item.priceHalf}</p>
            </div>
          </div>
        </div>
        <div className="p-2 bg-black/20 flex gap-2">
          <button onClick={() => onEditClick(item)} className="flex-1 glass hover:bg-white/10 py-2.5 rounded-xl text-zinc-500 hover:text-white transition-all flex items-center justify-center gap-2">
            <Edit2 size={12} /> <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Edit Node</span>
          </button>
          <button onClick={() => onDelete(item.id)} className="px-4 glass hover:bg-red-500/10 text-zinc-600 hover:text-red-500 rounded-xl transition-all border border-white/5">
            <Trash2 size={12} />
          </button>
        </div>
      </>
    )}
  </motion.div>
)

export default function Dashboard() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [restaurantName, setRestaurantName] = useState("")
  const [restaurantSlug, setRestaurantSlug] = useState("")

  // Item Fields
  const [dishName, setDishName] = useState("")
  const [priceHalf, setPriceHalf] = useState("")
  const [priceFull, setPriceFull] = useState("")
  const [categoryInput, setCategoryInput] = useState("")

  const [menuItems, setMenuItems] = useState([])
  const [orders, setOrders] = useState([])

  // Edit Fields
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState("")
  const [editPriceHalf, setEditPriceHalf] = useState("")
  const [editPriceFull, setEditPriceFull] = useState("")

  const [filter, setFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("orders")
  const [showAddItem, setShowAddItem] = useState(false)

  const prevOrderIdsRef = useRef(new Set())
  const dingRef = useRef(null)

  useEffect(() => {
    dingRef.current = new Audio("/ding.mp3")
  }, [])

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) return navigate("/login")

      const restaurantRef = doc(db, "restaurants", user.uid)
      const snap = await getDoc(restaurantRef)

      if (!snap.exists()) {
        const name = `${user.email.split("@")[0]}'s Kitchen`
        const slug = generateSlug(name)
        await setDoc(restaurantRef, { name, slug, ownerId: user.uid, createdAt: new Date() })
        setRestaurantName(name)
        setRestaurantSlug(slug)
      } else {
        setRestaurantName(snap.data().name)
        setRestaurantSlug(snap.data().slug)
      }

      const menuUnsub = onSnapshot(collection(db, "restaurants", user.uid, "menu"), (snapshot) => {
        setMenuItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
      })

      const ordersUnsub = onSnapshot(collection(db, "restaurants", user.uid, "orders"), (snapshot) => {
        const docs = snapshot.docs.map(d => {
          const data = d.data()
          const createdAt = data.createdAt?.toDate?.() || data.createdAt || null
          return { id: d.id, ...data, createdAt }
        })

        const prevIds = prevOrderIdsRef.current
        const newIds = docs.map(x => x.id).filter(id => !prevIds.has(id))
        if (newIds.length > 0) {
          const newPending = docs.filter(x => newIds.includes(x.id) && x.status === "pending")
          if (newPending.length > 0) dingRef.current?.play()?.catch(() => { })
        }
        prevOrderIdsRef.current = new Set(docs.map(x => x.id))
        setOrders(docs)
      })

      setLoading(false)
      return () => { menuUnsub(); ordersUnsub(); }
    })
    return () => unsubscribeAuth()
  }, [navigate])

  const handleAddItem = async () => {
    if (!dishName || !priceHalf || !priceFull || !categoryInput) return alert("All fields required")
    await addDoc(collection(db, "restaurants", auth.currentUser.uid, "menu"), {
      name: dishName,
      priceHalf: Number(priceHalf),
      priceFull: Number(priceFull),
      category: categoryInput,
      available: true,
      createdAt: new Date()
    })
    setDishName(""); setPriceHalf(""); setPriceFull(""); setCategoryInput(""); setShowAddItem(false)
  }

  const handleDeleteItem = async (id) => {
    if (window.confirm("Delete item?")) await deleteDoc(doc(db, "restaurants", auth.currentUser.uid, "menu", id))
  }

  const handleSaveEdit = async () => {
    await updateDoc(doc(db, "restaurants", auth.currentUser.uid, "menu", editingId), {
      name: editName,
      priceHalf: Number(editPriceHalf),
      priceFull: Number(editPriceFull)
    })
    setEditingId(null)
  }

  const handleToggleAvailability = async (item) => {
    await updateDoc(doc(db, "restaurants", auth.currentUser.uid, "menu", item.id), { available: !item.available })
  }

  const handleUpdateStatus = async (id, status) => {
    await updateDoc(doc(db, "restaurants", auth.currentUser.uid, "orders", id), { status })
  }

  const handleDeleteOrder = async (id) => {
    if (window.confirm("Delete this order?")) await deleteDoc(doc(db, "restaurants", auth.currentUser.uid, "orders", id))
  }

  const groupedMenu = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  const filteredOrders = orders.filter(o => filter === "all" ? true : o.status === filter)
    .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="rounded-full h-12 w-12 border-t-2 border-orange-500" />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-900 text-zinc-100 selection:bg-orange-500/30">
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <motion.div whileHover={{ rotate: 10 }} className="bg-linear-to-br from-orange-500 to-red-600 p-2.5 rounded-2xl shadow-lg shadow-orange-500/20">
              <ChefHat size={24} className="text-white" />
            </motion.div>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none mb-1 uppercase">{restaurantName || "EATERS STATION"}</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Restaurant Open</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate(`/menu/${restaurantSlug}`)} className="flex-1 sm:flex-none glass px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-all"><ExternalLink size={14} /> Open Menu</motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { signOut(auth); navigate("/login"); }} className="flex-1 sm:flex-none glass px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-red-400 hover:border-red-400/20 flex items-center justify-center gap-2 transition-all"><LogOut size={14} /> Power Off</motion.button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
            <QuickAction icon={ShoppingCart} label="New Order" onClick={() => navigate(`/place-order`)} color="text-orange-500" />
            <QuickAction icon={History} label="Order List" onClick={() => navigate("/orders")} color="text-blue-500" />
            <QuickAction icon={PlusCircle} label="Add Food" onClick={() => { setActiveTab("menu"); setShowAddItem(true); }} color="text-emerald-500" />
            <QuickAction icon={Share2} label="Share Menu" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/menu/${restaurantSlug}`); alert("Menu link encoded to clipboard") }} color="text-purple-500" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex bg-zinc-900/50 p-1 rounded-2xl border border-white/5 w-full sm:w-auto">
            <button onClick={() => setActiveTab("orders")} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "orders" ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-zinc-300"}`}>Live Orders ⭐</button>
            <button onClick={() => setActiveTab("menu")} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "menu" ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-zinc-300"}`}>MENU</button>
          </div>
          <AnimatePresence>
            {activeTab === "orders" && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto scrollbar-hide">
                {["All Orders", "Waiting", "Cooking", "Ready"].map(f => (
                  <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${filter === f ? "bg-orange-500/10 border-orange-500 text-orange-500" : "bg-transparent border-white/5 text-zinc-600 hover:text-zinc-400"}`}>{f}</button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "orders" ? (
            <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredOrders.length === 0 ? (
                  <motion.div className="col-span-full py-20 text-center glass rounded-3xl border-dashed border-white/10">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">No active transmissions detected</p>
                  </motion.div>
                ) : (
                  filteredOrders.map(order => <OrderCard key={order.id} order={order} onUpdate={handleUpdateStatus} onDelete={handleDeleteOrder} onPrint={(id) => navigate(`/bill/${id}`)} onAddItems={(id) => navigate(`/place-order?orderId=${id}`)} />)
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div key="menu" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
              <AnimatePresence>
                {showAddItem && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="glass-dark rounded-4xl p-6 sm:p-10 border-white/5 mb-12">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h2 className="text-xl font-black text-white uppercase tracking-tighter">UPDATE MENU</h2>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-1">Add new items to the menu</p>
                        </div>
                        <button onClick={() => setShowAddItem(false)} className="text-zinc-600 hover:text-white transition-colors"><X size={24} /></button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-4">Dish Name</label>
                          <input placeholder="Ex: item name" value={dishName} onChange={e => setDishName(e.target.value)} className="input-field" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-4">Full Value</label>
                          <input type="number" placeholder="" value={priceFull} onChange={e => setPriceFull(e.target.value)} className="input-field" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-4">Half Value</label>
                          <input type="number" placeholder="" value={priceHalf} onChange={e => setPriceHalf(e.target.value)} className="input-field" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-4">Catalog Section</label>
                          <input placeholder="" value={categoryInput} onChange={e => setCategoryInput(e.target.value)} className="input-field" />
                        </div>
                      </div>
                      <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={handleAddItem} className="btn-primary w-full mt-8 py-4! text-xs font-black uppercase tracking-[0.3em] shadow-orange-500/30">Commit to Inventory</motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {Object.keys(groupedMenu).length === 0 ? (
                <div className="text-center py-20"><p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">Inventory record is empty</p></div>
              ) : (
                Object.entries(groupedMenu).map(([cat, items]) => (
                  <div key={cat} className="space-y-6 text-left">
                    <div className="flex items-center gap-4">
                      <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] whitespace-nowrap">{cat}</h2>
                      <div className="h-px bg-white/5 w-full" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {items.map(it => (
                        <MenuItemCard
                          key={it.id}
                          item={it}
                          onDelete={handleDeleteItem}
                          isEditing={editingId === it.id}
                          editData={{ name: editName, pH: editPriceHalf, pF: editPriceFull }}
                          onEditClick={(item) => {
                            setEditingId(item.id); setEditName(item.name); setEditPriceHalf(item.priceHalf || ""); setEditPriceFull(item.priceFull || "")
                          }}
                          onCancelEdit={() => setEditingId(null)}
                          onPriceChange={(type, val) => type === 'f' ? setEditPriceFull(val) : setEditPriceHalf(val)}
                          onNameChange={setEditName}
                          onSave={handleSaveEdit}
                          onToggleAvailability={handleToggleAvailability}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <audio ref={dingRef} src="/ding.mp3" preload="auto" />
    </div>
  )
}
