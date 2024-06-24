import { Box, BoxProps } from '@chakra-ui/react';
import MySelect from '@fastgpt/web/components/common/MySelect';
import { useTranslation } from 'next-i18next';
import React from 'react';
import type { PermissionValueType } from '@fastgpt/global/support/permission/type';
import { ReadPermissionVal, WritePermissionVal } from '@fastgpt/global/support/permission/constant';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';

export enum defaultPermissionEnum {
  private = 'private',
  read = 'read',
  edit = 'edit'
}

type Props = Omit<BoxProps, 'onChange'> & {
  per: PermissionValueType;
  defaultPer: PermissionValueType;
  readPer?: PermissionValueType;
  writePer?: PermissionValueType;
  type?: string;
  onChange: (v: PermissionValueType) => Promise<any> | any;
};

const DefaultPermissionList = ({
  per,
  defaultPer,
  readPer = ReadPermissionVal,
  writePer = WritePermissionVal,
  onChange,
  type,
  ...styles
}: Props) => {
  const { t } = useTranslation();
  let defaultPermissionSelectList = [
    { label: '仅协作者访问', value: defaultPer },
    { label: '团队可访问', value: readPer },
    { label: '团队可编辑', value: writePer }
  ];

  if (type === 'custom') {
    defaultPermissionSelectList = [
      { label: '私有', value: defaultPer },
      { label: '共享', value: readPer }
    ];
  }
  const { runAsync: onRequestChange, loading } = useRequest2(async (v: PermissionValueType) =>
    onChange(v)
  );

  return (
    <Box {...styles}>
      <MySelect
        isLoading={loading}
        list={defaultPermissionSelectList}
        value={per}
        onchange={onRequestChange}
      />
    </Box>
  );
};

export default DefaultPermissionList;
