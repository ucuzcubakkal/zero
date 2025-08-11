import { useEffect, useMemo, useState } from "react";

export default function Home() {
  const [lang, setLang] = useState("auto");
  const [charKey, setCharKey] = useState(null);
  const [tips, setTips] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [savedCount, setSavedCount] = useState(0);
  const [calc, setCalc] = useState(null);
  const [loadingCalc, setLoadingCalc] = useState(false);

  // ---- KARAKTERLER ----
  const chars = useMemo(() => ([
    { key:"explorer", name:"Green Explorer", desc:"Discover low-impact travel & daily habits.", img:"🌿" },
    { key:"saver", name:"Energy Saver", desc:"Cut home energy and bills with smart moves.", img:"⚡" },
    { key:"recycler", name:"Recycle Master", desc:"Reduce waste, reuse more, recycle right.", img:"♻️" }
  ]), []);

  useEffect(() => {
    // lang from storage
    const l = localStorage.getItem("zero_lang") || "auto";
    setLang(l);
    // character
    const c = localStorage.getItem("zero_char");
    if (c) setCharKey(c);
    // saved tips
    setSavedCount(parseInt(localStorage.getItem("zero_saved_count") || "0", 10));
    // CSV’leri yükle
    loadTips();
    loadSponsors();
  }, []);

  useEffect(() => {
    translateAll();
  }, [lang]);

  // ---- ÇEVİRİ ----
  async function translateAll() {
    const target = lang === "auto" ? (navigator.language || "en").split("-")[0] : lang;
    if (target === "en") return;
    const nodes = Array.from(document.querySelectorAll("[data-tr]"));
    const texts = nodes.map((n) => n.innerText.trim());
    if (!texts.length) return;
    const r = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts, target })
    });
    const { translations } = await r.json();
    nodes.forEach((n, i) => {
      if (translations[i]) n.innerText = translations[i];
    });
  }

  // ---- CSV ----
  async function loadTips() {
    try {
      const res = await fetch("/tips.csv?cache=" + Date.now());
      const txt = await res.text();
      const rows = txt.split(/\r?\n/).map((r) => r.trim()).filter(Boolean);
      const items = rows.slice(1).map((r) => {
        const i = r.indexOf(",");
        if (i < 0) return null;
        const l = r.slice(0, i).trim();
        const tip = r.slice(i + 1).trim();
        return { lang: l.toLowerCase(), tip };
      }).filter(Boolean);
      // hedef dilde varsa onu; yoksa EN çevir
      const target = (lang === "auto" ? (navigator.language || "en").split("-")[0] : lang);
      let result = items.filter((x) => x.lang === target).map((x) => x.tip);
      if (!result.length) {
        const enTips = items.filter((x) => x.lang === "en").map((x) => x.tip);
        if (target !== "en" && enTips.length) {
          const r = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ texts: enTips, target })
          });
          const { translations } = await r.json();
          result = translations;
        } else {
          result = enTips;
        }
      }
      setTips(result);
    } catch {
      setTips([]);
    }
  }

  async function loadSponsors() {
    try {
      const res = await fetch("/sponsors.csv?cache=" + Date.now());
      const txt = await res.text();
      const rows = txt.split(/\r?\n/).map((r) => r.trim()).filter(Boolean);
      const items = rows.slice(1).map((r) => {
        const cols = r.split(",");
        return { title: (cols[0] || "").trim(), url: (cols[1] || "").trim(), image: (cols[2] || "").trim() };
      }).filter((x) => x.title);
      // başlıkları da çevir
      const target = (lang === "auto" ? (navigator.language || "en").split("-")[0] : lang);
      if (target !== "en" && items.length) {
        const r = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texts: items.map(i => i.title), target })
        });
        const { translations } = await r.json();
        translations.forEach((t, i) => items[i].title = t || items[i].title);
      }
      setSponsors(items);
    } catch {
      setSponsors([]);
    }
  }

  // ---- TIP SAVE ----
  function saveTip() {
    const k = "zero_saved_count";
    const n = parseInt(localStorage.getItem(k) || "0", 10) + 1;
    localStorage.setItem(k, String(n));
    setSavedCount(n);
  }

  // ---- CHARACTER ----
  function chooseChar(key) {
    setCharKey(key);
    localStorage.setItem("zero_char", key);
  }

  // ---- CALC ----
  async function calculate(payload) {
    setLoadingCalc(true);
    try {
      const r = await fetch("/api/carbon/calc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await r.json();
      setCalc(data);
    } catch (e) {
      setCalc({ error: e.message });
    } finally {
      setLoadingCalc(false);
    }
  }

  // Basit form state
  const [form, setForm] = useState({
    country: "",
    carKmWeek: 0, carType: "petrol",
    publicKmWeek: 0,
    flightsShortPerYear: 0, flightsLongPerYear: 0,
    electricKwhMonth: 0, gasM3Month: 0, renewableShare: 0,
    dietType: "omnivore",
    plasticItemsWeek: 0
  });

  function setF(k, v) { setForm((s) => ({ ...s, [k]: v })); }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 20, color: "#fff", fontFamily: "system-ui" }}>
      <Header lang={lang} setLang={(v)=>{ localStorage.setItem("zero_lang", v); setLang(v); loadTips(); loadSponsors(); }} />
      <Hero />

      {/* Character */}
      <Section title="Choose Your Character" sub="Personalize your journey for better tips.">
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))" }}>
          {chars.map(ch => (
            <div key={ch.key} style={{
              border: "1px solid #1f3c31", background: "#0d261f", borderRadius: 12, padding: 12
            }}>
              <div style={{ fontSize: 32 }}>{ch.img}</div>
              <div style={{ fontWeight: 700 }} data-tr>{ch.name}</div>
              <div className="muted" data-tr>{ch.desc}</div>
              <button style={{ marginTop: 8, background: charKey===ch.key ? "#7be495" : "#1e8f68" }}
                onClick={()=>chooseChar(ch.key)} data-tr>
                {charKey===ch.key ? "Selected" : "Select"}
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* Calculator */}
      <Section title="Carbon Footprint Calculator" sub="Estimate your yearly emissions.">
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <Input label="Country (optional)" value={form.country} onChange={(v)=>setF("country", v)} />
          <Select label="Diet" value={form.dietType} onChange={(v)=>setF("dietType", v)}
                  options={[["omnivore","Omnivore"],["vegetarian","Vegetarian"],["vegan","Vegan"]]} />
          <InputNum label="Car km/week" value={form.carKmWeek} onChange={(v)=>setF("carKmWeek", v)} />
          <Select label="Car type" value={form.carType} onChange={(v)=>setF("carType", v)}
                  options={[["petrol","Petrol"],["diesel","Diesel"],["hybrid","Hybrid"],["ev","EV"]]} />
          <InputNum label="Public transport km/week" value={form.publicKmWeek} onChange={(v)=>setF("publicKmWeek", v)} />
          <InputNum label="Short flights per year" value={form.flightsShortPerYear} onChange={(v)=>setF("flightsShortPerYear", v)} />
          <InputNum label="Long flights per year" value={form.flightsLongPerYear} onChange={(v)=>setF("flightsLongPerYear", v)} />
          <InputNum label="Electricity kWh/month" value={form.electricKwhMonth} onChange={(v)=>setF("electricKwhMonth", v)} />
          <InputNum label="Natural gas m³/month" value={form.gasM3Month} onChange={(v)=>setF("gasM3Month", v)} />
          <InputNum label="Renewable share (0-1)" value={form.renewableShare} onChange={(v)=>setF("renewableShare", v)} />
          <InputNum label="Plastic items/week" value={form.plasticItemsWeek} onChange={(v)=>setF("plasticItemsWeek", v)} />
        </div>
        <button style={{ marginTop: 10 }} onClick={() => {
          calculate({
            profile: { country: form.country },
            transport: {
              carKmWeek: +form.carKmWeek, carType: form.carType,
              publicKmWeek: +form.publicKmWeek,
              flightsShortPerYear: +form.flightsShortPerYear,
              flightsLongPerYear: +form.flightsLongPerYear
            },
            energy: {
              electricKwhMonth: +form.electricKwhMonth,
              gasM3Month: +form.gasM3Month,
              renewableShare: +form.renewableShare
            },
            diet: { type: form.dietType },
            waste: { plasticItemsWeek: +form.plasticItemsWeek },
            useExternalApi: false
          });
        }} data-tr>
          Calculate
        </button>

        {loadingCalc && <p data-tr>Calculating…</p>}
        {calc && !calc.error && (
          <div style={{ marginTop: 10, border: "1px solid #1f3c31", background: "#0d261f", borderRadius: 12, padding: 12 }}>
            <div><b data-tr>Total</b>: {calc.totalKg} <span data-tr>kg CO₂e/year</span></div>
            <div className="muted">
              <div data-tr>Transport</div> {calc.breakdown.transportKg}
              &nbsp;|&nbsp;<span data-tr>Energy</span> {calc.breakdown.energyKg}
              &nbsp;|&nbsp;<span data-tr>Diet</span> {calc.breakdown.dietKg}
              &nbsp;|&nbsp;<span data-tr>Waste</span> {calc.breakdown.wasteKg}
            </div>
          </div>
        )}
        {calc && calc.error && <p style={{ color: "#f88" }}>{calc.error}</p>}
      </Section>

      {/* Tips */}
      <Section title="Quick Eco Tips" sub="Save tips as you try them.">
        <div style={{ display: "grid", gap: 10 }}>
          {tips.length ? tips.map((t, i) => (
            <div key={i} style={{ borderLeft: "3px solid #7be495", paddingLeft: 10 }}>
              <div>{t}</div>
              <button className="ghost" style={{ marginTop: 6, background: "transparent", border: "1px solid #26453b", color: "#b6d5ca" }}
                onClick={saveTip} data-tr>✓ Saved</button>
            </div>
          )) : <div className="muted" data-tr>tips.csv could not be loaded.</div>}
        </div>
        <div style={{ marginTop: 8 }} className="muted" data-tr>Saved count:</div>
        <div style={{ fontWeight: 700 }}>{savedCount}</div>
      </Section>

      {/* Sponsors */}
      <Section title="Sponsors" sub="Partners supporting sustainable living.">
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))" }}>
          {sponsors.length ? sponsors.map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noreferrer"
              style={{ border: "1px solid #1f3c31", background: "#0d261f", borderRadius: 12, padding: 12, display: "flex", gap: 10, alignItems: "center" }}>
              <img src={s.image} alt="" style={{ width: 46, height: 46, objectFit: "contain", background: "#062018", borderRadius: 10, border: "1px solid #15392e" }} />
              <div>
                <div style={{ fontWeight: 700 }}>{s.title}</div>
                <div className="muted" style={{ fontSize: 13 }}>{s.url}</div>
              </div>
            </a>
          )) : <div className="muted" data-tr>sponsors.csv could not be loaded.</div>}
        </div>
      </Section>

      <Footer />
      <style jsx>{`
        .muted { color: #b6d5ca; }
      `}</style>
    </div>
  );
}

function Header({ lang, setLang }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
      <div>
        <div style={{ fontWeight: 800 }} data-tr>Zero – Eco Lifestyle Coach</div>
        <div className="muted" data-tr>Track Your Eco Impact</div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="ghost" onClick={()=>setLang("auto")} data-tr>Auto</button>
        <button className="ghost" onClick={()=>setLang("en")}>EN</button>
        <button className="ghost" onClick={()=>setLang("tr")}>TR</button>
        <button className="ghost" onClick={()=>setLang("de")}>DE</button>
        <button className="ghost" onClick={()=>setLang("ar")}>AR</button>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <div style={{ border: "1px solid #1f3c31", background: "#112a22aa", borderRadius: 16, padding: 20, marginBottom: 16 }}>
      <h1 data-tr>Welcome to Zero – Eco Lifestyle Coach</h1>
      <p className="muted" data-tr>
        Calculate your carbon footprint, get personalized eco tips, and track your progress — in any language, anywhere.
      </p>
      <a href="/admin" className="muted" style={{ textDecoration: "underline" }} data-tr>Admin</a>
    </div>
  );
}

function Section({ title, sub, children }) {
  return (
    <div style={{ border: "1px solid #1f3c31", background: "#0d261f", borderRadius: 16, padding: 16, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h3 data-tr>{title}</h3>
      </div>
      <p className="muted" data-tr>{sub}</p>
      {children}
    </div>
  );
}

function Input({ label, value, onChange }) {
  return (
    <label className="muted">
      <div data-tr>{label}</div>
      <input value={value} onChange={(e)=>onChange(e.target.value)}
        style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #244a3d", background: "#0a231c", color: "#fff" }} />
    </label>
  );
}
function InputNum({ label, value, onChange }) {
  return <Input label={label} value={value} onChange={(v)=>onChange(Number(v))} />;
}
function Select({ label, value, onChange, options }) {
  return (
    <label className="muted">
      <div data-tr>{label}</div>
      <select value={value} onChange={(e)=>onChange(e.target.value)}
        style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #244a3d", background: "#0a231c", color: "#fff" }}>
        {options.map(([val, text]) => <option key={val} value={val}>{text}</option>)}
      </select>
    </label>
  );
}
function Footer() {
  return (
    <div style={{ marginTop: 20, color: "#b6d5ca", display: "flex", gap: 12, flexWrap: "wrap" }}>
      <a href="/privacy.html" className="muted" data-tr>Privacy</a>
      <a href="/terms.html" className="muted" data-tr>Terms</a>
      <span>© {new Date().getFullYear()} Zero</span>
    </div>
  );
}
