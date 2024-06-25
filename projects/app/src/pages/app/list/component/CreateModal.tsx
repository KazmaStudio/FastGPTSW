import React, { useCallback } from 'react';
import {
  Box,
  Flex,
  Button,
  ModalFooter,
  ModalBody,
  Input,
  Grid,
  useTheme,
  Card
} from '@chakra-ui/react';
import { useSelectFile } from '@/web/common/file/hooks/useSelectFile';
import { useForm } from 'react-hook-form';
import { compressImgFileAndUpload } from '@/web/common/file/controller';
import { getErrText } from '@fastgpt/global/common/error/utils';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { postCreateApp } from '@/web/core/app/api';
import { useRouter } from 'next/router';
import { appTemplates } from '@/web/core/app/templates';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { useRequest } from '@fastgpt/web/hooks/useRequest';
import Avatar from '@/components/Avatar';
import MyTooltip from '@fastgpt/web/components/common/MyTooltip';
import MyModal from '@fastgpt/web/components/common/MyModal';
import { useTranslation } from 'next-i18next';
import { MongoImageTypeEnum } from '@fastgpt/global/common/file/image/constants';
import { useContextSelector } from 'use-context-selector';
import { AppListContext } from './context';
import { useUserStore } from '@/web/support/user/useUserStore';

type FormType = {
  avatar: string;
  name: string;
  templateId: string;
};

const CreateModal = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const { parentId, loadMyApps, myApps } = useContextSelector(AppListContext, (v) => v);
  const { setAppListInfo } = useUserStore();
  const { myApps, parentId, loadMyApps } = useContextSelector(AppListContext, (v) => v);

  const theme = useTheme();
  const { isPc } = useSystemStore();

  const { register, setValue, watch, handleSubmit } = useForm<FormType>({
    defaultValues: {
      avatar: '',
      name: '',
      templateId: appTemplates[0].id
    }
  });
  const avatar = watch('avatar');
  const templateId = watch('templateId');

  const { File, onOpen: onOpenSelectFile } = useSelectFile({
    fileType: '.jpg,.png',
    multiple: false
  });

  const { setAppListInfo } = useUserStore();

  const onSelectFile = useCallback(
    async (e: File[]) => {
      const file = e[0];
      if (!file) return;
      try {
        const src = await compressImgFileAndUpload({
          type: MongoImageTypeEnum.appAvatar,
          file,
          maxW: 300,
          maxH: 300
        });
        setValue('avatar', src);
      } catch (err: any) {
        toast({
          title: getErrText(err, t('common.error.Select avatar failed')),
          status: 'warning'
        });
      }
    },
    [setValue, t, toast]
  );

  const { mutate: onclickCreate, isLoading: creating } = useRequest({
    mutationFn: async (data: FormType) => {
      const template = appTemplates.find((item) => item.id === data.templateId);
      if (!template) {
        return Promise.reject(t('core.dataset.error.Template does not exist'));
      }
      return postCreateApp({
        parentId,
        templeteType: template.id,
        avatar: data.avatar || template.avatar,
        name: data.name,
        type: template.type,
        modules: template.modules || [],
        edges: template.edges || []
      });
    },
    onSuccess(id: string) {
      getMyApps({ parentId }).then((result) => {
        setAppListInfo(result);
      });
      router.push(`/app/detail?appId=${id}`);
      loadMyApps();
      setAppListInfo(myApps);
      onClose();
    },
    successToast: t('common.Create Success'),
    errorToast: t('common.Create Failed')
  });

  return (
    <MyModal
      iconSrc="/imgs/workflow/ai.svg"
      title={t('core.app.create app')}
      isOpen
      onClose={onClose}
      isCentered={!isPc}
    >
      <ModalBody>
        <Box color={'myGray.800'} fontWeight={'bold'}>
          {t('common.Set Name')}
        </Box>
        <Flex mt={2} alignItems={'center'}>
          <MyTooltip label={t('common.Set Avatar')}>
            <Avatar
              flexShrink={0}
              src={avatar}
              w={['28px', '32px']}
              h={['28px', '32px']}
              cursor={'pointer'}
              borderRadius={'md'}
              onClick={onOpenSelectFile}
            />
          </MyTooltip>
          <Input
            flex={1}
            ml={4}
            autoFocus
            bg={'myWhite.600'}
            {...register('name', {
              required: t('core.app.error.App name can not be empty')
            })}
          />
        </Flex>
        <Box mt={[4, 7]} mb={[0, 3]} color={'myGray.800'} fontWeight={'bold'}>
          {t('core.app.Select app from template')}
        </Box>
        <Grid
          userSelect={'none'}
          gridTemplateColumns={['repeat(1,1fr)', 'repeat(2,1fr)']}
          gridGap={[2, 4]}
        >
          {appTemplates.map((item) => (
            <Card
              key={item.id}
              border={theme.borders.base}
              p={3}
              borderRadius={'md'}
              cursor={'pointer'}
              boxShadow={'sm'}
              {...(templateId === item.id
                ? {
                    bg: 'primary.50',
                    borderColor: 'primary.500'
                  }
                : {
                    _hover: {
                      boxShadow: 'md'
                    }
                  })}
              onClick={() => {
                setValue('templateId', item.id);
              }}
            >
              <Flex alignItems={'center'}>
                <Avatar src={item.avatar} borderRadius={'md'} w={'20px'} />
                <Box ml={3} color={'myGray.900'}>
                  {t(item.name)}
                </Box>
              </Flex>
              <Box fontSize={'xs'} mt={2} color={'myGray.600'}>
                {t(item.intro)}
              </Box>
            </Card>
          ))}
        </Grid>
      </ModalBody>

      <ModalFooter>
        <Button variant={'whiteBase'} mr={3} onClick={onClose}>
          {t('common.Close')}
        </Button>
        <Button px={6} isLoading={creating} onClick={handleSubmit((data) => onclickCreate(data))}>
          {t('common.Confirm Create')}
        </Button>
      </ModalFooter>

      <File onSelect={onSelectFile} />
    </MyModal>
  );
};

export default CreateModal;
