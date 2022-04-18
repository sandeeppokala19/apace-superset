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
import React, { ReactNode } from 'react';
import Slider from 'src/components/Slider';
import ControlHeader from 'src/explore/components/ControlHeader';

type SliderControlProps = {
  onChange: (value: number) => void;
  value: number;
  default?: number;
  name: string;
  description: string;

  // ControlHeader props
  label: string;
  renderTrigger?: boolean;
  validationErrors?: string[];
  rightNode?: ReactNode;
  leftNode?: ReactNode;
  hovered?: boolean;
  warning?: string;
  danger?: string;
  onClick?: () => void;
  tooltipOnClick?: () => void;
};

export default function SliderControl(props: SliderControlProps) {
  const {
    default: defaultValue,
    name,
    label,
    description,
    renderTrigger,
    rightNode,
    leftNode,
    validationErrors,
    hovered,
    warning,
    danger,
    onClick,
    tooltipOnClick,
    onChange = () => {},
    ...rest
  } = props;
  const headerProps = {
    name,
    label,
    description,
    renderTrigger,
    rightNode,
    leftNode,
    validationErrors,
    onClick,
    hovered,
    tooltipOnClick,
    warning,
    danger,
  };
  return (
    <>
      <ControlHeader {...headerProps} />
      <Slider {...rest} onChange={onChange} defaultValue={defaultValue} />
    </>
  );
}
