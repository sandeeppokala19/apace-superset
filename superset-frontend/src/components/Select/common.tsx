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
import { styled, t } from '@superset-ui/core';
import { Spin } from 'antd';
import Icons from 'src/components/Icons';
import AntdSelect, {
  SelectProps as AntdSelectProps,
  SelectValue as AntdSelectValue,
  LabeledValue as AntdLabeledValue,
} from 'antd/lib/select';
import { rankedSearchCompare } from 'src/utils/rankedSearchCompare';
import React, {
  ReactElement,
  ReactNode,
  RefObject,
  JSXElementConstructor,
} from 'react';
import { hasOption } from './utils';
import { DownOutlined, SearchOutlined } from '@ant-design/icons';

const { Option } = AntdSelect;

export type AntdProps = AntdSelectProps<AntdSelectValue>;

export type AntdExposedProps = Pick<
  AntdProps,
  | 'allowClear'
  | 'autoFocus'
  | 'disabled'
  | 'filterOption'
  | 'filterSort'
  | 'loading'
  | 'labelInValue'
  | 'maxTagCount'
  | 'notFoundContent'
  | 'onChange'
  | 'onClear'
  | 'onDeselect'
  | 'onSelect'
  | 'onFocus'
  | 'onBlur'
  | 'onPopupScroll'
  | 'onSearch'
  | 'onDropdownVisibleChange'
  | 'placeholder'
  | 'showArrow'
  | 'showSearch'
  | 'tokenSeparators'
  | 'value'
  | 'getPopupContainer'
  | 'menuItemSelectedIcon'
>;

export type SelectOptionsType = Exclude<AntdProps['options'], undefined>;

export type SelectOptionsTypePage = {
  data: SelectOptionsType;
  totalCount: number;
};

export type SelectOptionsPagePromise = (
  search: string,
  page: number,
  pageSize: number,
) => Promise<SelectOptionsTypePage>;

export const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

export const StyledSelect = styled(AntdSelect)`
  ${({ theme }) => `
    && .ant-select-selector {
      border-radius: ${theme.gridUnit}px;
    }
    // Open the dropdown when clicking on the suffix
    // This is fixed in version 4.16
    .ant-select-arrow .anticon:not(.ant-select-suffix) {
      pointer-events: none;
    }
  `}
`;

export const StyledStopOutlined = styled(Icons.StopOutlined)`
  vertical-align: 0;
`;

export const StyledCheckOutlined = styled(Icons.CheckOutlined)`
  vertical-align: 0;
`;

export const StyledSpin = styled(Spin)`
  margin-top: ${({ theme }) => -theme.gridUnit}px;
`;

export const StyledLoadingText = styled.div`
  ${({ theme }) => `
    margin-left: ${theme.gridUnit * 3}px;
    line-height: ${theme.gridUnit * 8}px;
    color: ${theme.colors.grayscale.light1};
  `}
`;

export const MAX_TAG_COUNT = 4;
export const TOKEN_SEPARATORS = [',', '\n', '\t', ';'];
export const EMPTY_OPTIONS: SelectOptionsType = [];

export const DEFAULT_SORT_COMPARATOR = (
  a: AntdLabeledValue,
  b: AntdLabeledValue,
  search?: string,
) => {
  let aText: string | undefined;
  let bText: string | undefined;
  if (typeof a.label === 'string' && typeof b.label === 'string') {
    aText = a.label;
    bText = b.label;
  } else if (typeof a.value === 'string' && typeof b.value === 'string') {
    aText = a.value;
    bText = b.value;
  }
  // sort selected options first
  if (typeof aText === 'string' && typeof bText === 'string') {
    if (search) {
      return rankedSearchCompare(aText, bText, search);
    }
    return aText.localeCompare(bText);
  }
  return (a.value as number) - (b.value as number);
};

/**
 * It creates a comparator to check for a specific property.
 * Can be used with string and number property values.
 * */
export const propertyComparator =
  (property: string) => (a: AntdLabeledValue, b: AntdLabeledValue) => {
    if (typeof a[property] === 'string' && typeof b[property] === 'string') {
      return a[property].localeCompare(b[property]);
    }
    return (a[property] as number) - (b[property] as number);
  };

export const sortSelectedFirstHelper = (
  a: AntdLabeledValue,
  b: AntdLabeledValue,
  selectValue:
    | string
    | number
    | RawValue[]
    | AntdLabeledValue
    | AntdLabeledValue[]
    | undefined,
) =>
  selectValue && a.value !== undefined && b.value !== undefined
    ? Number(hasOption(b.value, selectValue)) -
      Number(hasOption(a.value, selectValue))
    : 0;

export const sortComparatorWithSearchHelper = (
  a: AntdLabeledValue,
  b: AntdLabeledValue,
  inputValue: string,
  sortCallback: (a: AntdLabeledValue, b: AntdLabeledValue) => number,
  sortComparator: (
    a: AntdLabeledValue,
    b: AntdLabeledValue,
    search?: string | undefined,
  ) => number,
) => sortCallback(a, b) || sortComparator(a, b, inputValue);

export const sortComparatorForNoSearchHelper = (
  a: AntdLabeledValue,
  b: AntdLabeledValue,
  sortCallback: (a: AntdLabeledValue, b: AntdLabeledValue) => number,
  sortComparator: (
    a: AntdLabeledValue,
    b: AntdLabeledValue,
    search?: string | undefined,
  ) => number,
) => sortCallback(a, b) || sortComparator(a, b, '');

// use a function instead of component since every rerender of the
// Select component will create a new component
export const getSuffixIcon = (
  isLoading: boolean | undefined,
  showSearch: boolean,
  isDropdownVisible: boolean,
) => {
  if (isLoading) {
    return <StyledSpin size="small" />;
  }
  if (showSearch && isDropdownVisible) {
    return <SearchOutlined />;
  }
  return <DownOutlined />;
};

export const dropDownRenderHelper = (
  originNode: ReactElement & { ref?: RefObject<HTMLElement> },
  isDropdownVisible: boolean,
  isLoading: boolean | undefined,
  optionsLength: number,
  errorComponent?: JSX.Element,
) => {
  if (!isDropdownVisible) {
    originNode.ref?.current?.scrollTo({ top: 0 });
  }
  if (isLoading && optionsLength === 0) {
    return <StyledLoadingText>{t('Loading...')}</StyledLoadingText>;
  }
  return errorComponent ? errorComponent : originNode;
};

export const handleFilterOptionHelper = (
  search: string,
  option: AntdLabeledValue,
  optionFilterProps: string[],
  filterOption: boolean | Function,
) => {
  if (typeof filterOption === 'function') {
    return filterOption(search, option);
  }

  if (filterOption) {
    const searchValue = search.trim().toLowerCase();
    if (optionFilterProps && optionFilterProps.length) {
      return optionFilterProps.some(prop => {
        const optionProp = option?.[prop]
          ? String(option[prop]).trim().toLowerCase()
          : '';
        return optionProp.includes(searchValue);
      });
    }
  }

  return false;
};

export const hasCustomLabels = (options: SelectOptionsType) =>
  options?.some(opt => !!opt?.customLabel);

export interface BaseSelectProps extends AntdExposedProps {
  /**
   * It enables the user to create new options.
   * Can be used with standard or async select types.
   * Can be used with any mode, single or multiple.
   * False by default.
   * */
  allowNewOptions?: boolean;
  /**
   * It adds the aria-label tag for accessibility standards.
   * Must be plain English and localized.
   */
  ariaLabel?: string;
  /**
   * Renders the dropdown
   */
  dropdownRender?: (
    menu: ReactElement<any, string | JSXElementConstructor<any>>,
  ) => ReactElement<any, string | JSXElementConstructor<any>>;
  /**
   * It adds a header on top of the Select.
   * Can be any ReactNode.
   */
  header?: ReactNode;
  /**
   * It allows to define which properties of the option object
   * should be looked for when searching.
   * By default label and value.
   */
  mappedMode?: 'multiple' | 'tags';
  /**
   * It allows to define which properties of the option object
   * should be looked for when searching.
   * By default label and value.
   */
  optionFilterProps?: string[];
  /**
   * It shows a stop-outlined icon at the far right of a selected
   * option instead of the default checkmark.
   * Useful to better indicate to the user that by clicking on a selected
   * option it will be de-selected.
   * False by default.
   */
  invertSelection?: boolean;
  /**
   * Customize how filtered options are sorted while users search.
   * Will not apply to predefined `options` array when users are not searching.
   */
  sortComparator?: typeof DEFAULT_SORT_COMPARATOR;

  suffixIcon?: ReactNode;

  ref: RefObject<HTMLInputElement>;
}

export const renderSelectOptions = (options: SelectOptionsType) => {
  return options.map(opt => {
    const isOptObject = typeof opt === 'object';
    const label = isOptObject ? opt?.label || opt.value : opt;
    const value = isOptObject ? opt.value : opt;
    const { customLabel, ...optProps } = opt;
    return (
      <Option {...optProps} key={value} label={label} value={value}>
        {isOptObject && customLabel ? customLabel : label}
      </Option>
    );
  });
};
