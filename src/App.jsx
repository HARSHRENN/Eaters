import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Menu from "./pages/Menu";
import MainMenu from "./pages/MainMenu";
import PlaceOrder from "./pages/PlaceOrder.jsx";
import BillPage from "./pages/BillPage.jsx";   // ✅ IMPORTANT
import Orders from "./pages/Orders"

export default function App() {
  return (
    <Routes>

      <Route path="/" element={<Navigate to="/login" />} />

      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route path="/dashboard" element={<Dashboard />} />

      <Route path="/menu/:slug" element={<Menu />} />

      <Route path="/mainmenu/:slug" element={<MainMenu />} />

      <Route path="/place-order" element={<PlaceOrder />} />

      {/* ⭐ BILL PAGE */}
      <Route path="/bill/:orderId" element={<BillPage />} />

      <Route path="/orders" element={<Orders />} />

    </Routes>
  );
}
