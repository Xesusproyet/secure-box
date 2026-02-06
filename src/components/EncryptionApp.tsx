import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Shield, CheckCircle2 } from 'lucide-react';
import { FileDropZone } from './FileDropZone';
import { PasswordInput } from './PasswordInput';
import { ActionButton } from './ActionButton';
import { ProgressBar } from './ProgressBar';
import { ThemeToggle } from './ThemeToggle';
import { encryptFile, decryptFile } from '@/lib/crypto';
import { cn } from '@/lib/utils';

type Mode = 'encrypt' | 'decrypt';
type Status = 'idle' | 'processing' | 'success' | 'error';

export function EncryptionApp() {
  const [mode, setMode] = useState<Mode>('encrypt');
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = useCallback(async () => {
    if (!file || !password) return;

    setStatus('processing');
    setProgress(0);
    setError(null);

    try {
      if (mode === 'encrypt') {
        const encryptedBlob = await encryptFile(file, password, setProgress);
        downloadBlob(encryptedBlob, `${file.name}.encrypted`);
      } else {
        const { blob, filename } = await decryptFile(file, password, setProgress);
        downloadBlob(blob, filename);
      }
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setFile(null);
        setPassword('');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }, [file, password, mode]);

  const canProcess = file && password.length >= 4 && status === 'idle';

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ThemeToggle />
      
      {/* Background decoration */}
      <div className="absolute inset-0 gradient-glow opacity-50" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      
      <div className="relative z-10 container max-w-xl mx-auto px-4 py-8 md:py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 md:mb-12"
        >
          <motion.div 
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl gradient-primary shadow-glow mb-6"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Shield className="w-10 h-10 text-primary-foreground" />
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            CipherVault
          </h1>
          <p className="text-muted-foreground text-lg">
            Encripta y protege tus archivos con AES-256
          </p>
        </motion.div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-3xl p-6 md:p-8 shadow-lg"
        >
          {/* Mode toggle */}
          <div className="flex p-1 bg-muted rounded-xl mb-6">
            {(['encrypt', 'decrypt'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setFile(null);
                  setPassword('');
                  setError(null);
                }}
                disabled={status === 'processing'}
                className={cn(
                  "flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2",
                  mode === m 
                    ? "bg-card text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m === 'encrypt' ? (
                  <>
                    <Lock className="w-4 h-4" />
                    Encriptar
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    Desencriptar
                  </>
                )}
              </button>
            ))}
          </div>

          {/* File drop zone */}
          <div className="mb-6">
            <FileDropZone
              file={file}
              onFileSelect={setFile}
              disabled={status === 'processing'}
            />
          </div>

          {/* Password input */}
          <div className="mb-6">
            <PasswordInput
              value={password}
              onChange={setPassword}
              placeholder={mode === 'encrypt' ? "Contraseña para encriptar" : "Contraseña para desencriptar"}
              disabled={status === 'processing'}
            />
          </div>

          {/* Progress / Status */}
          <AnimatePresence mode="wait">
            {status === 'processing' && (
              <div className="mb-6">
                <ProgressBar
                  progress={progress}
                  label={mode === 'encrypt' ? 'Encriptando...' : 'Desencriptando...'}
                />
              </div>
            )}

            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mb-6 p-4 rounded-xl bg-accent/10 border border-accent/20 flex items-center gap-3"
              >
                <CheckCircle2 className="w-6 h-6 text-accent" />
                <span className="text-accent font-medium">
                  ¡{mode === 'encrypt' ? 'Archivo encriptado' : 'Archivo desencriptado'}!
                </span>
              </motion.div>
            )}

            {status === 'error' && error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20"
              >
                <p className="text-destructive font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action button */}
          <ActionButton
            onClick={handleProcess}
            disabled={!canProcess}
            loading={status === 'processing'}
            icon={mode === 'encrypt' ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
          >
            {mode === 'encrypt' ? 'Encriptar archivo' : 'Desencriptar archivo'}
          </ActionButton>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-sm text-muted-foreground mt-8"
        >
          Tus archivos se procesan localmente.
          <br />
          Nunca salen de tu dispositivo.
        </motion.p>
      </div>
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
