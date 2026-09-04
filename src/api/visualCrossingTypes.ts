/**
 * Shape of the Visual Crossing Timeline API response. Only the fields the app
 * actually reads are declared. Optional/nullable members mirror the provider:
 * hourly `precip`, `windgust` and similar are frequently `null` for future hours.
 */

export interface VcHour {
  datetimeEpoch: number;
  temp: number | null;
  feelslike: number | null;
  humidity: number | null;
  dew: number | null;
  precip: number | null;
  precipprob: number | null;
  snow: number | null;
  windspeed: number | null;
  winddir: number | null;
  pressure: number | null;
  visibility: number | null;
  cloudcover: number | null;
  uvindex: number | null;
  conditions: string | null;
  icon: string | null;
}

export interface VcDay extends VcHour {
  datetime: string;
  tempmax: number | null;
  tempmin: number | null;
  sunriseEpoch: number | null;
  sunsetEpoch: number | null;
  hours?: VcHour[];
}

export type VcCurrentConditions = VcHour;

export interface VcResponse {
  latitude: number;
  longitude: number;
  resolvedAddress: string;
  address: string;
  timezone: string;
  tzoffset: number;
  days: VcDay[];
  currentConditions?: VcCurrentConditions;
}
