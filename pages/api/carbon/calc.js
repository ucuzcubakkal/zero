// İstek örneği (POST JSON):
// {
//  "profile": { "country":"TR" },
//  "transport": { "carKmWeek": 120, "carType":"petrol", "publicKmWeek": 30, "flightsShortPerYear":2, "flightsLongPerYear":0 },
//  "energy": { "electricKwhMonth": 220, "gasM3Month": 20, "renewableShare": 0.0 },
//  "diet": { "type":"omnivore" },
//  "waste": { "plasticItemsWeek": 5 },
//  "useExternalApi": false
// }

export default async function handler(req, res) {
  try {
    const {
      profile = {},
      transport = {},
      energy = {},
      diet = {},
      waste = {},
      useExternalApi = false
    } = req.body || {};

    // 1) KATSAYILAR
    const local = await fetch(process.env.NEXT_PUBLIC_SITE_URL
      ? process.env.NEXT_PUBLIC_SITE_URL + "/api/carbon/factors"
      : "http://localhost:3000/api/carbon/factors").catch(()=>null);

    const localJson = local ? await local.json() : { factors: {} };
    let { factors } = localJson;

    // 2) ÜLKEYE GÖRE ELEKTRİK YOĞUNLUĞU (opsiyonel dış API ile iyileştir)
    // (İstersen Climatiq/Carbon Interface bağlayıp ülkeye özel grid intensity çekebiliriz)
    // Bu örnekte default factors kalıyor. useExternalApi true + API key varsa geliştirebilirsin.

    // 3) Basit hesaplama
    // --- Transport ---
    const carKmWeek = +(transport.carKmWeek || 0);
    const carType = (transport.carType || "petrol").toLowerCase();
    const carKgPerKm = factors.transport.car[carType] || factors.transport.car.petrol;

    const publicKmWeek = +(transport.publicKmWeek || 0);
    const publicKgPerKm = 0.07; // karışık toplu taşıma ortalaması

    const shortFlights = +(transport.flightsShortPerYear || 0);
    const longFlights = +(transport.flightsLongPerYear || 0);
    const shortFlightKm = 1000; // kaba ortalama
    const longFlightKm = 6000;

    const transportKgYear =
      carKmWeek * 52 * carKgPerKm +
      publicKmWeek * 52 * publicKgPerKm +
      shortFlights * shortFlightKm * factors.transport.shortFlight +
      longFlights * longFlightKm * factors.transport.longFlight;

    // --- Energy ---
    const kwh = +(energy.electricKwhMonth || 0) * 12;
    const gas = +(energy.gasM3Month || 0) * 12;
    const renewableShare = Math.max(0, Math.min(1, +(energy.renewableShare || 0)));
    const elecKgPerKwhAdj = factors.energy.electricityKgPerKwh * (1 - renewableShare);
    const energyKgYear = kwh * elecKgPerKwhAdj + gas * factors.energy.naturalGasKgPerM3;

    // --- Diet ---
    const dietType = (diet.type || "omnivore").toLowerCase();
    const dietDaily = factors.dietDailyKg[dietType] || factors.dietDailyKg.omnivore;
    const dietKgYear = dietDaily * 365;

    // --- Waste ---
    const plasticItemsWeek = +(waste.plasticItemsWeek || 0);
    const wasteKgYear = plasticItemsWeek * 52 * factors.plasticsKgPerItem;

    const totalKg = transportKgYear + energyKgYear + dietKgYear + wasteKgYear;

    res.status(200).json({
      unit: "kgCO2e/year",
      totalKg: round(totalKg),
      breakdown: {
        transportKg: round(transportKgYear),
        energyKg: round(energyKgYear),
        dietKg: round(dietKgYear),
        wasteKg: round(wasteKgYear)
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

function round(n) { return Math.round(n * 100) / 100; }
