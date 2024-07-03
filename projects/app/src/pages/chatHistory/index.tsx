import React, { useMemo, useRef, useState } from 'react';
import {
  Flex,
  Box,
  TableContainer,
  Table,
  Thead,
  Tr,
  Th,
  Td,
  Tbody,
  useTheme,
  useDisclosure,
  ModalBody
} from '@chakra-ui/react';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useTranslation } from 'next-i18next';
import { getAppChatLogs } from '@/web/core/app/api';
import dayjs from 'dayjs';
import { ChatSourceMap } from '@fastgpt/global/core/chat/constants';
import { HUMAN_ICON } from '@fastgpt/global/common/system/constants';
import { AppLogsListItemType } from '@/types/app';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import ChatBox from '@/components/ChatBox';
import type { ComponentRef } from '@/components/ChatBox/type.d';
import { useQuery } from '@tanstack/react-query';
import { getInitChatInfo } from '@/web/core/chat/api';
import MyTag from '@fastgpt/web/components/common/Tag/index';
import MyModal from '@fastgpt/web/components/common/MyModal';
import { addDays } from 'date-fns';
import MyBox from '@fastgpt/web/components/common/MyBox';
import { usePagination } from '@fastgpt/web/hooks/usePagination';
import DateRangePicker, { DateRangeType } from '@fastgpt/web/components/common/DateRangePicker';
import { formatChatValue2InputType } from '@/components/ChatBox/utils';
import { getNanoid } from '@fastgpt/global/common/string/tools';
import { useI18n } from '@/web/context/I18n';
import EmptyTip from '@fastgpt/web/components/common/EmptyTip';

const Logs = () => {
  const { isPc } = useSystemStore();

  const [dateRange, setDateRange] = useState<DateRangeType>({
    from: addDays(new Date(), -27),
    to: new Date()
  });

  const {
    isOpen: isOpenMarkDesc,
    onOpen: onOpenMarkDesc,
    onClose: onCloseMarkDesc
  } = useDisclosure();

  const {
    data: logs,
    isLoading,
    Pagination,
    getData,
    pageNum
  } = usePagination<AppLogsListItemType>({
    api: getAppChatLogs,
    pageSize: 50,
    params: {
      dateStart: dateRange.from || new Date(),
      dateEnd: addDays(dateRange.to || new Date(), 1)
    }
  });

  const [detailLogsId, setDetailLogsId] = useState<string>();
  const [appId, setAppId] = useState<string>('');

  return (
    <Flex flexDirection={'column'} h={'100%'} pt={[1, 5]} position={'relative'}>
      <Box px={[4, 8]}>
        {isPc && (
          <>
            <Box fontWeight={'bold'} fontSize={['md', 'lg']} mb={2}>
              {'对话日志'}
            </Box>
            <Box color={'myGray.500'} fontSize={'sm'}>
              {'日志会记录该应用的在线、分享和 API(需填写 chatId) 对话记录'},{' '}
              <Box
                as={'span'}
                mr={2}
                textDecoration={'underline'}
                cursor={'pointer'}
                onClick={onOpenMarkDesc}
              >
                {'查看标注功能介绍'}
              </Box>
            </Box>
          </>
        )}
      </Box>

      {/* table */}
      <TableContainer mt={[0, 3]} flex={'1 0 0'} h={0} overflowY={'auto'} px={[4, 8]}>
        <Table variant={'simple'} fontSize={'sm'}>
          <Thead>
            <Tr>
              <Th>{'应用名称'}</Th>
              <Th>{'用户名'}</Th>
              <Th>{'会话ID'}</Th>
              <Th>{'会话时间'}</Th>
              <Th>{'对话次数'}</Th>
            </Tr>
          </Thead>
          <Tbody fontSize={'xs'}>
            {logs.map((item) => (
              <Tr
                key={item._id}
                _hover={{ bg: 'myWhite.600' }}
                cursor={'pointer'}
                title={'点击查看对话详情'}
                onClick={() => {
                  setDetailLogsId(item.id);
                  setAppId(item.appId);
                }}
              >
                <Td className="textEllipsis" maxW={'250px'}>
                  {item.appName}
                </Td>
                <Td className="textEllipsis" maxW={'250px'}>
                  {item.username}
                </Td>
                <Td className="textEllipsis" maxW={'250px'}>
                  {item._id}
                </Td>
                <Td>
                  <Box color={'myGray.500'}>{dayjs(item.time).format('YYYY/MM/DD HH:mm')}</Box>
                </Td>
                <Td>{item.messageCount}</Td>
                {/* <Td w={'100px'}>
                  {!!item?.userGoodFeedbackCount && (
                    <Flex
                      mb={item?.userGoodFeedbackCount ? 1 : 0}
                      bg={'green.100'}
                      color={'green.600'}
                      px={3}
                      py={1}
                      alignItems={'center'}
                      justifyContent={'center'}
                      borderRadius={'md'}
                      fontWeight={'bold'}
                    >
                      <MyIcon
                        mr={1}
                        name={'core/chat/feedback/goodLight'}
                        color={'green.600'}
                        w={'14px'}
                      />
                      {item.userGoodFeedbackCount}
                    </Flex>
                  )}
                  {!!item?.userBadFeedbackCount && (
                    <Flex
                      bg={'#FFF2EC'}
                      color={'#C96330'}
                      px={3}
                      py={1}
                      alignItems={'center'}
                      justifyContent={'center'}
                      borderRadius={'md'}
                      fontWeight={'bold'}
                    >
                      <MyIcon
                        mr={1}
                        name={'core/chat/feedback/badLight'}
                        color={'#C96330'}
                        w={'14px'}
                      />
                      {item.userBadFeedbackCount}
                    </Flex>
                  )}
                  {!item?.userGoodFeedbackCount && !item?.userBadFeedbackCount && <>-</>}
                </Td>
                <Td>{item.customFeedbacksCount || '-'}</Td>
                <Td>{item.markCount}</Td> */}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
      {logs.length === 0 && !isLoading && <EmptyTip text={'还没有日志噢~'}></EmptyTip>}
      <Flex w={'100%'} p={4} alignItems={'center'} justifyContent={'flex-end'}>
        <DateRangePicker
          defaultDate={dateRange}
          position="top"
          onChange={setDateRange}
          onSuccess={() => getData(1)}
        />
        <Box ml={3}>
          <Pagination />
        </Box>
      </Flex>

      {!!detailLogsId && (
        <DetailLogsModal
          appId={appId}
          chatId={detailLogsId}
          onClose={() => {
            setDetailLogsId(undefined);
            getData(pageNum);
          }}
        />
      )}
      <MyModal isOpen={isOpenMarkDesc} onClose={onCloseMarkDesc} title={'标注功能介绍'}>
        <ModalBody whiteSpace={'pre-wrap'}>
          {
            '当前标注功能为测试版。\n\n点击添加标注后，需要选择一个知识库，以便存储标注数据。你可以通过该功能快速的标注问题和预期回答，以便引导模型下次的回答。\n\n目前，标注功能同知识库其他数据一样，受模型的影响，不代表标注后 100% 符合预期。\n\n标注数据仅单向与知识库同步，如果知识库修改了该标注数据，日志展示的标注数据无法同步'
          }
        </ModalBody>
      </MyModal>
    </Flex>
  );
};

export default React.memo(Logs);

const DetailLogsModal = ({
  appId,
  chatId,
  onClose
}: {
  appId: string;
  chatId: string;
  onClose: () => void;
}) => {
  const ChatBoxRef = useRef<ComponentRef>(null);
  const { isPc } = useSystemStore();
  const theme = useTheme();

  const { data: chat, isFetching } = useQuery(
    ['getChatDetail', chatId],
    () => getInitChatInfo({ appId, chatId, loadCustomFeedbacks: true }),
    {
      onSuccess(res) {
        const history = res.history.map((item) => ({
          ...item,
          dataId: item.dataId || getNanoid(),
          status: 'finish' as any
        }));
        ChatBoxRef.current?.resetHistory(history);
        ChatBoxRef.current?.resetVariables(res.variables);
        if (res.history.length > 0) {
          setTimeout(() => {
            ChatBoxRef.current?.scrollToBottom('auto');
          }, 500);
        }
      }
    }
  );

  const history = useMemo(() => (chat?.history ? chat.history : []), [chat]);

  const title = useMemo(() => {
    const { text } = formatChatValue2InputType(history[history.length - 2]?.value);
    return text?.slice(0, 8);
  }, [history]);
  const chatModels = chat?.app?.chatModels;

  return (
    <>
      <MyBox
        isLoading={isFetching}
        display={'flex'}
        flexDirection={'column'}
        zIndex={3}
        position={['fixed', 'absolute']}
        top={[0, '2%']}
        right={0}
        h={['100%', '96%']}
        w={'100%'}
        maxW={['100%', '600px']}
        bg={'white'}
        boxShadow={'3px 0 20px rgba(0,0,0,0.2)'}
        borderRadius={'md'}
        overflow={'hidden'}
        transition={'.2s ease'}
      >
        <Flex
          alignItems={'center'}
          px={[3, 5]}
          h={['46px', '60px']}
          borderBottom={theme.borders.base}
          borderBottomColor={'gray.200'}
          color={'myGray.900'}
        >
          {isPc ? (
            <>
              <Box mr={3} color={'myGray.1000'}>
                {title}
              </Box>
              <MyTag colorSchema="blue">
                <MyIcon name={'history'} w={'14px'} />
                <Box ml={1}>{`${history.length}条记录`}</Box>
              </MyTag>
              {!!chatModels && chatModels.length > 0 && (
                <MyTag ml={2} colorSchema={'green'}>
                  <MyIcon name={'core/chat/chatModelTag'} w={'14px'} />
                  <Box ml={1}>{chatModels.join(',')}</Box>
                </MyTag>
              )}
              <Box flex={1} />
            </>
          ) : (
            <>
              <Flex px={3} alignItems={'center'} flex={'1 0 0'} w={0} justifyContent={'center'}>
                <Box ml={1} className="textEllipsis">
                  {title}
                </Box>
              </Flex>
            </>
          )}

          <Flex
            alignItems={'center'}
            justifyContent={'center'}
            w={'20px'}
            h={'20px'}
            borderRadius={'50%'}
            cursor={'pointer'}
            _hover={{ bg: 'myGray.100' }}
            onClick={onClose}
          >
            <MyIcon name={'common/closeLight'} w={'12px'} h={'12px'} color={'myGray.700'} />
          </Flex>
        </Flex>
        <Box pt={2} flex={'1 0 0'}>
          <ChatBox
            ref={ChatBoxRef}
            appAvatar={chat?.app.avatar}
            userAvatar={HUMAN_ICON}
            feedbackType={'admin'}
            showMarkIcon
            showVoiceIcon={false}
            chatConfig={chat?.app?.chatConfig}
            appId={appId}
            chatId={chatId}
          />
        </Box>
      </MyBox>
      <Box zIndex={2} position={'fixed'} top={0} left={0} bottom={0} right={0} onClick={onClose} />
    </>
  );
};
