import { Field } from "./Field";

export function UpsInverterDetails() {
  return (
    <section className="form-section">
      <h2 className="section-title">UPS/Inverter details</h2>
      <div className="details-grid">
        <Field label="Make" name="make" className="d-make" />
        <Field label="Model" name="model" className="d-model" />
        <Field label="Serial no." name="serialNo" className="d-serial" />
        <Field label="Capacity" name="capacity" className="d-capacity" />
        <Field
          label="Type"
          name="upsType"
          list="ups-types"
          className="d-type"
        />
        <Field
          label="Battery type"
          name="batteryType"
          list="battery-types"
          className="d-battery-type"
        />
        <Field
          label="No. of batteries"
          name="batteryCount"
          inputMode="numeric"
          className="d-battery-count"
        />
        <Field
          label="Battery rating"
          name="batteryRating"
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
          className="d-warranty"
        />
      </div>
    </section>
  );
}
