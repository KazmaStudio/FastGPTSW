import React, { useState, Dispatch, useCallback } from 'react';
import {
  FormControl,
  Box,
  Input,
  InputGroup,
  InputRightElement,
  Button,
  FormErrorMessage,
  Flex
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useForm } from 'react-hook-form';
import { LoginPageTypeEnum } from '@/web/support/user/login/constants';
import { postRegister } from '@/web/support/user/api';
import { useSendCode } from '@/web/support/user/hooks/useSendCode';
import type { ResLogin } from '@/global/support/api/userRes';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { postCreateApp } from '@/web/core/app/api';
import { appTemplates } from '@/web/core/app/templates';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { useTranslation } from 'next-i18next';

interface Props {
  setPageType: Dispatch<`${LoginPageTypeEnum}`>;
}

interface RegisterType {
  username: string;
  password: string;
  phone: string;
  password2: string;
  department: string;
  code: string;
}

const RegisterForm = ({ setPageType }: Props) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { feConfigs } = useSystemStore();
  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors }
  } = useForm<RegisterType>({
    mode: 'onBlur'
  });
  const [showP, setShowP] = useState<boolean>(false);
  const handleShowPClick = () => setShowP(!showP);
  const [showP2, setShowP2] = useState<boolean>(false);
  const handleShowP2Click = () => setShowP2(!showP2);

  const { sendCodeText, sendCode, codeCountDown } = useSendCode();

  const onclickSendCode = useCallback(async () => {
    const check = await trigger('username');
    if (!check) return;
    sendCode({
      phone: getValues('phone'),
      type: 'register'
    });
  }, [getValues, sendCode, trigger]);

  const [requesting, setRequesting] = useState(false);

  const onclickRegister = useCallback(
    async ({ username, password, code, phone, department }: RegisterType) => {
      setRequesting(true);
      try {
        await postRegister({
          username,
          code,
          password,
          phone,
          department,
          inviterId: localStorage.getItem('inviterId') || undefined
        });

        toast({
          title: `注册成功，请前往登录`,
          status: 'success'
        });
        setPageType(LoginPageTypeEnum.passwordLogin);
        // auto register template app
        // setTimeout(() => {
        //   appTemplates.forEach((template) => {
        //     postCreateApp({
        //       avatar: template.avatar,
        //       name: t(template.name),
        //       modules: template.modules,
        //       type: template.type
        //     });
        //   });
        // }, 100);
      } catch (error: any) {
        toast({
          title: error.message || '注册异常',
          status: 'error'
        });
      }
      setRequesting(false);
    },
    [t, toast]
  );

  return (
    <>
      <Box fontWeight={'bold'} fontSize={'20px'} textAlign={'center'} mt="-48px">
        注册
      </Box>
      <Box
        h={'8px'}
        w="48px"
        m="0 auto"
        mt="-12px"
        bg={'linear-gradient( 90deg, rgba(12,83,238,0.5) 0%, rgba(12,83,238,0) 100%)'}
      ></Box>
      <Box
        mt={'12px'}
        onKeyDown={(e) => {
          if (e.keyCode === 13 && !e.shiftKey && !requesting) {
            handleSubmit(onclickRegister)();
          }
        }}
      >
        <FormControl isInvalid={!!errors.username}>
          <Input
            bg={'myGray.50'}
            placeholder="用户名"
            {...register('username', {
              required: '用户名不能为空',
              pattern: {
                value: /(^[A-Za-z0-9])/,
                message: '用户名格式错误，请输入字母或数字'
              }
            })}
          ></Input>
          <FormErrorMessage mt="0px" position={'absolute'}>
            {errors.username?.message}
          </FormErrorMessage>
        </FormControl>
        <FormControl mt={6} isInvalid={!!errors.department}>
          <Input
            bg={'myGray.50'}
            placeholder="部门"
            {...register('department', {
              pattern: {
                value: /(^[A-Za-z0-9])/,
                message: '部门'
              }
            })}
          ></Input>
        </FormControl>
        <FormControl mt={6} isInvalid={!!errors.phone}>
          <Input
            bg={'myGray.50'}
            placeholder="手机号"
            {...register('phone', {
              required: '手机号不能为空',
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
            maxLength={8}
            placeholder="验证码"
            {...register('code', {
              required: '验证码不能为空'
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
          {/* <FormErrorMessage mt="60px" position={'absolute'}>
            {errors.code?.message}
          </FormErrorMessage> */}
        </FormControl>
        <FormControl mt={6} isInvalid={!!errors.password}>
          <InputGroup size="md">
            <Input
              bg={'myGray.50'}
              type={showP ? 'text' : 'password'}
              placeholder="密码为8-16个字符，可由字母、数字、字符组成"
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
        <FormControl mt={6} isInvalid={!!errors.password2}>
          <InputGroup size="md">
            <Input
              bg={'myGray.50'}
              type={showP2 ? 'text' : 'password'}
              placeholder="密码为8-16个字符，可由字母、数字、字符组成"
              {...register('password2', {
                validate: (val) => (getValues('password') === val ? true : '两次密码不一致')
              })}
            ></Input>
            <InputRightElement width="2.5rem">
              <Button
                onClick={handleShowP2Click}
                variant={'ghost'}
                h={'36px'}
                mt="0px"
                color={'gray'}
              >
                {showP2 ? <ViewIcon></ViewIcon> : <ViewOffIcon></ViewOffIcon>}
              </Button>
            </InputRightElement>
          </InputGroup>
          <FormErrorMessage mt="0px" position={'absolute'}>
            {errors.password2?.message}
          </FormErrorMessage>
        </FormControl>
        <Button
          type="submit"
          mt={6}
          w={'100%'}
          size={['md', 'md']}
          colorScheme="blue"
          isLoading={requesting}
          onClick={handleSubmit(onclickRegister)}
        >
          确认注册
        </Button>
        <Flex
          float={'left'}
          fontSize="12px"
          mt={2}
          mb={'50px'}
          w={'100%'}
          justifyContent={'space-between'}
        >
          <Flex>
            <Box>已有账号？</Box>
            <Box
              color={'primary.700'}
              cursor={'pointer'}
              _hover={{ textDecoration: 'underline' }}
              onClick={() => setPageType(LoginPageTypeEnum.passwordLogin)}
            >
              去登录
            </Box>
          </Flex>
          <Flex
            fontSize="12px"
            color={'primary.700'}
            cursor={'pointer'}
            mb="48px"
            _hover={{ textDecoration: 'underline' }}
            onClick={() => setPageType(LoginPageTypeEnum.forgetPassword)}
          >
            忘记密码
          </Flex>
        </Flex>
      </Box>
    </>
  );
};

export default RegisterForm;
