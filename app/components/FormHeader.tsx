import { ServiceInformation } from "./ServiceInformation";

export function FormHeader() {
  return (
    <header className="doc-header">
      <div className="doc-meta">
        <span className="doc-eyebrow">
          <span className="doc-dot" aria-hidden="true" />
          Service &amp; maintenance record
        </span>
        <label className="job-number">
          <span>Job card no.</span>
          <input
            type="text"
            name="jobCardNo"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
      </div>

      <h1 className="doc-title">UPS/INVERTER SERVICE CHECKLIST/FORM</h1>

      <ServiceInformation />
    </header>
  );
}
