import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import useRequestUtilities from '../hooks/use-request-utilities';
import TestFamilyMapper from './test-family-mapper';
import { DataSourceDetail } from './models/data-source-detail';
import { DataSourcetWorkflowStep } from './models/data-source-workflow';
import DataSourceFooter from './data-source-footer';
import { LocalFileDetail } from './models/local-file-detail';
import { LocalModuleGroupDetail } from './models/local-module-detail';
import { useTranslation } from 'react-i18next';

export default function DataSourceMapping(props: {
  readOnly: boolean;
  dataSource: DataSourceDetail;
  setDataSource: Dispatch<SetStateAction<DataSourceDetail>>;
  dataSourceWorkflowSteps: DataSourcetWorkflowStep[];
  activeStep: number;
  setActiveStep: Dispatch<SetStateAction<number>>;
  dataSourceId: string;
}) {
  const {
    readOnly,
    dataSource,
    setDataSource,
    activeStep,
    dataSourceWorkflowSteps,
    setActiveStep,
    dataSourceId,
  } = props;
  type viewScreenType = 'loading' | 'error' | 'set';
  const [viewScreen, setViewScreen] = useState<viewScreenType>('loading');
  const { fetchWrapper, nextJsRouter: router } = useRequestUtilities();
  const [responseError, setResponseError] = useState('');
  const [modulesList, setModulesList] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);
  const [formErrors, setFormErrors] = useState<
    { id: string | number; error: string | boolean }[]
  >([]);
  const [dataSourceFiles, setDataSourceFiles] = useState<LocalFileDetail[]>([]);
  const [dataSourceModules, setDataSourceModules] = useState<
    LocalModuleGroupDetail[]
  >([]);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const getDataSource = useCallback(
    function (dataSourceId: string) {
      function initiate() {
        setViewScreen('loading');
      }
      async function handleResponse(response: Response) {
        const resJson = await response.json();
        if (response.ok) {
          setDataSource(resJson);
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
        initiate,
        handleResponse,
        handleError,
      });
    },
    [setDataSource, setViewScreen, setResponseError, fetchWrapper],
  );

  useEffect(() => {
    getModules();
  }, [router.locale]);

  const getModules = useCallback(
    function () {
      async function handleResponse(response: Response) {
        const resJson = await response.json();
        if (response.ok) {
          setModulesList(resJson?.module?.map((object) => object.Name));
        } else {
          if (response.status === 500) {
            setResponseError(t('error.something_went_wrong'));
          } else {
            setResponseError(
              resJson?.message || t('error.something_went_wrong'),
            );
          }
        }
      }
      function handleError(_error: any) {
        setResponseError(t('error.something_went_wrong'));
      }

      fetchWrapper({
        url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/picklist?type=instrument&type=module&language=${router.locale}`,
        includeAuthToken: true,
        handleResponse,
        handleError,
      });
    },
    [router.locale],
  );

  const uploadFile = useCallback(
    function (file: File, datasetId: string, localId: string) {
      const requestPayload = new FormData();
      requestPayload.append('file', file);

      function initiate() {
        setDataSourceFiles((dataSourceFiles) => [
          ...dataSourceFiles,
          {
            name: file.name,
            file,
            localId,
            isUploading: true,
            error: false,
            uploaded: false,
            toUpload: true,
          },
        ]);
      }
      async function handleResponse(response: Response) {
        const resJson = await response.json();
        if (response.ok) {
          setDataSourceFiles((dataSourceFiles) =>
            dataSourceFiles.map((fileItem) => {
              if (fileItem?.localId === localId) {
                return {
                  ...fileItem,
                  id: resJson?.id,
                  isUploading: false,
                  uploaded: true,
                  invalidACNCodes: resJson?.invalidACNCodes || [],
                };
              } else {
                return fileItem;
              }
            }),
          );
        } else {
          setDataSourceFiles((dataSourceFiles) =>
            dataSourceFiles.map((fileItem) => {
              if (fileItem?.localId === localId) {
                return {
                  ...fileItem,
                  error:
                    response.status === 400
                      ? resJson.message
                      : t('error.something_went_wrong'),
                  isUploading: false,
                  uploaded: false,
                };
              } else {
                return fileItem;
              }
            }),
          );
        }
      }
      function handleError(_error: any) {
        setDataSourceFiles((dataSourceFiles) =>
          dataSourceFiles.map((fileItem) => {
            if (fileItem?.localId === localId) {
              return {
                ...fileItem,
                error: t('error.something_went_wrong'),
                isUploading: false,
                uploaded: false,
              };
            } else {
              return fileItem;
            }
          }),
        );
      }

      fetchWrapper({
        url: `${process.env.NEXT_PUBLIC_API_BASE_URL_V1}/datasources/${dataSourceId}/test-data-files`,
        method: 'POST',
        body: requestPayload,
        includeAuthToken: true,
        initiate,
        handleResponse,
        handleError,
      });
    },
    [dataSourceId, setDataSourceFiles],
  );

  const deleteFile = useCallback(
    function (fileId: string) {
      function initiate() {
        setDataSourceFiles(
          (dataSourceFiles) =>
            dataSourceFiles?.map((fileItem) => {
              if (fileItem?.id === fileId) {
                return {
                  ...fileItem,
                  toDelete: true,
                  isDeleting: true,
                };
              } else {
                return fileItem;
              }
            }) || [],
        );
      }
      async function handleResponse(response: Response) {
        if (response.ok) {
          setDataSourceFiles(
            (dataSourceFiles) =>
              dataSourceFiles?.filter((fileItem) => fileItem?.id !== fileId) ||
              [],
          );
        } else {
          setDataSourceFiles(
            (dataSourceFiles) =>
              dataSourceFiles?.map((fileItem) => {
                if (fileItem?.id === fileId) {
                  return {
                    ...fileItem,
                    error: t('error.something_went_wrong'),
                    isDeleting: false,
                  };
                } else {
                  return fileItem;
                }
              }) || [],
          );
        }
      }
      function handleError(_error: any) {
        setDataSourceFiles(
          (dataSourceFiles) =>
            dataSourceFiles?.map((fileItem) => {
              if (fileItem?.id === fileId) {
                return {
                  ...fileItem,
                  error: t('error.something_went_wrong'),
                  isDeleting: false,
                };
              } else {
                return fileItem;
              }
            }) || [],
        );
      }

      fetchWrapper({
        url: `${process.env.NEXT_PUBLIC_API_BASE_URL_V1}/datasources/${dataSourceId}/test-data-file/${fileId}`,
        method: 'DELETE',
        includeAuthToken: true,
        initiate,
        handleResponse,
        handleError,
      });
    },
    [setDataSourceFiles, fetchWrapper, dataSourceId],
  );

  const updateDataSource = useCallback(
    (
      saveDraft = false,
      handleDraftSuccess?: () => void,
      handleDraftFailure?: () => void,
      initiateDraft?: () => void,
    ) => {
      let requestPayload = {
        dataSets:
          dataSource?.dataSets?.map((dataSet) => {
            return { id: dataSet?.id, testDataFileId: '', modules: [] };
          }) || [],
      };
      dataSource.dataSets?.forEach((dataset) => {
        const testDataFileId =
          dataSourceFiles
            ?.filter(
              (file) => !file?.error && file?.datasets?.includes(dataset?.id),
            )
            ?.at(-1)?.id || '';

        requestPayload = {
          dataSets: requestPayload?.dataSets?.map((payloadDataset) => {
            if (payloadDataset?.id === dataset?.id) {
              return {
                ...payloadDataset,
                testDataFileId,
              };
            } else {
              return payloadDataset;
            }
          }),
        };
      });
      dataSource.dataSets?.forEach((dataset) => {
        const modules =
          dataSourceModules
            ?.find((moduleGrp) => moduleGrp?.datasetId === dataset?.id)
            ?.modules?.filter(
              (moduleObj) => !!moduleObj?.name && !!moduleObj?.number,
            ) || [];

        requestPayload = {
          dataSets: requestPayload?.dataSets?.map((payloadDataset) => {
            if (payloadDataset?.id === dataset?.id) {
              return {
                ...payloadDataset,
                modules,
              };
            } else {
              return payloadDataset;
            }
          }),
        };
      });

      function initiate() {
        if (saveDraft) {
          initiateDraft();
        } else {
          setLoading(true);
        }
      }
      async function handleResponse(response: Response) {
        if (response.ok) {
          if (saveDraft && handleDraftSuccess) {
            handleDraftSuccess();
          } else {
            setActiveStep((activeStep) => activeStep + 1);
          }
        } else {
          if (saveDraft) {
            handleDraftFailure();
          } else {
            if (response.status === 500) {
              setResponseError(t('error.something_went_wrong'));
            } else {
              const resJson = await response.json();
              setResponseError(
                resJson?.message || t('error.something_went_wrong'),
              );
            }
          }
        }
      }
      function handleError(_error: any) {
        if (saveDraft) {
          handleDraftFailure();
        } else {
          setResponseError(t('error.something_went_wrong'));
        }
      }
      function handleFinally() {
        if (!saveDraft) {
          setLoading(false);
        }
      }

      fetchWrapper({
        method: 'PUT',
        url: `${process.env.NEXT_PUBLIC_API_BASE_URL_V1}/datasources/${dataSourceId}/datasets`,
        body: requestPayload.dataSets,
        includeAuthToken: true,
        initiate,
        handleResponse,
        handleError,
        handleFinally,
      });
    },
    [
      dataSourceId,
      dataSource,
      dataSourceFiles,
      dataSourceModules,
      fetchWrapper,
    ],
  );

  const isFileUploading = useMemo(
    () => dataSourceFiles?.some((fileItem) => fileItem?.isUploading),
    [dataSourceFiles],
  );

  useEffect(() => {
    if (!dataSource) return;

    // Sync dataSource object with local data
    // 1. Get All testDataFiles
    const testDataFiles: LocalFileDetail[] = dataSource?.testDataFiles?.map(
      (fileItem) => ({
        ...fileItem,
        error: false,
        isUploading: false,
        uploaded: true,
        datasets:
          dataSource?.dataSets
            ?.filter((dataset) => dataset?.testDataFileId === fileItem?.id)
            ?.map((dataset) => dataset?.id) || [],
      }),
    );
    setDataSourceFiles(testDataFiles);

    // 2. Get All module info from datasets
    let testDataModules: LocalModuleGroupDetail[] = dataSource?.dataSets?.map(
      (dataset) => ({
        datasetId: dataset.id,
        modules: Array(4).fill({ name: '', number: 0 }),
      }),
    );

    dataSource?.dataSets?.forEach((dataset) => {
      const modulesArray = Array(4).fill({ name: '', number: 0 });
      dataset.modules?.forEach((module, index) => {
        modulesArray[index] = {
          name: module?.name,
          number: Number(module?.number),
        };
      });
      testDataModules = testDataModules?.map((moduleGrp) => {
        if (moduleGrp.datasetId === dataset.id) {
          return {
            ...moduleGrp,
            modules: modulesArray,
          };
        } else {
          return moduleGrp;
        }
      });
    });
    setDataSourceModules(testDataModules);
    setViewScreen('set');
  }, [dataSource]);

  useEffect(() => {
    if (!dataSourceId) return;
    getDataSource(dataSourceId);
  }, [dataSourceId]);

  useEffect(() => {
    getModules();
  }, [router.locale]);

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
        {responseError}
      </div>
    );
  }

  return (
    <>
      <section className="p-6 flex flex-col gap-8 min-h-[calc(100vh_-_10.8rem)]">
        {responseError && <p className="text-red-500">{responseError}</p>}
        {dataSource?.dataSets?.map((dataset) => {
          return (
            <TestFamilyMapper
              key={`${dataset.id}-${dataset.name}-family`}
              modulesList={modulesList}
              readOnly={readOnly}
              setFormErrors={setFormErrors}
              dataset={dataset}
              dataSourceFiles={dataSourceFiles}
              setDataSourceFiles={setDataSourceFiles}
              datasetModules={dataSourceModules?.find(
                (moduleGrp) => moduleGrp.datasetId === dataset.id,
              )}
              setDataSourceModules={setDataSourceModules}
              uploadFile={uploadFile}
              deleteFile={deleteFile}
              touched={touched}
            />
          );
        })}
      </section>
      <DataSourceFooter
        activeStep={activeStep}
        workflowSteps={dataSourceWorkflowSteps}
        handleSubmit={() => {
          if (readOnly) {
            setActiveStep((activeStep) => activeStep + 1);
          } else {
            setTouched(true);
            if (formErrors.length || isFileUploading) return;
            updateDataSource();
          }
        }}
        handleDraft={updateDataSource}
        handlePrevious={() => setActiveStep((activeStep) => activeStep - 1)}
        isLoading={loading}
        readOnly={readOnly}
      />
    </>
  );
}
