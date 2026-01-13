import { useEffect, useState, useRef } from "react"
import { useParams } from "react-router-dom"
import { db } from "../Firebase"
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion"
import { ChefHat, Info, Share2, MapPin, Clock, Utensils, Search, Star, MessageCircle, ArrowRight } from "lucide-react"
import {
  collection,
  query,
  where,
  onSnapshot
} from "firebase/firestore"

export default function Menu() {
  const { slug } = useParams()
  const [restaurant, setRestaurant] = useState(null)
  const [menuItems, setMenuItems] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const { scrollY } = useScroll()
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0])
  const heroScale = useTransform(scrollY, [0, 300], [1, 1.1])

  useEffect(() => {
    const unsubscribeRestaurant = onSnapshot(
      query(collection(db, "restaurants"), where("slug", "==", slug)),
      (snapshot) => {
        if (snapshot.empty) {
          setLoading(false)
          return
        }

        const resDoc = snapshot.docs[0]
        setRestaurant({ id: resDoc.id, ...resDoc.data() })

        const unsubscribeMenu = onSnapshot(
          collection(db, "restaurants", resDoc.id, "menu"),
          (menuSnap) => {
            const items = menuSnap.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            }))
            // Grouping by category
            const grouped = items.reduce((acc, item) => {
              if (!acc[item.category]) acc[item.category] = []
              acc[item.category].push(item)
              return acc
            }, {})
            setMenuItems(grouped)
            setLoading(false)
          }
        )
        return () => unsubscribeMenu()
      }
    )

    return () => unsubscribeRestaurant()
  }, [slug])

  const categories = ["all", ...Object.keys(menuItems)]

  const filteredItems = (category) => {
    const items = category === "all"
      ? Object.values(menuItems).flat()
      : menuItems[category] || []

    return items.filter(i =>
      i.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-16 h-16"
        >
          <div className="absolute inset-0 border-4 border-orange-500/30 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-orange-500 rounded-full" />
        </motion.div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="bg-zinc-900/50 p-6 rounded-[2rem] mb-6 border border-white/5"
        >
          <Info size={40} className="text-zinc-500" />
        </motion.div>
        <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Signal Lost</h1>
        <p className="text-zinc-600 font-medium max-w-xs leading-relaxed">The digital menu you are looking for is currently offline or does not exist.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-orange-500/30 font-sans">

      {/* Dynamic Hero */}
      <div className="relative h-[45vh] overflow-hidden">
        <motion.div
          style={{ scale: heroScale, opacity: heroOpacity }}
          className="absolute inset-0 bg-cover bg-center"
        >
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center grayscale opacity-60" />
          <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        </motion.div>

        <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 px-6 z-10">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 mb-6 shadow-2xl">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Live Kitchen</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase mb-4 text-transparent bg-clip-text bg-linear-to-b from-white to-zinc-500">
              {restaurant.name}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">
              <span className="flex items-center gap-1.5 bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-white/5"><Clock size={12} className="text-orange-500" /> Open Now</span>
              <span className="flex items-center gap-1.5 bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-white/5"><Star size={12} className="text-yellow-500" /> 4.9 Rating</span>
              <span className="flex items-center gap-1.5 bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-white/5"><MapPin size={12} className="text-blue-500" /> 2.4km Away</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Sticky Navigation */}
      <div className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 overflow-x-auto p-4 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeCategory === cat
                  ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105"
                  : "bg-transparent text-zinc-500 border-white/5 hover:border-white/10 hover:text-zinc-300"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* Search */}
        <div className="relative mb-10 group">
          <div className="absolute inset-0 bg-linear-to-r from-orange-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-white/5 flex items-center px-5 py-4 shadow-2xl">
            <Search className="text-zinc-500 group-focus-within:text-white transition-colors" size={18} />
            <input
              placeholder="Search for dishes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-white placeholder:text-zinc-600 px-4 uppercase tracking-wider"
            />
          </div>
        </div>

        {/* Menu Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory + searchTerm}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {filteredItems(activeCategory).length === 0 ? (
              <div className="col-span-full py-20 text-center">
                <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em]">No culinary matches found</p>
              </div>
            ) : (
              filteredItems(activeCategory).map((item) => (
                <motion.div
                  layout
                  key={item.id}
                  className="group relative bg-zinc-900/40 backdrop-blur-md border border-white/5 hover:border-white/10 rounded-[2rem] overflow-hidden transition-all hover:-translate-y-1"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        {item.category && (
                          <span className="inline-block px-2 py-1 rounded-md bg-white/5 text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-2">
                            {item.category}
                          </span>
                        )}
                        <h3 className="text-lg font-black text-white uppercase tracking-tight leading-tight mb-1 group-hover:text-orange-500 transition-colors">
                          {item.name}
                        </h3>
                        {item.available ? (
                          <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-emerald-500" /> In Stock
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-red-500" /> Sold Out
                          </span>
                        )}
                      </div>
                      <div className="bg-zinc-950 p-3 rounded-2xl border border-white/5 group-hover:border-orange-500/30 transition-colors">
                        <Utensils size={16} className="text-zinc-600 group-hover:text-orange-500 transition-colors" />
                      </div>
                    </div>

                    <div className="flex items-end justify-between mt-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Full</span>
                          <span className="text-lg font-black font-mono text-white">₹{item.priceFull}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Half</span>
                          <span className="text-sm font-black font-mono text-zinc-400">₹{item.priceHalf}</span>
                        </div>
                      </div>

                      <button className="bg-white text-black p-3 rounded-xl hover:scale-110 active:scale-95 transition-transform shadow-lg shadow-white/10">
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 mt-12 bg-black/40">
        <div className="max-w-3xl mx-auto px-6 flex flex-col items-center gap-6">
          <div className="w-12 h-12 bg-linear-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <ChefHat size={24} className="text-white" />
          </div>
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] text-center leading-loose">
            Powered by EATERS<br />Digital Restaurant OS
          </p>
          <div className="flex gap-4">
            <button className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-white transition-all"><Share2 size={16} /></button>
            <button className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-white transition-all"><MessageCircle size={16} /></button>
          </div>
        </div>
      </footer>
    </div>
  )
}
