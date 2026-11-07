export function DeficienciesSection() {
  return (
    <section className="mini-section">
      <h2 className="section-title">Deficiencies / observations</h2>
      <textarea
        className="ruled short-area"
        name="deficiencies"
        placeholder="Note any defects, abnormal readings or unsafe conditions found during the inspection…"
      />
    </section>
  );
}
