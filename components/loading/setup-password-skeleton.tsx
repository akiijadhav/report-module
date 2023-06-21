import React from "react";
import RocFormContainer from '../ui/form-container';

export default function SetupPasswordSkeleton() {
  return (
    <>
      <RocFormContainer>
        <div className="w-full flex flex-col gap-6 animate-pulse">
          <div className="w-20 h-20 bg-gray-200 rounded-full" />
          <div className="rounded-full w-[13rem] h-10 bg-gray-200" />
          <div className="rounded-full w-full h-11 bg-gray-200" />
          <div className="rounded-full w-full h-11 bg-gray-200" />
          <div className="rounded-full w-full h-11 bg-gray-200" />
          <div className="mt-1 rounded-3xl w-[22rem] h-20 bg-gray-200" />
          <div className="rounded-full w-full h-12 bg-gray-200" />
        </div>
      </RocFormContainer>
    </>
  );
}
