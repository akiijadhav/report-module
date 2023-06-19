import { ReactElement, useState } from 'react';
import Image from 'next/image';
import UserLayout from '../../components/layouts/user-layout';
import { NextPageWithLayout } from '../_app';
import EditProfile from '../../components/profile/edit-profile';
import ChangePassword from '../../components/profile/change-password';
import { useRouter } from 'next/router';

import { useTranslation } from 'react-i18next';

const tabsArr = [
  {
    name: 'edit_profile',
    imgSrc: 'profile-edit.svg',
    imgAlt: 'profile-edit-icon',

    // component:<EditProfile/>
  },
  {
    name: 'change_password',
    imgSrc: 'password-icon.svg',
    imgAlt: 'password-icon',

    // component:<ChangePassword/>
  },
];

const Home: NextPageWithLayout = (props) => {
  const [activeTab, setActiveTab] = useState({
    name: 'edit_profile',
    // component:<EditProfile/>
  });
  const { t, i18n } = useTranslation();

  const router = useRouter();
  return (
    <div className="bg-gray-100 py-10">
      <div className="flex flex-row gap-6 p-8 w-full max-w-[49.5rem]  min-h-[29.125rem] mx-auto rounded-2xl bg-white shadow-lg">
        <div className=" pr-4 border-r border-gray-200">
          <p className="font-semibold text-lg text-gray-800">
            {t('profile.your_profile')}
          </p>
          {tabsArr &&
            tabsArr.map((item) => (
              <p
                className={`${
                  item.name === activeTab.name
                    ? 'font-medium  text-gray-800'
                    : 'font-normal text-gray-600'
                } mt-10 text-sm flex flex-row`}
                onClick={() =>
                  setActiveTab({
                    name: item.name,
                    // component:item.component
                  })
                }
              >
                {' '}
                <Image
                  src={`/icons/${item.imgSrc}`}
                  alt={item.imgAlt}
                  width={15}
                  height={15}
                  className=""
                />
                <span className="ml-2.5 cursor-pointer capitalize" id="tabs">
                  {/* {item.name} */}
                  {t(`profile.${item.name}`)}
                </span>
              </p>
            ))}
          <p
            className="font-normal text-sm text-[#0284C7] mt-[19rem] flex flex-row cursor-pointer"
            onClick={() => router.push('/login')}
          >
            {' '}
            <Image
              src="/icons/sign-out.svg"
              alt="password icon"
              width={15}
              height={15}
              className=""
            />
            <span className="ml-2.5 cursor-pointer">
              {t('profile.sign_out')}
            </span>{' '}
          </p>
        </div>

        {/* {activeTab&&activeTab.component} */}
        {activeTab?.name === 'edit_profile' && <EditProfile />}
        {activeTab?.name === 'change_password' && <ChangePassword />}
      </div>
    </div>
  );
};

Home.getLayout = function getLayout(page: ReactElement) {
  return <UserLayout>{page}</UserLayout>;
};
export default Home;
