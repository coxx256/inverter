export function WorkDescription() {
  return (
    <section className="form-section">
      <h2 className="section-title">Work description / service performed</h2>
      <textarea
        className="ruled work-area"
        name="workDescription"
        placeholder="Describe the service work carried out, tests performed, corrective actions taken and the final condition of the unit…"
      />
    </section>
  );
}
