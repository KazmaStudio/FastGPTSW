import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';

export let codeList: any = {};

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    const code = Math.random().toFixed(6).slice(-6).toString();
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
    if (sendCodeResult.status === 200) {
      if (sendCodeResultJson.status === 'success') {
        codeList[req.body.phone] = {
          code: code,
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
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
