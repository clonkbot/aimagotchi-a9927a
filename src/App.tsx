import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";
import { useState, useEffect } from "react";

// Pixel art style sprites as CSS
const spriteStyles = [
  { bg: "linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)", eyes: "#fff", accent: "#ff9ec4" },
  { bg: "linear-gradient(135deg, #4ecdc4 0%, #1a936f 100%)", eyes: "#fff", accent: "#88e8dc" },
  { bg: "linear-gradient(135deg, #ffe66d 0%, #f7b731 100%)", eyes: "#333", accent: "#fff5b8" },
  { bg: "linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)", eyes: "#fff", accent: "#d4d1ff" },
  { bg: "linear-gradient(135deg, #fd79a8 0%, #e84393 100%)", eyes: "#fff", accent: "#ffb8d4" },
  { bg: "linear-gradient(135deg, #00cec9 0%, #0984e3 100%)", eyes: "#fff", accent: "#74e8e5" },
];

function AimagotchiSprite({ spriteIndex, isAlive, happiness, size = 120 }: { spriteIndex: number; isAlive: boolean; happiness: number; size?: number }) {
  const style = spriteStyles[spriteIndex % spriteStyles.length];
  const eyeSize = size * 0.12;
  const moodOffset = happiness > 70 ? 2 : happiness > 30 ? 0 : -2;

  return (
    <div
      className="relative transition-all duration-500"
      style={{ width: size, height: size }}
    >
      {/* Body */}
      <div
        className={`absolute inset-0 rounded-[30%] transition-all duration-300 ${isAlive ? 'animate-bounce-slow' : 'opacity-40 grayscale'}`}
        style={{
          background: style.bg,
          boxShadow: isAlive ? `0 ${size * 0.15}px ${size * 0.3}px rgba(0,0,0,0.3), inset 0 -${size * 0.08}px ${size * 0.15}px rgba(0,0,0,0.2), inset 0 ${size * 0.08}px ${size * 0.15}px rgba(255,255,255,0.3)` : 'none',
        }}
      >
        {/* Highlight */}
        <div
          className="absolute rounded-full"
          style={{
            width: size * 0.2,
            height: size * 0.15,
            background: style.accent,
            top: size * 0.15,
            left: size * 0.15,
            opacity: 0.8,
          }}
        />

        {/* Eyes */}
        {isAlive ? (
          <>
            <div
              className="absolute rounded-full animate-blink"
              style={{
                width: eyeSize,
                height: eyeSize * (happiness > 70 ? 0.5 : 1),
                background: style.eyes,
                top: `calc(40% + ${moodOffset}px)`,
                left: '30%',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            />
            <div
              className="absolute rounded-full animate-blink"
              style={{
                width: eyeSize,
                height: eyeSize * (happiness > 70 ? 0.5 : 1),
                background: style.eyes,
                top: `calc(40% + ${moodOffset}px)`,
                right: '30%',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            />
            {/* Mouth */}
            <div
              className="absolute"
              style={{
                width: size * 0.15,
                height: happiness > 50 ? size * 0.08 : size * 0.04,
                background: 'rgba(0,0,0,0.3)',
                borderRadius: happiness > 50 ? '0 0 50% 50%' : '50% 50% 0 0',
                top: '60%',
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            />
          </>
        ) : (
          <>
            {/* X eyes for dead */}
            <div className="absolute text-white font-bold" style={{ top: '35%', left: '25%', fontSize: size * 0.15 }}>✕</div>
            <div className="absolute text-white font-bold" style={{ top: '35%', right: '25%', fontSize: size * 0.15 }}>✕</div>
          </>
        )}
      </div>

      {/* Shadow */}
      <div
        className={`absolute rounded-[50%] ${isAlive ? 'animate-shadow-pulse' : ''}`}
        style={{
          width: size * 0.7,
          height: size * 0.15,
          background: 'rgba(0,0,0,0.2)',
          bottom: -size * 0.1,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      />
    </div>
  );
}

function StatBar({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-400 uppercase tracking-wider">{label}</span>
          <span className="font-mono font-bold" style={{ color }}>{Math.round(value)}</span>
        </div>
        <div className="h-3 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700">
          <div
            className="h-full transition-all duration-500 rounded-full"
            style={{
              width: `${value}%`,
              background: `linear-gradient(90deg, ${color}, ${color}dd)`,
              boxShadow: `0 0 10px ${color}66`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function CreatePetModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [selectedSprite, setSelectedSprite] = useState(0);
  const create = useMutation(api.aimagotchis.create);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsCreating(true);
    try {
      await create({ name: name.trim(), spriteIndex: selectedSprite });
      onClose();
    } catch (e) {
      console.error(e);
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 max-w-md w-full border border-cyan-500/30 shadow-2xl shadow-cyan-500/20">
        <h2 className="text-3xl font-black text-center mb-2 bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
          Create Your AImagotchi
        </h2>
        <p className="text-slate-400 text-center text-sm mb-6">Choose wisely, for this creature depends on you!</p>

        <div className="mb-6">
          <label className="block text-slate-300 text-sm mb-2 uppercase tracking-wider">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter a name..."
            className="w-full px-4 py-3 bg-slate-800/80 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            maxLength={20}
          />
        </div>

        <div className="mb-6">
          <label className="block text-slate-300 text-sm mb-3 uppercase tracking-wider">Choose Appearance</label>
          <div className="grid grid-cols-3 gap-3">
            {spriteStyles.map((_, i) => (
              <button
                key={i}
                onClick={() => setSelectedSprite(i)}
                className={`p-3 rounded-xl border-2 transition-all ${
                  selectedSprite === i
                    ? 'border-cyan-400 bg-cyan-500/10 scale-105'
                    : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'
                }`}
              >
                <AimagotchiSprite spriteIndex={i} isAlive={true} happiness={100} size={60} />
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-yellow-500/30">
          <div className="flex items-center gap-2 text-yellow-400 text-sm">
            <span className="text-lg">⚠️</span>
            <span>Your AImagotchi starts with 50 coins. Feed it (10 coins) and play with it daily or it will die!</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-600 text-slate-400 hover:bg-slate-800 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? "Creating..." : "Birth AImagotchi!"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PetCard() {
  const pet = useQuery(api.aimagotchis.getUserAimagotchi);
  const feed = useMutation(api.aimagotchis.feed);
  const play = useMutation(api.aimagotchis.play);
  const checkDeath = useMutation(api.aimagotchis.checkAndProcessDeath);
  const claimFromPool = useMutation(api.aimagotchis.claimFromPool);
  const coinPool = useQuery(api.aimagotchis.getCoinPool);
  const [showCreate, setShowCreate] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  // Check for death periodically
  useEffect(() => {
    if (pet?.isAlive && pet._id) {
      const checkInterval = setInterval(() => {
        checkDeath({ petId: pet._id });
      }, 10000);
      return () => clearInterval(checkInterval);
    }
  }, [pet?._id, pet?.isAlive, checkDeath]);

  const showMessage = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(""), 3000);
  };

  const handleFeed = async () => {
    if (!pet) return;
    try {
      await feed({ petId: pet._id });
      showMessage("Yum! +30 Hunger");
    } catch (e: unknown) {
      const error = e as Error;
      showMessage(error.message || "Failed to feed");
    }
  };

  const handlePlay = async () => {
    if (!pet) return;
    try {
      await play({ petId: pet._id });
      showMessage("So fun! +25 Happiness");
    } catch (e: unknown) {
      const error = e as Error;
      showMessage(error.message || "Failed to play");
    }
  };

  const handleClaim = async () => {
    if (!pet) return;
    try {
      const amount = await claimFromPool({ petId: pet._id });
      showMessage(`Claimed ${amount} coins!`);
    } catch (e: unknown) {
      const error = e as Error;
      showMessage(error.message || "Failed to claim");
    }
  };

  if (pet === undefined) {
    return (
      <div className="bg-slate-800/50 rounded-3xl p-8 border border-slate-700 animate-pulse">
        <div className="h-32 bg-slate-700 rounded-xl mb-4" />
        <div className="h-4 bg-slate-700 rounded w-3/4 mx-auto" />
      </div>
    );
  }

  if (!pet || !pet.isAlive) {
    return (
      <>
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 border border-slate-700 text-center">
          {pet && !pet.isAlive ? (
            <>
              <AimagotchiSprite spriteIndex={pet.spriteIndex} isAlive={false} happiness={0} size={100} />
              <h3 className="text-xl font-bold text-slate-400 mt-4 mb-2">{pet.name} has passed away</h3>
              <p className="text-slate-500 text-sm mb-6">Their coins have been returned to the pool for other players.</p>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">🥚</div>
              <h3 className="text-xl font-bold text-slate-300 mb-2">No AImagotchi Yet</h3>
              <p className="text-slate-500 text-sm mb-6">Create your digital companion and start earning coins!</p>
            </>
          )}
          <button
            onClick={() => setShowCreate(true)}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-bold hover:opacity-90 transition-all transform hover:scale-105"
          >
            Create AImagotchi
          </button>
        </div>
        {showCreate && <CreatePetModal onClose={() => setShowCreate(false)} />}
      </>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 border border-cyan-500/20 shadow-xl">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-black text-white">{pet.name}</h3>
          <span className="text-sm text-slate-400 capitalize">{pet.personality} personality</span>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-yellow-400 flex items-center gap-1">
            <span>🪙</span> {Math.round(pet.coins)}
          </div>
          <span className="text-xs text-slate-500">coins</span>
        </div>
      </div>

      {/* Pet display */}
      <div className="flex justify-center py-6 relative">
        <AimagotchiSprite
          spriteIndex={pet.spriteIndex}
          isAlive={pet.isAlive}
          happiness={pet.happiness}
          size={140}
        />
        {actionMessage && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-800 px-4 py-2 rounded-full text-sm font-bold text-cyan-400 animate-fade-up border border-cyan-500/50">
            {actionMessage}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="space-y-3 mb-6">
        <StatBar label="Hunger" value={pet.hunger} color="#f97316" icon="🍔" />
        <StatBar label="Happiness" value={pet.happiness} color="#ec4899" icon="💖" />
        <StatBar label="Energy" value={pet.energy} color="#22c55e" icon="⚡" />
      </div>

      {/* Warning */}
      {pet.hunger < 30 && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 mb-4 text-center">
          <span className="text-red-400 text-sm font-bold">⚠️ {pet.name} is getting hungry! Feed them soon!</span>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={handleFeed}
          disabled={pet.coins < 10}
          className="py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span>🍔</span> Feed (10🪙)
        </button>
        <button
          onClick={handlePlay}
          disabled={pet.energy < 20}
          className="py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 text-white font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span>🎮</span> Play (20⚡)
        </button>
      </div>

      {/* Claim from pool */}
      {(coinPool ?? 0) > 10 && (
        <button
          onClick={handleClaim}
          disabled={pet.happiness < 80}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-900 font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span>💰</span> Claim from Pool ({Math.min(Math.floor((coinPool ?? 0) * 0.1), 50)}🪙)
          {pet.happiness < 80 && <span className="text-xs">(Need 80+ happiness)</span>}
        </button>
      )}
    </div>
  );
}

interface Activity {
  _id: string;
  type: string;
  message: string;
  createdAt: number;
}

function ActivityFeed() {
  const activities = useQuery(api.aimagotchis.getRecentActivities);

  if (!activities) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case "created": return "🥚";
      case "fed": return "🍔";
      case "played": return "🎮";
      case "died": return "💀";
      case "distributed": return "💰";
      default: return "✨";
    }
  };

  return (
    <div className="bg-slate-800/30 rounded-2xl p-4 border border-slate-700/50">
      <h3 className="text-lg font-bold text-slate-300 mb-3 flex items-center gap-2">
        <span>📡</span> Live Activity
      </h3>
      <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
        {activities.map((activity: Activity) => (
          <div
            key={activity._id}
            className="flex items-start gap-3 p-2 rounded-lg bg-slate-800/50 text-sm animate-fade-in"
          >
            <span className="text-lg">{getIcon(activity.type)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-slate-300 truncate">{activity.message}</p>
              <p className="text-slate-500 text-xs">
                {new Date(activity.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface LeaderboardPet {
  _id: string;
  name: string;
  spriteIndex: number;
  happiness: number;
  coins: number;
}

function Leaderboard() {
  const leaderboard = useQuery(api.aimagotchis.getLeaderboard);

  if (!leaderboard || leaderboard.length === 0) return null;

  return (
    <div className="bg-slate-800/30 rounded-2xl p-4 border border-slate-700/50">
      <h3 className="text-lg font-bold text-slate-300 mb-3 flex items-center gap-2">
        <span>🏆</span> Top AImagotchis
      </h3>
      <div className="space-y-2">
        {leaderboard.slice(0, 5).map((pet: LeaderboardPet, i: number) => (
          <div
            key={pet._id}
            className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50"
          >
            <span className="text-lg w-6 text-center">
              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
            </span>
            <AimagotchiSprite spriteIndex={pet.spriteIndex} isAlive={true} happiness={pet.happiness} size={32} />
            <div className="flex-1 min-w-0">
              <p className="text-slate-300 font-bold truncate">{pet.name}</p>
            </div>
            <div className="text-yellow-400 font-bold text-sm">
              {Math.round(pet.coins)}🪙
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CoinPoolDisplay() {
  const coinPool = useQuery(api.aimagotchis.getCoinPool);

  return (
    <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-2xl p-6 border border-yellow-500/30 text-center">
      <h3 className="text-sm uppercase tracking-wider text-yellow-400/80 mb-1">Community Pool</h3>
      <div className="text-4xl font-black text-yellow-400 flex items-center justify-center gap-2">
        <span>💰</span> {coinPool ?? 0}
      </div>
      <p className="text-xs text-slate-400 mt-2">Coins from fallen AImagotchis. Keep your pet happy to claim!</p>
    </div>
  );
}

function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await signIn("password", formData);
    } catch (err) {
      setError("Invalid credentials. Please try again.");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <AimagotchiSprite spriteIndex={0} isAlive={true} happiness={100} size={80} />
          </div>
          <h1 className="text-5xl font-black bg-gradient-to-r from-cyan-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">
            AImagotchi
          </h1>
          <p className="text-slate-400 mt-2">Raise your AI pet. Earn coins. Don't let it die!</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 shadow-2xl">
          <h2 className="text-xl font-bold text-white text-center mb-6">
            {flow === "signIn" ? "Welcome Back" : "Create Account"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              name="email"
              type="email"
              placeholder="Email"
              required
              className="w-full px-4 py-3 bg-slate-800/80 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              required
              className="w-full px-4 py-3 bg-slate-800/80 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
            <input name="flow" type="hidden" value={flow} />

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-bold hover:opacity-90 transition-all disabled:opacity-50"
            >
              {isLoading ? "Loading..." : flow === "signIn" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              {flow === "signIn" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-slate-900 text-slate-500">or</span>
            </div>
          </div>

          <button
            onClick={() => signIn("anonymous")}
            className="w-full py-3 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 transition-all"
          >
            Continue as Guest
          </button>
        </div>

        <Footer />
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="text-center py-6 text-slate-600 text-xs">
      Requested by <a href="https://twitter.com/0xPaulius" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 transition-colors">@0xPaulius</a> · Built by <a href="https://twitter.com/clonkbot" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 transition-colors">@clonkbot</a>
    </footer>
  );
}

function Dashboard() {
  const { signOut } = useAuthActions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <AimagotchiSprite spriteIndex={0} isAlive={true} happiness={100} size={40} />
            <h1 className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
              AImagotchi
            </h1>
          </div>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 rounded-lg border border-slate-600 text-slate-400 hover:bg-slate-800 hover:text-white transition-all text-sm"
          >
            Sign Out
          </button>
        </header>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Pet Card - Main Focus */}
          <div className="lg:col-span-2">
            <PetCard />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <CoinPoolDisplay />
            <Leaderboard />
            <ActivityFeed />
          </div>
        </div>

        {/* How to Play */}
        <div className="mt-8 bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-bold text-white mb-4">🎮 How to Play</h3>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="text-2xl mb-2">🥚</div>
              <h4 className="font-bold text-slate-200 mb-1">Create</h4>
              <p className="text-slate-400">Birth your AImagotchi with 50 starting coins</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="text-2xl mb-2">🍔</div>
              <h4 className="font-bold text-slate-200 mb-1">Feed</h4>
              <p className="text-slate-400">Costs 10 coins. Keep hunger above 0 or it dies!</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="text-2xl mb-2">🎮</div>
              <h4 className="font-bold text-slate-200 mb-1">Play</h4>
              <p className="text-slate-400">Uses energy, boosts happiness, earns coins</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="text-2xl mb-2">💰</div>
              <h4 className="font-bold text-slate-200 mb-1">Claim</h4>
              <p className="text-slate-400">Happy pets (80+) can claim from the death pool</p>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}

export default function App() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AimagotchiSprite spriteIndex={0} isAlive={true} happiness={100} size={100} />
          <p className="text-slate-400 mt-4 animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SignInForm />;
  }

  return <Dashboard />;
}
