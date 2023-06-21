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
  getPaginationRowModel,
} from '@tanstack/react-table';
import useTableComponents from './common/use-table-components';
import leftArrowIcon from '../../public/icons/left-arrow.svg';
import Image from 'next/image';
import useFixedHeader from './common/use-fixed-header';
import useRequestUtilities from '../hooks/use-request-utilities';
import { DataInputModel } from './models/data-input';
import useSkipper from '../hooks/use-skipper';
import { DataInputTableSchemeDto } from './models/data-input-schema';
import { ValidationTestsCode } from './enums/validation-tests-code';
import { useTranslation } from 'react-i18next';

const accuracyCalibrationDisplayData = {
  s1: [
    'S1:Cal1\nISE: internal standard liquid electromotive force',
    'S1:Cal1\nISE: LOW electromotive force',
    'S1:Cal1\nISE: HIGH liquid electromotive force',
    'S1:Cal1\nISE: Calibrator liquid electromotive force',
  ],
  s2: [
    'S2: Cal2\nISE: Slope value',
    'S2: Cal2\nISE:IS concentration',
    'S2: Cal2\nISE: Calibrator assumed concentration',
    'S2: Cal2\nISE: comparison value',
  ],
  s3: ['S3:Cal3 1-1', 'S3:Cal3 1-2', 'S3:Cal3 2-1', 'S3:Cal3 2-2'],
  s4: ['S4:Cal4 1-1', 'S4:Cal4 1-2', 'S4:Cal4 2-1', 'S4:Cal4 2-2'],
  s5: ['S5:Cal5 1-1', 'S5:Cal5 1-2', 'S5:Cal5 2-1', 'S5:Cal5 2-2'],
  s6: ['S6:Cal6 1-1', 'S6:Cal6 1-2', 'S6:Cal6 2-1', 'S6:Cal6 2-2'],
};

export default function DataInput(props: {
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
  const {
    EditableCell,
    EditableNumberCell,
    ReadOnlyCell,
    groupParentHeader,
    computeClassName,
  } = useTableComponents();
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
  const [tableSchema, setTableSchema] = useState<DataInputTableSchemeDto>();
  const { t } = useTranslation();

  const columns = useMemo(
    function () {
      const columnsRaw: ColumnDef<DataInputModel, string>[] = [];
      if (!tableSchema) return columnsRaw;

      tableSchema?.fields?.forEach((field) => {
        if (field.groupName) {
          if (
            !columnsRaw.find((col) =>
              field.datasetName
                ? col.id === `${field.datasetName}.${field.groupName}`
                : col.id === field.groupName,
            )
          ) {
            const tableColumnGroup: ColumnDef<DataInputModel> = {
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

            columnsRaw.push(tableColumnGroup);
          }

          if (field.dataType === 'array') {
            Array(field.size)
              .fill(null)
              .forEach((_, index) => {
                let toDisplay = `${index + 1}`;

                if (field.datasetName === 'correlation') {
                  toDisplay = `${field.name.at(-1)}${index + 1}`;
                }
                if (field.datasetName.includes('linearity')) {
                  toDisplay = `${index}/${field.size - 1}`;
                }
                if (field.datasetName === 'indoorReproducibility') {
                  let dayNumber = 1;
                  toDisplay = `Sample ${field.name.slice(
                    1,
                  )}-${dayNumber}Day 1 time`;
                  if (index > 0) {
                    const beforePrevious =
                      typeof columnsRaw?.at(-2)?.header === 'string'
                        ? (columnsRaw.at(-2).header as string)
                            .split('-')[1]
                            ?.split('D')[0]
                        : null;

                    const previous = (columnsRaw.at(-1).header as string)
                      .split('-')[1]
                      .split('D')[0];

                    if (previous === beforePrevious) {
                      dayNumber = Number(previous) + 1;
                      toDisplay = `Sample ${field.name.slice(
                        1,
                      )}-${dayNumber}Day 1 time`;
                    } else {
                      dayNumber = Number(previous);
                      toDisplay = `Sample ${field.name.slice(
                        1,
                      )}-${dayNumber}Day 2 times`;
                    }
                  }
                }
                if (field.datasetName === 'accuracy') {
                  toDisplay =
                    field.groupName === 'calibrationResultsDataInput'
                      ? accuracyCalibrationDisplayData[field.name][index]
                      : `${field.displayName} - ${index + 1}`;
                }

                const tableColumn: ColumnDef<DataInputModel> = {
                  id: `${field.datasetName ? field.datasetName + '.' : ''}${
                    field.groupName
                  }${field.datasetName === 'accuracy' ? '.' + field.name : ''}${
                    index + 1
                  }`,
                  cell: EditableNumberCell,
                  header: toDisplay,
                  accessorFn: (row) => {
                    if (field.datasetName === 'correlation') {
                      return (
                        row?.correlation[field.name.at(-1)?.toLowerCase()]?.at(
                          index,
                        ) || null
                      );
                    } else if (
                      field.datasetName === 'linearity5' ||
                      field.datasetName === 'linearity10'
                    ) {
                      const arrayName = `test${field.groupDisplayName
                        ?.split(' ')
                        ?.at(3)
                        ?.at(0)}Values`;
                      return row[field.datasetName]
                        ? row[field.datasetName][field.groupName?.slice(0, 2)][
                            arrayName
                          ]?.at(index) || null
                        : null;
                    } else if (field.datasetName === 'indoorReproducibility') {
                      return row[field.datasetName]
                        ? row[field.datasetName][field.name]?.at(index) || null
                        : null;
                    } else if (field.datasetName === 'accuracy') {
                      return row.accuracy
                        ? row.accuracy[field.groupName][
                            field.name.slice(0, 2)
                          ]?.values?.at(index) || null
                        : null;
                    }
                  },
                  meta: {
                    groupParent: field.groupName,
                    groupDisplayName: field.groupDisplayName,
                    isArray: true,
                  },
                };

                if (field.readonly) {
                  tableColumn.cell = ReadOnlyCell;
                }

                if (field.datasetName) {
                  tableColumn.meta = {
                    ...tableColumn.meta,
                    datasetName: field.datasetName,
                  };
                }

                columnsRaw.push(tableColumn);
              });
          } else {
            const tableColumn: ColumnDef<DataInputModel> = {
              id: `${field.datasetName ? field.datasetName + '.' : ''}${
                field.groupName
              }.${field.name}`,
              cell:
                field.dataType === 'number' ? EditableNumberCell : EditableCell,
              header: field.displayName,
              accessorFn: (row) => {
                if (field.datasetName === 'accuracy') {
                  return row.accuracy[field.groupName][field.name] || null;
                }
              },
              meta: {
                groupParent: field.groupName,
                groupDisplayName: field.groupDisplayName,
              },
            };

            if (field.readonly) {
              tableColumn.cell = ReadOnlyCell;
            }

            if (field.datasetName) {
              tableColumn.meta = {
                ...tableColumn.meta,
                datasetName: field.datasetName,
              };
            }

            columnsRaw.push(tableColumn);
          }
        } else {
          const tableColumn: ColumnDef<DataInputModel> = {
            id: field.name,
            header: field.displayName,
            accessorKey: field.name,
          };

          if (!field.datasetName) {
            tableColumn.meta = {
              isCommon: true,
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
          }
          if (field.readonly) {
            tableColumn.cell = ReadOnlyCell;
          } else {
            tableColumn.cell = EditableCell;
          }

          columnsRaw.push(tableColumn);
        }
      });

      return columnsRaw;
    },
    [tableSchema],
  );

  const tableData = useMemo(() => {
    return (
      report?.testDataInput?.items?.map((item) => ({
        ...item,
        category:
          report.conditionalInputData?.items?.find(
            (conditionalInputItem) => conditionalInputItem?.acn === item?.acn,
          )?.category || '',
      })) || []
    );
  }, [report?.testDataInput?.items]);

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
      updateData: (
        rowIndex,
        columnId,
        value,
        groupName,
        datasetName,
        groupDisplayName,
        isArray,
      ) => {
        skipAutoResetPageIndex();
        setReport((old) => {
          const rows: DataInputModel[] = old?.testDataInput?.items?.map(
            (row, index) => {
              if (index === rowIndex) {
                if (!groupName) {
                  return {
                    ...row,
                    [columnId]: !!value || value === 0 ? Number(value) : null,
                  };
                } else {
                  if (datasetName === 'correlation') {
                    let numList =
                      row.correlation[groupName?.at(-1)?.toLowerCase()];

                    if (!Array.isArray(numList)) {
                      numList = [];
                    }

                    numList[
                      Number(
                        columnId?.replace(`${datasetName}.${groupName}`, ''),
                      ) - 1
                    ] = !!value || value === 0 ? Number(value) : null;

                    return {
                      ...row,
                      [datasetName]: {
                        ...row[datasetName],
                        [groupName?.at(-1)?.toLowerCase()]: numList,
                      },
                    };
                  } else if (
                    datasetName === 'linearity5' ||
                    datasetName === 'linearity10'
                  ) {
                    if (
                      typeof row[datasetName] !== 'object' ||
                      row[datasetName] === null
                    ) {
                      row[datasetName] = {
                        s1: {
                          test1Values: [],
                          test2Values: [],
                          test3Values: [],
                        },
                        s2: {
                          test1Values: [],
                          test2Values: [],
                          test3Values: [],
                        },
                        s3: {
                          test1Values: [],
                          test2Values: [],
                          test3Values: [],
                        },
                        s4: {
                          test1Values: [],
                          test2Values: [],
                          test3Values: [],
                        },
                      };
                    }
                    const arrayName = `test${groupDisplayName
                      ?.split(' ')
                      ?.at(3)
                      ?.at(0)}Values`;
                    let numList =
                      row[datasetName][groupName?.slice(0, 2)][arrayName];
                    if (!Array.isArray(numList)) numList = [];
                    numList[
                      Number(
                        columnId?.replace(`${datasetName}.${groupName}`, ''),
                      ) - 1
                    ] = !!value || value === 0 ? Number(value) : null;

                    return {
                      ...row,
                      [datasetName]: {
                        ...row[datasetName],
                        [groupName.slice(0, 2)]: {
                          ...row[datasetName][groupName.slice(0, 2)],
                          [arrayName]: numList,
                        },
                      },
                    };
                  } else if (datasetName === 'accuracy') {
                    if (typeof row[datasetName] !== 'object') {
                      row[datasetName] = {
                        accuracyResultsDataInput: {
                          s1: {
                            values: [],
                          },
                          s2: {
                            values: [],
                          },
                          s3: {
                            values: [],
                          },
                          s4: {
                            values: [],
                          },
                          s5: {
                            values: [],
                          },
                          s6: {
                            values: [],
                          },
                        },
                        calibrationResultsDataInput: {
                          s1: {
                            values: [],
                          },
                          s2: {
                            values: [],
                          },
                          s3: {
                            values: [],
                          },
                          s4: {
                            values: [],
                          },
                          s5: {
                            values: [],
                          },
                          s6: {
                            values: [],
                          },
                          s1AbsCutoff: null,
                          k: null,
                          a: null,
                          b: null,
                        },
                      };
                    }

                    if (isArray) {
                      let numList =
                        row[datasetName][groupName][
                          columnId.split('.').at(-1).slice(0, 2)
                        ]?.values;
                      if (!Array.isArray(numList)) numList = [];

                      numList[
                        Number(
                          columnId?.replace(
                            `${datasetName}.${groupName}.${columnId
                              .split('.')
                              .at(-1)
                              .slice(0, 2)}`,
                            '',
                          ),
                        ) - 1
                      ] = !!value || value === 0 ? Number(value) : null;

                      return {
                        ...row,
                        [datasetName]: {
                          ...row[datasetName],
                          [groupName]: {
                            ...row[datasetName][groupName],
                            [columnId.split('.').at(-1).slice(0, 2)]: {
                              ...row[datasetName][groupName][
                                columnId.split('.').at(-1).slice(0, 2)
                              ],
                              values: numList,
                            },
                          },
                        },
                      };
                    } else {
                      return {
                        ...row,
                        [datasetName]: {
                          ...row[datasetName],
                          [groupName]: {
                            ...row[datasetName][groupName],
                            [columnId.split('.').at(-1)]:
                              !!value || value === 0 ? Number(value) : null,
                          },
                        },
                      };
                    }
                  } else if (datasetName === 'indoorReproducibility') {
                    if (typeof row[datasetName] !== 'object') {
                      row[datasetName] = {
                        s1: [],
                        s2: [],
                        s3: [],
                        s4: [],
                        s5: [],
                        s6: [],
                      };
                    }

                    let numList = row[datasetName][groupName];
                    if (!Array.isArray(numList)) numList = [];

                    numList[
                      Number(
                        columnId?.replace(`${datasetName}.${groupName}`, ''),
                      ) - 1
                    ] = !!value || value === 0 ? Number(value) : null;

                    return {
                      ...row,
                      [datasetName]: {
                        ...row[datasetName],
                        [groupName]: numList,
                      },
                    };
                  }
                }
              } else {
                return row;
              }
            },
          );

          return {
            ...old,
            testDataInput: {
              items: rows,
            },
          };
        });
      },
    },
  });

  const [activeDataset, setActiveDataset] = useState(-1);
  const datasets = useMemo<Dataset[]>(() => {
    const datasetsRaw: Dataset[] = [];
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

    const listCorrelationFields: DataInputTableSchemeDto['fields'] = [
      {
        name: 'correlationX',
        displayName: 'Correlation X',
        groupName: 'correlationX',
        groupDisplayName: 'Correlation X',
        readonly: false,
        dataType: 'array',
        size: 50,
        datasetName: 'correlation',
        sequenceNo: 4,
      },
      {
        name: 'correlationY',
        displayName: 'Correlation Y',
        groupName: 'correlationY',
        groupDisplayName: 'Correlation Y',
        readonly: false,
        dataType: 'array',
        size: 50,
        datasetName: 'correlation',
        sequenceNo: 5,
      },
    ];
    const linearity5Fields: DataInputTableSchemeDto['fields'] = [
      {
        name: 's1FirstTime',
        displayName: 'S-1 Sample 1 1st time',
        groupName: 's1FirstTime',
        groupDisplayName: 'S-1 Sample 1 1st time',
        readonly: false,
        dataType: 'array',
        size: 6,
        datasetName: 'linearity5',
        sequenceNo: 7,
      },
      {
        name: 's1SecondTime',
        displayName: 'S-1 Sample 1 2nd time',
        groupName: 's1SecondTime',
        groupDisplayName: 'S-1 Sample 1 2nd time',
        readonly: false,
        dataType: 'array',
        size: 6,
        datasetName: 'linearity5',
        sequenceNo: 8,
      },
      {
        name: 's1ThirdTime',
        displayName: 'S-1 Sample 1 3rd time',
        groupName: 's1ThirdTime',
        groupDisplayName: 'S-1 Sample 1 3rd time',
        readonly: false,
        dataType: 'array',
        size: 6,
        datasetName: 'linearity5',
        sequenceNo: 9,
      },
      {
        name: 's2FirstTime',
        displayName: 'S-2 Sample 2 1st time',
        groupName: 's2FirstTime',
        groupDisplayName: 'S-2 Sample 2 1st time',
        readonly: false,
        dataType: 'array',
        size: 6,
        datasetName: 'linearity5',
        sequenceNo: 10,
      },
      {
        name: 's2SecondTime',
        displayName: 'S-2 Sample 2 2nd time',
        groupName: 's2SecondTime',
        groupDisplayName: 'S-2 Sample 2 2nd time',
        readonly: false,
        dataType: 'array',
        size: 6,
        datasetName: 'linearity5',
        sequenceNo: 11,
      },
      {
        name: 's2ThirdTime',
        displayName: 'S-2 Sample 2 3rd time',
        groupName: 's2ThirdTime',
        groupDisplayName: 'S-2 Sample 2 3rd time',
        readonly: false,
        dataType: 'array',
        size: 6,
        datasetName: 'linearity5',
        sequenceNo: 12,
      },
      {
        name: 's3FirstTime',
        displayName: 'S-3 Sample 3 1st time',
        groupName: 's3FirstTime',
        groupDisplayName: 'S-3 Sample 3 1st time',
        readonly: false,
        dataType: 'array',
        size: 6,
        datasetName: 'linearity5',
        sequenceNo: 13,
      },
      {
        name: 's3SecondTime',
        displayName: 'S-3 Sample 3 2nd time',
        groupName: 's3SecondTime',
        groupDisplayName: 'S-3 Sample 3 2nd time',
        readonly: false,
        dataType: 'array',
        size: 6,
        datasetName: 'linearity5',
        sequenceNo: 14,
      },
      {
        name: 's3ThirdTime',
        displayName: 'S-3 Sample 3 3rd time',
        groupName: 's3ThirdTime',
        groupDisplayName: 'S-3 Sample 3 3rd time',
        readonly: false,
        dataType: 'array',
        size: 6,
        datasetName: 'linearity5',
        sequenceNo: 15,
      },
      {
        name: 's4FirstTime',
        displayName: 'S-4 Sample 4 1st time',
        groupName: 's4FirstTime',
        groupDisplayName: 'S-4 Sample 4 1st time',
        readonly: false,
        dataType: 'array',
        size: 6,
        datasetName: 'linearity5',
        sequenceNo: 16,
      },
      {
        name: 's4SecondTime',
        displayName: 'S-4 Sample 4 2nd time',
        groupName: 's4SecondTime',
        groupDisplayName: 'S-4 Sample 4 2nd time',
        readonly: false,
        dataType: 'array',
        size: 6,
        datasetName: 'linearity5',
        sequenceNo: 17,
      },
      {
        name: 's4ThirdTime',
        displayName: 'S-4 Sample 4 3rd time',
        groupName: 's4ThirdTime',
        groupDisplayName: 'S-4 Sample 4 3rd time',
        readonly: false,
        dataType: 'array',
        size: 6,
        datasetName: 'linearity5',
        sequenceNo: 18,
      },
    ];
    const linearity10Fields: DataInputTableSchemeDto['fields'] = [
      {
        name: 's1FirstTime',
        displayName: 'S-1 Sample 1 1st time',
        groupName: 's1FirstTime',
        groupDisplayName: 'S-1 Sample 1 1st time',
        readonly: false,
        dataType: 'array',
        size: 11,
        datasetName: 'linearity10',
        sequenceNo: 19,
      },
      {
        name: 's1SecondTime',
        displayName: 'S-1 Sample 1 2nd time',
        groupName: 's1SecondTime',
        groupDisplayName: 'S-1 Sample 1 2nd time',
        readonly: false,
        dataType: 'array',
        size: 11,
        datasetName: 'linearity10',
        sequenceNo: 20,
      },
      {
        name: 's1ThirdTime',
        displayName: 'S-1 Sample 1 3rd time',
        groupName: 's1ThirdTime',
        groupDisplayName: 'S-1 Sample 1 3rd time',
        readonly: false,
        dataType: 'array',
        size: 11,
        datasetName: 'linearity10',
        sequenceNo: 21,
      },
      {
        name: 's2FirstTime',
        displayName: 'S-2 Sample 2 1st time',
        groupName: 's2FirstTime',
        groupDisplayName: 'S-2 Sample 2 1st time',
        readonly: false,
        dataType: 'array',
        size: 11,
        datasetName: 'linearity10',
        sequenceNo: 22,
      },
      {
        name: 's2SecondTime',
        displayName: 'S-2 Sample 2 2nd time',
        groupName: 's2SecondTime',
        groupDisplayName: 'S-2 Sample 2 2nd time',
        readonly: false,
        dataType: 'array',
        size: 11,
        datasetName: 'linearity10',
        sequenceNo: 23,
      },
      {
        name: 's2ThirdTime',
        displayName: 'S-2 Sample 2 3rd time',
        groupName: 's2ThirdTime',
        groupDisplayName: 'S-2 Sample 2 3rd time',
        readonly: false,
        dataType: 'array',
        size: 11,
        datasetName: 'linearity10',
        sequenceNo: 24,
      },
      {
        name: 's3FirstTime',
        displayName: 'S-3 Sample 3 1st time',
        groupName: 's3FirstTime',
        groupDisplayName: 'S-3 Sample 3 1st time',
        readonly: false,
        dataType: 'array',
        size: 11,
        datasetName: 'linearity10',
        sequenceNo: 25,
      },
      {
        name: 's3SecondTime',
        displayName: 'S-3 Sample 3 2nd time',
        groupName: 's3SecondTime',
        groupDisplayName: 'S-3 Sample 3 2nd time',
        readonly: false,
        dataType: 'array',
        size: 11,
        datasetName: 'linearity10',
        sequenceNo: 26,
      },
      {
        name: 's3ThirdTime',
        displayName: 'S-3 Sample 3 3rd time',
        groupName: 's3ThirdTime',
        groupDisplayName: 'S-3 Sample 3 3rd time',
        readonly: false,
        dataType: 'array',
        size: 11,
        datasetName: 'linearity10',
        sequenceNo: 27,
      },
      {
        name: 's4FirstTime',
        displayName: 'S-4 Sample 4 1st time',
        groupName: 's4FirstTime',
        groupDisplayName: 'S-4 Sample 4 1st time',
        readonly: false,
        dataType: 'array',
        size: 11,
        datasetName: 'linearity10',
        sequenceNo: 28,
      },
      {
        name: 's4SecondTime',
        displayName: 'S-4 Sample 4 2nd time',
        groupName: 's4SecondTime',
        groupDisplayName: 'S-4 Sample 4 2nd time',
        readonly: false,
        dataType: 'array',
        size: 11,
        datasetName: 'linearity10',
        sequenceNo: 29,
      },
      {
        name: 's4ThirdTime',
        displayName: 'S-4 Sample 4 3rd time',
        groupName: 's4ThirdTime',
        groupDisplayName: 'S-4 Sample 4 3rd time',
        readonly: false,
        dataType: 'array',
        size: 11,
        datasetName: 'linearity10',
        sequenceNo: 30,
      },
    ];
    const accuracyFields: DataInputTableSchemeDto['fields'] = [
      {
        name: 's1',
        displayName: 'S1:Cal1',
        groupName: 'calibrationResultsDataInput',
        groupDisplayName: 'Calibration results',
        readonly: false,
        dataType: 'array',
        size: 4,
        datasetName: 'accuracy',
        sequenceNo: 100,
      },
      {
        name: 's2',
        displayName: 'S2:Cal2',
        groupName: 'calibrationResultsDataInput',
        groupDisplayName: 'Calibration results',
        readonly: false,
        dataType: 'array',
        size: 4,
        datasetName: 'accuracy',
        sequenceNo: 101,
      },
      {
        name: 's3',
        displayName: 'S3:Cal3',
        groupName: 'calibrationResultsDataInput',
        groupDisplayName: 'Calibration results',
        readonly: false,
        dataType: 'array',
        size: 4,
        datasetName: 'accuracy',
        sequenceNo: 102,
      },
      {
        name: 's4',
        displayName: 'S4:Cal4',
        groupName: 'calibrationResultsDataInput',
        groupDisplayName: 'Calibration results',
        readonly: false,
        dataType: 'array',
        size: 4,
        datasetName: 'accuracy',
        sequenceNo: 103,
      },
      {
        name: 's5',
        displayName: 'S5:Cal5',
        groupName: 'calibrationResultsDataInput',
        groupDisplayName: 'Calibration results',
        readonly: false,
        dataType: 'array',
        size: 4,
        datasetName: 'accuracy',
        sequenceNo: 104,
      },
      {
        name: 's6',
        displayName: 'S6:Cal6',
        groupName: 'calibrationResultsDataInput',
        groupDisplayName: 'Calibration results',
        readonly: false,
        dataType: 'array',
        size: 4,
        datasetName: 'accuracy',
        sequenceNo: 105,
      },
      {
        name: 's1AbsCutoff',
        displayName: 'S1Abs/cutoff',
        groupName: 'calibrationResultsDataInput',
        groupDisplayName: 'Calibration results',
        readonly: false,
        dataType: 'number',
        size: null,
        datasetName: 'accuracy',
        sequenceNo: 106,
      },
      {
        name: 'k',
        displayName: 'K',
        groupName: 'calibrationResultsDataInput',
        groupDisplayName: 'Calibration results',
        readonly: false,
        dataType: 'number',
        size: null,
        datasetName: 'accuracy',
        sequenceNo: 107,
      },
      {
        name: 'a',
        displayName: 'A',
        groupName: 'calibrationResultsDataInput',
        groupDisplayName: 'Calibration results',
        readonly: false,
        dataType: 'number',
        size: null,
        datasetName: 'accuracy',
        sequenceNo: 108,
      },
      {
        name: 'b',
        displayName: 'B',
        groupName: 'calibrationResultsDataInput',
        groupDisplayName: 'Calibration results',
        readonly: false,
        dataType: 'number',
        size: null,
        datasetName: 'accuracy',
        sequenceNo: 109,
      },
      {
        name: 's1',
        displayName: 'S-1: Sample 1',
        groupName: 'accuracyResultsDataInput',
        groupDisplayName: 'Accuracy: Enter the result of Count first',
        readonly: false,
        dataType: 'array',
        size: 10,
        datasetName: 'accuracy',
        sequenceNo: 110,
      },
      {
        name: 's2',
        displayName: 'S-2: Sample 2',
        groupName: 'accuracyResultsDataInput',
        groupDisplayName: 'Accuracy: Enter the result of Count first',
        readonly: false,
        dataType: 'array',
        size: 10,
        datasetName: 'accuracy',
        sequenceNo: 111,
      },
      {
        name: 's3',
        displayName: 'S-3: Sample 3',
        groupName: 'accuracyResultsDataInput',
        groupDisplayName: 'Accuracy: Enter the result of Count first',
        readonly: false,
        dataType: 'array',
        size: 10,
        datasetName: 'accuracy',
        sequenceNo: 112,
      },
      {
        name: 's4',
        displayName: 'S-4: Sample 4',
        groupName: 'accuracyResultsDataInput',
        groupDisplayName: 'Accuracy: Enter the result of Count first',
        readonly: false,
        dataType: 'array',
        size: 10,
        datasetName: 'accuracy',
        sequenceNo: 113,
      },
      {
        name: 's5',
        displayName: 'S-5: Sample 5',
        groupName: 'accuracyResultsDataInput',
        groupDisplayName: 'Accuracy: Enter the result of Count first',
        readonly: false,
        dataType: 'array',
        size: 10,
        datasetName: 'accuracy',
        sequenceNo: 114,
      },
      {
        name: 's6',
        displayName: 'S-6: Sample 6',
        groupName: 'accuracyResultsDataInput',
        groupDisplayName: 'Accuracy: Enter the result of Count first',
        readonly: false,
        dataType: 'array',
        size: 10,
        datasetName: 'accuracy',
        sequenceNo: 115,
      },
    ];
    const indoorReproducibilityFields: DataInputTableSchemeDto['fields'] = [
      {
        name: 's1',
        displayName: 'S1',
        groupName: 's1',
        groupDisplayName: 'S1',
        readonly: false,
        dataType: 'array',
        size: 60,
        datasetName: 'indoorReproducibility',
        sequenceNo: 50,
      },
      {
        name: 's2',
        displayName: 'S2',
        groupName: 's2',
        groupDisplayName: 'S2',
        readonly: false,
        dataType: 'array',
        size: 60,
        datasetName: 'indoorReproducibility',
        sequenceNo: 51,
      },
      {
        name: 's3',
        displayName: 'S3',
        groupName: 's3',
        groupDisplayName: 'S3',
        readonly: false,
        dataType: 'array',
        size: 60,
        datasetName: 'indoorReproducibility',
        sequenceNo: 52,
      },
      {
        name: 's4',
        displayName: 'S4',
        groupName: 's4',
        groupDisplayName: 'S4',
        readonly: false,
        dataType: 'array',
        size: 60,
        datasetName: 'indoorReproducibility',
        sequenceNo: 53,
      },
      {
        name: 's5',
        displayName: 'S5',
        groupName: 's5',
        groupDisplayName: 'S5',
        readonly: false,
        dataType: 'array',
        size: 60,
        datasetName: 'indoorReproducibility',
        sequenceNo: 54,
      },
      {
        name: 's6',
        displayName: 'S6',
        groupName: 's6',
        groupDisplayName: 'S6',
        readonly: false,
        dataType: 'array',
        size: 60,
        datasetName: 'indoorReproducibility',
        sequenceNo: 55,
      },
    ];

    const tablesSchemaLocal: DataInputTableSchemeDto = {
      datasets: [],
      fieldGroups: [
        {
          name: null,
          groupDisplayName: null,
          datasetName: null,
        },
      ],
      fields: [
        {
          name: 'category',
          displayName: 'Category',
          groupName: null,
          groupDisplayName: null,
          readonly: true,
          dataType: 'string',
          size: null,
          datasetName: null,
          sequenceNo: 0,
        },
        {
          name: 'acn',
          displayName: 'ACN Code',
          groupName: null,
          groupDisplayName: null,
          readonly: true,
          dataType: 'string',
          size: null,
          datasetName: null,
          sequenceNo: 1,
        },
        {
          name: 'markerLabel',
          displayName: 'Marker label',
          groupName: null,
          groupDisplayName: null,
          readonly: true,
          dataType: 'string',
          size: null,
          datasetName: null,
          sequenceNo: 2,
        },
        {
          name: 'unitOfMarker',
          displayName: 'Unit for marker',
          groupName: null,
          groupDisplayName: null,
          readonly: true,
          dataType: 'string',
          size: null,
          datasetName: null,
          sequenceNo: 3,
        },
      ],
    };

    if (
      report?.validationTests?.includes(ValidationTestsCode.ListCorrelation)
    ) {
      tablesSchemaLocal.fields.push(...listCorrelationFields);
      tablesSchemaLocal.datasets.push({
        name: 'correlation',
        displayName: 'Correlation',
      });
    }
    if (report?.validationTests?.includes(ValidationTestsCode.Linearity5)) {
      tablesSchemaLocal.fields.push(...linearity5Fields);
      tablesSchemaLocal.datasets.push({
        name: 'linearity5',
        displayName: 'Linearity 5 steps',
      });
    }
    if (report?.validationTests?.includes(ValidationTestsCode.Linearity10)) {
      tablesSchemaLocal.fields.push(...linearity10Fields);
      tablesSchemaLocal.datasets.push({
        name: 'linearity10',
        displayName: 'Linearity 10 steps',
      });
    }
    if (
      report?.validationTests?.includes(ValidationTestsCode.Accuracy) ||
      report?.validationTests?.includes(ValidationTestsCode.ListAccuracy)
    ) {
      tablesSchemaLocal.fields.push(...accuracyFields);
      tablesSchemaLocal.datasets.push({
        name: 'accuracy',
        displayName: report?.validationTests?.includes(
          ValidationTestsCode.Accuracy,
        )
          ? 'Accuracy'
          : 'List: Accuracy',
      });
    }
    if (
      report?.validationTests?.includes(
        ValidationTestsCode.IndoorReproducibilityDayDifferenceReproducibility,
      )
    ) {
      tablesSchemaLocal.fields.push(...indoorReproducibilityFields);
      tablesSchemaLocal.datasets.push({
        displayName: 'Indoor Reproducibility',
        name: 'indoorReproducibility',
      });
    }
    setTableSchema(tablesSchemaLocal);
    setActiveDataset(0);
    setViewScreen('set');
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
      '--data-input-table-thead-width',
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

  const rightTrimArray = useCallback(function (array: any[]) {
    for (let i = array.length - 1; i >= 0; i--) {
      if (array[i] === undefined || array[i] === null) {
        array.pop();
      } else {
        break;
      }
    }
    return array;
  }, []);

  const handleSubmit = useCallback(() => {
    const submitData = report?.testDataInput?.items?.map((item) => {
      const itemToReturn = { ...item };

      if (
        report?.validationTests?.includes(ValidationTestsCode.ListCorrelation)
      ) {
        const corX = item?.correlation?.x?.filter(Number);
        const corY = item?.correlation?.y?.filter(Number);

        itemToReturn.correlation = {
          x: corX || [],
          y: corY || [],
        };
        itemToReturn.correlationReexamination = {
          x: [],
          y: [],
        };
      }

      if (report?.validationTests?.includes(ValidationTestsCode.Linearity5)) {
        const s1FirstTime = rightTrimArray(
          item?.linearity5?.s1?.test1Values || [],
        );
        const s1SecondTime = rightTrimArray(
          item?.linearity5?.s1?.test2Values || [],
        );
        const s1ThirdTime = rightTrimArray(
          item?.linearity5?.s1?.test3Values || [],
        );

        const s2FirstTime = rightTrimArray(
          item?.linearity5?.s2?.test1Values || [],
        );
        const s2SecondTime = rightTrimArray(
          item?.linearity5?.s2?.test2Values || [],
        );
        const s2ThirdTime = rightTrimArray(
          item?.linearity5?.s2?.test3Values || [],
        );

        const s3FirstTime = rightTrimArray(
          item?.linearity5?.s3?.test1Values || [],
        );
        const s3SecondTime = rightTrimArray(
          item?.linearity5?.s3?.test2Values || [],
        );
        const s3ThirdTime = rightTrimArray(
          item?.linearity5?.s3?.test3Values || [],
        );

        const s4FirstTime = rightTrimArray(
          item?.linearity5?.s4?.test1Values || [],
        );
        const s4SecondTime = rightTrimArray(
          item?.linearity5?.s4?.test2Values || [],
        );
        const s4ThirdTime = rightTrimArray(
          item?.linearity5?.s4?.test3Values || [],
        );

        itemToReturn.linearity5 = {
          s1: {
            test1Values: s1FirstTime,
            test2Values: s1SecondTime,
            test3Values: s1ThirdTime,
          },
          s2: {
            test1Values: s2FirstTime,
            test2Values: s2SecondTime,
            test3Values: s2ThirdTime,
          },
          s3: {
            test1Values: s3FirstTime,
            test2Values: s3SecondTime,
            test3Values: s3ThirdTime,
          },
          s4: {
            test1Values: s4FirstTime,
            test2Values: s4SecondTime,
            test3Values: s4ThirdTime,
          },
        };
      }

      if (report?.validationTests?.includes(ValidationTestsCode.Linearity10)) {
        const s1FirstTime = rightTrimArray(
          item?.linearity10?.s1?.test1Values || [],
        );
        const s1SecondTime = rightTrimArray(
          item?.linearity10?.s1?.test2Values || [],
        );
        const s1ThirdTime = rightTrimArray(
          item?.linearity10?.s1?.test3Values || [],
        );

        const s2FirstTime = rightTrimArray(
          item?.linearity10?.s2?.test1Values || [],
        );
        const s2SecondTime = rightTrimArray(
          item?.linearity10?.s2?.test2Values || [],
        );
        const s2ThirdTime = rightTrimArray(
          item?.linearity10?.s2?.test3Values || [],
        );

        const s3FirstTime = rightTrimArray(
          item?.linearity10?.s3?.test1Values || [],
        );
        const s3SecondTime = rightTrimArray(
          item?.linearity10?.s3?.test2Values || [],
        );
        const s3ThirdTime = rightTrimArray(
          item?.linearity10?.s3?.test3Values || [],
        );

        const s4FirstTime = rightTrimArray(
          item?.linearity10?.s4?.test1Values || [],
        );
        const s4SecondTime = rightTrimArray(
          item?.linearity10?.s4?.test2Values || [],
        );
        const s4ThirdTime = rightTrimArray(
          item?.linearity10?.s4?.test3Values || [],
        );

        itemToReturn.linearity10 = {
          s1: {
            test1Values: s1FirstTime,
            test2Values: s1SecondTime,
            test3Values: s1ThirdTime,
          },
          s2: {
            test1Values: s2FirstTime,
            test2Values: s2SecondTime,
            test3Values: s2ThirdTime,
          },
          s3: {
            test1Values: s3FirstTime,
            test2Values: s3SecondTime,
            test3Values: s3ThirdTime,
          },
          s4: {
            test1Values: s4FirstTime,
            test2Values: s4SecondTime,
            test3Values: s4ThirdTime,
          },
        };
      }

      if (
        report?.validationTests?.includes(ValidationTestsCode.Accuracy) ||
        report?.validationTests?.includes(ValidationTestsCode.ListAccuracy)
      ) {
        const s1Calibration = rightTrimArray(
          item?.accuracy?.calibrationResultsDataInput?.s1?.values || [],
        );
        const s2Calibration = rightTrimArray(
          item?.accuracy?.calibrationResultsDataInput?.s2?.values || [],
        );
        const s3Calibration = rightTrimArray(
          item?.accuracy?.calibrationResultsDataInput?.s3?.values || [],
        );
        const s4Calibration = rightTrimArray(
          item?.accuracy?.calibrationResultsDataInput?.s4?.values || [],
        );
        const s5Calibration = rightTrimArray(
          item?.accuracy?.calibrationResultsDataInput?.s5?.values || [],
        );
        const s6Calibration = rightTrimArray(
          item?.accuracy?.calibrationResultsDataInput?.s6?.values || [],
        );

        const s1Accuracy = rightTrimArray(
          item?.accuracy?.accuracyResultsDataInput?.s1?.values || [],
        );
        const s2Accuracy = rightTrimArray(
          item?.accuracy?.accuracyResultsDataInput?.s2?.values || [],
        );
        const s3Accuracy = rightTrimArray(
          item?.accuracy?.accuracyResultsDataInput?.s3?.values || [],
        );
        const s4Accuracy = rightTrimArray(
          item?.accuracy?.accuracyResultsDataInput?.s4?.values || [],
        );
        const s5Accuracy = rightTrimArray(
          item?.accuracy?.accuracyResultsDataInput?.s5?.values || [],
        );
        const s6Accuracy = rightTrimArray(
          item?.accuracy?.accuracyResultsDataInput?.s6?.values || [],
        );

        itemToReturn.accuracy = {
          accuracyResultsDataInput: {
            s1: {
              values: s1Accuracy,
            },
            s2: {
              values: s2Accuracy,
            },
            s3: {
              values: s3Accuracy,
            },
            s4: {
              values: s4Accuracy,
            },
            s5: {
              values: s5Accuracy,
            },
            s6: {
              values: s6Accuracy,
            },
          },
          calibrationResultsDataInput: {
            ...itemToReturn.accuracy.calibrationResultsDataInput,
            s1: {
              values: s1Calibration,
            },
            s2: {
              values: s2Calibration,
            },
            s3: {
              values: s3Calibration,
            },
            s4: {
              values: s4Calibration,
            },
            s5: {
              values: s5Calibration,
            },
            s6: {
              values: s6Calibration,
            },
          },
        };
      }

      if (
        report?.validationTests?.includes(
          ValidationTestsCode.IndoorReproducibilityDayDifferenceReproducibility,
        )
      ) {
        const s1 = rightTrimArray(item?.indoorReproducibility?.s1 || []);
        const s2 = rightTrimArray(item?.indoorReproducibility?.s2 || []);
        const s3 = rightTrimArray(item?.indoorReproducibility?.s3 || []);
        const s4 = rightTrimArray(item?.indoorReproducibility?.s4 || []);
        const s5 = rightTrimArray(item?.indoorReproducibility?.s5 || []);
        const s6 = rightTrimArray(item?.indoorReproducibility?.s6 || []);

        itemToReturn.indoorReproducibility = {
          s1,
          s2,
          s3,
          s4,
          s5,
          s6,
        };
      }

      return itemToReturn;
    });

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
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/${reportId}/test-data-input`,
      method: 'PUT',
      body: {
        testDataInput: {
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
                    const key = header.column.columnDef.meta?.datasetName
                      ? `${header.column.columnDef.meta?.datasetName}.${header.id}`
                      : header.id;

                    return (
                      <th
                        key={key}
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
                  const key = cell.column.columnDef.meta?.datasetName
                    ? `${cell.column.columnDef.meta?.datasetName}.${cell.id}`
                    : cell.id;

                  return (
                    <td
                      key={key}
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
