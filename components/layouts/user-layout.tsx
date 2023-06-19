import { ReactElement, useEffect, useState } from 'react';
import Image from 'next/image';
import RocCircularImage from '../ui/circular-image';
import dropdownArrow from '../../public/icons/arrow-drop-down-fill.svg';
import editProfileIcon from '../../public/icons/edit-profile-icon.svg';
import logoutIcon from '../../public/icons/logout-icon.svg';
import useRequestUtilities from '../hooks/use-request-utilities';
import Language from '../users/language';
import { useTranslation } from 'react-i18next';

const notoSansFont = 'noto-sans';

export default function UserLayout({
  children,
}: {
  children: ReactElement | ReactElement[];
}) {
  const [step, setStep] = useState<number>(1);

  const handlePrev = (): void => {
    setStep(step - 1);
    router.push('/data-sources');
  };

  const handleNext = (): void => {
    setStep(step + 1);
    router.push('/reports');
  };

  const {
    fetchWrapper,
    logoutUser,
    nextJsRouter: router,
  } = useRequestUtilities();
  const { t } = useTranslation();
  const menuChoices = [
    {
      displayText: t(`header.edit_profile`),
      onClick: () => {
        router.push('/profile');
      },
      imgSrc: editProfileIcon,
      imgAlt: 'Edit profile icon',
    },
    {
      displayText: t(`header.sign_out`),
      onClick: logoutUser,
      imgSrc: logoutIcon,
      imgAlt: 'Logout icon',
    },
  ];
  const [showChoices, setShowChoices] = useState(false);

  const [userName, setUserName] = useState();
  const [profilePhotoURL, setProfilePhotoURL] = useState();
  const [userInfo, setUserInfo] = useState(null);

  async function getUserDetails() {
    async function handleResponse(response: Response) {
      const resJson = await response.json();
      if (response.ok) {
        const localUserInfo = {
          name: resJson?.Name || '',
          email: resJson?.Email || '',
          contact: resJson?.Contact || '',
          profilePhoto: resJson?.ProfilePhoto || null,
          role: resJson?.Role || '',
        };
        setUserInfo(localUserInfo);
      }
    }
    function handleError(_error: any) {
      console.log(_error);
    }

    fetchWrapper({
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/profile`,
      includeAuthToken: true,
      handleResponse,
      handleError,
    });
  }

  useEffect(() => {
    setUserName(
      userInfo?.name || JSON.parse(localStorage.getItem('userInfo'))?.name,
    );
  }, [userInfo?.name]);

  useEffect(() => {
    const hasPhoto = userInfo?.profilePhoto;

    if (typeof hasPhoto === 'string' && hasPhoto.replaceAll('undefined', '')) {
      fetchSignedUrl();
    }
  }, [userInfo?.profilePhoto]);

  useEffect(() => {
    setShowChoices(false);
    if (router.route === '/data-sources') {
      setStep(1);
    } else if (router.route === '/reports') {
      setStep(2);
    } else {
      setStep(4);
    }
  }, [router.route]);

  async function fetchSignedUrl() {
    async function handleResponse(response: Response) {
      if (response.ok) {
        const resJson = await response.json();
        setProfilePhotoURL(resJson?.SignedUrl);
      }
    }
    function handleError(_error: any) {
      return;
    }

    fetchWrapper({
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/upload-url`,
      includeAuthToken: true,
      method: 'POST',
      applicationIdentifier: 'cms-web-app',
      body: {
        FileName: String(
          userInfo?.profilePhoto ||
            JSON.parse(localStorage.getItem('userInfo'))?.profilePhoto,
        ),
        Value: 'get',
      },
      handleResponse,
      handleError,
    });
  }

  useEffect(function () {
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function (key, value) {
      if (key === 'userInfo' && localStorage.getItem('userInfo') !== value) {
        const event = new Event('itemInserted');
        document.dispatchEvent(event);
      }
      originalSetItem.apply(this, [key, value]);
    };

    const localStorageSetHandler = () => {
      getUserDetails();
    };
    setUserInfo(JSON.parse(localStorage.getItem('userInfo')));
    document.addEventListener('itemInserted', localStorageSetHandler, false);
  }, []);

  return (
    <>
      <header
        id="user-header"
        className={`${notoSansFont} sticky top-0 z-30  px-6 bg-gray-700 text-white flex items-center justify-between`}
      >
        <div
          className="flex items-center gap-3 py-2 cursor-pointer"
          onClick={() => router.push('/')}
        >
          <Image
            src={'/images/roche-logo-white.svg'}
            alt="Roche logo"
            width={77}
            height={40}
          />
          <span className={`font-medium text-xl leading-[27px] select-none`}>
            RDKK EP Evaluator
          </span>
        </div>
        {userInfo?.role === 'LabEngineer' ? (
          <div className="flex flex-row items-center gap-3 pt-2 nav-stepper">
            <ul className="flex items-center gap-3 h-100 stepper-list">
              <li
                className={
                  step === 1
                    ? 'stepper-button option-list-wrapper '
                    : 'stepper-button '
                }
              >
                <button onClick={handlePrev} disabled={step === 1}>
                  {t(`header.data_source_list`)}
                </button>
              </li>
              <li
                className={
                  step === 2
                    ? 'stepper-button option-list-wrapper'
                    : 'stepper-button'
                }
              >
                <button onClick={handleNext} disabled={step === 2}>
                  {t(`header.report_list`)}
                </button>
              </li>
            </ul>
          </div>
        ) : null}

        <div className="flex items-center gap-3 relative cursor-pointer py-2 nav-profile">
          {profilePhotoURL ? (
            <img
              src={profilePhotoURL}
              width={20}
              height={20}
              loading="lazy"
              alt={`profile photo`}
              className="rounded-full aspect-square"
            />
          ) : (
            <RocCircularImage
              imgSrc={'/icons/profile-icon-default.svg'}
              sideLength={32}
              bgColour="#F3F4F6"
              imgAlt="Default profile icon"
              imgHeight={16}
              imgWidth={16}
            />
          )}
          <div className="relative">
            <div
              className="flex items-center gap-1"
              onClick={() => {
                setShowChoices((showChoices) => !showChoices);
              }}
            >
              <div className="font-medium text-base leading-[22px]">
                {userName || ''}
              </div>
              <Image
                src={dropdownArrow}
                className={`transition-all duration-200 ${
                  showChoices && '-rotate-180'
                }`}
                alt="Dropdown arrow"
              />
            </div>

            {showChoices && (
              <>
                <div
                  className="fixed top-0 left-0 w-full h-full z-10 cursor-default"
                  id="overlay"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowChoices(false);
                  }}
                />
                <div className="min-w-fit w-full absolute top-[calc(100%_+_0.5rem)] right-0 z-20 flex flex-col items-start py-2 bg-white rounded shadow-md font-normal text-sm leading-[19px] text-gray-600 cursor-default">
                  {menuChoices?.map((menuItem) => (
                    <div
                      key={menuItem.displayText}
                      onClick={menuItem.onClick}
                      className="min-w-max w-full flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-gray-200"
                    >
                      <Image src={menuItem.imgSrc} alt={menuItem.imgAlt} />
                      {menuItem.displayText}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <Language />
        </div>
      </header>
      <main className={`${notoSansFont} bg-white`}>{children}</main>
    </>
  );
}
