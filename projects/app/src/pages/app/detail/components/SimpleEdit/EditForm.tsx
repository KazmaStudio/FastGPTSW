import React, { useEffect, useMemo, useTransition } from 'react';
import {
  Box,
  Flex,
  Grid,
  Input,
  Textarea,
  BoxProps,
  useTheme,
  useDisclosure,
  Button,
  HStack
} from '@chakra-ui/react';
import { AddIcon, SmallAddIcon } from '@chakra-ui/icons';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  PopoverArrow,
  PopoverCloseButton,
  PopoverAnchor
} from '@chakra-ui/react';
import { useFieldArray, UseFormReturn } from 'react-hook-form';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import type { AppSimpleEditFormType } from '@fastgpt/global/core/app/type.d';
import { useRequest } from '@fastgpt/web/hooks/useRequest';
import { useConfirm } from '@fastgpt/web/hooks/useConfirm';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { AppTypeEnum } from '@fastgpt/global/core/app/constants';
import { useDatasetStore } from '@/web/core/dataset/store/dataset';
import { form2AppWorkflow } from '@/web/core/app/utils';

import dynamic from 'next/dynamic';
import MyTooltip from '@fastgpt/web/components/common/MyTooltip';
import Avatar from '@/components/Avatar';
import MyIcon from '@fastgpt/web/components/common/Icon';
import VariableEdit from '@/components/core/app/VariableEdit';
import MyTextarea from '@/components/common/Textarea/MyTextarea/index';
import PromptEditor from '@fastgpt/web/components/common/Textarea/PromptEditor';
import { formatEditorVariablePickerIcon } from '@fastgpt/global/core/workflow/utils';
import SearchParamsTip from '@/components/core/dataset/SearchParamsTip';
import SettingLLMModel from '@/components/core/ai/SettingLLMModel';
import type { SettingAIDataType } from '@fastgpt/global/core/app/type.d';
import DeleteIcon, { hoverDeleteStyles } from '@fastgpt/web/components/common/Icon/delete';
import { TTSTypeEnum } from '@/web/core/app/constants';
import { getSystemVariables } from '@/web/core/app/utils';
import { useUpdate } from 'ahooks';
import { useI18n } from '@/web/context/I18n';
import { useContextSelector } from 'use-context-selector';
import { AppContext } from '@/web/core/app/context/appContext';
import QuestionTip from '@fastgpt/web/components/common/MyTooltip/QuestionTip';
import FormLabel from '@fastgpt/web/components/common/MyBox/FormLabel';

const DatasetSelectModal = dynamic(() => import('@/components/core/app/DatasetSelectModal'));
const DatasetParamsModal = dynamic(() => import('@/components/core/app/DatasetParamsModal'));
const ToolSelectModal = dynamic(() => import('./ToolSelectModal'));
const TTSSelect = dynamic(() => import('@/components/core/app/TTSSelect'));
const QGSwitch = dynamic(() => import('@/components/core/app/QGSwitch'));
const WhisperConfig = dynamic(() => import('@/components/core/app/WhisperConfig'));
const InputGuideConfig = dynamic(() => import('@/components/core/app/InputGuideConfig'));
const ScheduledTriggerConfig = dynamic(
  () => import('@/components/core/app/ScheduledTriggerConfig')
);
const WelcomeTextConfig = dynamic(() => import('@/components/core/app/WelcomeTextConfig'));

const BoxStyles: BoxProps = {
  px: 5,
  py: '16px'
  // borderBottomWidth: '1px',
  // borderBottomColor: 'borderColor.low'
};
const LabelStyles: BoxProps = {
  w: ['60px', '100px'],
  flexShrink: 0,
  fontSize: 'xs'
};

const EditForm = ({
  editForm,
  divRef,
  isSticky
}: {
  editForm: UseFormReturn<AppSimpleEditFormType, any>;
  divRef: React.RefObject<HTMLDivElement>;
  isSticky: boolean;
}) => {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { appT } = useI18n();

  const { appDetail, publishApp, updateAppDetail } = useContextSelector(AppContext, (v) => v);

  const { allDatasets } = useDatasetStore();
  const { llmModelList } = useSystemStore();
  const [, startTst] = useTransition();
  const refresh = useUpdate();

  const { setValue, getValues, handleSubmit, control, watch, register } = editForm;

  const { fields: datasets, replace: replaceDatasetList } = useFieldArray({
    control,
    name: 'dataset.datasets'
  });
  const selectDatasets = useMemo(
    () => allDatasets.filter((item) => datasets.find((dataset) => dataset.datasetId === item._id)),
    [allDatasets, datasets]
  );

  // useEffect(() => {
  //   if (selectDatasets.length !== datasets.length) {
  //     replaceDatasetList(
  //       selectDatasets.map((item) => ({
  //         datasetId: item._id
  //       }))
  //     );
  //   }
  // }, [datasets, replaceDatasetList, selectDatasets]);

  const {
    isOpen: isOpenDatasetSelect,
    onOpen: onOpenKbSelect,
    onClose: onCloseKbSelect
  } = useDisclosure();
  const {
    isOpen: isOpenDatasetParams,
    onOpen: onOpenDatasetParams,
    onClose: onCloseDatasetParams
  } = useDisclosure();
  const { isOpen: isOpenPrompt, onOpen: onOpenPrompt, onClose: onClosePrompt } = useDisclosure();
  const {
    isOpen: isOpenToolsSelect,
    onOpen: onOpenToolsSelect,
    onClose: onCloseToolsSelect
  } = useDisclosure();

  const { openConfirm: openConfirmSave, ConfirmModal: ConfirmSaveModal } = useConfirm({
    content: t('core.app.edit.Confirm Save App Tip')
  });

  const aiSystemPrompt = watch('aiSettings.systemPrompt');
  const selectLLMModel = watch('aiSettings.model');
  const quotePrompt = watch('dataset.quotePrompt');

  const datasetSearchSetting = watch('dataset');
  const variables = watch('chatConfig.variables');

  const formatVariables: any = useMemo(
    () => formatEditorVariablePickerIcon([...getSystemVariables(t), ...(variables || [])]),
    [t, variables]
  );
  const tts = getValues('chatConfig.ttsConfig');
  const whisperConfig = getValues('chatConfig.whisperConfig');
  const postQuestionGuide = getValues('chatConfig.questionGuide');
  const selectedTools = watch('selectedTools');
  const inputGuideConfig = watch('chatConfig.chatInputGuide');
  const scheduledTriggerConfig = watch('chatConfig.scheduledTriggerConfig');
  const searchMode = watch('dataset.searchMode');

  const tokenLimit = useMemo(() => {
    return llmModelList.find((item) => item.model === selectLLMModel)?.quoteMaxToken || 3000;
  }, [selectLLMModel, llmModelList]);

  /* on save app */
  const { mutate: onSubmitPublish, isLoading: isSaving } = useRequest({
    mutationFn: async (data: AppSimpleEditFormType) => {
      await updateAppDetail({
        name: data.name,
        intro: data.intro
      });

      const { nodes, edges } = form2AppWorkflow(data);

      await publishApp({
        nodes,
        edges,
        chatConfig: data.chatConfig,
        type: AppTypeEnum.simple
      });
    },
    successToast: t('common.Save Success'),
    errorToast: t('common.Save Failed')
  });

  useEffect(() => {
    const wat = watch((data) => {
      refresh();
    });

    return () => {
      wat.unsubscribe();
    };
  }, []);

  return (
    <Box px={'24px'}>
      {/* title */}
      <Box fontSize={'20px'} fontWeight={'700'}>
        {appDetail.templeteType === 'chatGuide' ? '问答机器人' : '知识管家'}
      </Box>
      <Box p={0}>
        <Box p={0}>
          {/* ai */}
          <Box {...BoxStyles} p={0}>
            <Box p={0} pt={'24px'} fontSize={'18px'} fontWeight={'700'}>
              基础配置信息
            </Box>
            <Box p={0} pt={'24px'} pb={'12px'} fontSize={'14px'} fontWeight={'700'}>
              应用名称
            </Box>
            <Input
              defaultValue={appDetail.name}
              // bg={'myWhite.600'}
              placeholder={'命名你的应用'}
              {...register('name')}
            ></Input>
            <Box p={0} pt={'24px'} pb={'12px'} fontSize={'14px'} fontWeight={'700'}>
              应用简介
            </Box>
            <Input
              defaultValue={appDetail.intro}
              placeholder={'描述你的应用'}
              // bg={'myWhite.600'}
              {...register('intro')}
            />
            {appDetail.templeteType === 'simpleChat' && (
              <Box p={'0px'}>
                <Box p={0} pt={'24px'} fontSize={'18px'} fontWeight={'700'}>
                  知识库配置信息
                </Box>
                <Flex justifyContent={'space-between'}>
                  <Box p={0} pt={'24px'} pb={'12px'} fontSize={'14px'} fontWeight={'700'}>
                    知识库选择
                  </Box>
                  {/* <Flex alignItems={'center'} flex={1}>
                    <MyIcon name={'core/app/simpleMode/dataset'} w={'20px'} />
                    <FormLabel ml={2}>{'知识库选择'}</FormLabel>
                  </Flex> */}

                  <Button
                    mt={'12px'}
                    variant={'ghost'}
                    color={'#0C53EE'}
                    // leftIcon={<MyIcon name={'edit'} w={'14px'} />}
                    // iconSpacing={1}
                    // size={'sm'}
                    // fontSize={'sm'}

                    onClick={onOpenDatasetParams}
                  >
                    {'知识库设置'}
                  </Button>
                </Flex>
                <Button
                  bgColor={'white'}
                  onClick={onOpenKbSelect}
                  color={'rgba(0, 0, 0, 0.8)'}
                  w="100%"
                  justifyContent={'left'}
                  textAlign={'left'}
                  border={theme.borders.base}
                >
                  {selectDatasets.length > 0 ? selectDatasets[0].name : '知识库选择'}
                </Button>
                {/* {datasetSearchSetting.datasets?.length > 0 && (
                  <Box my={3}>
                    <SearchParamsTip
                      searchMode={searchMode}
                      similarity={getValues('dataset.similarity')}
                      limit={getValues('dataset.limit')}
                      usingReRank={getValues('dataset.usingReRank')}
                      queryExtensionModel={getValues('dataset.datasetSearchExtensionModel')}
                    />
                  </Box>
                )} */}
                {/* <Grid
                  gridTemplateColumns={['repeat(2, minmax(0, 1fr))', 'repeat(3, minmax(0, 1fr))']}
                  gridGap={[2, 4]}
                >
                  {selectDatasets.map((item) => (
                    <MyTooltip key={item._id} label={t('core.dataset.Read Dataset')}>
                      <Flex
                        overflow={'hidden'}
                        alignItems={'center'}
                        p={2}
                        bg={'white'}
                        boxShadow={
                          '0 4px 8px -2px rgba(16,24,40,.1),0 2px 4px -2px rgba(16,24,40,.06)'
                        }
                        borderRadius={'md'}
                        border={theme.borders.base}
                        cursor={'pointer'}
                        onClick={() =>
                          router.push({
                            pathname: '/dataset/detail',
                            query: {
                              datasetId: item._id
                            }
                          })
                        }
                      >
                        <Avatar src={item.avatar} w={'18px'} mr={1} />
                        <Box flex={'1 0 0'} w={0} className={'textEllipsis'} fontSize={'sm'}>
                          {item.name}
                        </Box>
                      </Flex>
                    </MyTooltip>
                  ))}
                </Grid> */}
              </Box>
            )}

            <Box p={0} pt={'24px'} pb={'12px'} fontSize={'18px'} fontWeight={'700'}>
              模型配置信息
            </Box>
            {/* <Flex alignItems={'center'} flex={1}>
                    <MyIcon name={'core/app/simpleMode/dataset'} w={'20px'} />
                    <FormLabel ml={2}>{'知识库选择'}</FormLabel>
                  </Flex> */}

            {/* <Flex alignItems={'center'}>
              <MyIcon name={'core/app/simpleMode/ai'} w={'20px'} />
              <FormLabel ml={2} flex={1}>
                {appT('AI Settings')}
              </FormLabel>
            </Flex> */}
            <Flex justifyContent={'space-between'}>
              <Box p={0} pt={'12px'} pb={'12px'} fontSize={'14px'} fontWeight={'700'}>
                模型选择
              </Box>
              {appDetail.templeteType === 'simpleChat' && (
                <Popover>
                  <PopoverTrigger>
                    <Button mt="18px" variant={'ghost'} color={'#0C53EE'}>
                      提示词设置
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <PopoverArrow />
                    <PopoverCloseButton />
                    <PopoverHeader>提示词设置</PopoverHeader>
                    <PopoverBody>
                      <PromptEditor
                        value={quotePrompt}
                        // value={aiSystemPrompt}
                        // {
                        //   appDetail.templeteType === 'chatGuide' ? '' : ''
                        //   //: '使用 <QA></QA> 标记中的问答对进行回答。\n{{ quote }}\n回答要求：\n-选择其中一个或多个问答对进行回答。\n-回答的内容应尽可能与 <答案></答案> 中的内容一致。\n-如果没有相关的问答对，你需要澄清。\n-避免提及你是从 QA 获取的知识，只需要回复答案。\n问题:"{{ question }}"'
                        // } //
                        onChange={(text) => {
                          setValue('dataset.quoteTemplate', '{{q}}\n{{a}}');
                          setValue('dataset.quotePrompt', text);

                          // startTst(() => {
                          //   setValue('aiSettings.systemPrompt', text);
                          // });
                        }}
                        variables={formatVariables}
                        placeholder={'提示词设置'}
                        // placeholder={t('core.app.tip.chatNodeSystemPromptTip')}
                        title={t('core.ai.Prompt')}
                      />
                    </PopoverBody>
                    <PopoverFooter></PopoverFooter>
                  </PopoverContent>
                </Popover>
              )}
            </Flex>
            <SettingLLMModel
              llmModelType={'all'}
              defaultData={{
                model: getValues('aiSettings.model'),
                temperature: getValues('aiSettings.temperature'),
                maxToken: getValues('aiSettings.maxToken'),
                maxHistories: getValues('aiSettings.maxHistories')
              }}
              onChange={({ model, temperature, maxToken, maxHistories }: SettingAIDataType) => {
                setValue('aiSettings.model', model);
                setValue('aiSettings.maxToken', maxToken);
                setValue('aiSettings.temperature', temperature);
                setValue('aiSettings.maxHistories', maxHistories ?? 100);
              }}
            />
            {/* <Flex alignItems={'center'} mt={5}>
              <Box {...LabelStyles}>{t('core.ai.Model')}</Box>
              <Box flex={'1 0 0'}>
                <SettingLLMModel
                  llmModelType={'all'}
                  defaultData={{
                    model: getValues('aiSettings.model'),
                    temperature: getValues('aiSettings.temperature'),
                    maxToken: getValues('aiSettings.maxToken'),
                    maxHistories: getValues('aiSettings.maxHistories')
                  }}
                  onChange={({ model, temperature, maxToken, maxHistories }: SettingAIDataType) => {
                    setValue('aiSettings.model', model);
                    setValue('aiSettings.maxToken', maxToken);
                    setValue('aiSettings.temperature', temperature);
                    setValue('aiSettings.maxHistories', maxHistories ?? 100);
                  }}
                />
              </Box>
            </Flex> */}

            {appDetail.templeteType === 'chatGuide' ? (
              <Box mt={3}>
                <HStack {...LabelStyles}>
                  <Box fontSize={'14px'} fontWeight={'700'} pb="12px">
                    {'模型设定'}
                  </Box>
                  {/* <Box>{t('core.ai.Prompt')}</Box> */}
                  {/* <QuestionTip label={t('core.app.tip.chatNodeSystemPromptTip')} /> */}
                </HStack>
                <Box mt={1}>
                  <PromptEditor
                    h={100}
                    // value={quotePrompt}
                    value={aiSystemPrompt}
                    // {
                    //   appDetail.templeteType === 'chatGuide' ? '' : ''
                    //   //: '使用 <QA></QA> 标记中的问答对进行回答。\n{{ quote }}\n回答要求：\n-选择其中一个或多个问答对进行回答。\n-回答的内容应尽可能与 <答案></答案> 中的内容一致。\n-如果没有相关的问答对，你需要澄清。\n-避免提及你是从 QA 获取的知识，只需要回复答案。\n问题:"{{ question }}"'
                    // } //
                    onChange={(text) => {
                      startTst(() => {
                        setValue('aiSettings.systemPrompt', text);
                      });
                    }}
                    variables={formatVariables}
                    placeholder={'请详细描述模型的设定'}
                    // placeholder={t('core.app.tip.chatNodeSystemPromptTip')}
                    title={t('core.ai.Prompt')}
                  />
                </Box>
              </Box>
            ) : (
              <></>
            )}
          </Box>

          {/* tool choice */}
          {/* <Box {...BoxStyles}>
            <Flex alignItems={'center'}>
              <Flex alignItems={'center'} flex={1}>
                <MyIcon name={'core/app/toolCall'} w={'20px'} />
                <FormLabel ml={2}>{t('core.app.Tool call')}(实验功能)</FormLabel>
                <QuestionTip ml={1} label={t('core.app.Tool call tip')} />
              </Flex>
              <Button
                variant={'transparentBase'}
                leftIcon={<SmallAddIcon />}
                iconSpacing={1}
                mr={'-5px'}
                size={'sm'}
                fontSize={'sm'}
                onClick={onOpenToolsSelect}
              >
                {t('common.Choose')}
              </Button>
            </Flex>
            <Grid
              mt={selectedTools.length > 0 ? 2 : 0}
              gridTemplateColumns={'repeat(2, minmax(0, 1fr))'}
              gridGap={[2, 4]}
            >
              {selectedTools.map((item) => (
                <Flex
                  key={item.id}
                  overflow={'hidden'}
                  alignItems={'center'}
                  p={2}
                  bg={'white'}
                  boxShadow={'0 4px 8px -2px rgba(16,24,40,.1),0 2px 4px -2px rgba(16,24,40,.06)'}
                  borderRadius={'md'}
                  border={theme.borders.base}
                  _hover={{
                    ...hoverDeleteStyles,
                    borderColor: 'primary.300'
                  }}
                >
                  <Avatar src={item.avatar} w={'18px'} mr={1} />
                  <Box flex={'1 0 0'} w={0} className={'textEllipsis'} fontSize={'sm'}>
                    {item.name}
                  </Box>
                  <DeleteIcon
                    onClick={() => {
                      setValue(
                        'selectedTools',
                        selectedTools.filter((tool) => tool.id !== item.id)
                      );
                    }}
                  />
                </Flex>
              ))}
            </Grid>
          </Box> */}

          {/* variable */}
          {/* <Box {...BoxStyles}>
            <VariableEdit
              variables={variables}
              onChange={(e) => {
                setValue('chatConfig.variables', e);
              }}
            />
          </Box> */}

          {/* welcome */}
          <Box p={0} pt={'24px'} pb={'6px'} fontSize={'14px'} fontWeight={'700'}>
            对话开场白
          </Box>
          <Box p={0}>
            <WelcomeTextConfig
              defaultValue={getValues('chatConfig.welcomeText')}
              onBlur={(e) => {
                setValue('chatConfig.welcomeText', e.target.value || '');
              }}
            />
          </Box>

          {/* tts */}
          {/* <Box {...BoxStyles}>
            <TTSSelect
              value={tts}
              onChange={(e) => {
                setValue('chatConfig.ttsConfig', e);
              }}
            />
          </Box> */}

          {/* whisper */}
          {/* <Box {...BoxStyles}>
            <WhisperConfig
              isOpenAudio={tts?.type !== TTSTypeEnum.none}
              value={whisperConfig}
              onChange={(e) => {
                setValue('chatConfig.whisperConfig', e);
              }}
            />
          </Box> */}

          {/* question guide */}
          {/* <Box {...BoxStyles}>
            <QGSwitch
              isChecked={postQuestionGuide}
              onChange={(e) => {
                setValue('chatConfig.questionGuide', e.target.checked);
              }}
            />
          </Box> */}

          {/* question tips */}
          {/* <Box {...BoxStyles}>
            <InputGuideConfig
              appId={appDetail._id}
              value={inputGuideConfig}
              onChange={(e) => {
                setValue('chatConfig.chatInputGuide', e);
              }}
            />
          </Box> */}

          {/* timer trigger */}
          {/* <Box {...BoxStyles} borderBottom={'none'}>
            <ScheduledTriggerConfig
              value={scheduledTriggerConfig}
              onChange={(e) => {
                setValue('chatConfig.scheduledTriggerConfig', e);
              }}
            />
          </Box> */}
        </Box>
      </Box>
      <Flex
        ref={divRef}
        position={'sticky'}
        top={-4}
        pt="24px"
        // bg={'myGray.25'}
        justifyContent={'right'}
        alignItems={'center'}
        zIndex={100}
        // {...(isSticky && {
        //   // borderBottom: theme.borders.base,
        //   boxShadow: '0 2px 10px rgba(0,0,0,0.12)'
        // })}
      >
        {/* <HStack>
          <Box color={'myGray.900'}>{t('core.app.App params config')}</Box>
          <QuestionTip label={t('core.app.Simple Config Tip')} />
        </HStack> */}
        <Button
          isLoading={isSaving}
          w="88px"
          h="36px"
          // leftIcon={
          //   appDetail.type === AppTypeEnum.simple ? (
          //     <MyIcon name={'common/publishFill'} w={['14px', '16px']} />
          //   ) : undefined
          // }
          variant={appDetail.type === AppTypeEnum.simple ? 'primary' : 'whitePrimary'}
          onClick={(e) => {
            if (appDetail.type !== AppTypeEnum.simple) {
              openConfirmSave(handleSubmit((data) => onSubmitPublish(data)))();
            } else {
              handleSubmit((data) => onSubmitPublish(data))();
            }
          }}
        >
          {
            appDetail.type !== AppTypeEnum.simple ? t('core.app.Change to simple mode') : '保存' //t('core.app.Publish')
          }
        </Button>
      </Flex>

      <ConfirmSaveModal bg={appDetail.type === AppTypeEnum.simple ? '' : 'red.600'} countDown={5} />
      {isOpenDatasetSelect && (
        <DatasetSelectModal
          isOpen={isOpenDatasetSelect}
          defaultSelectedDatasets={selectDatasets.map((item) => ({
            datasetId: item._id,
            vectorModel: item.vectorModel
          }))}
          onClose={onCloseKbSelect}
          onChange={replaceDatasetList}
        />
      )}
      {isOpenDatasetParams && (
        <DatasetParamsModal
          {...datasetSearchSetting}
          maxTokens={tokenLimit}
          onClose={onCloseDatasetParams}
          onSuccess={(e) => {
            setValue('dataset', {
              ...getValues('dataset'),
              ...e
            });
          }}
        />
      )}
      {isOpenToolsSelect && (
        <ToolSelectModal
          selectedTools={selectedTools}
          onAddTool={(e) => {
            setValue('selectedTools', [...selectedTools, e]);
          }}
          onRemoveTool={(e) => {
            setValue(
              'selectedTools',
              selectedTools.filter((item) => item.pluginId !== e.pluginId)
            );
          }}
          onClose={onCloseToolsSelect}
        />
      )}
    </Box>
  );
};

export default React.memo(EditForm);
