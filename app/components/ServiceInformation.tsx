import { Field } from "./Field";

export function ServiceInformation() {
  return (
    <div className="header-grid">
      <Field
        label="Service type"
        name="serviceType"
        list="service-types"
        className="h-service"
      />
      <Field label="Date" name="date" type="date" className="h-date" />
      <Field label="Site name" name="siteName" className="h-site" />
      <Field label="Serviced by" name="servicedBy" className="h-tech" />
      <Field
        label="Confirmed by"
        name="confirmedBy"
        className="h-confirm"
      />
    </div>
  );
}
