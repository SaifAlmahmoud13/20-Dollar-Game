import { TopBar, Toggle } from '../components/ui.jsx';

const MAX_PLAYERS = 8;

export default function Players({ setup, setSetup, onBack, onNext, onHelp }) {
  const label = setup.teams ? 'Team' : 'Player';
  const update = (i, value) => setSetup({ ...setup, names: setup.names.map((n, j) => (j === i ? value : n)) });
  const remove = (i) => setSetup({ ...setup, names: setup.names.filter((_, j) => j !== i) });
  const add = () => setSetup({ ...setup, names: [...setup.names, ''] });

  return (
    <div className="screen">
      <TopBar onBack={onBack} />
      <div className="content">
        <div className="title-row">
          <h1 className="big-title">$20 Challenge</h1>
          <button type="button" className="icon-btn" aria-label="How to play" onClick={onHelp}>
            ?
          </button>
        </div>
        {setup.names.map((name, i) => (
          <label className="field player-field" key={i}>
            <span>
              {label} {i + 1}
            </span>
            <div className="input-wrap">
              <input
                value={name}
                maxLength={20}
                placeholder={`Enter ${label.toLowerCase()} name`}
                onChange={(e) => update(i, e.target.value)}
              />
              {setup.names.length > 2 && (
                <button type="button" className="icon-btn small" aria-label={`Remove ${label} ${i + 1}`} onClick={() => remove(i)}>
                  ✕
                </button>
              )}
            </div>
          </label>
        ))}
        {setup.names.length < MAX_PLAYERS && (
          <button type="button" className="btn btn-ghost add-player" onClick={add}>
            + Add {label.toLowerCase()}
          </button>
        )}
        <div className="setting-row plain">
          <span>Play with teams</span>
          <Toggle label="Play with teams" checked={setup.teams} onChange={(teams) => setSetup({ ...setup, teams })} />
        </div>
      </div>
      <div className="footer">
        <button type="button" className="btn btn-primary" onClick={onNext}>
          Start Game
        </button>
      </div>
    </div>
  );
}
