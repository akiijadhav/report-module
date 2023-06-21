import React from "react";

const DisplayPdfError = function ({ isPage }: { isPage: boolean }) {
  return (
    <div className="h-full flex items-center text-center text-red-500 text-2xl">
      {isPage ? 'Failed to load the page' : 'Failed to load PDF file'}
    </div>
  );
};

export default DisplayPdfError;
