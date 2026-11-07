export type ChecklistItem = {
  number: number;
  text: string;
};

export type ChecklistGroup = {
  title: string;
  items: ChecklistItem[];
};

const CHECKLIST_SOURCE = [
  {
    title: "General & visual inspection",
    items: [
      "Physical condition of UPS / inverter, enclosure and wiring",
      "Unit, air vents and surrounding area cleaned",
      "Cooling fan operation and airflow",
      "Alarm, fault or warning indications on the panel",
    ],
  },
  {
    title: "Electrical & performance",
    items: [
      "Input voltage and frequency within acceptable range",
      "Output voltage and frequency stable under load",
      "Load current and load percentage within rated limits",
      "Transfer to battery mode on mains failure",
      "Overload and short-circuit protection tested",
    ],
  },
  {
    title: "Battery system",
    items: [
      "Battery bank voltage and charging current",
      "Battery terminals clean, tight and free from corrosion",
      "Battery backup time / load test",
    ],
  },
];

let checklistNumber = 0;

export const CHECKLIST_GROUPS: ChecklistGroup[] = CHECKLIST_SOURCE.map(
  (group) => ({
    title: group.title,
    items: group.items.map((text) => ({
      text,
      number: ++checklistNumber,
    })),
  }),
);

export const STATUS_OPTIONS = [
  { value: "ok", label: "OK" },
  { value: "not-ok", label: "Not OK" },
  { value: "na", label: "N/A" },
];

export const MEASUREMENTS = [
  { name: "inputVoltage", label: "Input voltage", unit: "V" },
  { name: "outputVoltage", label: "Output voltage", unit: "V" },
  { name: "outputFrequency", label: "Output frequency", unit: "Hz" },
  { name: "loadCurrent", label: "Load current", unit: "A" },
  { name: "loadPercentage", label: "Load", unit: "%" },
  { name: "batteryVoltage", label: "Battery voltage", unit: "V DC" },
  { name: "chargingCurrent", label: "Charging current", unit: "A" },
  { name: "backupTime", label: "Backup time", unit: "min" },
];

export const MATERIAL_ROWS = [1, 2, 3, 4];
