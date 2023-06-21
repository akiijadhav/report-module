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
import {
  DataSetFieldsDetail,
  MarkerRecordFieldDetail,
} from './models/dataset-field-detail';
import useRequestUtilities from '../hooks/use-request-utilities';
import {
  DataReducerAction,
  DataSetMarkerLinkAction,
} from './models/dataset-records-detail';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import useSkipper from '../hooks/use-skipper';
import useFreezedHeader from './common/use-freezed-header';
import useTableElements from './common/use-table-elements';
import ProductCodeModal from './product-code-modal';
import { unifiedProductCodeDetails } from './models/productCodeDetails';
import { useTranslation } from 'react-i18next';

const commonFields: MarkerRecordFieldDetail[] = [
  {
    name: 'category',
    displayName: 'Category',
    type: 'Primitive',
    dataType: '',
    properties: [],
    sequenceNo: 0,
  },
  {
    name: 'acn',
    displayName: 'ACN Code',
    type: 'Primitive',
    dataType: '',
    properties: [],
    sequenceNo: 1,
  },
  {
    name: 'label',
    displayName: 'Marker label',
    type: 'Primitive',
    dataType: '',
    properties: [],
    sequenceNo: 2,
  },
  {
    name: 'unit',
    displayName: 'Unit for marker',
    type: 'Primitive',
    dataType: '',
    properties: [],
    sequenceNo: 3,
  },
];

export default function ConditionalInputGrid(props: {
  dataSet: DatasetDetail;
  tableSchema: MarkerRecordFieldDetail[] | null;
  setDataSetsSchema: Dispatch<SetStateAction<DataSetFieldsDetail[]>>;
  tableData: any[];
  dispatchDataSetRecords: Dispatch<DataReducerAction>;
  dispatchDataSetMarkerLink: Dispatch<DataSetMarkerLinkAction>;
  dataSourceId: string;
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
    dispatchDataSetRecords,
    dispatchDataSetMarkerLink,
    dataSourceId,
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
    EditableCell,
    EditableNumberCell,
    ReadOnlyCell,
    computeClassName,
    groupParentHeader,
    UnifiedProductCodeCell,
  } = useTableElements();
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);

  const horizontalScrollbarContainerRef = useRef<HTMLDivElement>(null);
  const [isTableBodyScrolling, setIsTableBodyScrolling] = useState(false);
  const [isCustomBarScrolling, setIsCustomBarScrolling] = useState(false);
  const [tBodyVisible, setTBodyVisible] = useState(false);
  const { t } = useTranslation();

  const [unifiedProductCodeObj, setUnifiedProductCodeObj] =
    useState<unifiedProductCodeDetails>({
      recordId: '',
      productCode: '',
      groupName: '',
      dependentAttributes: [],
      open: false,
    });

  const getFieldSchema = useCallback(
    function () {
      async function handleResponse(response: Response) {
        const resJson = await response.json();
        if (response.ok) {
          setDataSetsSchema((dataSetsSchema) => [
            ...dataSetsSchema,
            {
              dataSetId: dataSet?.id,
              fields: [...commonFields, ...resJson?.fields],
            },
          ]);
        } else {
          if (response.status === 500) {
            setResponseError({
              msg: t('error.something_went_wrong'),
              errorOnSubmit: false,
            });
          } else {
            setResponseError({
              msg: t('error.something_went_wrong'),
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
        url: `${process.env.NEXT_PUBLIC_API_BASE_URL_V1}/marker-record-fields?dataSetName=${dataSet?.validationTestFamily}`,
        includeAuthToken: true,
        handleResponse,
        handleError,
      });
    },
    [setDataSetsSchema, dataSet, setResponseError, setViewScreen],
  );

  const getMarkerRecords = useCallback(
    function () {
      function initiate() {
        setViewScreen('loading');
      }
      async function handleResponse(response: Response) {
        const resJson = await response.json();
        if (response.ok) {
          dispatchDataSetRecords({
            type: 'PUSH',
            pushPayload: resJson?.records,
          });
          dispatchDataSetMarkerLink({
            type: 'PUSH',
            dataSetId: dataSet?.id,
            pushPayload: {
              dataSetId: dataSet?.id,
              dataSetName: dataSet?.validationTestFamily,
              recordIDs: resJson?.records?.map((record) => record?.id) || [],
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
              msg: t('error.something_went_wrong'),
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
        url: `${process.env.NEXT_PUBLIC_API_BASE_URL_V1}/marker-records?dataSourceId=${dataSourceId}&dataSetId=${dataSet?.id}`,
        includeAuthToken: true,
        initiate,
        handleResponse,
        handleError,
      });
    },
    [
      setViewScreen,
      dispatchDataSetRecords,
      dispatchDataSetMarkerLink,
      dataSet?.id,
      dataSet?.validationTestFamily,
      setResponseError,
      dataSourceId,
    ],
  );

  useEffect(() => {
    if (!tableSchema) {
      if (!dataSet?.validationTestFamily) return;
      // Call GET schema API
      getFieldSchema();
    }
  }, [tableSchema, dataSet?.validationTestFamily, getFieldSchema]);

  useEffect(() => {
    setViewScreen('loading');

    if (tableData?.length < 1) {
      if (!dataSet?.id) return;
      // Call GET marker records API
      getMarkerRecords();
    } else {
      setViewScreen((viewScreen) => {
        return viewScreen === 'error' ? 'error' : 'set';
      });
    }
  }, [dataSet?.id, tableData, setViewScreen, getMarkerRecords]);

  const columns = useMemo(
    function () {
      const columnsRaw: ColumnDef<any, string>[] = [];
      if (!tableSchema) return columnsRaw;

      tableSchema?.forEach((field) => {
        if (field.type === 'Primitive') {
          const tableColumn: ColumnDef<any> = {
            id: field.name,
            header: field.displayName,
            accessorFn: (row) => {
              if (!field.dataType) {
                return row?.marker ? row?.marker[field.name] || null : null;
              } else {
                return row[field.name] || null;
              }
            },
            meta: {
              displayName: field.displayName,
              isCommon: !field.dataType,
            },
          };
          if (readOnly) {
            tableColumn.cell = ReadOnlyCell;
          } else {
            if (field.dataType === 'text') {
              tableColumn.cell = EditableCell;
            } else if (field.dataType === 'number') {
              tableColumn.cell = EditableNumberCell;
            } else {
              tableColumn.cell = ReadOnlyCell;
            }
          }

          if (!field.dataType) {
            tableColumn.meta = {
              ...tableColumn.meta,
              sequenceNo: String(field.sequenceNo),
            };
          }

          columnsRaw.push(tableColumn);
        } else {
          const tableColumnGroup: ColumnDef<any> = {
            id: field.name,
            cell: ReadOnlyCell,
            header: groupParentHeader,
            meta: {
              isGroupParent: true,
              displayName: field.displayName,
            },
          };
          columnsRaw.push(tableColumnGroup);

          let readOnlyAttributes = [];
          field?.properties?.forEach((attribute) => {
            const tableColumn: ColumnDef<any> = {
              id: `${field.name}.${attribute.name}`,
              header: attribute.displayName,
              accessorFn: (row) => {
                return row[field.name]
                  ? row[field.name][attribute.name] || null
                  : null;
              },
              meta: {
                displayName: attribute.displayName,
                groupParent: field.name,
                groupDisplayName: field.displayName,
              },
            };

            if (readOnly) {
              tableColumn.cell = ReadOnlyCell;
            } else {
              if (attribute.dataType === 'text') {
                if (attribute?.dependentAttributes?.length) {
                  readOnlyAttributes = attribute.dependentAttributes;
                  tableColumn.cell = UnifiedProductCodeCell;
                  tableColumn.meta = {
                    ...tableColumn.meta,
                    dependentAttributes: attribute.dependentAttributes,
                  };
                } else {
                  if (readOnlyAttributes?.includes(attribute.name)) {
                    tableColumn.cell = ReadOnlyCell;
                  } else {
                    tableColumn.cell = EditableCell;
                  }
                }
              } else if (attribute.dataType === 'number') {
                tableColumn.cell = EditableNumberCell;
              } else {
                tableColumn.cell = ReadOnlyCell;
              }
            }

            if (attribute.name.toLowerCase().includes('date')) {
              tableColumn.meta = {
                ...tableColumn.meta,
                isDate: true,
              };
            }

            columnsRaw.push(tableColumn);
          });
        }
      });

      return columnsRaw;
    },
    [tableSchema, readOnly],
  );

  const table = useReactTable({
    columns,
    data: tableData,
    getCoreRowModel: getCoreRowModel(),
    autoResetPageIndex,
    meta: {
      updateMarkerRecord: (recordId, columnId, value, groupName) => {
        skipAutoResetPageIndex();
        dispatchDataSetRecords({
          type: 'UPDATE',
          markerRecordId: recordId,
          columnId,
          groupName,
          value,
        });
      },
      updateProductDetail: (
        recordId,
        groupName,
        productCode,
        dependentAttributes,
      ) => {
        setUnifiedProductCodeObj({
          recordId,
          groupName,
          productCode,
          dependentAttributes,
          open: true,
        });
      },
      clearProductDetails: (recordId, groupName, dependentAttributes) => {
        dependentAttributes.forEach((attribute) => {
          dispatchDataSetRecords({
            type: 'UPDATE',
            groupName,
            markerRecordId: recordId,
            columnId: `${groupName}.${attribute}`,
            value: null,
          });
        });
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
        {t('error.loading_conditional_table')} {dataSet?.name}...
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
      <ProductCodeModal
        details={unifiedProductCodeObj}
        setUnifiedProductCodeObj={setUnifiedProductCodeObj}
        dispatch={dispatchDataSetRecords}
        datasetId={dataSet?.id}
      />
    </>
  );
}
