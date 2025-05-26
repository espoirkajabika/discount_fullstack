// app/customer/_components/BusinessHours.js

import { useState } from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function BusinessHours({ hours }) {
  const [showAllHours, setShowAllHours] = useState(false);
  
  // If no hours data is provided, return null
  if (!hours) return null;
  
  // Get the current day of the week (0 = Sunday, 1 = Monday, etc.)
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = daysOfWeek[new Date().getDay()];
  
  // Format time (e.g., "09:00" to "9:00 AM")
  const formatTime = (timeString) => {
    if (!timeString || timeString === '00:00') return 'Closed';
    
    const [hour, minute] = timeString.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12; // Convert 0 to 12 for 12 AM
    
    return `${formattedHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };
  
  // Function to render hours for a specific day
  const renderDayHours = (day) => {
    const dayData = hours[day];
    
    if (!dayData) return 'Closed';
    
    if (!dayData.isOpen) return 'Closed';
    
    if (!dayData.periods || dayData.periods.length === 0) return 'Closed';
    
    return dayData.periods.map((period, index) => (
      <span key={index}>
        {formatTime(period.open)} - {formatTime(period.close)}
        {index < dayData.periods.length - 1 && ', '}
      </span>
    ));
  };

  return (
    <div className="w-full">
      {/* Today's hours (always visible) */}
      <div className="flex items-start mb-2">
        <Clock className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
        <div className="ml-2">
          <p className="text-sm text-gray-500">Hours Today</p>
          <div className="flex items-center">
            <p className="text-gray-700 font-medium">
              {renderDayHours(today)}
            </p>
            {hours[today]?.isOpen && (
              <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700 border-green-200">
                Open
              </Badge>
            )}
            {(!hours[today] || !hours[today].isOpen) && (
              <Badge variant="outline" className="ml-2 text-xs bg-red-50 text-red-700 border-red-200">
                Closed
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      {/* Toggle button to show/hide all hours */}
      <Button 
        variant="link" 
        className="p-0 h-auto text-blue-600" 
        onClick={() => setShowAllHours(!showAllHours)}
      >
        {showAllHours ? 'Hide hours' : 'Show all hours'}
      </Button>
      
      {/* All week hours (conditionally rendered) */}
      {showAllHours && (
        <div className="mt-2 space-y-1.5 pl-7">
          {daysOfWeek.map((day, index) => {
            // Format the day name (e.g., "sunday" to "Sunday")
            const formattedDay = day.charAt(0).toUpperCase() + day.slice(1);
            const isToday = day === today;
            
            return (
              <div key={day} className="flex justify-between text-sm">
                <span className={isToday ? 'font-medium' : ''}>
                  {formattedDay}
                </span>
                <span className={isToday ? 'font-medium' : ''}>
                  {renderDayHours(day)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}