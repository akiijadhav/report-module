import React, {
  Dispatch,
  SetStateAction,
  UIEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { DatasetDetail } from './models/data-source-detail';
import useRequestUtilities from '../hooks/use-request-utilities';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import useSkipper from '../hooks/use-skipper';
import useFreezedHeader from './common/use-freezed-header';
import useTableElements from './common/use-table-elements';
import {
  DataInputReducerAction,
  DataSetResultLinkAction,
  ResultDetail,
} from './models/dataset-results-detail';
import {
  DataInputFieldsDetail,
  ResultFieldDetail,
} from './models/data-input-fields';
import useDataInputFields from '../hooks/use-data-input-fields';
import { DataSetNames } from './enums/dataset-names';
import {
  DataSetGroupsAction,
  DataSetGroupsDetail,
  SelectedGroupDetail,
} from './models/dataset-groups';
import { useTranslation } from 'react-i18next';

const accuracyCalibrationDisplayData = {
  s1: [
    'ISE: internal standard liquid electromotive force',
    'ISE: LOW electromotive force',
    'ISE: HIGH liquid electromotive force',
    'ISE: Calibrator liquid electromotive force',
  ],
  s2: [
    'ISE: Slope value',
    'ISE:IS concentration',
    'ISE: Calibrator assumed concentration',
    'ISE: comparison value',
  ],
  s3: ['1-1', '1-2', '2-1', '2-2'],
  s4: ['1-1', '1-2', '2-1', '2-2'],
  s5: ['1-1', '1-2', '2-1', '2-2'],
  s6: ['1-1', '1-2', '2-1', '2-2'],
};

export default function DataInputGrid(props: {
  dataSet: DatasetDetail;
  tableSchema: ResultFieldDetail[] | null;
  setDataSetsSchema: Dispatch<SetStateAction<DataInputFieldsDetail[]>>;
  tableData: ResultDetail[];
  dispatchDataSetResults: Dispatch<DataInputReducerAction>;
  dispatchDataSetMarkerLink: Dispatch<DataSetResultLinkAction>;
  dataSourceId: string;
  tableGroups: DataSetGroupsDetail;
  dispatchDataSetGroups: Dispatch<DataSetGroupsAction>;
  setActiveMarkerRecordID: Dispatch<SetStateAction<SelectedGroupDetail>>;
  setShowDataSelectScreen: Dispatch<SetStateAction<boolean>>;
  savingData: boolean;
  viewScreen: 'loading' | 'error' | 'set';
  setViewScreen: Dispatch<SetStateAction<'loading' | 'error' | 'set'>>;
  responseError: {
    msg: string;
    errorOnSubmit: boolean;
  };
  setResponseError: Dispatch<
    SetStateAction<{
      msg: string;
      errorOnSubmit: boolean;
    }>
  >;
  readOnly: boolean;
}) {
  const {
    dataSet,
    tableSchema,
    setDataSetsSchema,
    tableData,
    dispatchDataSetResults,
    dispatchDataSetMarkerLink,
    dataSourceId,
    tableGroups,
    dispatchDataSetGroups,
    setActiveMarkerRecordID,
    setShowDataSelectScreen,
    savingData,
    viewScreen,
    setViewScreen,
    responseError,
    setResponseError,
    readOnly,
  } = props;
  const { fetchWrapper } = useRequestUtilities();
  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();
  const {
    EditableCellDataInput,
    EditableNumberCellDataInput,
    ReadOnlyCell,
    computeClassName,
    groupParentHeaderDataInput,
    GroupParentCell,
  } = useTableElements();
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);

  const horizontalScrollbarContainerRef = useRef<HTMLDivElement>(null);
  const [isTableBodyScrolling, setIsTableBodyScrolling] = useState(false);
  const [isCustomBarScrolling, setIsCustomBarScrolling] = useState(false);
  const [tBodyVisible, setTBodyVisible] = useState(false);
  const { t } = useTranslation();

  const dataSetFields = useDataInputFields(dataSet?.validationTestFamily || '');

  const getMarkerResults = useCallback(
    function () {
      function initiate() {
        setViewScreen('loading');
      }
      async function handleResponse(response: Response) {
        const resJson = await response.json();
        if (response.ok) {
          const results: ResultDetail[] =
            resJson?.map((marker) => ({
              ...marker,
              id: marker?.markerId || '',
              markerCsvResults:
                marker?.markerCsvResults?.map((parsedResult) => ({
                  ...parsedResult,
                  resultId: crypto.randomUUID(),
                  mapping_values: '',
                })) || [],
            })) || [];

          dispatchDataSetResults({
            type: 'PUSH',
            pushPayload: results,
          });
          dispatchDataSetMarkerLink({
            type: 'PUSH',
            dataSetId: dataSet?.id,
            pushPayload: {
              dataSetId: dataSet?.id,
              dataSetName: dataSet?.validationTestFamily,
              resultIDs: results?.map((result) => result?.id) || [],
            },
          });
        } else {
          if (response.status === 500) {
            setResponseError({
              msg: t('error.something_went_wrong'),
              errorOnSubmit: false,
            });
          } else {
            setResponseError({
              msg: resJson?.message || t('error.something_went_wrong'),
              errorOnSubmit: false,
            });
          }
          setViewScreen('error');
        }
      }
      function handleError(_error: any) {
        setResponseError({
          msg: t('error.something_went_wrong'),
          errorOnSubmit: false,
        });
        setViewScreen('error');
      }

      fetchWrapper({
        url: `${process.env.NEXT_PUBLIC_API_BASE_URL_V1}/marker-records/results?dataSourceId=${dataSourceId}&dataSetId=${dataSet.id}`,
        includeAuthToken: true,
        initiate,
        handleResponse,
        handleError,
      });
    },
    [
      setViewScreen,
      dispatchDataSetResults,
      dataSet?.id,
      dataSet?.validationTestFamily,
      setResponseError,
      dataSourceId,
      fetchWrapper,
    ],
  );

  useEffect(() => {
    if (!tableSchema) {
      if (!dataSet?.validationTestFamily) return;
      // Get dataset field schema
      setDataSetsSchema((dataSetsSchema) => [
        ...dataSetsSchema,
        {
          dataSetId: dataSet?.id,
          fields: dataSetFields,
        },
      ]);

      dispatchDataSetGroups({
        type: 'PUSH',
        pushPayload: {
          dataSetId: dataSet?.id,
          dataSetName: dataSet?.validationTestFamily,
          groups:
            dataSetFields
              ?.filter(
                (field) =>
                  field?.dataType === 'array' && !field?.disableDataMapping,
              )
              ?.map((field, index) => ({
                id: index + 1,
                name: field?.name || '',
                displayName: field?.displayName || '',
                selected: !readOnly,
              })) || [],
        },
      });
    }
  }, [
    tableSchema,
    dataSet?.validationTestFamily,
    setDataSetsSchema,
    dataSet?.id,
    dataSetFields,
    dispatchDataSetGroups,
    readOnly,
  ]);

  useEffect(() => {
    setViewScreen('loading');

    if (tableData?.length < 1) {
      if (!dataSet?.id) return;
      // Call GET marker results API
      getMarkerResults();
    } else {
      setViewScreen((viewScreen) => {
        return viewScreen === 'error' ? 'error' : 'set';
      });
    }
  }, [setViewScreen, tableData, dataSet?.id, getMarkerResults]);

  const columns = useMemo(
    function () {
      const columnsRaw: ColumnDef<any, string>[] = [];
      if (!tableSchema) return columnsRaw;

      tableSchema?.forEach((field) => {
        if (field.groupName) {
          if (
            !columnsRaw.find((col) =>
              field.dataSetName
                ? col.id === `${field.dataSetName}.${field.groupName}`
                : col.id === field.groupName,
            )
          ) {
            const tableColumnGroup: ColumnDef<any, string> = {
              id: field.dataSetName
                ? `${field.dataSetName}.${field.groupName}`
                : field.groupName,
              cell: GroupParentCell,
              header: groupParentHeaderDataInput,
              meta: {
                isGroupParent: true,
                displayName: field.groupDisplayName,
                allowResultSelection: !!tableGroups?.groups?.find(
                  (group) => group?.name === field?.name,
                )?.selected,
              },
            };
            if (field.dataSetName) {
              tableColumnGroup.meta.datasetName = field.dataSetName;
            }

            columnsRaw.push(tableColumnGroup);
          }

          if (field.dataType === 'array') {
            Array(field.size)
              .fill(null)
              .forEach((_, index) => {
                let toDisplay = `${index + 1}`;

                if (field.dataSetName === DataSetNames.Correlation) {
                  toDisplay = `${field.name.at(-1)}${index + 1}`;
                }
                if (
                  field.dataSetName === DataSetNames.Linearity5 ||
                  field.dataSetName === DataSetNames.Linearity10
                ) {
                  toDisplay = `${index}/${field.size - 1}`;
                }
                if (field.dataSetName === DataSetNames.IndoorReproducibility) {
                  let dayNumber = 1;
                  toDisplay = `${dayNumber}Day 1 time`;
                  if (index > 0) {
                    const beforePrevious =
                      typeof columnsRaw?.at(-2)?.header === 'string'
                        ? (columnsRaw.at(-2).header as string)?.split('D')[0]
                        : null;

                    const previous = (columnsRaw.at(-1).header as string).split(
                      'D',
                    )[0];

                    if (previous === beforePrevious) {
                      dayNumber = Number(previous) + 1;
                      toDisplay = `${dayNumber}Day 1 time`;
                    } else {
                      dayNumber = Number(previous);
                      toDisplay = `${dayNumber}Day 2 times`;
                    }
                  }
                }
                if (field.dataSetName === DataSetNames.Accuracy) {
                  toDisplay =
                    field.groupName?.split('-')?.at(1) === 'cal'
                      ? accuracyCalibrationDisplayData[
                          field.name?.split('-')?.at(0)
                        ][index]
                      : `${index + 1}`;
                }
                if (
                  field.dataSetName === DataSetNames.CorrelationQualitative ||
                  field.dataSetName === DataSetNames.XResidual
                ) {
                  const isReExam = field?.name?.split('-')?.length === 2;
                  toDisplay = isReExam
                    ? field?.name?.split('-')?.at(0)?.at(-1)
                    : field?.name?.at(-1);
                  toDisplay = toDisplay?.toUpperCase() + (index + 1);
                }

                const tableColumn: ColumnDef<any> = {
                  id: `${field.dataSetName ? field.dataSetName + '.' : ''}${
                    field.groupName
                  }${index + 1}`,
                  cell: EditableNumberCellDataInput,
                  header: toDisplay,
                  accessorFn: (row) => {
                    if (field.dataSetName === DataSetNames.Correlation) {
                      return (
                        row[field.name + 'Results']?.results?.at(index) || null
                      );
                    } else if (
                      field.dataSetName === DataSetNames.Linearity5 ||
                      field.dataSetName === DataSetNames.Linearity10
                    ) {
                      const arrayName = `test${field.groupDisplayName
                        ?.split(' ')
                        ?.at(3)
                        ?.at(0)}Values`;
                      return row[field.dataSetName.slice(0, -5) + 'Results'] &&
                        row[field.dataSetName.slice(0, -5) + 'Results'][
                          field.groupName?.slice(0, 2)
                        ]
                        ? row[field.dataSetName.slice(0, -5) + 'Results'][
                            field.groupName?.slice(0, 2)
                          ][arrayName]?.at(index) || null
                        : null;
                    } else if (
                      field.dataSetName === DataSetNames.IndoorReproducibility
                    ) {
                      const dayNumber = Number(
                        toDisplay?.split('D')?.at(0) || 0,
                      );
                      const count = Number(toDisplay?.split(' ')?.at(1) || 0);

                      return (
                        row?.listIndoorReproducibilityResults?.[field.name]
                          ?.find((daySample) => daySample?.day === dayNumber)
                          ?.sampleData?.find(
                            (sampleItem) => sampleItem?.time === count,
                          )?.value || null
                      );
                    } else if (field.dataSetName === DataSetNames.Accuracy) {
                      return row.accuracyResults &&
                        row.accuracyResults[
                          field.name.split('-')?.at(1) === 'cal'
                            ? 'calibrationResultsDataInput'
                            : 'accuracyResultsDataInput'
                        ]
                        ? row.accuracyResults[
                            field.name.split('-')?.at(1) === 'cal'
                              ? 'calibrationResultsDataInput'
                              : 'accuracyResultsDataInput'
                          ][field.name.split('-')?.at(0)]?.values?.at(index) ||
                            null
                        : null;
                    } else if (
                      field.dataSetName === DataSetNames.Repeatability
                    ) {
                      return (
                        row?.listRepeatabilityResults?.[field.name]?.at(
                          index,
                        ) || null
                      );
                    } else if (
                      field.dataSetName === DataSetNames.CorrelationQualitative
                    ) {
                      const isReExam =
                        field?.groupName?.split('-')?.length === 2;

                      return (
                        row[
                          DataSetNames.CorrelationQualitative +
                            toDisplay?.at(0) +
                            'Results'
                        ]?.[isReExam ? 'resultsRetest' : 'results']?.at(
                          index,
                        ) || null
                      );
                    } else if (field.dataSetName === DataSetNames.XResidual) {
                      const isReExam =
                        field?.groupName?.split('-')?.length === 2;

                      return (
                        row['correlation' + toDisplay?.at(0) + 'Results']?.[
                          isReExam ? 'resultsRetest' : 'results'
                        ]?.at(index) || null
                      );
                    }
                  },
                  meta: {
                    groupParent: field.groupName,
                    groupDisplayName: field.groupDisplayName,
                    isArray: true,
                  },
                };

                if (!field.dataType || readOnly) {
                  tableColumn.cell = ReadOnlyCell;
                }

                if (field.dataSetName) {
                  tableColumn.meta = {
                    ...tableColumn.meta,
                    datasetName: field.dataSetName,
                  };
                }

                columnsRaw.push(tableColumn);
              });
          } else {
            const tableColumn: ColumnDef<any> = {
              id: `${field.dataSetName ? field.dataSetName + '.' : ''}${
                field.groupName
              }.${field.name}`,
              cell:
                field.dataType === 'number'
                  ? EditableNumberCellDataInput
                  : EditableCellDataInput,
              header: field.displayName,
              accessorFn: (row) => {
                if (field.dataSetName === DataSetNames.Accuracy) {
                  return (
                    row?.accuracyResults?.calibrationResultsDataInput[
                      field.name
                    ] || null
                  );
                }
              },
              meta: {
                groupParent: field.groupName,
                groupDisplayName: field.groupDisplayName,
              },
            };

            if (!field.dataType || readOnly) {
              tableColumn.cell = ReadOnlyCell;
            }

            if (field.dataSetName) {
              tableColumn.meta = {
                ...tableColumn.meta,
                datasetName: field.dataSetName,
              };
            }

            columnsRaw.push(tableColumn);
          }
        } else {
          const tableColumn: ColumnDef<any> = {
            id: field.name,
            header: field.displayName,
            accessorFn: (row) => {
              if (!field?.dataType) {
                return field?.firstLevel
                  ? row?.[field.name] || null
                  : row?.marker?.[field.name] || null;
              } else {
                return row[field.name] || null;
              }
            },
          };

          if (!field.dataSetName) {
            tableColumn.meta = {
              isCommon: true,
              sequenceNo: String(field.sequenceNo),
            };
          }
          if (readOnly) {
            tableColumn.cell = ReadOnlyCell;
          } else {
            if (!field.dataType) {
              tableColumn.cell = ReadOnlyCell;
            } else if (field.dataType === 'string') {
              tableColumn.cell = EditableCellDataInput;
            } else {
              tableColumn.cell = EditableNumberCellDataInput;
            }
          }

          columnsRaw.push(tableColumn);
        }
      });

      return columnsRaw;
    },
    [tableSchema, tableGroups, readOnly],
  );

  const table = useReactTable({
    columns,
    data: tableData,
    getCoreRowModel: getCoreRowModel(),
    autoResetPageIndex,
    meta: {
      updateMarkerResult(
        resultId,
        dataSetName,
        columnId,
        value,
        groupName,
        groupDisplayName,
        isArray,
      ) {
        skipAutoResetPageIndex();
        dispatchDataSetResults({
          type: 'UPDATE',
          resultId,
          testFamily: dataSetName,
          columnId,
          groupName,
          groupDisplayName,
          isArray,
          value,
        });
      },
      openResultSelector(markerRecordID, groupName, groupDisplayName) {
        skipAutoResetPageIndex();
        setActiveMarkerRecordID({
          recordID: markerRecordID,
          groupName,
          groupDisplayName,
        });
        setShowDataSelectScreen(true);
      },
    },
  });

  const assignTBodyRef = useCallback(
    (element: HTMLTableSectionElement) => {
      tableBodyRef.current = element;
      setTBodyVisible(!!element);
    },
    [setTBodyVisible],
  );

  useEffect(() => {
    if (!tableBodyRef?.current) return;
    const tableEl: HTMLElement = document?.querySelector('.vertical-table');

    const tableHead: HTMLElement = tableEl?.getElementsByTagName('thead')[0];
    const scrollbarThickness =
      tableBodyRef.current.offsetHeight - tableBodyRef.current.clientHeight;

    document.documentElement.style.setProperty(
      '--scrollbar-thickness',
      scrollbarThickness + 'px',
    );

    const offsetWidth = tableHead.offsetWidth + scrollbarThickness;
    const contentScrollWidth =
      tableBodyRef.current.scrollWidth + tableHead.offsetWidth;

    const userHeaderHeight =
      document.getElementById('user-header')?.offsetHeight || 56;
    const stepperHeight =
      (document.querySelector('.report-stepper') as HTMLElement)
        ?.offsetHeight || 73;
    const datasetSelectorHeight =
      document.getElementById('table-selector')?.offsetHeight || 42;
    const dataSourceFooterHeight =
      document.getElementById('edit-data-source-footer')?.offsetHeight || 73;

    const nonTableElementsHeight =
      userHeaderHeight +
      stepperHeight +
      datasetSelectorHeight +
      dataSourceFooterHeight +
      1;

    tableEl.style.setProperty(
      '--conditional-table-thead-width',
      `${offsetWidth}px`,
    );

    tableEl.style.setProperty(
      '--non-table-height',
      `${nonTableElementsHeight}px`,
    );

    tableEl.style.setProperty(
      '--table-body-content-width',
      `${contentScrollWidth}px`,
    );
  }, [
    tBodyVisible,
    table.getState().columnVisibility,
    dataSet?.id,
    tableData?.length,
  ]);

  useFreezedHeader(
    table?.getState()?.pagination?.pageIndex ?? 0,
    typeof window !== 'undefined'
      ? document?.querySelector('.first-row')
      : null,
    tableData?.length,
  );

  const syncScroll: UIEventHandler<HTMLDivElement> = useCallback(
    function (e) {
      const horizontalScrollbarContainer = e.target as HTMLDivElement;
      if (!isCustomBarScrolling && tableBodyRef.current) {
        setIsTableBodyScrolling(true);
        tableBodyRef.current.scrollLeft =
          horizontalScrollbarContainer.scrollLeft;
      }
      setIsCustomBarScrolling(false);
    },
    [isCustomBarScrolling, tableBodyRef.current],
  );

  const syncCustomScrollbar: UIEventHandler<HTMLTableSectionElement> =
    useCallback(
      function (e) {
        const tableBodyEl = e.target as HTMLTableSectionElement;
        if (!isTableBodyScrolling && horizontalScrollbarContainerRef.current) {
          setIsCustomBarScrolling(true);
          horizontalScrollbarContainerRef.current.scrollLeft =
            tableBodyEl.scrollLeft;
        }
        setIsTableBodyScrolling(false);
      },
      [isTableBodyScrolling, horizontalScrollbarContainerRef.current],
    );

  if (savingData) {
    return (
      <p className="text-center text-3xl mt-20 text-gray-600 animate-pulse">
        {t('error.saving_data')}...
      </p>
    );
  }

  if (viewScreen === 'loading') {
    return (
      <p className="text-center text-3xl mt-20 text-gray-600 animate-pulse">
        {t('error.loading_data_input_table')} {dataSet?.name}...
      </p>
    );
  }

  if (viewScreen === 'error') {
    return (
      <div className="flex flex-col items-center">
        <p className="text-center text-3xl mt-20 text-red-500">
          {responseError?.msg}
        </p>
        {responseError.errorOnSubmit && (
          <button
            onClick={() => setViewScreen('set')}
            className="max-w-fit text-center rounded px-3 py-2 text-xl font-normal mt-4 text-gray-600 border border-gray-300 hover:bg-gray-100"
          >
            Edit data
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="data-input-table-container custom-input-table-container">
        <table className="vertical-table">
          <thead className="bottom-scroll-margin">
            {table.getHeaderGroups().map((headerGroup) => {
              return (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const conditionalClassName = computeClassName(
                      String(header.column.columnDef.meta?.sequenceNo),
                      true,
                      header.column.columnDef.meta?.isGroupParent,
                    );
                    return (
                      <th
                        key={header.id}
                        className={`border border-gray-200 ${conditionalClassName}`}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </th>
                    );
                  })}
                </tr>
              );
            })}
          </thead>
          <tbody ref={assignTBodyRef} onScroll={syncCustomScrollbar}>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  const conditionalClassName = computeClassName(
                    String(cell.column.columnDef.meta?.sequenceNo),
                    false,
                    cell.column.columnDef.meta?.isGroupParent,
                  );
                  return (
                    <td
                      key={cell.id}
                      className={`border border-gray-200 ${conditionalClassName}`}
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
          <div
            className="horizontal-scrollbar-container"
            ref={horizontalScrollbarContainerRef}
            onScroll={syncScroll}
          >
            <div className="overflowing-content" />
          </div>
        </table>
      </div>
    </>
  );
}
