import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import Image from 'next/image';
import userIcon from '../../../public/icons/user-table-icon.svg';
import editProfileIcon from '../../../public/icons/edit-profile-icon.svg';
import resendInviteIcon from '../../../public/icons/resend-invite-icon.svg';
import { Switch } from '@headlessui/react';
import { useTable } from 'react-table';
import EditUserProfile from '../edit-user-profile';
import { rowInterface } from './types';
import { Column } from 'react-table';
import RocTooltip from '../../ui/tooltip';
import Notification, { responseMsgType } from '../../ui/notification';
import DeactivateUserModal from '../deactivate-user-modal';
import useRequestUtilities from '../../hooks/use-request-utilities';
import { useTranslation } from 'react-i18next';

export default function UserTable({
  data,
  setData,
}: {
  data: rowInterface[];
  setData: Dispatch<SetStateAction<rowInterface[]>>;
}) {
  const [showEditUserProfileScreen, setShowEditUserProfileScreen] =
    useState(false);
  const [showDeactivateUserModal, setShowDeactivateUserModal] = useState(false);
  const [isChangingUserStatus, setIsChangingUserStatus] = useState(false);
  const [isReinvitingUser, setIsReinvitingUser] = useState(false);
  const [userUpdateMsg, setUserUpdateMsg] = useState<responseMsgType>({});
  const [selectedUserData, setSelectedUserData] = useState<
    rowInterface | undefined
  >();
  const { fetchWrapper } = useRequestUtilities();
  const { t } = useTranslation();

  async function activateUser(userData: rowInterface) {
    function initiate() {
      setIsChangingUserStatus(true);
    }
    async function handleResponse(response: Response) {
      if (response.ok) {
        setData((old) =>
          old.map((user) => {
            if (user.Id === userData.Id) {
              return {
                ...user,
                Status: 'Active',
              };
            } else {
              return user;
            }
          }),
        );
      } else {
        const resJson = await response.json();
        const errorMsg =
          typeof resJson?.message === 'string'
            ? resJson.message
            : resJson?.message?.at(0);
        setUserUpdateMsg({
          isError: true,
          entityName: userData.Name,
          msg: errorMsg
            ? ` ${errorMsg}`
            : `: Error ${response.status} ${response.statusText}`,
        });
      }
    }
    function handleError(error: any) {
      setUserUpdateMsg({
        isError: true,
        entityName: userData.Name,
        msg: t('error.something_went_wrong'),
      });
    }
    function handleFinally() {
      setIsChangingUserStatus(false);
    }

    fetchWrapper({
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${userData.Id}/status`,
      method: 'PUT',
      body: {
        Status: 'Active',
      },
      includeAuthToken: true,
      initiate,
      handleResponse,
      handleError,
      handleFinally,
    });
  }

  async function resendInvite(userData: rowInterface) {
    function initiate() {
      setIsReinvitingUser(true);
    }
    async function handleResponse(response: Response) {
      if (response.ok) {
        setUserUpdateMsg({
          isError: false,
          msg: ': Successfully sent invite',
          entityName: userData.Name,
        });
      } else {
        const resJson = await response.json();
        const errorMsg =
          typeof resJson?.message === 'string'
            ? resJson.message
            : resJson?.message?.at(0);
        setUserUpdateMsg({
          isError: true,
          entityName: userData.Name,
          msg: errorMsg
            ? ` ${errorMsg}`
            : `: Error ${response.status} ${response.statusText}`,
        });
      }
    }
    function handleError(error: any) {
      setUserUpdateMsg({
        isError: true,
        entityName: userData.Name,
        msg: t('error.something_went_wrong'),
      });
    }
    function handleFinally() {
      setIsReinvitingUser(false);
    }

    fetchWrapper({
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/users`,
      method: 'POST',
      body: [
        {
          Name: userData.Name,
          Email: userData.Email,
          Contact: userData.Contact || null,
        },
      ],
      includeAuthToken: true,
      initiate,
      handleResponse,
      handleError,
      handleFinally,
    });
  }

  const columnsRaw: Column<rowInterface>[] = [
    {
      Header: `Name (${data.length})`,
      accessor: (row) => {
        return (
          <div className="py-3 px-6 flex gap-4 items-center w-[25rem] -mr-[11rem]">
            <Image src={userIcon} alt="" className="h-8 w-8" />
            <div className="space-y-1">
              <p className="font-semibold text-gray-800">{row.Name}</p>
              <p>{row.AccessKey}</p>
            </div>
          </div>
        );
      },
      id: 'name',
    },
    {
      Header: 'Contact',
      accessor: (row) => {
        return (
          <div className="py-3 px-4 space-y-1 w-[25rem] -mr-[10rem]">
            <p className="text-gray-800">{row.Email}</p>
            <p>{row.Contact || '-'}</p>
          </div>
        );
      },
      id: 'contact',
    },
    {
      Header: '',
      accessor: (row) => {
        return (
          <div className="p-4 flex items-center gap-4">
            {row.Status === 'Created' ? (
              <>
                <div className="relative w-10 h-10 flex items-center justify-center group">
                  <Image
                    src={resendInviteIcon}
                    width={24}
                    height={24}
                    alt="Resend invite"
                    className={`w-6 h-6 ${
                      isReinvitingUser &&
                      selectedUserData.Id === row.Id &&
                      'opacity-30'
                    } ${
                      isReinvitingUser ? 'cursor-not-allowed' : 'cursor-pointer'
                    }`}
                    onClick={() => {
                      if (isReinvitingUser) return;
                      setSelectedUserData(row);
                      resendInvite(row);
                    }}
                  />
                  <RocTooltip bottom="100%">Resend invite</RocTooltip>
                </div>
              </>
            ) : (
              <div className="relative w-10 h-10 flex items-center justify-center group">
                <Image
                  src={editProfileIcon}
                  width={24}
                  height={24}
                  alt="Edit user details"
                  className="cursor-pointer w-6 h-6"
                  onClick={() => {
                    setSelectedUserData(row);
                    setShowEditUserProfileScreen(true);
                  }}
                />
                <RocTooltip bottom="100%">Edit Profile</RocTooltip>
              </div>
            )}
          </div>
        );
      },
      id: 'actions',
    },
    {
      Header: '',
      id: 'status',
      accessor: (row) => {
        return row.Status === 'Active' || row.Status === 'Inactive' ? (
          <>
            <div className="py-7 pr-6 pl-4 flex justify-end">
              <Switch
                checked={row.Status === 'Active'}
                disabled={isChangingUserStatus}
                onChange={(e) => {
                  if (isChangingUserStatus) return;
                  setSelectedUserData(row);
                  if (e) {
                    activateUser(row);
                  } else {
                    setShowDeactivateUserModal(true);
                  }
                }}
                className={`${
                  row.Status === 'Active' ? 'bg-green-500' : 'bg-gray-300'
                } relative inline-flex h-6 w-11 items-center rounded-full ${
                  isChangingUserStatus
                    ? 'opacity-50 cursor-default pointer-events-none'
                    : 'opacity-100'
                }`}
              >
                <span className="sr-only">Change user status</span>
                <span
                  className={`${
                    row.Status === 'Active' ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                />
              </Switch>
            </div>
          </>
        ) : null;
      },
    },
  ];
  const columns = useMemo(
    () => columnsRaw,
    [
      data.length,
      isReinvitingUser,
      isChangingUserStatus,
      showEditUserProfileScreen,
    ],
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable({ columns, data });

  return (
    <>
      <table {...getTableProps()} className="w-full text-left break-all">
        <thead className="bg-gray-100 font-medium text-base leading-[22px] text-gray-400">
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps()} className="py-3 px-4">
                  {column.render('Header')}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody
          {...getTableBodyProps()}
          className="font-normal text-base leading-[22px] text-gray-600"
        >
          {rows.map((row) => {
            prepareRow(row);
            return (
              <tr
                {...row.getRowProps()}
                className="border-b border-gray-200 hover:bg-gray-100"
              >
                {row.cells.map((cell) => {
                  return (
                    <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      {showEditUserProfileScreen && (
        <EditUserProfile
          setShow={setShowEditUserProfileScreen}
          userData={selectedUserData}
          setData={setData}
          setUserUpdateMsg={setUserUpdateMsg}
        />
      )}
      {userUpdateMsg?.msg ? (
        <Notification
          entityUpdateMsg={userUpdateMsg}
          setEntityUpdateMsg={setUserUpdateMsg}
        />
      ) : null}
      {showDeactivateUserModal && (
        <DeactivateUserModal
          userData={selectedUserData}
          show={showDeactivateUserModal}
          setShow={setShowDeactivateUserModal}
          setData={setData}
        />
      )}
    </>
  );
}
