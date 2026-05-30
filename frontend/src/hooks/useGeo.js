import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = (import.meta.env.VITE_API_URL || "") + "/api";

let cached = null; // نتذكر النتيجة طول جلسة الصفحة

const useGeo = () => {
  const [geo, setGeo] = useState(cached);

  useEffect(() => {
    if (cached) return;
    axios.get(`${API_BASE}/geo`)
      .then(({ data }) => {
        cached = data;
        setGeo(data);
      })
      .catch(() => {
        cached = { country: null, countryName: null, city: null };
        setGeo(cached);
      });
  }, []);

  return geo; // { country: "SA", countryName: "Saudi Arabia", city: "Riyadh" }
};

export default useGeo;
