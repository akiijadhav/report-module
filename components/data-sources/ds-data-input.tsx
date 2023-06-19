import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import { DatasetDetail } from './models/data-source-detail';
import { DataSourcetWorkflowStep } from './models/data-source-workflow';
import DataSetSelector from './common/dataset-selector';
import DataSourceFooter from './data-source-footer';
import {
  DataInputReducerAction,
  DataSetResultLinkAction,
  DataSetResultLinkDetail,
  ResultDetail,
} from './models/dataset-results-detail';
import useRequestUtilities from '../hooks/use-request-utilities';
import DataInputGrid from './data-input-grid';
import { DataInputFieldsDetail } from './models/data-input-fields';
import { DataSetNames } from './enums/dataset-names';
import DataInputSelectData from './data-input-data-select';
import {
  DataSetGroupsAction,
  DataSetGroupsDetail,
  SelectedGroupDetail,
} from './models/dataset-groups';
import { useTranslation } from 'react-i18next';

function rightTrimArray(array: any[]) {
  for (let i = array.length - 1; i >= 0; i--) {
    if (array[i] === undefined || array[i] === null) {
      array.pop();
    } else {
      break;
    }
  }
  return array;
}

export default function DSDataInput(props: {
  activeStep: number;
  setActiveStep: Dispatch<SetStateAction<number>>;
  dataSets: DatasetDetail[];
  dataSourceId: string;
  dataSourceWorkflowSteps: DataSourcetWorkflowStep[];
  readOnly: boolean;
}) {
  const {
    activeStep,
    setActiveStep,
    dataSets,
    dataSourceId,
    dataSourceWorkflowSteps,
    readOnly,
  } = props;

  const { fetchWrapper, nextJsRouter: router } = useRequestUtilities();

  type viewScreenType = 'loading' | 'error' | 'set';
  const [viewScreen, setViewScreen] = useState<viewScreenType>('loading');
  const [responseError, setResponseError] = useState({
    msg: '',
    errorOnSubmit: false,
  });
  const [loading, setLoading] = useState(false);
  const [savingData, setSavingData] = useState(false);
  const [showDataSelectScreen, setShowDataSelectScreen] = useState(false);
  const { t } = useTranslation();

  const [dataSetsSchema, setDataSetsSchema] = useState<DataInputFieldsDetail[]>(
    [],
  );
  const [dataSetResults, dispatchDataSetResults] = useReducer(
    (state: ResultDetail[], action: DataInputReducerAction) => {
      if (action.type === 'PUSH') {
        const newMarkers: ResultDetail[] = [];
        const markersToUpdate: string[] = [];
        action?.pushPayload?.forEach((markerRecord) => {
          if (
            !state?.find(
              (availableMarker) => availableMarker?.id === markerRecord?.id,
            )
          ) {
            newMarkers.push(markerRecord);
          } else {
            const existingRecord = state?.find(
              (availableMarker) => availableMarker?.id === markerRecord?.id,
            );
            const incomingFields = Object.keys(markerRecord);
            const availableFields = Object.keys(existingRecord);
            const newFields =
              incomingFields?.filter(
                (field) => !availableFields.includes(field),
              ) || [];

            if (newFields.length) {
              markersToUpdate.push(existingRecord.id);
              newFields.forEach((field) => {
                existingRecord[field] = markerRecord[field];
              });
              newMarkers.push(existingRecord);
            }
          }
        });
        return [
          ...state.filter((record) => !markersToUpdate.includes(record.id)),
          ...newMarkers,
        ];
      }
      if (action.type === 'UPDATE') {
        const {
          resultId,
          columnId,
          groupName,
          value,
          testFamily,
          groupDisplayName,
          isArray,
        } = action;

        return state?.map((result) => {
          if (result?.id === resultId) {
            const recordObj = {
              ...result,
            };

            if (testFamily === DataSetNames.Correlation) {
              if (!Array.isArray(recordObj[groupName + 'Results']?.results)) {
                recordObj[groupName + 'Results'] = {
                  results: [],
                };
              }
              const numList = recordObj[groupName + 'Results']?.results;

              numList[
                Number(columnId?.replace(`${testFamily}.${groupName}`, '')) - 1
              ] = !!value || value === 0 ? Number(value) : null;

              recordObj[groupName + 'Results'].results = numList;
            } else if (
              testFamily === DataSetNames.Linearity5 ||
              testFamily === DataSetNames.Linearity10
            ) {
              if (
                typeof recordObj[testFamily.slice(0, -5) + 'Results'] !==
                  'object' ||
                recordObj[testFamily.slice(0, -5) + 'Results'] === null
              ) {
                recordObj[testFamily.slice(0, -5) + 'Results'] = {
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
                recordObj[testFamily.slice(0, -5) + 'Results'][
                  groupName?.slice(0, 2)
                ][arrayName];
              if (!Array.isArray(numList)) numList = [];
              numList[
                Number(columnId?.replace(`${testFamily}.${groupName}`, '')) - 1
              ] = !!value || value === 0 ? Number(value) : null;

              recordObj[testFamily.slice(0, -5) + 'Results'][
                groupName?.slice(0, 2)
              ][arrayName] = numList;
            } else if (testFamily === DataSetNames.Accuracy) {
              if (
                !recordObj?.accuracyResults ||
                typeof recordObj?.accuracyResults !== 'object'
              ) {
                recordObj.accuracyResults = {
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
                  recordObj.accuracyResults[
                    groupName.split('-')?.at(1) === 'cal'
                      ? 'calibrationResultsDataInput'
                      : 'accuracyResultsDataInput'
                  ][groupName.split('-')?.at(0)]?.values;
                if (!Array.isArray(numList)) numList = [];

                numList[
                  Number(columnId?.replace(`${testFamily}.${groupName}`, '')) -
                    1
                ] = !!value || value === 0 ? Number(value) : null;

                recordObj.accuracyResults[
                  groupName.split('-')?.at(1) === 'cal'
                    ? 'calibrationResultsDataInput'
                    : 'accuracyResultsDataInput'
                ][groupName.split('-')?.at(0)].values = numList;
              } else {
                recordObj.accuracyResults.calibrationResultsDataInput[
                  columnId.split('.')?.at(-1)
                ] = !!value || value === 0 ? Number(value) : null;
              }
            } else if (testFamily === DataSetNames.Repeatability) {
              if (!recordObj?.listRepeatabilityResults) {
                recordObj.listRepeatabilityResults = {
                  s1: [],
                  s2: [],
                  s3: [],
                  s4: [],
                  s5: [],
                  s6: [],
                };
              }

              const numList = recordObj?.listRepeatabilityResults?.[groupName];

              numList[
                Number(columnId?.replace(`${testFamily}.${groupName}`, '')) - 1
              ] = !!value || value === 0 ? Number(value) : null;

              recordObj.listRepeatabilityResults[groupName] = numList;
            } else if (testFamily === DataSetNames.IndoorReproducibility) {
              if (!recordObj?.listIndoorReproducibilityResults) {
                const sampleArray = Array(30)
                  .fill(null)
                  .map((_, index) => {
                    return {
                      day: index + 1,
                      sampleData: [
                        {
                          time: 1,
                          value: null,
                        },
                        {
                          time: 2,
                          value: null,
                        },
                      ],
                    };
                  });

                recordObj.listIndoorReproducibilityResults = {
                  s1: sampleArray,
                  s2: sampleArray,
                  s3: sampleArray,
                  s4: sampleArray,
                  s5: sampleArray,
                  s6: sampleArray,
                };
              }

              const index =
                Number(columnId?.replace(`${testFamily}.${groupName}`, '')) - 1;
              const dayNumber = Math.floor(index / 2) + 1;
              const count = (index % 2) + 1;

              recordObj.listIndoorReproducibilityResults[groupName] =
                recordObj.listIndoorReproducibilityResults[groupName].map(
                  (daySample) => {
                    if (daySample.day === dayNumber) {
                      return {
                        ...daySample,
                        sampleData: daySample.sampleData.map((valueItem) => {
                          if (valueItem.time === count) {
                            return {
                              time: count,
                              value:
                                !!value || value === 0 ? Number(value) : null,
                            };
                          } else {
                            return valueItem;
                          }
                        }),
                      };
                    } else {
                      return daySample;
                    }
                  },
                );
            } else if (testFamily === DataSetNames.CorrelationQualitative) {
              if (!recordObj.correlationQualitativeXResults) {
                recordObj.correlationQualitativeXResults = {
                  results: [],
                  resultsRetest: [],
                };
              }
              if (!recordObj.correlationQualitativeYResults) {
                recordObj.correlationQualitativeYResults = {
                  results: [],
                  resultsRetest: [],
                };
              }
              const isReExam = groupName?.split('-')?.length === 2;
              const grpLetter = isReExam
                ? groupName?.split('-')?.at(0)?.at(-1)?.toUpperCase()
                : groupName?.at(-1)?.toUpperCase();
              const numList =
                recordObj[
                  DataSetNames.CorrelationQualitative + grpLetter + 'Results'
                ]?.[isReExam ? 'resultsRetest' : 'results'];

              numList[
                Number(columnId?.replace(`${testFamily}.${groupName}`, '')) - 1
              ] = !!value || value === 0 ? Number(value) : null;

              recordObj[
                DataSetNames.CorrelationQualitative + grpLetter + 'Results'
              ][isReExam ? 'resultsRetest' : 'results'] = numList;
            } else if (testFamily === DataSetNames.XResidual) {
              if (!recordObj.correlationXResults) {
                recordObj.correlationXResults = {
                  results: [],
                  resultsRetest: [],
                };
              }
              if (!recordObj.correlationYResults) {
                recordObj.correlationYResults = {
                  results: [],
                  resultsRetest: [],
                };
              }
              const isReExam = groupName?.split('-')?.length === 2;
              const grpLetter = isReExam
                ? groupName?.split('-')?.at(0)?.at(-1)?.toUpperCase()
                : groupName?.at(-1)?.toUpperCase();
              const numList =
                recordObj['correlation' + grpLetter + 'Results']?.[
                  isReExam ? 'resultsRetest' : 'results'
                ];

              numList[
                Number(columnId?.replace(`${testFamily}.${groupName}`, '')) - 1
              ] = !!value || value === 0 ? Number(value) : null;

              recordObj['correlation' + grpLetter + 'Results'][
                isReExam ? 'resultsRetest' : 'results'
              ] = numList;
            }

            return recordObj;
          } else {
            return result;
          }
        });
      }
      if (action.type === 'PUT-ARRAY') {
        const { putArray, resultId, testFamily, groupName, groupDisplayName } =
          action;

        return state?.map((result) => {
          if (result?.id === resultId) {
            const recordObj = {
              ...result,
            };

            if (testFamily === DataSetNames.Correlation) {
              if (!Array.isArray(recordObj[groupName + 'Results']?.results)) {
                recordObj[groupName + 'Results'] = {
                  results: [],
                };
              }

              recordObj[groupName + 'Results'].results = putArray;
            } else if (
              testFamily === DataSetNames.Linearity5 ||
              testFamily === DataSetNames.Linearity10
            ) {
              if (
                typeof recordObj[testFamily.slice(0, -5) + 'Results'] !==
                  'object' ||
                recordObj[testFamily.slice(0, -5) + 'Results'] === null
              ) {
                recordObj[testFamily.slice(0, -5) + 'Results'] = {
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

              recordObj[testFamily.slice(0, -5) + 'Results'][
                groupName?.slice(0, 2)
              ][arrayName] = putArray;
            } else if (testFamily === DataSetNames.Accuracy) {
              if (
                !recordObj?.accuracyResults ||
                typeof recordObj?.accuracyResults !== 'object'
              ) {
                recordObj.accuracyResults = {
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

              recordObj.accuracyResults[
                groupName.split('-')?.at(1) === 'cal'
                  ? 'calibrationResultsDataInput'
                  : 'accuracyResultsDataInput'
              ][groupName.split('-')?.at(0)].values = putArray;
            } else if (testFamily === DataSetNames.Repeatability) {
              if (!recordObj?.listRepeatabilityResults) {
                recordObj.listRepeatabilityResults = {
                  s1: [],
                  s2: [],
                  s3: [],
                  s4: [],
                  s5: [],
                  s6: [],
                };
              }

              recordObj.listRepeatabilityResults[groupName] = putArray;
            } else if (testFamily === DataSetNames.IndoorReproducibility) {
              if (!recordObj?.listIndoorReproducibilityResults) {
                const sampleArray = Array(30)
                  .fill(null)
                  .map((_, index) => {
                    return {
                      day: index + 1,
                      sampleData: [
                        {
                          time: 1,
                          value: null,
                        },
                        {
                          time: 2,
                          value: null,
                        },
                      ],
                    };
                  });

                recordObj.listIndoorReproducibilityResults = {
                  s1: sampleArray,
                  s2: sampleArray,
                  s3: sampleArray,
                  s4: sampleArray,
                  s5: sampleArray,
                  s6: sampleArray,
                };
              }

              putArray.forEach((value, index) => {
                const dayNumber = Math.floor(index / 2) + 1;
                const count = (index % 2) + 1;

                recordObj.listIndoorReproducibilityResults[groupName] =
                  recordObj.listIndoorReproducibilityResults[groupName].map(
                    (daySample) => {
                      if (daySample.day === dayNumber) {
                        return {
                          ...daySample,
                          sampleData: daySample.sampleData.map((valueItem) => {
                            if (valueItem.time === count) {
                              return {
                                time: count,
                                value,
                              };
                            } else {
                              return valueItem;
                            }
                          }),
                        };
                      } else {
                        return daySample;
                      }
                    },
                  );
              });
            } else if (testFamily === DataSetNames.CorrelationQualitative) {
              if (!recordObj.correlationQualitativeXResults) {
                recordObj.correlationQualitativeXResults = {
                  results: [],
                  resultsRetest: [],
                };
              }
              if (!recordObj.correlationQualitativeYResults) {
                recordObj.correlationQualitativeYResults = {
                  results: [],
                  resultsRetest: [],
                };
              }
              const isReExam = groupName?.split('-')?.length === 2;
              const grpLetter = isReExam
                ? groupName?.split('-')?.at(0)?.at(-1)?.toUpperCase()
                : groupName?.at(-1)?.toUpperCase();

              recordObj[
                DataSetNames.CorrelationQualitative + grpLetter + 'Results'
              ][isReExam ? 'resultsRetest' : 'results'] = putArray;
            } else if (testFamily === DataSetNames.XResidual) {
              if (!recordObj.correlationXResults) {
                recordObj.correlationXResults = {
                  results: [],
                  resultsRetest: [],
                };
              }
              if (!recordObj.correlationYResults) {
                recordObj.correlationYResults = {
                  results: [],
                  resultsRetest: [],
                };
              }
              const isReExam = groupName?.split('-')?.length === 2;
              const grpLetter = isReExam
                ? groupName?.split('-')?.at(0)?.at(-1)?.toUpperCase()
                : groupName?.at(-1)?.toUpperCase();

              recordObj['correlation' + grpLetter + 'Results'][
                isReExam ? 'resultsRetest' : 'results'
              ] = putArray;
            }

            return recordObj;
          } else {
            return result;
          }
        });
      }
      if (action.type === 'SET') {
        return action?.setPayload || [];
      }
      return state;
    },
    [],
  );
  const [dataSetMarkerLink, dispatchDataSetMarkerLink] = useReducer(
    (state: DataSetResultLinkDetail[], action: DataSetResultLinkAction) => {
      if (action.type === 'PUSH') {
        if (
          state?.find(
            (dataSetMarkers) => dataSetMarkers?.dataSetId === action?.dataSetId,
          )
        ) {
          return state;
        } else {
          return [...state, action?.pushPayload];
        }
      }
      return state;
    },
    [],
  );
  const [dataSetsGroups, dispatchDataSetGroups] = useReducer(
    (state: DataSetGroupsDetail[], action: DataSetGroupsAction) => {
      if (action.type === 'SET') {
        return action?.setPayload || [];
      }
      if (action.type === 'PUSH') {
        if (
          state?.find(
            (dataSetGroup) =>
              dataSetGroup?.dataSetId === action?.pushPayload?.dataSetId,
          )
        ) {
          return state;
        } else {
          return [...state, action.pushPayload];
        }
      }
      if (action.type === 'REPLACE') {
        return state?.map((dataSetGroup) =>
          dataSetGroup?.dataSetId === action?.replacePayload?.dataSetId
            ? action?.replacePayload
            : dataSetGroup,
        );
      }
      return state;
    },
    [],
  );

  const [activeDataSetId, setActiveDataSetId] = useState('');
  const [prevDataSetId, setPrevDataSetId] = useState('');

  const activeDataSet = useMemo(
    () => dataSets?.find((dataSet) => dataSet?.id === activeDataSetId) || null,
    [dataSets, activeDataSetId],
  );
  const activeDataSetSchema = useMemo(() => {
    return (
      dataSetsSchema?.find((schema) => schema?.dataSetId === activeDataSetId)
        ?.fields || null
    );
  }, [dataSetsSchema, activeDataSetId]);
  const activeDataSetResults = useMemo(() => {
    const activeMarkers =
      dataSetMarkerLink?.find(
        (dataSetResults) => dataSetResults?.dataSetId === activeDataSetId,
      )?.resultIDs || [];

    const localDataSetResults =
      activeMarkers?.map((markerRecordID) => {
        return dataSetResults?.find((record) => record?.id === markerRecordID);
      }) || [];

    return localDataSetResults;
  }, [dataSetResults, activeDataSetId, dataSetMarkerLink]);
  const activeDataSetGroups = useMemo(
    () =>
      dataSetsGroups?.find(
        (dataSetGroup) => dataSetGroup?.dataSetId === activeDataSetId,
      ),
    [dataSetsGroups, activeDataSetId],
  );

  const [activeMarkerRecordID, setActiveMarkerRecordID] =
    useState<SelectedGroupDetail>({
      recordID: '',
      groupName: '',
      groupDisplayName: '',
    });
  const activeMarkerRecord = useMemo(
    () =>
      activeDataSetResults?.find(
        (dataSetResult) =>
          dataSetResult?.markerId === activeMarkerRecordID?.recordID,
      ) || null,
    [activeMarkerRecordID?.recordID, activeDataSetResults],
  );

  useEffect(() => {
    setActiveDataSetId(dataSets?.at(0)?.id || '');
  }, [dataSets, setActiveDataSetId]);

  const markAsComplete = useCallback(
    function (dataSourceId: string) {
      function initiate() {
        setLoading(true);
      }
      async function handleResponse(response: Response) {
        if (response.ok) {
          router.push('/data-sources');
        } else {
          if (response.status === 500) {
            setResponseError({
              errorOnSubmit: true,
              msg: t('error.something_went_wrong'),
            });
          } else {
            const resJson = await response.json();
            setResponseError({
              errorOnSubmit: true,
              msg: resJson?.message || t('error.something_went_wrong'),
            });
          }
          setLoading(false);
          setViewScreen('error');
        }
      }
      function handleError(_error: any) {
        setResponseError({
          errorOnSubmit: true,
          msg: t('error.something_went_wrong'),
        });
        setLoading(false);
        setViewScreen('error');
      }

      fetchWrapper({
        url: `${process.env.NEXT_PUBLIC_API_BASE_URL_V1}/datasources/${dataSourceId}/completed`,
        method: 'PUT',
        includeAuthToken: true,
        initiate,
        handleResponse,
        handleError,
      });
    },
    [setLoading, router, setResponseError, setViewScreen],
  );

  const updateMarkerResults = useCallback(
    function (
      saveDraft = false,
      handleDraftSuccess?: () => void,
      handleDraftFailure?: () => void,
      initiateDraft?: () => void,
      nextStep = false,
    ) {
      const currentDataSetID =
        saveDraft || nextStep
          ? activeDataSetId
          : prevDataSetId || activeDataSetId;
      const currentDataSetName = dataSetMarkerLink?.find(
        (link) => link.dataSetId === currentDataSetID,
      )?.dataSetName;
      const currentResults =
        dataSetMarkerLink?.find((link) => link.dataSetId === currentDataSetID)
          ?.resultIDs || [];

      const requestResults = dataSetResults
        ?.filter((result) => currentResults.includes(result.id))
        ?.map((item) => {
          const {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            marker,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            markerId,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            markerCsvResults,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            channel,
            ...itemToReturn
          } = item;

          if (currentDataSetName === DataSetNames.Correlation) {
            const corX = item?.correlationXResults?.results?.filter(Number);
            const corY = item?.correlationYResults?.results?.filter(Number);

            itemToReturn.correlationXResults = {
              results: corX || [],
              resultsRetest: [],
            };
            itemToReturn.correlationYResults = {
              results: corY || [],
              resultsRetest: [],
            };
          }
          if (currentDataSetName === DataSetNames.Linearity5) {
            const s1FirstTime = rightTrimArray(
              item?.linearity5Results?.s1?.test1Values || [],
            );
            const s1SecondTime = rightTrimArray(
              item?.linearity5Results?.s1?.test2Values || [],
            );
            const s1ThirdTime = rightTrimArray(
              item?.linearity5Results?.s1?.test3Values || [],
            );

            const s2FirstTime = rightTrimArray(
              item?.linearity5Results?.s2?.test1Values || [],
            );
            const s2SecondTime = rightTrimArray(
              item?.linearity5Results?.s2?.test2Values || [],
            );
            const s2ThirdTime = rightTrimArray(
              item?.linearity5Results?.s2?.test3Values || [],
            );

            const s3FirstTime = rightTrimArray(
              item?.linearity5Results?.s3?.test1Values || [],
            );
            const s3SecondTime = rightTrimArray(
              item?.linearity5Results?.s3?.test2Values || [],
            );
            const s3ThirdTime = rightTrimArray(
              item?.linearity5Results?.s3?.test3Values || [],
            );

            const s4FirstTime = rightTrimArray(
              item?.linearity5Results?.s4?.test1Values || [],
            );
            const s4SecondTime = rightTrimArray(
              item?.linearity5Results?.s4?.test2Values || [],
            );
            const s4ThirdTime = rightTrimArray(
              item?.linearity5Results?.s4?.test3Values || [],
            );

            itemToReturn.linearity5Results = {
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
          if (currentDataSetName === DataSetNames.Linearity10) {
            const s1FirstTime = rightTrimArray(
              item?.linearity10Results?.s1?.test1Values || [],
            );
            const s1SecondTime = rightTrimArray(
              item?.linearity10Results?.s1?.test2Values || [],
            );
            const s1ThirdTime = rightTrimArray(
              item?.linearity10Results?.s1?.test3Values || [],
            );

            const s2FirstTime = rightTrimArray(
              item?.linearity10Results?.s2?.test1Values || [],
            );
            const s2SecondTime = rightTrimArray(
              item?.linearity10Results?.s2?.test2Values || [],
            );
            const s2ThirdTime = rightTrimArray(
              item?.linearity10Results?.s2?.test3Values || [],
            );

            const s3FirstTime = rightTrimArray(
              item?.linearity10Results?.s3?.test1Values || [],
            );
            const s3SecondTime = rightTrimArray(
              item?.linearity10Results?.s3?.test2Values || [],
            );
            const s3ThirdTime = rightTrimArray(
              item?.linearity10Results?.s3?.test3Values || [],
            );

            const s4FirstTime = rightTrimArray(
              item?.linearity10Results?.s4?.test1Values || [],
            );
            const s4SecondTime = rightTrimArray(
              item?.linearity10Results?.s4?.test2Values || [],
            );
            const s4ThirdTime = rightTrimArray(
              item?.linearity10Results?.s4?.test3Values || [],
            );

            itemToReturn.linearity10Results = {
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
          if (currentDataSetName === DataSetNames.Accuracy) {
            const s1Calibration = rightTrimArray(
              item?.accuracyResults?.calibrationResultsDataInput?.s1?.values ||
                [],
            );
            const s2Calibration = rightTrimArray(
              item?.accuracyResults?.calibrationResultsDataInput?.s2?.values ||
                [],
            );
            const s3Calibration = rightTrimArray(
              item?.accuracyResults?.calibrationResultsDataInput?.s3?.values ||
                [],
            );
            const s4Calibration = rightTrimArray(
              item?.accuracyResults?.calibrationResultsDataInput?.s4?.values ||
                [],
            );
            const s5Calibration = rightTrimArray(
              item?.accuracyResults?.calibrationResultsDataInput?.s5?.values ||
                [],
            );
            const s6Calibration = rightTrimArray(
              item?.accuracyResults?.calibrationResultsDataInput?.s6?.values ||
                [],
            );

            const s1Accuracy = rightTrimArray(
              item?.accuracyResults?.accuracyResultsDataInput?.s1?.values || [],
            );
            const s2Accuracy = rightTrimArray(
              item?.accuracyResults?.accuracyResultsDataInput?.s2?.values || [],
            );
            const s3Accuracy = rightTrimArray(
              item?.accuracyResults?.accuracyResultsDataInput?.s3?.values || [],
            );
            const s4Accuracy = rightTrimArray(
              item?.accuracyResults?.accuracyResultsDataInput?.s4?.values || [],
            );
            const s5Accuracy = rightTrimArray(
              item?.accuracyResults?.accuracyResultsDataInput?.s5?.values || [],
            );
            const s6Accuracy = rightTrimArray(
              item?.accuracyResults?.accuracyResultsDataInput?.s6?.values || [],
            );

            itemToReturn.accuracyResults = {
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
                s1AbsCutoff:
                  itemToReturn?.accuracyResults?.calibrationResultsDataInput
                    ?.s1AbsCutoff || null,
                k:
                  itemToReturn?.accuracyResults?.calibrationResultsDataInput
                    ?.k || null,
                a:
                  itemToReturn?.accuracyResults?.calibrationResultsDataInput
                    ?.a || null,
                b:
                  itemToReturn?.accuracyResults?.calibrationResultsDataInput
                    ?.b || null,
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
          if (currentDataSetName === DataSetNames.Repeatability) {
            const s1 = rightTrimArray(item?.listRepeatabilityResults?.s1 || []);
            const s2 = rightTrimArray(item?.listRepeatabilityResults?.s2 || []);
            const s3 = rightTrimArray(item?.listRepeatabilityResults?.s3 || []);
            const s4 = rightTrimArray(item?.listRepeatabilityResults?.s4 || []);
            const s5 = rightTrimArray(item?.listRepeatabilityResults?.s5 || []);
            const s6 = rightTrimArray(item?.listRepeatabilityResults?.s6 || []);

            itemToReturn.listRepeatabilityResults = {
              s1,
              s2,
              s3,
              s4,
              s5,
              s6,
            };
          }
          if (currentDataSetName === DataSetNames.IndoorReproducibility) {
            if (!itemToReturn?.listIndoorReproducibilityResults) {
              itemToReturn.listIndoorReproducibilityResults = {
                s1: [],
                s2: [],
                s3: [],
                s4: [],
                s5: [],
                s6: [],
              };
            } else {
              const s1 = (
                item?.listIndoorReproducibilityResults?.s1 as any[]
              )?.filter((dayItem) =>
                dayItem?.sampleData?.some(
                  (valueItem) => valueItem?.value !== null,
                ),
              )?.length
                ? item?.listIndoorReproducibilityResults?.s1?.filter(
                    (dayItem) =>
                      dayItem?.day === 1 ||
                      dayItem?.sampleData?.some(
                        (valueItem) => valueItem?.value !== null,
                      ),
                  )
                : [];
              const s2 = (
                item?.listIndoorReproducibilityResults?.s2 as any[]
              )?.filter((dayItem) =>
                dayItem?.sampleData?.some(
                  (valueItem) => valueItem?.value !== null,
                ),
              )?.length
                ? item?.listIndoorReproducibilityResults?.s2?.filter(
                    (dayItem) =>
                      dayItem?.day === 1 ||
                      dayItem?.sampleData?.some(
                        (valueItem) => valueItem?.value !== null,
                      ),
                  )
                : [];
              const s3 = (
                item?.listIndoorReproducibilityResults?.s3 as any[]
              )?.filter((dayItem) =>
                dayItem?.sampleData?.some(
                  (valueItem) => valueItem?.value !== null,
                ),
              )?.length
                ? item?.listIndoorReproducibilityResults?.s3?.filter(
                    (dayItem) =>
                      dayItem?.day === 1 ||
                      dayItem?.sampleData?.some(
                        (valueItem) => valueItem?.value !== null,
                      ),
                  )
                : [];
              const s4 = (
                item?.listIndoorReproducibilityResults?.s4 as any[]
              )?.filter((dayItem) =>
                dayItem?.sampleData?.some(
                  (valueItem) => valueItem?.value !== null,
                ),
              )?.length
                ? item?.listIndoorReproducibilityResults?.s4?.filter(
                    (dayItem) =>
                      dayItem?.day === 1 ||
                      dayItem?.sampleData?.some(
                        (valueItem) => valueItem?.value !== null,
                      ),
                  )
                : [];
              const s5 = (
                item?.listIndoorReproducibilityResults?.s5 as any[]
              )?.filter((dayItem) =>
                dayItem?.sampleData?.some(
                  (valueItem) => valueItem?.value !== null,
                ),
              )?.length
                ? item?.listIndoorReproducibilityResults?.s5?.filter(
                    (dayItem) =>
                      dayItem?.day === 1 ||
                      dayItem?.sampleData?.some(
                        (valueItem) => valueItem?.value !== null,
                      ),
                  )
                : [];
              const s6 = (
                item?.listIndoorReproducibilityResults?.s6 as any[]
              )?.filter((dayItem) =>
                dayItem?.sampleData?.some(
                  (valueItem) => valueItem?.value !== null,
                ),
              )?.length
                ? item?.listIndoorReproducibilityResults?.s6?.filter(
                    (dayItem) =>
                      dayItem?.day === 1 ||
                      dayItem?.sampleData?.some(
                        (valueItem) => valueItem?.value !== null,
                      ),
                  )
                : [];
              itemToReturn.listIndoorReproducibilityResults = {
                s1,
                s2,
                s3,
                s4,
                s5,
                s6,
              };
            }
          }
          if (currentDataSetName === DataSetNames.CorrelationQualitative) {
            const corX =
              item?.correlationQualitativeXResults?.results?.filter(Number);
            const corXRetest =
              item?.correlationQualitativeXResults?.resultsRetest?.filter(
                Number,
              );
            const corY =
              item?.correlationQualitativeYResults?.results?.filter(Number);
            const corYRetest =
              item?.correlationQualitativeYResults?.resultsRetest?.filter(
                Number,
              );

            itemToReturn.correlationQualitativeXResults = {
              results: corX || [],
              resultsRetest: corXRetest || [],
            };
            itemToReturn.correlationQualitativeYResults = {
              results: corY || [],
              resultsRetest: corYRetest || [],
            };
          }
          if (currentDataSetName === DataSetNames.XResidual) {
            const corX = item?.correlationXResults?.results?.filter(Number);
            const corXRetest =
              item?.correlationXResults?.resultsRetest?.filter(Number);
            const corY = item?.correlationYResults?.results?.filter(Number);
            const corYRetest =
              item?.correlationYResults?.resultsRetest?.filter(Number);

            itemToReturn.correlationXResults = {
              results: corX || [],
              resultsRetest: corXRetest || [],
            };
            itemToReturn.correlationYResults = {
              results: corY || [],
              resultsRetest: corYRetest || [],
            };
          }

          return itemToReturn;
        });

      function initiate() {
        if (saveDraft) {
          initiateDraft();
        } else {
          if (nextStep) {
            setLoading(true);
          } else {
            setSavingData(true);
          }
        }
      }
      async function handleResponse(response: Response) {
        if (response.ok) {
          if (saveDraft && handleDraftSuccess) {
            handleDraftSuccess();
          } else {
            if (nextStep) {
              markAsComplete(dataSourceId);
            }
          }
        } else {
          if (saveDraft) {
            handleDraftFailure();
          } else {
            if (response.status === 500) {
              setResponseError({
                errorOnSubmit: true,
                msg: t('error.something_went_wrong'),
              });
            } else {
              setResponseError({
                errorOnSubmit: true,
                msg: `Error ${response.status}: ${t(
                  'error.something_went_wrong',
                )}`,
              });
            }
            setLoading(false);
            setViewScreen('error');
          }
        }
      }
      function handleError(_error: any) {
        if (saveDraft) {
          handleDraftFailure();
        } else {
          setResponseError({
            errorOnSubmit: true,
            msg: t('error.something_went_wrong'),
          });
          setLoading(false);
          setViewScreen('error');
        }
      }
      function handleFinally() {
        setSavingData(false);
      }

      fetchWrapper({
        url: `${process.env.NEXT_PUBLIC_API_BASE_URL_V1}/marker-records/results`,
        method: 'PUT',
        body: { dataSourceId, markerRecords: requestResults },
        includeAuthToken: true,
        initiate,
        handleResponse,
        handleError,
        handleFinally,
      });
    },
    [
      dataSourceId,
      dataSetResults,
      router,
      markAsComplete,
      setLoading,
      setSavingData,
      setActiveStep,
      setResponseError,
      setViewScreen,
    ],
  );

  useEffect(() => {
    if (!prevDataSetId || readOnly) return;
    updateMarkerResults();
  }, [prevDataSetId, readOnly]);

  if (showDataSelectScreen) {
    return (
      <>
        <DataInputSelectData
          setShow={setShowDataSelectScreen}
          markerRecord={activeMarkerRecord}
          dispatchDataSetResults={dispatchDataSetResults}
          dataSet={activeDataSet}
          selectedGroupInfo={activeMarkerRecordID}
        />
      </>
    );
  }

  return (
    <>
      <section className="min-h-[calc(100vh_-_13.5rem)]">
        <DataInputGrid
          dataSet={activeDataSet}
          tableSchema={activeDataSetSchema}
          setDataSetsSchema={setDataSetsSchema}
          tableData={activeDataSetResults}
          dispatchDataSetResults={dispatchDataSetResults}
          dispatchDataSetMarkerLink={dispatchDataSetMarkerLink}
          dataSourceId={dataSourceId}
          tableGroups={activeDataSetGroups}
          dispatchDataSetGroups={dispatchDataSetGroups}
          setActiveMarkerRecordID={setActiveMarkerRecordID}
          setShowDataSelectScreen={setShowDataSelectScreen}
          savingData={savingData}
          viewScreen={viewScreen}
          setViewScreen={setViewScreen}
          responseError={responseError}
          setResponseError={setResponseError}
          readOnly={readOnly}
        />
      </section>
      <DataSetSelector
        activeDataSetId={activeDataSetId}
        setActiveDataSetId={setActiveDataSetId}
        dataSets={dataSets}
        setPrevDataSetId={setPrevDataSetId}
      />
      <DataSourceFooter
        activeStep={activeStep}
        workflowSteps={dataSourceWorkflowSteps}
        handleSubmit={() => {
          if (readOnly) {
            setActiveStep((activeStep) => activeStep + 1);
          } else {
            updateMarkerResults(false, undefined, undefined, undefined, true);
          }
        }}
        handlePrevious={() => setActiveStep((activeStep) => activeStep - 1)}
        handleDraft={updateMarkerResults}
        isLoading={loading}
        readOnly={readOnly}
      />
    </>
  );
}
