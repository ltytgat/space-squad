import React, { useState } from 'react';

interface GalacticCalendarConverterProps {
  className?: string;
}

const CYCLE_LENGTH = 8766 / 25 / 25 / 15; // Length of one cycle in Earth years
const REFERENCE_YEAR = 2220; // c0 reference year

export default function GalacticCalendarConverter({ className = '' }: GalacticCalendarConverterProps) {
  const [earthYear, setEarthYear] = useState<string>('');
  const [galacticYear, setGalacticYear] = useState<string>('');

  const convertToGalactic = (year: string) => {
    const earthYearNum = parseFloat(year);
    if (isNaN(earthYearNum)) return '';
    
    const cyclesDiff = (earthYearNum - REFERENCE_YEAR) / CYCLE_LENGTH;
    if (Math.abs(cyclesDiff) < 0.001) return 'c0';
    
    // Round to 2 decimal places
    const roundedCycles = Math.round(cyclesDiff * 100) / 100;
    return `c${roundedCycles >= 0 ? roundedCycles : roundedCycles}`; // Negative numbers will include their own minus sign
  };

  const convertToEarth = (year: string) => {
    if (!year.startsWith('c')) return '';
    if (year === 'c0') return REFERENCE_YEAR.toString();
    
    // Remove 'c' prefix and parse the number
    const cycleNum = parseFloat(year.substring(1));
    if (isNaN(cycleNum)) return '';
    
    // Convert cycles to Earth years and round to 2 decimal places
    const earthYear = REFERENCE_YEAR + (cycleNum * CYCLE_LENGTH);
    return Math.round(earthYear * 100) / 100;
  };

  const handleEarthYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEarthYear(value);
    setGalacticYear(convertToGalactic(value));
  };

  const handleGalacticYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGalacticYear(value);
    setEarthYear(convertToEarth(value).toString());
  };

  return (
    <div className={`p-4 bg-gray-800 rounded-lg ${className}`}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Earth Year
          </label>
          <input
            type="text"
            value={earthYear}
            onChange={handleEarthYearChange}
            placeholder="e.g. 2576"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-center">
          <span className="text-gray-400">⇄</span>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Galactic Cycle
          </label>
          <input
            type="text"
            value={galacticYear}
            onChange={handleGalacticYearChange}
            placeholder="e.g. c333"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
