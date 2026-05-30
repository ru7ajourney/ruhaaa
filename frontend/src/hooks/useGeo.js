import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = (import.meta.env.VITE_API_URL || "") + "/api";

let cached = null;

const useGeo = () => {
  const [geo, setGeo] = useState(cached);

  useEffect(() => {
    if (cached) return;

    const fetchGeo = async () => {
      // أولاً: جرب البيكند
      try {
        const { data } = await axios.get(`${API_BASE}/geo`, { timeout: 4000 });
        if (data?.country) {
          cached = data;
          setGeo(data);
          return;
        }
      } catch { /* سنحاول الطريقة الثانية */ }

      // ثانياً: fallback مباشر من الفرونتند (HTTPS، مجاني)
      try {
        const { data } = await axios.get("https://ipwho.is/", { timeout: 4000 });
        if (data?.country_code) {
          cached = { country: data.country_code, countryName: data.country, city: data.city };
          setGeo(cached);
          return;
        }
      } catch { /* فشل الاثنان */ }

      cached = { country: null, countryName: null, city: null };
      setGeo(cached);
    };

    fetchGeo();
  }, []);

  return geo;
};

export default useGeo;
