import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { DataSourceDetail } from './models/data-source-detail';
import { DataSourcetWorkflowStep } from './models/data-source-workflow';
import DataSourceFooter from './data-source-footer';
import ReviewMarker from './review-marker';
import { localMarkerdetail } from './models/local-marker-review-detail';
import useRequestUtilities from '../hooks/use-request-utilities';
import { useTranslation } from 'react-i18next';
import DataSetSelector from './common/dataset-selector';

export default function ReviewMarkerMapping(props: {
  readOnly: boolean;
  dataSource: DataSourceDetail;
  setDataSource: Dispatch<SetStateAction<DataSourceDetail>>;
  dataSourceWorkflowSteps: DataSourcetWorkflowStep[];
  activeStep: number;
  setActiveStep: Dispatch<SetStateAction<number>>;
  dataSourceId: string;
}) {
  type viewScreenType = 'loading' | 'error' | 'set';
  const [viewScreen, setViewScreen] = useState<viewScreenType>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeDataSetId, setActiveDataSetId] = useState('');
  const [dataSourceReviewMarkerObj, setDataSourceReviewMarkerObj] = useState<
    localMarkerdetail[]
  >([]);
  const { fetchWrapper } = useRequestUtilities();
  const { t } = useTranslation();

  const getDataSets = useCallback(
    function (dataSourceId: string) {
      function initiate() {
        setViewScreen('loading');
      }
      async function handleResponse(response: Response) {
        const resJson = await response.json();
        if (response.ok) {
          props.setDataSource((dataSource) => ({
            ...dataSource,
            dataSets: resJson || dataSource?.dataSets || [],
          }));
        } else {
          if (response.status === 500) {
            setErrorMessage(t('error.something_went_wrong'));
          } else {
            setErrorMessage(t('error.something_went_wrong'));
          }
          setViewScreen('error');
        }
      }
      function handleError(_error: any) {
        setErrorMessage(t('error.something_went_wrong'));
        setViewScreen('error');
      }

      fetchWrapper({
        url: `${process.env.NEXT_PUBLIC_API_BASE_URL_V1}/datasources/${dataSourceId}/datasets`,
        includeAuthToken: true,
        initiate,
        handleResponse,
        handleError,
      });
    },
    [props.setDataSource, setViewScreen, setErrorMessage, fetchWrapper],
  );

  useEffect(() => {
    setViewScreen('loading');
    const doesRecordsExist = props.dataSource?.dataSets?.at(0)?.markerRecords;
    if (!doesRecordsExist) return;

    const reviewmarkerData = props.dataSource.dataSets.map((item) => {
      return {
        id: item.id,
        name: item.name,
        markerRecords: item?.markerRecords,
      };
    });

    setActiveDataSetId(reviewmarkerData?.at(0)?.id || '');
    setDataSourceReviewMarkerObj(reviewmarkerData);
    setViewScreen('set');
  }, [props.dataSource, setDataSourceReviewMarkerObj, setViewScreen]);

  useEffect(() => {
    if (!props.dataSourceId) return;
    getDataSets(props.dataSourceId);
  }, [props.dataSourceId]);

  const putMarkerRecords = useCallback(
    function (
      saveDraft = false,
      handleDraftSuccess?: () => void,
      handleDraftFailure?: () => void,
      initiateDraft?: () => void,
    ) {
      const dataSetsMarkers =
        dataSourceReviewMarkerObj?.map((item) => ({
          id: item?.id,
          markerRecords:
            item?.markerRecords?.map((markerRecordItem) => ({
              id: markerRecordItem?.id,
              selected: markerRecordItem?.selected,
            })) || [],
        })) || [];

      function initiate() {
        if (saveDraft) {
          initiateDraft();
        } else {
          setIsLoading(true);
        }
      }
      async function handleResponse(response: Response) {
        if (response.ok) {
          if (saveDraft && handleDraftSuccess) {
            handleDraftSuccess();
          } else {
            props.setActiveStep((activeStep) => activeStep + 1);
          }
        } else {
          if (saveDraft) {
            handleDraftFailure();
          } else {
            const resJson = await response.json();
            setErrorMessage(
              resJson?.message || t('error.something_went_wrong'),
            );
          }
        }
      }
      function handleError(_error: any) {
        if (saveDraft) {
          handleDraftFailure();
        } else {
          setErrorMessage(t('error.something_went_wrong'));
        }
      }
      function handleFinally() {
        if (!saveDraft) {
          setIsLoading(false);
        }
      }

      fetchWrapper({
        method: 'PUT',
        url: `${process.env.NEXT_PUBLIC_API_BASE_URL_V1}/datasources/${props.dataSourceId}/dataset-marker-records`,
        includeAuthToken: true,
        body: dataSetsMarkers,
        handleResponse,
        handleError,
        initiate,
        handleFinally,
      });
    },
    [
      dataSourceReviewMarkerObj,
      setIsLoading,
      props.setActiveStep,
      setErrorMessage,
      fetchWrapper,
    ],
  );

  const activeDataSetMarkers = useMemo(() => {
    const defaultReturn: localMarkerdetail = {
      id: '',
      name: '',
      markerRecords: [],
    };
    return (
      dataSourceReviewMarkerObj?.find(
        (dataSetObj) => dataSetObj?.id === activeDataSetId,
      ) || defaultReturn
    );
  }, [dataSourceReviewMarkerObj, activeDataSetId]);

  const unselectedDatasetMarkers = useMemo(
    () =>
      dataSourceReviewMarkerObj?.some(
        (datasetItem) =>
          datasetItem?.markerRecords?.filter((item) => item?.selected)
            ?.length === 0,
      ),
    [dataSourceReviewMarkerObj],
  );

  if (viewScreen === 'loading') {
    return (
      <div className="text-center text-3xl mt-20 text-gray-600 animate-pulse">
        Loading...
      </div>
    );
  }

  if (viewScreen === 'error') {
    return (
      <div className="text-center text-3xl mt-20 text-red-500">
        {errorMessage}
      </div>
    );
  }

  return (
    <>
      <section className="p-6 px-8 flex flex-col gap-8 min-h-[calc(100vh_-_13.5rem)]">
        {errorMessage && <p className="text-red-500">{errorMessage}</p>}
        <ReviewMarker
          item={activeDataSetMarkers}
          dataSourceReviewMarkerObj={dataSourceReviewMarkerObj}
          setDataSourceReviewMarkerObj={setDataSourceReviewMarkerObj}
          readOnly={props.readOnly}
        />
      </section>
      <DataSetSelector
        dataSets={props.dataSource?.dataSets || []}
        activeDataSetId={activeDataSetId}
        setActiveDataSetId={setActiveDataSetId}
      />
      <DataSourceFooter
        workflowSteps={props.dataSourceWorkflowSteps}
        handleSubmit={() => {
          if (props.readOnly) {
            props.setActiveStep((activeStep) => activeStep + 1);
          } else {
            if (unselectedDatasetMarkers) return;
            putMarkerRecords();
          }
        }}
        handleDraft={putMarkerRecords}
        handlePrevious={() =>
          props.setActiveStep((activeStep) => activeStep - 1)
        }
        isLoading={isLoading}
        activeStep={props.activeStep}
        readOnly={props.readOnly}
      />
    </>
  );
}
