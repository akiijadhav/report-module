import Image from 'next/image';
import React, { ReactElement } from 'react';
import { ReportWorkflowStep } from './models/report-workflow-step';

export default function ReportContainer({
  children,
  reportWorkflowSteps,
}: {
  children?: ReactElement | ReactElement[];
  reportWorkflowSteps: ReportWorkflowStep[];
}) {
  return (
    <div className="relative">
      <div className="report-stepper flex flex-row  pt-4 pb-4 border-b border-gray-300">
        {reportWorkflowSteps.map((item, index) => (
          <div
            className={`flex flex-row ml-4 mr-16 items-center p-2  ${
              item.active ? 'bg-gray-100 rounded' : ''
            }`}
            key={index + 1}
          >
            {item.active ? (
              <span className="flex-shrink-0">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 bg-blue-600">
                  <span className="text-white ">{item.stepNo}</span>
                </span>
              </span>
            ) : item.isFinished ? (
              <Image
                src="/icons/steptick.svg"
                alt="Profile icon"
                width={18}
                height={20}
              />
            ) : (
              <Image
                src="/icons/stepLock.svg"
                alt="Profile icon"
                width={18}
                height={20}
              />
            )}
            <p
              className={`ml-2  font-medium text-sm ${
                item.active ? 'text-gray-800' : 'text-gray-400'
              }`}
            >
              {item.name}
            </p>
          </div>
        ))}
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
