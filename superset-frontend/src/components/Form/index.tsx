/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import React from 'react';
import { Input } from 'antd';
import { styled } from '@superset-ui/core';
// import * as alertSVG from 'images/icons/alert.svg';
import Form from './Form';
import FormItem from './FormItem';
import FormLabel from './FormLabel';

// console.log('---alertString--- ', alertSVG);

export interface LabeledErrorBoundInputProps {
  label?: string;
  name: string;
  validationMethods:
    | { onBlur: (value: any) => void }
    | { onChange: (value: any) => void };
  errorMessage: string | null;
  helpText?: string;
  value: string | number | readonly string[] | undefined;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  type?: string;
  id?: string;
  onChange?: any;
}

const StyledInput = styled(Input)`
  margin: 8px 0;
`;

const LabeledErrorBoundInput = ({
  label,
  validationMethods,
  errorMessage,
  helpText,
  required = false,
  id,
  ...props
}: LabeledErrorBoundInputProps) => (
  <>
    <FormLabel htmlFor={id} required={required}>
      {label}
    </FormLabel>
    <FormItem
      validateTrigger={Object.keys(validationMethods)}
      validateStatus={errorMessage ? 'error' : 'success'}
      help={errorMessage || helpText}
      hasFeedback={!!errorMessage}
      {...props}
    >
      <StyledInput {...props} {...validationMethods} />
    </FormItem>
  </>
);

export default LabeledErrorBoundInput;

export { Form, FormItem, FormLabel };
