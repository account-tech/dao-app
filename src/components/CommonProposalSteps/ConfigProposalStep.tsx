import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Generic interface for any form data that includes proposal configuration
interface BaseFormData {
  proposalName: string;
  proposalDescription: string;
  executionDate?: Date | null;
  expirationDate?: Date | null;
}

interface ConfigProposalStepProps<T extends BaseFormData> {
  formData: T;
  updateFormData: (updates: Partial<T>) => void;
  showMinimumDelayAlert?: boolean;
  minimumDelayMs?: bigint;
}

export function ConfigProposalStep<T extends BaseFormData>({ 
  formData, 
  updateFormData,
  showMinimumDelayAlert = false,
  minimumDelayMs = BigInt(0)
}: ConfigProposalStepProps<T>) {
  const [executionTimeOpen, setExecutionTimeOpen] = useState(false);
  const [expirationTimeOpen, setExpirationTimeOpen] = useState(false);
  const [showInvalidAlert, setShowInvalidAlert] = useState(false);
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Replace spaces with hyphens and only allow letters, numbers, and hyphens
    const sanitizedValue = value.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
    
    if (sanitizedValue !== value && value !== '') {
      setShowInvalidAlert(true);
    } else {
      setShowInvalidAlert(false);
    }
    
    updateFormData({ proposalName: sanitizedValue } as Partial<T>);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateFormData({ proposalDescription: e.target.value } as Partial<T>);
  };

  const handleExecutionDateChange = (date: Date | undefined) => {
    if (date) {
      const currentExecutionDate = formData.executionDate || new Date();
      const newDate = new Date(date);
      newDate.setHours(currentExecutionDate.getHours());
      newDate.setMinutes(currentExecutionDate.getMinutes());
      updateFormData({ executionDate: newDate } as Partial<T>);
    }
  };

  const handleExecutionTimeChange = (time: string) => {
    if (formData.executionDate) {
      const [hours, minutes] = time.split(':').map(Number);
      const newDate = new Date(formData.executionDate);
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);
      updateFormData({ executionDate: newDate } as Partial<T>);
    }
  };

  const handleExpirationDateChange = (date: Date | undefined) => {
    if (date) {
      const currentExpirationDate = formData.expirationDate || new Date();
      const newDate = new Date(date);
      newDate.setHours(currentExpirationDate.getHours());
      newDate.setMinutes(currentExpirationDate.getMinutes());
      updateFormData({ expirationDate: newDate } as Partial<T>);
    }
  };

  const handleExpirationTimeChange = (time: string) => {
    if (formData.expirationDate) {
      const [hours, minutes] = time.split(':').map(Number);
      const newDate = new Date(formData.expirationDate);
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);
      updateFormData({ expirationDate: newDate } as Partial<T>);
    }
  };

  // Generate time options for select
  const timeOptions = Array.from({ length: 24 * 4 }, (_, i) => {
    const hours = Math.floor(i / 4);
    const minutes = (i % 4) * 15;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  });

  const formatDelay = (delayMs: bigint): string => {
    const days = Number(delayMs) / (24 * 60 * 60 * 1000);
    const hours = (Number(delayMs) % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000);
    const minutes = (Number(delayMs) % (60 * 60 * 1000)) / (60 * 1000);

    const parts = [];
    if (days >= 1) parts.push(`${Math.floor(days)} day${Math.floor(days) !== 1 ? 's' : ''}`);
    if (hours >= 1) parts.push(`${Math.floor(hours)} hour${Math.floor(hours) !== 1 ? 's' : ''}`);
    if (minutes >= 1) parts.push(`${Math.floor(minutes)} minute${Math.floor(minutes) !== 1 ? 's' : ''}`);

    return parts.join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="proposalName">Proposal Name</Label>
        <Input
          id="proposalName"
          placeholder="Enter proposal name (letters, numbers, and hyphens only)"
          value={formData.proposalName}
          onChange={handleNameChange}
        />
        {showInvalidAlert && (
          <Alert variant="destructive" className="mt-2">
            <AlertDescription className="flex items-center justify-between">
              <span>Only letters, numbers, and hyphens are allowed. Spaces will be converted to hyphens.</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4"
                onClick={() => setShowInvalidAlert(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="proposalDescription">Description (Optional)</Label>
        <Textarea
          id="proposalDescription"
          placeholder="Enter proposal description"
          value={formData.proposalDescription}
          onChange={handleDescriptionChange}
          rows={4}
        />
      </div>

      <div className="space-y-6">
        {/* Execution Date and Time */}
        <div className="space-y-4">
          <Label>Execution Date & Time</Label>
          {showMinimumDelayAlert && minimumDelayMs > 0 && (
            <Alert className="mb-4 text-yellow-500 bg-yellow-500/10 border-yellow-500">
              <AlertDescription>
                The execution time must be at least {formatDelay(minimumDelayMs)} from now due to package delay settings.
              </AlertDescription>
            </Alert>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <Popover open={executionTimeOpen} onOpenChange={setExecutionTimeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.executionDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.executionDate ? format(formData.executionDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.executionDate || undefined}
                  onSelect={handleExecutionDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Select
              disabled={!formData.executionDate}
              value={formData.executionDate ? 
                `${formData.executionDate.getHours().toString().padStart(2, '0')}:${formData.executionDate.getMinutes().toString().padStart(2, '0')}` : 
                ""}
              onValueChange={handleExecutionTimeChange}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Select time">
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    {formData.executionDate ? 
                      `${formData.executionDate.getHours().toString().padStart(2, '0')}:${formData.executionDate.getMinutes().toString().padStart(2, '0')}` : 
                      "Select time"}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Expiration Date and Time */}
        <div className="space-y-4">
          <Label>Expiration Date & Time (Optional)</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Popover open={expirationTimeOpen} onOpenChange={setExpirationTimeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.expirationDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.expirationDate ? format(formData.expirationDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.expirationDate || undefined}
                  onSelect={handleExpirationDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Select
              disabled={!formData.expirationDate}
              value={formData.expirationDate ? 
                `${formData.expirationDate.getHours().toString().padStart(2, '0')}:${formData.expirationDate.getMinutes().toString().padStart(2, '0')}` : 
                ""}
              onValueChange={handleExpirationTimeChange}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Select time">
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    {formData.expirationDate ? 
                      `${formData.expirationDate.getHours().toString().padStart(2, '0')}:${formData.expirationDate.getMinutes().toString().padStart(2, '0')}` : 
                      "Select time"}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
} 