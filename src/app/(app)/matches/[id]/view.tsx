"use client";

import { Chess } from "chess.js";
import { ArrowLeft, Eye, Flag, Handshake, Loader2, Search, Trophy, WifiOff } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Chessboard } from "react-chessboard";
import { toast } from "sonner";

import { Avatar } from "@/components/avatar";
import { Clock } from "@/components/match/clock";
import { MoveList } from "@/components/match/move-list";
import { useMatch } from "@/components/match/use-match";
import { ErrorState } from "@/components/states";
import { LivePill } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { reasonLabel, resultLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { useLive } from "@/providers/socket-provider";

const LIGHT_SQUARE = "#dee3e6";
const DARK_SQUARE = "#8ca2ad";

export default function View() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { connected, queuedTournamentId, joinQueue, leaveQueue } = useLive();
  const { snap, error, clocks, send } = useMatch(id);

  const [viewIndex, setViewIndex] = useState<number | null>(null); // null = live
  const [pendingFen, setPendingFen] = useState<string | null>(null);
  const [confirmResign, setConfirmResign] = useState(false);
  const [busy, setBusy] = useState(false);

  // Replay the move list with chess.js to get SANs and a FEN per position.
  const { sans, fens, lastMoves } = useMemo(() => {
    const out = { sans: [] as string[], fens: [] as string[], lastMoves: [] as ({ from: string; to: string } | null)[] };
    if (!snap) return out;
    const full = new Chess();
    if (snap.pgn) {
      try {
        full.loadPgn(snap.pgn);
      } catch {
        /* malformed pgn: show nothing */
      }
    }
    const replay = new Chess();
    out.fens.push(replay.fen());
    out.lastMoves.push(null);
    for (const m of full.history({ verbose: true })) {
      replay.move(m.san);
      out.sans.push(m.san);
      out.fens.push(replay.fen());
      out.lastMoves.push({ from: m.from, to: m.to });
    }
    return out;
  }, [snap]);

  if (error) {
    return (
      <div className="space-y-6">
        <BackLink />
        <ErrorState error={error} title="Cannot open this match" />
      </div>
    );
  }
  if (!snap) {
    return (
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
        {!connected && (
          <p className="text-sm text-muted-foreground lg:col-span-2">Connecting to the live server…</p>
        )}
      </div>
    );
  }

  const myColor = snap.white.id === user?.id ? "white" : snap.black.id === user?.id ? "black" : null;
  const isPlayer = myColor !== null;
  const orientation = myColor ?? "white";
  const live = snap.status === "active";
  const shownIndex = viewIndex ?? sans.length;
  const atLive = shownIndex >= sans.length;
  const boardFen = atLive ? (pendingFen ?? snap.fen) : fens[shownIndex];
  const myTurn = live && isPlayer && snap.turn === myColor;
  const top = orientation === "white" ? snap.black : snap.white;
  const bottom = orientation === "white" ? snap.white : snap.black;
  const topColor = orientation === "white" ? "black" : "white";
  const bottomColor = orientation;
  const last = lastMoves[Math.min(shownIndex, lastMoves.length - 1)];
  const searching = queuedTournamentId === snap.tournamentId;

  const squareStyles: Record<string, React.CSSProperties> = {};
  if (last) {
    squareStyles[last.from] = { background: "rgba(250, 204, 21, 0.38)" };
    squareStyles[last.to] = { background: "rgba(250, 204, 21, 0.55)" };
  }

  function onPieceDrop({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }) {
    if (!targetSquare || !myTurn || !atLive) return false;
    // Local legality check only for instant feedback; the server re-validates.
    const chess = new Chess(snap!.fen);
    const piece = chess.get(sourceSquare as never);
    const promotion =
      piece?.type === "p" && (targetSquare[1] === "8" || targetSquare[1] === "1") ? "q" : undefined;
    try {
      chess.move({ from: sourceSquare, to: targetSquare, promotion });
    } catch {
      return false;
    }
    setPendingFen(chess.fen());
    send("match:move", { from: sourceSquare, to: targetSquare, promotion }).catch((e: Error) => {
      toast.error(e.message);
    }).finally(() => setPendingFen(null));
    return true;
  }

  async function act(event: string, payload?: Record<string, unknown>) {
    setBusy(true);
    try {
      await send(event, payload);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleSearch() {
    setBusy(true);
    try {
      if (searching) await leaveQueue(snap!.tournamentId);
      else await joinQueue(snap!.tournamentId);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const won =!!myColor && snap.result === myColor;
  const outcome = !snap.result
    ? null
    : snap.result === "draw"
      ? "Draw"
      : myColor
        ? won
          ? "You won!"
          : "You lost"
        : `${snap.result === "white" ? snap.white.name : snap.black.name} won`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackLink tournamentId={snap.tournamentId} />
        <div className="flex items-center gap-2">
          {live ? <LivePill /> : null}
          <span className="rounded-full border bg-card px-2.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
            {snap.timeControl}
          </span>
        </div>
      </div>

      {!connected && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm">
          <WifiOff className="size-4 shrink-0 text-destructive" />
          <span>
            <span className="font-medium text-destructive">Connection lost.</span>{" "}
            <span className="text-muted-foreground">
              Reconnecting… the clock keeps running on the server and your board will be restored.
            </span>
          </span>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="mx-auto w-full max-w-155 space-y-3">
          <PlayerBar
            name={top.name}
            color={topColor}
            isMe={top.id === user?.id}
            ms={topColor === "white" ? clocks.white : clocks.black}
            toMove={live && snap.turn === topColor}
          />
          <div
            className={cn(
              "overflow-hidden rounded-2xl shadow-2xl shadow-black/15 ring-1 ring-foreground/10 transition-shadow",
              myTurn && atLive && "ring-2 ring-brand/70",
            )}
          >
            <Chessboard
              options={{
                id: `board-${snap.matchId}`,
                position: boardFen,
                boardOrientation: orientation,
                allowDragging: myTurn && atLive,
                canDragPiece: ({ piece }) => piece.pieceType.startsWith(myColor === "white" ? "w" : "b"),
                onPieceDrop,
                squareStyles,
                darkSquareStyle: { backgroundColor: DARK_SQUARE },
                lightSquareStyle: { backgroundColor: LIGHT_SQUARE },
                animationDurationInMs: 150,
              }}
            />
          </div>
          <PlayerBar
            name={bottom.name}
            color={bottomColor}
            isMe={bottom.id === user?.id}
            ms={bottomColor === "white" ? clocks.white : clocks.black}
            toMove={live && snap.turn === bottomColor}
          />
        </div>

        <aside className="space-y-4">
          {!live && (
            <div className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-xs">
              {won && <div aria-hidden className="absolute -top-16 -right-10 size-48 rounded-full bg-brand/25 blur-3xl" />}
              <div className="relative flex items-center gap-3">
                <span
                  className={cn(
                    "grid size-11 place-items-center rounded-xl",
                    won ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  <Trophy className="size-5" />
                </span>
                <div>
                  <p className="text-xl font-semibold">{outcome}</p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-mono font-medium text-foreground">{resultLabel(snap.result)}</span> ·{" "}
                    {reasonLabel(snap.endReason)}
                  </p>
                </div>
              </div>
              {isPlayer && (
                <div className="relative mt-5 space-y-2">
                  <Button
                    size="lg"
                    className="w-full"
                    disabled={busy}
                    variant={searching ? "outline" : "default"}
                    onClick={() => void toggleSearch()}
                  >
                    {busy ? <Loader2 className="animate-spin" /> : <Search />}
                    {searching ? "Cancel search" : "Find next opponent"}
                  </Button>
                  {searching && (
                    <p className="text-center text-xs text-muted-foreground">Searching for an opponent…</p>
                  )}
                </div>
              )}
            </div>
          )}

          {live && isPlayer && (
            <div className="rounded-2xl border bg-card p-4 shadow-xs">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span
                  className={cn("size-2 rounded-full", myTurn ? "animate-pulse bg-success" : "bg-muted-foreground/40")}
                />
                {myTurn ? "Your move" : "Waiting for your opponent…"}
              </div>
              {snap.drawOffer && snap.drawOffer !== myColor && (
                <div className="mt-4 rounded-xl border bg-muted/40 p-3">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <Handshake className="size-4" /> Your opponent offers a draw
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button size="sm" disabled={busy} onClick={() => void act("match:draw:respond", { accept: true })}>
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => void act("match:draw:respond", { accept: false })}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              )}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  disabled={busy || snap.drawOffer === myColor}
                  onClick={() => void act("match:draw:offer")}
                >
                  <Handshake /> {snap.drawOffer === myColor ? "Offered" : "Draw"}
                </Button>
                <Button
                  variant="outline"
                  className="hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                  disabled={busy}
                  onClick={() => setConfirmResign(true)}
                >
                  <Flag /> Resign
                </Button>
              </div>
            </div>
          )}

          {live && !isPlayer && (
            <div className="flex items-center gap-2 rounded-2xl border bg-card px-4 py-3 text-sm text-muted-foreground shadow-xs">
              <Eye className="size-4" /> You&apos;re spectating this game
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border bg-card shadow-xs">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="text-sm font-semibold">Moves</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {sans.length} ply{!atLive && ` · viewing ${shownIndex}`}
              </span>
            </div>
            <MoveList
              sans={sans}
              pgn={snap.pgn}
              viewIndex={shownIndex}
              onSelect={(i) => setViewIndex(Math.max(0, Math.min(i, sans.length)))}
            />
          </div>
        </aside>
      </div>

      <Dialog open={confirmResign} onOpenChange={setConfirmResign}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resign this game?</DialogTitle>
            <DialogDescription>Your opponent will be awarded the win.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmResign(false)}>
              Keep playing
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmResign(false);
                void act("match:resign");
              }}
            >
              Resign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PlayerBar({
  name,
  color,
  isMe,
  ms,
  toMove,
}: {
  name: string;
  color: "white" | "black";
  isMe: boolean;
  ms: number;
  toMove: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="relative">
          <Avatar name={name} className="size-9" />
          <span
            className={cn(
              "absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border-2 border-background",
              color === "white" ? "bg-white ring-1 ring-foreground/20" : "bg-zinc-900",
            )}
          />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold">{name}</span>
            {isMe && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                You
              </span>
            )}
          </div>
          <div className="text-xs capitalize text-muted-foreground">
            {toMove ? <span className="font-medium text-success">To move</span> : color}
          </div>
        </div>
      </div>
      <Clock ms={ms} active={toMove} />
    </div>
  );
}

function BackLink({ tournamentId }: { tournamentId?: string }) {
  return (
    <Link
      href={tournamentId ? `/tournaments/${tournamentId}` : "/tournaments"}
      className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
      {tournamentId ? "Back to tournament" : "Tournaments"}
    </Link>
  );
}
