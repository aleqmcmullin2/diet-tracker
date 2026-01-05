interface ProgressBarProps {
  label: string;
  current: number;
  goal: number;
  color: string;
}

export function ProgressBar({ label, current, goal, color }: ProgressBarProps) {
  const percentage = Math.min((current / goal) * 100, 100);
  
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-600">{Math.round(current)} / {goal}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className={`h-3 rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
