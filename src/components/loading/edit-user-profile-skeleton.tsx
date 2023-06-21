import Image from 'next/image';
import { Dispatch, SetStateAction } from 'react';
import crossIcon from '../../public/icons/cross-icon.svg';

export default function EditUserProfileSkeleton(props: {
  setShow: Dispatch<SetStateAction<boolean>>;
}) {
  const { setShow } = props;
  return (
    <>
      <div className="z-20 fixed edit-user-profile-calculated right-0 w-[30%] bg-white shadow-xl flex flex-col overflow-auto">
        <div
          id="edit-profile-header"
          className="w-full p-4 flex items-center justify-between border-b border-gray-300 font-semibold text-xl text-gray-800"
        >
          Edit Profile
          <div
            className="w-10 h-10 flex items-center justify-center cursor-pointer rounded hover:bg-gray-100"
            onClick={() => setShow(false)}
          >
            <Image src={crossIcon} alt="Close edit profile form" />
          </div>
        </div>
        <div
          id="edit-profile-content"
          className="px-4 py-6 flex flex-col gap-6 animate-pulse"
        >
          <div className="w-[68px] h-[68px] bg-gray-200 rounded-full" />
          <div className="h-12 rounded-full bg-gray-200" />
          <div className="h-12 rounded-full bg-gray-200" />
          <div className="flex flex-col gap-1">
            <div className="bg-gray-200 rounded-full h-4 w-14" />
            <div className="bg-gray-200 rounded-full h-6 w-48" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="bg-gray-200 rounded-full h-4 w-32" />

            <div className="flex items-center justify-between">
              <div className="bg-gray-200 rounded-full h-6 w-48" />
              <div className="bg-gray-200 rounded-full h-8 w-8" />
            </div>
          </div>
        </div>
        <div
          id="edit-profile-footer"
          className="p-4 mt-auto flex justify-end items-center animate-pulse"
        >
          <div className="rounded w-[8.5rem] h-10 bg-gray-200" />
        </div>
      </div>
    </>
  );
}
