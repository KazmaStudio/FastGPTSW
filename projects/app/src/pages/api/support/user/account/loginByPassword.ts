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
    const { username, password, phone, code, type } = req.body as PostLoginProps;

    if ((type === 1 && (!username || !password)) || (type === 0 && (!phone || !code))) {
      throw new Error('缺少参数');
    }

    let userData;

    if (type === 1) {
      // 检测用户是否存在
      const authCert = await MongoUser.findOne(
        {
          username
        },
        'status'
      );

      const authCertPhone = await MongoUser.findOne(
        {
          phone: username
        },
        'status'
      );

      if (!authCert && !authCertPhone) {
        throw new Error('用户未注册');
      }

      if (
        (authCert && authCert.status === UserStatusEnum.forbidden) ||
        (authCertPhone && authCertPhone.status === UserStatusEnum.forbidden)
      ) {
        throw new Error('账号已停用，无法登录');
      }

      const user = await MongoUser.findOne({
        username,
        password
      });

      const userPhone = await MongoUser.findOne({
        phone: username,
        password
      });

      userData = user;

      if (!user && userPhone) {
        userData = userPhone;
      }

      if (!userData) {
        throw new Error('密码错误');
      }
    }

    if (type === 0 && phone) {
      if (!codeList[phone]) {
        throw new Error('请先获取验证码');
      }

      if (codeList[phone].type !== 'wxLogin') {
        throw new Error('请先获取验证码');
      }

      if (code !== codeList[phone].code) {
        throw new Error('验证码错误');
      }

      if (Date.now() - codeList[phone].time > 60 * 1000) {
        throw new Error('请先获取验证码');
      }

      const authCert = await MongoUser.findOne(
        {
          phone
        },
        'status'
      );

      if (!authCert) {
        throw new Error('用户未注册');
      }

      if (authCert && authCert.status === UserStatusEnum.forbidden) {
        throw new Error('账号已停用，无法登录');
      }

      userData = await MongoUser.findOne({
        phone
      });
    }

    if (userData) {
      const userDetail = await getUserDetail({
        tmbId: userData?.lastLoginTmbId,
        userId: userData._id
      });

      MongoUser.findByIdAndUpdate(userData._id, {
        lastLoginTmbId: userDetail.team.tmbId
      });

      const token = createJWT(userDetail);
      setCookie(res, token);

      jsonRes(res, {
        data: {
          user: userDetail,
          token
        }
      });
    } else {
      throw new Error('账户信息异常');
    }
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
