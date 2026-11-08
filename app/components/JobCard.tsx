"use client";

import { DeficienciesSection } from "./DeficienciesSection";
import { ElectricalMeasurements } from "./ElectricalMeasurements";
import { FormHeader } from "./FormHeader";
import { MaterialsTable } from "./MaterialsTable";
import { RecommendationsSection } from "./RecommendationsSection";
import { ServiceCompanyFooter } from "./ServiceCompanyFooter";
import { TaskChecklist } from "./TaskChecklist";
import { UpsInverterDetails } from "./UpsInverterDetails";
import { WorkDescription } from "./WorkDescription";
import { PrinterIcon, ResetIcon } from "./icons";

export function JobCard() {
  return (
    <div className="app-shell">
      <header className="app-bar">
        <div className="app-brand">
          <span className="app-mark" aria-hidden="true">
            JC
          </span>
          <div className="app-brand-text">
            <p className="app-title">Service Job Card</p>
            <p className="app-subtitle">UPS / Inverter maintenance checklist</p>
          </div>
        </div>

        <div className="app-actions">
          <button className="btn btn-ghost" type="reset" form="job-card-form">
            <ResetIcon />
            <span className="btn-label">Reset</span>
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => window.print()}
          >
            <PrinterIcon />
            <span className="btn-label">Print / Save PDF</span>
          </button>
        </div>
      </header>

      <main className="page-stage">
        <form
          className="sheet"
          id="job-card-form"
          onSubmit={(event) => event.preventDefault()}
        >
          <FormHeader />
          <UpsInverterDetails />
          <TaskChecklist />
          <ElectricalMeasurements />
          <WorkDescription />
          <MaterialsTable />

          <div className="two-col">
            <DeficienciesSection />
            <RecommendationsSection />
          </div>

          <ServiceCompanyFooter />

          <datalist id="service-types">
            <option value="Preventive maintenance" />
            <option value="Breakdown call" />
            <option value="Installation" />
            <option value="Commissioning" />
            <option value="AMC visit" />
          </datalist>
          <datalist id="ups-types">
            <option value="Online UPS" />
            <option value="Offline UPS" />
            <option value="Line-interactive UPS" />
            <option value="Inverter" />
            <option value="Hybrid inverter" />
          </datalist>
          <datalist id="battery-types">
            <option value="SMF / VRLA" />
            <option value="Tubular" />
            <option value="Lithium-ion" />
            <option value="Other" />
          </datalist>
        </form>
      </main>
    </div>
  );
}
