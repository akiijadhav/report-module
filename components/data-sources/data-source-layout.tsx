import Image from 'next/image';
import React, { ReactElement } from 'react';
import { DataSourcetWorkflowStep } from '../data-sources/models/data-source-workflow';

export default function DataSourceContainer({
  children,
  workflowSteps,
}: {
  children?: ReactElement | ReactElement[];
  workflowSteps: DataSourcetWorkflowStep[];
}) {
  return (
    <div className="relative">
      <div className="report-stepper py-2 px-4 flex gap-2 border-b border-gray-300">
        {workflowSteps?.map((item) => (
          <div
            className={`py-2 px-4 flex items-center gap-2 ${
              item.active ? 'bg-gray-50 rounded' : ''
            }`}
            key={item.name + '-wrapper'}
          >
            {item.active ? (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200">
                <span className="text-gray-600">{item.stepNo}</span>
              </span>
            ) : item.isFinished ? (
              <Image
                src="/icons/steptick.svg"
                alt="Profile icon"
                width={24}
                height={24}
              />
            ) : (
              <Image
                src="/icons/stepLock.svg"
                alt="Profile icon"
                width={24}
                height={24}
              />
            )}
            <p
              className={`font-medium text-sm ${
                item.active || item.isFinished
                  ? 'text-gray-800'
                  : 'text-gray-400'
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
