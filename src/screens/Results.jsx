import { useState } from 'react';
import Board from '../components/Board.jsx';
import { judgeGame, AIError, AI_ENABLED, NEEDS_KEY } from '../ai/index.js';
import { spent } from '../game/logic.js';
import { money } from '../lib/format.js';

const winnersOf = (scores) => {
  const best = Math.max(...scores);
  return scores.map((s, i) => (s === best ? i : -1)).filter((i) => i >= 0);
};

export default function Results({
  game, outcome, setOutcome, aiJudge, apiKey, label, wins,
  onRematch, onNewTheme, onChangeThemes, onHome,
}) {
  const [mode, setMode] = useState(AI_ENABLED && aiJudge && (!NEEDS_KEY || apiKey) ? 'ai' : 'vote');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [shareLabel, setShareLabel] = useState('Share');

  async function askJudge() {
    setBusy(true);
    setError('');
    try {
      const { scores, verdict } = await judgeGame(apiKey, game, label);
      setOutcome({ scores, verdict, winners: winnersOf(scores) });
    } catch (err) {
      setError(err instanceof AIError ? err.message : 'The judge fell asleep. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    const lines = game.players.map((p, i) => {
      const score = outcome?.scores ? ` ${outcome.scores[i]}/10` : '';
      const crown = outcome?.winners.includes(i) ? ' 👑' : '';
      return `${p.name}${crown}${score}: ${p.items.map((it) => it.emoji).join('')}`;
    });
    const text = [`$20 Challenge: ${game.theme.emoji} ${game.theme.name}`, ...lines, outcome?.verdict].filter(Boolean).join('\n');
    try {
      await navigator.share({ text });
      return;
    } catch (err) {
      if (err?.name === 'AbortError') return; // user closed the share sheet
    }
    try {
      await navigator.clipboard.writeText(text);
      setShareLabel('Copied!');
    } catch {
      setShareLabel("Couldn't copy");
    }
    setTimeout(() => setShareLabel('Share'), 2000);
  }

  const decided = !!outcome;

  return (
    <div className="screen results">
      <header className="topbar">
        <button type="button" className="icon-btn" aria-label="Home" onClick={onHome}>
          ✕
        </button>
        <span className="kicker">{game.theme.name}</span>
        <button type="button" className="pill-btn" onClick={share}>
          {shareLabel}
        </button>
      </header>
      <div className="content">
        <h1 className="results-title">{decided ? `${outcome.winners.map((i) => game.players[i].name).join(' & ')} wins!` : 'Who built it better?'}</h1>
        {!decided && mode === 'vote' && <p className="muted center-text">Tap the winning build.</p>}

        {mode === 'ai' && (
          <div className="judge-card">
            <div className="judge-head">
              <span className="orb" aria-hidden="true" />
              <span className="kicker">{outcome?.verdict ? 'AI-generated' : 'AI judge'}</span>
            </div>
            {outcome?.verdict ? (
              <p className="verdict">{outcome.verdict}</p>
            ) : busy ? (
              <div className="skeleton" aria-label="The judge is thinking">
                <span /><span /><span />
              </div>
            ) : (
              <p className="muted">Ready when you are. The judge scores every build out of 10.</p>
            )}
            {error && <p className="error">{error}</p>}
          </div>
        )}

        <div className={`boards n${Math.min(game.players.length, 4)}`}>
          {game.players.map((p, i) => (
            <div className="board-wrap" key={i}>
              <Board
                theme={game.theme}
                player={p}
                highlight={outcome?.winners.includes(i)}
                badge={outcome?.winners.includes(i) ? `${p.name} wins` : null}
                onClick={!decided && mode === 'vote' ? () => setOutcome({ winners: [i] }) : undefined}
              />
              <div className="board-caption" style={{ color: p.color }}>
                <span className="board-name">
                  {p.name}
                  {wins[p.name] ? <small> · {wins[p.name]} win{wins[p.name] === 1 ? '' : 's'}</small> : null}
                </span>
                <span className="board-score">
                  {outcome?.scores ? outcome.scores[i].toFixed(1) : `${money(spent(game, i))} spent`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="footer">
        {!decided && mode === 'ai' && (
          <>
            <button type="button" className="btn btn-primary" disabled={busy} onClick={askJudge}>
              {busy ? 'Judging…' : error ? 'Try again' : 'Who won?'}
            </button>
            <button type="button" className="link" onClick={() => setMode('vote')}>
              We'll decide ourselves
            </button>
          </>
        )}
        {decided && (
          <>
            <div className="row-buttons">
              <button type="button" className="btn btn-ghost" onClick={onRematch}>
                Rematch
              </button>
              <button type="button" className="btn btn-primary" onClick={onNewTheme}>
                New theme
              </button>
            </div>
            <button type="button" className="link" onClick={onChangeThemes}>
              Change themes & settings
            </button>
          </>
        )}
      </div>
    </div>
  );
}
