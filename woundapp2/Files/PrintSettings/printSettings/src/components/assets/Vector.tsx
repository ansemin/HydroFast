import "./Vector.css";

export default function Vector({ className = "" }: VectorProps) {
  return (
    <div className={`${className}`}>
      <svg width="100%" height="100%" style={{"overflow":"visible"}} preserveAspectRatio="none" viewBox="0 0 22 19" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.7902 0L8.70977 13.1176L2.75 7.23951L0 9.95379L9.16523 19L22 2.71429L18.7902 0Z" fill="#2864DA"/>
      </svg>
      
    </div>
  );
}

interface VectorProps {
  className?: string;
}
