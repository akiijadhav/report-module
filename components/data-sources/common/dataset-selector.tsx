import Image from 'next/image';
import tableSelectorIcon from '../../../public/icons/table-selector-icon.svg';
import leftArrow from '../../../public/icons/left-arrow.svg';
import { Dispatch, SetStateAction, useState } from 'react';
import { DatasetDetail } from '../models/data-source-detail';

export default function DataSetSelector(props: {
  dataSets: DatasetDetail[];
  activeDataSetId: string;
  setActiveDataSetId: Dispatch<SetStateAction<string>>;
  setPrevDataSetId?: Dispatch<SetStateAction<string>>;
}) {
  const { dataSets, activeDataSetId, setActiveDataSetId, setPrevDataSetId } =
    props;

  const [showDataSetPicklist, setShowDataSetPicklist] = useState(false);

  return (
    <div
      id="table-selector"
      className="sticky bottom-[59px] z-10 px-4 bg-gray-200 border border-gray-300 flex items-center"
    >
      <div className="relative px-4 py-2 flex items-center justify-center border-r-2 border-gray-300">
        {showDataSetPicklist && (
          <>
            <div
              className="fixed top-0 left-0 w-full h-full z-10 cursor-default"
              onClick={(e) => {
                e.stopPropagation();
                setShowDataSetPicklist(false);
              }}
            />
            <ul className="absolute z-20 bottom-[calc(100%_+_0.3rem)] left-[20%] min-w-max max-h-28 overflow-y-auto py-2 bg-white border border-gray-50 shadow-md rounded font-normal text-sm leading-[19px] text-gray-600">
              {dataSets.map((dataSet) => {
                return (
                  <li
                    className="py-2 px-4 hover:bg-light-blue-50 cursor-pointer"
                    key={dataSet?.id + '-list-selector'}
                    onClick={() => {
                      if (!!setPrevDataSetId) {
                        setPrevDataSetId(activeDataSetId);
                      }
                      setActiveDataSetId(dataSet?.id || '');
                      setShowDataSetPicklist(false);
                    }}
                  >
                    {dataSet.name}
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
            showDataSetPicklist ? 'bg-gray-100' : ''
          }`}
          onClick={() =>
            setShowDataSetPicklist(
              (showValidationTestPicklist) => !showValidationTestPicklist,
            )
          }
        />
      </div>

      {dataSets?.map((dataSet, index) => {
        const isActive = activeDataSetId === dataSet?.id;
        return (
          <div
            key={dataSet?.id + 'tab-selector-' + index}
            onClick={() => {
              if (!!setPrevDataSetId) {
                setPrevDataSetId(activeDataSetId);
              }
              setActiveDataSetId(dataSet?.id || '');
              setShowDataSetPicklist(false);
            }}
            className={`px-4 py-2 border-r border-gray-100 font-medium text-sm leading-6 cursor-pointer ${
              isActive
                ? 'text-light-blue-600 bg-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {dataSet?.name || `Dataset-${index + 1}`}
          </div>
        );
      })}

      {/* <div className="bg-inherit sticky right-0 px-4 py-2 border-l-2 border-gray-300 flex items-center justify-end gap-2">
        <Image
          src={leftArrow}
          alt="Click to display conditional input table for previous dataset (if any)"
          className="cursor-pointer rounded hover:bg-gray-100"
          onClick={() => {
            const activeDataSetIndex = dataSets?.findIndex(
              (dataset) => dataset?.id === activeDataSetId,
            );
            if (activeDataSetIndex - 1 >= 0) {
              setActiveDataSetId(
                dataSets?.at(activeDataSetIndex - 1)?.id || '',
              );
            }
          }}
        />
        <Image
          src={leftArrow}
          alt="Click to display conditional input table for next test (if any)"
          className="cursor-pointer rounded hover:bg-gray-100 rotate-180"
          onClick={() => {
            const activeDataSetIndex = dataSets?.findIndex(
              (dataset) => dataset?.id === activeDataSetId,
            );
            if (activeDataSetIndex + 1 <= dataSets?.length - 1) {
              setActiveDataSetId(
                dataSets?.at(activeDataSetIndex + 1)?.id || '',
              );
            }
          }}
        />
      </div> */}
    </div>
  );
}
