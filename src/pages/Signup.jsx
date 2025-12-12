import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { auth } from "../Firebase"

export default function Signup() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const navigate = useNavigate()

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await createUserWithEmailAndPassword(auth, email, password)
      navigate("/login")
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered")
      } else if (err.code === "auth/weak-password") {
        setError("Password must be at least 6 characters")
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address")
      } else {
        setError("Something went wrong. Try again.")
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">

      {/* ✅ BACKGROUND IMAGE */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/bg.jpg')" }}
      ></div>

      {/* ✅ DARK OVERLAY */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

      {/* ✅ CARD */}
      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-3xl bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 shadow-2xl">

          <div className="p-8 sm:p-10">

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white">
                ✨ Create Account
              </h1>
              <p className="text-slate-200 text-sm mt-1">
                Start managing your restaurant
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/40 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSignup}>

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
                  placeholder="Password (min 6 character)"
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

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-white
                bg-gradient-to-r from-orange-500 to-red-500
                hover:opacity-90 active:scale-[0.98]
                transition shadow-lg shadow-orange-500/30 disabled:opacity-60"
              >
                {loading ? "Creating account..." : "SIGN UP"}
              </button>
            </form>

            {/* Footer */}
            <p className="text-center text-slate-400 mt-6 text-sm">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-teal-400 hover:text-teal-300 font-medium"
              >
                Login
              </button>
            </p>

          </div>
        </div>
      </div>
    </div>
  )
}
