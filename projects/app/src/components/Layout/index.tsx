import React, { useEffect, useMemo, useState } from 'react';
import { Box, Flex, Text, Image, Button, Icon } from '@chakra-ui/react';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuItemOption,
  MenuGroup,
  MenuOptionGroup,
  MenuDivider
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useLoading } from '@fastgpt/web/hooks/useLoading';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { throttle } from 'lodash';
import { useQuery } from '@tanstack/react-query';
import { useUserStore } from '@/web/support/user/useUserStore';
import { getUnreadCount } from '@/web/support/user/inform/api';
import Avatar from '@/components/Avatar';
import dynamic from 'next/dynamic';
import { useConfirm } from '@fastgpt/web/hooks/useConfirm';
import Auth from './auth';

const Navbar = dynamic(() => import('./navbar'));
const NavbarThin = dynamic(() => import('./navbarThin'));

const NavbarPhone = dynamic(() => import('./navbarPhone'));
const UpdateInviteModal = dynamic(() => import('@/components/support/user/team/UpdateInviteModal'));
const NotSufficientModal = dynamic(() => import('@/components/support/wallet/NotSufficientModal'));
const SystemMsgModal = dynamic(() => import('@/components/support/user/inform/SystemMsgModal'));
const ImportantInform = dynamic(() => import('@/components/support/user/inform/ImportantInform'));

const pcUnShowLayoutRoute: Record<string, boolean> = {
  '/': true,
  '/login': true,
  '/login/provider': true,
  '/login/fastlogin': true,
  '/chat/share': true,
  '/chat/team': true,
  '/app/edit': true,
  '/chat': false,
  '/tools/price': true,
  '/price': true
};
const phoneUnShowLayoutRoute: Record<string, boolean> = {
  '/': true,
  '/login': true,
  '/login/provider': true,
  '/login/fastlogin': true,
  '/chat/share': true,
  '/chat/team': true,
  '/tools/price': true,
  '/price': true
};

const Layout = ({ children }: { children: JSX.Element }) => {
  const router = useRouter();
  const { Loading } = useLoading();
  const { loading, setScreenWidth, isPc, feConfigs, isNotSufficientModal } = useSystemStore();
  const { userInfo, setUserInfo } = useUserStore();
  const [closeNav, setCloseNav] = useState<boolean>(false);

  const isChatPage = useMemo(
    () => router.pathname === '/chat' && Object.values(router.query).join('').length !== 0,
    [router.pathname, router.query]
  );

  // listen screen width
  useEffect(() => {
    const resize = throttle(() => {
      setScreenWidth(document.documentElement.clientWidth);
    }, 300);

    window.addEventListener('resize', resize);

    resize();

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [setScreenWidth]);

  const { data, refetch: refetchUnRead } = useQuery(['getUnreadCount'], getUnreadCount, {
    enabled: !!userInfo && !!feConfigs.isPlus,
    refetchInterval: 10000
  });
  const unread = data?.unReadCount || 0;
  const importantInforms = data?.importantInforms || [];

  const isHideNavbar = !!pcUnShowLayoutRoute[router.pathname];
  const { openConfirm, ConfirmModal } = useConfirm({
    content: '确认退出登录？'
  });
  return (
    <>
      <Box h={'100%'} bg={'white'}>
        {isPc === true && (
          <>
            {isHideNavbar ? (
              <Auth>{children}</Auth>
            ) : (
              <Box h={'100%'} display="flex" flexDirection="column">
                <Image src="/imgs/app/title.png" h={'56px'} />
                <Box
                  h="56px"
                  display="flex"
                  px="37px"
                  bgColor="transparent"
                  py="12px"
                  mt="-56px"
                  justifyContent="space-between"
                  borderBottom="1px solid #F0F2F5"
                >
                  <Box
                    display="flex"
                    lineHeight="33px"
                    fontSize="22px"
                    fontWeight="bold"
                    fontFamily="Alimama ShuHeiTi, Alimama ShuHeiTi;"
                    cursor="pointer"
                    onClick={() => {
                      router.push('/app/list');
                    }}
                  >
                    <Image src="/imgs/logoLabel.png" h={'33px'} />
                    {/* <Text>
                      {feConfigs?.systemTitle}
                    </Text> */}
                  </Box>
                  {/* <Box
                    cursor="pointer"
                    onClick={() => {
                      router.push('/account');
                    }}
                  >
                    <Avatar src={userInfo?.avatar} w={'33px'} />
                  </Box> */}
                  <Menu>
                    <MenuButton as={Button} variant={'ghost'}>
                      <Avatar src={userInfo?.avatar} w={'33px'} />
                    </MenuButton>
                    <MenuList>
                      <MenuItem
                        onClick={() => {
                          openConfirm(() => {
                            setUserInfo(null);
                            router.replace('/login');
                          })();
                        }}
                      >
                        登出
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Box>
                <Box flex={1} display="flex" overflow={'overlay'}>
                  {closeNav && (
                    <Box h={'100%'} left={0} top={0} w={'64px'}>
                      {userInfo && <NavbarThin unread={unread} userInfoLocal={userInfo} />}
                    </Box>
                  )}
                  {!closeNav && (
                    <Box h={'100%'} left={0} top={0} w={'200px'}>
                      {userInfo && <Navbar unread={unread} userInfoLocal={userInfo} />}
                    </Box>
                  )}
                  <Flex position={'absolute'} bottom={'0px'} w="64px" h="64px">
                    <Button
                      variant={'ghost'}
                      ml={'8px'}
                      leftIcon={
                        <Image
                          src="/imgs/home/thin.png"
                          width={'12px'}
                          transform={closeNav ? 'rotate(180deg)' : ''}
                        ></Image>
                      }
                      onClick={() => {
                        setCloseNav(!closeNav);
                      }}
                    >
                      {closeNav ? '展开' : '收起'}
                    </Button>
                  </Flex>
                  <Box h={'100%'} ml={'8px'} flex={1} overflow={'overlay'}>
                    <Auth>{children}</Auth>
                  </Box>
                </Box>
              </Box>
            )}
          </>
        )}
        {/* {isPc === false && (
          <>
            <Box h={'100%'} display={['block', 'none']}>
              {phoneUnShowLayoutRoute[router.pathname] || isChatPage ? (
                <Auth>{children}</Auth>
              ) : (
                <Flex h={'100%'} flexDirection={'column'}>
                  <Box flex={'1 0 0'} h={0}>
                    <Auth>{children}</Auth>
                  </Box>
                  <Box h={'50px'} borderTop={'1px solid rgba(0,0,0,0.1)'}>
                    <NavbarPhone unread={unread} />
                  </Box>
                </Flex>
              )}
            </Box>
          </>
        )} */}
      </Box>
      {feConfigs?.isPlus && (
        <>
          {!!userInfo && <UpdateInviteModal />}
          {isNotSufficientModal && <NotSufficientModal />}
          {!!userInfo && <SystemMsgModal />}
          {!!userInfo && importantInforms.length > 0 && (
            <ImportantInform informs={importantInforms} refetch={refetchUnRead} />
          )}
        </>
      )}
      <ConfirmModal />
      <Loading loading={loading} zIndex={999999} />
    </>
  );
};

export default Layout;
