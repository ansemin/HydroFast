import "./Vector.css";

export default function Vector({ className = "" }) {
  return (
    <div className={`${className}`}>
      <svg
        width="100%"
        height="100%"
        style={{ overflow: "visible" }}
        preserveAspectRatio="none"
        viewBox="0 0 20 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 0H0V16H20V0ZM18 4L10 9L2 4V2L10 7L18 2V4Z"
          fill="#676767"
        />
      </svg>
    </div>
  );
}
