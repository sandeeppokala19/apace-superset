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
import React, { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { SupersetClient, SupersetTheme, t } from '@superset-ui/core';
import Modal from 'src/components/Modal';
import Collapse from 'src/components/Collapse';
import {
  Upload,
  AntdForm,
  Col,
  Row,
  AntdButton as Button,
  AsyncSelect,
  Select,
  Typography,
} from 'src/components';
import { Divider, Switch } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { Input, InputNumber } from 'src/components/Input';
import rison from 'rison';
import { UploadChangeParam, UploadFile } from 'antd/lib/upload/interface';
import withToasts from 'src/components/MessageToasts/withToasts';
import { getClientErrorObject } from 'src/utils/getClientErrorObject';
import {
  antDModalStyles,
  antDModalNoPaddingStyles,
  antdCollapseStyles,
  StyledFormItem,
} from './styles';

interface CSVUploadModalProps {
  onHide: () => void;
  show: boolean;
}

interface UploadInfo {
  database_id: number;
  table_name: string;
  schema: string;
  delimiter: string;
  already_exists: string;
  skip_initial_space: boolean;
  skip_blank_lines: boolean;
  day_first: boolean;
  decimal_character: string;
  null_values: Array<string>;
  header_row: string;
  rows_to_read: string | null;
  skip_rows: string;
  column_dates: Array<string>;
  index_column: string | null;
  dataframe_index: boolean;
  column_labels: string;
  columns_read: Array<string>;
  overwrite_duplicates: boolean;
  column_data_types: string;
}

const defaultUploadInfo: UploadInfo = {
  database_id: 0,
  table_name: '',
  schema: '',
  delimiter: ',',
  already_exists: 'fail',
  skip_initial_space: false,
  skip_blank_lines: false,
  day_first: false,
  decimal_character: '.',
  null_values: [],
  header_row: '0',
  rows_to_read: null,
  skip_rows: '0',
  column_dates: [],
  index_column: null,
  dataframe_index: false,
  column_labels: '',
  columns_read: [],
  overwrite_duplicates: false,
  column_data_types: '',
};

const CSVUploadModal: FunctionComponent<CSVUploadModalProps> = ({
  onHide,
  show,
}) => {
  const [form] = AntdForm.useForm();
  // Declare states here
  const [databaseId, setDatabaseId] = useState<number>(0);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [columns, setColumns] = React.useState<string[]>([]);
  const [delimiter, setDelimiter] = useState<string>(',');

  const nullValuesOptions = [
    {
      value: '""',
      label: 'Empty Strings ""',
    },
    {
      value: 'None',
      label: 'None',
    },
    {
      value: 'nan',
      label: 'nan',
    },
    {
      value: 'null',
      label: 'null',
    },
    {
      value: 'N/A',
      label: 'N/A',
    },
  ];

  const delimiterOptions = [
    {
      value: ',',
      label: 'Comma ","',
    },
    {
      value: ';',
      label: 'Semicolon ";"',
    },
    {
      value: '\t',
      label: 'Tab "\\t"',
    },
    {
      value: '|',
      label: 'Pipe',
    },
  ];

  const tableAlreadyExistsOptions = [
    {
      value: 'fail',
      label: 'Fail',
    },
    {
      value: 'replace',
      label: 'Replace',
    },
    {
      value: 'append',
      label: 'Append',
    },
  ];

  const onChangeDatabase = (database: { value: number; label: string }) => {
    setDatabaseId(database?.value);
  };

  const onChangeDelimiter = (value: string) => {
    setDelimiter(value);
  };

  const clearModal = () => {
    setFileList([]);
    form.resetFields();
  };

  const loadDatabaseOptions = useMemo(
    () =>
      (input = '', page: number, pageSize: number) => {
        const query = rison.encode_uri({
          filters: [
            {
              col: 'allow_file_upload',
              opr: 'eq',
              value: true,
            },
          ],
          page,
          page_size: pageSize,
        });
        return SupersetClient.get({
          endpoint: `/api/v1/database/?q=${query}`,
        }).then(response => {
          const list = response.json.result.map(
            (item: { id: number; database_name: string }) => ({
              value: item.id,
              label: item.database_name,
            }),
          );
          return { data: list, totalCount: response.json.count };
        });
      },
    [],
  );

  const onClose = () => {
    clearModal();
    onHide();
  };

  const onFinish = () => {
    const fields = form.getFieldsValue();
    console.log(fields);
    fields.database_id = databaseId;
    const mergedValues = { ...defaultUploadInfo, ...fields };
    console.log(mergedValues);
    const formData = new FormData();
    const file = fileList[0]?.originFileObj;
    if (file) {
      formData.append('file', file);
    }
    formData.append('delimiter', mergedValues.delimiter);
    formData.append('table_name', mergedValues.table_name);
    formData.append('schema', mergedValues.schema);
    formData.append('already_exists', mergedValues.already_exists);
    formData.append('skip_initial_space', mergedValues.skip_initial_space);
    formData.append('skip_blank_lines', mergedValues.skip_blank_lines);
    formData.append('day_first', mergedValues.day_first);
    formData.append('decimal_character', mergedValues.decimal_character);
    formData.append('null_values', mergedValues.null_values);
    formData.append('header_row', mergedValues.header_row);
    if (mergedValues.rows_to_read != null) {
      formData.append('rows_to_read', mergedValues.rows_to_read);
    }
    formData.append('skip_rows', mergedValues.skip_rows);
    formData.append('column_dates', mergedValues.column_dates);
    if (mergedValues.index_column != null) {
      formData.append('index_column', mergedValues.index_column);
    }
    formData.append('dataframe_index', mergedValues.dataframe_index);
    formData.append('column_labels', mergedValues.column_labels);
    formData.append('columns_read', mergedValues.columns_read);
    formData.append('overwrite_duplicates', mergedValues.overwrite_duplicates);
    formData.append('column_data_types', mergedValues.column_data_types);
    return SupersetClient.post({
      endpoint: `/api/v1/database/${databaseId}/csv_upload/`,
      body: formData,
      headers: { Accept: 'application/json' },
    })
      .then(() => true)
      .catch(response =>
        getClientErrorObject(response).then(error => {
          if (!error.errors) {
            console.log(error.message || error.error);
            return false;
          }
          return false;
        }),
      )
      .finally(() => {
        console.log('finally');
      });
  };

  const onRemoveFile = (removedFile: UploadFile) => {
    setFileList(fileList.filter(file => file.uid !== removedFile.uid));
    setColumns([]);
    return false;
  };

  const columnsToOptions = () =>
    columns.map(column => ({
      value: column,
      label: column,
    }));

  const readFileContent = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = event => {
        if (event.target) {
          const text = event.target.result as string;
          resolve(text);
        } else {
          reject(new Error('Failed to read file content'));
        }
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file content'));
      };
      reader.readAsText(file.slice(0, 10000)); // Read only first 10000 bytes to get the first line
    });

  const processFileContent = async (file: File) => {
    try {
      const text = await readFileContent(file);
      const firstLine = text.split('\n')[0].trim();
      const firstRow = firstLine
        .split(delimiter)
        .map(column => column.replace(/^"(.*)"$/, '$1'));
      setColumns(firstRow);
    } catch (error) {
      message.error('Failed to process file content');
    }
  };

  const onChangeFile = async (info: UploadChangeParam<any>) => {
    setFileList([
      {
        ...info.file,
        status: 'done',
      },
    ]);
    await processFileContent(info.file.originFileObj);
  };

  useEffect(() => {
    if (columns.length > 0) {
      processFileContent(fileList[0].originFileObj);
    }
  }, [delimiter]);

  const validateUpload = (_: any, value: string) => {
    if (fileList.length === 0) {
      return Promise.reject(t('Uploading a file is required'));
    }
    return Promise.resolve();
  };

  const validateDatabase = (_: any, value: string) => {
    if (!databaseId) {
      return Promise.reject(t('Selecting a database is required'));
    }
    return Promise.resolve();
  };

  return (
    <Modal
      css={(theme: SupersetTheme) => [
        antDModalNoPaddingStyles,
        antDModalStyles(theme),
      ]}
      name="database"
      data-test="database-modal"
      onHandledPrimaryAction={form.submit}
      onHide={onClose}
      primaryButtonName="Save"
      centered
      show={show}
      title={<h4>CSV Upload</h4>}
    >
      <AntdForm
        form={form}
        onFinish={onFinish}
        data-test="dashboard-edit-properties-form"
        layout="vertical"
        initialValues={defaultUploadInfo}
      >
        <Collapse
          expandIconPosition="right"
          accordion
          defaultActiveKey="general"
          css={(theme: SupersetTheme) => antdCollapseStyles(theme)}
        >
          <Collapse.Panel
            header={
              <div>
                <h4>{t('General information')}</h4>
                <p className="helper">
                  {t('Upload a CSV file to a database.')}
                </p>
              </div>
            }
            key="general"
          >
            <Row>
              <Col>
                <StyledFormItem
                  label={t('CSV File')}
                  name="upload"
                  required
                  rules={[{ validator: validateUpload }]}
                >
                  <Upload
                    name="modelFile"
                    id="modelFile"
                    data-test="model-file-input"
                    accept=".csv"
                    fileList={fileList}
                    onChange={onChangeFile}
                    onRemove={onRemoveFile}
                    // upload is handled by hook
                    customRequest={() => {}}
                  >
                    <Button icon={<UploadOutlined />}>Upload</Button>
                  </Upload>
                </StyledFormItem>
              </Col>
              <Col>
                {columns.length > 0 && (
                  <>
                    <Typography.Text type="success">
                      Loaded {columns.length} column(s):
                    </Typography.Text>
                    {columns.map((column, index) => (
                      <Typography.Text key={index} code type="success">
                        {column}
                      </Typography.Text>
                    ))}
                  </>
                )}
              </Col>
            </Row>
            <Divider orientation="left">Basic</Divider>
            <Row justify="space-between">
              <Col span={11}>
                <StyledFormItem
                  label={t('Database')}
                  name="database"
                  required
                  rules={[{ validator: validateDatabase }]}
                >
                  <AsyncSelect
                    ariaLabel={t('Select a database')}
                    options={loadDatabaseOptions}
                    onChange={onChangeDatabase}
                    allowClear
                  />
                </StyledFormItem>
                <p className="help-block">
                  {t('Select a database to upload the file to')}
                </p>
              </Col>
              <Col span={11}>
                <StyledFormItem
                  label={t('Table Name')}
                  name="table_name"
                  required
                  rules={[
                    { required: true, message: 'Table name is required' },
                  ]}
                >
                  <Input
                    aria-label={t('Table Name')}
                    name="table_name"
                    data-test="properties-modal-name-input"
                    type="text"
                  />
                </StyledFormItem>
                <p className="help-block">
                  {t('Name of table to be created with CSV file')}
                </p>
              </Col>
            </Row>
            <Row justify="space-between">
              <Col span={11}>
                <StyledFormItem label={t('Schema')} name="schema">
                  <Input type="text" />
                </StyledFormItem>
                <p className="help-block">
                  {t('Select a schema if the database supports this')}
                </p>
              </Col>
              <Col span={11}>
                <StyledFormItem label={t('Delimiter')} name="delimiter">
                  <Select
                    options={delimiterOptions}
                    onChange={onChangeDelimiter}
                    allowNewOptions
                  />
                </StyledFormItem>
                <p className="help-block">
                  {t('Select a delimiter for this data')}
                </p>
              </Col>
            </Row>
          </Collapse.Panel>
          <Collapse.Panel
            header={
              <div>
                <h4>{t('File Settings')}</h4>
                <p className="helper">
                  {t('Adjust how the file will be imported.')}
                </p>
              </div>
            }
            key="2"
          >
            <Row>
              <Col span={24}>
                <StyledFormItem
                  label={t('If Table Already Exists')}
                  name="already_exists"
                >
                  <Select options={tableAlreadyExistsOptions} />
                </StyledFormItem>
                <p className="help-block">
                  {t('What should happen if the table already exists')}
                </p>
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <StyledFormItem
                  label={t('Skip Initial Space')}
                  name="skip_initial_space"
                >
                  <Switch />
                </StyledFormItem>
                <p className="help-block">{t('Skip spaces after delimiter')}</p>
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <StyledFormItem
                  label={t('Skip Blank Lines')}
                  name="skip_blank_lines"
                >
                  <Switch />
                </StyledFormItem>
                <p className="help-block">
                  {t(
                    'Skip blank lines rather than interpreting them as Not A Number values',
                  )}
                </p>
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <StyledFormItem
                  label={t('Columns To Be Parsed as Dates')}
                  name="column_dates"
                >
                  <Select
                    mode="multiple"
                    options={columnsToOptions()}
                    allowClear
                    allowNewOptions
                  />
                </StyledFormItem>
                <p className="help-block">
                  {t(
                    'A comma separated list of columns that should be parsed as dates',
                  )}
                </p>
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <StyledFormItem label={t('Day First')} name="day_first">
                  <Switch />
                </StyledFormItem>
                <p className="help-block">
                  {t('DD/MM format dates, international and European format')}
                </p>
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <StyledFormItem
                  label={t('Decimal Character')}
                  name="decimal_character"
                >
                  <Input type="text" defaultValue="." />
                </StyledFormItem>
                <p className="help-block">
                  {t('Character to interpret as decimal point')}
                </p>
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <StyledFormItem label={t('Null Values')} name="null_values">
                  <Select
                    mode="multiple"
                    options={nullValuesOptions}
                    allowClear
                    allowNewOptions
                  />
                </StyledFormItem>
                <p className="help-block">
                  {t(
                    'Json list of the values that should be treated as null. Examples: [""] for empty strings, ["None", "N/A"], ["nan", "null"]. Warning: Hive database supports only a single value',
                  )}
                </p>
              </Col>
            </Row>
          </Collapse.Panel>
          <Collapse.Panel
            header={
              <div>
                <h4>{t('Columns')}</h4>
                <p className="helper">{t('Adjust column settings.')}</p>
              </div>
            }
            key="3"
          >
            <Row>
              <Col span={24}>
                <StyledFormItem label={t('Index Column')} name="index_column">
                  <Select
                    options={columns.map(column => ({
                      value: column,
                      label: column,
                    }))}
                    allowClear
                    allowNewOptions
                  />
                </StyledFormItem>
                <p className="help-block">
                  {t(
                    'Column to use as the row labels of the dataframe. Leave empty if no index column',
                  )}
                </p>
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <StyledFormItem
                  label={t('Dataframe Index')}
                  name="dataframe_index"
                >
                  <Switch />
                </StyledFormItem>
                <p className="help-block">
                  {t('Write dataframe index as a column')}
                </p>
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <StyledFormItem
                  label={t('Column Label(s)')}
                  name="column_labels"
                >
                  <Input type="text" />
                </StyledFormItem>
                <p className="help-block">
                  {t(
                    'Column label for index column(s). If None is given and Dataframe Index is checked, Index Names are used',
                  )}
                </p>
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <StyledFormItem
                  label={t('Columns To Read')}
                  name="columns_read"
                >
                  <Select
                    mode="multiple"
                    options={columnsToOptions()}
                    allowClear
                    allowNewOptions
                  />
                </StyledFormItem>
                <p className="help-block">
                  {t('List of the column names that should be read')}
                </p>
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <StyledFormItem
                  label={t('Overwrite Duplicate Columns')}
                  name="overwrite_duplicates"
                >
                  <Switch />
                </StyledFormItem>
                <p className="help-block">
                  {t(
                    'If duplicate columns are not overridden, they will be presented as "X.1, X.2 ...X.x"',
                  )}
                </p>
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <StyledFormItem
                  label={t('Column Data Types')}
                  name="column_data_types"
                >
                  <Input type="text" />
                </StyledFormItem>
                <p className="help-block">
                  {t(
                    'A dictionary with column names and their data types if you need to change the defaults. Example: {"user_id":"int"}. Check Python\'s Pandas library for supported data types.',
                  )}
                </p>
              </Col>
            </Row>
          </Collapse.Panel>
          <Collapse.Panel
            header={
              <div>
                <h4>{t('Rows')}</h4>
                <p className="helper">{t('Adjust row settings.')}</p>
              </div>
            }
            key="4"
          >
            <Row>
              <Col span={24}>
                <StyledFormItem label={t('Header Row')} name="header_row">
                  <Input type="text" defaultValue={0} />
                </StyledFormItem>
                <p className="help-block">
                  {t(
                    'Row containing the headers to use as column names (0 is first line of data). Leave empty if there is no header row.',
                  )}
                </p>
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <StyledFormItem label={t('Rows to Read')} name="rows_to_read">
                  <InputNumber min={0} />
                </StyledFormItem>
                <p className="help-block">
                  {t('Number of rows of file to read.')}
                </p>
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <StyledFormItem label={t('Skip Rows')} name="skip_rows">
                  <InputNumber min={0} />
                </StyledFormItem>
                <p className="help-block">
                  {t('Number of rows to skip at start of file.')}
                </p>
              </Col>
            </Row>
          </Collapse.Panel>
        </Collapse>
      </AntdForm>
    </Modal>
  );
};

export default withToasts(CSVUploadModal);
