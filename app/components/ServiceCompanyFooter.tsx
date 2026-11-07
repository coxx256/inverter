export function ServiceCompanyFooter() {
  return (
    <footer className="doc-footer">
      <div className="company-band">
        <div className="company-main">
          <span className="company-logo" aria-hidden="true">
            LOGO
          </span>
          <div className="company-name-wrap">
            <span className="company-eyebrow">Service provider</span>
            <input
              className="company-name"
              type="text"
              name="companyName"
              defaultValue="S&N Automotive Engineering Ltd"
              aria-label="Service company name"
              autoComplete="off"
            />
            <input
              className="company-tagline"
              type="text"
              name="companyTagline"
              placeholder="UPS & Inverter Sales · Installation · Maintenance · AMC"
              aria-label="Company services"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="company-contact">
          <label className="contact-line">
            <span>Phone</span>
            <input
              type="tel"
              name="companyPhone"
              defaultValue="+256-779 210 376"
              autoComplete="off"
            />
          </label>
          <label className="contact-line">
            <span>Email</span>
            <input
              type="email"
              name="companyEmail"
              defaultValue="snauto.ltd@gmail.com"
              autoComplete="off"
            />
          </label>
        </div>
      </div>

      <div className="sign-grid">
        <div className="sign-block">
          <span className="sign-role">Serviced by</span>
          <input
            className="sign-name"
            type="text"
            name="servicedByName"
            placeholder="Name / designation"
            aria-label="Serviced by name"
            autoComplete="off"
          />
          <div className="sign-space" aria-hidden="true" />
          <div className="sign-caption">
            <span>Signature</span>
            <span>Date</span>
          </div>
        </div>

        <div className="sign-block">
          <span className="sign-role">Confirmed by</span>
          <input
            className="sign-name"
            type="text"
            name="confirmedByName"
            placeholder="Name / designation"
            aria-label="Confirmed by name"
            autoComplete="off"
          />
          <div className="sign-space" aria-hidden="true" />
          <div className="sign-caption">
            <span>Signature</span>
            <span>Date</span>
          </div>
        </div>

        <div className="sign-block">
          <span className="sign-role">Customer acknowledgement</span>
          <input
            className="sign-name"
            type="text"
            name="customerName"
            placeholder="Customer name"
            aria-label="Customer name"
            autoComplete="off"
          />
          <div className="sign-space" aria-hidden="true" />
          <div className="sign-caption">
            <span>Signature</span>
            <span>Date</span>
          </div>
        </div>
      </div>

      <div className="footer-note">
        <span>
          Customer acknowledgement: the service described above has been
          completed and verified.
        </span>
        <span className="form-code">Form JC-UPS-01 · Rev. 1.0</span>
      </div>
    </footer>
  );
}
