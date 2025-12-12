import { useEffect, useState } from "react"
import { auth, db } from "../Firebase"
import { useNavigate } from "react-router-dom"
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  addDoc,
  updateDoc,
  setDoc
} from "firebase/firestore"

// ------------------------------
// AUTO ORDER NUMBER GENERATOR
// ------------------------------
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
  const [groupedMenu, setGroupedMenu] = useState({})
  const [currentOrder, setCurrentOrder] = useState({})
  const [payment, setPayment] = useState("pending")
  const [search, setSearch] = useState("")
  const [saving, setSaving] = useState(false)

  // ------------------------------
  // LOAD MENU
  // ------------------------------
  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return navigate("/login")

    return onSnapshot(
      collection(db, "restaurants", uid, "menu"),
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
        const grouped = items.reduce((acc, item) => {
          if (!acc[item.category]) acc[item.category] = []
          acc[item.category].push(item)
          return acc
        }, {})
        setGroupedMenu(grouped)
        setLoading(false)
      }
    )
  }, [])

  // ------------------------------
  // ORDER FUNCTIONS
  // ------------------------------
  const updateQuantity = (item, qty) => {
    if (qty <= 0) {
      setCurrentOrder((prev) => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
    } else {
      setCurrentOrder((prev) => ({
        ...prev,
        [item.id]: { ...item, qty }
      }))
    }
  }

  const orderTotal = Object.values(currentOrder).reduce(
    (sum, item) => sum + item.qty * item.price,
    0
  )

  const orderItemCount = Object.values(currentOrder).reduce(
    (sum, item) => sum + item.qty,
    0
  )

  // ------------------------------
  // SAVE ORDER
  // ------------------------------
  const saveOrder = async () => {
    if (!Object.keys(currentOrder).length) return alert("No items selected!")

    setSaving(true)
    try {
      const uid = auth.currentUser.uid
      const orderNumber = await getNextOrderNumber(uid)

      await addDoc(collection(db, "restaurants", uid, "orders"), {
        orderNumber,
        items: currentOrder,
        total: orderTotal,
        payment,
        status: "pending",
        createdAt: new Date()
      })

      setCurrentOrder({})
      setPayment("pending")
      alert(`Order #${orderNumber} saved successfully!`)
    } catch (error) {
      console.error("ORDER ERROR:", error)
      alert("Error saving order! Check console.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-gray-600 flex items-center gap-1 text-sm"
            >
              ← Back
            </button>
            
            <h1 className="text-lg font-bold text-gray-900">New Order</h1>

            <button
              onClick={() => navigate("/orders")}
              className="text-blue-600 text-sm font-medium"
            >
              Orders
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              placeholder="Search menu..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 py-4">
        {Object.entries(groupedMenu).map(([cat, items]) => {
          const filteredItems = items.filter((i) =>
            i.name.toLowerCase().includes(search.toLowerCase())
          )

          if (filteredItems.length === 0) return null

          return (
            <div key={cat} className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                {cat}
              </h3>

              <div className="space-y-2">
                {filteredItems.map((item) => {
                  const qty = currentOrder[item.id]?.qty || 0
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-lg p-3 shadow-sm border border-gray-100"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">
                            {item.name}
                          </h4>
                          <p className="text-green-600 font-semibold text-sm mt-0.5">
                            ₹{item.price}
                          </p>
                        </div>

                        {qty === 0 ? (
                          <button
                            onClick={() => updateQuantity(item, 1)}
                            className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium"
                          >
                            Add
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 bg-gray-100 rounded-md px-2 py-1">
                            <button
                              onClick={() => updateQuantity(item, qty - 1)}
                              className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded"
                            >
                              −
                            </button>
                            <span className="text-sm font-semibold text-gray-900 min-w-[20px] text-center">
                              {qty}
                            </span>
                            <button
                              onClick={() => updateQuantity(item, qty + 1)}
                              className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom Action Bar */}
      {orderItemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="px-4 py-3">
            {/* Payment Status */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-600 font-medium">Payment:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPayment("pending")}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    payment === "pending"
                      ? "bg-orange-100 text-orange-700 border border-orange-300"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setPayment("completed")}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    payment === "completed"
                      ? "bg-green-100 text-green-700 border border-green-300"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  Paid
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-gray-500">
                  {orderItemCount} item{orderItemCount > 1 ? 's' : ''}
                </p>
                <p className="text-lg font-bold text-gray-900">₹{orderTotal}</p>
              </div>
              
              <button
                onClick={saveOrder}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold text-sm transition-all disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  'Save Order'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}