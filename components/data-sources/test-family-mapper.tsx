import Image from 'next/image';
import React, { useState, useMemo, Dispatch, SetStateAction, useEffect } from 'react';
import downArrow from '../../public/icons/accordian-down-arrow.svg';
import ModuleGroup from './module-group';
import ManualInput from './manual-input';
import CsvInput from './csv-input';
import { ManualInputModel } from './models/manual-input-model';
import { DatasetDetail } from './models/data-source-detail';
import { LocalFileDetail } from './models/local-file-detail';
import { LocalModuleGroupDetail } from './models/local-module-detail';
import { useTranslation } from 'react-i18next';

export default function TestFamilyMapper(props: {
  modulesList: string[];
  readOnly: boolean;
  setFormErrors: Dispatch<
    SetStateAction<
      {
        id: string | number;
        error: string | boolean;
      }[]
    >
  >;
  dataset: DatasetDetail;
  dataSourceFiles: LocalFileDetail[];
  setDataSourceFiles: Dispatch<SetStateAction<LocalFileDetail[]>>;
  datasetModules: LocalModuleGroupDetail;
  setDataSourceModules: Dispatch<SetStateAction<LocalModuleGroupDetail[]>>;
  uploadFile: (file: File, datasetId: string, localId: string) => void;
  deleteFile: (fileId: string) => void;
  touched: boolean;
}) {
  const {
    modulesList,
    readOnly,
    setFormErrors,
    dataset,
    dataSourceFiles,
    setDataSourceFiles,
    datasetModules,
    setDataSourceModules,
    uploadFile,
    deleteFile,
    touched,
  } = props;
  const [isExpanded, setIsExpanded] = useState(true);
  const [isInputMethodCSV, setIsInputMethodCSV] = useState(true);
  const [includesISEMarker, setIncludesISEMarker] = useState(false);
  const [manualInput, setManualInput] = useState<ManualInputModel[]>([
    {
      id: 1,
      category: '',
      markerLabel: '',
      unitOfMarker: '',
      acn: '',
      touched: false,
    },
  ]);

  const { t } = useTranslation();

  const maxNumber = useMemo(() => 4, []);
  const selectedModulesNumber = useMemo(
    () =>
      datasetModules?.modules
        ?.map((moduleInfo) => Number(moduleInfo?.number || 0))
        ?.reduce((a, b) => a + b, 0) || 0,
    [datasetModules],
  );
  const availableNumber = useMemo(
    () => maxNumber - selectedModulesNumber,
    [selectedModulesNumber, maxNumber],
  );

  useEffect(() => {
    const id = dataset.id + '_moduleNumberExceeded';
    if (availableNumber === 4 || availableNumber < 0) {
      setFormErrors((formErrors) =>
        formErrors?.find((error) => error?.id === id)
          ? formErrors
          : [
              ...formErrors,
              {
                id,
                error: true,
              },
            ],
      );
    } else {
      setFormErrors((formErrors) => {
        return formErrors.filter((errorObj) => errorObj.id !== id);
      });
    }
  }, [availableNumber, dataset.id, setFormErrors]);

  return (
    <div className="rounded-lg overflow-hidden bg-gray-50 flex flex-col items-center shadow-md">
      <span
        className="w-full px-10 py-2 flex items-center justify-between bg-light-blue-50 border-b border-light-blue-100 font-medium text-xl text-gray-800 cursor-pointer"
        onClick={() => setIsExpanded((isExpanded) => !isExpanded)}
      >
        {dataset.name}
        <span className="flex justify-center items-center rounded w-10 h-10">
          <Image
            src={downArrow}
            alt="Toggle accordian icon"
            className={`${
              isExpanded ? '-rotate-180' : ''
            } transition-transform`}
          />
        </span>
      </span>
      {isExpanded && (
        <div className="self-stretch px-6 py-4 space-y-4">
          <div className="px-4 py-2 bg-white rounded space-y-6">
            <p className="text-lg leading-[24px] font-medium text-gray-800">
              {t('data_source_mapping.data_source')}
            </p>
            <div className="flex justify-start items-center gap-6 leading-[22px] font-medium text-gray-600">
              <label
                htmlFor={`${dataset.id}-input-source-csv`}
                className={`flex justify-start items-center gap-[10px] rounded cursor-pointer ${
                  isInputMethodCSV ? 'text-light-blue-600' : ''
                }`}
              >
                <input
                  type="radio"
                  id={`${dataset.id}-input-source-csv`}
                  name={`${dataset.id}-input-source-method`}
                  className="w-5 h-5"
                  checked={isInputMethodCSV}
                  onChange={(e) => setIsInputMethodCSV(e.target.checked)}
                  readOnly={readOnly}
                  disabled={readOnly}
                />
                {t('data_source_mapping.csv_file')}
              </label>

              <label
                htmlFor={`${dataset.id}-input-source-manual`}
                // className={`flex justify-start items-center gap-[10px] rounded cursor-pointer ${
                // Temporarily disabled
                className={`flex justify-start items-center gap-[10px] rounded ${
                  !isInputMethodCSV ? 'text-light-blue-600' : ''
                }`}
              >
                <input
                  type="radio"
                  id={`${dataset.id}-input-source-manual`}
                  name={`${dataset.id}-input-source-method`}
                  className="w-5 h-5"
                  checked={!isInputMethodCSV}
                  readOnly={readOnly}
                  onChange={(e) => setIsInputMethodCSV(!e.target.checked)}
                  disabled={true}
                />
                {t('data_source_mapping.enter_manually')}
              </label>
            </div>
            {isInputMethodCSV ? (
              <CsvInput
                readOnly={readOnly}
                includesISEMarker={includesISEMarker}
                setIncludesISEMarker={setIncludesISEMarker}
                dataSourceFiles={dataSourceFiles}
                setDataSourceFiles={setDataSourceFiles}
                setFormErrors={setFormErrors}
                datasetId={dataset.id}
                uploadFile={uploadFile}
                deleteFile={deleteFile}
                touched={touched}
              />
            ) : (
              <ManualInput
                manualInput={manualInput}
                setManualInput={setManualInput}
                readOnly={readOnly}
              />
            )}
          </div>
          <div className="px-4 py-2 bg-white rounded space-y-6">
            <div className="flex justify-between gap-6">
              {[1, 2].map((num) => (
                <ModuleGroup
                  key={dataset.id + '-module-grp-' + num}
                  modulesList={modulesList}
                  num={num}
                  datasetModules={datasetModules}
                  setDataSourceModules={setDataSourceModules}
                  availableNumber={availableNumber}
                  readOnly={readOnly}
                  setFormErrors={setFormErrors}
                  datasetId={dataset.id}
                  touched={touched}
                />
              ))}
            </div>
            <div className="flex justify-between gap-6">
              {[3, 4].map((num) => (
                <ModuleGroup
                  key={dataset.id + '-module-grp-' + num}
                  modulesList={modulesList}
                  num={num}
                  datasetModules={datasetModules}
                  setDataSourceModules={setDataSourceModules}
                  availableNumber={availableNumber}
                  readOnly={readOnly}
                  setFormErrors={setFormErrors}
                  datasetId={dataset.id}
                  touched={touched}
                />
              ))}
            </div>
            {availableNumber < 0 && (
              <p className="text-red-500">
                Total number of modules should not exceed 4
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
