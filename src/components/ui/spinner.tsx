import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      role="status"
      className={cn('animate-spin rounded-full border-2 border-muted border-t-primary', sizeStyles[size], className)}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
