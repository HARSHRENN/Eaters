import { useState } from "react"
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { auth } from "../Firebase"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Lock, Mail, ChefHat, Chrome, ArrowRight } from "lucide-react"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate("/dashboard")
    } catch (error) {
      alert("Login failed: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
      navigate("/dashboard")
    } catch (error) {
      alert("Google Login failed: " + error.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-linear-to-br from-gray-50 via-gray-100 to-gray-200 px-4 sm:px-6 py-8 sm:py-0">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center blur-[2px] scale-105"
        style={{ backgroundImage: "url('/bg2.jpg')" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl sm:rounded-4xl p-8 sm:p-10 border border-gray-200 shadow-2xl shadow-gray-900/10 text-left">

          {/* Logo & Header */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12, delay: 0.1 }}
              className="inline-flex items-center justify-center p-4 bg-linear-to-br from-orange-500 to-red-500 rounded-2xl sm:rounded-3xl shadow-xl shadow-orange-500/20 mb-6"
            >
              <ChefHat size={32} className="text-white" />
            </motion.div>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-800 tracking-tight leading-none mb-3 uppercase">EATERS</h1>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Kitchen Access Login ✨</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] ml-4">Mail Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors pointer-events-none" size={20} />
                <input
                  type="email"
                  placeholder="chef@eaters.com"
                  className="w-full bg-gray-50 border border-gray-300 rounded-2xl pl-12 pr-4 py-4 text-base text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all placeholder:text-gray-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] ml-4">Pass Key</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors pointer-events-none" size={20} />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border border-gray-300 rounded-2xl pl-12 pr-4 py-4 text-base text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all placeholder:text-gray-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full min-h-[52px] bg-linear-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/30 text-base group"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Access Kitchen</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest"><span className=" text-gray-500">Quick Access</span></div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01, backgroundColor: "rgba(0,0,0,0.03)" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            className="w-full min-h-[52px] bg-gray-100 hover:bg-gray-200 text-gray-700 font-black border border-gray-300 rounded-2xl flex items-center justify-center gap-3 transition-all text-sm uppercase tracking-widest"
          >
            <Chrome size={20} className="text-gray-600" />
            Sign in with Google
          </motion.button>

          <p className="mt-10 text-center text-gray-600 text-sm font-medium">
            New restaurant?{" "}
            <button
              onClick={() => navigate("/signup")}
              className="text-orange-600 hover:text-orange-700 font-black underline decoration-orange-500/30 underline-offset-4 decoration-2 transition-all cursor-pointer"
            >
              Start Service
            </button>
          </p>
        </div>

        {/* Footer info */}
        <p className="mt-8 text-center text-gray-600 text-[10px] font-black uppercase tracking-[0.3em]">
          EATERS -Harshren Bachhav
        </p>
      </motion.div>
    </div>
  )
}
