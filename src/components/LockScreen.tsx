import { useState, useRef, useCallback } from "react";
import { unlock } from "../lib/auth";
import Input from "./ui/Input";
import Button from "./ui/Button";
import { Lock } from "lucide-react";

interface Props {
  onUnlock: () => void;
}

const BASE_DELAY_MS = 500;

export default function LockScreen({ onUnlock }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldownMs, setCooldownMs] = useState(0);
  const failedAttempts = useRef(0);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startCooldown = useCallback((attempts: number) => {
    const delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempts - 1), 10_000);
    setCooldownMs(delay);
    if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    cooldownTimer.current = setTimeout(() => {
      setCooldownMs(0);
      cooldownTimer.current = null;
    }, delay);
  }, []);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldownMs > 0) return;
    setError("");
    setLoading(true);
    try {
      await unlock(password);
      onUnlock();
    } catch (err) {
      failedAttempts.current += 1;
      setError((err as Error).message);
      if (failedAttempts.current >= 3) {
        startCooldown(failedAttempts.current);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "hsl(var(--primary))" }}>
      <form onSubmit={handleUnlock} className="bg-white rounded-3xl shadow-2xl p-8 w-80 space-y-5 app-surface">
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-display font-semibold text-slate-900">Tela Bloqueada</h1>
          <p className="text-sm text-muted-foreground">Digite sua senha para desbloquear</p>
        </div>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          autoFocus
          disabled={cooldownMs > 0}
        />
        {error && <p className="text-destructive text-sm">{error}</p>}
        {cooldownMs > 0 && (
          <p className="text-muted-foreground text-xs text-center">
            Aguarde {Math.ceil(cooldownMs / 1000)}s antes de tentar novamente
          </p>
        )}
        <Button type="submit" disabled={loading || !password || cooldownMs > 0} className="w-full">
          {loading ? "Desbloqueando..." : "Desbloquear"}
        </Button>
      </form>
    </div>
  );
}
