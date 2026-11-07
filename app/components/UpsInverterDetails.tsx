import { Field } from "./Field";

export function UpsInverterDetails() {
  return (
    <section className="form-section">
      <h2 className="section-title">UPS/Inverter details</h2>
      <div className="details-grid">
        <Field
          label="Make"
          name="make"
          placeholder="e.g. APC, Eaton, Vertiv"
          className="d-make"
        />
        <Field
          label="Model"
          name="model"
          placeholder="Model / catalogue number"
          className="d-model"
        />
        <Field
          label="Serial no."
          name="serialNo"
          placeholder="Serial number"
          className="d-serial"
        />
        <Field
          label="Capacity"
          name="capacity"
          placeholder="e.g. 10 kVA"
          className="d-capacity"
        />
        <Field
          label="Type"
          name="upsType"
          placeholder="Online UPS"
          list="ups-types"
          className="d-type"
        />
        <Field
          label="Battery type"
          name="batteryType"
          placeholder="SMF / tubular / lithium"
          list="battery-types"
          className="d-battery-type"
        />
        <Field
          label="No. of batteries"
          name="batteryCount"
          placeholder="e.g. 16"
          inputMode="numeric"
          className="d-battery-count"
        />
        <Field
          label="Battery rating"
          name="batteryRating"
          placeholder="12 V / 100 Ah"
          className="d-battery-rating"
        />
        <Field
          label="Installation date"
          name="installationDate"
          type="date"
          className="d-install"
        />
        <Field
          label="AMC / warranty status"
          name="warrantyStatus"
          placeholder="Under warranty / AMC valid till…"
          className="d-warranty"
        />
      </div>
    </section>
  );
}
