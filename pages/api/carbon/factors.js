// Basit, güvenli default katsayılar (kg CO2e birimleri)
const factors = {
  transport: {
    car: { petrol: 0.192, diesel: 0.171, hybrid: 0.120, ev: 0.050 }, // km başına
    bus: 0.089,
    metro: 0.041,
    train: 0.035,
    shortFlight: 0.158, // km başına (~<1500km)
    longFlight: 0.150   // km başına
  },
  energy: {
    // Ortalama global grid yoğunluğu (ülkelere göre API ile override edilebilir)
    electricityKgPerKwh: 0.475,
    naturalGasKgPerM3: 2.0
  },
  dietDailyKg: { // günlük kişi başı
    omnivore: 3.0,
    vegetarian: 2.0,
    vegan: 1.6
  },
  plasticsKgPerItem: 0.08
};

export default function handler(req, res) {
  res.status(200).json({ factors });
}
