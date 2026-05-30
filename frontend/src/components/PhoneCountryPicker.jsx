import { useState, useRef, useEffect } from "react";
import COUNTRIES from "../utils/countries";
import "./PhoneCountryPicker.css";

const FlagImg = ({ code, size = 20 }) => (
  <img
    src={`https://flagcdn.com/w${size}/${code.toLowerCase()}.png`}
    width={size}
    alt={code}
    className="pcp-flag-img"
    onError={(e) => { e.target.style.display = "none"; }}
  />
);

const PhoneCountryPicker = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = COUNTRIES.find((c) => c.dialCode === value && c.code !== "--");

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="pcp-wrapper" ref={ref}>
      <button type="button" className="pcp-trigger" onClick={() => setOpen((o) => !o)}>
        {selected ? <FlagImg code={selected.code} /> : <span>🌐</span>}
        <span className="pcp-code">{selected ? selected.dialCode : "---"}</span>
        <span className="pcp-arrow">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="pcp-dropdown">
          {COUNTRIES.map((c, i) =>
            c.code === "--" ? (
              <div key={i} className="pcp-divider" />
            ) : (
              <div
                key={c.code + i}
                className={`pcp-option${c.dialCode === value && c.code === selected?.code ? " pcp-option--selected" : ""}`}
                onMouseDown={(e) => { e.preventDefault(); onChange(c.dialCode); setOpen(false); }}
              >
                <FlagImg code={c.code} />
                <span className="pcp-name">{c.name}</span>
                <span className="pcp-dial">{c.dialCode}</span>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default PhoneCountryPicker;
