import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { UserAuthTypeEnum } from '@fastgpt/global/support/user/auth/constants';

export let codeList: { [key: string]: { code: string; type: UserAuthTypeEnum; time: number } } = {};

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    const code = Math.random().toFixed(6).slice(-6).toString();
    const { phone, type }: { phone: string; type: UserAuthTypeEnum } = req.body;

    if (phone.indexOf('138000000') === -1) {
      const sendCodeResult = await fetch('https://api-v4.mysubmail.com/sms/send', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          appid: '105295',
          to: req.body.phone,
          content: '【深湾】您的验证码为：' + code,
          signature: '4f444b444548db11b365f5ba798ad325'
        })
      });

      const sendCodeResultJson = await sendCodeResult.json();

      console.log('SMS: ', sendCodeResultJson);

      if (sendCodeResult.status === 200) {
        if (sendCodeResultJson.status === 'success') {
          codeList[req.body.phone] = {
            code: code,
            type: type,
            time: Date.now()
          };
          jsonRes(res);
        } else {
          jsonRes(res, {
            code: 500,
            error: sendCodeResultJson.status
          });
        }
      } else {
        jsonRes(res, {
          code: 500,
          error: 'send message error: ' + sendCodeResult.status
        });
      }
    } else {
    }

    console.log('code:', code);

    codeList[phone] = {
      code: code,
      type: type,
      time: Date.now()
    };

    console.log('codeList', codeList);

    jsonRes(res);
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
