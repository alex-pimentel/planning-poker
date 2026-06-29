export default function Card2D({
  value,
  faceDown = false,
  isSelected = false,
  isRevealed = false,
  onClick,
  disabled = false,
  size = "md",
}) {
  const sizeClasses = {
    sm: "card-sm",
    md: "card-md",
    lg: "card-lg",
  }[size];

  const showFront = isRevealed || !faceDown;

  return (
    <div
      className={`card-2d ${sizeClasses} ${disabled ? "" : "card-clickable"} ${isSelected ? "card-selected" : ""}`}
      onClick={disabled ? undefined : onClick}
      role={disabled ? undefined : "button"}
      tabIndex={disabled ? undefined : 0}
      onKeyDown={
        disabled
          ? undefined
          : (e) => {
              if (e.key === "Enter" || e.key === " ") onClick?.();
            }
      }
    >
      <div className={`card-2d-inner ${showFront ? "card-2d-flipped" : ""}`}>
        {/* Back */}
        <div className="card-2d-back" />
        {/* Front */}
        <div
          className={`card-2d-front ${isSelected ? "card-2d-selected" : ""}`}
        >
          <span className="card-2d-value-top">{value}</span>
          <span className="card-2d-value-main">{value}</span>
          <span className="card-2d-value-bottom">{value}</span>
        </div>
      </div>
    </div>
  );
}
