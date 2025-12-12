import { useEffect, useState } from "react"
import { auth, db } from "../Firebase"
import { useNavigate } from "react-router-dom"
import { collection, onSnapshot, updateDoc, doc } from "firebase/firestore"

export default function Orders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [quickFilter, setQuickFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [showRevenueCalc, setShowRevenueCalc] = useState(false)
  
  // Revenue period tracking
  const [revenueStartDate, setRevenueStartDate] = useState("")
  const [revenueEndDate, setRevenueEndDate] = useState("")
  const [customRevenue, setCustomRevenue] = useState(null)

  // LOAD ORDERS
  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return navigate("/login")

    const unsub = onSnapshot(
      collection(db, "restaurants", uid, "orders"),
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data()
          const createdAt =
            data.createdAt?.toDate
              ? data.createdAt.toDate()
              : new Date(data.createdAt)

          return { id: d.id, ...data, createdAt }
        })
        list.sort((a, b) => (b.orderNumber || 0) - (a.orderNumber || 0))
        setOrders(list)
        setLoading(false)
      }
    )

    return () => unsub()
  }, [])

  const updateOrder = async (id, data) => {
    const uid = auth.currentUser.uid
    await updateDoc(doc(db, "restaurants", uid, "orders", id), data)
  }

  // CALCULATE REVENUE FOR CUSTOM PERIOD
  const calculateCustomRevenue = () => {
    const start = revenueStartDate ? new Date(revenueStartDate) : null
    const end = revenueEndDate ? new Date(revenueEndDate + "T23:59:59") : null

    const filtered = orders.filter(o => {
      if (!o.createdAt) return false
      const orderDate = new Date(o.createdAt)
      
      if (start && orderDate < start) return false
      if (end && orderDate > end) return false
      return true
    })

    const revenue = {
      total: filtered.reduce((sum, o) => sum + o.total, 0),
      paid: filtered.filter(o => o.payment === "completed").reduce((sum, o) => sum + o.total, 0),
      orderCount: filtered.length,
      avgOrderValue: filtered.length > 0 ? filtered.reduce((sum, o) => sum + o.total, 0) / filtered.length : 0
    }

    setCustomRevenue(revenue)
  }

  // QUICK STATS
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
  const totalPaid = orders.filter(o => o.payment === "completed").reduce((sum, o) => sum + o.total, 0)
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0

  // TODAY'S REVENUE
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todaysRevenue = orders
    .filter((o) => {
      if (!o.createdAt) return false
      const orderDate = new Date(o.createdAt)
      orderDate.setHours(0, 0, 0, 0)
      return orderDate.getTime() === today.getTime()
    })
    .reduce((sum, o) => sum + o.total, 0)

  // FILTER COUNTS
  const countPending = orders.filter(o => o.status === "pending").length
  const countPaid = orders.filter(o => o.payment === "completed").length
  const countCompleted = orders.filter(o => o.status === "completed").length

  // APPLY FILTERS
  const filteredOrders = orders.filter(order => {
    if (quickFilter === "pending" && order.status !== "pending") return false
    if (quickFilter === "paid" && order.payment !== "completed") return false
    if (quickFilter === "completed" && order.status !== "completed") return false
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const matchesNumber = order.orderNumber?.toString().includes(term)
      const matchesTotal = order.total?.toString().includes(term)
      if (!matchesNumber && !matchesTotal) return false
    }
    
    return true
  })

  // EXPORT TO CSV
  const exportToCSV = () => {
    const headers = ["Order #", "Date", "Total", "Payment", "Status", "Items"]
    const rows = filteredOrders.map(order => [
      order.orderNumber,
      order.createdAt?.toLocaleString?.() || "",
      order.total,
      order.payment,
      order.status,
      Object.values(order.items || {}).map(it => `${it.name} x${it.qty}`).join("; ")
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading)
    return <div className="text-white p-4">Loading...</div>

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      
      {/* HEADER */}
      <div className="sticky top-0 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-zinc-400 hover:text-white"
          >
            ← Back
          </button>
          <h1 className="text-lg font-semibold">Orders</h1>
          <button
            onClick={exportToCSV}
            className="text-sm text-emerald-400 hover:text-emerald-300"
          >
            Export
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-20">

        {/* STATS GRID */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
            <div className="text-xs text-zinc-400 mb-1">Total</div>
            <div className="text-xl font-bold">₹{totalRevenue.toFixed(0)}</div>
            <div className="text-xs text-zinc-500">{orders.length} orders</div>
          </div>

          <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
            <div className="text-xs text-zinc-400 mb-1">Paid</div>
            <div className="text-xl font-bold text-emerald-400">₹{totalPaid.toFixed(0)}</div>
            <div className="text-xs text-zinc-500">{countPaid} orders</div>
          </div>

          <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
            <div className="text-xs text-zinc-400 mb-1">Today</div>
            <div className="text-xl font-bold">₹{todaysRevenue.toFixed(0)}</div>
          </div>

          <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
            <div className="text-xs text-zinc-400 mb-1">Avg Order</div>
            <div className="text-xl font-bold">₹{avgOrderValue.toFixed(0)}</div>
          </div>
        </div>

        {/* CUSTOM REVENUE BUTTON */}
        <button
          onClick={() => setShowRevenueCalc(!showRevenueCalc)}
          className="w-full bg-zinc-900 p-3 rounded-lg border border-zinc-800 text-left flex items-center justify-between"
        >
          <span className="text-sm">📅 Custom Period</span>
          <span className="text-xs text-zinc-500">{showRevenueCalc ? "▼" : "▶"}</span>
        </button>

        {/* CUSTOM REVENUE CALCULATOR */}
        {showRevenueCalc && (
          <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 space-y-3">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Start Date</label>
              <input
                type="date"
                value={revenueStartDate}
                onChange={(e) => setRevenueStartDate(e.target.value)}
                className="w-full bg-zinc-950 px-3 py-2 rounded border border-zinc-800 text-sm"
              />
            </div>
            
            <div>
              <label className="text-xs text-zinc-400 block mb-1">End Date</label>
              <input
                type="date"
                value={revenueEndDate}
                onChange={(e) => setRevenueEndDate(e.target.value)}
                className="w-full bg-zinc-950 px-3 py-2 rounded border border-zinc-800 text-sm"
              />
            </div>

            <button
              onClick={calculateCustomRevenue}
              className="w-full bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded text-sm font-medium"
            >
              Calculate
            </button>

            {customRevenue && (
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-800">
                <div>
                  <div className="text-xs text-zinc-500">Total</div>
                  <div className="text-lg font-bold">₹{customRevenue.total.toFixed(0)}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">Paid</div>
                  <div className="text-lg font-bold text-emerald-400">₹{customRevenue.paid.toFixed(0)}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">Orders</div>
                  <div className="text-lg font-bold">{customRevenue.orderCount}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">Avg</div>
                  <div className="text-lg font-bold">₹{customRevenue.avgOrderValue.toFixed(0)}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search order # or amount..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-900 px-4 py-3 rounded-lg border border-zinc-800 text-sm placeholder:text-zinc-600"
        />

        {/* FILTERS */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          <button
            onClick={() => setQuickFilter("all")}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              quickFilter === "all" 
                ? "bg-white text-black" 
                : "bg-zinc-900 border border-zinc-800"
            }`}
          >
            All {orders.length}
          </button>

          <button
            onClick={() => setQuickFilter("pending")}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              quickFilter === "pending" 
                ? "bg-amber-500 text-black" 
                : "bg-zinc-900 border border-zinc-800"
            }`}
          >
            Pending {countPending}
          </button>

          <button
            onClick={() => setQuickFilter("paid")}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              quickFilter === "paid" 
                ? "bg-emerald-500 text-black" 
                : "bg-zinc-900 border border-zinc-800"
            }`}
          >
            Paid {countPaid}
          </button>

          <button
            onClick={() => setQuickFilter("completed")}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              quickFilter === "completed" 
                ? "bg-zinc-600 text-white" 
                : "bg-zinc-900 border border-zinc-800"
            }`}
          >
            Done {countCompleted}
          </button>
        </div>

        {/* ORDERS LIST */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-sm">
            {searchTerm ? "No matching orders" : "No orders"}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map(order => (
              <div key={order.id} className="bg-zinc-900 rounded-lg border border-zinc-800">
                
                {/* ORDER HEADER */}
                <div className="p-4 border-b border-zinc-800">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-lg font-bold">#{order.orderNumber}</div>
                    <div className="text-xs text-zinc-500">
                      {order.createdAt?.toLocaleDateString?.("en-IN")}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-emerald-400">₹{order.total}</div>
                </div>

                {/* ITEMS */}
                <details className="border-b border-zinc-800">
                  <summary className="px-4 py-3 cursor-pointer text-sm text-zinc-400">
                    {Object.keys(order.items || {}).length} items
                  </summary>
                  <div className="px-4 pb-3 space-y-1">
                    {Object.values(order.items || {}).map((it, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{it.name} × {it.qty}</span>
                        <span className="font-medium">₹{it.price * it.qty}</span>
                      </div>
                    ))}
                  </div>
                </details>

                {/* STATUS SELECTS */}
                <div className="p-4 space-y-3">
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Payment</label>
                    <select
                      value={order.payment}
                      onChange={(e) => updateOrder(order.id, { payment: e.target.value })}
                      className="w-full bg-zinc-950 px-3 py-2 rounded border border-zinc-800 text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Paid</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Status</label>
                    <select
                      value={order.status}
                      onChange={(e) => updateOrder(order.id, { status: e.target.value })}
                      className="w-full bg-zinc-950 px-3 py-2 rounded border border-zinc-800 text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="preparing">Preparing</option>
                      <option value="ready">Ready</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}