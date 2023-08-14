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
import React, { ChangeEvent, useState, useEffect } from 'react';
import rison from 'rison';
import Modal from 'src/components/Modal';
import AsyncSelect from 'src/components/Select/AsyncSelect';
import { FormLabel } from 'src/components/Form';
import { t, SupersetClient } from '@superset-ui/core';
import { Input } from 'antd';
import { Divider } from 'src/components';
import Button from 'src/components/Button';
import { Tag } from 'src/views/CRUD/types';
import { fetchObjects } from 'src/features/tags/tags';

interface TaggableResourceOption {
  label: string;
  value: number;
  key: number;
}

enum TaggableResources {
  Chart = 'chart',
  Dashboard = 'dashboard',
  SavedQuery = 'query',
}

interface TagModalProps {
  onHide: () => void;
  refreshData: () => void;
  addSuccessToast: (msg: string) => void;
  addDangerToast: (msg: string) => void;
  show: boolean;
  editTag: Tag | null;
}

const TagModal: React.FC<TagModalProps> = ({
  show,
  onHide,
  editTag,
  refreshData,
  addSuccessToast,
  addDangerToast,
}) => {
  const [dashboardsToTag, setDashboardsToTag] = useState<
    TaggableResourceOption[]
  >([]);
  const [chartsToTag, setChartsToTag] = useState<TaggableResourceOption[]>([]);
  const [savedQueriesToTag, setSavedQueriesToTag] = useState<
    TaggableResourceOption[]
  >([]);

  const [tagName, setTagName] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const isEditMode = !!editTag;
  const modalTitle = isEditMode ? 'Edit Tag' : 'Create Tag';

  useEffect(() => {
    setDashboardsToTag([]);
    setChartsToTag([]);
    setSavedQueriesToTag([]);
    const dashboards: TaggableResourceOption[] = [];
    const charts: TaggableResourceOption[] = [];
    const queries: TaggableResourceOption[] = [];
    if (isEditMode) {
      fetchObjects(
        { tags: editTag.name, types: null },
        (data: Tag[]) => {
          data.forEach(function (object) {
            if (object.type === TaggableResources.Dashboard)
              dashboards.push({
                value: object.id,
                label: object.name,
                key: object.id,
              });
            else if (object.type === TaggableResources.Chart)
              charts.push({
                value: object.id,
                label: object.name,
                key: object.id,
              });
            else if (object.type === TaggableResources.SavedQuery)
              queries.push({
                value: object.id,
                label: object.name,
                key: object.id,
              });
          });
          setDashboardsToTag(dashboards);
          setChartsToTag(charts);
          setSavedQueriesToTag(queries);
        },
        (error: Response) => {
          addDangerToast('Error Fetching Tagged Objects');
        },
      );
      setTagName(editTag.name);
      setDescription(editTag.description);
    }
  }, [editTag]);

  const loadData = async (
    search: string,
    page: number,
    pageSize: number,
    columns: string[],
    filterColumn: string,
    orderColumn: string,
    endpoint: string,
  ) => {
    const queryParams = rison.encode({
      columns,
      filters: [
        {
          col: filterColumn,
          opr: 'ct',
          value: search,
        },
      ],
      page,
      order_column: orderColumn,
    });

    const { json } = await SupersetClient.get({
      endpoint: `/api/v1/${endpoint}/?q=${queryParams}`,
    });
    const { result, count } = json;

    return {
      data: result.map((item: { id: number }) => ({
        value: item.id,
        label: item[filterColumn],
      })),
      totalCount: count,
    };
  };

  const loadCharts = async (search: string, page: number, pageSize: number) =>
    loadData(
      search,
      page,
      pageSize,
      ['id', 'slice_name'],
      'slice_name',
      'slice_name',
      'chart',
    );

  const loadDashboards = async (
    search: string,
    page: number,
    pageSize: number,
  ) =>
    loadData(
      search,
      page,
      pageSize,
      ['id', 'dashboard_title'],
      'dashboard_title',
      'dashboard_title',
      'dashboard',
    );

  const loadQueries = async (search: string, page: number, pageSize: number) =>
    loadData(
      search,
      page,
      pageSize,
      ['id', 'label'],
      'label',
      'label',
      'saved_query',
    );

  const handleOptionChange = (resource: TaggableResources, data: any) => {
    if (resource === TaggableResources.Dashboard) setDashboardsToTag(data);
    else if (resource === TaggableResources.Chart) setChartsToTag(data);
    else if (resource === TaggableResources.SavedQuery)
      setSavedQueriesToTag(data);
  };

  const handleTagNameChange = (ev: ChangeEvent<HTMLInputElement>) =>
    setTagName(ev.target.value);
  const handleDescriptionChange = (ev: ChangeEvent<HTMLInputElement>) =>
    setDescription(ev.target.value);

  const onSave = () => {
    const dashboards = dashboardsToTag.map(dash => ['dashboard', dash.value]);
    const charts = chartsToTag.map(chart => ['chart', chart.value]);
    const savedQueries = savedQueriesToTag.map(q => ['query', q.value]);

    if (isEditMode) {
      SupersetClient.put({
        endpoint: `/api/v1/tag/${editTag.id}`,
        jsonPayload: {
          description,
          name: tagName,
          objects_to_tag: [...dashboards, ...charts, ...savedQueries],
        },
      }).then(({ json = {} }) => {
        refreshData();
        addSuccessToast(t('Tag updated'));
      });
    } else {
      SupersetClient.post({
        endpoint: `/api/v1/tag/`,
        jsonPayload: {
          description,
          name: tagName,
          objects_to_tag: [...dashboards, ...charts, ...savedQueries],
        },
      }).then(({ json = {} }) => {
        refreshData();
        addSuccessToast(t('Tag created'));
      });
    }
    onHide();
  };

  return (
    <Modal
      title={modalTitle}
      onHide={() => {
        setTagName('');
        setDescription('');
        setDashboardsToTag([]);
        setChartsToTag([]);
        setSavedQueriesToTag([]);
        onHide();
      }}
      show={show}
      footer={
        <div>
          <Button
            data-test="modal-save-dashboard-button"
            buttonStyle="secondary"
            onClick={onHide}
          >
            {t('Cancel')}
          </Button>
          <Button
            data-test="modal-save-dashboard-button"
            buttonStyle="primary"
            onClick={onSave}
          >
            {t('Save')}
          </Button>
        </div>
      }
    >
      <>
        <FormLabel>{t('Tag Name')}</FormLabel>
        <Input
          onChange={handleTagNameChange}
          placeholder={t('Name of your tag')}
          value={tagName}
        />
        <FormLabel>{t('Description')}</FormLabel>
        <Input
          onChange={handleDescriptionChange}
          placeholder={t('Add description of your tag')}
          value={description}
        />
        <Divider />
        <AsyncSelect
          ariaLabel={t('Select Dashboards')}
          mode="multiple"
          name="dashboards"
          // @ts-ignore
          value={dashboardsToTag}
          options={loadDashboards}
          onChange={value =>
            handleOptionChange(TaggableResources.Dashboard, value)
          }
          header={<FormLabel>{t('Dashboards')}</FormLabel>}
          allowClear
        />
        <AsyncSelect
          ariaLabel={t('Select Charts')}
          mode="multiple"
          name="charts"
          // @ts-ignore
          value={chartsToTag}
          options={loadCharts}
          onChange={value => handleOptionChange(TaggableResources.Chart, value)}
          header={<FormLabel>{t('Charts')}</FormLabel>}
          allowClear
        />
        <AsyncSelect
          ariaLabel={t('Select Saved Queries')}
          mode="multiple"
          name="savedQueries"
          // @ts-ignore
          value={savedQueriesToTag}
          options={loadQueries}
          onChange={value =>
            handleOptionChange(TaggableResources.SavedQuery, value)
          }
          header={<FormLabel>{t('Saved Queries')}</FormLabel>}
          allowClear
        />
      </>
    </Modal>
  );
};

export default TagModal;
