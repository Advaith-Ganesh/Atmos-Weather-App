import { createContext, useContext } from 'react';
import type { SpeedUnit, TemperatureUnit, UnitPreferences } from '../lib/units';
import { DEFAULT_UNITS } from '../lib/units';

export interface UnitsContextValue extends UnitPreferences {
  setTemperature: (unit: TemperatureUnit) => void;
  setSpeed: (unit: SpeedUnit) => void;
}

export const UnitsContext = createContext<UnitsContextValue>({
  ...DEFAULT_UNITS,
  setTemperature: () => {},
  setSpeed: () => {},
});

export const useUnits = () => useContext(UnitsContext);
