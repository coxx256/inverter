import { Field } from "./Field";

export function ServiceInformation() {
  return (
    <div className="header-grid">
      <Field
        label="Service type"
        name="serviceType"
        placeholder="Preventive / Breakdown / Installation"
        list="service-types"
        className="h-service"
      />
      <Field label="Date" name="date" type="date" className="h-date" />
      <Field
        label="Site name"
        name="siteName"
        placeholder="Customer site / location"
        className="h-site"
      />
      <Field
        label="Serviced by"
        name="servicedBy"
        placeholder="Technician"
        className="h-tech"
      />
      <Field
        label="Confirmed by"
        name="confirmedBy"
        placeholder="Supervisor / customer"
        className="h-confirm"
      />
    </div>
  );
}
