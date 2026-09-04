import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { STORAGE_KEYS, readJson, writeJson } from '../lib/storage';
import { DEFAULT_UNITS, type SpeedUnit, type TemperatureUnit, type UnitPreferences } from '../lib/units';
import { UnitsContext } from './unitsContext';

function loadPreferences(): UnitPreferences {
  const stored = readJson<Partial<UnitPreferences>>(STORAGE_KEYS.units, {});
  return {
    temperature: stored.temperature === 'F' ? 'F' : DEFAULT_UNITS.temperature,
    speed: stored.speed === 'mph' ? 'mph' : DEFAULT_UNITS.speed,
  };
}

export function UnitsProvider({ children }: { children: ReactNode }) {
  const [units, setUnits] = useState<UnitPreferences>(loadPreferences);

  const update = useCallback((next: UnitPreferences) => {
    setUnits(next);
    writeJson(STORAGE_KEYS.units, next);
  }, []);

  const value = useMemo(
    () => ({
      ...units,
      setTemperature: (temperature: TemperatureUnit) => update({ ...units, temperature }),
      setSpeed: (speed: SpeedUnit) => update({ ...units, speed }),
    }),
    [units, update],
  );

  return <UnitsContext.Provider value={value}>{children}</UnitsContext.Provider>;
}
