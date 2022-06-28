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
import React, { useState, useEffect } from 'react';
import { Row, Col } from 'src/components';
import { Input, TextArea } from 'src/components/Input';
import { t, styled, useTheme } from '@superset-ui/core';
import Button from 'src/components/Button';
import { Menu } from 'src/components/Menu';
import { Form, FormItem } from 'src/components/Form';
import Modal from 'src/components/Modal';
import SaveDatasetActionButton from 'src/SqlLab/components/SaveDatasetActionButton';
import { SaveDatasetModal } from 'src/SqlLab/components/SaveDatasetModal';

interface SaveQueryProps {
  query: any;
  defaultLabel: string;
  onSave: (arg0: QueryPayload) => void;
  onUpdate: (arg0: QueryPayload) => void;
  saveQueryWarning: string | null;
  database: Record<string, any>;
}

type QueryPayload = {
  autorun: boolean;
  dbId: number;
  description?: string;
  id?: string;
  latestQueryId: string;
  queryLimit: number;
  remoteId: number;
  schema: string;
  schemaOptions: Array<{
    label: string;
    title: string;
    value: string;
  }>;
  selectedText: string | null;
  sql: string;
  tableOptions: Array<{
    label: string;
    schema: string;
    title: string;
    type: string;
    value: string;
  }>;
  title: string;
};

export default function SaveQuery({
  query,
  defaultLabel = t('Undefined'),
  onSave = () => {},
  onUpdate,
  saveQueryWarning = null,
  database,
}: SaveQueryProps) {
  const [description, setDescription] = useState<string>(
    query.description || '',
  );
  const [label, setLabel] = useState<string>(defaultLabel);
  const [showSave, setShowSave] = useState<boolean>(false);
  const [showSaveDatasetModal, setShowSaveDatasetModal] = useState(false);
  const isSaved = !!query.remoteId;
  const theme = useTheme();
  const canExploreDatabase = !!database?.allows_virtual_table_explore;

  const Styles = styled.span`
    span[role='img'] {
      display: flex;
      margin: 0;
      color: ${theme.colors.grayscale.base};
      svg {
        vertical-align: -${theme.gridUnit * 1.25}px;
        margin: 0;
      }
    }
  `;

  const overlayMenu = (
    <Menu>
      <Menu.Item onClick={() => setShowSaveDatasetModal(true)}>
        {t('Save dataset')}
      </Menu.Item>
    </Menu>
  );

  const queryPayload = () => ({
    ...query,
    title: label,
    description,
  });

  useEffect(() => {
    if (!isSaved) {
      setLabel(defaultLabel);
    }
  }, [defaultLabel]);

  const close = () => {
    setShowSave(false);
  };

  const onSaveWrapper = () => {
    onSave(queryPayload());
    close();
  };

  const onUpdateWrapper = () => {
    onUpdate(queryPayload());
    close();
  };

  const onLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value);
  };

  const onDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const toggleSave = () => {
    setShowSave(!showSave);
  };

  const renderModalBody = () => (
    <Form layout="vertical">
      <Row>
        <Col xs={24}>
          <FormItem label={t('Name')}>
            <Input type="text" value={label} onChange={onLabelChange} />
          </FormItem>
        </Col>
      </Row>
      <br />
      <Row>
        <Col xs={24}>
          <FormItem label={t('Description')}>
            <TextArea
              rows={4}
              value={description}
              onChange={onDescriptionChange}
            />
          </FormItem>
        </Col>
      </Row>
      {saveQueryWarning && (
        <>
          <br />
          <div>
            <Row>
              <Col xs={24}>
                <small>{saveQueryWarning}</small>
              </Col>
            </Row>
            <br />
          </div>
        </>
      )}
    </Form>
  );

  return (
    <Styles className="SaveQuery">
      <SaveDatasetActionButton
        toggleSave={toggleSave}
        overlayMenu={canExploreDatabase ? overlayMenu : null}
      />
      <SaveDatasetModal
        visible={showSaveDatasetModal}
        onHide={() => setShowSaveDatasetModal(false)}
        buttonTextOnSave={t('Save')}
        buttonTextOnOverwrite={t('Overwrite')}
        datasource={query}
      />
      <Modal
        className="save-query-modal"
        onHandledPrimaryAction={onSaveWrapper}
        onHide={close}
        primaryButtonName={isSaved ? t('Save') : t('Save as')}
        width="620px"
        show={showSave}
        title={<h4>{t('Save query')}</h4>}
        footer={[
          <>
            <Button onClick={close} data-test="cancel-query" cta>
              {t('Cancel')}
            </Button>
            <Button
              buttonStyle={isSaved ? undefined : 'primary'}
              onClick={onSaveWrapper}
              className="m-r-3"
              cta
            >
              {isSaved ? t('Save as new') : t('Save')}
            </Button>
            {isSaved && (
              <Button
                buttonStyle="primary"
                onClick={onUpdateWrapper}
                className="m-r-3"
                cta
              >
                {t('Update')}
              </Button>
            )}
          </>,
        ]}
      >
        {renderModalBody()}
      </Modal>
    </Styles>
  );
}
