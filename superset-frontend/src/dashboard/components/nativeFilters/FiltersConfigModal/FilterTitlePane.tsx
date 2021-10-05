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
import React from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { FilterRemoval } from './types';
import FilterTitleContainer from './FilterTitleContainer';

interface Props {
  removedFilters: Record<string, FilterRemoval>;
  restoreFilter: (id: string) => void;
  getFilterTitle: (id: string) => string;
  onRearrage: (dragIndex: number, targetIndex: number) => void;
  onRemove: (id: string) => void;
  currentFilterId: string;
  onChange: (id: string) => void;
  onEdit: (filterId: string, action: 'add' | 'remove') => void;
  filterGroups: string[][];
}

const StyledHeader = styled.div`
  ${({ theme }) => `
    color: ${theme.colors.grayscale.dark1};
    font-size: ${theme.typography.sizes.l}px;
    padding-top: ${theme.gridUnit * 4}px;
    padding-right: ${theme.gridUnit * 4}px;
    padding-left: ${theme.gridUnit * 4}px;
    padding-bottom: ${theme.gridUnit * 2}px;
  `}
`;

const TabsContainer = styled.div`
  height: 100%;
  overflow-y: scroll;
  display: flex;
  flex-direction: column;
`;

const StyledAddFilterBox = styled.div`
  color: ${({ theme }) => theme.colors.primary.dark1};
  padding: ${({ theme }) => theme.gridUnit * 2}px;
  border-top: 1px solid ${({ theme }) => theme.colors.grayscale.light2};
  cursor: pointer;
  margin-top: auto;
  &:hover {
    color: ${({ theme }) => theme.colors.primary.base};
  }
`;

const FilterTitlePane: React.FC<Props> = ({
  getFilterTitle,
  onChange,
  onEdit,
  onRemove,
  onRearrage,
  restoreFilter,
  currentFilterId,
  filterGroups,
  removedFilters,
}) => (
  <>
    <TabsContainer>
      <StyledHeader>Filters</StyledHeader>
      <div css={{ height: '100%', 'overflow-y': 'scroll' }}>
        <FilterTitleContainer
          filterGroups={filterGroups}
          getFilterTitle={getFilterTitle}
          onChange={onChange}
          currentFilterId={currentFilterId}
          removedFilters={removedFilters}
          onRemove={onRemove}
          onRearrage={onRearrage}
          restoreFilter={restoreFilter}
        />
      </div>
      <StyledAddFilterBox
        onClick={() => {
          onEdit('', 'add');
          setTimeout(() => {
            const element = document.getElementById('native-filters-tabs');
            if (element) {
              const navList = element.getElementsByClassName(
                'ant-tabs-nav-list',
              )[0];
              navList.scrollTop = navList.scrollHeight;
            }
          }, 0);
        }}
      >
        <PlusOutlined />{' '}
        <span
          data-test="add-filter-button"
          aria-label="Add filter"
          role="button"
        >
          {t('Add filter')}
        </span>
      </StyledAddFilterBox>
    </TabsContainer>
  </>
);

export default FilterTitlePane;
