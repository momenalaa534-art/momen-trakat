import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from 'adhan';

export function calculatePrayerTimes(latitude: number, longitude: number, methodStr: string, date: Date) {
  const coordinates = new Coordinates(latitude, longitude);
  let params = CalculationMethod.Egyptian();
  
  switch(methodStr) {
    case 'Egyptian': params = CalculationMethod.Egyptian(); break;
    case 'UmmAlQura': params = CalculationMethod.UmmAlQura(); break;
    case 'MuslimWorldLeague': params = CalculationMethod.MuslimWorldLeague(); break;
    case 'MoonsightingCommittee': params = CalculationMethod.MoonsightingCommittee(); break;
    case 'Dubai': params = CalculationMethod.Dubai(); break;
    case 'Kuwait': params = CalculationMethod.Kuwait(); break;
    case 'Qatar': params = CalculationMethod.Qatar(); break;
    case 'Singapore': params = CalculationMethod.Singapore(); break;
    case 'Turkey': params = CalculationMethod.Turkey(); break;
    case 'Tehran': params = CalculationMethod.Tehran(); break;
    case 'Karachi': params = CalculationMethod.Karachi(); break;
  }
  
  params.madhab = Madhab.Shafi; // Default
  const prayerTimes = new PrayerTimes(coordinates, date, params);
  
  return prayerTimes;
}

export function formatTimePrefix(date: Date) {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}
