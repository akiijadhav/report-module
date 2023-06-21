import React, { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import UserLayout from '../../../components/layouts/user-layout';
import { ReportWorkflowStep } from '../../../components/new-reports/models/new-report-workflow-step';
import ReportContainer from '../../../components/new-reports/report-layout';
import { NextPageWithLayout } from '../../_app';
import useRequestUtilities from '../../../components/hooks/use-request-utilities';
import EditReportSkeleton from '../../../components/loading/edit-report-skeleton';
import { useTranslation } from 'react-i18next';
import { ReportDetail } from '../../../components/new-reports/models/report-details';
import ReportConfiguration from '../../../components/new-reports/report-configuration';
import ValidationTestList from '../../../components/new-reports/validation-test-list';
import MarkerSelection from '../../../components/new-reports/markers-selection';
import EditDataSourceGraph from '../../../components/new-reports/edit-data-source-graph';
import ReportPdf from '../../../components/new-reports/new-report-pdf-generation';
// import { Button, Header, Page } from '@akiijadhav/rdkk-component-library';
// import '@akiijadhav/rdkk-component-library/dist/styles.min.css';

const CreateReport: NextPageWithLayout = () => {
  const { fetchWrapper, nextJsRouter: router } = useRequestUtilities();
  const newDataSourceId =
    typeof router?.query?.newDataSourcedId === 'string'
      ? router.query.newDataSourcedId
      : router.query?.newDataSourcedId?.at(0);

  type viewScreenType = 'loading' | 'set' | 'error';
  const [viewScreen, setViewScreen] = useState<viewScreenType>('set');
  const [activeStep, setActiveStep] = useState(0);
  const [isReportCreated, setIsReportCreated] = useState(false);
  const [accuracyMarkers, setAccuracyMarkers] = useState<string[]>([]);
  const { t } = useTranslation();
  const reportWorkflowSteps = useMemo<ReportWorkflowStep[]>(() => {
    const rawSteps: ReportWorkflowStep[] = [
      {
        stepNo: 1,
        name: `${t('report_step_workflow.report_configuration')}`,
        workflowState: 'ReportConfigurationAdded',
        isFinished: false,
        active: false,
      },
      {
        stepNo: 2,
        name: `${t('report_step_workflow.validation_test')}`,
        workflowState: 'ValidationTestSelected',
        isFinished: false,
        active: false,
      },
      {
        stepNo: 3,
        name: `${t('report_step_workflow.marker_selection')}`,
        workflowState: 'MarkerSelected',
        isFinished: false,
        active: false,
      },
      {
        stepNo: 4,
        name: `${t('report_step_workflow.graph')}`,
        workflowState: 'DataSourceForGraphAdded',
        isFinished: false,
        active: false,
      },

      {
        stepNo: 5,
        name: `${t('report_step_workflow.preview_report')}`,
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
  }, [activeStep, t]);
  const [report, setReport] = useState<ReportDetail>();

  return (
    <>
      <ReportContainer reportWorkflowSteps={reportWorkflowSteps}>
        {activeStep === 0 && (
          <ReportConfiguration
            reportWorkflowSteps={reportWorkflowSteps}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            reportId={newDataSourceId}
            report={report}
            setReport={setReport}
          />
        )}
        {activeStep === 1 && (
          <ValidationTestList
            reportWorkflowSteps={reportWorkflowSteps}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            reportId={newDataSourceId}
            report={report}
            setReport={setReport}
            isReportCreated={isReportCreated}
            setIsReportCreated={setIsReportCreated}
          />
        )}
        {activeStep === 2 && (
          <MarkerSelection
            reportWorkflowSteps={reportWorkflowSteps}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            reportId={newDataSourceId}
            report={report}
            setReport={setReport}
            setAccuracyMarkers={setAccuracyMarkers}
          />
        )}
        {activeStep === 3 && (
          <EditDataSourceGraph
            reportWorkflowSteps={reportWorkflowSteps}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            reportId={newDataSourceId}
            report={report}
            setReport={setReport}
            accuracyMarkers={accuracyMarkers}
          />
        )}

        {activeStep === 4 && (
          <ReportPdf
            reportWorkflowSteps={reportWorkflowSteps}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            reportId={newDataSourceId}
            report={report}
            setReport={setReport}
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
