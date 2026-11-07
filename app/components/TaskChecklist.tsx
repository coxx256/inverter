import { Fragment } from "react";

import { ChecklistLegend } from "./ChecklistLegend";
import { CHECKLIST_GROUPS, STATUS_OPTIONS } from "./data";

export function TaskChecklist() {
  return (
    <section className="form-section">
      <h2 className="section-title">Service checklist</h2>
      <div className="checklist">
        <ChecklistLegend />

        {CHECKLIST_GROUPS.map((group) => (
          <Fragment key={group.title}>
            <div className="cl-group">{group.title}</div>
            {group.items.map((item) => (
              <div className="cl-row" key={item.number}>
                <div className="cl-name">
                  <span className="cl-number">
                    {String(item.number).padStart(2, "0")}
                  </span>
                  <span>{item.text}</span>
                </div>
                {STATUS_OPTIONS.map((option) => (
                  <label className="cl-opt" key={option.value}>
                    <input
                      type="radio"
                      name={`check-${item.number}`}
                      value={option.value}
                      aria-label={`${item.text} — ${option.label}`}
                    />
                    <span className="cl-box" aria-hidden="true" />
                    <span className="cl-tag" aria-hidden="true">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            ))}
          </Fragment>
        ))}
      </div>
    </section>
  );
}
