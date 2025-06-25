import React from 'react';

const EMILogo = ({ 
  size = 90, 
  className = "", 
  animate = false 
}) => {
  return (
    <div 
      className={`${className} ${animate ? 'animate-pulse' : ''} transition-all duration-300 hover:scale-110`} 
      style={{ width: size, height: size * (80.269 / 90) }}
    >
      <img
        src="/emi-logo.svg"
        alt="EMI AI Assistant Logo"
        width={size}
        height={size * (80.269 / 90)}
        className="w-full h-full object-contain drop-shadow-xl"
        style={{
          filter: 'drop-shadow(0 0 20px rgba(180, 128, 228, 0.7))',
        }}
        onError={(e) => {
          console.error('Logo SVG failed to load, using fallback PNG');
          // Fallback to PNG version
          e.target.src = "/purple-ai-robot.png";
          e.target.style.filter = 'drop-shadow(0 0 20px rgba(147, 51, 234, 0.6)) hue-rotate(10deg) saturate(1.2)';
          e.target.onError = (e2) => {
            console.error('Logo PNG also failed, using text fallback');
            // Final fallback to text
            e2.target.style.display = 'none';
            e2.target.parentNode.innerHTML = `
              <div style="width: ${size}px; height: ${size * (80.269 / 90)}px; background: linear-gradient(135deg, #B480E4, #7c3aed); border-radius: 20%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: ${size/3}px; box-shadow: 0 0 20px rgba(180, 128, 228, 0.7);">
                EMI
              </div>
            `;
          };
        }}
      />
    </div>
  );
};

export default EMILogo;