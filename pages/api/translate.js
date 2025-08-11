export default async function handler(req, res) {
  try {
    const { texts, target, source = "en" } = req.body || {};
    if (!texts || !Array.isArray(texts) || !target) {
      return res.status(400).json({ error: "texts[] and target are required" });
    }
    const KEY =
      process.env.GOOGLE_TRANSLATE_API_KEY ||
      "AIzaSyBmV41DxgaElPcfAH-Bstv9ZI0Qn1reVaQ"; // fallback (hemen çalışsın diye)

    const r = await fetch(
      "https://translation.googleapis.com/language/translate/v2?key=" + KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: texts, source, target, format: "text" })
      }
    );
    const d = await r.json();
    const arr = d?.data?.translations?.map((t) => t.translatedText) || texts;
    res.status(200).json({ translations: arr });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
