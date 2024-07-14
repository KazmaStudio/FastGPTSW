import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Box,
  FormControl,
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
  Text,
  Input,
  InputGroup,
  InputRightElement,
  ButtonGroup,
  Button,
  IconButton,
  FormErrorMessage,
  Icon
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure
} from '@chakra-ui/react';
import {
  Editable,
  EditableInput,
  EditableTextarea,
  EditablePreview,
  useEditableControls
} from '@chakra-ui/react';
import {
  CheckIcon,
  EditIcon,
  CloseIcon,
  ChevronRightIcon,
  ViewIcon,
  ViewOffIcon
} from '@chakra-ui/icons';
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
import AppListContextProvider, { AppListContext } from '@/pages/app/list/component/context';
import { useSendCode } from '@/web/support/user/hooks/useSendCode';
import { getMyApps } from '@/web/core/app/api';
import { AppDetailType, AppListItemType } from '@fastgpt/global/core/app/type';
import { AppTypeEnum } from '@fastgpt/global/core/app/constants';
import { updateUserInfo } from '@/web/support/user/api';
import { useToast } from '@fastgpt/web/hooks/useToast';
import CreateModal from '@/pages/app/list/component/CreateModal';
import type { UserType } from '@fastgpt/global/support/user/type.d';
import { AddIcon } from '@chakra-ui/icons';

export enum NavbarTypeEnum {
  normal = 'normal',
  small = 'small'
}

const Navbar = ({ unread, userInfoLocal }: { unread: number; userInfoLocal: UserType | null }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { parentId = null } = router.query as { parentId?: string | null };
  const [showP, setShowP] = useState<boolean>(false);
  const handleShowPClick = () => setShowP(!showP);
  const [showP2, setShowP2] = useState<boolean>(false);
  const handleShowP2Click = () => setShowP2(!showP2);
  const [accountPage, setAccountPage] = useState<number>(0);

  const { userInfo, appListInfo, setAppListInfo, setUserInfo } = useUserStore();
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
    label: '我的知识',
    icon: 'core/dataset/datasetLight',
    activeIcon: 'core/dataset/datasetFill',
    link: `/dataset/list`,
    logo: '/imgs/home/book.png',
    activeLink: ['/dataset/list', '/dataset/detail']
  };
  const accountNavItem = {
    label: '我的账号',
    icon: 'support/user/userLight',
    activeIcon: 'support/user/userFill',
    link: '/account',
    logo: '/imgs/home/user.png',
    activeLink: ['/account']
  };

  const {
    isOpen: isOpenCreateModal,
    onOpen: onOpenCreateModal,
    onClose: onCloseCreateModal
  } = useDisclosure();

  const chatHistoriesNavItem = {
    label: '会话记录',
    icon: 'support/user/userLight',
    activeIcon: 'support/user/userFill',
    link: '/chatHistory',
    logo: '/imgs/home/clock.png',
    activeLink: ['/chatHistory']
  };

  let navItemList = [chatHistoriesNavItem, accountNavItem];

  let navbarList = [];
  if (userInfo?.team.permission.isOwner) {
    navItemList.splice(0, 0, dataSetNavItem);
  }
  navbarList = useMemo(() => navItemList, [lastChatAppId, lastChatId, t, navItemList]);

  useEffect(() => {
    getMyApps({ parentId }).then((result) => {
      setAppListInfo(result);
    });
  }, []);

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

  const { isOpen, onOpen, onClose } = useDisclosure();

  interface LoginFormType {
    username: string;
    password: string;
    checkPassword: string;
    phone: string;
    code: string;
    userId?: string;
  }

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    setValue,
    formState: { errors }
  } = useForm<LoginFormType>({
    mode: 'onBlur'
  });

  const { sendCodeText, sendCode, codeCountDown } = useSendCode();

  const phoneFilter = (input: string | undefined) => {
    if (typeof input !== 'string') return;
    return input.substring(0, 3) + '****' + input.substring(input.length - 4);
  };

  const onclickSendCode = useCallback(async () => {
    const check = await trigger('phone');
    if (!check) return;
    sendCode({
      phone: getValues('phone'),
      type: 'changePhone'
    });
  }, [getValues, sendCode]);

  const onclickSendCode4ResetPassword = useCallback(async () => {
    if (userInfoLocal?.phone) {
      sendCode({
        phone: userInfoLocal?.phone,
        type: 'findPassword'
      });
    }
  }, [getValues, sendCode]);

  const [requesting, setRequesting] = useState(false);
  const { toast } = useToast();

  const onclickUpdatePhone = useCallback(
    async ({ phone, code, userId }: any) => {
      setRequesting(true);

      try {
        await updateUserInfo({
          code,
          type: 1,
          password: '',
          phone,
          userId: userInfoLocal?._id
        });

        let newUserInfo = { ...userInfoLocal };
        newUserInfo.phone = phone;

        // @ts-ignore
        setUserInfo(newUserInfo);

        setAccountPage(0);

        toast({
          title: `修改成功`,
          status: 'success'
        });
      } catch (error: any) {
        toast({
          title: error.message || '修改异常',
          status: 'error'
        });
      }
      setRequesting(false);
    },
    [toast]
  );

  const onclickUpdateUsername = useCallback(
    async ({ username, userId }: any) => {
      setRequesting(true);
      try {
        await updateUserInfo({
          type: 0,
          password: '',
          username,
          userId: userInfoLocal?._id
        });

        let newUserInfo = { ...userInfoLocal };
        newUserInfo.username = username;

        // @ts-ignore
        setUserInfo(newUserInfo);

        setAccountPage(0);

        toast({
          title: `修改成功`,
          status: 'success'
        });
      } catch (error: any) {
        toast({
          title: error.message || '修改异常',
          status: 'error'
        });
      }
      setRequesting(false);
    },
    [toast]
  );

  const onclickUpdatePassword = useCallback(
    async ({ phone, code, userId, password }: any) => {
      setRequesting(true);
      try {
        await updateUserInfo({
          code,
          type: 2,
          password: password,
          phone: userInfoLocal?.phone,
          userId: userInfoLocal?._id
        });

        setAccountPage(0);

        toast({
          title: `修改成功`,
          status: 'success'
        });
      } catch (error: any) {
        toast({
          title: error.message || '修改异常',
          status: 'error'
        });
      }
      setRequesting(false);
    },
    [toast]
  );

  function EditableControls() {
    const { isEditing, getSubmitButtonProps, getCancelButtonProps, getEditButtonProps } =
      useEditableControls();

    return isEditing ? (
      // <ButtonGroup p="6px" justifyContent="center" variant={'ghost'} ml='300px'>
      //   <IconButton
      //     icon={<CheckIcon />}
      //     {...getSubmitButtonProps()}
      //     aria-label=""
      //     {...((userInfo?.username === getValues('username') || (getValues('username') === ''))
      //       ? {}
      //       : { onclick: handleSubmit(onclickUpdateUsername) })}
      //   />
      //   <IconButton icon={<CloseIcon />} {...getCancelButtonProps()} aria-label="" />
      // </ButtonGroup>
      <Box h="35px"></Box>
    ) : (
      <IconButton
        isLoading={requesting}
        variant={'ghost'}
        icon={<EditIcon />}
        {...getEditButtonProps()}
        aria-label=""
      />
    );
  }

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
      {userInfo?.team.permission.isOwner && (
        <Button leftIcon={<AddIcon />} w="184px" h="40px" mb="12px" onClick={onOpenCreateModal}>
          新建应用
        </Button>
      )}
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
          <AccordionPanel pb={4} marginInline="none" mx="-16px" maxH={'456px'} overflow={'auto'}>
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
            {...(item.link !== router.asPath && item.link !== '/account'
              ? {
                  onClick: () => router.push(item.link)
                }
              : {})}
            {...(item.link === '/account'
              ? {
                  onClick: onOpen
                }
              : {})}
          >
            <Image src={item.logo} w="18px" h="18px"></Image>

            {/* <MyIcon
              name={
                item.activeLink.includes(router.pathname)
                  ? (item.activeIcon as any)
                  : (item.icon as any)
              }
              width={'20px'}
              height={'20px'}
            /> */}
            <Box ml="12px" flex="1" lineHeight="18px">
              {item.label}
            </Box>
          </Box>
        ))}

        {isOpenCreateModal && (
          <AppListContextProvider>
            <CreateModal onClose={onCloseCreateModal} />
          </AppListContextProvider>
        )}

        <Modal
          isCentered
          onClose={() => {
            onClose();
            setAccountPage(0);
          }}
          isOpen={isOpen}
          size={'2xl'}
          motionPreset="slideInBottom"
        >
          <ModalOverlay />
          <ModalContent
            bg={`url('/imgs/modal/accountBG.png') no-repeat`}
            backgroundSize={'cover'}
            minH={'426px'}
          >
            <ModalCloseButton />
            <ModalBody>
              {accountPage === 0 ? (
                <Flex flexDirection={'column'} alignItems={'center'} mt={'48px'}>
                  <Avatar src={userInfo?.avatar} borderRadius={'44px'} w={'88px'} h={'88px'} />
                  <Editable
                    display={'flex'}
                    textAlign="center"
                    justifyContent={'center'}
                    defaultValue={userInfo?.username}
                    mt={'16px'}
                    fontSize={'18px'}
                    fontWeight={700}
                    w="400px"
                    isPreviewFocusable={false}
                    // onSubmit={async () => {
                    //   if (userInfo?.username !== getValues('username')) {
                    //     onclickUpdateUsername({
                    //       username: getValues('username'),
                    //       userId: userInfo?._id
                    //     });
                    //   }
                    // }}
                  >
                    <EditablePreview mr="20px" ml="60px" />
                    {/* Here is the custom input */}
                    <FormControl isInvalid={!!errors.username} position={'absolute'} w={'200px'}>
                      <Input
                        fontSize={'18px'}
                        fontWeight={700}
                        as={EditableInput}
                        bg={'white'}
                        placeholder={'请输入新用户名'}
                        {...register('username', {
                          required: true
                        })}
                      ></Input>
                    </FormControl>
                    <EditableControls />
                  </Editable>
                  <Flex
                    w="100%"
                    h="64px"
                    p="24px"
                    border={'1px solid #DDE3E8'}
                    borderRadius={'8px'}
                    mb="24px"
                    mt="36px"
                    bg="white"
                    justifyContent={'space-between'}
                    cursor={'pointer'}
                    onClick={() => {
                      setAccountPage(1);
                    }}
                  >
                    <Box fontSize="14px" h="16px" lineHeight={'16px'} color="rgba(0,0,0,0.4)">
                      绑定手机号
                    </Box>
                    <Flex>
                      <Box fontSize="14px" h="16px" lineHeight={'16px'} color="rgba(0,0,0,0.8)">
                        {phoneFilter(userInfo?.phone)}
                      </Box>
                      <ChevronRightIcon />
                    </Flex>
                  </Flex>
                  <Flex
                    w="100%"
                    h="64px"
                    p="24px"
                    border={'1px solid #DDE3E8'}
                    borderRadius={'8px'}
                    bg="white"
                    justifyContent={'space-between'}
                  >
                    <Box fontSize="14px" h="16px" lineHeight={'16px'} color="rgba(0,0,0,0.4)">
                      所属部门
                    </Box>
                    <Flex>
                      <Box fontSize="14px" h="16px" lineHeight={'16px'} color="rgba(0,0,0,0.8)">
                        {userInfo?.department}
                      </Box>
                    </Flex>
                  </Flex>
                </Flex>
              ) : accountPage === 1 ? (
                <Flex flexDirection={'column'} p="8px">
                  <Box fontSize={'20px'} color={'black'} mb="32px">
                    变更手机号
                  </Box>
                  <Box
                    w="100%"
                    h="64px"
                    p="24px"
                    fontSize="14px"
                    border={'1px solid #DDE3E8'}
                    borderRadius={'8px'}
                    bg="#F0F2F5"
                    mb="24px"
                    lineHeight={'16px'}
                  >
                    {userInfo?.phone}
                  </Box>
                  <FormControl isInvalid={!!errors.phone}>
                    <Input
                      w="100%"
                      h="64px"
                      p="24px"
                      fontSize="14px"
                      border={'1px solid #DDE3E8'}
                      borderRadius={'8px'}
                      mb="24px"
                      bg={'white'}
                      placeholder={'请输入新手机号'}
                      {...register('phone', {
                        required: '手机号不能为空',
                        pattern: {
                          value: /(^1[3456789]\d{9}$)/,
                          message: '手机号格式错误'
                        }
                      })}
                    ></Input>
                    <FormErrorMessage mt="-24px" position={'absolute'}>
                      {errors.phone?.message}
                    </FormErrorMessage>
                  </FormControl>
                  <FormControl
                    isInvalid={!!errors.code}
                    display={'flex'}
                    alignItems={'center'}
                    position={'relative'}
                  >
                    <Input
                      w="100%"
                      h="64px"
                      p="24px"
                      fontSize="14px"
                      border={'1px solid #DDE3E8'}
                      borderRadius={'8px'}
                      bg="white"
                      mb="24px"
                      flex={1}
                      maxLength={6}
                      placeholder="请输入验证码"
                      {...register('code', {
                        required: true
                      })}
                    ></Input>
                    <Box
                      position={'absolute'}
                      right={3}
                      zIndex={1}
                      top={0}
                      lineHeight={'64px'}
                      fontSize={'sm'}
                      {...(codeCountDown > 0 // || errors.phone
                        ? {
                            color: 'myGray.500'
                          }
                        : {
                            color: 'primary.700',
                            cursor: 'pointer',
                            onClick: onclickSendCode
                          })}
                    >
                      {sendCodeText}
                    </Box>
                    <FormErrorMessage mt="-24px" position={'absolute'}>
                      {errors.code?.message}
                    </FormErrorMessage>
                  </FormControl>
                  <Button
                    type="submit"
                    h="48px"
                    w={'100%'}
                    colorScheme="blue"
                    isLoading={requesting}
                    onClick={handleSubmit(onclickUpdatePhone)}
                  >
                    确定
                  </Button>
                </Flex>
              ) : (
                <Flex flexDirection={'column'} p="8px">
                  <Box fontSize={'20px'} color={'black'} mb="32px">
                    重置密码
                  </Box>
                  <Box
                    w="100%"
                    h="64px"
                    p="24px"
                    fontSize="14px"
                    border={'1px solid #DDE3E8'}
                    borderRadius={'8px'}
                    bg="#F0F2F5"
                    mb="24px"
                    lineHeight={'16px'}
                  >
                    {userInfo?.phone}
                  </Box>
                  <FormControl
                    isInvalid={!!errors.code}
                    display={'flex'}
                    alignItems={'center'}
                    position={'relative'}
                  >
                    <Input
                      w="100%"
                      h="64px"
                      p="24px"
                      fontSize="14px"
                      border={'1px solid #DDE3E8'}
                      borderRadius={'8px'}
                      bg="white"
                      mb="24px"
                      flex={1}
                      maxLength={6}
                      placeholder="请输入验证码"
                      {...register('code', {
                        required: true
                      })}
                    ></Input>
                    <Box
                      position={'absolute'}
                      right={3}
                      zIndex={1}
                      top={0}
                      lineHeight={'64px'}
                      fontSize={'sm'}
                      {...(codeCountDown > 0 || errors.phone
                        ? {
                            color: 'myGray.500'
                          }
                        : {
                            color: 'primary.700',
                            cursor: 'pointer',
                            onClick: onclickSendCode4ResetPassword
                          })}
                    >
                      {sendCodeText}
                    </Box>
                  </FormControl>
                  <FormControl isInvalid={!!errors.password}>
                    <InputGroup size="md">
                      <Input
                        w="100%"
                        h="64px"
                        p="24px"
                        fontSize="14px"
                        border={'1px solid #DDE3E8'}
                        borderRadius={'8px'}
                        mb="24px"
                        bg={'white'}
                        type={showP ? 'text' : 'password'}
                        placeholder={'请输入新密码'}
                        {...register('password', {
                          required: '密码不能为空',
                          minLength: {
                            value: 8,
                            message: '密码最少 8 位最多 16 位'
                          },
                          maxLength: {
                            value: 16,
                            message: '密码最少 8 位最多 16 位'
                          }
                        })}
                      ></Input>
                      <InputRightElement width="4.5rem">
                        <Button
                          onClick={handleShowPClick}
                          variant={'ghost'}
                          h={'48px'}
                          mt="24px"
                          color={'gray'}
                        >
                          {showP ? <ViewIcon></ViewIcon> : <ViewOffIcon></ViewOffIcon>}
                        </Button>
                      </InputRightElement>
                    </InputGroup>
                    <FormErrorMessage mt="-24px" position={'absolute'}>
                      {errors.checkPassword?.message}
                    </FormErrorMessage>
                  </FormControl>
                  <FormControl isInvalid={!!errors.checkPassword}>
                    <InputGroup size="md">
                      <Input
                        w="100%"
                        h="64px"
                        type={showP2 ? 'text' : 'password'}
                        p="24px"
                        fontSize="14px"
                        border={'1px solid #DDE3E8'}
                        borderRadius={'8px'}
                        mb="24px"
                        bg={'white'}
                        placeholder={'确认密码'}
                        {...register('checkPassword', {
                          validate: (val) =>
                            getValues('password') === val ? true : '两次密码不一致'
                        })}
                      ></Input>
                      <InputRightElement width="4.5rem">
                        <Button
                          onClick={handleShowP2Click}
                          variant={'ghost'}
                          h={'48px'}
                          mt="24px"
                          color={'gray'}
                        >
                          {showP2 ? <ViewIcon></ViewIcon> : <ViewOffIcon></ViewOffIcon>}
                        </Button>
                      </InputRightElement>
                    </InputGroup>
                    <FormErrorMessage mt="-24px" position={'absolute'}>
                      {errors.password?.message}
                    </FormErrorMessage>
                  </FormControl>
                  <Button
                    type="submit"
                    h="48px"
                    w={'100%'}
                    colorScheme="blue"
                    isLoading={requesting}
                    onClick={handleSubmit(onclickUpdatePassword)}
                  >
                    确定
                  </Button>
                </Flex>
              )}
            </ModalBody>
            {accountPage === 0 ? (
              <ModalFooter mb="36px">
                <Button
                  variant="outline"
                  colorScheme="gray"
                  bg="white"
                  fontSize={'16px'}
                  px={'22px'}
                  py="14px"
                  h="48px"
                  mr={3}
                  onClick={() => {
                    setAccountPage(2);
                  }}
                >
                  重置密码
                </Button>
                <Button
                  fontSize={'16px'}
                  px={'22px'}
                  py="14px"
                  h="44px"
                  colorScheme="blue"
                  onClick={handleSubmit(onclickUpdateUsername)}
                >
                  更新
                </Button>
              </ModalFooter>
            ) : (
              <></>
            )}
          </ModalContent>
        </Modal>
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
