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
import { ScrollArea } from "@/components/ui/scroll-area";

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
  ): string[] => {
    const now = new Date();
    const warnings: string[] = [];

    // Check start date/time
    if (startDate && startDate.getTime() <= now.getTime()) {
      warnings.push("Warning: Voting start time should be in the future. If you intend to start voting immediately, please set the voting start time to a few minutes from now to have time to sign the transaction.");
    }

    // Check end date/time
    if (startDate && endDate && endDate.getTime() <= startDate.getTime()) {
      warnings.push("Warning: Voting end time should be after start time");
    }

    // Check execution date/time
    if (endDate && executionDate && executionDate.getTime() <= endDate.getTime()) {
      warnings.push("Warning: Execution time should be after voting end time");
    }

    return warnings;
  };

  // Voting Start Date handlers
  const handleVotingStartDateChange = (date: Date | undefined) => {
    if (!date) return;

    const currentDate = formData.votingStartDate || new Date();
    const newDate = new Date(date);
    newDate.setHours(currentDate.getHours());
    newDate.setMinutes(currentDate.getMinutes());

    const warnings = validateDates(newDate, formData.votingEndDate, formData.executionDate);
    setDateError(warnings.length > 0 ? warnings.join("\n") : null);

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

    const warnings = validateDates(newDate, formData.votingEndDate, formData.executionDate);
    setDateError(warnings.length > 0 ? warnings.join("\n") : null);

    updateFormData({ votingStartDate: newDate } as Partial<T>);
  };

  // Voting End Date handlers
  const handleVotingEndDateChange = (date: Date | undefined) => {
    if (!date) return;

    const currentDate = formData.votingEndDate || new Date();
    const newDate = new Date(date);
    newDate.setHours(currentDate.getHours());
    newDate.setMinutes(currentDate.getMinutes());

    const warnings = validateDates(formData.votingStartDate, newDate, formData.executionDate);
    setDateError(warnings.length > 0 ? warnings.join("\n") : null);

    const updates: Partial<T> = {
      votingEndDate: newDate,
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

    const warnings = validateDates(formData.votingStartDate, newDate, formData.executionDate);
    setDateError(warnings.length > 0 ? warnings.join("\n") : null);

    const updates: Partial<T> = {
      votingEndDate: newDate,
      expirationDate: addDays(newDate, 7)
    } as Partial<T>;

    updateFormData(updates);
  };

  // Execution Date handlers
  const handleExecutionDateChange = (date: Date | undefined) => {
    if (!date) return;

    const currentDate = formData.executionDate || formData.votingEndDate || new Date();
    const newDate = new Date(date);
    newDate.setHours(currentDate.getHours());
    newDate.setMinutes(currentDate.getMinutes());

    const warnings = validateDates(formData.votingStartDate, formData.votingEndDate, newDate);
    setDateError(warnings.length > 0 ? warnings.join("\n") : null);

    updateFormData({ executionDate: newDate } as Partial<T>);
  };

  const handleExecutionTimeChange = (time: string) => {
    if (!formData.executionDate) return;

    const [hours, minutes] = time.split(':').map(Number);
    const newDate = new Date(formData.executionDate);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);

    const warnings = validateDates(formData.votingStartDate, formData.votingEndDate, newDate);
    setDateError(warnings.length > 0 ? warnings.join("\n") : null);

    updateFormData({ executionDate: newDate } as Partial<T>);
  };

  // Generate time options
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const TimeSelect = ({ 
    date, 
    onTimeChange 
  }: { 
    date: Date | null | undefined, 
    onTimeChange: (time: string) => void 
  }) => {
    if (!date) return null;

    const currentHour = date.getHours().toString().padStart(2, '0');
    const currentMinute = date.getMinutes().toString().padStart(2, '0');

    return (
      <div className="flex gap-1">
        <Select
          value={currentHour}
          onValueChange={(hour) => onTimeChange(`${hour}:${currentMinute}`)}
        >
          <SelectTrigger className="w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <ScrollArea className="h-[200px]">
              {hours.map((hour) => (
                <SelectItem key={hour} value={hour}>
                  {hour}
                </SelectItem>
              ))}
            </ScrollArea>
          </SelectContent>
        </Select>

        <span className="flex items-center">:</span>

        <Select
          value={currentMinute}
          onValueChange={(minute) => onTimeChange(`${currentHour}:${minute}`)}
        >
          <SelectTrigger className="w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <ScrollArea className="h-[200px]">
              {minutes.map((minute) => (
                <SelectItem key={minute} value={minute}>
                  {minute}
                </SelectItem>
              ))}
            </ScrollArea>
          </SelectContent>
        </Select>
      </div>
    );
  };

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
          <Alert variant="default" className="bg-yellow-50 border-yellow-200">
            <AlertDescription className="whitespace-pre-line">{dateError}</AlertDescription>
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
                      "w-full justify-start text-left font-normal h-12",
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
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <div className="flex items-center gap-2 h-12 px-3 border rounded-md">
                <Clock className="h-4 w-4 text-gray-500" />
                <TimeSelect
                  date={formData.votingStartDate} 
                  onTimeChange={handleVotingStartTimeChange}
                />
              </div>
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
                      "w-full justify-start text-left font-normal h-12",
                      !formData.votingEndDate && "text-muted-foreground"
                    )}
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
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <div className="flex items-center gap-2 h-12 px-3 border rounded-md">
                <Clock className="h-4 w-4 text-gray-500" />
                <TimeSelect 
                  date={formData.votingEndDate} 
                  onTimeChange={handleVotingEndTimeChange}
                />
              </div>
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
                      "w-full justify-start text-left font-normal h-12",
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

              <div className="flex items-center gap-2 h-12 px-3 border rounded-md">
                <Clock className="h-4 w-4 text-gray-500" />
                <TimeSelect 
                  date={formData.executionDate} 
                  onTimeChange={handleExecutionTimeChange}
                />
              </div>
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