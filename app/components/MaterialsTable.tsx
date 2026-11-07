import { MATERIAL_ROWS } from "./data";

export function MaterialsTable() {
  return (
    <section className="form-section">
      <h2 className="section-title">Materials / spare parts replaced</h2>
      <div className="materials-table">
        <div className="mat-head" aria-hidden="true">
          <span>Sr.</span>
          <span>Material / description</span>
          <span>Qty</span>
          <span>Unit</span>
          <span>Remarks</span>
        </div>
        {MATERIAL_ROWS.map((row) => (
          <div className="mat-row" key={row}>
            <span className="mat-sr">{row}</span>
            <label className="mat-desc">
              <span className="m-cap">Material / description</span>
              <input
                type="text"
                name={`material-${row}-description`}
                placeholder={row === 1 ? "e.g. 12 V / 100 Ah SMF battery" : ""}
                autoComplete="off"
              />
            </label>
            <label className="mat-qty">
              <span className="m-cap">Qty</span>
              <input
                type="text"
                name={`material-${row}-qty`}
                inputMode="numeric"
                autoComplete="off"
              />
            </label>
            <label className="mat-unit">
              <span className="m-cap">Unit</span>
              <input
                type="text"
                name={`material-${row}-unit`}
                placeholder={row === 1 ? "pcs" : ""}
                autoComplete="off"
              />
            </label>
            <label className="mat-rem">
              <span className="m-cap">Remarks</span>
              <input
                type="text"
                name={`material-${row}-remarks`}
                autoComplete="off"
              />
            </label>
          </div>
        ))}
      </div>
    </section>
  );
}
