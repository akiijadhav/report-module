import {
  SortingState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { dataSelectdetails } from './models/data-select-details';
import React, {
  Dispatch,
  HTMLProps,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Image from 'next/image';
import goBackArrow from '../../public/icons/go-back-left-arrow.svg';
import arrowUpCircleIcon from '../../public/icons/arrow-up-circle-line.svg';
import useSkipper from '../hooks/use-skipper';
import {
  DataInputReducerAction,
  ResultDetail,
} from './models/dataset-results-detail';
import { DatasetDetail } from './models/data-source-detail';
import { SelectedGroupDetail } from './models/dataset-groups';
import useDataInputLabels from '../hooks/use-data-input-labels';
import { DataSetNames } from './enums/dataset-names';

function IndeterminateCheckbox({
  indeterminate,
  className = '',
  ...rest
}: { indeterminate?: boolean } & HTMLProps<HTMLInputElement>) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof indeterminate === 'boolean') {
      ref.current.indeterminate = !rest.checked && indeterminate;
    }
  }, [ref, indeterminate]);

  return (
    <input
      type="checkbox"
      ref={ref}
      className={className + ' cursor-pointer'}
      {...rest}
    />
  );
}

export default function DataInputSelectData(props: {
  setShow: Dispatch<SetStateAction<boolean>>;
  markerRecord: ResultDetail;
  dispatchDataSetResults: Dispatch<DataInputReducerAction>;
  dataSet: DatasetDetail;
  selectedGroupInfo: SelectedGroupDetail;
}) {
  const {
    setShow,
    markerRecord,
    dispatchDataSetResults,
    dataSet,
    selectedGroupInfo,
  } = props;
  const [sorting, setSorting] = useState<SortingState>([]);
  const [tableData, setTableData] = useState<dataSelectdetails[]>(
    markerRecord?.markerCsvResults || [],
  );
  const getLabels = useDataInputLabels();
  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();

  const labels = useMemo(() => {
    let arraySize = 11;
    if (dataSet?.validationTestFamily === DataSetNames.Correlation) {
      arraySize = 50;
    }
    if (dataSet?.validationTestFamily === DataSetNames.Linearity5) {
      arraySize = 6;
    }
    if (dataSet?.validationTestFamily === DataSetNames.Linearity10) {
      arraySize = 11;
    }
    if (dataSet?.validationTestFamily === DataSetNames.Accuracy) {
      arraySize = 10;
    }
    if (dataSet?.validationTestFamily === DataSetNames.Repeatability) {
      arraySize = 30;
    }
    if (dataSet?.validationTestFamily === DataSetNames.IndoorReproducibility) {
      arraySize = 60;
    }
    if (
      dataSet?.validationTestFamily === DataSetNames.CorrelationQualitative ||
      dataSet?.validationTestFamily === DataSetNames.XResidual
    ) {
      arraySize = 50;
    }
    return getLabels(
      dataSet?.validationTestFamily,
      selectedGroupInfo?.groupName,
      arraySize,
    );
  }, [
    dataSet?.validationTestFamily,
    DataSetNames,
    getLabels,
    selectedGroupInfo?.groupName,
  ]);

  const acnCode = useMemo(
    () => markerRecord?.marker?.acn || '',
    [markerRecord],
  );

  const findResultBefore = useCallback(
    function (index: number, array: dataSelectdetails[]) {
      for (let i = index - 1; i >= 0; i--) {
        if (array[i].mapping_values !== '') {
          return [array[i]?.resultId, array[i].mapping_values];
        }
      }
      return ['', ''];
    },

    [],
  );

  const findIndexAfter = useCallback(
    function (index: number, array: dataSelectdetails[]) {
      for (let i = index + 1; i < array.length; i++) {
        if (array[i].mapping_values !== '') {
          return [array[i]?.resultId, array[i].mapping_values];
        }
      }
      return ['', ''];
    },

    [],
  );

  const columnHelper = createColumnHelper<dataSelectdetails>();
  const columns = useMemo(
    () => [
      columnHelper.accessor('sampleNumber', {
        header: 'Sample_No',
      }),
      columnHelper.accessor('rackNumber', {
        header: 'Rack_No',
      }),
      columnHelper.accessor('rackPos', {
        header: 'Rack_Pos',
      }),
      columnHelper.accessor('sampleId', {
        header: 'Sample_ID',
      }),
      columnHelper.accessor('arrivedDate', {
        header: 'Arrived_Date',
        cell(props) {
          const dateTime = new Date(props.getValue());
          const displayDate = `${dateTime.getFullYear()}/${
            dateTime.getMonth() + 1
          }/${dateTime.getDate()}`;
          const displayTime = dateTime.toLocaleTimeString();
          return (
            <>
              {displayDate} {displayTime}
            </>
          );
        },
      }),
      columnHelper.accessor('result', {
        header: ({ table, column }) => {
          return (
            <div className="flex justify-between items-center">
              <input
                type="checkbox"
                id="select-max-results"
                className="w-4 h-4 cursor-pointer"
                checked={
                  table.getSelectedRowModel().rows.length === labels?.length ||
                  table.getIsAllRowsSelected()
                }
                onChange={(e) => {
                  skipAutoResetPageIndex();
                  if (e.target.checked) {
                    const maxLabels = Number(labels?.length || 0);
                    setTableData((tableData) => {
                      const sortedIDs = table
                        ?.getSortedRowModel()
                        ?.rows?.slice(0, maxLabels)
                        ?.map((row) => row.original.resultId);

                      return tableData?.map((dataObj) => {
                        return {
                          ...dataObj,
                          mapping_values: sortedIDs?.includes(dataObj?.resultId)
                            ? sortedIDs?.indexOf(dataObj?.resultId)
                            : '',
                        };
                      });
                    });

                    table.getSortedRowModel().rows.forEach((row, index) => {
                      row.toggleSelected(!!labels?.at(index));
                    });
                  } else {
                    setTableData((tableData) =>
                      tableData?.map((dataObj) => ({
                        ...dataObj,
                        mapping_values: '',
                      })),
                    );

                    table.toggleAllRowsSelected(false);
                  }
                }}
              />
              <span className="flex items-center gap-2">
                Result
                {column.getIsSorted() ? (
                  <span
                    onClick={column.getToggleSortingHandler()}
                    className="h-6 w-6 text-center hover:bg-gray-200 rounded-sm cursor-pointer"
                  >
                    {column.getIsSorted() === 'asc' ? (
                      <>&#9652;</>
                    ) : (
                      <>&#9662;</>
                    )}
                  </span>
                ) : (
                  <span
                    className="h-6 w-6 text-center hover:bg-gray-200 rounded-sm cursor-pointer"
                    onClick={column.getToggleSortingHandler()}
                  >
                    <span>&#9652;</span>
                    <span>&#9662;</span>
                  </span>
                )}
              </span>
            </div>
          );
        },
        cell: ({ row, renderValue, table }) => {
          const mappingValue = row.original.mapping_values;
          let max = -9999;
          table.options.data.forEach((dataObj) => {
            const mappingValue = dataObj?.mapping_values;
            if (mappingValue !== '' && Number(mappingValue || 0) > max) {
              max = Number(mappingValue || 0);
            }
          });
          const isCheckboxDisabled =
            max === -9999
              ? false
              : !labels?.at(max + 1) && typeof mappingValue === 'string';
          return (
            <div className="flex justify-between items-center">
              <IndeterminateCheckbox
                {...{
                  checked: row.getIsSelected(),
                  disabled: !row.getCanSelect() || isCheckboxDisabled,
                  indeterminate: row.getIsSomeSelected(),
                  onChange: (e) => {
                    skipAutoResetPageIndex();
                    setTableData((tableData) => {
                      if ((e.target as HTMLInputElement).checked) {
                        let max = -1;
                        tableData.forEach((dataObj) => {
                          const mappingValue = dataObj?.mapping_values;
                          if (
                            mappingValue !== '' &&
                            Number(mappingValue || 0) > max
                          ) {
                            max = Number(mappingValue || 0);
                          }
                        });
                        return tableData?.map((dataObj, index) =>
                          index === row.index
                            ? { ...dataObj, mapping_values: max + 1 }
                            : dataObj,
                        );
                      } else {
                        const currentMappingValue = row.original.mapping_values;
                        return tableData?.map((dataObj, index) => {
                          return index === row.index ||
                            dataObj?.mapping_values > currentMappingValue
                            ? {
                                ...dataObj,
                                mapping_values:
                                  index === row.index
                                    ? ''
                                    : Number(dataObj?.mapping_values) - 1,
                              }
                            : dataObj;
                        });
                      }
                    });

                    row.toggleSelected();
                  },
                }}
                className="w-4 h-4"
              />
              <p>{renderValue()}</p>
            </div>
          );
        },
        meta: { isColDifferent: true },
      }),
      columnHelper.accessor('mapping_values', {
        header: 'Mapping Values',
        cell(props) {
          const mappingValue = props.row.original.mapping_values;
          if (mappingValue === '') return null;
          if (!labels[mappingValue]) return null;

          const currentID = props.row.original?.resultId;
          const sortedData =
            props.table
              .getSortedRowModel()
              ?.rows?.map((row) => row?.original) || [];
          const currentSortedIndex = sortedData?.findIndex(
            (dataObj) => dataObj?.resultId === currentID,
          );

          const isUpArrowDisabled = !sortedData?.find(
            (dataObj, index) =>
              dataObj?.mapping_values !== '' && index < currentSortedIndex,
          );
          const isDownArrowDisabled = !sortedData?.find(
            (dataObj, index) =>
              dataObj?.mapping_values !== '' && index > currentSortedIndex,
          );

          return (
            <span className="text-gray-800 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Image
                  src={arrowUpCircleIcon}
                  alt="Move label up"
                  className={`rounded-full ${
                    isUpArrowDisabled
                      ? 'pointer-events-none opacity-70'
                      : 'cursor-pointer hover:bg-gray-100'
                  }`}
                  onClick={() => {
                    if (isUpArrowDisabled) return;
                    skipAutoResetPageIndex();
                    const [prevResultID, prevResult] = findResultBefore(
                      currentSortedIndex,
                      sortedData,
                    );
                    setTableData((tableData) =>
                      tableData?.map((dataObj) => {
                        if (
                          dataObj?.resultId === currentID ||
                          dataObj?.resultId === prevResultID
                        ) {
                          return {
                            ...dataObj,
                            mapping_values:
                              dataObj?.resultId === prevResultID
                                ? mappingValue
                                : prevResult,
                          };
                        } else {
                          return dataObj;
                        }
                      }),
                    );
                  }}
                />
                <Image
                  src={arrowUpCircleIcon}
                  alt="Move label down"
                  className={`rotate-180 rounded-full ${
                    isDownArrowDisabled
                      ? 'pointer-events-none opacity-70'
                      : 'cursor-pointer hover:bg-gray-100'
                  }`}
                  onClick={() => {
                    if (isDownArrowDisabled) return;
                    skipAutoResetPageIndex();
                    const [nextResultID, nextResult] = findIndexAfter(
                      currentSortedIndex,
                      sortedData,
                    );
                    setTableData((tableData) =>
                      tableData?.map((dataObj) => {
                        if (
                          dataObj?.resultId === currentID ||
                          dataObj?.resultId === nextResultID
                        ) {
                          return {
                            ...dataObj,
                            mapping_values:
                              dataObj?.resultId === nextResultID
                                ? mappingValue
                                : nextResult,
                          };
                        } else {
                          return dataObj;
                        }
                      }),
                    );
                  }}
                />
              </span>
              <span className="ml-auto max-w-[90%] break-all">
                {labels[mappingValue]}
              </span>
            </span>
          );
        },
        meta: { isColDifferent: true },
      }),
    ],
    [
      columnHelper,
      setTableData,
      skipAutoResetPageIndex,
      findResultBefore,
      findIndexAfter,
      labels,
    ],
  );

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    autoResetPageIndex,
  });

  const proceedHandler = useCallback(() => {
    const resultArray =
      tableData
        ?.filter((data) => data?.mapping_values !== '')
        ?.sort((a, b) => Number(a?.mapping_values) - Number(b?.mapping_values))
        ?.map((data) => data?.result) || [];

    dispatchDataSetResults({
      type: 'PUT-ARRAY',
      putArray: resultArray,
      dataSetId: dataSet?.id,
      resultId: markerRecord?.markerId,
      testFamily: dataSet?.validationTestFamily,
      groupName: selectedGroupInfo?.groupName,
      groupDisplayName: selectedGroupInfo?.groupDisplayName,
    });
    setShow(false);
  }, [
    tableData,
    dispatchDataSetResults,
    dataSet?.id,
    dataSet?.validationTestFamily,
    markerRecord?.markerId,
    selectedGroupInfo,
    setShow,
  ]);

  return (
    <>
      <div className="px-8 py-6 flex items-center gap-3 font-semibold text-gray-800">
        <Image
          src={goBackArrow}
          alt="Go back to data input table"
          className="rounded cursor-pointer hover:bg-gray-100"
          onClick={() => setShow(false)}
        />
        <span>ACN Code - {acnCode}</span>
      </div>
      <section className="min-h-[calc(100vh_-_15.13rem)]">
        <table className="results-select-table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  const isRowUnselected =
                    cell.column.columnDef.meta?.isColDifferent &&
                    !row.getIsSelected();
                  return (
                    <td
                      key={cell.id}
                      className={`${isRowUnselected ? 'gray-cell' : ''}`}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <div className="sticky bottom-0 bg-white px-4 py-2 flex items-center justify-end border-t border-gray-300">
        <button
          onClick={proceedHandler}
          className="px-3 py-2 bg-light-blue-600 rounded shadow-sm font-semibold text-white hover:bg-blue-600 hover:shadow-none"
        >
          Proceed
        </button>
      </div>
    </>
  );
}
