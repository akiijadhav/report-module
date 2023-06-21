import Image from 'next/image';
import React, {
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import UserLayout from '../../components/layouts/user-layout';
import PageContainer from '../../components/users/page-container';
import { NextPageWithLayout } from '../_app';
import addUsersIcon from '../../public/icons/add-users-icon.svg';
import addIcon from '../../public/icons/add-icon.svg';
import emailInvite from '../../public/icons/email-invite-icon.svg';
import csvInvite from '../../public/icons/upload-icon.svg';
import UserTable from '../../components/users/table/user-table';
import { rowInterface } from '../../components/users/table/types';
import UserTableSkeleton from '../../components/loading/user-table-skeleton';
import useRequestUtilities from '../../components/hooks/use-request-utilities';
import { useTranslation } from 'react-i18next';
import UserInviteModal from '../../components/users/user-invite-modal';

const UsersListPage: NextPageWithLayout = () => {
  type viewScreenType =
    | 'loading'
    | 'usersAbsent'
    | 'usersPresent'
    | 'responseError';
  type inviteScreenType = 'invisible' | 'csv' | 'email';
  const [viewScreen, setViewScreen] = useState<viewScreenType>('loading');
  const [inviteScreen, setInviteScreen] =
    useState<inviteScreenType>('invisible');
  const [responseErrorMsg, setResponseErrorMsg] = useState('');
  const [data, setData] = useState<rowInterface[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [showInviteOptions, setShowInviteOptions] = useState(false);
  const { t } = useTranslation();

  const loadingSkeletonRef = useRef();
  const {
    fetchWrapper,
    logoutUser,
    nextJsRouter: router,
  } = useRequestUtilities();

  const refetchUsers =
    typeof router.query.refetch === 'string'
      ? router.query.refetch
      : router.query?.refetch?.at(0);

  const fetchUsers = useCallback(async function (
    Limit: number,
    Offset: number,
    Refetch = false,
  ) {
    async function handleResponse(response: Response) {
      const resJson = await response.json();
      if (response.ok) {
        const newUsers: rowInterface[] = resJson?.Users;
        if (newUsers.length) {
          setTotalUsers(resJson?.TotalUsers);
          if (Refetch) {
            setData(newUsers);
          } else {
            setData((old) => {
              const uniqueNewUsers: rowInterface[] = [];
              newUsers.forEach((newUser) => {
                if (old.find((user) => user.Id === newUser.Id) === undefined) {
                  uniqueNewUsers.push(newUser);
                }
              });
              return [...old, ...uniqueNewUsers];
            });
          }
          setViewScreen('usersPresent');
        } else if (data.length < 1 && newUsers.length < 1) {
          setViewScreen('usersAbsent');
        }
      } else {
        const errorMsg =
          typeof resJson?.message === 'string'
            ? resJson.message
            : resJson?.message?.at(0);
        setResponseErrorMsg(
          `Error ${response.status}: ${errorMsg || response.statusText}`,
        );
        setViewScreen('responseError');
      }
    }
    function handleError(error: any) {
      setResponseErrorMsg(t('error.something_went_wrong'));
      setViewScreen('responseError');
    }

    fetchWrapper({
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/users?Limit=${Limit}&Offset=${Offset}`,
      includeAuthToken: true,
      handleResponse,
      handleError,
    });
  },
  []);

  const menuChoices = useMemo(
    () => [
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
    ],
    [],
  );

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    if (!accessToken || !refreshToken) {
      logoutUser();
      return;
    } else {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (userInfo?.role !== 'Admin') {
        router.replace('/data-sources');
        return;
      }
      fetchUsers(10, 0, Boolean(refetchUsers));
    }
  }, [refetchUsers]);

  useEffect(() => {
    if (data.length < 1 || !loadingSkeletonRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          fetchUsers(10, data.length);
        }
      },
      {
        threshold: 1,
      },
    );
    observer.observe(loadingSkeletonRef.current);
  }, [data.length]);

  if (viewScreen === 'loading') {
    return (
      <>
        <div className="py-4 px-6 flex items-center justify-between border-b border-gray-300 font-semibold text-xl text-gray-800">
          <div className="bg-gray-300 rounded-full w-20 h-5 animate-pulse" />
          <div className="bg-gray-300 rounded w-36 h-10 animate-pulse" />
        </div>
        <UserTableSkeleton />
      </>
    );
  }
  if (viewScreen === 'usersAbsent') {
    return (
      <>
        <div className="py-4 px-6 flex items-center justify-between border-b border-gray-300 font-semibold text-xl text-gray-800">
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
        </div>
        <div className="text-center w-[512px] mx-auto pt-16">
          <Image src={addUsersIcon} alt="" className="mb-10 mx-auto" />
          <h1 className="font-medium text-2xl leading-6 text-gray-800 mb-4">
            Add users to Roche
          </h1>
          <p className="font-normal text-base leading-7 text-gray-600">
            Looks like you haven&apos;t invited any users yet, start inviting
            them now to manage all the users data here.
          </p>
        </div>
        {inviteScreen === 'email' && (
          <UserInviteModal setInviteScreen={setInviteScreen} />
        )}
      </>
    );
  }
  if (viewScreen === 'responseError') {
    return (
      <>
        <div className="py-4 px-6 flex items-center justify-between border-b border-gray-300 font-semibold text-xl text-gray-800">
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
        </div>
        <div className="text-center w-[512px] mx-auto pt-16">
          <h1 className="font-medium text-2xl leading-6 text-gray-800 mb-4">
            {responseErrorMsg}
          </h1>
        </div>
        {inviteScreen === 'email' && (
          <UserInviteModal setInviteScreen={setInviteScreen} />
        )}
      </>
    );
  }

  return (
    <>
      <div className="py-4 px-6 flex items-center justify-between border-b border-gray-300 font-semibold text-xl text-gray-800">
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
      </div>
      <UserTable data={data} setData={setData} />
      {totalUsers > data.length && (
        <div ref={loadingSkeletonRef}>
          <UserTableSkeleton showHeader={false} numberOfRows={1} />
        </div>
      )}
      {inviteScreen === 'email' && (
        <UserInviteModal setInviteScreen={setInviteScreen} />
      )}
    </>
  );
};

export default UsersListPage;

UsersListPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <UserLayout>
      <PageContainer>{page}</PageContainer>
    </UserLayout>
  );
};
