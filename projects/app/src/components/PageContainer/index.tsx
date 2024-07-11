import React from 'react';
import { useTheme, type BoxProps } from '@chakra-ui/react';
import MyBox from '@fastgpt/web/components/common/MyBox';

const PageContainer = ({
  children,
  isLoading,
  insertProps = {},
  ...props
}: BoxProps & { isLoading?: boolean; insertProps?: BoxProps }) => {
  const theme = useTheme();
  return (
    <MyBox
      h={'100%'}
      borderLeftWidth={'1px'}
      borderColor={'borderColor.base'}
      pr={[0, '16px']}
      {...props}
    >
      <MyBox
        isLoading={isLoading}
        h={'100%'}
        // borderColor={'borderColor.base'}
        // borderWidth={[0, 1]}
        // boxShadow={'1.5'}
        overflow={'overlay'}
        bg={'white'}
        // borderRadius={[0, '16px']}
        {...insertProps}
      >
        {children}
      </MyBox>
    </MyBox>
  );
};

export default PageContainer;
