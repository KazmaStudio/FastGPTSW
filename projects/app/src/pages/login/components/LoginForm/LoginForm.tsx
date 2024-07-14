import React, { useState, Dispatch, useCallback } from 'react';
import {
  FormControl,
  Flex,
  Input,
  InputGroup,
  InputRightElement,
  Button,
  Box,
  Link,
  FormErrorMessage
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useForm } from 'react-hook-form';
import { LoginPageTypeEnum } from '@/web/support/user/login/constants';
import { postLogin } from '@/web/support/user/api';
import type { ResLogin } from '@/global/support/api/userRes';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { getDocPath } from '@/web/common/system/doc';
import { useTranslation } from 'next-i18next';
import FormLayout from './components/FormLayout';
import { Tabs, TabList, TabPanels, Tab, TabPanel, TabIndicator } from '@chakra-ui/react';
import { useSendCode } from '@/web/support/user/hooks/useSendCode';

interface Props {
  setPageType: Dispatch<`${LoginPageTypeEnum}`>;
  loginSuccess: (e: ResLogin) => void;
}

interface LoginFormType {
  username: string;
  password: string;
  phone: string;
  code: string;
}

const LoginForm = ({ setPageType, loginSuccess }: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { feConfigs } = useSystemStore();
  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors }
  } = useForm<LoginFormType>({
    mode: 'onBlur'
  });
  const [showP, setShowP] = useState<boolean>(false);
  const handleShowPClick = () => setShowP(!showP);
  const [requesting, setRequesting] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const { sendCodeText, sendCode, codeCountDown } = useSendCode();

  const onclickSendCode = useCallback(async () => {
    const check = await trigger('phone');
    if (!check) return;
    sendCode({
      phone: getValues('phone'),
      type: 'login'
    });
  }, [getValues, sendCode]);

  const onclickLoginByCode = useCallback(
    async ({ phone, code }: LoginFormType) => {
      setRequesting(true);
      try {
        loginSuccess(
          await postLogin({
            phone,
            code,
            username: '',
            password: '',
            type: 0
          })
        );
        toast({
          title: '登录成功',
          status: 'success'
        });
      } catch (error: any) {
        toast({
          title: error.message || '登录异常',
          status: 'error'
        });
      }
      setRequesting(false);
    },
    [loginSuccess, toast]
  );

  const onclickLoginByPassword = useCallback(
    async ({ username, password }: LoginFormType) => {
      setRequesting(true);
      try {
        loginSuccess(
          await postLogin({
            username,
            password,
            type: 1
          })
        );
        toast({
          title: '登录成功',
          status: 'success'
        });
      } catch (error: any) {
        toast({
          title: error.message || '登录异常',
          status: 'error'
        });
      }
      setRequesting(false);
    },
    [loginSuccess, toast]
  );

  const isCommunityVersion = feConfigs?.show_register === false && !feConfigs?.isPlus;

  const loginOptions = [
    feConfigs?.show_phoneLogin ? t('support.user.login.Phone number') : '',
    feConfigs?.show_emailLogin ? t('support.user.login.Email') : '',
    t('support.user.login.Username')
  ].filter(Boolean);

  return (
    <FormLayout setPageType={setPageType} pageType={LoginPageTypeEnum.passwordLogin}>
      <Tabs position="relative" variant="unstyled" onChange={(index) => setTabIndex(index)}>
        <TabList>
          <Tab
            w="280px"
            color="rgba(0,0,0,0.4)"
            fontSize="20px"
            fontWeight="600"
            _selected={{ color: 'black' }}
          >
            验证码登录
          </Tab>
          <Tab
            w="280px"
            color="rgba(0,0,0,0.4)"
            fontSize="20px"
            fontWeight="600"
            _selected={{ color: 'black' }}
          >
            账号密码登录
          </Tab>
        </TabList>
        <TabIndicator maxW="40px" height="3px" bg="#0C53EE" mx="60px" />
        <TabPanels>
          <TabPanel p="0px">
            <Box
              mt={'42px'}
              onKeyDown={(e) => {
                if (e.keyCode === 13 && !e.shiftKey && !requesting) {
                  handleSubmit(onclickLoginByCode)();
                }
              }}
            >
              <FormControl isInvalid={!!errors.phone}>
                <Input
                  bg={'myGray.50'}
                  placeholder={'请输入手机号'}
                  {...register('phone', {
                    required: tabIndex === 0 ? '手机号不能为空' : false,
                    pattern: {
                      value: /(^1[3456789]\d{9}$)/,
                      message: '手机号格式错误'
                    }
                  })}
                ></Input>
                <FormErrorMessage mt="0px" position={'absolute'}>
                  {errors.phone?.message}
                </FormErrorMessage>
              </FormControl>
              <FormControl
                mt={6}
                isInvalid={!!errors.code}
                display={'flex'}
                alignItems={'center'}
                position={'relative'}
              >
                <Input
                  bg={'myGray.50'}
                  flex={1}
                  maxLength={6}
                  placeholder="请输入验证码"
                  {...register('code', {
                    required: tabIndex === 0 ? '验证码不能为空' : false
                  })}
                ></Input>
                <Box
                  position={'absolute'}
                  right={3}
                  zIndex={1}
                  fontSize={'sm'}
                  {...(codeCountDown > 0 || errors.phone
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
                <FormErrorMessage mt="60px" position={'absolute'}>
                  {errors.code?.message}
                </FormErrorMessage>
              </FormControl>
              {feConfigs?.docUrl && (
                <Flex alignItems={'center'} mt={7} fontSize={'sm'}>
                  {t('support.user.login.Policy tip')}
                  <Link
                    ml={1}
                    href={getDocPath('/docs/agreement/terms/')}
                    target={'_blank'}
                    color={'primary.500'}
                  >
                    {t('support.user.login.Terms')}
                  </Link>
                  <Box mx={1}>{t('support.user.login.And')}</Box>
                  <Link
                    href={getDocPath('/docs/agreement/privacy/')}
                    target={'_blank'}
                    color={'primary.500'}
                  >
                    {t('support.user.login.Privacy')}
                  </Link>
                </Flex>
              )}

              <Button
                type="submit"
                mt={'84px'}
                w={'100%'}
                size={['md', 'md']}
                colorScheme="blue"
                isLoading={requesting}
                onClick={handleSubmit(onclickLoginByCode)}
              >
                {t('Login')}
              </Button>

              <Box
                textAlign={'center'}
                color={'#0C53EE'}
                cursor={'pointer'}
                _hover={{ textDecoration: 'underline' }}
                onClick={() => setPageType('register')}
                fontSize="sm"
                m="0 auto"
                mt="44px"
              >
                {'立即注册'}
              </Box>

              {/* {feConfigs?.show_register && (
                <>
                  <Flex align={'center'} justifyContent={'flex-end'} color={'primary.700'}>
                    <Box
                cursor={'pointer'}
                _hover={{ textDecoration: 'underline' }}
                onClick={() => setPageType('forgetPassword')}
                fontSize="sm"
              >
                {t('support.user.login.Forget Password')}
              </Box>
              <Box mx={3} h={'16px'} w={'1.5px'} bg={'myGray.250'}></Box>
                    <Box
                      cursor={'pointer'}
                      _hover={{ textDecoration: 'underline' }}
                      onClick={() => setPageType('register')}
                      fontSize="sm"
                    >
                      {t('support.user.login.Register')}
                    </Box>
                  </Flex>
                </>
              )} */}
            </Box>
          </TabPanel>
          <TabPanel p="0px">
            <Box
              mt={'42px'}
              onKeyDown={(e) => {
                if (e.keyCode === 13 && !e.shiftKey && !requesting) {
                  handleSubmit(onclickLoginByPassword)();
                }
              }}
            >
              <FormControl isInvalid={!!errors.username}>
                <Input
                  bg={'myGray.50'}
                  placeholder={'请输入用户名/手机号'}
                  {...register('username', {
                    required: tabIndex === 1 ? '请输入用户名/手机号不能为空' : false
                  })}
                ></Input>
                <FormErrorMessage mt="0px" position={'absolute'}>
                  {errors.username?.message}
                </FormErrorMessage>
              </FormControl>
              <FormControl mt={6} isInvalid={!!errors.password}>
                <InputGroup size="md">
                  <Input
                    bg={'myGray.50'}
                    type={showP ? 'text' : 'password'}
                    placeholder={'请输入密码'}
                    {...register('password', {
                      required: tabIndex === 1 ? '密码不能为空' : false,
                      maxLength: {
                        value: 16,
                        message: '密码最多 16 位'
                      }
                    })}
                  ></Input>
                  <InputRightElement width="2.5rem">
                    <Button
                      onClick={handleShowPClick}
                      variant={'ghost'}
                      h={'36px'}
                      mt="0px"
                      color={'gray'}
                    >
                      {showP ? <ViewIcon></ViewIcon> : <ViewOffIcon></ViewOffIcon>}
                    </Button>
                  </InputRightElement>
                </InputGroup>
                <FormErrorMessage mt="0px" position={'absolute'}>
                  {errors.password?.message}
                </FormErrorMessage>
              </FormControl>
              {feConfigs?.docUrl && (
                <Flex alignItems={'center'} mt={7} fontSize={'sm'}>
                  {t('support.user.login.Policy tip')}
                  <Link
                    ml={1}
                    href={getDocPath('/docs/agreement/terms/')}
                    target={'_blank'}
                    color={'primary.500'}
                  >
                    {t('support.user.login.Terms')}
                  </Link>
                  <Box mx={1}>{t('support.user.login.And')}</Box>
                  <Link
                    href={getDocPath('/docs/agreement/privacy/')}
                    target={'_blank'}
                    color={'primary.500'}
                  >
                    {t('support.user.login.Privacy')}
                  </Link>
                </Flex>
              )}
              <Box
                float={'left'}
                fontSize="sm"
                color={'primary.700'}
                cursor={'pointer'}
                mb="48px"
                mt="12px"
                _hover={{ textDecoration: 'underline' }}
                onClick={() => setPageType(LoginPageTypeEnum.forgetPassword)}
              >
                忘记密码
              </Box>
              <Button
                type="submit"
                w={'100%'}
                mt="3px"
                size={['md', 'md']}
                colorScheme="blue"
                isLoading={requesting}
                onClick={handleSubmit(onclickLoginByPassword)}
              >
                {t('Login')}
              </Button>

              {feConfigs?.show_register && (
                <>
                  <Flex align={'center'} justifyContent={'center'} color={'primary.700'}>
                    {/* <Box
                cursor={'pointer'}
                _hover={{ textDecoration: 'underline' }}
                onClick={() => setPageType('forgetPassword')}
                fontSize="sm"
              >
                {t('support.user.login.Forget Password')}
              </Box>
              <Box mx={3} h={'16px'} w={'1.5px'} bg={'myGray.250'}></Box> */}

                    <Box
                      cursor={'pointer'}
                      _hover={{ textDecoration: 'underline' }}
                      onClick={() => setPageType('register')}
                      fontSize="sm"
                      mt="44px"
                    >
                      {'立即注册'}
                    </Box>
                  </Flex>
                </>
              )}
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </FormLayout>
  );
};

export default LoginForm;
