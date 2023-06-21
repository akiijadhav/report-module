import { ReportWorkflowStep } from './models/report-workflow-step';
import React, {
  SetStateAction,
  Dispatch,
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { ReportDetail } from './models/report-detail';
import ReportFooter from './report-footer';
import ValidationTestSelector from './common/dataset-selector';
import { Dataset } from './models/dataset';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
  RowData,
  getPaginationRowModel,
} from '@tanstack/react-table';
import useTableComponents from './common/use-table-components';
import leftArrowIcon from '../../public/icons/left-arrow.svg';
import Image from 'next/image';
import useFixedHeader from './common/use-fixed-header';
import useRequestUtilities from '../hooks/use-request-utilities';
import { ConditionInputDataModel } from './models/conditional-input-data';
import useSkipper from '../hooks/use-skipper';
import { useTranslation } from 'react-i18next';

declare module '@tanstack/table-core' {
  interface ColumnMeta<TData extends RowData, TValue> {
    isGroupParent?: boolean;
    groupParent?: string;
    datasetName?: string;
    displayName?: string;
    isCommon?: boolean;
    sequenceNo?: string | number;
    groupDisplayName?: string;
    isArray?: boolean;
    isColDifferent?: boolean;
    allowResultSelection?: boolean;
    dependentAttributes?: string[];
    isDate?: boolean;
  }
}

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    updateData?: (
      rowIndex: number,
      columnId: string,
      value: unknown,
      groupName: string,
      datasetName?: string,
      groupDisplayName?: string,
      isArray?: boolean,
    ) => void;
    updateMarkerRecord?: (
      recordId: string,
      columnId: string,
      value: string | number | null,
      groupName: string,
    ) => void;
    updateProductDetail?: (
      recordId: string,
      groupName: string,
      productCode: string,
      dependentAttributes: string[],
    ) => void;
    clearProductDetails?: (
      recordId: string,
      groupName: string,

      dependentAttributes: string[],
    ) => void;
    updateMarkerResult?: (
      resultId: string,
      dataSetName: string,
      columnId: string,
      value: string | number | null,
      groupName: string,
      groupDisplayName: string,
      isArray?: boolean,
    ) => void;
    openResultSelector?: (
      markerRecordID: string,
      groupName: string,
      groupDisplayName: string,
    ) => void;
    autofillData?: (rowIndex: number, columnId: string, value: unknown) => void;
  }
}

export default function ConditionalInput(props: {
  reportId: string;
  reportWorkflowSteps: ReportWorkflowStep[];
  activeStep: number;
  setActiveStep: Dispatch<SetStateAction<number>>;
  report: ReportDetail;
  setReport: Dispatch<SetStateAction<ReportDetail>>;
}) {
  const {
    reportId,
    activeStep,
    setActiveStep,
    reportWorkflowSteps,
    report,
    setReport,
  } = props;
  const { EditableCell, ReadOnlyCell, groupParentHeader, computeClassName } =
    useTableComponents();
  const { fetchWrapper } = useRequestUtilities();
  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);

  type viewScreenType = 'loading' | 'error' | 'set';
  const [viewScreen, setViewScreen] = useState<viewScreenType>('loading');
  const [responseError, setResponseError] = useState({
    msg: '',
    errorOnSubmit: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [tableSchema, setTableSchema] = useState<any>({});
  const { t } = useTranslation();

  const columns = useMemo(
    function () {
      const columnsRaw: ColumnDef<ConditionInputDataModel, string>[] = [];
      if (!tableSchema) return columnsRaw;

      tableSchema?.fields?.forEach((field) => {
        let tableColumn: ColumnDef<ConditionInputDataModel>;
        let tableColumnGroup: ColumnDef<ConditionInputDataModel>;
        if (field.groupName) {
          if (
            columnsRaw.find((col) =>
              field.datasetName
                ? col.id === `${field.datasetName}.${field.groupName}`
                : col.id === field.groupName,
            )
          ) {
            tableColumn = {
              id: `${field.datasetName ? field.datasetName + '.' : ''}${
                field.groupName
              }.${field.name}`,
              header: field.displayName,
              accessorFn: (row) => {
                return field.datasetName && field.datasetName !== 'general'
                  ? row[field.datasetName][field.groupName][field.name] || null
                  : row[field.groupName][field.name] || null;
              },
              meta: {
                groupParent: field.groupName,
              },
            };
          } else {
            tableColumnGroup = {
              id: field.datasetName
                ? `${field.datasetName}.${field.groupName}`
                : field.groupName,
              cell: ReadOnlyCell,
              header: groupParentHeader,
              meta: {
                isGroupParent: true,
                displayName: field.groupDisplayName,
              },
            };
            if (field.datasetName) {
              tableColumnGroup.meta.datasetName = field.datasetName;
            }

            tableColumn = {
              id: `${field.datasetName ? field.datasetName + '.' : ''}${
                field.groupName
              }.${field.name}`,
              header: field.displayName,
              accessorFn: (row) => {
                return field.datasetName && field.datasetName !== 'general'
                  ? row[field.datasetName][field.groupName][field.name] || null
                  : row[field.groupName][field.name] || null;
              },
              meta: {
                groupParent: field.groupName,
              },
            };
          }
        } else {
          tableColumn = {
            id: field.name,
            header: field.displayName,
          };

          if (!field.datasetName) {
            tableColumn = {
              ...tableColumn,
              accessorKey: field.name,
            };

            tableColumn.meta = {
              isCommon: field.isHeaderField,
              sequenceNo: String(field.sequenceNo),
            };

            if (String(field.sequenceNo) === '1') {
              tableColumn.header = (props) => {
                return (
                  <>
                    {field.displayName + ' '}
                    <span className="text-gray-400 ml-1">
                      ({props.table.options.data.length})
                    </span>
                  </>
                );
              };
            }
          } else {
            tableColumn = {
              ...tableColumn,
              accessorFn: (row) =>
                field.datasetName === 'general'
                  ? row[field.name] || null
                  : row[field.datasetName][field.name] || null,
            };
          }
        }

        if (!field.readonly) {
          if (field.inputType === 'text') {
            tableColumn.cell = EditableCell;
          } else {
            tableColumn.cell = EditableCell;
          }
        } else {
          tableColumn.cell = ReadOnlyCell;
        }
        if (field.datasetName) {
          tableColumn.meta = {
            ...tableColumn.meta,
            datasetName: field.datasetName,
          };
        }

        if (tableColumnGroup) {
          columnsRaw.push(tableColumnGroup);
        }
        columnsRaw.push(tableColumn);
      });

      return columnsRaw;
    },
    [tableSchema],
  );

  const tableData = useMemo(() => {
    return report?.conditionalInputData?.items || [];
  }, [report?.conditionalInputData?.items]);

  const table = useReactTable({
    columns,
    data: tableData,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
    autoResetPageIndex,
    meta: {
      updateData: (rowIndex, columnId, value, groupName, datasetName) => {
        skipAutoResetPageIndex();
        setReport((old) => {
          const rows: ConditionInputDataModel[] =
            old?.conditionalInputData?.items?.map((row, index) => {
              if (index === rowIndex) {
                if (!groupName) {
                  return datasetName && datasetName !== 'general'
                    ? {
                        ...row,
                        [datasetName]: {
                          ...row[datasetName],
                          [columnId.split('.')?.at(-1)]: value || null,
                        },
                      }
                    : {
                        ...row,
                        [columnId]: value || null,
                      };
                } else {
                  return datasetName && datasetName !== 'general'
                    ? {
                        ...row,
                        [datasetName]: {
                          ...row[datasetName],
                          [groupName]: {
                            ...row[datasetName][groupName],
                            [columnId.split('.')?.at(-1)]: value || null,
                          },
                        },
                      }
                    : {
                        ...row,
                        [groupName]: {
                          ...row[groupName],
                          [columnId.split('.')?.at(-1)]: value || null,
                        },
                      };
                }
              } else {
                return row;
              }
            });

          return {
            ...old,
            conditionalInputData: {
              items: rows,
            },
          };
        });
      },
    },
  });

  const [activeDataset, setActiveDataset] = useState(-1);
  const datasets = useMemo<Dataset[]>(() => {
    const datasetsRaw: Dataset[] = [
      {
        name: 'general',
        displayName: 'General Data',
        isActive: false,
      },
    ];
    tableSchema?.datasets?.forEach((dataset) => {
      if (dataset?.name !== 'general') {
        datasetsRaw.push({
          ...dataset,
          isActive: false,
        });
      }
    });
    return datasetsRaw?.map((test, index) => ({
      ...test,
      isActive: index === activeDataset,
    }));
  }, [activeDataset, tableSchema?.datasets]);

  useEffect(() => {
    if (!reportId) return;
    async function handleResponse(response: Response) {
      const resJson = await response.json();
      if (response.ok) {
        const generalDatasetFields = resJson.fields.map((field) => {
          if (!field.datasetName && !field.isHeaderField) {
            return {
              ...field,
              datasetName: 'general',
            };
          } else {
            return field;
          }
        });
        setTableSchema({ ...resJson, fields: generalDatasetFields });
        setActiveDataset(0);
        setViewScreen('set');
      } else {
        const message = resJson?.message;
        if (response.status === 500) {
          setResponseError({
            msg: t('error.something_went_wrong'),
            errorOnSubmit: false,
          });
        } else {
          setResponseError({
            msg: message || `Error ${response.status}: ${response.statusText}`,
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
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/${reportId}/conditional-input-table-scheme?language=en`,
      handleResponse,
      handleError,
      includeAuthToken: true,
    });
  }, [reportId]);

  useEffect(() => {
    const activeDatasetName = datasets?.at(activeDataset)?.name;

    const fieldsToDisplay = table
      .getAllColumns()
      .filter(
        (col) =>
          col.columnDef.meta?.isCommon ||
          col.columnDef.meta?.datasetName === activeDatasetName,
      )
      .map((col) => col.id);

    const fieldsToHide = table
      .getAllColumns()
      .filter(
        (col) =>
          !col.columnDef.meta?.isCommon &&
          col.columnDef.meta?.datasetName !== activeDatasetName,
      )
      .map((col) => col.id);

    const toDisplay = {};
    fieldsToDisplay.forEach((columnId) => {
      toDisplay[columnId] = true;
    });

    const toHide = {};
    fieldsToHide.forEach((columnId) => {
      toHide[columnId] = false;
    });

    table.setColumnVisibility((old) => {
      return {
        ...old,
        ...toDisplay,
        ...toHide,
      };
    });
  }, [activeDataset]);

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

    const userHeaderHeight =
      document.getElementById('user-header')?.offsetHeight || 56;
    const stepperHeight =
      (document.querySelector('.report-stepper') as HTMLElement)
        ?.offsetHeight || 73;
    const paginatorHeight =
      (
        document.querySelector(
          '.conditional-input-table-paginator',
        ) as HTMLElement
      )?.offsetHeight || 65;
    const datasetSelectorHeight =
      document.getElementById('table-selector')?.offsetHeight || 42;
    const editReportFooter =
      document.getElementById('edit-report-footer')?.offsetHeight || 73;

    const nonTableElementsHeight =
      userHeaderHeight +
      stepperHeight +
      paginatorHeight +
      datasetSelectorHeight +
      editReportFooter +
      1;

    tableEl.style.setProperty(
      '--conditional-table-thead-width',
      `${offsetWidth}px`,
    );

    tableEl.style.setProperty(
      '--non-table-height',
      `${nonTableElementsHeight}px`,
    );
  }, [tableBodyRef.current, table.getState().columnVisibility]);

  useFixedHeader(
    table?.getState()?.pagination?.pageIndex ?? 0,
    typeof window !== 'undefined'
      ? document?.querySelector('.first-row')
      : null,
  );

  const handleSubmit = useCallback(() => {
    const submitData = report?.conditionalInputData?.items;

    function initiate() {
      setIsLoading(true);
    }
    async function handleResponse(response: Response) {
      const resJson = await response.json();
      if (response.ok) {
        setReport(resJson);
        setActiveStep((activeStep) => activeStep + 1);
      } else {
        if (response.status === 500) {
          setResponseError({
            msg: t('error.something_went_wrong'),
            errorOnSubmit: true,
          });
        } else {
          setResponseError({
            msg:
              resJson?.message ||
              `Error ${response.status}: ${response.statusText}`,
            errorOnSubmit: true,
          });
        }
        setViewScreen('error');
      }
    }
    function handleError(_error: any) {
      setResponseError({
        msg: t('error.something_went_wrong'),
        errorOnSubmit: true,
      });
      setViewScreen('error');
    }
    function handleFinally() {
      setIsLoading(false);
    }

    fetchWrapper({
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/${reportId}/conditional-input`,
      method: 'PUT',
      body: {
        conditionalInputData: {
          items: submitData,
        },
      },
      includeAuthToken: true,
      initiate,
      handleResponse,
      handleError,
      handleFinally,
    });
  }, [report]);

  if (viewScreen === 'loading') {
    return (
      <p className="text-center text-3xl mt-20 text-gray-600 animate-pulse">
        Loading...
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
      <div className="conditional-input-table-paginator">
        <div className="p-0 flex items-center gap-2">
          <select
            value={table.getState().pagination.pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              table.setPageIndex(page);
            }}
            className="clickable bg-white font-semibold text-base text-gray-800 min-w-fit w-[4.25rem] px-1 py-[3px] rounded border border-gray-300"
          >
            {Array(table.getPageCount())
              .fill(null)
              .map((_, index) => {
                return (
                  <option key={index} value={index + 1}>
                    {index + 1}
                  </option>
                );
              })}
          </select>
          <div>of {table.getPageCount()} pages</div>
          <button
            type="button"
            disabled={!table.getCanPreviousPage()}
            className="clickable h-8 w-8 flex justify-center items-center rounded border border-gray-300"
            onClick={() => {
              table.previousPage();
            }}
          >
            <Image
              src={leftArrowIcon}
              alt="Go to previous page"
              width={20}
              height={20}
            />
          </button>
          <button
            type="button"
            disabled={!table.getCanNextPage()}
            className="clickable h-8 w-8 flex justify-center items-center rounded border border-gray-300"
            onClick={() => {
              table.nextPage();
            }}
          >
            <Image
              src={leftArrowIcon}
              alt="Go to next page"
              width={20}
              height={20}
              className="rotate-180"
            />
          </button>
        </div>
      </div>

      <div className="conditional-input-table-container custom-input-table-container">
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
                        key={
                          header.column.columnDef.meta?.datasetName
                            ? `${header.column.columnDef.meta?.datasetName}.${header.id}`
                            : header.id
                        }
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
          <tbody ref={tableBodyRef}>
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
                      key={
                        cell.column.columnDef.meta?.datasetName
                          ? `${cell.column.columnDef.meta?.datasetName}.${cell.id}`
                          : cell.id
                      }
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
        </table>
      </div>

      <ValidationTestSelector
        datasets={datasets}
        setActiveDataset={setActiveDataset}
      />

      <ReportFooter
        activeStep={activeStep}
        reportWorkflowSteps={reportWorkflowSteps}
        handleSubmit={() => {
          handleSubmit();
        }}
        handlePrevious={() => setActiveStep((activeStep) => activeStep - 1)}
        isLoading={isLoading}
      />
    </>
  );
}
