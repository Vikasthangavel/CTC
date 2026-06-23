export default function Loader() {
  return (
    <div className="loader-overlay">
      <div className="spinner">
        <div className="spin-ring" />
        <div className="spin-ring" />
        <div className="spin-ring" />
      </div>
      <div className="loading-text">PROCESSING...</div>
    </div>
  );
}
