import { Routes, Route, useLocation } from "react-router-dom";

import FixerIntro from "./components/FixerIntro.jsx";
import Navbar from "./components/Navbar.jsx";

import Home from "./pages/Home.jsx";
import Services from "./pages/Services.jsx";
import Login from "./pages/Login.jsx";
import Technicians from "./pages/Technicians.jsx";
import Profile from "./pages/Profile.jsx";
import Request from "./pages/Request.jsx";
import Register from "./pages/Register.jsx";
import MyRequests from "./pages/MyRequests.jsx";
import Track from "./pages/Track.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import BecomeFixer from "./pages/BecomeFixer.jsx";
import Privacy from "./pages/Privacy.jsx";

function App() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  return (
    <>
      <FixerIntro />

      {!isAuthPage && <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/technicians" element={<Technicians />} />
        <Route path="/technicians/:id" element={<Profile />} />
        <Route path="/request" element={<Request />} />
        <Route path="/register" element={<Register />} />
        <Route path="/my-requests" element={<MyRequests />} />
        <Route path="/track" element={<Track />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/become-fixer" element={<BecomeFixer />} />
        <Route path="/login" element={<Login />} />
        <Route path="/privacy" element={<Privacy />} />
      </Routes>
    </>
  );
}

export default App;
