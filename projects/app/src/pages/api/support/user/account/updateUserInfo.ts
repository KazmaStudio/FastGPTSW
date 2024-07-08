import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { createJWT, setCookie } from '@fastgpt/service/support/permission/controller';
import { connectToDatabase } from '@/service/mongo';
import { getUserDetail } from '@fastgpt/service/support/user/controller';
import type { PostLoginProps } from '@fastgpt/global/support/user/api.d';
import { UserStatusEnum } from '@fastgpt/global/support/user/constant';
import { codeList } from './sendAuthCode';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { username, password, phone, code, type, userId } = req.body as {
      userId: string;
      phone: string;
      type: number;
      code: string;
      password: string;
      username: string;
    };

    console.log(username, password, phone, code, type, userId);
    console.log(codeList);

    if (type === 0 && (!username || !userId)) {
      throw new Error('缺少参数');
    }

    if (type === 1 && (!phone || !userId || !code)) {
      throw new Error('缺少参数');
    }

    if (type === 2 && (!password || !userId || !code || !phone)) {
      throw new Error('缺少参数');
    }

    if ((type === 1 || type === 2) && phone) {
      if (!codeList[phone]) {
        throw new Error('请先获取验证码');
      }

      if (type === 1 && codeList[phone].type !== 'changePhone') {
        throw new Error('请先获取验证码');
      }

      if (type === 2 && codeList[phone].type !== 'findPassword') {
        throw new Error('请先获取验证码');
      }

      if (code !== codeList[phone].code) {
        throw new Error('验证码错误');
      }

      if (Date.now() - codeList[phone].time > 15 * 60 * 1000) {
        delete codeList[phone];
        throw new Error('请先获取验证码');
      }
    }

    const authCert = await MongoUser.findOne(
      {
        _id: userId
      },
      'status'
    );

    if (!authCert) {
      throw new Error('用户未注册');
    }

    if (authCert && authCert.status === UserStatusEnum.forbidden) {
      throw new Error('账号已停用，无法修改信息');
    }

    if (type === 0) {
      const inputUsername = await MongoUser.findOne(
        {
          username
        },
        'status'
      );
      if (inputUsername) {
        throw new Error('用户名已存在');
      }
      await MongoUser.findByIdAndUpdate(userId, {
        username
      });
      jsonRes(res, {
        data: {
          username
        }
      });
    } else if (type === 1) {
      const inputPhone = await MongoUser.findOne(
        {
          phone
        },
        'status'
      );
      if (inputPhone) {
        throw new Error('手机号已存在');
      }
      delete codeList[phone];
      await MongoUser.findByIdAndUpdate(userId, {
        phone
      });
      console.log(codeList);

      jsonRes(res, {
        data: {
          phone
        }
      });
    } else if (type === 2) {
      await MongoUser.findByIdAndUpdate(userId, {
        password
      });
      delete codeList[phone];
      jsonRes(res, {
        data: {}
      });
    }
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
