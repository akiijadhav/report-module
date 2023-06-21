import React, { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import UserLayout from '../../../components/layouts/user-layout';
import DataSourceContainer from '../../../components/data-sources/data-source-layout';
import ValidationTestList from '../../../components/data-sources/validation-test-list';
import { NextPageWithLayout } from '../../_app';
import useRequestUtilities from '../../../components/hooks/use-request-utilities';
import EditReportSkeleton from '../../../components/loading/edit-report-skeleton';
import { useTranslation } from 'react-i18next';
import { DataSourcetWorkflowStep } from '../../../components/data-sources/models/data-source-workflow';
import { DataSourceDetail } from '../../../components/data-sources/models/data-source-detail';
import ReviewMarkerMapping from '../../../components/data-sources/data-source-review-marker-mapping';
import DataSourceMapping from '../../../components/data-sources/data-source-mapping';
import DSConditionalInput from '../../../components/data-sources/ds-conditional-input';
import DSDataInput from '../../../components/data-sources/ds-data-input';

const EditDataSourcePage: NextPageWithLayout = () => {
  const {
    fetchWrapper,
    nextJsRouter: router,
    logoutUser,
  } = useRequestUtilities();
  const DataSourceId =
    typeof router?.query?.newDataSourceId === 'string'
      ? router.query.newDataSourceId
      : router.query?.newDataSourceId?.at(0);

  type viewScreenType = 'loading' | 'set' | 'error';
  const [viewScreen, setViewScreen] = useState<viewScreenType>('loading');
  const [activeStep, setActiveStep] = useState(0);
  const { t } = useTranslation();
  const dataSourceWorkflowSteps = useMemo<DataSourcetWorkflowStep[]>(() => {
    const rawSteps: DataSourcetWorkflowStep[] = [
      {
        stepNo: 1,
        name: `${t('data_source_workflow.selected_validation_test')}`,
        workflowState: 'ValidationTestSelection',
        isFinished: false,
        active: false,
      },
      {
        stepNo: 2,
        name: `${t('data_source_workflow.data_source_mapping')}`,
        workflowState: 'DataSourceMappping',
        isFinished: false,
        active: false,
      },
      {
        stepNo: 3,
        name: `${t('data_source_workflow.review_markers')}`,
        workflowState: 'ReviewMarkers',
        isFinished: false,
        active: false,
      },
      {
        stepNo: 4,
        name: `${t('data_source_workflow.conditional_input')}`,
        workflowState: 'ConditionalInput',
        isFinished: false,
        active: false,
      },
      {
        stepNo: 5,
        name: `${t('data_source_workflow.data_input')}`,
        workflowState: 'DataInput',
        isFinished: false,
        active: false,
      },
    ];

    return rawSteps.map((step, index) => {
      if (index < activeStep) {
        return {
          ...step,
          isFinished: true,
          active: false,
        };
      } else if (index > activeStep) {
        return {
          ...step,
          isFinished: false,
          active: false,
        };
      } else {
        return {
          ...step,
          active: true,
        };
      }
    });
  }, [activeStep, t]);

  const [dataSource, setDataSource] = useState<DataSourceDetail>();
  const [responseError, setResponseError] = useState('');

  const fetchDataSource = useCallback(function (dataSourceId: string) {
    async function handleResponse(response: Response) {
      const resJson = await response.json();
      if (response.ok) {
        setDataSource(resJson);
        const dataSourceWorkflowStatus: DataSourcetWorkflowStep['workflowState'] =
          resJson?.workflowStatus;

        const activeStepIndex =
          dataSourceWorkflowSteps.findIndex(
            (step) => step.workflowState === dataSourceWorkflowStatus,
          ) + 1;
        setActiveStep(activeStepIndex);
        setViewScreen('set');
      } else {
        if (response.status === 500) {
          setResponseError(t('error.something_went_wrong'));
        } else {
          setResponseError(
            resJson?.message ||
              `Error ${response.status}: ${response.statusText}`,
          );
        }
        setViewScreen('error');
      }
    }
    function handleError(_error: any) {
      setResponseError(t('error.something_went_wrong'));
      setViewScreen('error');
    }

    fetchWrapper({
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL_V1}/datasources/${dataSourceId}`,
      includeAuthToken: true,
      handleResponse,
      handleError,
    });
  }, []);

  useEffect(() => {
    if (!DataSourceId) return;

    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    if (!accessToken || !refreshToken) {
      logoutUser();
      return;
    } else {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (userInfo?.role !== 'LabEngineer') {
        router.replace('/users');
        return;
      }
      fetchDataSource(DataSourceId);
    }
  }, [DataSourceId]);

  if (viewScreen === 'loading') {
    return <EditReportSkeleton />;
  }
  if (viewScreen === 'error') {
    return (
      <div className="text-center w-[700px] mx-auto pt-16">
        <h1 className="font-medium text-2xl leading-6 text-gray-800 mb-4">
          {responseError}
        </h1>
      </div>
    );
  }

  return (
    <>
      <DataSourceContainer workflowSteps={dataSourceWorkflowSteps}>
        {activeStep === 0 && (
          <ValidationTestList
            dataSourceWorkflowSteps={dataSourceWorkflowSteps}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            DataSourceId={DataSourceId}
            dataSource={dataSource}
            setDataSource={setDataSource}
            readOnly={false}
          />
        )}
        {activeStep === 1 && (
          <DataSourceMapping
            readOnly={false}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            dataSourceId={DataSourceId}
            dataSource={dataSource}
            setDataSource={setDataSource}
            dataSourceWorkflowSteps={dataSourceWorkflowSteps}
          />
        )}
        {activeStep === 2 && (
          <ReviewMarkerMapping
            dataSourceWorkflowSteps={dataSourceWorkflowSteps}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            dataSourceId={DataSourceId}
            dataSource={dataSource}
            setDataSource={setDataSource}
            readOnly={false}
          />
        )}
        {activeStep === 3 && (
          <DSConditionalInput
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            dataSets={dataSource?.dataSets}
            dataSourceId={DataSourceId}
            dataSourceWorkflowSteps={dataSourceWorkflowSteps}
            readOnly={false}
          />
        )}
        {activeStep === 4 && (
          <DSDataInput
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            dataSets={dataSource?.dataSets}
            dataSourceId={DataSourceId}
            dataSourceWorkflowSteps={dataSourceWorkflowSteps}
            readOnly={false}
          />
        )}
      </DataSourceContainer>
    </>
  );
};
EditDataSourcePage.getLayout = function getLayout(page: ReactElement) {
  return <UserLayout>{page}</UserLayout>;
};

export default EditDataSourcePage;
