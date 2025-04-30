type FilterType = 'all' | 'followed' | 'not-followed';

interface DaosFilterProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  followedCount: number;
  totalCount: number;
}

export function DaosFilter({ 
  activeFilter, 
  onFilterChange, 
  followedCount,
  totalCount 
}: DaosFilterProps) {
  return (
    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
      <button
        onClick={() => onFilterChange('all')}
        className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
          activeFilter === 'all'
            ? 'bg-white shadow-sm text-gray-900'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        All ({totalCount})
      </button>
      <button
        onClick={() => onFilterChange('followed')}
        className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
          activeFilter === 'followed'
            ? 'bg-white shadow-sm text-gray-900'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Following ({followedCount})
      </button>
      <button
        onClick={() => onFilterChange('not-followed')}
        className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
          activeFilter === 'not-followed'
            ? 'bg-white shadow-sm text-gray-900'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Discover ({totalCount - followedCount})
      </button>
    </div>
  );
} 