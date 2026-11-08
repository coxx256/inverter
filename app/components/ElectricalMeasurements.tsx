import { MEASUREMENTS } from "./data";
import { InverterStandbyRecording } from "./InverterStandbyRecording";

export function ElectricalMeasurements() {
  return (
    <section className="form-section">
      <h2 className="section-title">Measurements &amp; test readings</h2>
      <div className="measure-grid">
        {MEASUREMENTS.map((measurement) => (
          <label className="measure" key={measurement.name}>
            <span className="measure-label">{measurement.label}</span>
            <span className="measure-value">
              <input
                type="text"
                name={measurement.name}
                inputMode="decimal"
                placeholder="—"
                autoComplete="off"
              />
              <span className="measure-unit">{measurement.unit}</span>
            </span>
          </label>
        ))}
        <label className="measure measure-wide">
          <span className="measure-label">Test remarks</span>
          <span className="measure-value">
            <input
              type="text"
              name="testRemarks"
              placeholder="Observations from the performance test…"
              autoComplete="off"
            />
          </span>
        </label>
      </div>
      <InverterStandbyRecording />
    </section>
  );
}
