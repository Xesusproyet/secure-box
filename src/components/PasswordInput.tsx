import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Key } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function PasswordInput({ 
  value, 
  onChange, 
  placeholder = "Contraseña de encriptación",
  disabled 
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const strength = getPasswordStrength(value);

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Key className="w-5 h-5" />
        </div>
        <Input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-12 pr-12 h-14 rounded-xl border-2 focus:border-primary bg-card text-base"
        />
        <motion.button
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </motion.button>
      </div>
      
      {value && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-1.5"
        >
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  level <= strength.level 
                    ? strength.color 
                    : "bg-muted"
                )}
              />
            ))}
          </div>
          <p className={cn("text-xs", strength.textColor)}>
            {strength.label}
          </p>
        </motion.div>
      )}
    </div>
  );
}

function getPasswordStrength(password: string) {
  if (!password) return { level: 0, label: '', color: '', textColor: '' };
  
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { 
    level: 1, 
    label: 'Débil', 
    color: 'bg-destructive', 
    textColor: 'text-destructive' 
  };
  if (score <= 2) return { 
    level: 2, 
    label: 'Regular', 
    color: 'bg-orange-500', 
    textColor: 'text-orange-500' 
  };
  if (score <= 3) return { 
    level: 3, 
    label: 'Buena', 
    color: 'bg-yellow-500', 
    textColor: 'text-yellow-500' 
  };
  return { 
    level: 4, 
    label: 'Excelente', 
    color: 'bg-accent', 
    textColor: 'text-accent' 
  };
}
