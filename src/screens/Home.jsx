export default function Home({ onStart, onHelp }) {
  return (
    <div className="screen home">
      <div className="hero" aria-hidden="true">
        <div className="bidder left">
          <span className="paddle">$19</span>
          <span className="face">🤨</span>
        </div>
        <div className="bidder right">
          <span className="paddle">$20</span>
          <span className="face">😏</span>
        </div>
      </div>
      <div className="home-copy">
        <h1>$20 Challenge</h1>
        <p>
          The auction draft from TikTok. Everyone gets $20, a theme like <b>"Build the best pirate ship"</b> appears,
          and ten items are auctioned one by one. Outbid your friends, hype up the prices and build the best version
          of the theme.
        </p>
      </div>
      <div className="home-actions">
        <button type="button" className="btn btn-dark" onClick={onStart}>
          Start Game
        </button>
        <button type="button" className="link dark" onClick={onHelp}>
          How to play
        </button>
      </div>
    </div>
  );
}
