import { useEffect, useState } from 'react';
import { Modal, NumberInput, TopBar } from '../components/ui.jsx';
import { canBuy, currentItem, forcedWinner, maxBid, sell } from '../game/logic.js';
import { MAX_BUDGET, money, shortMoney } from '../lib/format.js';
import { sfx } from '../lib/sound.js';

export default function Auction({ game, onSell, onUndo, canUndo, onQuit, bidStep, onBidStep }) {
  const item = currentItem(game);
  const ceiling = maxBid(game);
  // The players choose how far the bid buttons move ($1 unless changed); each item opens at one step.
  const small = bidStep;
  const big = bidStep * 5;
  const [price, setPrice] = useState(Math.min(small, ceiling));
  useEffect(() => setPrice(Math.min(small, ceiling)), [game.index, ceiling]); // eslint-disable-line react-hooks/exhaustive-deps

  const [confirmQuit, setConfirmQuit] = useState(false);
  const forced = forcedWinner(game);
  const bump = (d) => {
    (d > 0 ? sfx.bidUp : sfx.bidDown)();
    setPrice((p) => Math.max(0, Math.min(ceiling, p + d)));
  };
  const sellTo = (p, at) => {
    (at === 0 && forced !== null ? sfx.free : sfx.sold)();
    onSell(sell(game, p, at));
  };

  return (
    <div className="screen auction">
      <TopBar
        onBack={() => (game.index > 0 ? setConfirmQuit(true) : onQuit())}
        title={game.theme.name}
        right={
          <button
            type="button"
            className="icon-btn"
            aria-label="Undo last sale"
            disabled={!canUndo}
            onClick={() => {
              sfx.undo();
              onUndo();
            }}
          >
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
            <button type="button" className="btn btn-primary" onClick={() => sellTo(forced, 0)}>
              Give it to {game.players[forced].name}
            </button>
          </div>
        ) : (
          <div className="bid-controls">
            <NumberInput
              className="price"
              label="Price"
              value={price}
              onChange={setPrice}
              min={0}
              max={ceiling}
              format={money}
            />
            <div className="bid-buttons">
              <button type="button" className="round-btn" aria-label={`Lower price by ${money(small)}`} disabled={price <= 0} onClick={() => bump(-small)}>
                −{shortMoney(small).slice(1)}
              </button>
              <button type="button" className="round-btn" aria-label={`Raise price by ${money(small)}`} disabled={price >= ceiling} onClick={() => bump(small)}>
                +{shortMoney(small).slice(1)}
              </button>
              <button type="button" className="round-btn" aria-label={`Raise price by ${money(big)}`} disabled={price >= ceiling} onClick={() => bump(big)}>
                +{shortMoney(big).slice(1)}
              </button>
            </div>
            <div className="bid-hint">
              <span>Tap the price to type a bid ·</span>
              <label className="step-label">
                buttons move by
                <NumberInput
                  grow
                  className="step-input"
                  label="Bid buttons move by"
                  value={bidStep}
                  min={1}
                  max={MAX_BUDGET}
                  format={money}
                  onChange={onBidStep}
                />
              </label>
            </div>
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
                    <b>{money(p.money)}</b> left · {full ? 'full' : `${game.slots - p.items.length} slot${game.slots - p.items.length === 1 ? '' : 's'} left`}
                  </span>
                  <span className="bidder-items">
                    {p.items.map((it) => (
                      <span key={it.name} title={`${it.name} (${money(it.price)})`}>
                        {it.emoji}
                      </span>
                    ))}
                  </span>
                </div>
                <button type="button" className="sold-btn" disabled={!ok} onClick={() => sellTo(i, price)}>
                  Sold {money(price)}
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
