import { Listbox } from '@headlessui/react';
import Image from 'next/image';
import React, { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import downArrow from '../../public/icons/accordian-down-arrow.svg';
import { LocalModuleGroupDetail } from './models/local-module-detail';
import { useTranslation } from 'react-i18next';

export default function ModuleGroup(props: {
  num: number;
  datasetModules: LocalModuleGroupDetail;
  setDataSourceModules: Dispatch<SetStateAction<LocalModuleGroupDetail[]>>;
  modulesList: string[];
  availableNumber: number;
  readOnly: boolean;
  setFormErrors: Dispatch<
    SetStateAction<
      {
        id: string | number;
        error: string | boolean;
      }[]
    >
  >;
  datasetId: string;
  touched: boolean;
}) {
  const {
    num,
    datasetModules,
    setDataSourceModules,
    modulesList,
    availableNumber,
    readOnly,
    setFormErrors,
    datasetId,
    touched,
  } = props;

  const [isModuleNameUnselected, setIsModuleNameUnselected] = useState(false);
  const { t } = useTranslation();

  const moduleName = useMemo(
    () => datasetModules?.modules?.at(num - 1)?.name,
    [datasetModules, num],
  );
  const moduleNumber = useMemo(
    () => datasetModules?.modules?.at(num - 1)?.number,
    [datasetModules, num],
  );

  const module1NameUnselected = useMemo(
    () => num === 1 && !moduleName,
    [num, moduleName],
  );
  const module1NumberUnselected = useMemo(
    () => num === 1 && !moduleNumber,
    [num, moduleNumber],
  );

  useEffect(() => {
    const id = `${datasetId}-module-${num}-name-missing`;
    if (!!moduleNumber && !moduleName) {
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
      setFormErrors((formErrors) =>
        formErrors.filter((error) => error.id !== id),
      );
    }

    setIsModuleNameUnselected(!!moduleNumber && !moduleName);
  }, [
    num,
    moduleName,
    moduleNumber,
    datasetId,
    setFormErrors,
    setIsModuleNameUnselected,
  ]);

  useEffect(() => {
    const id = `${datasetId}-first-module-missing`;
    if (num === 1) {
      if (!moduleName || !moduleNumber) {
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
        setFormErrors((formErrors) =>
          formErrors.filter((error) => error.id !== id),
        );
      }
    }
  }, [num, moduleName, moduleNumber, datasetId, setFormErrors]);

  return (
    <>
      <div id={datasetId + '-module-' + num} className="space-y-4 basis-1/2">
        <div className="flex gap-2 module-group-wrapper">
          <Listbox
            name={datasetId + '_' + 'module' + num}
            value={moduleName || ''}
            disabled={readOnly || (!moduleNumber && availableNumber < 1)}
            onChange={(value) => {
              setDataSourceModules((dataSourceModules) =>
                dataSourceModules?.map((datasetModule) => {
                  if (datasetModule?.datasetId === datasetId) {
                    return {
                      ...datasetModule,
                      modules: datasetModule?.modules?.map(
                        (moduleObj, index) => {
                          if (index === num - 1) {
                            return {
                              name: value,
                              number: moduleObj?.number || 1,
                            };
                          } else {
                            return moduleObj;
                          }
                        },
                      ),
                    };
                  } else {
                    return datasetModule;
                  }
                }),
              );
            }}
          >
            {({ disabled, open }) => (
              <div className="basis-[55%]">
                <Listbox.Button
                  className={`px-4 py-3 rounded border 
                  ${
                    (touched && module1NameUnselected) ||
                    (isModuleNameUnselected && num !== 1)
                      ? 'border-red-500'
                      : 'border-gray-300'
                  } 
                  w-full text-left flex justify-between items-center ${
                    disabled ? 'bg-gray-100' : ''
                  }
                  ${open ? 'border-light-blue-600' : 'border-gray-300'}
                  `}
                >
                  {moduleName ? (
                    <p className="text-gray-800">{moduleName}</p>
                  ) : (
                    <p
                      className={`${
                        disabled
                          ? 'text-gray-400'
                          : (touched && module1NameUnselected) ||
                            (isModuleNameUnselected && num !== 1)
                          ? 'text-red-500'
                          : 'text-gray-600'
                      }
                      `}
                    >
                      {`${t('data_source_mapping.select_module')} ${num}`}
                    </p>
                  )}
                  <Image
                    src={downArrow}
                    alt="Toggle dropdown"
                    className="ml-auto"
                  />
                </Listbox.Button>
                <Listbox.Options className="absolute w-[24%] max-h-44 overflow-y-auto z-20 rounded py-2 text-gray-600 bg-white shadow-xl">
                  {modulesList?.map((module) => (
                    <Listbox.Option key={module} value={module}>
                      {({ active, selected }) => (
                        <span
                          className={`block px-4 py-1 cursor-pointer ${
                            active || selected ? 'bg-light-blue-50' : ''
                          }`}
                        >
                          {module}
                        </span>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
                {touched && module1NameUnselected && (
                  <p className="text-red-500">
                    {t('data_source_mapping.please_select_module')}
                  </p>
                )}
                {isModuleNameUnselected && num !== 1 && (
                  <p className="text-red-500">
                    {t('data_source_mapping.please_select_module')}
                  </p>
                )}
              </div>
            )}
          </Listbox>

          <Listbox
            name={datasetId + '-module' + num + '-number'}
            value={moduleNumber || 0}
            disabled={readOnly || (!moduleNumber && availableNumber < 1)}
            onChange={(value) => {
              setDataSourceModules((dataSourceModules) =>
                dataSourceModules?.map((datasetModule) => {
                  if (datasetModule?.datasetId === datasetId) {
                    return {
                      ...datasetModule,
                      modules: datasetModule?.modules?.map(
                        (moduleObj, index) => {
                          if (index === num - 1) {
                            return {
                              ...moduleObj,
                              number: value,
                              name: !value ? '' : moduleObj?.name,
                            };
                          } else {
                            return moduleObj;
                          }
                        },
                      ),
                    };
                  } else {
                    return datasetModule;
                  }
                }),
              );
            }}
          >
            {({ disabled, open }) => (
              <div className="basis-[45%]">
                <Listbox.Button
                  className={`px-4 py-3 rounded border ${
                    touched && module1NumberUnselected
                      ? 'border-red-500'
                      : 'border-gray-300'
                  } w-full text-left flex justify-between items-center ${
                    disabled ? 'bg-gray-100' : ''
                  }
                  ${open ? 'border-light-blue-600' : 'border-gray-300'}
                  `}
                >
                  {moduleNumber ? (
                    <p className="text-gray-800">{moduleNumber}</p>
                  ) : (
                    <p
                      className={`${
                        disabled
                          ? 'text-gray-400'
                          : touched && module1NumberUnselected
                          ? 'text-red-500'
                          : 'text-gray-600'
                      }`}
                    >
                      {t('data_source_mapping.module_number')}
                    </p>
                  )}
                  <Image
                    src={downArrow}
                    alt="Toggle dropdown"
                    className="ml-auto"
                  />
                </Listbox.Button>
                <Listbox.Options className="absolute w-[19.7%] z-20 rounded py-2 text-gray-600 bg-white shadow-xl">
                  {Array(4)
                    .fill(null)
                    .map((_, index) => (
                      <Listbox.Option
                        key={'module-no-' + index + 1}
                        value={index + 1}
                      >
                        {({ active, selected }) => (
                          <span
                            className={`block px-4 py-1 cursor-pointer ${
                              active || selected ? 'bg-light-blue-50' : ''
                            }
                            `}
                          >
                            {index + 1}
                          </span>
                        )}
                      </Listbox.Option>
                    ))}
                  <Listbox.Option value={0}>
                    {({ active, selected }) => (
                      <span
                        className={`block px-4 py-1 cursor-pointer ${
                          active || selected ? 'bg-light-blue-50' : ''
                        }
                        `}
                      >
                        Clear
                      </span>
                    )}
                  </Listbox.Option>
                </Listbox.Options>
                {touched && module1NumberUnselected && (
                  <p className="text-red-500">
                    {t('data_source_mapping.select_module_number')}
                  </p>
                )}
              </div>
            )}
          </Listbox>
        </div>
      </div>
    </>
  );
}
