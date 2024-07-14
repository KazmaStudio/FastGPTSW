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
import React, { useState, Dispatch, useCallback } from 'react';
import { LoginPageTypeEnum } from '@/web/support/user/login/constants';
import { useForm } from 'react-hook-form';
import { useSendCode } from '@/web/support/user/hooks/useSendCode';
import {
  CheckIcon,
  EditIcon,
  CloseIcon,
  ChevronRightIcon,
  ViewIcon,
  ViewOffIcon
} from '@chakra-ui/icons';
import { updateUserInfo } from '@/web/support/user/api';
import { useToast } from '@fastgpt/web/hooks/useToast';

interface Props {
  setPageType: Dispatch<`${LoginPageTypeEnum}`>;
}

const ResetForm = ({ setPageType }: Props) => {
  interface ResetType {
    password: string;
    checkPassword: string;
    phone: string;
    code: string;
  }
  const { sendCodeText, sendCode, codeCountDown } = useSendCode();
  const [showP, setShowP] = useState<boolean>(false);
  const handleShowPClick = () => setShowP(!showP);
  const [showP2, setShowP2] = useState<boolean>(false);
  const handleShowP2Click = () => setShowP2(!showP2);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors }
  } = useForm<ResetType>({
    mode: 'onBlur'
  });
  const onclickSendCode4ResetPassword = useCallback(async () => {
    if (getValues('phone')) {
      sendCode({
        phone: getValues('phone'),
        type: 'findPassword'
      });
    }
  }, [getValues, sendCode]);

  const [requesting, setRequesting] = useState(false);

  const onclickUpdatePassword = useCallback(
    async ({ phone, code, userId, password }: any) => {
      setRequesting(true);
      try {
        await updateUserInfo({
          code,
          type: 2,
          password: password,
          phone: getValues('phone')
        });
        toast({
          title: `修改成功，请去登录`,
          status: 'success'
        });
        setPageType(LoginPageTypeEnum.passwordLogin);
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

  return (
    <Flex flexDirection={'column'} p="8px">
      <Box fontWeight={'bold'} fontSize={'20px'} textAlign={'center'} mt="-48px">
        重置密码
      </Box>
      <FormControl isInvalid={!!errors.phone}>
        <Input
          w="100%"
          mt="12px"
          placeholder="手机号"
          fontSize="14px"
          border={'1px solid #DDE3E8'}
          borderRadius={'8px'}
          mb="24px"
          {...register('phone', {
            required: '手机号不能为空',
            pattern: {
              value: /(^1[3456789]\d{9}$)/,
              message: '手机号格式错误'
            }
          })}
          lineHeight={'16px'}
        />
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
          lineHeight={'48px'}
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
            <Button onClick={handleShowPClick} variant={'ghost'} h={'48px'} mt="0px" color={'gray'}>
              {showP ? <ViewIcon></ViewIcon> : <ViewOffIcon></ViewOffIcon>}
            </Button>
          </InputRightElement>
        </InputGroup>
        <FormErrorMessage mt="-24px" position={'absolute'}>
          {errors.password?.message}
        </FormErrorMessage>
      </FormControl>
      <FormControl isInvalid={!!errors.checkPassword}>
        <InputGroup size="md">
          <Input
            w="100%"
            type={showP2 ? 'text' : 'password'}
            fontSize="14px"
            border={'1px solid #DDE3E8'}
            borderRadius={'8px'}
            mb="24px"
            bg={'white'}
            placeholder={'确认密码'}
            {...register('checkPassword', {
              validate: (val) => (getValues('password') === val ? true : '两次密码不一致')
            })}
          ></Input>
          <InputRightElement width="4.5rem">
            <Button
              onClick={handleShowP2Click}
              variant={'ghost'}
              h={'48px'}
              mt="0px"
              color={'gray'}
            >
              {showP2 ? <ViewIcon></ViewIcon> : <ViewOffIcon></ViewOffIcon>}
            </Button>
          </InputRightElement>
        </InputGroup>
        <FormErrorMessage mt="-24px" position={'absolute'}>
          {errors.checkPassword?.message}
        </FormErrorMessage>
      </FormControl>
      <Button
        type="submit"
        w={'100%'}
        colorScheme="blue"
        isLoading={requesting}
        onClick={handleSubmit(onclickUpdatePassword)}
      >
        确定
      </Button>

      <Box
        float={'right'}
        fontSize="sm"
        mt={4}
        mb={'50px'}
        color={'primary.700'}
        cursor={'pointer'}
        _hover={{ textDecoration: 'underline' }}
        onClick={() => setPageType(LoginPageTypeEnum.passwordLogin)}
      >
        返回登录
      </Box>
    </Flex>
  );
};

export default ResetForm;
