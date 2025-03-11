import "./Vector.css";

export default function Vector({ className = "" }: VectorProps) {
  return (
    <div className={`${className}`}>
      <svg width="100%" height="100%" style={{"overflow":"visible"}} preserveAspectRatio="none" viewBox="0 0 27.17 27.17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M23 23L17.4507 17.4507M17.4507 17.4507C18.3999 16.5014 19.1529 15.3745 19.6666 14.1343C20.1803 12.8941 20.4447 11.5648 20.4447 10.2224C20.4447 8.87995 20.1803 7.55067 19.6666 6.31044C19.1529 5.0702 18.3999 3.9433 17.4507 2.99406C16.5014 2.04483 15.3745 1.29185 14.1343 0.778132C12.8941 0.264409 11.5648 -1.00018e-08 10.2224 0C8.87995 1.00018e-08 7.55067 0.264409 6.31044 0.778132C5.0702 1.29185 3.9433 2.04483 2.99406 2.99406C1.077 4.91113 -2.01996e-08 7.51123 0 10.2224C2.01996e-08 12.9335 1.077 15.5336 2.99406 17.4507C4.91113 19.3677 7.51123 20.4447 10.2224 20.4447C12.9335 20.4447 15.5336 19.3677 17.4507 17.4507Z" stroke="#626262" stroke-width="4.16667" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      
    </div>
  );
}

interface VectorProps {
  className?: string;
}
