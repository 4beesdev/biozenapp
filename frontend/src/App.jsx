import { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import html2canvas from "html2canvas";
import "./brand.css";

export default function App() {
  const [mode, setMode] = useState("login"); // login | register | forgot-password | reset-password
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [message, setMessage] = useState("");
  const [me, setMe] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState(null); // null = home, "merenja" | "podaci" | "saveti" | "blogovi" | "shop" | "chat"
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Proveri da li je korisnik ulogovan pri učitavanju
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      loadUserData();
    }
    
    // Proveri da li postoji reset token u URL-u
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get("token");
    if (tokenParam) {
      setResetToken(tokenParam);
      setMode("reset-password");
    }

    // Listener za browser back button - samo vrati na home
    const handlePopState = () => {
      // Vrati na home (activeTab = null) kada ide back
      setActiveTab(null);
      // Proveri autentifikaciju ako postoji token
      const token = localStorage.getItem("token");
      if (token && !isLoggedIn) {
        loadUserData();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Auto-hide notifikacija nakon 2 sekunde
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  async function loadUserData() {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoggedIn(false);
      return;
    }
    
    try {
      const res = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log("=== /api/me RESPONSE ===");
      console.log("Response status:", res.status);
      console.log("Response data:", data);
      console.log("Role in response:", data.role);
      console.log("Role type:", typeof data.role);
      if (res.ok && data.authenticated) {
        console.log("✓ Setting user data:", data);
        setMe(data);
        setIsLoggedIn(true);
        console.log("✓ User logged in, role:", data.role);
      } else {
        console.log("✗ Authentication failed - response not ok or not authenticated");
        // Ne briši token odmah - možda je privremena greška
        // Samo resetuj isLoggedIn state
        setIsLoggedIn(false);
      }
    } catch (e) {
      console.error("Greška pri učitavanju podataka:", e);
      // Ne briši token odmah - možda je privremena greška
      // Samo resetuj isLoggedIn state
      setIsLoggedIn(false);
    }
  }

  async function authSubmit(e) {
    e.preventDefault();
    if (mode === "forgot-password") {
      await handleForgotPassword();
      return;
    }
    if (mode === "reset-password") {
      await handleResetPassword();
      return;
    }
    
    const url = mode === "register" ? "/api/auth/register" : "/api/auth/login";
    setMessage("");
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Greška");
      if (data.token) {
        localStorage.setItem("token", data.token);
        setIsLoggedIn(true);
        await loadUserData();
      }
      setMessage(mode === "register" ? "Registracija uspešna" : "Login uspešan");
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleForgotPassword() {
    setMessage("");
    if (!email) {
      setMessage("Unesite email adresu");
      return;
    }
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Greška");
      setMessage(data.message || "Ako email postoji, poslat će se link za reset lozinke");
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleResetPassword() {
    setMessage("");
    if (!newPassword || newPassword.length < 6) {
      setMessage("Lozinka mora imati najmanje 6 karaktera");
      return;
    }
    if (!resetToken) {
      setMessage("Neispravan token");
      return;
    }
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Greška");
      setMessage(data.message || "Lozinka je uspešno resetovana. Možete se ulogovati.");
      setTimeout(() => {
        setMode("login");
        setResetToken("");
        setNewPassword("");
        window.history.replaceState({}, "", "/");
      }, 2000);
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function updateUserData(formData) {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("/api/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setMe(data);
        setMessage("Podaci su uspešno sačuvani");
      } else {
        setMessage(data.message || "Greška pri čuvanju podataka");
      }
    } catch (e) {
      setMessage("Greška pri čuvanju podataka");
    }
  }

  function logout() {
    // Obriši sve iz localStorage
    localStorage.removeItem("token");
    localStorage.clear(); // Očisti sve za sigurnost
    
    // Resetuj sve state varijable
    setMe(null);
    setIsLoggedIn(false);
    setMessage("Izlogovan");
    setActiveTab(null);
    setEmail("");
    setPassword("");
    
    // Force reload stranice da se osigura da se sve očisti
    window.location.href = "/";
  }

  // Ako je korisnik ulogovan, proveri da li je admin
  if (isLoggedIn) {
    // Debug logging
    console.log("=== RENDERING CHECK ===");
    console.log("isLoggedIn:", isLoggedIn);
    console.log("User data (me):", me);
    console.log("User role:", me?.role);
    console.log("User role type:", typeof me?.role);
    console.log("Role comparison (ADMIN):", me?.role === "ADMIN");
    console.log("Role comparison (admin):", me?.role === "admin");
    console.log("Role toUpperCase:", me?.role?.toUpperCase());
    console.log("Is admin (case insensitive)?", me?.role?.toUpperCase() === "ADMIN");
    
    // Ako je admin, prikaži admin panel (case insensitive check)
    const isAdmin = me?.role?.toUpperCase() === "ADMIN";
    if (isAdmin) {
      console.log("✓ Rendering AdminPanel");
      return <AdminPanel me={me} onLogout={logout} isMobile={isMobile} />;
    }
    // Inače prikaži obični dashboard
    console.log("✗ Rendering Dashboard (not admin)");
    return <Dashboard me={me} onUpdate={updateUserData} onLogout={logout} activeTab={activeTab} setActiveTab={setActiveTab} message={message} isMobile={isMobile} showTermsModal={showTermsModal} setShowTermsModal={setShowTermsModal} showPrivacyModal={showPrivacyModal} setShowPrivacyModal={setShowPrivacyModal} />;
  }

  // Ako nije ulogovan, prikaži login/register formu
  return (
    <div
      style={{
        fontFamily: "inherit",
        maxWidth: 480,
        width: "100%",
        margin: "60px auto",
        padding: isMobile ? "30px 20px" : "50px 40px",
        background: "var(--brand-bg-light)",
        border: "1px solid var(--brand-border)",
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(65, 101, 57, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 30 }}>
        <div style={{ marginBottom: 24 }}>
          <img 
            src="/logo.svg" 
            alt="BioZen Logo" 
            style={{ 
              height: 180,
              display: "block",
              margin: "0 auto"
            }}
            onError={(e) => {
              e.target.style.display = "none";
              const fallback = document.getElementById("logo-text-fallback");
              if (fallback) fallback.style.display = "block";
            }}
          />
          <div 
            style={{
              fontSize: 96,
              fontWeight: 700,
              background: "var(--brand-gradient)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              display: "none",
            }}
            id="logo-text-fallback"
          >
            BioZen
          </div>
        </div>
        <h2 style={{ 
          margin: "0 0 10px 0",
          color: "var(--brand-primary)",
          fontSize: 26,
          fontWeight: 600,
          letterSpacing: "-0.3px"
        }}>
          {mode === "login" ? "BioZen Tracker" : 
           mode === "register" ? "Kreirajte nalog" :
           mode === "forgot-password" ? "Zaboravili ste lozinku?" :
           "Resetuj lozinku"}
        </h2>
        <p style={{ 
          margin: 0,
          color: "var(--brand-text-light)",
          fontSize: 15,
          lineHeight: "1.6"
        }}>
          {mode === "login" ? "Ulogujte se u svoj nalog" : 
           mode === "register" ? "Započnite svoj zdravstveni put" :
           mode === "forgot-password" ? "Unesite email adresu i poslaćemo vam link za reset lozinke" :
           "Unesite novu lozinku"}
        </p>
      </div>

      <form onSubmit={authSubmit}>
        {(mode === "login" || mode === "register" || mode === "forgot-password") && (
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ 
              width: "100%", 
              padding: 12, 
              marginBottom: 16, 
              boxSizing: "border-box",
              border: "1px solid var(--brand-border)",
              borderRadius: 8,
              fontSize: 14,
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => e.target.style.borderColor = "var(--brand-primary)"}
            onBlur={(e) => e.target.style.borderColor = "var(--brand-border)"}
            required
          />
        )}
        {(mode === "login" || mode === "register") && (
          <input
            type="password"
            placeholder="Lozinka"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ 
              width: "100%", 
              padding: 12, 
              marginBottom: 20, 
              boxSizing: "border-box",
              border: "1px solid var(--brand-border)",
              borderRadius: 8,
              fontSize: 14,
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => e.target.style.borderColor = "var(--brand-primary)"}
            onBlur={(e) => e.target.style.borderColor = "var(--brand-border)"}
            required
          />
        )}
        {mode === "reset-password" && (
          <input
            type="password"
            placeholder="Nova lozinka (min. 6 karaktera)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{ 
              width: "100%", 
              padding: 12, 
              marginBottom: 20, 
              boxSizing: "border-box",
              border: "1px solid var(--brand-border)",
              borderRadius: 8,
              fontSize: 14,
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => e.target.style.borderColor = "var(--brand-primary)"}
            onBlur={(e) => e.target.style.borderColor = "var(--brand-border)"}
            required
            minLength={6}
          />
        )}
        <button
          type="submit"
          style={{
            width: "100%",
            padding: 14,
            background: "var(--brand-gradient)",
            color: "white",
            border: 0,
            borderRadius: 6,
            fontWeight: 600,
            cursor: "pointer",
            fontSize: 16,
            transition: "all 0.3s ease",
            boxShadow: "0 3px 8px rgba(65, 101, 57, 0.25)",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-1px)";
            e.target.style.boxShadow = "0 6px 8px -1px rgba(16, 185, 129, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 6px -1px rgba(16, 185, 129, 0.3)";
          }}
        >
          {mode === "login" ? "Uloguj se" : 
           mode === "register" ? "Registruj se" :
           mode === "forgot-password" ? "Pošalji link" :
           "Resetuj lozinku"}
        </button>
      </form>

      <div style={{ marginTop: 16 }}>
        {mode === "login" && (
          <>
            <button
              onClick={() => setMode("forgot-password")}
              style={{
                width: "100%",
                background: "transparent",
                border: 0,
                color: "var(--brand-secondary)",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: 13,
                padding: 8,
                marginBottom: 8,
              }}
            >
              Zaboravili ste lozinku?
            </button>
            <button
              onClick={() => setMode("register")}
              style={{
                width: "100%",
                background: "transparent",
                border: 0,
                color: "var(--brand-secondary)",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: 13,
                padding: 8,
              }}
            >
              Nemaš nalog? Registruj se
            </button>
          </>
        )}
        {mode === "register" && (
          <button
            onClick={() => setMode("login")}
            style={{
              width: "100%",
              background: "transparent",
              border: 0,
              color: "var(--brand-secondary)",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: 14,
              padding: 8,
            }}
          >
            Imaš nalog? Uloguj se
          </button>
        )}
        {(mode === "forgot-password" || mode === "reset-password") && (
          <button
            onClick={() => {
              setMode("login");
              setResetToken("");
              setNewPassword("");
              window.history.replaceState({}, "", "/");
            }}
            style={{
              width: "100%",
              background: "transparent",
              border: 0,
              color: "var(--brand-secondary)",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: 14,
              padding: 8,
            }}
          >
            Nazad na login
          </button>
        )}
      </div>

      {/* Floating notifikacija */}
      {message && (
        <div style={{ 
          position: "fixed",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "14px 24px",
          borderRadius: 12,
          background: message.includes("uspeš") || message.includes("uspešno") || message.includes("uspešan") || message.includes("Izlogovan")
            ? "rgba(16, 185, 129, 0.95)" 
            : "rgba(239, 68, 68, 0.95)",
          color: "white",
          fontSize: 14,
          fontWeight: 500,
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          zIndex: 10000,
          animation: "slideDown 0.3s ease-out",
          maxWidth: "90%",
          textAlign: "center",
          whiteSpace: "nowrap",
        }}>
          {message}
        </div>
      )}
    </div>
  );
}

// Dashboard komponenta
function Dashboard({ me, onUpdate, onLogout, activeTab, setActiveTab, message, isMobile: isMobileProp, showTermsModal, setShowTermsModal, showPrivacyModal, setShowPrivacyModal }) {
  const [formData, setFormData] = useState({
    ime: me?.ime || "",
    prezime: me?.prezime || "",
    pol: me?.pol || "",
    starost: me?.starost || "",
    kilaza: me?.kilaza || "",
    zeljenaKilaza: me?.zeljenaKilaza || "",
    obimStruka: me?.obimStruka || "",
  });

  const [measurements, setMeasurements] = useState([]);
  const [showMeasurementForm, setShowMeasurementForm] = useState(false);
  const [measurementForm, setMeasurementForm] = useState({
    datum: new Date().toISOString().split('T')[0],
    kilaza: "",
    obimStruka: "",
    komentar: "",
  });
  const [measurementMessage, setMeasurementMessage] = useState("");
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [blogs, setBlogs] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [loadingBlogs, setLoadingBlogs] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatMessagesEndRef = useRef(null);
  const chartRef = useRef(null);
  const isMobile = isMobileProp !== undefined ? isMobileProp : window.innerWidth <= 768;

  // Priprema podataka za grafikon i domen Y ose (da obuhvati i referentne linije)
  const chartData = measurements
    .slice()
    .sort((a, b) => new Date(a.datum) - new Date(b.datum))
    .map(m => {
      const date = new Date(m.datum);
      return {
        datum: date.toLocaleDateString('sr-RS', { 
          day: '2-digit', 
          month: '2-digit',
          year: date.getFullYear() !== new Date().getFullYear() ? '2-digit' : undefined
        }),
        kilaza: m.kilaza,
        fullDate: m.datum,
        dateObj: date,
      };
    });

  const currentWeight = me?.kilaza ? parseFloat(me.kilaza) : null;
  const desiredWeight = me?.zeljenaKilaza ? parseFloat(me.zeljenaKilaza) : null;
  const weightValues = chartData
    .map(d => parseFloat(d.kilaza))
    .filter(v => !Number.isNaN(v));
  if (currentWeight && !Number.isNaN(currentWeight)) weightValues.push(currentWeight);
  if (desiredWeight && !Number.isNaN(desiredWeight)) weightValues.push(desiredWeight);
  const minY = weightValues.length ? Math.min(...weightValues) : 0;
  const maxY = weightValues.length ? Math.max(...weightValues) : 0;
  const padding = weightValues.length ? Math.max(1, Math.round((maxY - minY) * 0.05)) : 5;
  const domainMin = minY - padding;
  const domainMax = maxY + padding;

  useEffect(() => {
    if (me) {
      setFormData({
        ime: me.ime || "",
        prezime: me.prezime || "",
        pol: me.pol || "",
        starost: me.starost || "",
        kilaza: me.kilaza || "",
        zeljenaKilaza: me.zeljenaKilaza || "",
        obimStruka: me.obimStruka || "",
      });
    }
  }, [me]);

  useEffect(() => {
    if (activeTab === "merenja" && me) {
      loadMeasurements();
    }
    if (activeTab === "blogovi") {
      console.log("=== useEffect: activeTab is 'blogovi', calling loadPublishedBlogs ===");
      loadPublishedBlogs();
    }
  }, [activeTab, me]);

  // Učitaj chat istoriju kada se otvori chat tab
  useEffect(() => {
    if (activeTab === "chat") {
      loadChatHistory();
    }
  }, [activeTab]);

  async function loadChatHistory() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("/api/chat/history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data);
        // Scroll to bottom after loading
        setTimeout(() => {
          if (chatMessagesEndRef.current) {
            chatMessagesEndRef.current.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
      }
    } catch (e) {
      console.error("Greška pri učitavanju chat istorije:", e);
    }
  }

  async function sendChatMessage(e) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token || !chatInput.trim() || sendingMessage) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setSendingMessage(true);

    // Dodaj korisničku poruku odmah u UI
    const tempUserMessage = {
      id: Date.now(),
      role: "user",
      message: userMessage,
      createdAt: new Date().toISOString(),
    };
    setChatMessages(prev => [...prev, tempUserMessage]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();
      if (res.ok) {
        // Zameni temp poruku sa stvarnom i dodaj odgovor
        setChatMessages(prev => {
          const filtered = prev.filter(msg => msg.id !== tempUserMessage.id);
          return [...filtered, {
            id: tempUserMessage.id,
            role: "user",
            message: userMessage,
            createdAt: new Date().toISOString(),
          }, {
            id: data.id || Date.now() + 1,
            role: "assistant",
            message: data.message,
            createdAt: new Date().toISOString(),
          }];
        });
        // Scroll to bottom
        setTimeout(() => {
          if (chatMessagesEndRef.current) {
            chatMessagesEndRef.current.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
      } else {
        // Ukloni temp poruku i prikaži grešku
        setChatMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
        alert(data.message || "Greška pri slanju poruke");
      }
    } catch (e) {
      console.error("Greška pri slanju poruke:", e);
      setChatMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
      alert("Greška pri slanju poruke");
    } finally {
      setSendingMessage(false);
    }
  }

  async function loadPublishedBlogs() {
    console.log("=== loadPublishedBlogs() called ===");
    setLoadingBlogs(true);
    try {
      const res = await fetch("/api/blog?page=0&size=20");
      console.log("Response status:", res.status, res.ok);
      const data = await res.json();
      console.log("=== Blogovi API Response ===", data);
      console.log("Data.posts:", data.posts);
      console.log("Data.posts type:", typeof data.posts);
      console.log("Data.posts is array:", Array.isArray(data.posts));
      if (res.ok && data.posts) {
        console.log("Učitano blogova:", data.posts.length);
        console.log("Blogovi:", data.posts);
        setBlogs(data.posts);
        console.log("Blogs state set to:", data.posts);
      } else {
        console.error("Greška pri učitavanju blogova - res.ok:", res.ok, "data.posts:", data.posts);
        setBlogs([]);
      }
    } catch (e) {
      console.error("Greška pri učitavanju blogova:", e);
      setBlogs([]);
    } finally {
      setLoadingBlogs(false);
      console.log("Loading finished, blogs state:", blogs);
    }
  }

  // PWA Install prompt
  useEffect(() => {
    // Proveri da li je iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);
    
    // Proveri da li je već instalirano (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator.standalone) || 
                       document.referrer.includes('android-app://');
    setIsStandalone(standalone);
    
    // Za Chrome/Edge/Android - koristi beforeinstallprompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    
    // Za Safari/iOS - prikaži dugme ako nije instalirano
    if (iOS && !standalone) {
      setShowInstallButton(true);
    }
    
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstallButton(false);
    }
    setDeferredPrompt(null);
  }

  async function loadMeasurements() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("/api/measurements", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMeasurements(data);
      }
    } catch (e) {
      console.error("Greška pri učitavanju merenja:", e);
    }
  }

  async function addMeasurement(e) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    setMeasurementMessage("");
    try {
      const res = await fetch("/api/measurements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(measurementForm),
      });
      const data = await res.json();
      if (res.ok) {
        setMeasurementMessage("Merenje je uspešno dodato");
        setMeasurementForm({
          datum: new Date().toISOString().split('T')[0],
          kilaza: "",
          obimStruka: "",
          komentar: "",
        });
        setShowMeasurementForm(false);
        await loadMeasurements();
      } else {
        setMeasurementMessage(data.message || "Greška pri dodavanju merenja");
      }
    } catch (e) {
      setMeasurementMessage("Greška pri dodavanju merenja");
    }
  }

  async function deleteMeasurement(id) {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (!confirm("Da li ste sigurni da želite da obrišete ovo merenje?")) {
      return;
    }

    try {
      const res = await fetch(`/api/measurements/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMeasurementMessage("Merenje je obrisano");
        await loadMeasurements();
      } else {
        const data = await res.json();
        setMeasurementMessage(data.message || "Greška pri brisanju merenja");
      }
    } catch (e) {
      setMeasurementMessage("Greška pri brisanju merenja");
    }
  }

  async function saveChartAsImage() {
    if (!chartRef.current) return;

    try {
      // Sačekaj da se logo učita
      const logoImg = chartRef.current.querySelector('img');
      if (logoImg && !logoImg.complete) {
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = resolve; // Nastavi čak i ako logo ne može da se učita
          setTimeout(resolve, 1000); // Timeout nakon 1 sekunde
        });
      }

      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        imageTimeout: 5000,
      });

      const link = document.createElement('a');
      const fileName = `${me?.ime || 'Korisnik'}_${me?.prezime || ''}_grafik_kilaze_${new Date().toISOString().split('T')[0]}.png`;
      link.download = fileName;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      setMeasurementMessage("Grafik je uspešno sačuvan");
    } catch (error) {
      console.error('Greška pri čuvanju grafikona:', error);
      setMeasurementMessage("Greška pri čuvanju grafikona");
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const dataToSend = {
      ime: formData.ime || null,
      prezime: formData.prezime || null,
      pol: formData.pol || null,
      starost: formData.starost ? parseInt(formData.starost) : null,
      kilaza: formData.kilaza ? parseFloat(formData.kilaza) : null,
      zeljenaKilaza: formData.zeljenaKilaza ? parseFloat(formData.zeljenaKilaza) : null,
      obimStruka: formData.obimStruka ? parseFloat(formData.obimStruka) : null,
    };
    onUpdate(dataToSend);
  }

  return (
    <div
      style={{
        fontFamily: "inherit",
        maxWidth: 1000,
        width: "100%",
        margin: "0 auto",
        padding: isMobile ? "15px 10px" : "30px 20px",
        paddingBottom: isMobile && showInstallButton ? "100px" : (isMobile ? "80px" : "100px"),
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: 32,
        paddingBottom: 20,
        borderBottom: "2px solid var(--brand-border)",
      }}>
        <div 
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: isMobile ? 10 : 12,
            cursor: activeTab !== null ? "pointer" : "default",
          }}
          onClick={() => activeTab !== null && setActiveTab(null)}
        >
          <img 
            src="/logo.svg" 
            alt="BioZen Logo" 
            style={{ 
              height: isMobile ? 56 : 40,
              display: "block",
            }}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
          <h1 style={{ 
            margin: 0,
            fontSize: isMobile ? 22 : 30,
            fontWeight: 700,
            color: "var(--brand-primary)",
            letterSpacing: "-0.5px",
          }}>BioZen</h1>
        </div>
        <button
          onClick={onLogout}
          style={{
            padding: "10px 20px",
            background: "var(--brand-error)",
            color: "white",
            border: 0,
            borderRadius: 6,
            fontWeight: 600,
            cursor: "pointer",
            fontSize: 14,
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => e.target.style.background = "#b83a3a"}
          onMouseLeave={(e) => e.target.style.background = "var(--brand-error)"}
        >
          Logout
        </button>
      </div>

      {/* Desktop: Tabovi */}
      {!isMobile && (
        <div style={{ 
          display: "flex",
          gap: 12, 
          marginBottom: 24,
          background: "var(--brand-bg-light)",
          padding: 4,
          borderRadius: 12,
          border: "1px solid var(--brand-border)",
        }}>
          <button
            onClick={() => setActiveTab(null)}
            style={{
              flex: 1,
              padding: 14,
              background: activeTab === null ? "var(--brand-gradient)" : "transparent",
              color: activeTab === null ? "white" : "var(--brand-text)",
              border: 0,
              borderRadius: 6,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 15,
              transition: "all 0.2s",
            }}
          >
            Home
          </button>
          <button
            onClick={() => setActiveTab("merenja")}
            style={{
              flex: 1,
              padding: 14,
              background: activeTab === "merenja" ? "var(--brand-gradient)" : "transparent",
              color: activeTab === "merenja" ? "white" : "var(--brand-text)",
              border: 0,
              borderRadius: 6,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 15,
              transition: "all 0.2s",
            }}
          >
            Moja merenja
          </button>
          <button
            onClick={() => setActiveTab("podaci")}
            style={{
              flex: 1,
              padding: 14,
              background: activeTab === "podaci" ? "var(--brand-gradient)" : "transparent",
              color: activeTab === "podaci" ? "white" : "var(--brand-text)",
              border: 0,
              borderRadius: 6,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 15,
              transition: "all 0.2s",
            }}
          >
            Moji podaci
          </button>
          <button
            onClick={() => setActiveTab("saveti")}
            style={{
              flex: 1,
              padding: 14,
              background: activeTab === "saveti" ? "var(--brand-gradient)" : "transparent",
              color: activeTab === "saveti" ? "white" : "var(--brand-text)",
              border: 0,
              borderRadius: 6,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 15,
              transition: "all 0.2s",
            }}
          >
            Saveti
          </button>
          <button
            onClick={() => setActiveTab("blogovi")}
            style={{
              flex: 1,
              padding: 14,
              background: activeTab === "blogovi" ? "var(--brand-gradient)" : "transparent",
              color: activeTab === "blogovi" ? "white" : "var(--brand-text)",
              border: 0,
              borderRadius: 6,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 15,
              transition: "all 0.2s",
            }}
          >
            📝 Blogovi
          </button>
          <button
            onClick={() => setActiveTab("shop")}
            style={{
              flex: 1,
              padding: 14,
              background: activeTab === "shop" ? "var(--brand-gradient)" : "transparent",
              color: activeTab === "shop" ? "white" : "var(--brand-text)",
              border: 0,
              borderRadius: 6,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 15,
              transition: "all 0.2s",
            }}
          >
            BioZen Shop
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            style={{
              flex: 1,
              padding: 14,
              background: activeTab === "chat" ? "var(--brand-gradient)" : "transparent",
              color: activeTab === "chat" ? "white" : "var(--brand-text)",
              border: 0,
              borderRadius: 6,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 15,
              transition: "all 0.2s",
            }}
          >
            💬 Chat
          </button>
        </div>
      )}

      {/* Mobile: Home Screen sa ikonama */}
      {isMobile && activeTab === null && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          padding: "40px 20px",
        }}>
          <h2 style={{
            margin: "0 0 40px 0",
            fontSize: 24,
            fontWeight: 600,
            color: "var(--brand-primary)",
            textAlign: "center",
          }}>
            Dobrodošli
          </h2>
          <div style={{ 
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 15,
            width: "100%",
            maxWidth: 500,
          }}>
            <button
              onClick={() => setActiveTab("merenja")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px 16px",
                background: "var(--brand-bg-light)",
                color: "var(--brand-text)",
                border: "1px solid var(--brand-border)",
                borderRadius: 16,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 13,
                transition: "all 0.3s ease",
                boxShadow: "0 2px 8px rgba(65, 101, 57, 0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(65, 101, 57, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(65, 101, 57, 0.1)";
              }}
            >
              <span style={{ fontSize: 40, marginBottom: 8 }}>📊</span>
              <span>Moja merenja</span>
            </button>
            <button
              onClick={() => setActiveTab("podaci")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px 16px",
                background: "var(--brand-bg-light)",
                color: "var(--brand-text)",
                border: "1px solid var(--brand-border)",
                borderRadius: 16,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 13,
                transition: "all 0.3s ease",
                boxShadow: "0 2px 8px rgba(65, 101, 57, 0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(65, 101, 57, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(65, 101, 57, 0.1)";
              }}
            >
              <span style={{ fontSize: 40, marginBottom: 8 }}>👤</span>
              <span>Moji podaci</span>
            </button>
            <button
              onClick={() => setActiveTab("saveti")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px 16px",
                background: "var(--brand-bg-light)",
                color: "var(--brand-text)",
                border: "1px solid var(--brand-border)",
                borderRadius: 16,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 13,
                transition: "all 0.3s ease",
                boxShadow: "0 2px 8px rgba(65, 101, 57, 0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(65, 101, 57, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(65, 101, 57, 0.1)";
              }}
            >
              <span style={{ fontSize: 40, marginBottom: 8 }}>💡</span>
              <span>Saveti</span>
            </button>
            <button
              onClick={() => setActiveTab("blogovi")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px 16px",
                background: "var(--brand-bg-light)",
                color: "var(--brand-text)",
                border: "1px solid var(--brand-border)",
                borderRadius: 16,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 13,
                transition: "all 0.3s ease",
                boxShadow: "0 2px 8px rgba(65, 101, 57, 0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(65, 101, 57, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(65, 101, 57, 0.1)";
              }}
            >
              <span style={{ fontSize: 40, marginBottom: 8 }}>📝</span>
              <span>Blogovi</span>
            </button>
            <button
              onClick={() => setActiveTab("shop")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px 16px",
                background: "var(--brand-bg-light)",
                color: "var(--brand-text)",
                border: "1px solid var(--brand-border)",
                borderRadius: 16,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 13,
                transition: "all 0.3s ease",
                boxShadow: "0 2px 8px rgba(65, 101, 57, 0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(65, 101, 57, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(65, 101, 57, 0.1)";
              }}
            >
              <span style={{ fontSize: 40, marginBottom: 8 }}>🛒</span>
              <span>BioZen Shop</span>
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px 16px",
                background: "var(--brand-bg-light)",
                color: "var(--brand-text)",
                border: "1px solid var(--brand-border)",
                borderRadius: 16,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 13,
                transition: "all 0.3s ease",
                boxShadow: "0 2px 8px rgba(65, 101, 57, 0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(65, 101, 57, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(65, 101, 57, 0.1)";
              }}
            >
              <span style={{ fontSize: 40, marginBottom: 8 }}>💬</span>
              <span>Chat</span>
            </button>
          </div>

          {/* Instagram link - samo na Home stranici */}
          <div style={{
            marginTop: 32,
            padding: "16px",
            background: "var(--brand-bg-light)",
            border: "1px solid var(--brand-border)",
            borderRadius: 12,
            width: "100%",
            maxWidth: 300,
          }}>
            <a
              href="https://www.instagram.com/bio.zen_official?igsh=MXFnODhkbTBvazRnYw=="
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                color: "var(--brand-text)",
                textDecoration: "none",
                fontSize: 15,
                fontWeight: 500,
                padding: "10px 20px",
                borderRadius: 8,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--brand-bg)";
                e.currentTarget.style.color = "var(--brand-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--brand-text)";
              }}
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="currentColor"
                style={{ flexShrink: 0 }}
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <span>Pratite nas na Instagramu</span>
            </a>
          </div>
        </div>
      )}

      {/* Mobile: Ikonice u header-u kada je tab otvoren (back button) */}
      {isMobile && activeTab !== null && (
        <div style={{ 
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 16, 
          marginBottom: 24,
        }}>
          <button
            onClick={() => setActiveTab("merenja")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px 12px",
              background: activeTab === "merenja" ? "var(--brand-gradient)" : "var(--brand-bg-light)",
              color: activeTab === "merenja" ? "white" : "var(--brand-text)",
              border: activeTab === "merenja" ? "none" : "1px solid var(--brand-border)",
              borderRadius: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 14,
              transition: "all 0.2s",
              boxShadow: activeTab === "merenja" ? "0 3px 8px rgba(65, 101, 57, 0.25)" : "none",
            }}
          >
            <span style={{ fontSize: 32, marginBottom: 8 }}>📊</span>
            <span>Moja merenja</span>
          </button>
          <button
            onClick={() => setActiveTab("podaci")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px 12px",
              background: activeTab === "podaci" ? "var(--brand-gradient)" : "var(--brand-bg-light)",
              color: activeTab === "podaci" ? "white" : "var(--brand-text)",
              border: activeTab === "podaci" ? "none" : "1px solid var(--brand-border)",
              borderRadius: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 14,
              transition: "all 0.2s",
              boxShadow: activeTab === "podaci" ? "0 3px 8px rgba(65, 101, 57, 0.25)" : "none",
            }}
          >
            <span style={{ fontSize: 32, marginBottom: 8 }}>👤</span>
            <span>Moji podaci</span>
          </button>
          <button
            onClick={() => setActiveTab("saveti")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px 12px",
              background: activeTab === "saveti" ? "var(--brand-gradient)" : "var(--brand-bg-light)",
              color: activeTab === "saveti" ? "white" : "var(--brand-text)",
              border: activeTab === "saveti" ? "none" : "1px solid var(--brand-border)",
              borderRadius: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 14,
              transition: "all 0.2s",
              boxShadow: activeTab === "saveti" ? "0 3px 8px rgba(65, 101, 57, 0.25)" : "none",
            }}
          >
            <span style={{ fontSize: 32, marginBottom: 8 }}>💡</span>
            <span>Saveti</span>
          </button>
          <button
            onClick={() => setActiveTab("blogovi")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px 12px",
              background: activeTab === "blogovi" ? "var(--brand-gradient)" : "var(--brand-bg-light)",
              color: activeTab === "blogovi" ? "white" : "var(--brand-text)",
              border: activeTab === "blogovi" ? "none" : "1px solid var(--brand-border)",
              borderRadius: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 14,
              transition: "all 0.2s",
              boxShadow: activeTab === "blogovi" ? "0 3px 8px rgba(65, 101, 57, 0.25)" : "none",
            }}
          >
            <span style={{ fontSize: 32, marginBottom: 8 }}>📝</span>
            <span>Blogovi</span>
          </button>
          <button
            onClick={() => setActiveTab("shop")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px 12px",
              background: activeTab === "shop" ? "var(--brand-gradient)" : "var(--brand-bg-light)",
              color: activeTab === "shop" ? "white" : "var(--brand-text)",
              border: activeTab === "shop" ? "none" : "1px solid var(--brand-border)",
              borderRadius: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 14,
              transition: "all 0.2s",
              boxShadow: activeTab === "shop" ? "0 3px 8px rgba(65, 101, 57, 0.25)" : "none",
            }}
          >
            <span style={{ fontSize: 32, marginBottom: 8 }}>🛒</span>
            <span>BioZen Shop</span>
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px 12px",
              background: activeTab === "chat" ? "var(--brand-gradient)" : "var(--brand-bg-light)",
              color: activeTab === "chat" ? "white" : "var(--brand-text)",
              border: activeTab === "chat" ? "none" : "1px solid var(--brand-border)",
              borderRadius: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 14,
              transition: "all 0.2s",
              boxShadow: activeTab === "chat" ? "0 3px 8px rgba(65, 101, 57, 0.25)" : "none",
            }}
          >
            <span style={{ fontSize: 32, marginBottom: 8 }}>💬</span>
            <span>Chat</span>
          </button>
        </div>
      )}

      {/* Desktop: Home Screen */}
      {!isMobile && activeTab === null && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
          padding: "60px 20px",
        }}>
          <h2 style={{
            margin: "0 0 50px 0",
            fontSize: 32,
            fontWeight: 600,
            color: "var(--brand-primary)",
            textAlign: "center",
          }}>
            Dobrodošli u BioZen Tracker
          </h2>
          <div style={{ 
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 24,
            width: "100%",
            maxWidth: 900,
          }}>
            <button
              onClick={() => setActiveTab("merenja")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 24px",
                background: "var(--brand-bg-light)",
                color: "var(--brand-text)",
                border: "1px solid var(--brand-border)",
                borderRadius: 16,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 15,
                transition: "all 0.3s ease",
                boxShadow: "0 2px 8px rgba(65, 101, 57, 0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(65, 101, 57, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(65, 101, 57, 0.1)";
              }}
            >
              <span style={{ fontSize: 56, marginBottom: 16 }}>📊</span>
              <span>Moja merenja</span>
            </button>
            <button
              onClick={() => setActiveTab("podaci")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 24px",
                background: "var(--brand-bg-light)",
                color: "var(--brand-text)",
                border: "1px solid var(--brand-border)",
                borderRadius: 16,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 15,
                transition: "all 0.3s ease",
                boxShadow: "0 2px 8px rgba(65, 101, 57, 0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(65, 101, 57, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(65, 101, 57, 0.1)";
              }}
            >
              <span style={{ fontSize: 56, marginBottom: 16 }}>👤</span>
              <span>Moji podaci</span>
            </button>
            <button
              onClick={() => setActiveTab("saveti")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 24px",
                background: "var(--brand-bg-light)",
                color: "var(--brand-text)",
                border: "1px solid var(--brand-border)",
                borderRadius: 16,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 15,
                transition: "all 0.3s ease",
                boxShadow: "0 2px 8px rgba(65, 101, 57, 0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(65, 101, 57, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(65, 101, 57, 0.1)";
              }}
            >
              <span style={{ fontSize: 56, marginBottom: 16 }}>💡</span>
              <span>Saveti</span>
            </button>
            <button
              onClick={() => setActiveTab("shop")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 24px",
                background: "var(--brand-bg-light)",
                color: "var(--brand-text)",
                border: "1px solid var(--brand-border)",
                borderRadius: 16,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 15,
                transition: "all 0.3s ease",
                boxShadow: "0 2px 8px rgba(65, 101, 57, 0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(65, 101, 57, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(65, 101, 57, 0.1)";
              }}
            >
              <span style={{ fontSize: 56, marginBottom: 16 }}>🛒</span>
              <span>BioZen Shop</span>
            </button>
          </div>
        </div>
      )}

      {message && activeTab !== null && (
        <div
          style={{
            padding: 14,
            marginBottom: 20,
            background: message.includes("uspeš") ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
            color: message.includes("uspeš") ? "var(--brand-success)" : "var(--brand-error)",
            borderRadius: 8,
            border: `1px solid ${message.includes("uspeš") ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {message}
        </div>
      )}

      {activeTab === "merenja" && (
        <div
          style={{
            border: "1px solid var(--brand-border)",
            borderRadius: 10,
            padding: isMobile ? 20 : 35,
            background: "var(--brand-bg-light)",
            boxShadow: "0 2px 8px rgba(65, 101, 57, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div style={{ 
            display: "flex", 
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between", 
            alignItems: isMobile ? "flex-start" : "center", 
            gap: isMobile ? 12 : 0,
            marginBottom: 24 
          }}>
            <h2 style={{ 
              margin: 0,
              fontSize: isMobile ? 18 : 24,
              fontWeight: 600,
              color: "var(--brand-primary)",
              letterSpacing: "-0.3px",
            }}>Moja merenja</h2>
            <button
              onClick={() => setShowMeasurementForm(!showMeasurementForm)}
              style={{
                padding: isMobile ? "10px 16px" : "10px 20px",
                background: "var(--brand-gradient)",
                color: "white",
                border: 0,
                borderRadius: 6,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: isMobile ? 13 : 14,
                transition: "all 0.3s ease",
                boxShadow: "0 3px 8px rgba(65, 101, 57, 0.25)",
                width: isMobile ? "100%" : "auto",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 5px 12px rgba(65, 101, 57, 0.35)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 3px 8px rgba(65, 101, 57, 0.25)";
              }}
            >
              {showMeasurementForm ? "Otkaži" : "Dodaj merenje"}
            </button>
          </div>

          {measurementMessage && (
            <div style={{
              padding: 12,
              marginBottom: 20,
              background: measurementMessage.includes("uspeš") ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
              color: measurementMessage.includes("uspeš") ? "var(--brand-success)" : "var(--brand-error)",
              borderRadius: 8,
              border: `1px solid ${measurementMessage.includes("uspeš") ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
              fontSize: 14,
            }}>
              {measurementMessage}
            </div>
          )}

          {showMeasurementForm && (
            <div style={{
              marginBottom: 24,
              padding: 24,
              background: "var(--brand-bg)",
              borderRadius: 8,
              border: "1px solid var(--brand-border)",
            }}>
              <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 18, fontWeight: 600, color: "var(--brand-text)" }}>
                Dodaj novo merenje
              </h3>
              <form onSubmit={addMeasurement}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ 
                    display: "block", 
                    marginBottom: 8, 
                    fontWeight: 600,
                    color: "var(--brand-text)",
                    fontSize: 13,
                  }}>
                    Datum
                  </label>
                  <input
                    type="date"
                    value={measurementForm.datum}
                    onChange={(e) => setMeasurementForm({ ...measurementForm, datum: e.target.value })}
                    style={{ 
                      width: "100%", 
                      padding: 12, 
              borderRadius: 6,
              border: "1px solid var(--brand-border)",
              boxSizing: "border-box",
              fontSize: 15,
              transition: "all 0.2s",
              background: "var(--brand-bg-light)",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "var(--brand-primary)"}
                    onBlur={(e) => e.target.style.borderColor = "var(--brand-border)"}
                    required
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ 
                    display: "block", 
                    marginBottom: 8, 
                    fontWeight: 600,
                    color: "var(--brand-text)",
                    fontSize: 13,
                  }}>
                    Kilaža (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={measurementForm.kilaza}
                    onChange={(e) => setMeasurementForm({ ...measurementForm, kilaza: e.target.value })}
                    style={{ 
                      width: "100%", 
                      padding: 12, 
              borderRadius: 6,
              border: "1px solid var(--brand-border)",
              boxSizing: "border-box",
              fontSize: 15,
              transition: "all 0.2s",
              background: "var(--brand-bg-light)",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "var(--brand-primary)"}
                    onBlur={(e) => e.target.style.borderColor = "var(--brand-border)"}
                    placeholder="Unesite kilažu"
                    min="0"
                    required
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ 
                    display: "block", 
                    marginBottom: 8, 
                    fontWeight: 600,
                    color: "var(--brand-text)",
                    fontSize: 13,
                  }}>
                    Obim struka (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={measurementForm.obimStruka}
                    onChange={(e) => setMeasurementForm({ ...measurementForm, obimStruka: e.target.value })}
                    style={{ 
                      width: "100%", 
                      padding: 12, 
              borderRadius: 6,
              border: "1px solid var(--brand-border)",
              boxSizing: "border-box",
              fontSize: 15,
              transition: "all 0.2s",
              background: "var(--brand-bg-light)",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "var(--brand-primary)"}
                    onBlur={(e) => e.target.style.borderColor = "var(--brand-border)"}
                    placeholder="Unesite obim struka"
                    min="0"
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ 
                    display: "block", 
                    marginBottom: 8, 
                    fontWeight: 600,
                    color: "var(--brand-text)",
                    fontSize: 13,
                  }}>
                    Komentar
                  </label>
                  <textarea
                    value={measurementForm.komentar}
                    onChange={(e) => setMeasurementForm({ ...measurementForm, komentar: e.target.value })}
                    style={{ 
                      width: "100%", 
                      padding: 12, 
              borderRadius: 6,
              border: "1px solid var(--brand-border)",
              boxSizing: "border-box",
              fontSize: 15,
              transition: "all 0.2s",
              background: "var(--brand-bg-light)",
                      minHeight: 80,
                      resize: "vertical",
                      fontFamily: "inherit",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "var(--brand-primary)"}
                    onBlur={(e) => e.target.style.borderColor = "var(--brand-border)"}
                    placeholder="Dodatni komentar (opciono)"
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: 12,
                    background: "var(--brand-gradient)",
                    color: "white",
                    border: 0,
                    borderRadius: 8,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: 15,
                  }}
                >
                  Sačuvaj merenje
                </button>
              </form>
            </div>
          )}

          {measurements.length === 0 ? (
            <p style={{ 
              color: "var(--brand-text-light)",
              fontSize: 14,
              textAlign: "center",
              padding: "40px 0",
            }}>
              Nema unetih merenja. Kliknite na "Dodaj merenje" da započnete.
            </p>
          ) : (
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{
                width: "100%",
                minWidth: isMobile ? 600 : "auto",
                borderCollapse: "collapse",
                fontSize: isMobile ? 13 : 14,
              }}>
                <thead>
                  <tr style={{
                    background: "var(--brand-bg)",
                    borderBottom: "2px solid var(--brand-border)",
                  }}>
                    <th style={{
                      padding: "12px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "var(--brand-text)",
                    }}>Datum</th>
                    <th style={{
                      padding: "12px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "var(--brand-text)",
                    }}>Kilaža</th>
                    <th style={{
                      padding: "12px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "var(--brand-text)",
                    }}>Promena</th>
                    <th style={{
                      padding: "12px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "var(--brand-text)",
                    }}>Obim struka</th>
                    <th style={{
                      padding: "12px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "var(--brand-text)",
                    }}>Promena obima</th>
                    <th style={{
                      padding: "12px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "var(--brand-text)",
                    }}>Komentar</th>
                    <th style={{
                      padding: "12px",
                      textAlign: "center",
                      fontWeight: 600,
                      color: "var(--brand-text)",
                      width: 80,
                    }}>Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {measurements.map((m) => (
                    <tr key={m.id} style={{
                      borderBottom: "1px solid var(--brand-border)",
                    }}>
                      <td style={{ padding: "12px", color: "var(--brand-text)" }}>
                        {new Date(m.datum).toLocaleDateString('sr-RS')}
                      </td>
                      <td style={{ padding: "12px", color: "var(--brand-text)", fontWeight: 500 }}>
                        {m.kilaza} kg
                      </td>
                      <td style={{ 
                        padding: "12px", 
                        color: m.promena === null ? "var(--brand-text-light)" : (m.promena >= 0 ? "var(--brand-success)" : "var(--brand-error)"),
                        fontWeight: 500,
                      }}>
                        {m.promena === null ? "-" : (m.promena >= 0 ? `+${m.promena.toFixed(1)}` : m.promena.toFixed(1))} kg
                      </td>
                      <td style={{ padding: "12px", color: "var(--brand-text)", fontWeight: 500 }}>
                        {m.obimStruka ? `${m.obimStruka} cm` : "-"}
                      </td>
                      <td style={{ 
                        padding: "12px", 
                        color: m.promenaObimStruka === null ? "var(--brand-text-light)" : (m.promenaObimStruka <= 0 ? "var(--brand-success)" : "var(--brand-error)"),
                        fontWeight: 500,
                      }}>
                        {m.promenaObimStruka === null ? "-" : (m.promenaObimStruka <= 0 ? `${m.promenaObimStruka.toFixed(1)}` : `+${m.promenaObimStruka.toFixed(1)}`)} cm
                      </td>
                      <td style={{ padding: "12px", color: "var(--brand-text-light)", maxWidth: 300 }}>
                        {m.komentar || "-"}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <button
                          onClick={() => deleteMeasurement(m.id)}
                          style={{
                            padding: "6px 12px",
                            background: "var(--brand-error)",
                            color: "white",
                            border: 0,
              borderRadius: 5,
              fontWeight: 500,
              cursor: "pointer",
              fontSize: 12,
              transition: "all 0.3s ease",
                          }}
                          onMouseEnter={(e) => e.target.style.background = "#dc2626"}
                          onMouseLeave={(e) => e.target.style.background = "var(--brand-error)"}
                        >
                          Obriši
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {measurements.length > 0 && (
            <div style={{ marginTop: 40 }}>
              <h3 style={{
                marginTop: 0,
                marginBottom: 8,
                fontSize: 20,
                fontWeight: 600,
                color: "var(--brand-primary)",
                letterSpacing: "-0.2px",
              }}>
                Grafik kilaže kroz vreme
              </h3>
              {(me?.ime || me?.prezime) && (
                <p style={{
                  margin: "0 0 24px 0",
                  color: "var(--brand-text-light)",
                  fontSize: 15,
                  fontStyle: "italic",
                }}>
                  {me.ime} {me.prezime}
                </p>
              )}
              <div 
                ref={chartRef}
                style={{
                  background: "var(--brand-bg-light)",
                  padding: isMobile ? 16 : 24,
                  borderRadius: 12,
                  border: "1px solid var(--brand-border)",
                }}
              >
                {/* Header sa logom i imenom/prezimenom za eksport */}
                <div style={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  justifyContent: "space-between",
                  alignItems: isMobile ? "flex-start" : "center",
                  gap: isMobile ? 12 : 0,
                  marginBottom: 20,
                  paddingBottom: 16,
                  borderBottom: "2px solid var(--brand-border)",
                }}>
                  <div>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 8,
                    }}>
                      <img 
                        src="/logo.svg" 
                        alt="BioZen Logo" 
                        style={{ 
                          height: isMobile ? 32 : 40,
                          display: "block",
                        }}
                        onError={(e) => {
                          e.target.style.display = "none";
                          const logoText = e.target.nextElementSibling;
                          if (logoText) logoText.style.display = "block";
                        }}
                      />
                      <div 
                        style={{
                          fontSize: isMobile ? 20 : 24,
                          fontWeight: 700,
                          color: "var(--brand-primary)",
                          letterSpacing: "-0.5px",
                          display: "none",
                        }}
                        className="logo-text-fallback"
                      >
                        BioZen
                      </div>
                    </div>
                    {(me?.ime || me?.prezime) && (
                      <p style={{
                        margin: 0,
                        color: "var(--brand-text)",
                        fontSize: isMobile ? 14 : 16,
                        fontWeight: 500,
                      }}>
                        {me.ime} {me.prezime}
                      </p>
                    )}
                  </div>
                  <div style={{
                    textAlign: isMobile ? "left" : "right",
                  }}>
                    <p style={{
                      margin: 0,
                      color: "var(--brand-text-light)",
                      fontSize: isMobile ? 13 : 14,
                    }}>
                      Grafik kilaže kroz vreme
                    </p>
                    <p style={{
                      margin: "4px 0 0 0",
                      color: "var(--brand-text-light)",
                      fontSize: isMobile ? 11 : 12,
                    }}>
                      {new Date().toLocaleDateString('sr-RS', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div style={{ height: isMobile ? 300 : 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--brand-border)" />
                    <XAxis 
                      dataKey="datum" 
                      stroke="var(--brand-text-light)"
                      style={{ fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="var(--brand-text-light)"
                      style={{ fontSize: 12 }}
                      domain={[domainMin, domainMax]}
                      label={{ 
                        value: 'Kilaža (kg)', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { textAnchor: 'middle', fill: 'var(--brand-text)' }
                      }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'var(--brand-bg-light)',
                        border: '1px solid var(--brand-border)',
                        borderRadius: '6px',
                        color: 'var(--brand-text)',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                      formatter={(value) => [`${Number(value).toFixed(1)} kg`, 'Kilaža']}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0] && payload[0].payload && payload[0].payload.dateObj) {
                          return `Datum: ${payload[0].payload.dateObj.toLocaleDateString('sr-RS', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })}`;
                        }
                        return `Datum: ${label}`;
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ color: 'var(--brand-text)' }}
                    />
                    {me?.kilaza && parseFloat(me.kilaza) > 0 && (
                      <ReferenceLine 
                        y={parseFloat(me.kilaza)} 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                    )}
                    {me?.zeljenaKilaza && parseFloat(me.zeljenaKilaza) > 0 && (
                      <ReferenceLine 
                        y={parseFloat(me.zeljenaKilaza)} 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        strokeDasharray="6 3"
                      />
                    )}
                    <Line 
                      type="monotone" 
                      dataKey="kilaza" 
                      stroke="url(#colorGradient)"
                      strokeWidth={3}
                      dot={{ fill: '#416539', r: 5, stroke: '#fff', strokeWidth: 2 }}
                      activeDot={{ r: 7, fill: '#6b8e4f', stroke: '#fff', strokeWidth: 2 }}
                      name="Kilaža"
                    />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#416539" />
                        <stop offset="100%" stopColor="#6b8e4f" />
                      </linearGradient>
                    </defs>
                  </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Progress bar za kilograme */}
              {me?.kilaza && me?.zeljenaKilaza && parseFloat(me.kilaza) > 0 && parseFloat(me.zeljenaKilaza) > 0 && (
                <div style={{ 
                  marginTop: 24,
                  padding: 20,
                  background: "var(--brand-bg-light)",
                  borderRadius: 12,
                  border: "1px solid var(--brand-border)",
                }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}>
                    <span style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--brand-text)",
                    }}>
                      Napredak ka cilju
                    </span>
                    <span style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--brand-text-light)",
                    }}>
                      {(() => {
                        const pocetna = parseFloat(me.kilaza);
                        const zeljena = parseFloat(me.zeljenaKilaza);
                        const trenutna = measurements.length > 0 ? parseFloat(measurements[0].kilaza) : pocetna;
                        const razlika = Math.abs(pocetna - zeljena);
                        const napredak = razlika > 0 ? Math.abs(pocetna - trenutna) : 0;
                        const procenat = razlika > 0 ? Math.min(100, (napredak / razlika) * 100) : 0;
                        return `${procenat.toFixed(1)}%`;
                      })()}
                    </span>
                  </div>
                  <div style={{
                    width: "100%",
                    height: 24,
                    background: "var(--brand-bg)",
                    borderRadius: 12,
                    overflow: "hidden",
                    border: "1px solid var(--brand-border)",
                    position: "relative",
                  }}>
                    <div style={{
                      height: "100%",
                      width: `${(() => {
                        const pocetna = parseFloat(me.kilaza);
                        const zeljena = parseFloat(me.zeljenaKilaza);
                        const trenutna = measurements.length > 0 ? parseFloat(measurements[0].kilaza) : pocetna;
                        const razlika = Math.abs(pocetna - zeljena);
                        const napredak = razlika > 0 ? Math.abs(pocetna - trenutna) : 0;
                        const procenat = razlika > 0 ? Math.min(100, (napredak / razlika) * 100) : 0;
                        return procenat;
                      })()}%`,
                      background: "var(--brand-gradient)",
                      borderRadius: 12,
                      transition: "width 0.5s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      paddingRight: 8,
                    }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#fff",
                        textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                      }}>
                        {(() => {
                          const pocetna = parseFloat(me.kilaza);
                          const zeljena = parseFloat(me.zeljenaKilaza);
                          const trenutna = measurements.length > 0 ? parseFloat(measurements[0].kilaza) : pocetna;
                          const razlika = Math.abs(pocetna - zeljena);
                          const napredak = razlika > 0 ? Math.abs(pocetna - trenutna) : 0;
                          const procenat = razlika > 0 ? Math.min(100, (napredak / razlika) * 100) : 0;
                          return procenat > 10 ? `${procenat.toFixed(0)}%` : "";
                        })()}
                      </span>
                    </div>
                  </div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 8,
                    fontSize: 12,
                    color: "var(--brand-text-light)",
                  }}>
                    <span>
                      Početna: {parseFloat(me.kilaza).toFixed(1)} kg
                    </span>
                    <span>
                      Cilj: {parseFloat(me.zeljenaKilaza).toFixed(1)} kg
                    </span>
                    <span>
                      Trenutna: {measurements.length > 0 ? parseFloat(measurements[0].kilaza).toFixed(1) : parseFloat(me.kilaza).toFixed(1)} kg
                    </span>
                  </div>
                </div>
              )}

              <div style={{ marginTop: 20, textAlign: "center" }}>
                <button
                  onClick={saveChartAsImage}
                  style={{
                    padding: "12px 24px",
                    background: "var(--brand-gradient)",
                    color: "white",
                    border: 0,
                    borderRadius: 6,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: 15,
                    transition: "all 0.3s ease",
                    boxShadow: "0 3px 8px rgba(65, 101, 57, 0.25)",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 5px 12px rgba(65, 101, 57, 0.35)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 3px 8px rgba(65, 101, 57, 0.25)";
                  }}
                >
                  Sačuvaj kao sliku
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "podaci" && (
        <div
          style={{
            border: "1px solid var(--brand-border)",
            borderRadius: 10,
            padding: 35,
            background: "var(--brand-bg-light)",
            boxShadow: "0 2px 8px rgba(65, 101, 57, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)",
          }}
        >
          <h2 style={{ 
            marginTop: 0,
            marginBottom: 24,
              fontSize: 24,
              fontWeight: 600,
              color: "var(--brand-primary)",
              letterSpacing: "-0.3px",
            }}>Moji podaci</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ 
                display: "block", 
                marginBottom: 8, 
                fontWeight: 600,
                color: "var(--brand-text)",
                fontSize: 13,
              }}>
                Ime
              </label>
              <input
                type="text"
                value={formData.ime}
                onChange={(e) => setFormData({ ...formData, ime: e.target.value })}
                style={{ 
                  width: "100%", 
                  padding: 12, 
              borderRadius: 6,
              border: "1px solid var(--brand-border)",
              boxSizing: "border-box",
              fontSize: 15,
              transition: "all 0.2s",
              background: "var(--brand-bg-light)",
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--brand-primary)"}
                onBlur={(e) => e.target.style.borderColor = "var(--brand-border)"}
                placeholder="Unesite ime"
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ 
                display: "block", 
                marginBottom: 8, 
                fontWeight: 600,
                color: "var(--brand-text)",
                fontSize: 13,
              }}>
                Prezime
              </label>
              <input
                type="text"
                value={formData.prezime}
                onChange={(e) => setFormData({ ...formData, prezime: e.target.value })}
                style={{ 
                  width: "100%", 
                  padding: 12, 
              borderRadius: 6,
              border: "1px solid var(--brand-border)",
              boxSizing: "border-box",
              fontSize: 15,
              transition: "all 0.2s",
              background: "var(--brand-bg-light)",
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--brand-primary)"}
                onBlur={(e) => e.target.style.borderColor = "var(--brand-border)"}
                placeholder="Unesite prezime"
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ 
                display: "block", 
                marginBottom: 8, 
                fontWeight: 600,
                color: "var(--brand-text)",
                fontSize: 13,
              }}>
                Pol
              </label>
              <select
                value={formData.pol}
                onChange={(e) => setFormData({ ...formData, pol: e.target.value })}
                style={{ 
                  width: "100%", 
                  padding: 12, 
              borderRadius: 6,
              border: "1px solid var(--brand-border)",
              boxSizing: "border-box",
              fontSize: 15,
              transition: "all 0.2s",
                  background: "var(--brand-bg-light)",
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--brand-primary)"}
                onBlur={(e) => e.target.style.borderColor = "var(--brand-border)"}
              >
                <option value="">Izaberite pol</option>
                <option value="M">Muški</option>
                <option value="Ž">Ženski</option>
                <option value="Drugo">Drugo</option>
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ 
                display: "block", 
                marginBottom: 8, 
                fontWeight: 600,
                color: "var(--brand-text)",
                fontSize: 13,
              }}>
                Starost
              </label>
              <input
                type="number"
                value={formData.starost}
                onChange={(e) => setFormData({ ...formData, starost: e.target.value })}
                style={{ 
                  width: "100%", 
                  padding: 12, 
              borderRadius: 6,
              border: "1px solid var(--brand-border)",
              boxSizing: "border-box",
              fontSize: 15,
              transition: "all 0.2s",
              background: "var(--brand-bg-light)",
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--brand-primary)"}
                onBlur={(e) => e.target.style.borderColor = "var(--brand-border)"}
                placeholder="Unesite starost"
                min="1"
                max="150"
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ 
                display: "block", 
                marginBottom: 8, 
                fontWeight: 600,
                color: "var(--brand-text)",
                fontSize: 13,
              }}>
                Kilaža (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.kilaza}
                onChange={(e) => setFormData({ ...formData, kilaza: e.target.value })}
                style={{ 
                  width: "100%", 
                  padding: 12, 
              borderRadius: 6,
              border: "1px solid var(--brand-border)",
              boxSizing: "border-box",
              fontSize: 15,
              transition: "all 0.2s",
              background: "var(--brand-bg-light)",
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--brand-primary)"}
                onBlur={(e) => e.target.style.borderColor = "var(--brand-border)"}
                placeholder="Unesite trenutnu kilažu"
                min="0"
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ 
                display: "block", 
                marginBottom: 8, 
                fontWeight: 600,
                color: "var(--brand-text)",
                fontSize: 13,
              }}>
                Željena kilaža (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.zeljenaKilaza}
                onChange={(e) => setFormData({ ...formData, zeljenaKilaza: e.target.value })}
                style={{ 
                  width: "100%", 
                  padding: 12, 
              borderRadius: 6,
              border: "1px solid var(--brand-border)",
              boxSizing: "border-box",
              fontSize: 15,
              transition: "all 0.2s",
              background: "var(--brand-bg-light)",
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--brand-primary)"}
                onBlur={(e) => e.target.style.borderColor = "var(--brand-border)"}
                placeholder="Unesite željenu kilažu"
                min="0"
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ 
                display: "block", 
                marginBottom: 8, 
                fontWeight: 600,
                color: "var(--brand-text)",
                fontSize: 13,
              }}>
                Obim struka (cm)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.obimStruka}
                onChange={(e) => setFormData({ ...formData, obimStruka: e.target.value })}
                style={{ 
                  width: "100%", 
                  padding: 12, 
              borderRadius: 6,
              border: "1px solid var(--brand-border)",
              boxSizing: "border-box",
              fontSize: 15,
              transition: "all 0.2s",
              background: "var(--brand-bg-light)",
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--brand-primary)"}
                onBlur={(e) => e.target.style.borderColor = "var(--brand-border)"}
                placeholder="Unesite obim struka"
                min="0"
              />
            </div>

            <button
              type="submit"
              style={{
                width: "100%",
                padding: 14,
                background: "var(--brand-gradient)",
                color: "white",
                border: 0,
                borderRadius: 8,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 16,
                transition: "transform 0.2s, box-shadow 0.2s",
                boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 5px 12px rgba(65, 101, 57, 0.35)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 3px 8px rgba(65, 101, 57, 0.25)";
              }}
            >
              Sačuvaj podatke
            </button>
          </form>
        </div>
      )}

      {activeTab === "saveti" && (
        <div
          style={{
            border: "1px solid var(--brand-border)",
            borderRadius: 10,
            padding: isMobile ? 20 : 35,
            background: "var(--brand-bg-light)",
            boxShadow: "0 2px 8px rgba(65, 101, 57, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)",
          }}
        >
          <h2 style={{ 
            marginTop: 0,
            marginBottom: 32,
            fontSize: isMobile ? 20 : 24,
            fontWeight: 600,
            color: "var(--brand-primary)",
            letterSpacing: "-0.3px",
          }}>Saveti za skidanje kilograma</h2>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: isMobile ? 24 : 32,
          }}>
            {[
              { icon: "🍎", title: "Balansirana ishrana", desc: "Jedite raznovrsnu, prirodnu hranu sa dovoljno voća, povrća i proteina" },
              { icon: "💧", title: "Dovoljno tečnosti", desc: "Pijte najmanje 2-3 litra tečnosti dnevno. BioZen čaj je odličan izbor za hidrataciju i podršku metabolizmu" },
              { icon: "🏃", title: "Redovna aktivnost", desc: "Barem 30 minuta umerene fizičke aktivnosti dnevno ubrzava metabolizam" },
              { icon: "😴", title: "Kvalitetan san", desc: "7-8 sati sna dnevno je ključno za zdrav metabolizam i kontrolu apetita" },
              { icon: "🧘", title: "Smanjenje stresa", desc: "Stres povećava kortizol koji otežava mršavljenje - vežbajte relaksaciju" },
              { icon: "📊", title: "Praćenje napretka", desc: "Redovno merenje kilaže i beleženje pomaze da vidite napredak i ostanete motivisani" },
              { icon: "⏰", title: "Redovnost i konzistentnost", desc: "Važnije je održavati zdrave navike dugoročno nego brzo gubiti kilograme" },
              { icon: "👥", title: "Podrška okoline", desc: "Okružite se ljudima koji vas podržavaju u vašem cilju mršavljenja" },
              { icon: "🎯", title: "Realni ciljevi", desc: "Postavite postepene, ostvarive ciljeve umesto nerealnih očekivanja" },
            ].map((savet, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  padding: isMobile ? 20 : 24,
                  background: "var(--brand-bg)",
                  borderRadius: 12,
                  border: "1px solid var(--brand-border)",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(65, 101, 57, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{
                  width: isMobile ? 64 : 80,
                  height: isMobile ? 64 : 80,
                  background: "var(--brand-gradient)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                  fontSize: isMobile ? 36 : 44,
                }}>
                  {savet.icon}
                </div>
                <h3 style={{
                  margin: "0 0 8px 0",
                  color: "var(--brand-primary)",
                  fontSize: isMobile ? 16 : 18,
                  fontWeight: 600,
                }}>
                  {savet.title}
                </h3>
                <p style={{
                  margin: 0,
                  color: "var(--brand-text)",
                  fontSize: isMobile ? 13 : 14,
                  fontWeight: 400,
                  lineHeight: 1.6,
                }}>
                  {savet.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "blogovi" && (
        <div
          style={{
            border: "1px solid var(--brand-border)",
            borderRadius: 10,
            padding: isMobile ? 20 : 35,
            background: "var(--brand-bg-light)",
            boxShadow: "0 2px 8px rgba(65, 101, 57, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)",
          }}
        >
          <h2 style={{ 
            marginTop: 0,
            marginBottom: 24,
            fontSize: isMobile ? 20 : 24,
            fontWeight: 600,
            color: "var(--brand-primary)",
            letterSpacing: "-0.3px",
          }}>Blogovi</h2>
          
          {loadingBlogs ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--brand-text-light)" }}>
              Učitavanje...
            </div>
          ) : selectedBlog ? (
            <div>
              <button
                onClick={() => setSelectedBlog(null)}
                style={{
                  marginBottom: 20,
                  padding: "10px 20px",
                  background: "var(--brand-border)",
                  color: "var(--brand-text)",
                  border: 0,
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                ← Nazad na blogove
              </button>
              <article style={{
                background: "#fff",
                borderRadius: 12,
                padding: isMobile ? 20 : 30,
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}>
                {selectedBlog.featuredImage && (
                  <img
                    src={selectedBlog.featuredImage}
                    alt={selectedBlog.title}
                    style={{
                      width: "100%",
                      maxHeight: 400,
                      objectFit: "cover",
                      borderRadius: 8,
                      marginBottom: 24,
                    }}
                  />
                )}
                <h1 style={{
                  margin: "0 0 16px 0",
                  fontSize: isMobile ? 24 : 32,
                  fontWeight: 700,
                  color: "var(--brand-text)",
                  lineHeight: 1.3,
                }}>
                  {selectedBlog.title}
                </h1>
                {selectedBlog.excerpt && (
                  <p style={{
                    margin: "0 0 24px 0",
                    fontSize: 18,
                    color: "var(--brand-text-light)",
                    fontStyle: "italic",
                    lineHeight: 1.6,
                  }}>
                    {selectedBlog.excerpt}
                  </p>
                )}
                <div
                  dangerouslySetInnerHTML={{ __html: selectedBlog.content }}
                  style={{
                    fontSize: 16,
                    lineHeight: 1.8,
                    color: "var(--brand-text)",
                  }}
                />
                {selectedBlog.publishedAt && (
                  <div style={{
                    marginTop: 32,
                    paddingTop: 20,
                    borderTop: "1px solid var(--brand-border)",
                    fontSize: 13,
                    color: "var(--brand-text-light)",
                  }}>
                    Objavljeno: {new Date(selectedBlog.publishedAt).toLocaleDateString('sr-RS', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                )}
              </article>
            </div>
          ) : !blogs || blogs.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--brand-text-light)" }}>
              Trenutno nema objavljenih blogova
              <div style={{ marginTop: 10, fontSize: 12 }}>
                (blogs.length: {blogs?.length || 0})
              </div>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
              gap: 24,
            }}>
              {blogs && Array.isArray(blogs) && blogs.map((blog) => (
                <div
                  key={blog.id}
                  onClick={() => setSelectedBlog(blog)}
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    overflow: "hidden",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                  }}
                >
                  {blog.featuredImage && (
                    <img
                      src={blog.featuredImage}
                      alt={blog.title}
                      style={{
                        width: "100%",
                        height: 200,
                        objectFit: "cover",
                      }}
                    />
                  )}
                  <div style={{ padding: 20 }}>
                    <h3 style={{
                      margin: "0 0 12px 0",
                      fontSize: isMobile ? 18 : 20,
                      fontWeight: 600,
                      color: "var(--brand-text)",
                      lineHeight: 1.3,
                    }}>
                      {blog.title}
                    </h3>
                    {blog.excerpt && (
                      <p style={{
                        margin: "0 0 16px 0",
                        fontSize: 13,
                        color: "var(--brand-text-light)",
                        lineHeight: 1.6,
                      }}>
                        {blog.excerpt}
                      </p>
                    )}
                    {blog.publishedAt && (
                      <div style={{
                        fontSize: 12,
                        color: "var(--brand-text-light)",
                      }}>
                        {new Date(blog.publishedAt).toLocaleDateString('sr-RS', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "chat" && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          height: isMobile ? "calc(100vh - 120px)" : "calc(100vh - 180px)",
          border: "1px solid var(--brand-border)",
          borderRadius: 10,
          background: "var(--brand-bg-light)",
          boxShadow: "0 2px 8px rgba(65, 101, 57, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)",
          overflow: "hidden",
        }}>
          {/* Chat Header */}
          <div style={{
            padding: isMobile ? "16px" : "20px",
            borderBottom: "1px solid var(--brand-border)",
            background: "var(--brand-gradient)",
            color: "white",
          }}>
            <h2 style={{
              margin: 0,
              fontSize: isMobile ? 18 : 20,
              fontWeight: 600,
            }}>
              💬 BioZen AI Asistent
            </h2>
            <p style={{
              margin: "4px 0 0 0",
              fontSize: 13,
              opacity: 0.9,
            }}>
              Pitanja o zdravlju, ishrani i mršavljenju
            </p>
          </div>

          {/* Chat Messages */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: isMobile ? "16px" : "20px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}>
            {chatMessages.length === 0 ? (
              <div style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: isMobile ? "20px" : "40px",
              }}>
                <div style={{
                  maxWidth: 500,
                  textAlign: "center",
                  background: "var(--brand-bg)",
                  padding: isMobile ? "24px" : "32px",
                  borderRadius: 16,
                  border: "1px solid var(--brand-border)",
                }}>
                  <div style={{
                    fontSize: isMobile ? 20 : 24,
                    fontWeight: 600,
                    color: "var(--brand-primary)",
                    marginBottom: 12,
                  }}>
                    👋 Zdravo!
                  </div>
                  <p style={{
                    fontSize: isMobile ? 15 : 16,
                    color: "var(--brand-text)",
                    marginBottom: 20,
                    lineHeight: 1.6,
                  }}>
                    Ja sam BioZen AI asistent. Mogu da ti pomognem sa:
                  </p>
                  <div style={{
                    textAlign: "left",
                    marginBottom: 20,
                    padding: isMobile ? "16px" : "20px",
                    background: "var(--brand-bg-light)",
                    borderRadius: 12,
                    border: "1px solid var(--brand-border)",
                  }}>
                    <div style={{
                      fontSize: isMobile ? 14 : 15,
                      color: "var(--brand-text)",
                      lineHeight: 1.8,
                    }}>
                      <div style={{ marginBottom: 8 }}>✅ <strong>Ishrana</strong> - saveti o zdravoj ishrani i planiranju obroka</div>
                      <div style={{ marginBottom: 8 }}>✅ <strong>Vežbanje</strong> - preporuke za fizičku aktivnost</div>
                      <div style={{ marginBottom: 8 }}>✅ <strong>Mršavljenje</strong> - strategije za postizanje ciljne kilaže</div>
                      <div style={{ marginBottom: 8 }}>✅ <strong>Zdravlje</strong> - opšti saveti za zdrav način života</div>
                      <div style={{ marginBottom: 8 }}>✅ <strong>Motivacija</strong> - podrška i motivacija za postizanje ciljeva</div>
                    </div>
                  </div>
                  <p style={{
                    fontSize: isMobile ? 13 : 14,
                    color: "var(--brand-text-light)",
                    fontStyle: "italic",
                    lineHeight: 1.6,
                  }}>
                    💡 <strong>Napomena:</strong> Ne dajem medicinske savete. Za teška medicinska stanja, decu ili trudnice, molimo konsultujte se sa lekarom.
                  </p>
                </div>
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                    marginBottom: 8,
                  }}
                >
                  <div style={{
                    maxWidth: "80%",
                    padding: isMobile ? "12px 16px" : "14px 18px",
                    borderRadius: 16,
                    background: msg.role === "user" 
                      ? "var(--brand-gradient)" 
                      : "var(--brand-bg)",
                    color: msg.role === "user" ? "white" : "var(--brand-text)",
                    border: msg.role === "assistant" ? "1px solid var(--brand-border)" : "none",
                    fontSize: isMobile ? 14 : 15,
                    lineHeight: 1.5,
                    wordWrap: "break-word",
                  }}>
                    {msg.message}
                  </div>
                </div>
              ))
            )}
            {sendingMessage && (
              <div style={{
                display: "flex",
                justifyContent: "flex-start",
              }}>
                <div style={{
                  padding: isMobile ? "12px 16px" : "14px 18px",
                  borderRadius: 16,
                  background: "var(--brand-bg)",
                  border: "1px solid var(--brand-border)",
                  fontSize: 14,
                  color: "var(--brand-text-light)",
                }}>
                  <span style={{ marginRight: 8 }}>⏳</span>
                  AI razmišlja...
                </div>
              </div>
            )}
            <div ref={chatMessagesEndRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={sendChatMessage} style={{
            padding: isMobile ? "12px" : "16px",
            borderTop: "1px solid var(--brand-border)",
            background: "var(--brand-bg-light)",
            display: "flex",
            gap: 8,
          }}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Unesite poruku..."
              disabled={sendingMessage}
              style={{
                flex: 1,
                padding: isMobile ? "12px 16px" : "14px 18px",
                border: "1px solid var(--brand-border)",
                borderRadius: 24,
                fontSize: isMobile ? 14 : 15,
                background: "var(--brand-bg)",
                color: "var(--brand-text)",
                outline: "none",
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--brand-primary)"}
              onBlur={(e) => e.target.style.borderColor = "var(--brand-border)"}
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || sendingMessage}
              style={{
                padding: isMobile ? "12px 20px" : "14px 24px",
                background: chatInput.trim() && !sendingMessage 
                  ? "var(--brand-gradient)" 
                  : "var(--brand-border)",
                color: chatInput.trim() && !sendingMessage ? "white" : "var(--brand-text-light)",
                border: 0,
                borderRadius: 24,
                fontWeight: 600,
                cursor: chatInput.trim() && !sendingMessage ? "pointer" : "not-allowed",
                fontSize: isMobile ? 14 : 15,
                transition: "all 0.2s",
              }}
            >
              {sendingMessage ? "⏳" : "➤"}
            </button>
          </form>
        </div>
      )}

      {activeTab === "shop" && (
        <div
          style={{
            border: "1px solid var(--brand-border)",
            borderRadius: 10,
            padding: isMobile ? 20 : 35,
            background: "var(--brand-bg-light)",
            boxShadow: "0 2px 8px rgba(65, 101, 57, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)",
            textAlign: "center",
          }}
        >
          <h2 style={{ 
            marginTop: 0,
            marginBottom: 16,
            fontSize: isMobile ? 20 : 24,
            fontWeight: 600,
            color: "var(--brand-primary)",
            letterSpacing: "-0.3px",
          }}>BioZen Shop</h2>
          
          <p style={{
            marginBottom: 32,
            color: "var(--brand-text-light)",
            fontSize: isMobile ? 15 : 16,
            lineHeight: 1.6,
          }}>
            Otkrijte našu ponudu proizvoda za zdrav način života i mršavljenje
          </p>

          <a
            href="https://cajzamrsavljenje.rs/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              padding: isMobile ? "14px 28px" : "16px 32px",
              background: "var(--brand-gradient)",
              color: "white",
              textDecoration: "none",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: isMobile ? 15 : 16,
              transition: "all 0.3s ease",
              boxShadow: "0 3px 8px rgba(65, 101, 57, 0.25)",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 5px 12px rgba(65, 101, 57, 0.35)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 3px 8px rgba(65, 101, 57, 0.25)";
            }}
          >
            Posetite naš shop →
          </a>
        </div>
      )}


      {/* PWA Install Button */}
      {showInstallButton && isMobile && !isStandalone && (
        <div style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: isMobile ? "20px 16px 16px 16px" : "24px 20px 20px 20px",
          background: "var(--brand-bg-light)",
          borderTop: "2px solid var(--brand-border)",
          boxShadow: "0 -4px 12px rgba(65, 101, 57, 0.15)",
          zIndex: 1000,
          borderRadius: "16px 16px 0 0",
        }}>
          {/* Close button */}
          <button
            onClick={() => setShowInstallButton(false)}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: "transparent",
              border: 0,
              fontSize: 20,
              cursor: "pointer",
              color: "var(--brand-text-light)",
              padding: "4px 8px",
              borderRadius: 4,
              transition: "all 0.2s",
              lineHeight: 1,
            }}
            onMouseEnter={(e) => {
              e.target.style.color = "var(--brand-text)";
              e.target.style.background = "var(--brand-bg)";
            }}
            onMouseLeave={(e) => {
              e.target.style.color = "var(--brand-text-light)";
              e.target.style.background = "transparent";
            }}
            aria-label="Zatvori"
          >
            ×
          </button>

          {isIOS ? (
            <div style={{
              textAlign: "center",
              paddingRight: 32,
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginBottom: 12,
              }}>
                <span style={{ fontSize: 24 }}>📱</span>
                <h3 style={{
                  margin: 0,
                  color: "var(--brand-primary)",
                  fontSize: 16,
                  fontWeight: 600,
                }}>
                  Instaliraj BioZen app
                </h3>
              </div>
              <p style={{
                margin: "0 0 16px 0",
                color: "var(--brand-text)",
                fontSize: 13,
                lineHeight: 1.5,
              }}>
                Dodaj aplikaciju na home screen za brži pristup
              </p>
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                alignItems: "center",
                background: "var(--brand-bg)",
                padding: 12,
                borderRadius: 8,
                border: "1px solid var(--brand-border)",
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "var(--brand-text)",
                  fontSize: 13,
                }}>
                  <span style={{
                    background: "var(--brand-gradient)",
                    color: "white",
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 12,
                  }}>1</span>
                  <span>Klikni na</span>
                  <span style={{
                    background: "var(--brand-primary)",
                    color: "white",
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontWeight: 600,
                    fontSize: 12,
                  }}>Share</span>
                  <span style={{ fontSize: 18 }}>📤</span>
                </div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "var(--brand-text)",
                  fontSize: 13,
                }}>
                  <span style={{
                    background: "var(--brand-gradient)",
                    color: "white",
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 12,
                  }}>2</span>
                  <span>Izaberi</span>
                  <span style={{
                    background: "var(--brand-primary)",
                    color: "white",
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontWeight: 600,
                    fontSize: 12,
                  }}>Add to Home Screen</span>
                  <span style={{ fontSize: 18 }}>➕</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ paddingRight: 32 }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}>
                <span style={{ fontSize: 24 }}>📱</span>
                <h3 style={{
                  margin: 0,
                  color: "var(--brand-primary)",
                  fontSize: 16,
                  fontWeight: 600,
                }}>
                  Instaliraj BioZen app
                </h3>
              </div>
              <button
                onClick={handleInstallClick}
                style={{
                  width: "100%",
                  padding: isMobile ? "14px 20px" : "16px 24px",
                  background: "var(--brand-gradient)",
                  color: "white",
                  border: 0,
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: isMobile ? 15 : 16,
                  transition: "all 0.3s ease",
                  boxShadow: "0 3px 8px rgba(65, 101, 57, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 5px 12px rgba(65, 101, 57, 0.35)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 3px 8px rgba(65, 101, 57, 0.25)";
                }}
              >
                <span>Instaliraj</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer - vidljiv na svim tabovima */}
      <footer style={{
        marginTop: "auto",
        paddingTop: isMobile ? 30 : 40,
        paddingBottom: isMobile ? 20 : 30,
        borderTop: "1px solid var(--brand-border)",
        textAlign: "center",
        width: "100%",
      }}>
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: isMobile ? 20 : 30,
          flexWrap: "wrap",
          fontSize: isMobile ? 13 : 14,
          color: "var(--brand-text-light)",
          marginBottom: isMobile ? 12 : 16,
        }}>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setShowTermsModal(true);
            }}
            style={{
              color: "var(--brand-text-light)",
              textDecoration: "none",
              transition: "color 0.2s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => e.target.style.color = "var(--brand-primary)"}
            onMouseLeave={(e) => e.target.style.color = "var(--brand-text-light)"}
          >
            Uslovi korišćenja
          </a>
          <span style={{ color: "var(--brand-border)" }}>|</span>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setShowPrivacyModal(true);
            }}
            style={{
              color: "var(--brand-text-light)",
              textDecoration: "none",
              transition: "color 0.2s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => e.target.style.color = "var(--brand-primary)"}
            onMouseLeave={(e) => e.target.style.color = "var(--brand-text-light)"}
          >
            Politika privatnosti
          </a>
        </div>
        <div style={{
          fontSize: isMobile ? 11 : 12,
          color: "var(--brand-text-light)",
          opacity: 0.7,
        }}>
          © {new Date().getFullYear()} BioZen. Sva prava zadržana.
        </div>
      </footer>

      {/* Terms of Service Modal */}
      {showTermsModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
          padding: isMobile ? "10px" : "20px",
        }}
        onClick={() => setShowTermsModal(false)}
        >
          <div style={{
            background: "#fff",
            borderRadius: 12,
            padding: isMobile ? 20 : 35,
            maxWidth: 800,
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}>
              <h2 style={{ 
                margin: 0,
                fontSize: isMobile ? 20 : 24,
                fontWeight: 600,
                color: "var(--brand-primary)",
                letterSpacing: "-0.3px",
              }}>Uslovi korišćenja</h2>
              <button
                onClick={() => setShowTermsModal(false)}
                style={{
                  background: "transparent",
                  border: 0,
                  fontSize: 24,
                  cursor: "pointer",
                  color: "var(--brand-text-light)",
                  padding: "4px 8px",
                  borderRadius: 4,
                  lineHeight: 1,
                }}
                onMouseEnter={(e) => e.target.style.color = "var(--brand-text)"}
                onMouseLeave={(e) => e.target.style.color = "var(--brand-text-light)"}
              >
                ×
              </button>
            </div>
            
            <div style={{
              fontSize: isMobile ? 14 : 15,
              lineHeight: 1.8,
              color: "var(--brand-text)",
            }}>
              <p style={{ marginBottom: 20 }}>
                BioZen je aplikacija za praćenje zdravlja, kilaže i merenja koja posluje u skladu sa važećim zakonima i propisima u Republici Srbiji.
              </p>

              <p style={{ marginBottom: 20 }}>
                Aplikacija BioZen dostupna je na internet stranici <strong>www.biozen.rs</strong>. Aplikacija se može koristiti za Vašu privatnu upotrebu bez ikakvih naknada za korišćenje, a prema niže navedenim uslovima i pravilima.
              </p>

              <p style={{ marginBottom: 20 }}>
                <strong>Korišćenjem aplikacije BioZen obavezujete se da ćete poštovati niže navedene uslove i pravila i da ste sa istim saglasni.</strong>
              </p>

              <h3 style={{ 
                marginTop: 30,
                marginBottom: 16,
                fontSize: isMobile ? 18 : 20,
                fontWeight: 600,
                color: "var(--brand-primary)",
              }}>Registracija</h3>

              <p style={{ marginBottom: 20 }}>
                Korisnik snosi odgovornost za tačnost unetih podataka prilikom registracije.
              </p>

              <p style={{ marginBottom: 20, padding: 16, background: "rgba(65, 101, 57, 0.1)", borderRadius: 8, border: "1px solid var(--brand-primary)" }}>
                <strong>Važno:</strong> "BIOZEN" DOO se obavezuje da će čuvati privatnost svih registrovanih korisnika. <strong>Vaši uneti podaci (ime, prezime, kilaža, merenja, obim struka i drugi lični podaci) se ne koriste i ne pregledaju od strane naših zaposlenih ili trećih lica.</strong> Svi podaci su zaštićeni i dostupni samo Vama kroz Vaš korisnički nalog.
              </p>

              <p style={{ marginBottom: 20 }}>
                Ukoliko dođe do bilo kakve promene podataka koje ste uneli prilikom registracije, molimo Vas da blagovremeno ažurirate Vaš korisnički račun, odnosno obavestite nas o nastalim promenama putem email adrese <strong>office@biozen.rs</strong>.
              </p>

              <h3 style={{ 
                marginTop: 30,
                marginBottom: 16,
                fontSize: isMobile ? 18 : 20,
                fontWeight: 600,
                color: "var(--brand-primary)",
              }}>Korišćenje aplikacije</h3>

              <p style={{ marginBottom: 20 }}>
                Aplikacija BioZen omogućava Vam da:
              </p>
              <ul style={{ marginBottom: 20, paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>Unesete i pratite Vašu kilažu i merenja (uključujući obim struka)</li>
                <li style={{ marginBottom: 8 }}>Pratite napredak ka postizanju ciljne kilaže kroz grafikone i tabele</li>
                <li style={{ marginBottom: 8 }}>Pristupite blogovima sa savetima o zdravlju, ishrani i mršavljenju</li>
                <li style={{ marginBottom: 8 }}>Komunicirate sa AI asistentom za opšte savete o zdravlju, ishrani i mršavljenju</li>
              </ul>

              <h3 style={{ 
                marginTop: 30,
                marginBottom: 16,
                fontSize: isMobile ? 18 : 20,
                fontWeight: 600,
                color: "var(--brand-primary)",
              }}>Privatnost podataka</h3>

              <p style={{ marginBottom: 20 }}>
                U ime kompanije BIOZEN DOO obavezujemo se da ćemo čuvati privatnost svih naših korisnika. Prikupljamo samo neophodne, osnovne podatke o korisnicima i podatke neophodne za funkcionisanje aplikacije u skladu sa dobrim poslovnim običajima i u cilju pružanja kvalitetne usluge.
              </p>

              <p style={{ marginBottom: 20, padding: 16, background: "rgba(65, 101, 57, 0.1)", borderRadius: 8, border: "1px solid var(--brand-primary)" }}>
                <strong>Važno:</strong> Svi podaci o korisnicima se strogo čuvaju i <strong>nisu dostupni zaposlenima ili trećim licima za pregled ili korišćenje</strong>. Vaši lični podaci, merenja, kilaža, obim struka i ostali uneti podaci su potpuno privatni i dostupni samo Vama kroz Vaš korisnički nalog. Dajemo korisnicima mogućnost izbora uključujući mogućnost odluke da li žele ili ne da se izbrišu sa mailing lista koje se koriste za marketinške kampanje.
              </p>

              <p style={{ marginBottom: 20 }}>
                Svi zaposleni BIOZEN DOO (i poslovni partneri) odgovorni su za poštovanje načela zaštite privatnosti.
              </p>

              <h3 style={{ 
                marginTop: 30,
                marginBottom: 16,
                fontSize: isMobile ? 18 : 20,
                fontWeight: 600,
                color: "var(--brand-primary)",
              }}>Dostupnost aplikacije</h3>

              <p style={{ marginBottom: 20 }}>
                BioZen aplikacija "BIOZEN" DOO nastoji da Vam da najbolju moguću ponudu usluga, pri čemu ne može garantovati da će usluge na aplikaciji odgovarati Vašim potrebama. "BIOZEN" DOO ne može garantovati da će usluga biti bez grešaka. Ukoliko dođe do greške, molimo Vas da je prijavite našem Kontakt centru ili na email <strong>office@biozen.rs</strong> kako bismo je otklonili na najbrži mogući način.
              </p>

              <h3 style={{ 
                marginTop: 30,
                marginBottom: 16,
                fontSize: isMobile ? 18 : 20,
                fontWeight: 600,
                color: "var(--brand-primary)",
              }}>Povezane Internet stranice</h3>

              <p style={{ marginBottom: 20 }}>
                Aplikacija BioZen može uključivati linkove na druge internet stranice. Materijali na tim stranicama su izvan kontrole "BIOZEN" DOO, korisnici na njih pristupaju na vlastitu odgovornost i rizik te stoga "BIOZEN" DOO nije odgovorana za sadržaj na tim stranicama.
              </p>

              <h3 style={{ 
                marginTop: 30,
                marginBottom: 16,
                fontSize: isMobile ? 18 : 20,
                fontWeight: 600,
                color: "var(--brand-primary)",
              }}>Važenje pravila</h3>

              <p style={{ marginBottom: 20 }}>
                "BIOZEN" DOO zadržava pravo da u bilo kom trenutku, ukoliko to smatra potrebnim, ukine ili izmeni bilo koji od ovde navedenih Uslova i pravila korišćenja. Bilo kakva izmena ili ukidanje Uslova i pravila korišćenja stupiće na snagu odmah u trenutku objavljivanja istih na aplikaciji BioZen.
              </p>

              <p style={{ marginBottom: 20 }}>
                Ako aplikaciju BioZen nastavite da koristite nakon što su izmenjeni Uslovi i pravila korišćenja, smatra se da ste saglasni s novim Uslovima i pravilima korišćenja BioZen aplikacije. "BIOZEN" DOO neće biti odgovoran ni za kakve moguće posledice proizašle iz promena aplikacije.
              </p>

              <p style={{ marginBottom: 20 }}>
                Ako niste saglasni s Uslovima i pravilima korišćenja BioZen aplikacije, molimo Vas nemojte koristiti aplikaciju, a Vas molimo obratite se našem Kontakt centru ili putem emaila: <strong>office@biozen.rs</strong>, a kako bismo Vas izbrisali iz baze korisnika BioZen aplikacije.
              </p>

              <div style={{
                marginTop: 40,
                padding: 20,
                background: "var(--brand-bg)",
                borderRadius: 8,
                border: "1px solid var(--brand-border)",
                textAlign: "center",
              }}>
                <p style={{ margin: 0, fontSize: isMobile ? 13 : 14, color: "var(--brand-text-light)" }}>
                  Za dodatne informacije, kontaktirajte nas na: <strong>office@biozen.rs</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
          padding: isMobile ? "10px" : "20px",
        }}
        onClick={() => setShowPrivacyModal(false)}
        >
          <div style={{
            background: "#fff",
            borderRadius: 12,
            padding: isMobile ? 20 : 35,
            maxWidth: 800,
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}>
              <h2 style={{ 
                margin: 0,
                fontSize: isMobile ? 20 : 24,
                fontWeight: 600,
                color: "var(--brand-primary)",
                letterSpacing: "-0.3px",
              }}>Politika privatnosti</h2>
              <button
                onClick={() => setShowPrivacyModal(false)}
                style={{
                  background: "transparent",
                  border: 0,
                  fontSize: 24,
                  cursor: "pointer",
                  color: "var(--brand-text-light)",
                  padding: "4px 8px",
                  borderRadius: 4,
                  lineHeight: 1,
                }}
                onMouseEnter={(e) => e.target.style.color = "var(--brand-text)"}
                onMouseLeave={(e) => e.target.style.color = "var(--brand-text-light)"}
              >
                ×
              </button>
            </div>
            
            <div style={{
              fontSize: isMobile ? 14 : 15,
              lineHeight: 1.8,
              color: "var(--brand-text)",
            }}>
              <p style={{ marginBottom: 20 }}>
                Ovde su sadržane informacije o obradi podataka o ličnosti korisnika BioZen aplikacije za praćenje zdravlja, kilaže i merenja.
              </p>

              <h3 style={{ 
                marginTop: 30,
                marginBottom: 16,
                fontSize: isMobile ? 18 : 20,
                fontWeight: 600,
                color: "var(--brand-primary)",
              }}>I. OSNOVNE INFORMACIJE O RUKOVAOCU</h3>

              <p style={{ marginBottom: 20 }}>
                Rukovalac podacima je:
              </p>
              <p style={{ marginBottom: 20, padding: 16, background: "var(--brand-bg)", borderRadius: 8 }}>
                <strong>BIOZEN d.o.o. Beograd</strong>, sa sedištem u Beogradu – Savski Venac, ul. Kronštatska 5, matični broj: 22133462, PIB: 115251472.
              </p>

              <h3 style={{ 
                marginTop: 30,
                marginBottom: 16,
                fontSize: isMobile ? 18 : 20,
                fontWeight: 600,
                color: "var(--brand-primary)",
              }}>II. SVRHA I OSNOV PRIKUPLJANJA PODATAKA</h3>

              <p style={{ marginBottom: 20 }}>
                Podatak o ličnosti je svaki podatak koji se odnosi na fizičko lice čiji je identitet određen ili odrediv, neposredno ili posredno, posebno na osnovu oznake identiteta, kao što je ime i identifikacioni broj, podataka o lokaciji, identifikatora u elektronskim komunikacionim mrežama ili jednog, odnosno više obeležja njegovog fizičkog, fiziološkog, genetskog, mentalnog, ekonomskog, kulturnog i društvenog identiteta.
              </p>

              <p style={{ marginBottom: 20 }}>
                Obrada podataka o ličnosti je svaka radnja ili skup radnji koje se vrše automatizovano ili neautomatizovano sa podacima o ličnosti ili njihovim skupovima, kao što su prikupljanje, beleženje, razvrstavanje, grupisanje, odnosno strukturisanje, pohranjivanje, upodobljavanje ili menjanje, otkrivanje, uvid, upotreba, otkrivanje prenosom, odnosno dostavljanjem, umnožavanje, širenje ili na drugi način činjenje dostupnim, upoređivanje, ograničavanje, brisanje ili uništavanje.
              </p>

              <p style={{ marginBottom: 20, padding: 16, background: "rgba(65, 101, 57, 0.1)", borderRadius: 8, border: "1px solid var(--brand-primary)" }}>
                <strong>Važno:</strong> Obradu podataka vršimo na osnovu Vaše saglasnosti (pristanka) koja je neophodna za korišćenje aplikacije. <strong>Vaši uneti podaci (ime, prezime, kilaža, merenja, obim struka i drugi lični podaci) se ne koriste i ne pregledaju od strane naših zaposlenih ili trećih lica.</strong>
              </p>

              <p style={{ marginBottom: 20 }}>
                Pored navedenog, obrađujemo Vaše podatke o ličnosti kada je obrada neophodna u cilju izvršenja zakonom propisanih obaveza i ovlašćenja rukovaoca.
              </p>

              <h3 style={{ 
                marginTop: 30,
                marginBottom: 16,
                fontSize: isMobile ? 18 : 20,
                fontWeight: 600,
                color: "var(--brand-primary)",
              }}>III. PODACI KOJI SE PRIKUPLJAJU I OBRAĐUJU</h3>

              <h4 style={{ 
                marginTop: 20,
                marginBottom: 12,
                fontSize: isMobile ? 16 : 17,
                fontWeight: 600,
                color: "var(--brand-text)",
              }}>Korisnički nalog</h4>

              <p style={{ marginBottom: 20 }}>
                Kontakt podaci navedeni u obrascu za registraciju (ime, prezime, e-mail adresa), kao i podaci o ličnosti u obliku zdravstvenih podataka (kilaža, željena kilaža, obim struka, merenja, komentari) biće obrađeni.
              </p>

              <p style={{ marginBottom: 20 }}>
                Korisnički nalog koristi se prvenstveno za praćenje Vaših zdravstvenih podataka, praćenje napretka ka postizanju ciljne kilaže, pristup blogovima sa savetima o zdravlju i ishrani, kao i komunikaciju sa AI asistentom.
              </p>

              <p style={{ marginBottom: 20, padding: 16, background: "rgba(65, 101, 57, 0.1)", borderRadius: 8, border: "1px solid var(--brand-primary)" }}>
                <strong>Važno:</strong> Korisnik ima mogućnost da otvori nalog ili može da koristi aplikaciju bez kreiranja naloga (u ograničenom obimu). Korisnik ima mogućnost da ažurira ili dopuni podatke i odgovoran je za tačnost podataka. <strong>Svi podaci su potpuno privatni i dostupni samo Vama.</strong>
              </p>

              <p style={{ marginBottom: 20 }}>
                Navedeni podaci će se obrađivati tokom celog trajanja naloga. Ako se nalog nije aktivno koristio u poslednje 3 godine, ovi podaci o ličnosti će biti izbrisani.
              </p>

              <p style={{ marginBottom: 20 }}>
                Korisnik ima mogućnost da sam otkaže nalog ili može da kontaktira podršku putem: <strong>office@biozen.rs</strong>
              </p>

              <h3 style={{ 
                marginTop: 30,
                marginBottom: 16,
                fontSize: isMobile ? 18 : 20,
                fontWeight: 600,
                color: "var(--brand-primary)",
              }}>IV. PRAVA LICA ČIJI SE PODACI OBRAĐUJU</h3>

              <p style={{ marginBottom: 20 }}>
                Imate pravo da u svakom trenutku zatražite:
              </p>

              <ul style={{ marginBottom: 20, paddingLeft: 20 }}>
                <li style={{ marginBottom: 12 }}>
                  <strong>• da Vam omogućimo pristup Vašim podacima o ličnosti</strong><br/>
                  U svakom trenutku imate pravo da od naše ustanove zahtevate da pristupite podacima o ličnosti, dobijete informaciju u koju svrhu se podaci koriste i obrađuju, kategoriju Vaših podataka o ličnosti koje čuvamo, period tokom kojeg obrađujemo i čuvamo Vaše podatke.
                </li>
                <li style={{ marginBottom: 12 }}>
                  <strong>• da Vam damo kopiju podataka o ličnosti koje obrađujemo</strong><br/>
                  Imate pravo da od naše ustanove zahtevate da Vam damo kopiju pojedinih ili svih podataka o ličnosti koje obrađujemo.
                </li>
                <li style={{ marginBottom: 12 }}>
                  <strong>• da zahtevate ispravku i dopunu Vaših podataka o ličnosti</strong><br/>
                  Bitno nam je da su Vaši podaci tačni i potpuni. Imate pravo da zahtevate da se Vaši netačno uneti podaci bez odlaganje izbrišu odnosno isprave kao i da tražite od nas da Vam ih dopunimo i ažuriramo ukoliko su zastareli.
                </li>
                <li style={{ marginBottom: 12 }}>
                  <strong>• da zahtevate brisanje podataka o ličnosti</strong><br/>
                  U slučaju da želite da se Vaši podaci obrišu odnosno želite da prekinemo obradu istih možete nam se obratiti.
                </li>
                <li style={{ marginBottom: 12 }}>
                  <strong>• da ograničite obradu Vaših podataka o ličnosti</strong><br/>
                  Imate pravo da ograničite obradu Vaših podataka o ličnosti u određenom delu ili u potpunosti.
                </li>
                <li style={{ marginBottom: 12 }}>
                  <strong>• da podnesete pravo na prigovor</strong><br/>
                  U svakom trenutku imate pravo da podnesete prigovor rukovaocu na obradu Vaših podataka.
                </li>
                <li style={{ marginBottom: 12 }}>
                  <strong>• da prenesete svoje podatke drugom rukovaocu</strong><br/>
                  Ukoliko se obrada podataka vrši na osnovu Vašeg pristanka ili se obrada vrši automatizovano imate pravo da tražite da se Vaši podaci o ličnosti prebace drugom rukovaocu.
                </li>
                <li style={{ marginBottom: 12 }}>
                  <strong>• da opozovete pristanak za obradu Vaših podataka o ličnosti</strong><br/>
                  Kada se obrada vrši na osnovu Vašeg pristanka u svakom trenutku imate pravo da ga opozovete.
                </li>
                <li style={{ marginBottom: 12 }}>
                  <strong>• da podnesete tužbu povereniku</strong><br/>
                  U slučaju da smatrate da se obrada podataka vrši suprotno Zakonu imate pravo na podnošenje pritužbe Povereniku za zaštitu podataka ličnosti.
                </li>
              </ul>

              <h3 style={{ 
                marginTop: 30,
                marginBottom: 16,
                fontSize: isMobile ? 18 : 20,
                fontWeight: 600,
                color: "var(--brand-primary)",
              }}>V. OBRAĐIVAČI</h3>

              <p style={{ marginBottom: 20 }}>
                Podaci o ličnosti Korisnika mogu se proslediti drugim obrađivačima ili primaocima u slučaju da je to neophodno za funkcionisanje aplikacije (npr. hosting provajderi, servisi za analitiku).
              </p>

              <p style={{ marginBottom: 20 }}>
                Njihova obaveza je da Vaše podatke zaštite i drže ih u tajnosti i obezbede visok nivo zaštite kako bi podaci bili bezbedni (kriptozaštita, pseudoanomizacija i dr).
              </p>

              <h3 style={{ 
                marginTop: 30,
                marginBottom: 16,
                fontSize: isMobile ? 18 : 20,
                fontWeight: 600,
                color: "var(--brand-primary)",
              }}>VI. PERIOD ČUVANJA PODATAKA O LIČNOSTI</h3>

              <p style={{ marginBottom: 20 }}>
                Vremenski period čuvanja podataka Vaših podataka o ličnosti zavisi od svrhe zbog koje ih obrađujemo.
              </p>

              <p style={{ marginBottom: 20 }}>
                Podaci o korisničkom nalogu čuvaju se tokom celog trajanja naloga. Ako se nalog nije aktivno koristio u poslednje 3 godine, ovi podaci o ličnosti će biti izbrisani.
              </p>

              <h3 style={{ 
                marginTop: 30,
                marginBottom: 16,
                fontSize: isMobile ? 18 : 20,
                fontWeight: 600,
                color: "var(--brand-primary)",
              }}>VII. BEZBEDNOST</h3>

              <p style={{ marginBottom: 20 }}>
                Podaci o ličnosti se čuvaju u bezbednoj bazi podataka. Pristup podacima o ličnosti dozvoljen je samo ovlašćenim zaposlenima i samo koristeći odobrene pristupe na bezbedan način. Podaci o ličnosti će se obrađivati u elektronskom obliku na automatizovan način ili u štampanom obliku na neautomatizovani način.
              </p>

              <p style={{ marginBottom: 20, padding: 16, background: "rgba(65, 101, 57, 0.1)", borderRadius: 8, border: "1px solid var(--brand-primary)" }}>
                <strong>Važno:</strong> Rukovalac je preduzeo odgovarajuće tehničke i organizacione mere kako bi osigurao dovoljnu zaštitu podataka o ličnosti. <strong>Vaši podaci su potpuno privatni i nisu dostupni za pregled ili korišćenje od strane zaposlenih ili trećih lica.</strong>
              </p>

              <h3 style={{ 
                marginTop: 30,
                marginBottom: 16,
                fontSize: isMobile ? 18 : 20,
                fontWeight: 600,
                color: "var(--brand-primary)",
              }}>VIII. PRIJAVLJIVANJE KRŠENJA PODATAKA O LIČNOSTI</h3>

              <p style={{ marginBottom: 20 }}>
                <strong>Šta je kršenje privatnosti?</strong>
              </p>

              <p style={{ marginBottom: 20 }}>
                To su događaji koji su doveli ili bi mogli dovesti do (i) slučajnog ili namernog gubitka podataka o ličnosti (u elektronskoj ili papirnoj formi), (ii) uništavanja podataka ili (iii) neovlašćenog pristupa podacima.
              </p>

              <p style={{ marginBottom: 20 }}>
                <strong>Kada treba da prijavim takav incident?</strong>
              </p>

              <p style={{ marginBottom: 20 }}>
                U određenim slučajevima rukovalac podacima o ličnosti dužan je da prijavi Povereniku za zaštitu podataka o ličnosti povredu bezbednosti podataka o ličnosti u roku od 72 sata od trenutka kada je za to saznao. Stoga, ako utvrdite kršenje podataka o ličnosti gde naša kompanija deluje kao administrator, nemojte se ustručavati da odmah prijavite incident putem: <strong>office@biozen.rs</strong>.
              </p>

              <div style={{
                marginTop: 40,
                padding: 20,
                background: "var(--brand-bg)",
                borderRadius: 8,
                border: "1px solid var(--brand-border)",
                textAlign: "center",
              }}>
                <p style={{ margin: 0, fontSize: isMobile ? 13 : 14, color: "var(--brand-text-light)" }}>
                  Za dodatne informacije, kontaktirajte nas na: <strong>office@biozen.rs</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Admin Panel komponenta
function AdminPanel({ me, onLogout, isMobile }) {
  const [activeSection, setActiveSection] = useState("dashboard"); // dashboard | users | blogs
  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [error, setError] = useState(null);
  const [blogForm, setBlogForm] = useState({
    title: "",
    content: "",
    excerpt: "",
    featuredImage: "",
    status: "DRAFT"
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageInputMode, setImageInputMode] = useState("upload"); // "upload" | "url"
  const [imageUrl, setImageUrl] = useState("");
  const contentEditorRef = useRef(null);

  // Update contentEditable when editing blog
  useEffect(() => {
    if (contentEditorRef.current && editingBlog) {
      contentEditorRef.current.innerHTML = blogForm.content || "";
    }
  }, [editingBlog, showBlogForm]);

  useEffect(() => {
    console.log("AdminPanel useEffect triggered, activeSection:", activeSection);
    if (activeSection === "dashboard" || activeSection === "users") {
      console.log("Loading users and stats...");
      loadUserStats();
      loadUsers();
    } else if (activeSection === "blogs") {
      console.log("Loading blogs...");
      loadBlogs();
    }
  }, [activeSection, currentPage, searchTerm]);

  async function loadUserStats() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("/api/admin/users/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setUserStats(data);
      }
    } catch (e) {
      console.error("Greška pri učitavanju statistika:", e);
    }
  }

  async function loadUsers() {
    console.log("loadUsers() called");
    const token = localStorage.getItem("token");
    console.log("Token exists:", !!token);
    if (!token) {
      console.error("No token found!");
      setError("Niste autentifikovani. Molimo ulogujte se ponovo.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const url = `/api/admin/users?page=${currentPage}&size=20${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ""}`;
      console.log("Loading users from:", url);
      console.log("Authorization header:", `Bearer ${token.substring(0, 20)}...`);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Response status:", res.status);
      const data = await res.json();
      console.log("Users response:", data);
      if (res.ok) {
        console.log("Setting users:", data.users);
        console.log("Users count:", data.users?.length || 0);
        setUsers(data.users || []);
        setTotalPages(data.totalPages || 0);
        setError(null);
      } else {
        console.error("Error loading users - Status:", res.status, "Data:", data);
        const errorMessage = data.message || `Greška pri učitavanju korisnika (${res.status})`;
        setError(errorMessage);
        if (res.status === 403) {
          setError("Nemate dozvolu za pristup ovoj sekciji. Potrebna je ADMIN uloga.");
        } else if (res.status === 401) {
          setError("Sesija je istekla. Molimo ulogujte se ponovo.");
        }
      }
    } catch (e) {
      console.error("Exception in loadUsers:", e);
      console.error("Error stack:", e.stack);
      setError("Greška pri povezivanju sa serverom. Proverite internet konekciju.");
    } finally {
      setLoading(false);
    }
  }

  async function loadBlogs() {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/blog?page=${currentPage}&size=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setBlogs(data.posts || []);
        setTotalPages(data.totalPages || 0);
      }
    } catch (e) {
      console.error("Greška pri učitavanju blogova:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(file) {
    const token = localStorage.getItem("token");
    if (!token) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload/image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setBlogForm({ ...blogForm, featuredImage: data.url });
        return data.url;
      } else {
        console.error("Error uploading image:", data.message);
        return null;
      }
    } catch (e) {
      console.error("Greška pri upload-u slike:", e);
      return null;
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSaveBlog() {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Validate required fields
    if (!blogForm.title || !blogForm.title.trim()) {
      alert("Naslov je obavezan");
      return;
    }
    if (!blogForm.content || !blogForm.content.trim()) {
      alert("Sadržaj je obavezan");
      return;
    }
    if (!blogForm.featuredImage || !blogForm.featuredImage.trim()) {
      alert("Cover slika je obavezna");
      return;
    }

    try {
      const url = editingBlog ? `/api/admin/blog/${editingBlog.id}` : "/api/admin/blog";
      const method = editingBlog ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(blogForm),
      });

      if (res.ok) {
        setShowBlogForm(false);
        setEditingBlog(null);
        setBlogForm({ title: "", content: "", excerpt: "", featuredImage: "", status: "DRAFT" });
        setImageInputMode("upload");
        setImageUrl("");
        loadBlogs();
      } else {
        const data = await res.json();
        alert(data.message || "Greška pri čuvanju bloga");
      }
    } catch (e) {
      console.error("Greška pri čuvanju bloga:", e);
      alert("Greška pri čuvanju bloga");
    }
  }

  async function handleDeleteBlog(id) {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (!confirm("Da li ste sigurni da želite da obrišete ovaj blog?")) return;

    try {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        loadBlogs();
      }
    } catch (e) {
      console.error("Greška pri brisanju bloga:", e);
    }
  }

  async function handlePublishBlog(id) {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`/api/admin/blog/${id}/publish`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        loadBlogs();
      }
    } catch (e) {
      console.error("Greška pri objavljivanju bloga:", e);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--brand-bg)",
      padding: isMobile ? "20px 10px" : "40px 20px",
    }}>
      {/* Header */}
      <div style={{
        maxWidth: 1200,
        margin: "0 auto 30px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 15,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          <img src="/logo.svg" alt="BioZen" style={{ height: 40 }} />
          <h1 style={{ margin: 0, color: "var(--brand-primary)", fontSize: isMobile ? 20 : 24 }}>
            Admin Panel
          </h1>
        </div>
        <button
          onClick={onLogout}
          style={{
            padding: "10px 20px",
            background: "var(--brand-error)",
            color: "#fff",
            border: 0,
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Izloguj se
        </button>
      </div>

      {/* Navigation */}
      <div style={{
        maxWidth: 1200,
        margin: "0 auto 30px",
        display: "flex",
        gap: 10,
        borderBottom: "2px solid var(--brand-border)",
      }}>
        {["dashboard", "users", "blogs"].map((section) => (
          <button
            key={section}
            onClick={() => {
              setActiveSection(section);
              setCurrentPage(0);
              setSearchTerm("");
            }}
            style={{
              padding: "12px 24px",
              background: "transparent",
              border: 0,
              borderBottom: activeSection === section ? "3px solid var(--brand-primary)" : "3px solid transparent",
              color: activeSection === section ? "var(--brand-primary)" : "var(--brand-text-light)",
              fontWeight: activeSection === section ? 600 : 400,
              cursor: "pointer",
              fontSize: 15,
            }}
          >
            {section === "dashboard" ? "Dashboard" : section === "users" ? "Korisnici" : "Blogovi"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {activeSection === "dashboard" && (
          <div>
            <h2 style={{ color: "var(--brand-text)", marginBottom: 20 }}>Statistike</h2>
            {userStats && (
              <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)",
                gap: 20,
                marginBottom: 30,
              }}>
                <div style={{
                  background: "#fff",
                  padding: 20,
                  borderRadius: 12,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}>
                  <div style={{ color: "var(--brand-text-light)", fontSize: 14, marginBottom: 8 }}>Ukupno korisnika</div>
                  <div style={{ color: "var(--brand-primary)", fontSize: 32, fontWeight: 700 }}>{userStats.totalUsers}</div>
                </div>
                <div style={{
                  background: "#fff",
                  padding: 20,
                  borderRadius: 12,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}>
                  <div style={{ color: "var(--brand-text-light)", fontSize: 14, marginBottom: 8 }}>Aktivni korisnici</div>
                  <div style={{ color: "var(--brand-success)", fontSize: 32, fontWeight: 700 }}>{userStats.activeUsers}</div>
                </div>
                <div style={{
                  background: "#fff",
                  padding: 20,
                  borderRadius: 12,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}>
                  <div style={{ color: "var(--brand-text-light)", fontSize: 14, marginBottom: 8 }}>Novi danas</div>
                  <div style={{ color: "var(--brand-primary)", fontSize: 32, fontWeight: 700 }}>{userStats.newUsersToday}</div>
                </div>
                <div style={{
                  background: "#fff",
                  padding: 20,
                  borderRadius: 12,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}>
                  <div style={{ color: "var(--brand-text-light)", fontSize: 14, marginBottom: 8 }}>Prosečna kilaža</div>
                  <div style={{ color: "var(--brand-primary)", fontSize: 32, fontWeight: 700 }}>{userStats.averageWeight} kg</div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === "users" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 15 }}>
              <h2 style={{ color: "var(--brand-text)", margin: 0 }}>Korisnici</h2>
              <input
                type="text"
                placeholder="Pretraži po email-u..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(0);
                }}
                style={{
                  padding: "10px 15px",
                  border: "1px solid var(--brand-border)",
                  borderRadius: 8,
                  fontSize: 13,
                  minWidth: 200,
                }}
              />
            </div>
            {error && (
              <div style={{
                padding: "12px 16px",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid var(--brand-error)",
                borderRadius: 8,
                color: "var(--brand-error)",
                marginBottom: 20,
                fontSize: 13,
              }}>
                {error}
              </div>
            )}
            {loading ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--brand-text-light)" }}>Učitavanje...</div>
            ) : (
              <>
                <div style={{
                  background: "#fff",
                  borderRadius: 12,
                  overflow: "hidden",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "var(--brand-bg)" }}>
                        <th style={{ padding: 15, textAlign: "left", borderBottom: "2px solid var(--brand-border)", color: "var(--brand-text)" }}>Email</th>
                        <th style={{ padding: 15, textAlign: "left", borderBottom: "2px solid var(--brand-border)", color: "var(--brand-text)" }}>Ime</th>
                        <th style={{ padding: 15, textAlign: "left", borderBottom: "2px solid var(--brand-border)", color: "var(--brand-text)" }}>Prezime</th>
                        <th style={{ padding: 15, textAlign: "left", borderBottom: "2px solid var(--brand-border)", color: "var(--brand-text)" }}>Broj merenja</th>
                        <th style={{ padding: 15, textAlign: "left", borderBottom: "2px solid var(--brand-border)", color: "var(--brand-text)" }}>Chat poruke</th>
                        <th style={{ padding: 15, textAlign: "left", borderBottom: "2px solid var(--brand-border)", color: "var(--brand-text)" }}>Status</th>
                        <th style={{ padding: 15, textAlign: "left", borderBottom: "2px solid var(--brand-border)", color: "var(--brand-text)" }}>Akcije</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ padding: 40, textAlign: "center", color: "var(--brand-text-light)" }}>
                            Nema korisnika
                          </td>
                        </tr>
                      ) : (
                        users.map((user) => (
                          <tr key={user.id} style={{ borderBottom: "1px solid var(--brand-border)" }}>
                            <td style={{ padding: 15, color: "var(--brand-text)" }}>{user.email}</td>
                            <td style={{ padding: 15, color: "var(--brand-text)" }}>{user.ime || "-"}</td>
                            <td style={{ padding: 15, color: "var(--brand-text)" }}>{user.prezime || "-"}</td>
                            <td style={{ padding: 15, color: "var(--brand-text)", textAlign: "center" }}>
                              {user.measurementCount || 0}
                            </td>
                            <td style={{ padding: 15, color: "var(--brand-text)", textAlign: "center" }}>
                              {user.chatCount || 0}
                            </td>
                            <td style={{ padding: 15 }}>
                              <span style={{
                                padding: "4px 12px",
                                borderRadius: 12,
                                fontSize: 12,
                                fontWeight: 600,
                                background: (user.isActive !== false) ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                                color: (user.isActive !== false) ? "var(--brand-success)" : "var(--brand-error)",
                              }}>
                                {(user.isActive !== false) ? "Aktivan" : "Neaktivan"}
                              </span>
                            </td>
                            <td style={{ padding: 15 }}>
                              <button
                                onClick={() => setSelectedUser(user)}
                                style={{
                                  padding: "6px 12px",
                                  background: "var(--brand-primary)",
                                  color: "#fff",
                                  border: 0,
                                  borderRadius: 6,
                                  cursor: "pointer",
                                  fontSize: 12,
                                  marginRight: 8,
                                }}
                              >
                                Detalji
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 20 }}>
                    <button
                      onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                      style={{
                        padding: "8px 16px",
                        background: currentPage === 0 ? "var(--brand-border)" : "var(--brand-primary)",
                        color: "#fff",
                        border: 0,
                        borderRadius: 6,
                        cursor: currentPage === 0 ? "not-allowed" : "pointer",
                      }}
                    >
                      Prethodna
                    </button>
                    <span style={{ padding: "8px 16px", color: "var(--brand-text)" }}>
                      Strana {currentPage + 1} od {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={currentPage >= totalPages - 1}
                      style={{
                        padding: "8px 16px",
                        background: currentPage >= totalPages - 1 ? "var(--brand-border)" : "var(--brand-primary)",
                        color: "#fff",
                        border: 0,
                        borderRadius: 6,
                        cursor: currentPage >= totalPages - 1 ? "not-allowed" : "pointer",
                      }}
                    >
                      Sledeća
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeSection === "blogs" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 15 }}>
              <h2 style={{ color: "var(--brand-text)", margin: 0 }}>Blogovi</h2>
              <button
                onClick={() => {
                  setEditingBlog(null);
                  setBlogForm({ title: "", content: "", excerpt: "", featuredImage: "", status: "DRAFT" });
                  setImageInputMode("upload");
                  setImageUrl("");
                  setShowBlogForm(true);
                  // Clear editor
                  setTimeout(() => {
                    if (contentEditorRef.current) {
                      contentEditorRef.current.innerHTML = "";
                    }
                  }, 100);
                }}
                style={{
                  padding: "12px 24px",
                  background: "var(--brand-primary)",
                  color: "#fff",
                  border: 0,
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                + Novi blog
              </button>
            </div>
            {loading ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--brand-text-light)" }}>Učitavanje...</div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
                gap: 20,
              }}>
                {blogs.map((blog) => (
                  <div key={blog.id} style={{
                    background: "#fff",
                    padding: 20,
                    borderRadius: 12,
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}>
                    <h3 style={{ margin: "0 0 10px 0", color: "var(--brand-text)" }}>{blog.title}</h3>
                    <p style={{ color: "var(--brand-text-light)", fontSize: 14, margin: "0 0 15px 0" }}>
                      {blog.excerpt || blog.content?.substring(0, 100) + "..."}
                    </p>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <span style={{
                        padding: "4px 12px",
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600,
                        background: blog.status === "PUBLISHED" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                        color: blog.status === "PUBLISHED" ? "var(--brand-success)" : "var(--brand-error)",
                      }}>
                        {blog.status === "PUBLISHED" ? "Objavljen" : "Nacrt"}
                      </span>
                      <button
                        onClick={() => {
                          setEditingBlog(blog);
                          setBlogForm({
                            title: blog.title || "",
                            content: blog.content || "",
                            excerpt: blog.excerpt || "",
                            featuredImage: blog.featuredImage || "",
                            status: blog.status || "DRAFT",
                          });
                          if (blog.featuredImage && (blog.featuredImage.startsWith("http://") || blog.featuredImage.startsWith("https://"))) {
                            setImageInputMode("url");
                            setImageUrl(blog.featuredImage);
                          } else {
                            setImageInputMode("upload");
                            setImageUrl("");
                          }
                          setShowBlogForm(true);
                          // Set content in editor after a brief delay to ensure DOM is ready
                          setTimeout(() => {
                            if (contentEditorRef.current) {
                              contentEditorRef.current.innerHTML = blog.content || "";
                            }
                          }, 100);
                        }}
                        style={{
                          padding: "6px 12px",
                          background: "var(--brand-primary)",
                          color: "#fff",
                          border: 0,
                          borderRadius: 6,
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        Edit
                      </button>
                      {blog.status !== "PUBLISHED" && (
                        <button
                          onClick={() => handlePublishBlog(blog.id)}
                          style={{
                            padding: "6px 12px",
                            background: "var(--brand-success)",
                            color: "#fff",
                            border: 0,
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          Objavi
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteBlog(blog.id)}
                        style={{
                          padding: "6px 12px",
                          background: "var(--brand-error)",
                          color: "#fff",
                          border: 0,
                          borderRadius: 6,
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        Obriši
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Blog Form Modal */}
        {showBlogForm && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}>
            <div style={{
              background: "#fff",
              borderRadius: 12,
              padding: 30,
              maxWidth: 800,
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
            }}>
              <h2 style={{ margin: "0 0 20px 0", color: "var(--brand-text)" }}>
                {editingBlog ? "Izmeni blog" : "Novi blog"}
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                <input
                  type="text"
                  placeholder="Naslov"
                  value={blogForm.title}
                  onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                  style={{
                    padding: 12,
                    border: "1px solid var(--brand-border)",
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                />
                <textarea
                  placeholder="Kratak opis (excerpt)"
                  value={blogForm.excerpt}
                  onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                  rows={3}
                  style={{
                    padding: 12,
                    border: "1px solid var(--brand-border)",
                    borderRadius: 8,
                    fontSize: 13,
                    resize: "vertical",
                  }}
                />
                <div>
                  <label style={{ display: "block", marginBottom: 8, color: "var(--brand-text)", fontWeight: 600 }}>
                    Sadržaj
                  </label>
                  {/* Toolbar */}
                  <div style={{
                    display: "flex",
                    gap: 8,
                    padding: 8,
                    background: "var(--brand-bg)",
                    border: "1px solid var(--brand-border)",
                    borderBottom: "none",
                    borderRadius: "8px 8px 0 0",
                    flexWrap: "wrap",
                  }}>
                    <button
                      type="button"
                      onClick={() => document.execCommand('bold', false, null)}
                      style={{
                        padding: "6px 12px",
                        background: "#fff",
                        border: "1px solid var(--brand-border)",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                      title="Bold"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => document.execCommand('italic', false, null)}
                      style={{
                        padding: "6px 12px",
                        background: "#fff",
                        border: "1px solid var(--brand-border)",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontStyle: "italic",
                      }}
                      title="Italic"
                    >
                      I
                    </button>
                    <select
                      onChange={(e) => {
                        const size = e.target.value;
                        if (size) {
                          document.execCommand('fontSize', false, size);
                        }
                        e.target.value = "";
                      }}
                      style={{
                        padding: "6px 12px",
                        background: "#fff",
                        border: "1px solid var(--brand-border)",
                        borderRadius: 4,
                        cursor: "pointer",
                      }}
                      title="Font Size"
                    >
                      <option value="">Font Size</option>
                      <option value="1">Mali</option>
                      <option value="3">Normalan</option>
                      <option value="5">Veliki</option>
                      <option value="7">Vrlo veliki</option>
                    </select>
                    <select
                      onChange={(e) => {
                        const font = e.target.value;
                        if (font) {
                          document.execCommand('fontName', false, font);
                        }
                        e.target.value = "";
                      }}
                      style={{
                        padding: "6px 12px",
                        background: "#fff",
                        border: "1px solid var(--brand-border)",
                        borderRadius: 4,
                        cursor: "pointer",
                      }}
                      title="Font Family"
                    >
                      <option value="">Font</option>
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Verdana">Verdana</option>
                    </select>
                  </div>
                  {/* ContentEditable Editor */}
                  <div
                    ref={contentEditorRef}
                    contentEditable
                    onInput={(e) => {
                      const html = e.target.innerHTML;
                      setBlogForm({ ...blogForm, content: html });
                    }}
                    suppressContentEditableWarning={true}
                    style={{
                      minHeight: 300,
                      padding: 12,
                      border: "1px solid var(--brand-border)",
                      borderRadius: "0 0 8px 8px",
                      background: "#fff",
                      fontSize: 13,
                      lineHeight: 1.6,
                      outline: "none",
                      overflow: "auto",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 8, color: "var(--brand-text)", fontWeight: 600 }}>
                    Cover slika (obavezno)
                  </label>
                  {/* Toggle između Upload i URL */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setImageInputMode("upload");
                        setImageUrl("");
                      }}
                      style={{
                        flex: 1,
                        padding: "8px 16px",
                        background: imageInputMode === "upload" ? "var(--brand-primary)" : "var(--brand-bg-light)",
                        color: imageInputMode === "upload" ? "#fff" : "var(--brand-text)",
                        border: `1px solid ${imageInputMode === "upload" ? "var(--brand-primary)" : "var(--brand-border)"}`,
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImageInputMode("url");
                        setImageUrl(blogForm.featuredImage || "");
                      }}
                      style={{
                        flex: 1,
                        padding: "8px 16px",
                        background: imageInputMode === "url" ? "var(--brand-primary)" : "var(--brand-bg-light)",
                        color: imageInputMode === "url" ? "#fff" : "var(--brand-text)",
                        border: `1px solid ${imageInputMode === "url" ? "var(--brand-primary)" : "var(--brand-border)"}`,
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      URL
                    </button>
                  </div>

                  {/* Upload opcija */}
                  {imageInputMode === "upload" && (
                    <>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageUpload(file);
                          }
                        }}
                        style={{
                          padding: 12,
                          border: "1px solid var(--brand-border)",
                          borderRadius: 8,
                          fontSize: 13,
                          width: "100%",
                        }}
                      />
                      {uploadingImage && (
                        <div style={{ marginTop: 8, color: "var(--brand-text-light)", fontSize: 14 }}>
                          Upload-ovanje slike...
                        </div>
                      )}
                    </>
                  )}

                  {/* URL opcija */}
                  {imageInputMode === "url" && (
                    <input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={(e) => {
                        const url = e.target.value;
                        setImageUrl(url);
                        setBlogForm({ ...blogForm, featuredImage: url });
                      }}
                      style={{
                        padding: 12,
                        border: "1px solid var(--brand-border)",
                        borderRadius: 8,
                        fontSize: 13,
                        width: "100%",
                      }}
                    />
                  )}

                  {/* Preview slike */}
                  {blogForm.featuredImage && (
                    <div style={{ marginTop: 12 }}>
                      <img
                        src={blogForm.featuredImage}
                        alt="Cover"
                        style={{
                          maxWidth: "100%",
                          maxHeight: 200,
                          borderRadius: 8,
                          border: "1px solid var(--brand-border)",
                        }}
                        onError={(e) => {
                          e.target.style.display = "none";
                          const errorDiv = e.target.nextSibling;
                          if (errorDiv) {
                            errorDiv.style.display = "block";
                          }
                        }}
                      />
                      <div style={{ display: "none", marginTop: 8, padding: 8, background: "rgba(239, 68, 68, 0.1)", color: "var(--brand-error)", borderRadius: 6, fontSize: 12 }}>
                        Ne mogu da učitam sliku. Proverite URL.
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setBlogForm({ ...blogForm, featuredImage: "" });
                          setImageUrl("");
                        }}
                        style={{
                          marginTop: 8,
                          padding: "6px 12px",
                          background: "var(--brand-error)",
                          color: "#fff",
                          border: 0,
                          borderRadius: 6,
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        Ukloni sliku
                      </button>
                    </div>
                  )}
                </div>
                <select
                  value={blogForm.status}
                  onChange={(e) => setBlogForm({ ...blogForm, status: e.target.value })}
                  style={{
                    padding: 12,
                    border: "1px solid var(--brand-border)",
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                >
                  <option value="DRAFT">Nacrt</option>
                  <option value="PUBLISHED">Objavljen</option>
                  <option value="ARCHIVED">Arhiviran</option>
                </select>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button
                    onClick={() => {
                      setShowBlogForm(false);
                      setEditingBlog(null);
                      setBlogForm({ title: "", content: "", excerpt: "", featuredImage: "", status: "DRAFT" });
                      setImageInputMode("upload");
                      setImageUrl("");
                    }}
                    style={{
                      padding: "12px 24px",
                      background: "var(--brand-border)",
                      color: "var(--brand-text)",
                      border: 0,
                      borderRadius: 8,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Otkaži
                  </button>
                  <button
                    onClick={handleSaveBlog}
                    style={{
                      padding: "12px 24px",
                      background: "var(--brand-primary)",
                      color: "#fff",
                      border: 0,
                      borderRadius: 8,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Sačuvaj
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Details Modal */}
        {selectedUser && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}>
            <div style={{
              background: "#fff",
              borderRadius: 12,
              padding: 30,
              maxWidth: 600,
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
            }}>
              <h2 style={{ margin: "0 0 20px 0", color: "var(--brand-text)" }}>Detalji korisnika</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div><strong>Email:</strong> {selectedUser.email}</div>
                <div><strong>Ime:</strong> {selectedUser.ime || "-"}</div>
                <div><strong>Prezime:</strong> {selectedUser.prezime || "-"}</div>
                <div><strong>Pol:</strong> {selectedUser.pol || "-"}</div>
                <div><strong>Starost:</strong> {selectedUser.starost || "-"}</div>
                <div><strong>Kilaža:</strong> {selectedUser.kilaza || "-"} kg</div>
                <div><strong>Željena kilaža:</strong> {selectedUser.zeljenaKilaza || "-"} kg</div>
                <div><strong>Status:</strong> {selectedUser.isActive !== false ? "Aktivan" : "Neaktivan"}</div>
                <div><strong>Registracija:</strong> {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('sr-RS') : "-"}</div>
                <div><strong>Poslednji login:</strong> {selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleDateString('sr-RS') : "-"}</div>
                <div><strong>Broj login-a:</strong> {selectedUser.loginCount || 0}</div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                style={{
                  marginTop: 20,
                  padding: "12px 24px",
                  background: "var(--brand-primary)",
                  color: "#fff",
                  border: 0,
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                  width: "100%",
                }}
              >
                Zatvori
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

