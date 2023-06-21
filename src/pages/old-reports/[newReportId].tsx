import { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import UserLayout from '../../components/layouts/user-layout';
import { ReportWorkflowStep } from '../../components/reports/models/report-workflow-step';
import OutputSetting from '../../components/reports/output-setting';
import InputDataSelector from '../../components/reports/input-data-selector';
import { ReportDetail } from '../../components/reports/models/report-detail';
import ReportContainer from '../../components/reports/report-layout';
import ValidationTestList from '../../components/reports/validation-test-list';
import { NextPageWithLayout } from '../_app';
import ReportPdf from '../../components/reports/report-pdf-generation';
import ConditionalInput from '../../components/reports/conditional-input';
import DataInput from '../../components/reports/data-input';
import useRequestUtilities from '../../components/hooks/use-request-utilities';
import EditReportSkeleton from '../../components/loading/edit-report-skeleton';
import { useTranslation } from 'react-i18next';

const CreateReport: NextPageWithLayout = () => {
  const {
    fetchWrapper,
    nextJsRouter: router,
    logoutUser,
  } = useRequestUtilities();
  const reportId =
    typeof router?.query?.newReportId === 'string'
      ? router.query.newReportId
      : router.query?.newReportId?.at(0);

  type viewScreenType = 'loading' | 'set' | 'error';
  const [viewScreen, setViewScreen] = useState<viewScreenType>('loading');
  const [activeStep, setActiveStep] = useState(0);
  const { t } = useTranslation();
  const reportWorkflowSteps = useMemo<ReportWorkflowStep[]>(() => {
    const rawSteps: ReportWorkflowStep[] = [
      {
        stepNo: 1,
        name: `${t('report_edit.validation_test')}`,
        workflowState: 'ValidationTestSelected',
        isFinished: false,
        active: false,
      },
      {
        stepNo: 2,
        name: `${t('report_edit.import_data')}`,
        workflowState: 'IntrumentDataSelected',
        isFinished: false,
        active: false,
      },
      {
        stepNo: 3,
        name: `${t('report_edit.conditional_input')}`,
        workflowState: 'ConditionalInputAdded',
        isFinished: false,
        active: false,
      },
      {
        stepNo: 4,
        name: `${t('report_edit.data_input')}`,
        workflowState: 'DataInputAdded',
        isFinished: false,
        active: false,
      },
      {
        stepNo: 5,
        name: `${t('report_edit.output_setting')}`,
        workflowState: 'OutputSettingAdded',
        isFinished: false,
        active: false,
      },
      {
        stepNo: 6,
        name: `${t('report_edit.report_preview')}`,
        workflowState: 'ReportGenerated',
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
  }, [activeStep]);
  const [report, setReport] = useState<ReportDetail>();
  const [responseError, setResponseError] = useState('');

  const fetchReport = useCallback(function (reportId: string) {
    async function handleResponse(response: Response) {
      const resJson = await response.json();
      if (response.ok) {
        setReport(resJson);
        const reportWorkflowStatus: ReportWorkflowStep['workflowState'] =
          resJson?.workflowStatus;

        const activeStepIndex =
          reportWorkflowSteps.findIndex(
            (step) => step.workflowState === reportWorkflowStatus,
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
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/${reportId}`,
      includeAuthToken: true,
      handleResponse,
      handleError,
    });
  }, []);

  useEffect(() => {
    if (!reportId) return;

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
      fetchReport(reportId);
    }
  }, [reportId]);

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
      <ReportContainer reportWorkflowSteps={reportWorkflowSteps}>
        {activeStep === 0 && (
          <ValidationTestList
            reportWorkflowSteps={reportWorkflowSteps}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            reportId={reportId}
            report={report}
            setReport={setReport}
          />
        )}
        {activeStep === 1 && (
          <InputDataSelector
            reportId={reportId}
            reportWorkflowSteps={reportWorkflowSteps}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            report={report}
            setReport={setReport}
          />
        )}
        {activeStep === 2 && (
          <ConditionalInput
            reportId={reportId}
            reportWorkflowSteps={reportWorkflowSteps}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            report={report}
            setReport={setReport}
          />
        )}
        {activeStep === 3 && (
          <DataInput
            reportId={reportId}
            reportWorkflowSteps={reportWorkflowSteps}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            report={report}
            setReport={setReport}
          />
        )}
        {activeStep === 4 && (
          <OutputSetting
            reportWorkflowSteps={reportWorkflowSteps}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            reportId={reportId}
            report={report}
            setReport={setReport}
          />
        )}
        {activeStep === 5 && (
          <ReportPdf
            reportWorkflowSteps={reportWorkflowSteps}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            reportId={reportId}
          />
        )}
      </ReportContainer>
    </>
  );
};
CreateReport.getLayout = function getLayout(page: ReactElement) {
  return <UserLayout>{page}</UserLayout>;
};

export default CreateReport;
