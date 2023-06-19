import Image from 'next/image';
import tableSelectorIcon from '../../../public/icons/table-selector-icon.svg';
import leftArrow from '../../../public/icons/left-arrow.svg';
import { Dispatch, SetStateAction, useState } from 'react';
import { Dataset } from '../models/dataset';

export default function ValidationTestSelector(props: {
  datasets: Dataset[];
  setActiveDataset: Dispatch<SetStateAction<number>>;
}) {
  const { datasets, setActiveDataset } = props;

  const [showValidationTestPicklist, setShowValidationTestPicklist] =
    useState(false);

  return (
    <div
      id="table-selector"
      className="sticky bottom-[73px] z-10 px-4 bg-gray-200 border border-gray-300 flex items-center"
    >
      <div className="relative px-4 py-2 flex items-center justify-center border-r-2 border-gray-300">
        {showValidationTestPicklist && (
          <>
            <div
              className="fixed top-0 left-0 w-full h-full z-10 cursor-default"
              onClick={(e) => {
                e.stopPropagation();
                setShowValidationTestPicklist(false);
              }}
            />
            <ul className="absolute z-20 bottom-[calc(100%_+_0.3rem)] left-[20%] min-w-max max-h-28 overflow-y-auto py-2 bg-white border border-gray-50 shadow-md rounded font-normal text-sm leading-[19px] text-gray-600">
              {datasets.map((test, index) => {
                return (
                  <li
                    className="py-2 px-4 hover:bg-light-blue-50 cursor-pointer"
                    key={test.name}
                    onClick={() => {
                      setActiveDataset(index);
                      setShowValidationTestPicklist(false);
                    }}
                  >
                    {test.displayName}
                  </li>
                );
              })}
            </ul>
          </>
        )}
        <Image
          src={tableSelectorIcon}
          alt="Toggle table dropdown"
          className={`cursor-pointer rounded hover:bg-gray-100 ${
            showValidationTestPicklist ? 'bg-gray-100' : ''
          }`}
          onClick={() =>
            setShowValidationTestPicklist(
              (showValidationTestPicklist) => !showValidationTestPicklist,
            )
          }
        />
      </div>

      {datasets?.map((test) => {
        return (
          <div
            key={test.name}
            onClick={() => {
              const clickedTestIndex = datasets.findIndex(
                (testParam) => testParam.name === test.name,
              );
              setActiveDataset(clickedTestIndex);
              setShowValidationTestPicklist(false);
            }}
            className={`px-4 py-2 border-r border-gray-100 font-medium text-sm leading-6 cursor-pointer ${
              test.isActive
                ? 'text-light-blue-600 bg-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {test.displayName}
          </div>
        );
      })}

      <div className="bg-inherit sticky right-0 px-4 py-2 border-l-2 border-gray-300 flex items-center justify-end gap-2">
        <Image
          src={leftArrow}
          alt="Click to display conditional input table for previous test (if any)"
          className="cursor-pointer rounded hover:bg-gray-100"
          onClick={() => {
            setActiveDataset((activeValidationTest) => {
              if (activeValidationTest > 0) {
                return activeValidationTest - 1;
              } else {
                return activeValidationTest;
              }
            });
          }}
        />
        <Image
          src={leftArrow}
          alt="Click to display conditional input table for next test (if any)"
          className="cursor-pointer rounded hover:bg-gray-100 rotate-180"
          onClick={() => {
            setActiveDataset((activeValidationTest) => {
              if (activeValidationTest < datasets.length - 1) {
                return activeValidationTest + 1;
              } else {
                return activeValidationTest;
              }
            });
          }}
        />
      </div>
    </div>
  );
}
