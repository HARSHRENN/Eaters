import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { db } from "../Firebase"
import { collection, query, where, onSnapshot } from "firebase/firestore"

export default function Menu() {
  const { slug } = useParams()

  const [restaurant, setRestaurant] = useState(null)
  const [menu, setMenu] = useState([])
  const [loading, setLoading] = useState(true)

  /* ================= FETCH DATA ================= */

  useEffect(() => {
    let unsubscribeMenu = null

    const unsubscribeRestaurant = onSnapshot(
      query(collection(db, "restaurants"), where("slug", "==", slug)),
      (snapshot) => {
        if (snapshot.empty) {
          setRestaurant(null)
          setLoading(false)
          return
        }

        const restDoc = snapshot.docs[0]
        setRestaurant({ id: restDoc.id, ...restDoc.data() })

        unsubscribeMenu = onSnapshot(
          collection(db, "restaurants", restDoc.id, "menu"),
          (menuSnap) => {
            const items = menuSnap.docs
              .map(doc => ({ id: doc.id, ...doc.data() }))
              .filter(item => item.available !== false)

            setMenu(items)
            setLoading(false)
          }
        )
      }
    )

    return () => {
      unsubscribeRestaurant()
      if (unsubscribeMenu) unsubscribeMenu()
    }
  }, [slug])

  /* ================= GROUP MENU ================= */

  const groupedMenu = menu.reduce((g, item) => {
    if (!g[item.category]) g[item.category] = []
    g[item.category].push(item)
    return g
  }, {})

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

  /* ================= UI ================= */

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-10">

      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/bg.jpg')" }}
      />

      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-xl">
        <div className="rounded-3xl bg-slate-900/75 backdrop-blur-xl border border-slate-700/50 shadow-2xl p-6 sm:p-8">

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white">
              {restaurant.name}
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Today’s Menu 🍽️
            </p>
          </div>

          {/* Menu */}
          {Object.keys(groupedMenu).length === 0 && (
            <p className="text-center text-slate-400">
              No items available today
            </p>
          )}

          <div className="space-y-6">
            {Object.entries(groupedMenu).map(([category, items]) => (
              <div key={category}>
                <h2 className="text-lg font-semibold text-orange-400 mb-3">
                  {category}
                </h2>

                <div className="space-y-3">
                  {items.map(item => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center px-4 py-3 rounded-xl
                      bg-black/40 border border-slate-700/60"
                    >
                      <span className="text-white font-medium">
                        {item.name}
                      </span>

                      {/* Half / Full Price */}
                      <div className="text-right text-green-400 font-semibold text-sm">
                        {item.priceHalf ? (
                          <p>Half: ₹{item.priceHalf}</p>
                        ) : null}

                        {item.priceFull ? (
                          <p>Full: ₹{item.priceFull}</p>
                        ) : null}
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Footer */}
        <p className="text-center text-slate-400 text-xs mt-6">
          Powered by QR Menu 🚀
        </p>
      </div>
    </div>
  )
}
