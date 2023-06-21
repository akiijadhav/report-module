import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import addIcon from '../../public/icons/add-icon.svg';
import generateReportIcon from '../../public/icons/generate-report-icon.svg';
import emailInvite from '../../public/icons/email-invite-icon.svg';
import csvInvite from '../../public/icons/upload-icon.svg';
import UserInviteModal from './user-invite-modal';
import GenerateReportModal from '../reports/generate-report-modal';
import { useTranslation } from 'react-i18next';

export default function PageHeader() {
  const [showInviteOptions, setShowInviteOptions] = useState(false);
  const [generateReportModal, setGenerateReportModal] = useState(false);
  type inviteScreenType = 'invisible' | 'csv' | 'email';
  type viewScreenType = 'loading' | 'admin' | 'engineer';
  const [viewScreen, setViewScreen] = useState<viewScreenType>('loading');
  const [inviteScreen, setInviteScreen] =
    useState<inviteScreenType>('invisible');
  const { t } = useTranslation();
  const menuChoices = [
    {
      displayText: `${t('users.csv_invite')}`,
      onClick: () => {
        setInviteScreen('csv');
      },
      imgSrc: csvInvite,
      imgAlt: 'CSV invite icon',
    },
    {
      displayText: `${t('users.email_invite')}`,
      onClick: () => {
        setInviteScreen('email');
      },
      imgSrc: emailInvite,
      imgAlt: 'Email invite icon',
    },
  ];

  useEffect(() => {
    const userRole = JSON.parse(localStorage.getItem('userInfo'))?.role;
    if (userRole === 'Admin') {
      setViewScreen('admin');
    }
    if (userRole === 'LabEngineer') {
      setViewScreen('engineer');
    }
  }, []);

  return (
    <>
      <div className="py-4 px-6 flex items-center justify-between border-b border-gray-300 font-semibold text-xl text-gray-800">
        {viewScreen === 'loading' && (
          <>
            <div className="bg-gray-300 rounded-full w-20 h-5 animate-pulse" />
            <div className="bg-gray-300 rounded w-36 h-10 animate-pulse" />
          </>
        )}
        {viewScreen === 'admin' && (
          <>
            {t('users.users_page_title')}
            <button
              type="button"
              onClick={() =>
                setShowInviteOptions((showInviteOptions) => !showInviteOptions)
              }
              className="relative bg-[#0284C7] py-2 px-3 flex items-center gap-2 rounded text-base text-white shadow hover:shadow-none"
            >
              <Image src={addIcon} alt="" />
              {t('users.invite_users')}
              {showInviteOptions && (
                <>
                  <div
                    className="fixed top-0 left-0 w-full h-full z-10 cursor-default"
                    id="overlay"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowInviteOptions(false);
                    }}
                  />
                  <div className="w-[calc(100%_+_2rem)] absolute right-0 top-[calc(100%_+_0.25rem)] z-20 flex flex-col items-start py-2 bg-white rounded shadow-md font-normal text-sm leading-[19px] text-gray-600 cursor-default">
                    {menuChoices?.map((menuItem) => (
                      <div
                        key={menuItem.displayText}
                        onClick={menuItem.onClick}
                        className="w-full flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-gray-200"
                      >
                        <Image src={menuItem.imgSrc} alt={menuItem.imgAlt} />
                        {menuItem.displayText}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </button>
          </>
        )}
        {viewScreen === 'engineer' && (
          <>
            {t('reports.report_list_page_title')}
            <button
              type="button"
              className="relative bg-[#0284C7] py-2 px-3 flex items-center gap-2 rounded text-base text-white shadow hover:shadow-none"
              onClick={() => setGenerateReportModal(true)}
            >
              <Image src={generateReportIcon} alt="" />
              {t('reports.generate_report')}
            </button>
          </>
        )}
      </div>
      {viewScreen === 'admin' && inviteScreen === 'email' && (
        <UserInviteModal setInviteScreen={setInviteScreen} />
      )}
      {generateReportModal && (
        <GenerateReportModal setGenerateReportModal={setGenerateReportModal} />
      )}
    </>
  );
}
