import React, { useState } from 'react';

interface GalacticCalendarConverterProps {
  className?: string;
}

export default function GalacticCalendarConverter({ className = '' }: GalacticCalendarConverterProps) {
  const [earthYear, setEarthYear] = useState<string>('');
  const [galacticYear, setGalacticYear] = useState<string>('');

  const convertToGalactic = (year: string) => {
    const earthYearNum = parseInt(year);
    if (isNaN(earthYearNum)) return '';
    
    const diff = earthYearNum - 2220;
    if (diff === 0) return 'c0';
    if (diff < 0) return `c${diff}`; // Will automatically include the minus sign
    return `c${diff}`;
  };

  const convertToEarth = (year: string) => {
    if (!year.startsWith('c')) return '';
    if (year === 'c0') return '2220';
    
    // Remove 'c' prefix and parse the number
    const galacticYearNum = parseInt(year.substring(1));
    if (isNaN(galacticYearNum)) return '';
    return (galacticYearNum + 2220).toString();
  };

  const handleEarthYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEarthYear(value);
    setGalacticYear(convertToGalactic(value));
  };

  const handleGalacticYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGalacticYear(value);
    setEarthYear(convertToEarth(value));
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
            placeholder="e.g. 2220"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-center">
          <span className="text-gray-400">⇄</span>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Galactic Year
          </label>
          <input
            type="text"
            value={galacticYear}
            onChange={handleGalacticYearChange}
            placeholder="e.g. c0, c-10, c10"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
