export const Stars = ({ n }: { n: number }) => (
  <span className="stars">{[1, 2, 3].map(i => (i <= n ? <span key={i}>★</span> : <span key={i} className="off">★</span>))}</span>
);
