export enum UserAuthTypeEnum {
  register = 'register',
  findPassword = 'findPassword',
  wxLogin = 'wxLogin',
  login = 'login',
  changePhone = 'changePhone'
}

export const userAuthTypeMap = {
  [UserAuthTypeEnum.register]: 'register',
  [UserAuthTypeEnum.findPassword]: 'findPassword',
  [UserAuthTypeEnum.wxLogin]: 'wxLogin',
  [UserAuthTypeEnum.login]: 'login',
  [UserAuthTypeEnum.changePhone]: 'changePhone'
};
