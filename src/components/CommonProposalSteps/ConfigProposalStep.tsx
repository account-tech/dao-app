import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock, X } from "lucide-react";
import { format, addDays, isBefore, isAfter } from "date-fns";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Generic interface for any form data that includes proposal configuration
interface BaseFormData {
  proposalName: string;
  proposalDescription: string;
  votingStartDate?: Date | null;  // When voting starts
  votingEndDate?: Date | null;    // When voting ends
  executionDate?: Date | null;    // When proposal executes if approved
  expirationDate?: Date | null;   // When proposal expires if not executed (auto-calculated)
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
  const [votingStartTimeOpen, setVotingStartTimeOpen] = useState(false);
  const [votingEndTimeOpen, setVotingEndTimeOpen] = useState(false);
  const [executionTimeOpen, setExecutionTimeOpen] = useState(false);
  const [showInvalidAlert, setShowInvalidAlert] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);
  
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

  const validateDates = (
    startDate: Date | null | undefined,
    endDate: Date | null | undefined,
    executionDate: Date | null | undefined
  ): boolean => {
    const now = new Date();
    setDateError(null);

    if (startDate && isBefore(startDate, now)) {
      setDateError("Voting start time must be in the future");
      return false;
    }

    if (startDate && endDate && !isAfter(endDate, startDate)) {
      setDateError("Voting end time must be after start time");
      return false;
    }

    if (endDate && executionDate && !isAfter(executionDate, endDate)) {
      setDateError("Execution time must be after voting end time");
      return false;
    }

    return true;
  };

  // Voting Start Date handlers
  const handleVotingStartDateChange = (date: Date | undefined) => {
    if (!date) return;

    const currentDate = formData.votingStartDate || new Date();
    const newDate = new Date(date);
    newDate.setHours(currentDate.getHours());
    newDate.setMinutes(currentDate.getMinutes());

    if (!validateDates(newDate, formData.votingEndDate, formData.executionDate)) {
      return;
    }

    // Only update start date, don't auto-set other dates
    updateFormData({ votingStartDate: newDate } as Partial<T>);
  };

  const handleVotingStartTimeChange = (time: string) => {
    if (!formData.votingStartDate) return;

    const [hours, minutes] = time.split(':').map(Number);
    const newDate = new Date(formData.votingStartDate);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);

    if (!validateDates(newDate, formData.votingEndDate, formData.executionDate)) {
      return;
    }

    // Only update start date
    updateFormData({ votingStartDate: newDate } as Partial<T>);
  };

  // Voting End Date handlers
  const handleVotingEndDateChange = (date: Date | undefined) => {
    if (!date) return;

    const currentDate = formData.votingEndDate || new Date();
    const newDate = new Date(date);
    newDate.setHours(currentDate.getHours());
    newDate.setMinutes(currentDate.getMinutes());

    if (!validateDates(formData.votingStartDate, newDate, formData.executionDate)) {
      return;
    }

    const updates: Partial<T> = {
      votingEndDate: newDate,
      // Always update expiration date based on end date
      expirationDate: addDays(newDate, 7)
    } as Partial<T>;

    updateFormData(updates);
  };

  const handleVotingEndTimeChange = (time: string) => {
    if (!formData.votingEndDate) return;

    const [hours, minutes] = time.split(':').map(Number);
    const newDate = new Date(formData.votingEndDate);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);

    if (!validateDates(formData.votingStartDate, newDate, formData.executionDate)) {
      return;
    }

    const updates: Partial<T> = {
      votingEndDate: newDate,
      // Always update expiration date based on end date
      expirationDate: addDays(newDate, 7)
    } as Partial<T>;

    updateFormData(updates);
  };

  // Execution Date handlers
  const handleExecutionDateChange = (date: Date | undefined) => {
    if (!date || !formData.votingEndDate) return;

    const currentDate = formData.executionDate || formData.votingEndDate;
    const newDate = new Date(date);
    newDate.setHours(currentDate.getHours());
    newDate.setMinutes(currentDate.getMinutes());

    if (!validateDates(formData.votingStartDate, formData.votingEndDate, newDate)) {
      return;
    }

    updateFormData({ executionDate: newDate } as Partial<T>);
  };

  const handleExecutionTimeChange = (time: string) => {
    if (!formData.executionDate || !formData.votingEndDate) return;

    const [hours, minutes] = time.split(':').map(Number);
    const newDate = new Date(formData.executionDate);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);

    if (!validateDates(formData.votingStartDate, formData.votingEndDate, newDate)) {
      return;
    }

    updateFormData({ executionDate: newDate } as Partial<T>);
  };

  // Generate time options for select
  const timeOptions = Array.from({ length: 24 * 4 }, (_, i) => {
    const hours = Math.floor(i / 4);
    const minutes = (i % 4) * 15;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  });

  return (
    <div className="w-full mx-auto">
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

        {dateError && (
          <Alert variant="destructive">
            <AlertDescription>{dateError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Voting Start Date and Time */}
          <div className="space-y-2">
            <Label>Voting Start Date & Time</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Popover open={votingStartTimeOpen} onOpenChange={setVotingStartTimeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.votingStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.votingStartDate ? format(formData.votingStartDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.votingStartDate || undefined}
                    onSelect={handleVotingStartDateChange}
                    disabled={(date) => isBefore(date, new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Select
                disabled={!formData.votingStartDate}
                value={formData.votingStartDate ? 
                  `${formData.votingStartDate.getHours().toString().padStart(2, '0')}:${formData.votingStartDate.getMinutes().toString().padStart(2, '0')}` : 
                  ""}
                onValueChange={handleVotingStartTimeChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select time">
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      {formData.votingStartDate ? 
                        `${formData.votingStartDate.getHours().toString().padStart(2, '0')}:${formData.votingStartDate.getMinutes().toString().padStart(2, '0')}` : 
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

          {/* Voting End Date and Time */}
          <div className="space-y-2">
            <Label>Voting End Date & Time</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Popover open={votingEndTimeOpen} onOpenChange={setVotingEndTimeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.votingEndDate && "text-muted-foreground"
                    )}
                    disabled={!formData.votingStartDate}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.votingEndDate ? format(formData.votingEndDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.votingEndDate || undefined}
                    onSelect={handleVotingEndDateChange}
                    disabled={(date) => formData.votingStartDate ? isBefore(date, formData.votingStartDate) : true}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Select
                disabled={!formData.votingEndDate || !formData.votingStartDate}
                value={formData.votingEndDate ? 
                  `${formData.votingEndDate.getHours().toString().padStart(2, '0')}:${formData.votingEndDate.getMinutes().toString().padStart(2, '0')}` : 
                  ""}
                onValueChange={handleVotingEndTimeChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select time">
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      {formData.votingEndDate ? 
                        `${formData.votingEndDate.getHours().toString().padStart(2, '0')}:${formData.votingEndDate.getMinutes().toString().padStart(2, '0')}` : 
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

          {/* Execution Date and Time */}
          <div className="space-y-2">
            <Label>Execution Date & Time</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Popover open={executionTimeOpen} onOpenChange={setExecutionTimeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.executionDate && "text-muted-foreground"
                    )}
                    disabled={!formData.votingEndDate}
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
                    disabled={(date) => formData.votingEndDate ? isBefore(date, formData.votingEndDate) : true}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Select
                disabled={!formData.executionDate || !formData.votingEndDate}
                value={formData.executionDate ? 
                  `${formData.executionDate.getHours().toString().padStart(2, '0')}:${formData.executionDate.getMinutes().toString().padStart(2, '0')}` : 
                  ""}
                onValueChange={handleExecutionTimeChange}
              >
                <SelectTrigger className="w-full">
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
            <p className="text-sm text-muted-foreground mt-2">
              The proposal will expire {formData.votingEndDate ? format(addDays(formData.votingEndDate, 7), "PPP") : "7 days after voting ends"} if not executed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 