import { useEffect, useState } from "react";

export default function Admin() {
  const [lang, setLang] = useState("auto");
  const [tips, setTips] = useState([]);
  const [sps, setSps] = useState([]);

  useEffect(() => { loadTips(); loadSps(); }, []);
  useEffect(() => { translateAll(); }, [lang]);

  async function translateAll() {
    const target = lang === "auto" ? (navigator.language || "en").split("-")[0] : lang;
    if (target === "en") return;
    const nodes = Array.from(document.querySelectorAll("[data-tr]"));
    const texts = nodes.map((n) => n.innerText.trim());
    if (!texts.length) return;
    const r = await fetch("/api/translate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts, target })
    });
    const { translations } = await r.json();
    nodes.forEach((n, i) => { if (translations[i]) n.innerText = translations[i]; });
  }

  // CSV parse/serialize
  function parseCSV(txt) {
    const rows = txt.split(/\r?\n/).filter(x => x.trim());
    const header = rows.shift().split(",").map(s => s.trim());
    return rows.map(line => {
      const cols = line.split(",");
      const obj = {}; header.forEach((h, i) => obj[h] = (cols[i] || "").trim());
      return obj;
    });
  }
  function toCSV(header, data) {
    const head = header.join(",");
    const lines = data.map(r => header.map(h => (r[h] || "").replace(/[\r\n]+/g, " ")).join(","));
    return head + "\n" + lines.join("\n");
  }
  function download(name, content) {
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 300);
  }

  async function loadTips() {
    try {
      const res = await fetch("/tips.csv?cache=" + Date.now());
      const txt = await res.text();
      setTips(parseCSV(txt));
    } catch { setTips([]); }
  }
  async function loadSps() {
    try {
      const res = await fetch("/sponsors.csv?cache=" + Date.now());
      const txt = await res.text();
      setSps(parseCSV(txt));
    } catch { setSps([]); }
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 20, fontFamily: "system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 data-tr>Zero – Admin Panel</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={()=>setLang("auto")} data-tr>Auto</button>
          <button onClick={()=>setLang("en")}>EN</button>
          <button onClick={()=>setLang("tr")}>TR</button>
          <button onClick={()=>setLang("de")}>DE</button>
          <button onClick={()=>setLang("ar")}>AR</button>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 10, padding: 14, marginTop: 10 }}>
        <h2 data-tr>Tips (tips.csv)</h2>
        <p data-tr>Columns: lang, tip</p>
        <button onClick={() => setTips([...tips, { lang: "en", tip: "" }])} data-tr>+ Add row</button>
        <button
          onClick={() => download("tips.csv", toCSV(["lang", "tip"], tips))}
          style={{ marginLeft: 8 }} data-tr>Save & Download CSV</button>
        <a href="/tips.csv" target="_blank" rel="noreferrer" style={{ marginLeft: 8 }} data-tr>Open current tips.csv</a>
        <table style={{ width: "100%", marginTop: 8, borderCollapse: "collapse" }}>
          <thead>
            <tr><th data-tr>lang</th><th data-tr>tip</th><th data-tr>del</th></tr>
          </thead>
          <tbody>
            {tips.map((r, i) => (
              <tr key={i}>
                <td><input value={r.lang} onChange={(e)=>{ const v=[...tips]; v[i].lang=e.target.value; setTips(v);} } /></td>
                <td><textarea rows={2} value={r.tip} onChange={(e)=>{ const v=[...tips]; v[i].tip=e.target.value; setTips(v);} } /></td>
                <td><button onClick={()=>{ const v=[...tips]; v.splice(i,1); setTips(v);} } data-tr>del</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ background: "#fff", borderRadius: 10, padding: 14, marginTop: 16 }}>
        <h2 data-tr>Sponsors (sponsors.csv)</h2>
        <p data-tr>Columns: title, url, image</p>
        <button onClick={() => setSps([...sps, { title: "", url: "https://", image: "" }])} data-tr>+ Add row</button>
        <button
          onClick={() => download("sponsors.csv", toCSV(["title", "url", "image"], sps))}
          style={{ marginLeft: 8 }} data-tr>Save & Download CSV</button>
        <a href="/sponsors.csv" target="_blank" rel="noreferrer" style={{ marginLeft: 8 }} data-tr>Open current sponsors.csv</a>
        <table style={{ width: "100%", marginTop: 8, borderCollapse: "collapse" }}>
          <thead>
            <tr><th data-tr>title</th><th data-tr>url</th><th data-tr>image</th><th data-tr>del</th></tr>
          </thead>
          <tbody>
            {sps.map((r, i) => (
              <tr key={i}>
                <td><input value={r.title} onChange={(e)=>{ const v=[...sps]; v[i].title=e.target.value; setSps(v);} } /></td>
                <td><input value={r.url} onChange={(e)=>{ const v=[...sps]; v[i].url=e.target.value; setSps(v);} } /></td>
                <td><input value={r.image} onChange={(e)=>{ const v=[...sps]; v[i].image=e.target.value; setSps(v);} } /></td>
                <td><button onClick={()=>{ const v=[...sps]; v.splice(i,1); setSps(v);} } data-tr>del</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 16 }}>
        <a href="/" data-tr>Back to app</a>
      </p>
    </div>
  );
}
