import { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import html2canvas from "html2canvas";
import "./brand.css";

export default function App() {
  const [mode, setMode] = useState("login"); // login | register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [me, setMe] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("podaci"); // podaci | merenja
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
  }, []);

  async function loadUserData() {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    try {
      const res = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.authenticated) {
        setMe(data);
        setIsLoggedIn(true);
      } else {
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

  // Ako je korisnik ulogovan, prikaži dashboard
  if (isLoggedIn) {
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
          {mode === "login" ? "BioZen Tracker" : "Kreirajte nalog"}
        </h2>
        <p style={{ 
          margin: 0,
          color: "var(--brand-text-light)",
          fontSize: 15,
          lineHeight: "1.6"
        }}>
          {mode === "login" ? "Ulogujte se u svoj nalog" : "Započnite svoj zdravstveni put"}
        </p>
      </div>

      <form onSubmit={authSubmit}>
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
          {mode === "login" ? "Uloguj se" : "Registruj se"}
        </button>
      </form>

      <button
        onClick={() => setMode(mode === "login" ? "register" : "login")}
        style={{
          marginTop: 16,
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
        {mode === "login"
          ? "Nemaš nalog? Registruj se"
          : "Imaš nalog? Uloguj se"}
      </button>

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
  const chartRef = useRef(null);
  const isMobile = isMobileProp !== undefined ? isMobileProp : window.innerWidth <= 768;

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
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img 
            src="/logo.svg" 
            alt="BioZen Logo" 
            style={{ 
              height: 40,
              display: "block",
            }}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
          <h1 style={{ 
            margin: 0,
            fontSize: 30,
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

      <div style={{ 
        display: "flex", 
        flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? 8 : 12, 
        marginBottom: 24,
        background: "var(--brand-bg-light)",
        padding: 4,
        borderRadius: 12,
        border: "1px solid var(--brand-border)",
      }}>
        <button
          onClick={() => setActiveTab("podaci")}
          style={{
            flex: 1,
            padding: isMobile ? 12 : 14,
            background: activeTab === "podaci" ? "var(--brand-gradient)" : "transparent",
            color: activeTab === "podaci" ? "white" : "var(--brand-text)",
            border: 0,
            borderRadius: 6,
            fontWeight: 600,
            cursor: "pointer",
            fontSize: isMobile ? 14 : 15,
            transition: "all 0.2s",
          }}
        >
          Moji podaci
        </button>
        <button
          onClick={() => setActiveTab("merenja")}
          style={{
            flex: 1,
            padding: isMobile ? 12 : 14,
            background: activeTab === "merenja" ? "var(--brand-gradient)" : "transparent",
            color: activeTab === "merenja" ? "white" : "var(--brand-text)",
            border: 0,
            borderRadius: 6,
            fontWeight: 600,
            cursor: "pointer",
            fontSize: isMobile ? 14 : 15,
            transition: "all 0.2s",
          }}
        >
          Moja merenja
        </button>
      </div>

      {message && (
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
                    data={measurements
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
                      })}
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
    </div>
  );
}


