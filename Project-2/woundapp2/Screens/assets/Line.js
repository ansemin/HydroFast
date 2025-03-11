import "./Line.css";

export default function Line({ className = "" }) {
  return (
    <div className={`${className}`}>
      <svg
        width="100%"
        height="100%"
        style={{ overflow: "visible" }}
        preserveAspectRatio="none"
        viewBox="0 0 231 2"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <line y1="1" x2="231" y2="1" stroke="#8F8F8F" strokeWidth="2" />
      </svg>
    </div>
  );
}
