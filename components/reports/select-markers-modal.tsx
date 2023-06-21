import { Dialog, Listbox } from '@headlessui/react';
import React, { Dispatch, SetStateAction } from 'react';
import Image from 'next/image';
import crossIcon from '../../public/icons/cross-icon.svg';
import { TFunction } from 'i18next';

const notoSansFont = 'noto-sans';

export default function SelectMarkersModal(props: {
  show: boolean;
  setShow: Dispatch<SetStateAction<boolean>>;
  duplicateMarkers: string[];
  selected2ChMarkers: string[];
  setSelected2ChMarkers: Dispatch<SetStateAction<string[]>>;
  translator: TFunction<'translation', undefined, 'translation'>;
  formSubmitHandler: (values: any) => void;
  formValues: any;
}) {
  const {
    show,
    setShow,
    duplicateMarkers,
    selected2ChMarkers,
    setSelected2ChMarkers,
    translator: t,
    formSubmitHandler,
    formValues,
  } = props;

  return (
    <Dialog
      open={show}
      onClose={() => setShow(false)}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-gray-600/40" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          className={`${notoSansFont} mx-auto w-[100%] max-w-[70vw] bg-white rounded-lg shadow-md`}
        >
          <div className="custom-modal-header">
            {t('select_markers_modal.accuracy_select_markers')}
            <div className="close-icon-wrapper" onClick={() => setShow(false)}>
              <Image src={crossIcon} alt="Close select markers modal" />
            </div>
          </div>
          <div className="custom-modal-content">
            <div className="flex flex-col w-full gap-4 rounded">
              <Listbox
                name="twoChValues"
                value={selected2ChMarkers}
                onChange={setSelected2ChMarkers}
                multiple
              >
                <div className="max-w-max">
                  <div className="flex gap-2 flex-wrap items-center">
                    {selected2ChMarkers.map((marker) => (
                      <p className="px-2 py-2 bg-gray-100 flex items-center cursor-default text-base font-normal">
                        {marker}
                        <span
                          onClick={() =>
                            setSelected2ChMarkers((selected2ChMarkers) =>
                              selected2ChMarkers.filter(
                                (oldMarker) => oldMarker !== marker,
                              ),
                            )
                          }
                          className="ml-2 text-2xl w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 cursor-pointer hover:bg-gray-200"
                        >
                          &#215;
                        </span>
                      </p>
                    ))}
                  </div>
                </div>
                <Listbox.Options
                  static
                  className="max-h-56 overflow-y-auto border border-gray-300 text-sm"
                >
                  {duplicateMarkers?.map((marker, index, array) => (
                    <Listbox.Option
                      key={marker}
                      className={`px-3 py-2 cursor-pointer ${
                        index === array.length - 1
                          ? ''
                          : 'border-b border-gray-200'
                      } ${
                        selected2ChMarkers.includes(marker) ? 'bg-gray-100' : ''
                      }`}
                      value={marker}
                    >
                      {marker}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Listbox>
            </div>
          </div>
          <div className="custom-modal-footer">
            <button
              type="button"
              className="flex flex-row items-center justify-center font-semibold rounded px-2 text-base h-10 border hover:bg-gray-100"
              onClick={() => setShow(false)}
            >
              {t('report_edit.cancel')}
            </button>
            <button
              type="button"
              className={`flex flex-row items-center justify-center font-semibold rounded text-base w-auto shadow-md hover:shadow-none h-10 p-3 text-white bg-blue-600 hover:bg-blue-800`}
              onClick={() => {
                formSubmitHandler(formValues);
                setShow(false);
              }}
            >
              {t('report_edit.generate_report')}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
