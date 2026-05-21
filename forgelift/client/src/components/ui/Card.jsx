const Card = ({ children, className = "" }) => (
  <section className={`metal-panel rounded-lg p-5 ${className}`}>{children}</section>
);

export default Card;
