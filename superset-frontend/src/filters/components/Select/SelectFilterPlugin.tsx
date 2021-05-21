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
import {
  AppSection,
  DataMask,
  ensureIsArray,
  ExtraFormData,
  GenericDataType,
  JsonObject,
  smartDateDetailedFormatter,
  t,
  tn,
} from '@superset-ui/core';
import React, { useEffect, useReducer, useState } from 'react';
import { Select } from 'src/common/components';
import { debounce } from 'lodash';
import { SLOW_DEBOUNCE } from 'src/constants';
import { PluginFilterSelectProps, SelectValue } from './types';
import { StyledSelect, Styles } from '../common';
import { getDataRecordFormatter, getSelectExtraFormData } from '../../utils';

const { Option } = Select;

const debouncedOwnStateFunc = debounce(
  (dispatch: { (action: DataMaskAction): void }, val: string) => {
    dispatch({
      type: 'ownState',
      ownState: {
        search: val,
      },
    });
  },
  SLOW_DEBOUNCE,
);

type DataMaskAction =
  | { type: 'initialize'; dataMask: DataMask }
  | { type: 'ownState'; ownState: JsonObject }
  | {
      type: 'filterState';
      extraFormData: ExtraFormData;
      filterState: { value: SelectValue };
    };

function reducer(state: DataMask, action: DataMaskAction): DataMask {
  switch (action.type) {
    case 'ownState':
      return {
        ...state,
        ownState: {
          ...(state.ownState || {}),
          ...action.ownState,
        },
      };
    case 'filterState':
      return {
        ...state,
        extraFormData: action.extraFormData,
        filterState: {
          ...(state.filterState || {}),
          ...action.filterState,
        },
      };
    case 'initialize':
      return {
        ...action.dataMask,
      };
    default:
      return {
        ...state,
      };
  }
}

type DataMaskReducer = (
  prevState: DataMask,
  action: DataMaskAction,
) => DataMask;

export default function PluginFilterSelect(props: PluginFilterSelectProps) {
  const {
    coltypeMap,
    data,
    formData,
    height,
    isRefreshing,
    width,
    setDataMask,
    appSection,
  } = props;
  const {
    defaultValue,
    enableEmptyFilter,
    multiSelect,
    showSearch,
    inverseSelection,
    inputRef,
    defaultToFirstItem,
    searchAllOptions,
  } = formData;

  const isDisabled =
    appSection === AppSection.FILTER_CONFIG_MODAL && defaultToFirstItem;

  const groupby = ensureIsArray<string>(formData.groupby);
  // Correct initial value for Ant Select

  // If we are in config modal we always need show empty select for `defaultToFirstItem`
  const [values, setValues] = useState<SelectValue>([]);
  const [currentSuggestionSearch, setCurrentSuggestionSearch] = useState('');
  const [dataMask, dispatchDataMask] = useReducer<DataMaskReducer>(reducer, {});

  const searchWrapper = (val: string) => {
    if (searchAllOptions) {
      debouncedOwnStateFunc(dispatchDataMask, val);
    }
    setCurrentSuggestionSearch(val);
  };

  const clearSuggestionSearch = () => {
    setCurrentSuggestionSearch('');
    if (searchAllOptions) {
      dispatchDataMask({
        type: 'ownState',
        ownState: {
          search: null,
        },
      });
    }
  };

  useEffect(() => {
    if (!isDisabled && defaultValue?.length) {
      // initialize to default value
      setValues(defaultValue);
    }
    // initialize column types (these should only be set once)
    if (searchAllOptions) {
      dispatchDataMask({
        type: 'ownState',
        ownState: {
          coltypeMap,
        },
      });
    }
  }, []);

  useEffect(() => {
    const firstItem: SelectValue = data[0]
      ? (groupby.map(col => data[0][col]) as string[])
      : null;
    if (!isDisabled && defaultToFirstItem && firstItem) {
      // initialize to first value if set to default to first item
      setValues(firstItem);
    } else if (!isDisabled && defaultValue?.length) {
      // initialize to saved value
      setValues(defaultValue);
    }
  }, [defaultValue]);

  const [col] = groupby;
  const datatype: GenericDataType = coltypeMap[col];
  const labelFormatter = getDataRecordFormatter({
    timeFormatter: smartDateDetailedFormatter,
  });

  const handleChange = (value?: SelectValue | number | string) => {
    setValues(ensureIsArray(value));
  };

  useEffect(() => {
    if (isDisabled) {
      setValues([]);
    }
  }, [isDisabled]);

  useEffect(() => {
    const emptyFilter =
      enableEmptyFilter && !inverseSelection && values?.length === 0;

    dispatchDataMask({
      type: 'filterState',
      extraFormData: getSelectExtraFormData(
        col,
        values,
        emptyFilter,
        inverseSelection,
      ),
      filterState: {
        // We need to save in state `FIRST_VALUE` as some const and not as REAL value,
        // because when FiltersBar check if all filters initialized it compares `defaultValue` with this value
        // and because REAL value can be unpredictable for users that have different data for same dashboard we use `FIRST_VALUE`
        value: values,
      },
    });
  }, [col, enableEmptyFilter, inverseSelection, JSON.stringify(values)]);

  useEffect(() => {
    setDataMask(dataMask);
  }, [JSON.stringify(dataMask)]);

  const placeholderText =
    data.length === 0
      ? t('No data')
      : tn('%s option', '%s options', data.length, data.length);
  return (
    <Styles height={height} width={width}>
      <StyledSelect
        allowClear={!enableEmptyFilter}
        // @ts-ignore
        value={values}
        disabled={isDisabled}
        showSearch={showSearch}
        mode={multiSelect ? 'multiple' : undefined}
        placeholder={placeholderText}
        onSearch={searchWrapper}
        onSelect={clearSuggestionSearch}
        onBlur={clearSuggestionSearch}
        // @ts-ignore
        onChange={handleChange}
        ref={inputRef}
        loading={isRefreshing}
      >
        {data.map(row => {
          const [value] = groupby.map(col => row[col]);
          return (
            // @ts-ignore
            <Option key={`${value}`} value={value}>
              {labelFormatter(value, datatype)}
            </Option>
          );
        })}
        {currentSuggestionSearch &&
          !ensureIsArray(values).some(
            suggestion => suggestion === currentSuggestionSearch,
          ) && (
            <Option value={currentSuggestionSearch}>
              {currentSuggestionSearch}
            </Option>
          )}
      </StyledSelect>
    </Styles>
  );
}
