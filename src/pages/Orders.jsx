import { useEffect, useState } from "react"
import { auth, db } from "../Firebase"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  Download,
  Search,
  Calendar,
  ChevronDown,
  ChevronUp,
  Wallet,
  CheckCircle2,
  Clock,
  TrendingUp,
  Filter,
  Package,
  FileSpreadsheet
} from "lucide-react"
import {
  collection,
  onSnapshot,
  updateDoc,
  doc
} from "firebase/firestore"

const StatCard = ({ label, value, subValue, icon: Icon, colorClass }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="glass-dark p-5 rounded-3xl border-white/5 shadow-2xl"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2.5 rounded-xl ${colorClass} bg-opacity-10 text-opacity-90`}>
        <Icon size={20} className={colorClass.replace('bg-', 'text-')} />
      </div>
    </div>
    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">{label}</p>
    <h3 className="text-2xl font-black text-white tracking-tighter">{value}</h3>
    {subValue && <p className="text-[10px] font-bold text-zinc-600 mt-1 uppercase tracking-widest">{subValue}</p>}
  </motion.div>
)

export default function Orders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [quickFilter, setQuickFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [showRevenueCalc, setShowRevenueCalc] = useState(false)

  const [revenueStartDate, setRevenueStartDate] = useState("")
  const [revenueEndDate, setRevenueEndDate] = useState("")
  const [customRevenue, setCustomRevenue] = useState(null)

  // Time range filter states
  const [startDateTime, setStartDateTime] = useState("")
  const [endDateTime, setEndDateTime] = useState("")
  const [useTimeFilter, setUseTimeFilter] = useState(false)

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return navigate("/login")

    return onSnapshot(
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
  }, [navigate])

  const updateOrder = async (id, data) => {
    const uid = auth.currentUser.uid
    await updateDoc(doc(db, "restaurants", uid, "orders", id), data)
  }

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

    setCustomRevenue({
      total: filtered.reduce((sum, o) => sum + o.total, 0),
      paid: filtered.filter(o => o.payment === "completed").reduce((sum, o) => sum + o.total, 0),
      orderCount: filtered.length,
      avgOrderValue: filtered.length > 0 ? filtered.reduce((sum, o) => sum + o.total, 0) / filtered.length : 0
    })
  }

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
  const totalPaid = orders.filter(o => o.payment === "completed").reduce((sum, o) => sum + o.total, 0)
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0

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

  const countPending = orders.filter(o => o.status === "pending").length
  const countPaid = orders.filter(o => o.payment === "completed").length
  const countCompleted = orders.filter(o => o.status === "completed").length

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

    // Apply time range filter if active
    if (useTimeFilter && startDateTime && endDateTime) {
      const orderTime = order.createdAt ? new Date(order.createdAt) : null
      if (!orderTime) return false

      const start = new Date(startDateTime)
      const end = new Date(endDateTime)

      if (orderTime < start || orderTime > end) return false
    }

    return true
  })

  // Group orders by time intervals (for 24/7 operations)
  const groupOrdersByTime = (orders) => {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000)
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000)
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000)
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const groups = {
      lastHour: [],
      lastThreeHours: [],
      lastSixHours: [],
      lastTwelveHours: [],
      lastTwentyFourHours: [],
      older: []
    }

    orders.forEach(order => {
      const orderDate = order.createdAt ? new Date(order.createdAt) : null
      if (!orderDate) {
        groups.older.push(order)
        return
      }

      if (orderDate >= oneHourAgo) {
        groups.lastHour.push(order)
      } else if (orderDate >= threeHoursAgo) {
        groups.lastThreeHours.push(order)
      } else if (orderDate >= sixHoursAgo) {
        groups.lastSixHours.push(order)
      } else if (orderDate >= twelveHoursAgo) {
        groups.lastTwelveHours.push(order)
      } else if (orderDate >= twentyFourHoursAgo) {
        groups.lastTwentyFourHours.push(order)
      } else {
        groups.older.push(order)
      }
    })

    return groups
  }

  const groupedOrders = groupOrdersByTime(filteredOrders)

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

    const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = `orders-eaters.csv`; a.click()
  }

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-t-2 border-orange-500 rounded-full" />
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-orange-500/30 pb-32">

      {/* Dynamic Header */}
      <div className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <motion.button
            whileHover={{ x: -2 }}
            onClick={() => navigate("/dashboard")}
            className="text-zinc-500 hover:text-white transition-colors flex items-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-widest"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back</span>
            <span className="sm:hidden">Exit</span>
          </motion.button>
          <h1 className="text-[10px] sm:text-sm font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] truncate px-2">Analytics Node</h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={exportToCSV}
            className="bg-emerald-500/10 text-emerald-500 px-3 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 flex items-center gap-2"
          >
            <FileSpreadsheet size={14} />
            <span className="hidden sm:inline">Export</span>
          </motion.button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
          <StatCard label="Total Revenue" value={`₹${totalRevenue.toFixed(0)}`} subValue={`${orders.length} Sessions`} icon={TrendingUp} colorClass="bg-orange-500" />
          <StatCard label="Validated" value={`₹${totalPaid.toFixed(0)}`} subValue={`${countPaid} Paid`} icon={CheckCircle2} colorClass="bg-emerald-500" />
          <StatCard label="Daily" value={`₹${todaysRevenue.toFixed(0)}`} subValue="Targeting" icon={Clock} colorClass="bg-blue-500" />
          <StatCard label="Efficiency" value={`₹${avgOrderValue.toFixed(0)}`} subValue="Avg Ticket" icon={Wallet} colorClass="bg-purple-500" />
        </div>

        {/* Revenue Scope Explorer */}
        <div className="mb-10">
          <motion.button
            onClick={() => setShowRevenueCalc(!showRevenueCalc)}
            className="w-full glass-dark p-4 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-all mb-4"
          >
            <div className="flex items-center gap-3">
              <Calendar className="text-orange-500" size={18} />
              <span className="text-xs font-black uppercase tracking-widest text-zinc-300">Revenue Scope Overrides</span>
            </div>
            {showRevenueCalc ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </motion.button>

          <AnimatePresence>
            {showRevenueCalc && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="glass-dark p-6 rounded-3xl border-white/5 space-y-4 mb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-2">Baseline</label>
                      <input type="date" value={revenueStartDate} onChange={(e) => setRevenueStartDate(e.target.value)} className="input-field py-2! text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-2">Deadline</label>
                      <input type="date" value={revenueEndDate} onChange={(e) => setRevenueEndDate(e.target.value)} className="input-field py-2! text-sm" />
                    </div>
                  </div>
                  <button onClick={calculateCustomRevenue} className="btn-primary w-full py-3! text-[10px] uppercase tracking-widest">Execute Calculation</button>

                  {customRevenue && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/5">
                      <div><p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Revenue</p><p className="text-lg font-black font-mono">₹{customRevenue.total.toFixed(0)}</p></div>
                      <div><p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Invoiced</p><p className="text-lg font-black font-mono text-emerald-500">₹{customRevenue.paid.toFixed(0)}</p></div>
                      <div><p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Nodes</p><p className="text-lg font-black font-mono">{customRevenue.orderCount}</p></div>
                      <div><p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Ratio</p><p className="text-lg font-black font-mono">₹{customRevenue.avgOrderValue.toFixed(0)}</p></div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Time Range Filter */}
        <div className="mb-10">
          <div className="glass-dark p-6 rounded-3xl border-white/5 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="text-blue-500" size={18} />
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-300">Time Range Filter</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-2">Start Time</label>
                <input
                  type="datetime-local"
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  className="input-field py-2! text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-2">End Time</label>
                <input
                  type="datetime-local"
                  value={endDateTime}
                  onChange={(e) => setEndDateTime(e.target.value)}
                  className="input-field py-2! text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setUseTimeFilter(true)}
                disabled={!startDateTime || !endDateTime}
                className="btn-primary flex-1 py-3! text-[10px] uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply Filter
              </button>
              <button
                onClick={() => {
                  setUseTimeFilter(false)
                  setStartDateTime("")
                  setEndDateTime("")
                }}
                className="glass hover:bg-white/10 flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-500 transition-all"
              >
                Clear Filter
              </button>
            </div>

            {useTimeFilter && startDateTime && endDateTime && (
              <div className="pt-4 border-t border-white/5">
                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest text-center">
                  ✓ Showing orders from {new Date(startDateTime).toLocaleString("en-IN")} to {new Date(endDateTime).toLocaleString("en-IN")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Global Filter Station */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={16} />
            <input
              placeholder="Query order index..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900/40 border border-zinc-800 rounded-2xl pl-12 pr-4 py-3.5 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-orange-500/30 transition-all placeholder:text-zinc-800"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none sm:scrollbar-show -mx-4 px-4 sm:mx-0 sm:px-0">
            {[
              { id: 'all', label: 'Global', color: 'bg-zinc-800', count: orders.length },
              { id: 'pending', label: 'Staged', color: 'bg-amber-500', count: countPending },
              { id: 'paid', label: 'Cleared', color: 'bg-emerald-500', count: countPaid },
              { id: 'completed', label: 'Archived', color: 'bg-zinc-600', count: countCompleted }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setQuickFilter(f.id)}
                className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl border transition-all whitespace-nowrap ${quickFilter === f.id ? `${f.color} border-white/20 text-white font-black` : 'bg-transparent border-white/5 text-zinc-600 hover:text-zinc-300'
                  } text-[9px] uppercase tracking-widest`}
              >
                {f.label} <span className="opacity-40">{f.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Transmission History - Grouped by Time */}
        <div className="space-y-8">
          {[
            { key: 'lastHour', label: 'Last Hour', orders: groupedOrders.lastHour },
            { key: 'lastThreeHours', label: 'Last 3 Hours', orders: groupedOrders.lastThreeHours },
            { key: 'lastSixHours', label: 'Last 6 Hours', orders: groupedOrders.lastSixHours },
            { key: 'lastTwelveHours', label: 'Last 12 Hours', orders: groupedOrders.lastTwelveHours },
            { key: 'lastTwentyFourHours', label: 'Last 24 Hours', orders: groupedOrders.lastTwentyFourHours },
            { key: 'older', label: 'Older', orders: groupedOrders.older }
          ].map(section => (
            section.orders.length > 0 && (
              <div key={section.key} className="space-y-4">
                {/* Date Section Header */}
                <div className="flex items-center gap-4">
                  <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] whitespace-nowrap">{section.label}</h3>
                  <div className="h-px bg-white/5 w-full" />
                </div>

                {/* Orders in this section */}
                <AnimatePresence>
                  {section.orders.map((order, idx) => (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={order.id}
                      className="glass-dark rounded-3xl border-white/5 overflow-hidden group"
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-orange-500/10 p-2 rounded-xl"><Package size={16} className="text-orange-500" /></div>
                            <div>
                              <h4 className="text-sm font-black uppercase tracking-widest">Order Node-#{order.orderNumber}</h4>
                              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{order.createdAt?.toLocaleDateString("en-IN")} • {order.createdAt?.toLocaleTimeString("en-IN")}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black text-white tracking-tighter">₹{order.total}</p>
                          </div>
                        </div>

                        <details className="mb-6">
                          <summary className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] cursor-pointer hover:text-orange-500 transition-colors list-none flex items-center gap-2">
                            <Filter size={10} /> View Protocol Details
                          </summary>
                          <div className="mt-4 space-y-2 bg-black/20 p-4 rounded-2xl border border-white/5">
                            {Object.values(order.items || {}).map((it, i) => (
                              <div key={i} className="flex justify-between items-center text-xs">
                                <span className="text-zinc-400 font-bold uppercase tracking-widest">{it.name} <span className="text-zinc-600">x{it.qty}</span></span>
                                <span className="font-mono text-zinc-200">₹{it.price * it.qty}</span>
                              </div>
                            ))}
                          </div>
                        </details>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1 sm:ml-2">Payment Integrity</p>
                            <select
                              value={order.payment}
                              onChange={(e) => updateOrder(order.id, { payment: e.target.value })}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 sm:py-2.5 text-[10px] font-black uppercase tracking-widest focus:ring-1 focus:ring-orange-500 outline-none transition-all appearance-none"
                            >
                              <option value="pending">In-Transfer (Pending)</option>
                              <option value="completed">Confirmed (Cleared)</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1 sm:ml-2">Workflow Phase</p>
                            <select
                              value={order.status}
                              onChange={(e) => updateOrder(order.id, { status: e.target.value })}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 sm:py-2.5 text-[10px] font-black uppercase tracking-widest focus:ring-1 focus:ring-orange-500 outline-none transition-all appearance-none"
                            >
                              <option value="pending">Awaiting Sync</option>
                              <option value="preparing">In-Synthesis</option>
                              <option value="ready">Ready for Link</option>
                              <option value="completed">Archived</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )
          ))}

          {filteredOrders.length === 0 && (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
              <p className="text-zinc-500 font-black uppercase tracking-[0.3em] text-[10px]">No Active Transmissions Found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}