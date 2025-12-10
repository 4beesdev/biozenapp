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
  const [activeTab, setActiveTab] = useState(null); // null = home, "merenja" | "podaci" | "saveti" | "shop"
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
  }, []);

  async function loadUserData() {
    const token = localStorage.getItem("token");
    if (!token) return;
    
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
        console.log("✗ Authentication failed");
        localStorage.removeItem("token");
        setIsLoggedIn(false);
      }
    } catch (e) {
      console.error("Greška pri učitavanju podataka:", e);
      localStorage.removeItem("token");
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
    localStorage.removeItem("token");
    setMe(null);
    setIsLoggedIn(false);
    setMessage("Izlogovan");
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
    return <Dashboard me={me} onUpdate={updateUserData} onLogout={logout} activeTab={activeTab} setActiveTab={setActiveTab} message={message} isMobile={isMobile} />;
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
                fontSize: 14,
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
                fontSize: 14,
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

      {message && (
        <div style={{ 
          marginTop: 16,
          padding: 12,
          borderRadius: 8,
          background: message.includes("uspeš") ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
          color: message.includes("uspeš") ? "var(--brand-success)" : "var(--brand-error)",
          fontSize: 14,
          textAlign: "center",
        }}>
          {message}
        </div>
      )}
    </div>
  );
}

// Dashboard komponenta
function Dashboard({ me, onUpdate, onLogout, activeTab, setActiveTab, message, isMobile: isMobileProp }) {
  const [formData, setFormData] = useState({
    ime: me?.ime || "",
    prezime: me?.prezime || "",
    pol: me?.pol || "",
    starost: me?.starost || "",
    kilaza: me?.kilaza || "",
    zeljenaKilaza: me?.zeljenaKilaza || "",
  });

  const [measurements, setMeasurements] = useState([]);
  const [showMeasurementForm, setShowMeasurementForm] = useState(false);
  const [measurementForm, setMeasurementForm] = useState({
    datum: new Date().toISOString().split('T')[0],
    kilaza: "",
    komentar: "",
  });
  const [measurementMessage, setMeasurementMessage] = useState("");
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
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
      });
    }
  }, [me]);

  useEffect(() => {
    if (activeTab === "merenja" && me) {
      loadMeasurements();
    }
  }, [activeTab, me]);

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
        paddingBottom: isMobile && showInstallButton ? "100px" : (isMobile ? "20px" : "30px"),
        minHeight: "100vh",
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
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            width: "100%",
            maxWidth: 400,
          }}>
            <button
              onClick={() => setActiveTab("merenja")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "30px 20px",
                background: "var(--brand-bg-light)",
                color: "var(--brand-text)",
                border: "1px solid var(--brand-border)",
                borderRadius: 16,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 14,
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
              <span style={{ fontSize: 48, marginBottom: 12 }}>📊</span>
              <span>Moja merenja</span>
            </button>
            <button
              onClick={() => setActiveTab("podaci")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "30px 20px",
                background: "var(--brand-bg-light)",
                color: "var(--brand-text)",
                border: "1px solid var(--brand-border)",
                borderRadius: 16,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 14,
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
              <span style={{ fontSize: 48, marginBottom: 12 }}>👤</span>
              <span>Moji podaci</span>
            </button>
            <button
              onClick={() => setActiveTab("saveti")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "30px 20px",
                background: "var(--brand-bg-light)",
                color: "var(--brand-text)",
                border: "1px solid var(--brand-border)",
                borderRadius: 16,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 14,
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
              <span style={{ fontSize: 48, marginBottom: 12 }}>💡</span>
              <span>Saveti</span>
            </button>
            <button
              onClick={() => setActiveTab("shop")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "30px 20px",
                background: "var(--brand-bg-light)",
                color: "var(--brand-text)",
                border: "1px solid var(--brand-border)",
                borderRadius: 16,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 14,
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
              <span style={{ fontSize: 48, marginBottom: 12 }}>🛒</span>
              <span>BioZen Shop</span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile: Ikonice u header-u kada je tab otvoren (back button) */}
      {isMobile && activeTab !== null && (
        <div style={{ 
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
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
                    fontSize: 14,
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
                    fontSize: 14,
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
                    fontSize: 14,
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
            color: "var(--brand-text)",
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
                fontSize: 14,
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
                fontSize: 14,
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
                fontSize: 14,
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
                fontSize: 14,
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
                fontSize: 14,
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

            <div style={{ marginBottom: 24 }}>
              <label style={{ 
                display: "block", 
                marginBottom: 8, 
                fontWeight: 600,
                color: "var(--brand-text)",
                fontSize: 14,
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
                fontSize: 14,
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
  const [blogForm, setBlogForm] = useState({
    title: "",
    content: "",
    excerpt: "",
    featuredImage: "",
    status: "DRAFT"
  });

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
      return;
    }

    setLoading(true);
    try {
      const url = `/api/admin/users?page=${currentPage}&size=20${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ""}`;
      console.log("Loading users from:", url);
      console.log("Authorization header:", `Bearer ${token.substring(0, 20)}...`);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Response status:", res.status);
      console.log("Response headers:", res.headers);
      const data = await res.json();
      console.log("Users response:", data);
      if (res.ok) {
        console.log("Setting users:", data.users);
        console.log("Users count:", data.users?.length || 0);
        setUsers(data.users || []);
        setTotalPages(data.totalPages || 0);
      } else {
        console.error("Error loading users - Status:", res.status, "Data:", data);
      }
    } catch (e) {
      console.error("Exception in loadUsers:", e);
      console.error("Error stack:", e.stack);
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

  async function handleSaveBlog() {
    const token = localStorage.getItem("token");
    if (!token) return;

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
        loadBlogs();
      }
    } catch (e) {
      console.error("Greška pri čuvanju bloga:", e);
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
                  fontSize: 14,
                  minWidth: 200,
                }}
              />
            </div>
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
                        <th style={{ padding: 15, textAlign: "left", borderBottom: "2px solid var(--brand-border)", color: "var(--brand-text)" }}>Status</th>
                        <th style={{ padding: 15, textAlign: "left", borderBottom: "2px solid var(--brand-border)", color: "var(--brand-text)" }}>Akcije</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ padding: 40, textAlign: "center", color: "var(--brand-text-light)" }}>
                            Nema korisnika
                          </td>
                        </tr>
                      ) : (
                        users.map((user) => (
                          <tr key={user.id} style={{ borderBottom: "1px solid var(--brand-border)" }}>
                            <td style={{ padding: 15, color: "var(--brand-text)" }}>{user.email}</td>
                            <td style={{ padding: 15, color: "var(--brand-text)" }}>{user.ime || "-"}</td>
                            <td style={{ padding: 15, color: "var(--brand-text)" }}>{user.prezime || "-"}</td>
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
                  setShowBlogForm(true);
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
                            title: blog.title,
                            content: blog.content,
                            excerpt: blog.excerpt,
                            featuredImage: blog.featuredImage,
                            status: blog.status,
                          });
                          setShowBlogForm(true);
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
                    fontSize: 14,
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
                    fontSize: 14,
                    resize: "vertical",
                  }}
                />
                <textarea
                  placeholder="Sadržaj (HTML)"
                  value={blogForm.content}
                  onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                  rows={10}
                  style={{
                    padding: 12,
                    border: "1px solid var(--brand-border)",
                    borderRadius: 8,
                    fontSize: 14,
                    resize: "vertical",
                    fontFamily: "monospace",
                  }}
                />
                <input
                  type="text"
                  placeholder="URL slike (opciono)"
                  value={blogForm.featuredImage}
                  onChange={(e) => setBlogForm({ ...blogForm, featuredImage: e.target.value })}
                  style={{
                    padding: 12,
                    border: "1px solid var(--brand-border)",
                    borderRadius: 8,
                    fontSize: 14,
                  }}
                />
                <select
                  value={blogForm.status}
                  onChange={(e) => setBlogForm({ ...blogForm, status: e.target.value })}
                  style={{
                    padding: 12,
                    border: "1px solid var(--brand-border)",
                    borderRadius: 8,
                    fontSize: 14,
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

