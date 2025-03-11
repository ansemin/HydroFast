import "./Arrow.css";

export default function Arrow({ className = "" }: ArrowProps) {
  return (
    <div className={`${className}`}>
      <svg width="100%" height="100%" style={{"overflow":"visible"}} preserveAspectRatio="none" viewBox="0 0 47 44.18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0.878681 20.8787C-0.292892 22.0502 -0.292893 23.9497 0.878681 25.1213L19.9706 44.2132C21.1421 45.3848 23.0416 45.3848 24.2132 44.2132C25.3848 43.0416 25.3848 41.1421 24.2132 39.9706L7.24264 23L24.2132 6.02944C25.3848 4.85786 25.3848 2.95837 24.2132 1.78679C23.0416 0.615221 21.1421 0.615221 19.9706 1.78679L0.878681 20.8787ZM47 20L3 20L3 26L47 26L47 20Z" fill="black"/>
      </svg>
      
    </div>
  );
}

interface ArrowProps {
  className?: string;
}
