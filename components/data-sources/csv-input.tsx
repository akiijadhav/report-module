import { Listbox } from '@headlessui/react';
import Image from 'next/image';
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import computerIcon from '../../public/icons/computer-line.svg';
import warningIcon from '../../public/icons/warning-icon.svg';
import displayFileIcon from '../../public/icons/selected-file-icon.svg';
import loaderIcon from '../../public/icons/loader-gray.svg';
import deleteFileIcon from '../../public/icons/delete-report.svg';
import blueCheckmarkIcon from '../../public/icons/blue-checkmark.svg';
import downArrow from '../../public/icons/accordian-down-arrow.svg';
import leftArrow from '../../public/icons/left-arrow.svg';
import { LocalFileDetail } from './models/local-file-detail';
import DeleteFileModal from './delete-file-modal';
import { useTranslation } from 'react-i18next';
// import RocTooltip from '../ui/tooltip';

export default function CsvInput(props: {
  readOnly: boolean;
  includesISEMarker: boolean;
  setIncludesISEMarker: Dispatch<SetStateAction<boolean>>;
  setFormErrors: Dispatch<
    SetStateAction<
      {
        id: string | number;
        error: string | boolean;
      }[]
    >
  >;
  dataSourceFiles: LocalFileDetail[];
  setDataSourceFiles: Dispatch<SetStateAction<LocalFileDetail[]>>;
  datasetId: string;
  uploadFile: (file: File, datasetId: string, localId: string) => void;
  deleteFile: (fileId: string) => void;
  touched: boolean;
}) {
  const {
    readOnly,
    setFormErrors,
    dataSourceFiles,
    setDataSourceFiles,
    datasetId,
    uploadFile,
    deleteFile,
    touched,
  } = props;

  const [showDeleteFileModal, setShowDeleteFileModal] = useState(false);
  const [operatingFileID, setOperatingFileID] = useState('');
  const [showInvalidMarkers, setShowInvalidMarkers] = useState(false);
  const { t } = useTranslation();
  const datasetFiles = useMemo(
    () =>
      dataSourceFiles?.filter((fileItem) =>
        fileItem.datasets?.includes(datasetId),
      ),
    [dataSourceFiles, datasetId],
  );

  const validDatasetFile = useMemo(
    () =>
      datasetFiles?.length > 0
        ? datasetFiles?.find((fileItem) => !fileItem?.error) || null
        : null,
    [datasetFiles],
  );

  const invalidDatasetFile = useMemo(
    () =>
      datasetFiles?.length > 0
        ? datasetFiles?.find(
            (fileItem) => !!fileItem?.error && !fileItem?.toDelete,
          ) || null
        : null,
    [datasetFiles],
  );

  const uploadingFiles = useMemo(
    () => dataSourceFiles?.filter((fileItem) => fileItem?.isUploading) || [],
    [dataSourceFiles],
  );

  const failedUploadFile = useMemo(
    () =>
      dataSourceFiles?.find(
        (fileItem) =>
          !!fileItem?.error &&
          fileItem?.toUpload &&
          !fileItem?.isUploading &&
          !fileItem?.uploaded,
      ),
    [dataSourceFiles],
  );

  const operatingFile = useMemo(
    () => dataSourceFiles?.find((fileItem) => fileItem?.id === operatingFileID),
    [dataSourceFiles, operatingFileID],
  );

  useEffect(() => {
    const id = datasetId + '_csvFileError';
    if (validDatasetFile) {
      setFormErrors((prevErrors) =>
        prevErrors.filter((errorObj) => errorObj.id !== id),
      );
    } else {
      setFormErrors((prevErrors) =>
        prevErrors?.find((error) => error?.id === id)
          ? prevErrors
          : [
              ...prevErrors,
              {
                id,
                error: true,
              },
            ],
      );
    }
  }, [validDatasetFile, datasetId, setFormErrors]);

  return (
    <>
      <div className="csv-select-wrapper flex items-center gap-6 flex-wrap">
        <Listbox
          name="select-csv-file"
          value={validDatasetFile}
          disabled={readOnly}
          onChange={(e: LocalFileDetail) => {
            setDataSourceFiles((dataSourceFiles) => {
              const localArray = [
                ...dataSourceFiles.filter((fileObj) => !fileObj.error),
              ];
              return localArray.map((fileItem) => {
                if (e.id === fileItem.id) {
                  return {
                    ...fileItem,
                    datasets: [...(fileItem?.datasets || []), datasetId],
                  };
                } else {
                  return {
                    ...fileItem,
                    datasets:
                      fileItem?.datasets?.filter(
                        (dataset) => dataset !== datasetId,
                      ) || [],
                  };
                }
              });
            });
          }}
        >
          {({ open }) => {
            return (
              <div>
                <Listbox.Button
                  className={`px-4 py-3 min-w-[20rem] max-w-max rounded border ${
                    open ? 'border-light-blue-600' : 'border-gray-300'
                  } flex items-center justify-between gap-2 font-normal text-base text-gray-600`}
                >
                  <span
                    className={!!validDatasetFile?.name ? 'text-gray-800' : ''}
                  >
                    {validDatasetFile?.name ||
                      t('data_source_mapping.select_csv')}
                  </span>
                  <Image src={downArrow} alt="Dropdown icon" />
                </Listbox.Button>
                <Listbox.Options className="absolute min-w-[20rem] max-w-[28rem] z-20 mt-1 py-2 rounded bg-white border border-gray-100 shadow-md flex flex-col leading-[22px] font-normal text-gray-600">
                  <span className="p-[10px] pl-4 font-medium text-gray-800">
                    {t('data_source_mapping.attach')}
                  </span>
                  <div className="max-h-36 overflow-y-auto">
                    {dataSourceFiles
                      ?.filter((fileItem) => !!fileItem.id)
                      ?.map((fileItem, index) => (
                        <Listbox.Option
                          key={`${fileItem.id || fileItem.name}_file${index}`}
                          value={fileItem}
                          className="text-gray-600 cursor-pointer"
                        >
                          {({ selected, active }) => (
                            <span
                              className={`px-4 py-3 flex items-center justify-between ${
                                active || selected ? 'bg-light-blue-50' : ''
                              }`}
                            >
                              <span className="flex items-center gap-2 break-all">
                                <Image src={displayFileIcon} alt="" />
                                {fileItem.name}
                              </span>
                              <span className="flex items-center gap-2">
                                {selected && (
                                  <Image
                                    src={blueCheckmarkIcon}
                                    alt="This file is selected"
                                  />
                                )}
                                <div
                                  className={`actions-icon-wrapper group`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setOperatingFileID(fileItem?.id || '');
                                    setShowDeleteFileModal(true);
                                  }}
                                >
                                  <Image
                                    src={deleteFileIcon}
                                    width={24}
                                    height={24}
                                    className="brightness-150"
                                    alt="Delete file icon"
                                  />
                                  {/* <RocTooltip bottom="100%">
                                    {t('data_sources.remove_file')}
                                  </RocTooltip> */}
                                </div>
                              </span>
                            </span>
                          )}
                        </Listbox.Option>
                      ))}

                    {uploadingFiles?.map((fileItem, index) => (
                      <span
                        key={`${fileItem.name}_uploading-file${index}`}
                        className="px-4 py-3 flex items-center justify-between text-gray-600"
                      >
                        <span className="flex items-center gap-2 break-all">
                          <Image src={displayFileIcon} alt="" />
                          {fileItem.name}
                        </span>
                        <span className="w-8 h-8 flex items-center justify-center">
                          <Image
                            src={loaderIcon}
                            width={24}
                            height={24}
                            className="animate-spin"
                            alt="Uploading file"
                          />
                        </span>
                      </span>
                    ))}
                  </div>
                  <label
                    htmlFor="fileCsv"
                    className="py-3 px-4 max-w-max flex items-center gap-2 text-light-blue-600 cursor-pointer"
                  >
                    <Image src={computerIcon} alt="" />
                    {t('data_source_mapping.upload_from_computer')}
                    <input
                      type="file"
                      id="fileCsv"
                      name="fileCsv"
                      onChange={(event) => {
                        if (event.target.files[0]) {
                          const file = event.target.files[0];
                          const fileLocalId = crypto.randomUUID();
                          if (file.type === 'text/csv') {
                            uploadFile(file, datasetId, fileLocalId);
                          } else {
                            setDataSourceFiles((dataSourceFiles) => [
                              ...dataSourceFiles,
                              {
                                error: t(
                                  'data_source_mapping.file_format_not_supported',
                                ),
                                isUploading: false,
                                name: file.name,
                                uploaded: false,
                                datasets: [datasetId],
                                file,
                                localId: fileLocalId,
                              },
                            ]);
                          }
                        }
                      }}
                      hidden
                    />
                  </label>
                </Listbox.Options>
              </div>
            );
          }}
        </Listbox>

        {!!validDatasetFile?.invalidACNCodes?.length && (
          <span className="flex gap-2 text-sm">
            <Image src={warningIcon} alt="Error" />
            {t('data_source_mapping.file_has_invalid_acn')}
          </span>
        )}
      </div>

      {!!invalidDatasetFile && (
        <div className="pl-2 flex justify-start items-center gap-2 font-normal text-xs text-red-600">
          <Image src={warningIcon} alt="Error" />
          {invalidDatasetFile?.error}
        </div>
      )}

      {!!failedUploadFile && (
        <p className="text-red-500 pl-1">
          {failedUploadFile?.error || t('error.something_went_wrong')}
        </p>
      )}

      {touched && !validDatasetFile && (
        <p className="text-red-500 pl-1">
          {t('data_source_mapping.no_file_selected')}
        </p>
      )}

      {!!validDatasetFile?.invalidACNCodes?.length && (
        <div className="space-y-2">
          <span
            onClick={() =>
              setShowInvalidMarkers((showInvalidMarkers) => !showInvalidMarkers)
            }
            className="max-w-max flex gap-2 text-gray-600 cursor-pointer group"
          >
            <span className="group-hover:bg-light-blue-50">
              <Image
                src={leftArrow}
                className={`rounded-sm transition-transform ${
                  showInvalidMarkers ? '-rotate-90' : '-rotate-180'
                }`}
                alt="Toggle display invalid markers"
              />
            </span>
            {t('data_source_mapping.invalid_markers')}
          </span>
          {showInvalidMarkers && (
            <span className="max-w-max flex flex-col items-start rounded-sm max-h-32 overflow-y-auto text-gray-800 border border-gray-300">
              {validDatasetFile?.invalidACNCodes?.map((acnCode) => {
                return (
                  <span
                    key={acnCode + '-unavailable'}
                    className="px-2 py-1 border-b border-gray-200"
                  >
                    {acnCode}
                  </span>
                );
              })}
            </span>
          )}
        </div>
      )}

      {/* <label
        htmlFor="includes-ise-marker"
        className="max-w-max pl-1 flex justify-start items-center gap-2 cursor-pointer font-normal leading-[22px]"
      >
        <input
          type="checkbox"
          name="includes-ise-marker"
          id="includes-ise-marker"
          checked={includesISEMarker}
          className="w-[18px] h-[18px] border border-gray-300"
          readOnly={readOnly}
          disabled={readOnly}
          onChange={(e) => setIncludesISEMarker(e.target.checked)}
        />
        This includes ISE Marker
      </label> */}

      {showDeleteFileModal && !!operatingFile?.id && (
        <DeleteFileModal
          show={showDeleteFileModal}
          setShow={setShowDeleteFileModal}
          file={operatingFile}
          deleteFile={deleteFile}
        />
      )}
    </>
  );
}
