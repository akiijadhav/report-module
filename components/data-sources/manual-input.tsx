import React, { ChangeEvent, Dispatch, SetStateAction } from 'react';
import RocTextInput from '../forms/text-input';
import { ManualInputModel } from './models/manual-input-model';

export default function ManualInput(props: {
  manualInput: ManualInputModel[];
  setManualInput: Dispatch<SetStateAction<ManualInputModel[]>>;
  readOnly: boolean;
}) {
  const { manualInput, setManualInput, readOnly } = props;
  return (
    <>
      {manualInput?.map((inputObj) => {
        return (
          <div
            key={
              'dataset-' +
              'manual-input-' +
              inputObj.markerLabel +
              '-' +
              inputObj.id
            }
            className="flex items-center justify-between gap-4"
          >
            <RocTextInput
              className="h-12 border border-gray-300 rounded pl-4"
              label="Marker Label"
              name={'marker-label-' + inputObj.id}
              required={true}
              value={inputObj?.markerLabel}
              read_only={readOnly}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setManualInput((manualInput) =>
                  manualInput.map((obj) => {
                    if (obj.id === inputObj.id) {
                      return {
                        ...obj,
                        markerLabel: e.target.value,
                        touched: true,
                        error: e.target.value
                          ? false
                          : 'Please fill in Marker Label',
                      };
                    } else {
                      return obj;
                    }
                  }),
                );
              }}
              error={inputObj.touched && !!inputObj.error}
              onBlur={() =>
                setManualInput((manualInput) =>
                  manualInput.map((obj) => {
                    if (obj.id === inputObj.id) {
                      return {
                        ...obj,
                        touched: true,
                      };
                    } else {
                      return obj;
                    }
                  }),
                )
              }
            />

            <RocTextInput
              className="h-12 border border-gray-300 rounded pl-4"
              label="Unit"
              name={'unit-' + inputObj.id}
              required={true}
              value={inputObj?.unitOfMarker}
              read_only={readOnly}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setManualInput((manualInput) =>
                  manualInput.map((obj) => {
                    if (obj.id === inputObj.id) {
                      return {
                        ...obj,
                        unitOfMarker: e.target.value,
                        touched: true,
                        error: e.target.value ? false : 'Please fill in Unit',
                      };
                    } else {
                      return obj;
                    }
                  }),
                );
              }}
              error={inputObj.touched && !!inputObj.error}
              onBlur={() =>
                setManualInput((manualInput) =>
                  manualInput.map((obj) => {
                    if (obj.id === inputObj.id) {
                      return {
                        ...obj,
                        touched: true,
                      };
                    } else {
                      return obj;
                    }
                  }),
                )
              }
            />

            <RocTextInput
              className="h-12 border border-gray-300 rounded pl-4"
              label="ACN Code (Optional)"
              name={'acn-' + inputObj.id}
              required={false}
              value={inputObj?.acn}
              read_only={readOnly}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setManualInput((manualInput) =>
                  manualInput.map((obj) => {
                    if (obj.id === inputObj.id) {
                      return {
                        ...obj,
                        acn: e.target.value,
                        touched: true,
                      };
                    } else {
                      return obj;
                    }
                  }),
                );
              }}
              error={inputObj.touched && !!inputObj.error}
              onBlur={() =>
                setManualInput((manualInput) =>
                  manualInput.map((obj) => {
                    if (obj.id === inputObj.id) {
                      return {
                        ...obj,
                        touched: true,
                      };
                    } else {
                      return obj;
                    }
                  }),
                )
              }
            />
          </div>
        );
      })}
    </>
  );
}
