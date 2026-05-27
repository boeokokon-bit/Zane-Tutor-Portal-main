import { useState } from 'react';
import { DAYS_OF_WEEK, AvailabilitySlot } from '@/types/tutor';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Clock } from 'lucide-react';

const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6; // 06:00 to 19:30
  const min = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${min}`;
});

interface AvailabilityPickerProps {
  value: AvailabilitySlot[];
  onChange: (slots: AvailabilitySlot[]) => void;
}

export default function AvailabilityPicker({ value, onChange }: AvailabilityPickerProps) {
  const [day, setDay] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const addSlot = () => {
    if (!day || !startTime || !endTime) return;
    if (startTime >= endTime) return;
    const exists = value.some(s => s.day === day && s.startTime === startTime && s.endTime === endTime);
    if (exists) return;
    onChange([...value, { day, startTime, endTime }]);
    setDay('');
    setStartTime('');
    setEndTime('');
  };

  const removeSlot = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const sortedSlots = [...value].sort((a, b) => {
    const dayOrder = DAYS_OF_WEEK.indexOf(a.day) - DAYS_OF_WEEK.indexOf(b.day);
    return dayOrder !== 0 ? dayOrder : a.startTime.localeCompare(b.startTime);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-end">
        <div className="space-y-1 flex-1 min-w-[140px]">
          <span className="text-xs text-muted-foreground">Day</span>
          <Select value={day} onValueChange={setDay}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Select day" /></SelectTrigger>
            <SelectContent>
              {DAYS_OF_WEEK.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 min-w-[100px]">
          <span className="text-xs text-muted-foreground">From</span>
          <Select value={startTime} onValueChange={setStartTime}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Start" /></SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 min-w-[100px]">
          <span className="text-xs text-muted-foreground">To</span>
          <Select value={endTime} onValueChange={setEndTime}>
            <SelectTrigger className="h-9"><SelectValue placeholder="End" /></SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.filter(t => t > startTime).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={addSlot} disabled={!day || !startTime || !endTime} className="h-9">
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>

      {sortedSlots.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {sortedSlots.map((slot, i) => (
            <Badge key={i} variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5 text-sm">
              <Clock className="w-3 h-3" />
              <span className="font-medium">{slot.day}</span>
              <span className="text-muted-foreground">{slot.startTime} – {slot.endTime}</span>
              <button type="button" onClick={() => removeSlot(value.indexOf(slot))} className="ml-1 hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {sortedSlots.length === 0 && (
        <p className="text-xs text-muted-foreground">No availability slots added yet. Pick a day and time range above.</p>
      )}
    </div>
  );
}
