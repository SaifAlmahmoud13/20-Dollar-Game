import { useEffect, useState } from 'react';
import { Modal, TopBar } from '../components/ui.jsx';
import { canBuy, currentItem, forcedWinner, maxBid, sell } from '../game/logic.js';

export default function Auction({ game, onSell, onUndo, canUndo, onQuit }) {
  const item = currentItem(game);
  const ceiling = maxBid(game);
  const [price, setPrice] = useState(Math.min(1, ceiling));
  useEffect(() => setPrice(Math.min(1, ceiling)), [game.index, ceiling]);

  const [confirmQuit, setConfirmQuit] = useState(false);
  const forced = forcedWinner(game);
  const bump = (d) => setPrice((p) => Math.max(0, Math.min(ceiling, p + d)));

  return (
    <div className="screen auction">
      <TopBar
        onBack={() => (game.index > 0 ? setConfirmQuit(true) : onQuit())}
        title={game.theme.name}
        right={
          <button type="button" className="icon-btn" aria-label="Undo last sale" disabled={!canUndo} onClick={onUndo}>
            ↶
          </button>
        }
      />
      <div className="content">
        <p className="progress-label">
          Item {game.index + 1} of {game.queue.length}
        </p>
        <div className="progress">
          <span style={{ width: `${(game.index / game.queue.length) * 100}%` }} />
        </div>

        <div className="lot" key={game.index}>
          <span className="lot-emoji">{item.emoji}</span>
          <span className="lot-name">{item.name}</span>
        </div>

        {forced !== null ? (
          <div className="forced">
            <p>
              Only <b style={{ color: game.players[forced].color }}>{game.players[forced].name}</b> has room left, so
              it's theirs for free.
            </p>
            <button type="button" className="btn btn-primary" onClick={() => onSell(sell(game, forced, 0))}>
              Give it to {game.players[forced].name}
            </button>
          </div>
        ) : (
          <div className="bid-controls">
            <button type="button" className="round-btn" aria-label="Lower price" disabled={price <= 0} onClick={() => bump(-1)}>
              −1
            </button>
            <span className="price" aria-live="polite">
              ${price}
            </span>
            <button type="button" className="round-btn" aria-label="Raise price by 1" disabled={price >= ceiling} onClick={() => bump(1)}>
              +1
            </button>
            <button type="button" className="round-btn" aria-label="Raise price by 5" disabled={price >= ceiling} onClick={() => bump(5)}>
              +5
            </button>
          </div>
        )}

        <ul className="bidders">
          {game.players.map((p, i) => {
            const ok = forced === null && canBuy(game, i, price);
            const full = p.items.length >= game.slots;
            return (
              <li key={i} className={`bidder-row ${full ? 'full' : ''}`} style={{ '--player': p.color }}>
                <div className="bidder-info">
                  <span className="bidder-name">{p.name}</span>
                  <span className="bidder-stats">
                    <b>${p.money}</b> left · {full ? 'full' : `${game.slots - p.items.length} slot${game.slots - p.items.length === 1 ? '' : 's'} left`}
                  </span>
                  <span className="bidder-items">
                    {p.items.map((it) => (
                      <span key={it.name} title={`${it.name} ($${it.price})`}>
                        {it.emoji}
                      </span>
                    ))}
                  </span>
                </div>
                <button type="button" className="sold-btn" disabled={!ok} onClick={() => onSell(sell(game, i, price))}>
                  Sold ${price}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      {confirmQuit && (
        <Modal title="Quit this auction?" onClose={() => setConfirmQuit(false)}>
          <p className="muted">Everything bought so far will be lost.</p>
          <div className="row-buttons">
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmQuit(false)}>
              Keep playing
            </button>
            <button type="button" className="btn btn-primary" onClick={onQuit}>
              Quit
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
