import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";
import { ProposalStatus, getIntentDisplay } from "../helpers/types";

interface ProposalFiltersProps {
  status: ProposalStatus;
  type: string;
  onStatusChange: (status: ProposalStatus) => void;
  onTypeChange: (type: string) => void;
}

export function ProposalFilters({
  status,
  type,
  onStatusChange,
  onTypeChange,
}: ProposalFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-4 rounded-lg border mb-4">
      <div className="flex items-center gap-2 text-sm text-gray-500 min-w-[80px]">
        <Filter className="h-4 w-4" />
        <span>Filters:</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Select value={status} onValueChange={(value) => onStatusChange(value as ProposalStatus)}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="executable">Executable</SelectItem>
            <SelectItem value="deletable">Deletable</SelectItem>
          </SelectContent>
        </Select>

        <Select value={type} onValueChange={onTypeChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="ConfigDao">{getIntentDisplay("ConfigDao").title}</SelectItem>
            <SelectItem value="ToggleUnverifiedAllowed">{getIntentDisplay("ToggleUnverifiedAllowed").title}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(status !== 'all' || type !== 'all') && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onStatusChange('all');
            onTypeChange('all');
          }}
          className="ml-0 sm:ml-auto text-sm w-full sm:w-auto mt-2 sm:mt-0"
        >
          Clear Filters
        </Button>
      )}
    </div>
  );
} 