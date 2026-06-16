import { useState } from "react";
import { unlock } from "../lib/auth";

interface Props {
  onUnlock: () => void;
}

export default function LockScreen({ onUnlock }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await unlock(password);
      onUnlock();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-teal-600 to-teal-800">
      <form onSubmit={handleUnlock} className="bg-white rounded-xl shadow-2xl p-8 w-80 space-y-4">
        <h1 className="text-xl font-bold text-center text-gray-800">Tela Bloqueada</h1>
        <p className="text-sm text-gray-500 text-center">Digite sua senha para desbloquear</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          autoFocus
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading || !password}
          className="inline-flex items-center justify-center font-medium transition-colors disabled:opacity-50 h-10 rounded-xl px-4 text-sm bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm w-full"
        >
          {loading ? "Desbloqueando..." : "Desbloquear"}
        </button>
      </form>
    </div>
  );
}
