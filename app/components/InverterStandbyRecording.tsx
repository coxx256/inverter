type StandbyFieldProps = {
  label: string;
  name: string;
  type?: "text" | "date" | "time";
  unit?: string;
  wide?: boolean;
  inputMode?: "text" | "decimal" | "numeric";
};

function StandbyField({
  label,
  name,
  type = "text",
  unit,
  wide = false,
  inputMode,
}: StandbyFieldProps) {
  return (
    <label className={`standby-cell${wide ? " standby-cell-wide" : ""}`}>
      <span className="standby-label">{label}</span>
      <span className="standby-control">
        <input
          className="standby-input"
          type={type}
          name={name}
          inputMode={inputMode}
          autoComplete="off"
          spellCheck={false}
        />
        {unit ? <span className="standby-unit">{unit}</span> : null}
      </span>
    </label>
  );
}

const STATUS_OPTIONS = ["Normal", "Fault"];

export function InverterStandbyRecording() {
  return (
    <div className="standby">
      <h3 className="standby-title">Inverter standby recording</h3>
      <div className="standby-table">
        <StandbyField label="Standby Date" name="standbyDate" type="date" />
        <StandbyField label="Standby Time" name="standbyTime" type="time" />
        <StandbyField
          label="Mains Input AC Voltage"
          name="standbyMainsInputVoltage"
          unit="V"
          inputMode="decimal"
        />
        <StandbyField
          label="Inverter Output AC Voltage"
          name="standbyInverterOutputVoltage"
          unit="V"
          inputMode="decimal"
        />
        <StandbyField
          label="Battery Voltage"
          name="standbyBatteryVoltage"
          unit="V"
          inputMode="decimal"
        />
        <StandbyField
          label="Load/Output Amperage"
          name="standbyLoadOutputAmperage"
          unit="A"
          inputMode="decimal"
        />
        <StandbyField
          label="AC Frequency"
          name="standbyAcFrequency"
          unit="Hz"
          inputMode="decimal"
        />

        <div className="standby-cell">
          <span className="standby-label">Inverter Status</span>
          <span className="standby-checks">
            {STATUS_OPTIONS.map((option) => (
              <label className="standby-check" key={option}>
                <input
                  type="checkbox"
                  name="standbyInverterStatus"
                  value={option}
                />
                <span className="standby-box" aria-hidden="true" />
                <span>{option}</span>
              </label>
            ))}
          </span>
        </div>

        <StandbyField
          label="Alarm/Fault Indication"
          name="standbyAlarmFault"
          wide
        />
      </div>
    </div>
  );
}
