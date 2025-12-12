import { useEffect, useState, useRef } from "react"
import { signOut, onAuthStateChanged } from "firebase/auth"
import { auth, db } from "../Firebase"
import { useNavigate } from "react-router-dom"
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

// Generate slug
const generateSlug = (name) =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")

// Time ago helper
const timeAgo = (d) => {
  if (!d) return ""
  const diff = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function Dashboard() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [restaurantName, setRestaurantName] = useState("")
  const [restaurantSlug, setRestaurantSlug] = useState("")

  // ITEM FIELDS (updated)
  const [dishName, setDishName] = useState("")
  const [priceHalf, setPriceHalf] = useState("")
  const [priceFull, setPriceFull] = useState("")
  const [categoryInput, setCategoryInput] = useState("")

  const [menuItems, setMenuItems] = useState([])
  const [orders, setOrders] = useState([])

  // EDIT FIELDS (updated)
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

  /* ================= AUTH + LOAD ================= */
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) return navigate("/login")

      const restaurantRef = doc(db, "restaurants", user.uid)
      const snap = await getDoc(restaurantRef)

      if (!snap.exists()) {
        const name = `${user.email.split("@")[0]}'s Restaurant`
        const slug = generateSlug(name)

        await setDoc(restaurantRef, {
          name,
          slug,
          ownerId: user.uid,
          createdAt: new Date()
        })

        setRestaurantName(name)
        setRestaurantSlug(slug)
      } else {
        setRestaurantName(snap.data().name)
        setRestaurantSlug(snap.data().slug)
      }

      const menuUnsub = onSnapshot(
        collection(db, "restaurants", user.uid, "menu"),
        (snapshot) => {
          setMenuItems(snapshot.docs.map(d => ({
            id: d.id,
            ...d.data()
          })))
        }
      )

      const ordersUnsub = onSnapshot(
        collection(db, "restaurants", user.uid, "orders"),
        (snapshot) => {
          const docs = snapshot.docs.map(d => {
            const data = d.data()
            const createdAt = data.createdAt?.toDate?.() || data.createdAt || null
            return { id: d.id, ...data, createdAt }
          })

          const prevIds = prevOrderIdsRef.current
          const newIds = docs.map(x => x.id).filter(id => !prevIds.has(id))

          if (newIds.length > 0) {
            const newPending = docs.filter(
              x => newIds.includes(x.id) && x.status === "pending"
            )
            if (newPending.length > 0) {
              dingRef.current?.play()?.catch(() => {})
            }
          }

          prevOrderIdsRef.current = new Set(docs.map(x => x.id))
          setOrders(docs)
        }
      )

      setLoading(false)

      return () => {
        menuUnsub()
        ordersUnsub()
      }
    })

    return () => unsubscribeAuth()
  }, [navigate])

  /* ================= MENU ACTIONS ================= */
  const addMenuItem = async (e) => {
  e.preventDefault()
  if (!dishName || !priceHalf || !priceFull || !categoryInput)
    return alert("Fill all fields")

  await addDoc(
    collection(db, "restaurants", auth.currentUser.uid, "menu"),
    {
      name: dishName,
      priceHalf: Number(priceHalf),
      priceFull: Number(priceFull),
      category: categoryInput,
      available: true,
      createdAt: new Date()
    }
  )

  setDishName("")
  setPriceHalf("")
  setPriceFull("")
  setCategoryInput("")
  setShowAddItem(false)
}
  const toggleAvailability = async (item) => {
    await updateDoc(
      doc(db, "restaurants", auth.currentUser.uid, "menu", item.id),
      { available: !item.available }
    )
  }

  const saveEdit = async (id) => {
    await updateDoc(
      doc(db, "restaurants", auth.currentUser.uid, "menu", id),
      {
        name: editName,
        priceHalf: Number(editPriceHalf),
        priceFull: Number(editPriceFull)
      }
    )
    setEditingId(null)
  }

  const deleteItem = async (id) => {
    if (!window.confirm("Delete item?")) return
    await deleteDoc(
      doc(db, "restaurants", auth.currentUser.uid, "menu", id)
    )
  }

  /* ================= ORDER ACTIONS ================= */
  const updateOrderStatus = async (orderId, status) => {
    await updateDoc(
      doc(db, "restaurants", auth.currentUser.uid, "orders", orderId),
      { status }
    )
  }

  const cancelOrder = async (orderId) => {
    if (!window.confirm("Cancel this order?")) return
    await deleteDoc(doc(db, "restaurants", auth.currentUser.uid, "orders", orderId))
  }

  /* ================= LOGOUT ================= */
  const handleLogout = async () => {
    await signOut(auth)
    navigate("/login")
  }

  /* ================= GROUP MENU ================= */
  const groupedMenu = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  /* ================= FILTER ORDERS ================= */
  const filteredOrders = orders.filter(o => {
    if (filter === "all") return true
    return o.status === filter
  }).sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))

  const pendingCount = orders.filter(o => o.status === "pending").length
  const preparingCount = orders.filter(o => o.status === "preparing").length
  const readyCount = orders.filter(o => o.status === "ready").length
  const completedCount = orders.filter(o => o.status === "completed").length

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-3"></div>
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      {/* HEADER */}
      <div className="sticky top-0 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 z-40">
        <div className="px-4 py-3">

          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-bold">{restaurantName}</h1>
              <p className="text-xs text-zinc-500">Dashboard</p>
            </div>

            <button
              onClick={handleLogout}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Logout
            </button>
          </div>

          {/* QUICK ACTIONS */}
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/place-order")}
              className="flex-1 bg-white text-black py-2.5 rounded-lg text-sm font-semibold hover:bg-zinc-200 transition"
            >
              + New Order
            </button>

            <button
              onClick={() => navigate("/orders")}
              className="px-4 bg-zinc-800 hover:bg-zinc-700 py-2.5 rounded-lg text-sm border border-zinc-700 transition"
            >
              History
            </button>

            <button
              onClick={() => navigate(`/restaurant/${restaurantSlug}`)}
              className="px-4 bg-zinc-800 hover:bg-zinc-700 py-2.5 rounded-lg text-sm border border-zinc-700 transition"
            >
              Menu
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex border-t border-zinc-800">
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex-1 py-3 text-sm font-semibold transition ${
              activeTab === "orders" 
                ? "text-white border-b-2 border-white" 
                : "text-zinc-500"
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab("menu")}
            className={`flex-1 py-3 text-sm font-semibold transition ${
              activeTab === "menu" 
                ? "text-white border-b-2 border-white" 
                : "text-zinc-500"
            }`}
          >
            Menu
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-4 pb-20">
        {activeTab === "orders" ? (
          <>
            {/* ORDER FILTERS */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
              {[
                { key: "all", label: "All", count: orders.length },
                { key: "pending", label: "Pending", count: pendingCount },
                { key: "preparing", label: "Preparing", count: preparingCount },
                { key: "ready", label: "Ready", count: readyCount },
                { key: "completed", label: "Done", count: completedCount }
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                    filter === f.key
                      ? "bg-white text-black"
                      : "bg-zinc-900 border border-zinc-800"
                  }`}
                >
                  {f.label} {f.count > 0 && f.count}
                </button>
              ))}
            </div>

            {/* ORDERS LIST */}
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-sm">
                No orders
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map(order => (
                  <div key={order.id} className="bg-zinc-900 rounded-lg border border-zinc-800">

                    <div className="p-4 border-b border-zinc-800">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-lg font-bold">#{order.orderNumber}</div>
                          <div className="text-xs text-zinc-500">{timeAgo(order.createdAt)}</div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          order.status === "pending" ? "bg-amber-500/20 text-amber-400" :
                          order.status === "preparing" ? "bg-blue-500/20 text-blue-400" :
                          order.status === "ready" ? "bg-emerald-500/20 text-emerald-400" :
                          "bg-zinc-700 text-zinc-400"
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>

                    {/* ITEMS */}
                    <div className="p-4 border-b border-zinc-800 space-y-1">
                      {Object.values(order.items).map((it, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-zinc-400">
                            {it.qty}× {it.name} ({it.type})
                          </span>
                          <span>₹{it.price * it.qty}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-bold pt-2 border-t border-zinc-800 mt-2">
                        <span>Total</span>
                        <span className="text-emerald-400">₹{order.total}</span>
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="p-4 flex gap-2">
                      {order.status === "pending" && (
                        <button
                          onClick={() => updateOrderStatus(order.id, "preparing")}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg text-sm font-medium transition"
                        >
                          Start
                        </button>
                      )}
                      {order.status === "preparing" && (
                        <button
                          onClick={() => updateOrderStatus(order.id, "ready")}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 py-2 rounded-lg text-sm font-medium transition"
                        >
                          Ready
                        </button>
                      )}
                      {order.status === "ready" && (
                        <button
                          onClick={() => updateOrderStatus(order.id, "completed")}
                          className="flex-1 bg-zinc-700 hover:bg-zinc-600 py-2 rounded-lg text-sm font-medium transition"
                        >
                          Complete
                        </button>
                      )}
                      <button
                        onClick={() => cancelOrder(order.id)}
                        className="px-4 bg-red-500/20 text-red-400 hover:bg-red-500/30 py-2 rounded-lg text-sm font-medium transition"
                      >
                        Cancel
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </>
        ) : (
          <>
            {/* MENU TAB */}
            <button
              onClick={() => setShowAddItem(!showAddItem)}
              className="w-full bg-white text-black hover:bg-zinc-200 py-3 rounded-lg mb-4 font-semibold transition"
            >
              {showAddItem ? "− Cancel" : "+ Add Item"}
            </button>

            {showAddItem && (
              <form onSubmit={addMenuItem} className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 space-y-3 mb-6">
                <input
                  placeholder="Dish name"
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2 rounded text-sm placeholder:text-zinc-600"
                />
                
                <input
                  type="number"
                  placeholder="Half Price"
                  value={priceHalf}
                  onChange={(e) => setPriceHalf(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2 rounded text-sm"
                />

                <input
                  type="number"
                  placeholder="Full Price"
                  value={priceFull}
                  onChange={(e) => setPriceFull(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2 rounded text-sm"
                />

                <input
                  placeholder="Category"
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2 rounded text-sm placeholder:text-zinc-600"
                />

                <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded font-medium transition">
                  Add Item
                </button>
              </form>
            )}

            {/* MENU ITEMS */}
            {Object.entries(groupedMenu).map(([cat, items]) => (
              <div key={cat} className="mb-6">
                <h3 className="text-zinc-400 font-semibold mb-3 text-sm uppercase tracking-wide">{cat}</h3>

                <div className="space-y-2">
                  {items.map(item => (
                    <div key={item.id} className="bg-zinc-900 rounded-lg border border-zinc-800">

                      {editingId === item.id ? (
                        <div className="p-4 space-y-3">
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2 rounded text-sm"
                          />
                          
                          <input
                            type="number"
                            value={editPriceHalf}
                            onChange={(e) => setEditPriceHalf(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2 rounded text-sm"
                          />

                          <input
                            type="number"
                            value={editPriceFull}
                            onChange={(e) => setEditPriceFull(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2 rounded text-sm"
                          />

                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(item.id)}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded font-medium transition"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="p-4 border-b border-zinc-800">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-medium">{item.name}</h4>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                item.available
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-red-500/20 text-red-400"
                              }`}>
                                {item.available ? "Available" : "Out"}
                              </span>
                            </div>

                            <p className="text-emerald-400 font-semibold">
                              Half ₹{item.priceHalf} • Full ₹{item.priceFull}
                            </p>
                          </div>

                          <div className="p-3 flex gap-2">
                            <button
                              onClick={() => toggleAvailability(item)}
                              className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded text-xs transition"
                            >
                              Toggle
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(item.id)
                                setEditName(item.name)
                                setEditPriceHalf(item.priceHalf)
                                setEditPriceFull(item.priceFull)
                              }}
                              className="px-4 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 py-2 rounded text-xs transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="px-4 bg-red-500/20 text-red-400 hover:bg-red-500/30 py-2 rounded text-xs transition"
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}

                    </div>
                  ))}
                </div>
              </div>
            ))}

          </>
        )}
      </div>
    </div>
  )
}
