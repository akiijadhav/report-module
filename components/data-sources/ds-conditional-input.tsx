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
import ConditionalInputGrid from './conditional-input-grid';
import { DataSetFieldsDetail } from './models/dataset-field-detail';
import {
  DataReducerAction,
  DataSetMarkerLinkAction,
  DataSetMarkerLinkDetail,
  DataSetRecordsDetail,
} from './models/dataset-records-detail';
import useRequestUtilities from '../hooks/use-request-utilities';
import { useTranslation } from 'react-i18next';
import { DataSetNames } from './enums/dataset-names';

export default function DSConditionalInput(props: {
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

  const { fetchWrapper } = useRequestUtilities();
  const { t } = useTranslation();

  type viewScreenType = 'loading' | 'error' | 'set';
  const [viewScreen, setViewScreen] = useState<viewScreenType>('loading');
  const [responseError, setResponseError] = useState({
    msg: '',
    errorOnSubmit: false,
  });
  const [loading, setLoading] = useState(false);
  const [savingData, setSavingData] = useState(false);
  const [dataSetsSchema, setDataSetsSchema] = useState<DataSetFieldsDetail[]>(
    [],
  );
  const [dataSetRecords, dispatchDataSetRecords] = useReducer(
    (state: DataSetRecordsDetail[], action: DataReducerAction) => {
      if (action.type === 'PUSH') {
        const newMarkers: DataSetRecordsDetail[] = [];
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
        const { markerRecordId, columnId, groupName, value } = action;

        return state?.map((markerRecord) => {
          if (markerRecord?.id === markerRecordId) {
            const recordObj = {
              ...markerRecord,
            };
            if (groupName) {
              recordObj[groupName] = {
                ...recordObj[groupName],
                [columnId?.split('.')?.at(-1)]: value || null,
              };
            } else {
              recordObj[columnId?.split('.')?.at(-1)] = value || null;
            }

            return recordObj;
          } else {
            return markerRecord;
          }
        });
      }
      return state;
    },
    [],
  );
  const [dataSetMarkerLink, dispatchDataSetMarkerLink] = useReducer(
    (state: DataSetMarkerLinkDetail[], action: DataSetMarkerLinkAction) => {
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
  const activeDataSetRecords = useMemo(() => {
    const activeMarkers =
      dataSetMarkerLink?.find(
        (dataSetMarkers) => dataSetMarkers?.dataSetId === activeDataSetId,
      )?.recordIDs || [];

    const localDataSetMarkers =
      activeMarkers?.map((markerRecordID) => {
        return dataSetRecords?.find((record) => record?.id === markerRecordID);
      }) || [];

    return localDataSetMarkers;
  }, [dataSetMarkerLink, dataSetRecords, activeDataSetId]);

  useEffect(() => {
    setActiveDataSetId(dataSets?.at(0)?.id || '');
  }, [dataSets, setActiveDataSetId]);

  const putMarkerRecords = useCallback(
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
      const unwantedFields = ['acn', 'category', 'label', 'unit'];
      const currentSchemaFields =
        dataSetsSchema
          ?.find((schema) => schema?.dataSetId === currentDataSetID)
          ?.fields?.map((field) => field.name)
          ?.filter((field) => !unwantedFields.includes(field)) || [];
      const currentRecords =
        dataSetMarkerLink?.find((link) => link.dataSetId === currentDataSetID)
          ?.recordIDs || [];

      // Static check for accuracy groups, otherwise PDF fails
      const isAccuracy =
        dataSetMarkerLink?.find((link) => link.dataSetId === currentDataSetID)
          ?.dataSetName === DataSetNames.Accuracy;
      const accuracyGroups = Array(6)
        .fill(null)
        .map((_, index) => `accuracyS${index + 1}`);

      const requestRecords = dataSetRecords
        ?.filter((record) => currentRecords.includes(record.id))
        ?.map((record) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const toReturn = { id: record.id };
          currentSchemaFields.forEach((field) => {
            toReturn[field] = record[field];
          });
          if (isAccuracy) {
            accuracyGroups.forEach((groupName) => {
              if (!toReturn[groupName]) {
                toReturn[groupName] = {
                  sd: null,
                  name: null,
                  lotNo: null,
                  displayValue: null,
                };
              }
            });
          }
          return toReturn;
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
              setActiveStep((activeStep) => activeStep + 1);
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
                msg: `${t('error.something_went_wrong')}`,
              });
            }
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
          setViewScreen('error');
        }
      }
      function handleFinally() {
        setLoading(false);
        setSavingData(false);
      }

      fetchWrapper({
        url: `${process.env.NEXT_PUBLIC_API_BASE_URL_V1}/marker-records`,
        method: 'PUT',
        body: { dataSourceId, markerRecords: requestRecords },
        includeAuthToken: true,
        initiate,
        handleResponse,
        handleError,
        handleFinally,
      });
    },
    [
      dataSourceId,
      activeDataSetId,
      prevDataSetId,
      dataSetsSchema,
      dataSetRecords,
      dataSetMarkerLink,
      DataSetNames,
      setLoading,
      setActiveStep,
      setResponseError,
      setViewScreen,
    ],
  );

  useEffect(() => {
    if (!prevDataSetId || readOnly) return;
    putMarkerRecords();
  }, [prevDataSetId, readOnly]);

  return (
    <>
      <section className="min-h-[calc(100vh_-_13.5rem)]">
        <ConditionalInputGrid
          dataSet={activeDataSet}
          tableSchema={activeDataSetSchema}
          setDataSetsSchema={setDataSetsSchema}
          tableData={activeDataSetRecords}
          dispatchDataSetRecords={dispatchDataSetRecords}
          dispatchDataSetMarkerLink={dispatchDataSetMarkerLink}
          dataSourceId={dataSourceId}
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
        setPrevDataSetId={setPrevDataSetId}
        dataSets={dataSets}
      />
      <DataSourceFooter
        activeStep={activeStep}
        workflowSteps={dataSourceWorkflowSteps}
        handleSubmit={() => {
          if (readOnly) {
            setActiveStep((activeStep) => activeStep + 1);
          } else {
            // Call PUT API Here
            putMarkerRecords(false, undefined, undefined, undefined, true);
          }
        }}
        handlePrevious={() => setActiveStep((activeStep) => activeStep - 1)}
        handleDraft={putMarkerRecords}
        isLoading={loading}
        readOnly={readOnly}
      />
    </>
  );
}
