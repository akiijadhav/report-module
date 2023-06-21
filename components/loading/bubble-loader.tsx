import React from "react";

export default function BubbleLoader() {
  return (
    <div className="flex justify-center items-center h-full">
      <div className="bubble-loader" aria-busy="true">
        <span className="bubble1" />
        <span className="bubble2" />
        <span className="bubble3" />
      </div>
    </div>
  );
}
