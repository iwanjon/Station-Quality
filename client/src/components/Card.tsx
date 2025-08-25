// import React from "react";
import type { ReactNode, CSSProperties } from "react";

type CardContainerProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

const CardContainer = ({ children, className = "", style }: CardContainerProps) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-lg border border-gray-200 p-4 ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

export default CardContainer;
