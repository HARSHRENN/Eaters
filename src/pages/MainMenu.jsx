import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { db } from "../Firebase"
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
          price: item.price,
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

    await addDoc(
      collection(db, "restaurants", restaurant.id, "orders"),
      {
        orderNumber,
        items: cart,
        total,
        status: "preparing",
        createdAt: serverTimestamp()
      }
    )

    setCart({})
    setOrderNumber("")
    alert("✅ Order placed")
    navigate("/dashboard")
  }

  /* ================= UI ================= */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading menu...
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Restaurant not found
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8">

      <h1 className="text-3xl font-bold text-center mb-2">
        {restaurant.name}
      </h1>
      <p className="text-center text-slate-400 mb-6">
        Admin Order Panel
      </p>

      {/* Order Number */}
      <div className="max-w-md mx-auto mb-6">
        <input
          placeholder="Order Number / Table No"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-black/70 border border-white/10"
        />
      </div>

      {/* MENU */}
      <div className="max-w-md mx-auto space-y-4">
        {menu.map(item => (
          <div
            key={item.id}
            className="flex justify-between items-center bg-white/5 border border-white/10 rounded-xl p-4"
          >
            <div>
              <p className="font-semibold">{item.name}</p>
              <p className="text-green-400">₹{item.price}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                className="px-3 py-1 bg-white/10 rounded"
                onClick={() =>
                  updateQty(item, (cart[item.id]?.qty || 0) - 1)
                }
              >
                –
              </button>

              <span>{cart[item.id]?.qty || 0}</span>

              <button
                className="px-3 py-1 bg-white/10 rounded"
                onClick={() =>
                  updateQty(item, (cart[item.id]?.qty || 0) + 1)
                }
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CART BAR */}
      {total > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/90 border-t border-white/10 p-4">
          <div className="flex justify-between items-center max-w-md mx-auto">
            <p className="font-semibold">Total: ₹{total}</p>
            <button
              onClick={placeOrder}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 font-semibold"
            >
              Place Order
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
