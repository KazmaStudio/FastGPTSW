import React, { useMemo, useRef, useState } from 'react';
import {
  Flex,
  Box,
  TableContainer,
  Table,
  Button,
  Thead,
  Tr,
  Th,
  Td,
  Tbody,
  useTheme,
  useDisclosure,
  ModalBody,
  Input,
  FormControl
} from '@chakra-ui/react';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useChatBox } from '@/components/ChatBox/hooks/useChatBox';
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
import { useForm } from 'react-hook-form';
import { useUserStore } from '@/web/support/user/useUserStore';

const Logs = () => {
  const { isPc } = useSystemStore();
  const { userInfo } = useUserStore();

  const [dateRange, setDateRange] = useState<DateRangeType>({
    from: addDays(new Date(), -30),
    to: new Date()
  });
  const [requesting, setRequesting] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const {
    isOpen: isOpenMarkDesc,
    onOpen: onOpenMarkDesc,
    onClose: onCloseMarkDesc
  } = useDisclosure();

  const [searchUsername, setSearchUsername] = useState<string | undefined>();
  const [searchAppName, setSearchAppName] = useState<string | undefined>();
  const [searchChatId, setSearchChatId] = useState<string | undefined>();
  // const { register, handleSubmit, getValues } = useForm();
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
      username: searchUsername || undefined,
      appName: searchAppName || undefined,
      chatId: searchChatId || undefined,
      dateStart: dateRange.from || new Date(),
      dateEnd: addDays(dateRange.to || new Date(), 1)
    }
  });

  const [detailLogsId, setDetailLogsId] = useState<string>();
  const [appId, setAppId] = useState<string>('');
  const { onExportChat } = useChatBox();

  return (
    <Flex flexDirection={'column'} h={'100%'} position={'relative'} bg={'#F0F2F5'} p="24px" pb="0">
      {/* table */}

      <Flex
        borderRadius={'8px'}
        pl="24px"
        pr="14px"
        bg={'white'}
        flexWrap={userInfo?.team.permission.isOwner ? 'wrap' : 'nowrap'}
      >
        <Flex pt="14px" pr="14px" w="100%">
          <Input
            placeholder="应用名称"
            flex={1}
            mr={'16px'}
            onChange={(e) => {
              setSearchUsername(e.target.value);
            }}
          ></Input>
          {userInfo?.team.permission.isOwner && (
            <Input
              placeholder="用户名"
              flex={1}
              mr={'16px'}
              onChange={(e) => {
                setSearchAppName(e.target.value);
              }}
            ></Input>
          )}
          <Input
            placeholder="会话ID"
            flex={1}
            onChange={(e) => {
              setSearchChatId(e.target.value);
            }}
          ></Input>
        </Flex>

        <Flex my="14px" pr="14px">
          <Flex w="300px" mr="14px">
            <DateRangePicker
              h="40px"
              lh="28px"
              defaultDate={dateRange}
              onChange={setDateRange}
              // onSuccess={() => getData(1)}
            />
          </Flex>

          <Button
            type="submit"
            h={'40px'}
            w={'68px'}
            colorScheme="blue"
            isLoading={isLoading}
            onClick={() => {
              getData(1);
            }}
          >
            查询
          </Button>
        </Flex>
      </Flex>

      <TableContainer
        mt={[0, 3]}
        overflowY={'auto'}
        p={'24px'}
        bg={'white'}
        borderRadius={'8px'}
        flex={1}
      >
        <Table variant={'simple'} fontSize={'sm'}>
          <Thead>
            <Tr>
              <Th>{'应用名称'}</Th>
              {userInfo?.team.permission.isOwner ? <Th>{'用户名'}</Th> : <></>}
              <Th>{'会话ID'}</Th>
              <Th>{'会话时间'}</Th>
              <Th>{'对话次数'}</Th>
              <Th pl="42px">{'操作'}</Th>
            </Tr>
          </Thead>
          <Tbody fontSize={'xs'}>
            {logs.map((item) => (
              <Tr
                key={item._id}
                _hover={{ bg: 'myWhite.600' }}
                cursor={'pointer'}
                title={'点击查看对话详情'}
              >
                <Td className="textEllipsis" maxW={'250px'}>
                  {item.appName}
                </Td>
                {userInfo?.team.permission.isOwner ? (
                  <Td className="textEllipsis" maxW={'250px'}>
                    {item.username}
                  </Td>
                ) : (
                  <></>
                )}

                <Td className="textEllipsis" maxW={'250px'}>
                  {item.id}
                </Td>
                <Td>
                  <Box color={'myGray.500'}>{dayjs(item.time).format('YYYY/MM/DD HH:mm')}</Box>
                </Td>
                <Td>{item.messageCount}</Td>
                <Td>
                  <Button
                    variant={'ghost'}
                    color="#0C53EE"
                    onClick={() => {
                      setShowLogs(true);
                      setDetailLogsId(item.id);
                      setAppId(item.appId);
                    }}
                  >
                    详情
                  </Button>
                  <Button
                    isLoading={requesting}
                    variant={'ghost'}
                    color="#0C53EE"
                    onClick={async () => {
                      setShowLogs(false);
                      setDetailLogsId(item.id);
                      setAppId(item.appId);
                      setRequesting(true);
                      const chat = await getInitChatInfo({
                        appId: item.appId,
                        chatId: item.id,
                        loadCustomFeedbacks: false
                      });
                      setRequesting(false);
                      onExportChat({ type: 'pdf', history: chat.history });
                    }}
                  >
                    导出
                  </Button>
                </Td>
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
          // onSuccess={() => getData(1)}
        />
        <Box ml={3}>
          <Pagination />
        </Box>
      </Flex>

      {!!detailLogsId && (
        <DetailLogsModal
          appId={appId}
          showLogs={showLogs}
          chatId={detailLogsId}
          onClose={() => {
            setDetailLogsId(undefined);
            getData(pageNum);
          }}
        />
      )}
    </Flex>
  );
};

export default React.memo(Logs);

const DetailLogsModal = ({
  appId,
  chatId,
  onClose,
  showLogs
}: {
  appId: string;
  chatId: string;
  showLogs: boolean;
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
        hidden={!showLogs}
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
