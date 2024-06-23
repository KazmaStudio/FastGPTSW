import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { hashStr } from '@fastgpt/global/common/string/tools';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import {
  TeamMemberRoleEnum,
  TeamMemberStatusEnum
} from '@fastgpt/global/support/user/team/constant';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    const { username, password, code, phone, department } = req.body;

    if (!username || !password || !code) {
      throw new Error('缺少参数');
    }

    // 检测用户是否存在
    const inputUsername = await MongoUser.findOne(
      {
        username
      },
      'status'
    );
    if (inputUsername) {
      throw new Error('用户名已存在');
    }

    const inputPhone = await MongoUser.findOne(
      {
        phone
      },
      'status'
    );
    if (inputPhone) {
      throw new Error('手机号已存在');
    }

    if (code !== '000000') {
      throw new Error('验证码错误');
    }

    const userId = await registgerUser(username, password, phone, department);

    jsonRes(res, {
      data: {
        userId: userId
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }

  async function registgerUser(
    username: string,
    psw: string,
    phone: string,
    department: string
  ): Promise<any> {
    try {
      let userId = '';
      await mongoSessionRun(async (session) => {
        const [{ _id }] = await MongoUser.create(
          [
            {
              username: username,
              password: hashStr(psw),
              phone: phone,
              department: department
            }
          ],
          { session }
        );
        userId = _id;

        const team = await MongoTeam.findOne();

        await MongoTeamMember.create(
          [
            {
              teamId: team?._id,
              userId,
              name: 'visitor',
              role: TeamMemberRoleEnum.visitor,
              status: TeamMemberStatusEnum.active,
              createTime: new Date(),
              defaultTeam: true
            }
          ],
          { session }
        );

        // init root team
        // await createDefaultTeam({ userId: rootId, balance: 9999 * PRICE_SCALE, session });
      });
      return userId;
    } catch (error) {
      console.error(new Date(), 'register user error', error);
    }
  }
}
