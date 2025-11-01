"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type PublicPlayer = { id: string; name: string; isHost: boolean };
type YouInfo = { role: "spy" | "agent"; card?: string } | null;
type RoomPublic = {
  code: string;
  status: "waiting" | "in-round" | "ended";
  players: PublicPlayer[];
  reveal?: string | null;
  spyCount?: number | null;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "https://zarylbek.pythonanywhere.com";
//
export default function Home() {
  const [name, setName] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [room, setRoom] = useState<RoomPublic | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [you, setYou] = useState<YouInfo>(null);
  const [spyCount, setSpyCount] = useState(1);
  const poller = useRef<NodeJS.Timeout | null>(null);

  // Persist session in localStorage
  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? window.localStorage.getItem("cr-spy-session")
        : null;
    if (saved) {
      try {
        const s = JSON.parse(saved);
        setPlayerId(s.playerId ?? null);
        setRoom(s.room ?? null);
        setIsHost(!!s.isHost);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "cr-spy-session",
        JSON.stringify({ playerId, room, isHost })
      );
    }
  }, [playerId, room, isHost]);

  const api = useMemo(() => {
    const base = API_BASE.replace(/\/$/, "");
    return {
      async createRoom(name: string) {
        const res = await fetch(`${base}/rooms`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        if (!res.ok) throw new Error("Failed to create room");
        return res.json();
      },
      async joinRoom(code: string, name: string) {
        const res = await fetch(`${base}/rooms/${code}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        if (!res.ok) throw new Error("Failed to join room");
        return res.json();
      },
      async start(code: string, playerId: string, spyCount: number) {
        const res = await fetch(
          `${base}/rooms/${code}/start?playerId=${encodeURIComponent(
            playerId
          )}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ spyCount }),
          }
        );
        if (!res.ok) throw new Error("Failed to start round");
        return res.json();
      },
      async end(code: string, playerId: string) {
        const res = await fetch(`${base}/rooms/${code}/end`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId }),
        });
        if (!res.ok) throw new Error("Failed to end round");
        return res.json();
      },
      async reset(code: string, playerId: string) {
        const res = await fetch(`${base}/rooms/${code}/reset`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId }),
        });
        if (!res.ok) throw new Error("Failed to reset room");
        return res.json();
      },
      async leave(code: string, playerId: string) {
        const res = await fetch(`${base}/rooms/${code}/leave`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId }),
        });
        if (!res.ok) throw new Error("Failed to leave room");
        return res.json();
      },
      async state(code: string, pid: string | null) {
        const url = pid
          ? `${base}/rooms/${code}/state?playerId=${encodeURIComponent(pid)}`
          : `${base}/rooms/${code}/state`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load state");
        return res.json();
      },
    };
  }, []);

  const startPolling = useCallback(
    (code: string, pid: string | null) => {
      if (poller.current) clearInterval(poller.current);
      poller.current = setInterval(async () => {
        try {
          const data = await api.state(code, pid);
          setRoom(data.room);
          setYou(data.you ?? null);
        } catch (e) {
          // stop polling on error
          if (poller.current) clearInterval(poller.current);
        }
      }, 1500);
    },
    [api]
  );

  const handleCreate = async () => {
    const n = name.trim();
    if (!n) return alert("Введите имя");
    const data = await api.createRoom(n);
    setPlayerId(data.playerId);
    setIsHost(!!data.isHost);
    setRoom(data.room);
    startPolling(data.room.code, data.playerId);
  };

  const handleJoin = async () => {
    const n = name.trim();
    const code = roomCodeInput.trim().toUpperCase();
    if (!n) return alert("Введите имя");
    if (!code) return alert("Введите код комнаты");
    const data = await api.joinRoom(code, n);
    setPlayerId(data.playerId);
    setIsHost(!!data.isHost);
    setRoom(data.room);
    startPolling(data.room.code, data.playerId);
  };

  const handleStart = async () => {
    if (!room || !playerId) return;
    await api.start(room.code, playerId, spyCount);
    // Poller will pick up state
  };

  const handleEnd = async () => {
    if (!room || !playerId) return;
    await api.end(room.code, playerId);
  };

  const handleReset = async () => {
    if (!room || !playerId) return;
    await api.reset(room.code, playerId);
  };

  const handleLeave = async () => {
    if (room && playerId) {
      try {
        await api.leave(room.code, playerId);
      } catch {}
    }
    setRoom(null);
    setPlayerId(null);
    setIsHost(false);
    setYou(null);
    if (poller.current) clearInterval(poller.current);
  };

  const copyCode = async () => {
    if (!room) return;
    try {
      await navigator.clipboard.writeText(room.code);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 p-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Шпион: Clash Royale карты</h1>
          <span className="text-sm opacity-70">API: {API_BASE}</span>
        </header>

        {!room ? (
          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <input
                className="w-full rounded-md border border-zinc-300 bg-white p-3 text-base outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800"
                placeholder="Ваше имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleCreate}
                className="rounded-md bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700"
              >
                Создать комнату
              </button>
              <div className="flex w-full items-center gap-2">
                <input
                  className="w-full rounded-md border border-zinc-300 bg-white p-3 text-base outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800"
                  placeholder="Код комнаты (например, ABC123)"
                  value={roomCodeInput}
                  onChange={(e) =>
                    setRoomCodeInput(e.target.value.toUpperCase())
                  }
                />
                <button
                  onClick={handleJoin}
                  className="whitespace-nowrap rounded-md border border-zinc-300 px-4 py-3 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Присоединиться
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="text-lg font-semibold">
                  Комната: <span className="font-mono">{room.code}</span>
                </div>
                <button
                  onClick={copyCode}
                  className="rounded-md border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Скопировать
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded bg-zinc-100 px-2 py-1 text-sm dark:bg-zinc-800">
                  Статус: {room.status}
                </span>
                <button
                  onClick={handleLeave}
                  className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/30"
                >
                  Покинуть
                </button>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="mb-2 text-lg font-semibold">Игроки</h2>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {room.players.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-md border border-zinc-200 p-3 dark:border-zinc-700"
                  >
                    <span>{p.name}</span>
                    <span className="text-xs opacity-60">
                      {p.isHost ? "Хост" : "Игрок"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {room.status === "waiting" && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {isHost ? (
                  <>
                    <label className="flex items-center gap-2">
                      <span className="text-sm">Кол-во шпионов:</span>
                      <input
                        type="number"
                        min={1}
                        max={Math.max(1, room.players.length - 1)}
                        value={spyCount}
                        onChange={(e) => setSpyCount(Number(e.target.value))}
                        className="w-20 rounded-md border border-zinc-300 bg-white p-2 text-base outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800"
                      />
                    </label>
                    <button
                      onClick={handleStart}
                      className="rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
                    >
                      Начать раунд
                    </button>
                  </>
                ) : (
                  <p className="text-sm opacity-80">
                    Ожидание начала раунда от хоста…
                  </p>
                )}
              </div>
            )}

            {room.status === "in-round" && (
              <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-4 text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
                {you?.role === "spy" ? (
                  <>
                    <h3 className="mb-1 text-xl font-bold">Вы шпион 🕵️</h3>
                    <p className="opacity-80">
                      Попробуйте вычислить карту, задавая вопросы.
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="mb-1 text-xl font-bold">Ваша карта</h3>
                    <p className="text-2xl font-extrabold">
                      {you?.card ?? "(секрет)"}
                    </p>
                  </>
                )}
                {isHost && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={handleEnd}
                      className="rounded-md bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-700"
                    >
                      Завершить раунд (показать)
                    </button>
                  </div>
                )}
              </div>
            )}

            {room.status === "ended" && (
              <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
                <h3 className="mb-1 text-xl font-bold">Раунд завершён</h3>
                <p>
                  Карта:{" "}
                  <span className="font-bold">{room.reveal ?? "секрет"}</span>
                </p>
                {isHost && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={handleReset}
                      className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                    >
                      Новый раунд
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        <footer className="mt-auto text-center text-sm opacity-60">
          Сделано на Next.js + FastAPI. Игра-«Шпион», но слова заменены картами
          Clash Royale.
        </footer>
      </main>
    </div>
  );
}
