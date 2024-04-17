// DODO was here

import React, { useCallback } from 'react';
import { FormattingPopoverProps } from '../../../../../explore/components/controls/ConditionalFormattingControl';
import { FormattingPopoverWrapper } from '../ConditionalFormattingControlDodoWrapper/FormattingPopoverWrapper';
import { FormattingPopoverContentDodo } from './FormattingPopoverContentDodo';

const FormattingPopoverDodo = (props: FormattingPopoverProps) => {
  const render = useCallback(
    params => <FormattingPopoverContentDodo {...params} />,
    [],
  );

  return <FormattingPopoverWrapper {...props} renderContent={render} />;
};

export { FormattingPopoverDodo };
