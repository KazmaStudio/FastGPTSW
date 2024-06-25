import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  BoxProps,
  Flex,
  Link,
  LinkProps,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Image,
  Text
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useUserStore } from '@/web/support/user/useUserStore';
import { useChatStore } from '@/web/core/chat/storeChat';
import { HUMAN_ICON } from '@fastgpt/global/common/system/constants';
import NextLink from 'next/link';
import Badge from '../Badge';
import Avatar from '../Avatar';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useTranslation } from 'next-i18next';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import MyTooltip from '@fastgpt/web/components/common/MyTooltip';
import { getDocPath } from '@/web/common/system/doc';
import { AppListContext } from '@/pages/app/list/component/context';

import { getMyApps } from '@/web/core/app/api';
import { AppDetailType, AppListItemType } from '@fastgpt/global/core/app/type';
import { AppTypeEnum } from '@fastgpt/global/core/app/constants';

export enum NavbarTypeEnum {
  normal = 'normal',
  small = 'small'
}

const Navbar = ({ unread }: { unread: number }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { parentId = null } = router.query as { parentId?: string | null };

  // const [myApps, setMyApps] = useState<AppListItemType[]>([]);
  // const [myApps, setMyApps] = useState<AppListItemType[]>([]);

  const { userInfo, appListInfo } = useUserStore();
  const { gitStar, feConfigs } = useSystemStore();
  const { lastChatAppId, lastChatId } = useChatStore();
  const chatNavItem = {
    label: t('navbar.Chat'),
    icon: 'core/chat/chatLight',
    activeIcon: 'core/chat/chatFill',
    link: `/chat?appId=${lastChatAppId}&chatId=${lastChatId}`,
    activeLink: ['/chat']
  };
  const appNavItem = {
    label: t('navbar.Apps'),
    icon: 'core/app/aiLight',
    activeIcon: 'core/app/aiFill',
    link: `/app/list`,
    activeLink: ['/app/list', '/app/detail']
  };
  const pluginNavItem = {
    label: t('navbar.Plugin'),
    icon: 'common/navbar/pluginLight',
    activeIcon: 'common/navbar/pluginFill',
    link: `/plugin/list`,
    activeLink: ['/plugin/list', '/plugin/edit']
  };
  const dataSetNavItem = {
    label: t('navbar.Datasets'),
    icon: 'core/dataset/datasetLight',
    activeIcon: 'core/dataset/datasetFill',
    link: `/dataset/list`,
    activeLink: ['/dataset/list', '/dataset/detail']
  };
  const accountNavItem = {
    label: t('navbar.Account'),
    icon: 'support/user/userLight',
    activeIcon: 'support/user/userFill',
    link: '/account',
    activeLink: ['/account']
  };

  let navItemList = [accountNavItem];

  let navbarList = [];
  if (userInfo?.team.permission.isOwner) {
    navItemList.splice(0, 0, dataSetNavItem);
  }
  navbarList = useMemo(() => navItemList, [lastChatAppId, lastChatId, t, navItemList]);

  // useEffect(() => {
  //   getMyApps({ parentId }).then((result) => {
  //     setMyApps(result);
  //   });
  // }, []);

  const itemStyles: BoxProps & LinkProps = {
    my: 3,
    mx: '8px',
    display: 'flex',
    cursor: 'pointer',
    h: '40px',
    borderRadius: '8px',
    paddingLeft: '16px',
    paddingTop: '12px'
  };
  const hoverStyle: LinkProps = {
    _hover: {
      bg: 'myGray.05',
      color: 'primary.600'
    }
  };

  return (
    <Flex
      flexDirection={'column'}
      alignItems={'center'}
      bg={'white'}
      pt={6}
      h={'100%'}
      w={'100%'}
      userSelect={'none'}
    >
      {/* logo */}
      {/* <Box
        flex={'0 0 auto'}
        mb={5}
        border={'2px solid #fff'}
        borderRadius={'50%'}
        overflow={'hidden'}
        cursor={'pointer'}
        onClick={() => router.push('/account')}
      >
        <Avatar
          w={'36px'}
          h={'36px'}
          src={userInfo?.avatar}
          fallbackSrc={HUMAN_ICON}
          borderRadius={'50%'}
        />
      </Box> */}
      <Accordion defaultIndex={[0]} allowMultiple border="none" w={'100%'} overflow="hidden">
        <AccordionItem border="none" mx="8px" px="0px" bg="#F0F2F5" borderRadius="8px">
          <AccordionButton>
            <Box as="span" flex="1" textAlign="left" display="flex" borderRadius="8px">
              <Image src="/imgs/app/grid.png" w={'18px'} h={'18px'} />
              <Text ml="12px" lineHeight="18px">
                我的应用
              </Text>
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4} marginInline="none" mx="-16px">
            {appListInfo.map((app) => (
              <Box
                _hover={{ bg: 'rgba(12,83,238,0.1)' }}
                bg={
                  app._id === lastChatAppId && ['/chat', '/app/detail'].includes(router.pathname)
                    ? 'rgba(12,83,238,0.1)'
                    : 'transparent'
                }
                borderRadius="8px"
                flex="1"
                display="flex"
                textAlign="left"
                cursor="pointer"
                p="8px"
                px="16px"
                _notLast={{ mb: '14px' }}
                key={app._id}
                onClick={() => {
                  if (app.type === AppTypeEnum.folder) {
                    router.push({
                      query: {
                        parentId: app._id
                      }
                    });
                  } else if (app.permission.hasWritePer) {
                    router.push(`/app/detail?appId=${app._id}`);
                  } else {
                    router.push(`/chat?appId=${app._id}`);
                  }
                }}
              >
                <Image src={app.avatar} w="18px" h="18px" />
                <Text
                  ml="12px"
                  lineHeight="18px"
                  color={
                    app._id === lastChatAppId && ['/chat', '/app/detail'].includes(router.pathname)
                      ? '#0C53EE'
                      : '#6E6E80'
                  }
                >
                  {app.name}
                </Text>
              </Box>
            ))}
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
      {/* 导航列表 */}
      <Box w="100%">
        {navbarList.map((item) => (
          <Box
            key={item.link}
            {...itemStyles}
            {...(item.activeLink.includes(router.pathname)
              ? {
                  color: '#0C53EE',
                  bg: 'rgba(12,83,238,0.1)',
                  _hover: {
                    bg: '#F0F2F5'
                  }
                  // boxShadow:
                  //   '0px 0px 1px 0px rgba(19, 51, 107, 0.08), 0px 4px 4px 0px rgba(19, 51, 107, 0.05)'
                }
              : {
                  color: 'myGray.500',
                  _hover: {
                    bg: '#F0F2F5'
                  }
                })}
            {...(item.link !== router.asPath
              ? {
                  onClick: () => router.push(item.link)
                }
              : {})}
          >
            <MyIcon
              name={
                item.activeLink.includes(router.pathname)
                  ? (item.activeIcon as any)
                  : (item.icon as any)
              }
              width={'20px'}
              height={'20px'}
            />
            <Box ml="12px" flex="1" lineHeight="18px">
              {item.label}
            </Box>
          </Box>
        ))}
      </Box>

      {unread > 0 && (
        <Box>
          <Link
            as={NextLink}
            {...itemStyles}
            {...hoverStyle}
            prefetch
            href={`/account?currentTab=inform`}
            mb={0}
            color={'myGray.500'}
          >
            <Badge count={unread}>
              <MyIcon name={'support/user/informLight'} width={'22px'} height={'22px'} />
            </Badge>
          </Link>
        </Box>
      )}
      {(feConfigs?.docUrl || feConfigs?.chatbotUrl) && (
        <MyTooltip label={t('common.system.Use Helper')} placement={'right-end'}>
          <Link
            {...itemStyles}
            {...hoverStyle}
            href={feConfigs?.chatbotUrl || getDocPath('/docs/intro')}
            target="_blank"
            mb={0}
            color={'myGray.500'}
          >
            <MyIcon name={'common/courseLight'} width={'24px'} height={'24px'} />
          </Link>
        </MyTooltip>
      )}
      {feConfigs?.show_git && (
        <MyTooltip label={`Git Star: ${gitStar}`} placement={'right-end'}>
          <Link
            as={NextLink}
            href="https://github.com/labring/FastGPT"
            target={'_blank'}
            {...itemStyles}
            {...hoverStyle}
            mt={0}
            color={'myGray.500'}
          >
            <MyIcon name={'common/gitInlight'} width={'26px'} height={'26px'} />
          </Link>
        </MyTooltip>
      )}
    </Flex>
  );
};

export default Navbar;
