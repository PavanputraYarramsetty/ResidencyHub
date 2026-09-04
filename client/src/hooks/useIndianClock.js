import { useState, useEffect } from 'react';
import { getIndianClockData } from '../utils/dateUtils';

export function useIndianClock() {
  const [clockData, setClockData] = useState(() => getIndianClockData(new Date()));

  useEffect(() => {
    const updateTime = () => setClockData(getIndianClockData(new Date()));
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return clockData;
}
