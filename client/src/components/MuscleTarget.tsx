import { MUSCLE_GROUPS, type MuscleGroup } from "@shared/schema";

interface MuscleTargetProps {
  muscle: MuscleGroup | null;
  className?: string;
}

export function MuscleTarget({ muscle, className = "w-full h-full" }: MuscleTargetProps) {
  const getColor = (target: MuscleGroup) => 
    muscle === target ? MUSCLE_GROUPS[target]?.color || '#FF0000' : '#E5E7EB';

  return (
    <svg viewBox="0 0 100 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 10 C 60 10 65 15 65 25 C 65 30 60 35 50 35 C 40 35 35 30 35 25 C 35 15 40 10 50 10" fill="#F3F4F6" />
      <path d="M35 35 L 20 45 L 25 60 L 35 50 Z" fill={getColor('shoulders')} />
      <path d="M65 35 L 80 45 L 75 60 L 65 50 Z" fill={getColor('shoulders')} />
      <path d="M35 35 L 65 35 L 60 60 L 40 60 Z" fill={getColor('chest')} />
      <path d="M20 45 L 10 80 L 20 85 L 25 60 Z" fill={getColor('arms')} />
      <path d="M80 45 L 90 80 L 80 85 L 75 60 Z" fill={getColor('arms')} />
      <path d="M35 50 L 25 80 L 35 90 L 40 60 Z" fill={getColor('back')} opacity="0.5"/>
      <path d="M65 50 L 75 80 L 65 90 L 60 60 Z" fill={getColor('back')} opacity="0.5"/>
      <path d="M40 60 L 60 60 L 55 90 L 45 90 Z" fill={getColor('abs')} />
      <path d="M35 90 L 65 90 L 65 110 L 50 120 L 35 110 Z" fill={getColor('legs')} />
      <path d="M35 110 L 45 110 L 40 160 L 30 160 Z" fill={getColor('legs')} />
      <path d="M55 110 L 65 110 L 70 160 L 60 160 Z" fill={getColor('legs')} />
    </svg>
  );
}
