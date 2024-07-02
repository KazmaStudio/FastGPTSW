import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoChat } from '@fastgpt/service/core/chat/chatSchema';
import type { PagingData } from '@/types';
import { AppLogsListItemType } from '@/types/app';
import { Types } from '@fastgpt/service/common/mongo';
import { addDays } from 'date-fns';
import type { GetAppChatLogsParams } from '@/global/core/api/appReq.d';
import { authApp } from '@fastgpt/service/support/permission/app/auth';
import { ChatItemCollectionName } from '@fastgpt/service/core/chat/chatItemSchema';
import { AppCollectionName } from '@fastgpt/service/core/app/schema';
import { NextAPI } from '@/service/middleware/entry';
import { WritePermissionVal } from '@fastgpt/global/support/permission/constant';
import { authCert } from '@fastgpt/service/support/permission/auth/common';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<PagingData<AppLogsListItemType>> {
  const {
    pageNum = 1,
    pageSize = 20,
    appId,
    dateStart = addDays(new Date(), -7),
    dateEnd = new Date()
  } = req.body as GetAppChatLogsParams;

  // 凭证校验
  // const { teamId } = await authApp({ req, authToken: true, appId, per: WritePermissionVal });
  const { teamId } = await authCert({ req, authToken: true });

  let where: any = {
    teamId: new Types.ObjectId(teamId),
    // appId: new Types.ObjectId(appId),
    updateTime: {
      $gte: new Date(dateStart),
      $lte: new Date(dateEnd)
    }
  };

  let and = [{ $eq: ['$chatId' as any, '$$chatId' as any] }];

  if (appId) {
    where.appId = new Types.ObjectId(appId);
    and.unshift({ $eq: ['$appId', new Types.ObjectId(appId)] });
  }

  const [data, total] = await Promise.all([
    MongoChat.aggregate([
      { $match: where },
      {
        $sort: {
          userBadFeedbackCount: -1,
          userGoodFeedbackCount: -1,
          customFeedbacksCount: -1,
          updateTime: -1
        }
      },
      { $skip: (pageNum - 1) * pageSize },
      { $limit: pageSize },
      {
        $lookup: {
          from: ChatItemCollectionName,
          let: { chatId: '$chatId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: and
                }
              }
            },
            {
              $project: {
                userGoodFeedback: 1,
                userBadFeedback: 1,
                customFeedbacks: 1,
                adminFeedback: 1
              }
            }
          ],
          as: 'chatitems'
        }
      },
      {
        $lookup: {
          from: AppCollectionName,
          localField: 'appId',
          foreignField: '_id',
          as: 'app'
        }
      },
      {
        $unwind: {
          path: '$app',
          preserveNullAndEmptyArrays: true // 空数组记录保留
        }
      },
      {
        $addFields: {
          userGoodFeedbackCount: {
            $size: {
              $filter: {
                input: '$chatitems',
                as: 'item',
                cond: { $ifNull: ['$$item.userGoodFeedback', false] }
              }
            }
          },
          userBadFeedbackCount: {
            $size: {
              $filter: {
                input: '$chatitems',
                as: 'item',
                cond: { $ifNull: ['$$item.userBadFeedback', false] }
              }
            }
          },
          customFeedbacksCount: {
            $size: {
              $filter: {
                input: '$chatitems',
                as: 'item',
                cond: { $gt: [{ $size: { $ifNull: ['$$item.customFeedbacks', []] } }, 0] }
              }
            }
          },
          markCount: {
            $size: {
              $filter: {
                input: '$chatitems',
                as: 'item',
                cond: { $ifNull: ['$$item.adminFeedback', false] }
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          id: '$chatId',
          title: 1,
          source: 1,
          appId: 1,
          time: '$updateTime',
          appName: '$app.name',
          messageCount: { $size: '$chatitems' },
          userGoodFeedbackCount: 1,
          userBadFeedbackCount: 1,
          customFeedbacksCount: 1,
          markCount: 1
        }
      }
    ]),
    MongoChat.countDocuments(where)
  ]);

  return {
    pageNum,
    pageSize,
    data,
    total
  };
}

export default NextAPI(handler);
