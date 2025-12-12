import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth"
import { auth, googleProvider } from "../Firebase"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  const navigate = useNavigate()

  // ✅ Email + Password Login
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate("/dashboard")
    } catch (err) {
      setError("Invalid email or password")
    }

    setLoading(false)
  }

  // ✅ Google Login
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
      navigate("/dashboard")
    } catch (err) {
      setError("Google login failed")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">

      {/* ✅ BACKGROUND IMAGE */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/bg.jpg')"   // ✅ put bg.jpg inside /public
        }}
      ></div>

      {/* ✅ DARK OVERLAY */}
      <div className="absolute inset-0 backdrop-blur-sm"></div>

      {/* ✅ LOGIN CARD */}
      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-3xl bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 shadow-2xl">

          <div className="p-8 sm:p-10">

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white">
                👋 Welcome Back 
              </h1>
              <p className="text-slate-200 text-sm mt-1">
                Sign in to continue
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/40 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Email */}
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mb-4 px-4 py-3 rounded-xl bg-black/40 text-white
              border border-slate-700/50 focus:ring-2 focus:ring-teal-500/30 outline-none"
            />

            {/* Password */}
            <div className="relative mb-4">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/40 text-white
                border border-slate-700/50 focus:ring-2 focus:ring-teal-500/30 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {/* Login Button */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white
              bg-gradient-to-r from-orange-500 to-red-500
shadow-orange-500/30
              hover:opacity-90 active:scale-[0.98]
              transition shadow-lg shadow-teal-500/30"
            >
              {loading ? "Signing in..." : "LOGIN"}
            </button>

            {/* Divider */}
            <div className="flex items-center my-6 gap-4">
              <div className="flex-1 h-px bg-slate-600/40"></div>
              <span className="text-slate-400 text-xs uppercase">or</span>
              <div className="flex-1 h-px bg-slate-600/40"></div>
            </div>

            {/* Google Login */}
            <button
              onClick={handleGoogleLogin}
              className="w-full py-3 rounded-xl bg-white text-black font-semibold
              hover:bg-gray-100 transition shadow"
            >
              Continue with Google
            </button>

            {/* Signup */}
            <p className="text-center text-slate-400 mt-6 text-sm">
              Don’t have an account?{" "}
              <button
                onClick={() => navigate("/signup")}
                className="text-teal-400 hover:text-teal-300 font-medium"
              >
                Sign up
              </button>
              {/* ⭐ FOOTER CREDIT */}
      <div className="absolute bottom-6 w-full text-center z-10">
        <p className="text-slate-300 text-sm tracking-wide">
          Made by <span className="text-teal-300 font-semibold">Harshren Ramesh Bachhav</span>
        </p>
      </div>
            </p>

          </div>
        </div>
      </div>
    </div>
  )
}
