import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  icon: React.ReactNode;
  children: React.ReactNode;
}

export function ActionButton({
  onClick,
  disabled,
  loading,
  variant = 'primary',
  icon,
  children,
}: ActionButtonProps) {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "relative w-full h-14 rounded-xl font-medium text-base flex items-center justify-center gap-3 transition-all",
        variant === 'primary' && [
          "gradient-primary text-primary-foreground shadow-glow",
          "disabled:opacity-50 disabled:shadow-none"
        ],
        variant === 'secondary' && [
          "bg-secondary text-secondary-foreground border-2 border-border",
          "hover:border-primary/50",
          "disabled:opacity-50"
        ]
      )}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        icon
      )}
      {children}
    </motion.button>
  );
}
