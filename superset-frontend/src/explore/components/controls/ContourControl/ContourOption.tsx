/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with work for additional information
 * regarding copyright ownership.  The ASF licenses file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use file except in compliance
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
import { Tooltip } from 'src/components/Tooltip';
import { styled } from '@superset-ui/core';
import { ContourOptionProps } from './types';
import OptionWrapper from '../DndColumnSelectControl/OptionWrapper';

const StyledOptionWrapper = styled(OptionWrapper)`
  max-width: 100%;
  min-width: 100%;
`;

const StyledListItem = styled.li`
  display: flex;
  align-items: center;
`;

const ColorPatch = styled.div<{ formattedColor: string }>`
  background-color: ${({ formattedColor }) => formattedColor};
  height: 5px;
  width: 5px;
  margin: 0 5px;
`;

const ContourOption = ({
  contour,
  index,
  onClose,
  onShift,
}: ContourOptionProps) => {
  const { lowerThreshold, upperThreshold, color, strokeWidth } = contour;

  const isIsoband = upperThreshold;

  const formattedColor = color
    ? `rgba(${color.r}, ${color.g}, ${color.b}, 1)`
    : 'undefined';

  const formatIsoline = (threshold: number, color: any, width: any) =>
    `Threshold: ${threshold}, color: ${formattedColor}, stroke width: ${width}`;

  const formatIsoband = (threshold: number[], color: any) =>
    `Threshold: [${threshold[0]}, ${threshold[1]}], color: ${formattedColor}`;

  const displayString = isIsoband
    ? formatIsoband([lowerThreshold || -1, upperThreshold], color)
    : formatIsoline(lowerThreshold || -1, color, strokeWidth);

  const overlay = (
    <div className="contour-tooltip-overlay">
      <StyledListItem>
        Threshold:{' '}
        {isIsoband
          ? `[${lowerThreshold}, ${upperThreshold}]`
          : `${lowerThreshold}`}
      </StyledListItem>
      <StyledListItem>
        Color: <ColorPatch formattedColor={formattedColor} /> {formattedColor}
      </StyledListItem>
      {!isIsoband && (
        <StyledListItem>Stroke Width: {strokeWidth}</StyledListItem>
      )}
    </div>
  );

  return (
    <Tooltip
      placement="bottom"
      id={`contour-option-${index}-tooltip`}
      overlay={overlay}
    >
      <StyledOptionWrapper
        key={index}
        index={index}
        label={displayString}
        type="ContourOption"
        withCaret
        clickClose={onClose}
        onShiftOptions={onShift}
        tooltipTitle=""
      />
    </Tooltip>
  );
};

export default ContourOption;
