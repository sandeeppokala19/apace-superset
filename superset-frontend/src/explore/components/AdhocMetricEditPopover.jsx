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
import PropTypes from 'prop-types';
import { FormGroup } from 'react-bootstrap';
import { CardTabs } from 'src/common/components/Tabs';
import Button from 'src/components/Button';
import Select from 'src/components/Select';
import { t } from '@superset-ui/core';
import { ColumnOption } from '@superset-ui/chart-controls';

import FormLabel from 'src/components/FormLabel';
import { SQLEditor } from 'src/components/AsyncAceEditor';
import sqlKeywords from 'src/SqlLab/utils/sqlKeywords';

import { AGGREGATES_OPTIONS } from '../constants';
import columnType from '../propTypes/columnType';
import AdhocMetric, { EXPRESSION_TYPES } from '../AdhocMetric';

const propTypes = {
  adhocMetric: PropTypes.instanceOf(AdhocMetric).isRequired,
  onChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onResize: PropTypes.func.isRequired,
  columns: PropTypes.arrayOf(columnType),
  datasourceType: PropTypes.string,
  title: PropTypes.shape({
    label: PropTypes.string,
    hasCustomLabel: PropTypes.bool,
  }),
};

const defaultProps = {
  columns: [],
};

const startingWidth = 300;
const startingHeight = 180;

export default class AdhocMetricEditPopover extends React.Component {
  constructor(props) {
    super(props);
    this.onSave = this.onSave.bind(this);
    this.onColumnChange = this.onColumnChange.bind(this);
    this.onAggregateChange = this.onAggregateChange.bind(this);
    this.onSqlExpressionChange = this.onSqlExpressionChange.bind(this);
    this.onDragDown = this.onDragDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.handleAceEditorRef = this.handleAceEditorRef.bind(this);
    this.refreshAceEditor = this.refreshAceEditor.bind(this);
    this.state = {
      adhocMetric: this.props.adhocMetric,
      width: startingWidth,
      height: startingHeight,
    };
    this.selectProps = {
      labelKey: 'label',
      isMulti: false,
      autosize: false,
      clearable: true,
    };
    document.addEventListener('mouseup', this.onMouseUp);
  }

  componentWillUnmount() {
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('mousemove', this.onMouseMove);
  }

  onSave() {
    this.props.onChange({
      ...this.state.adhocMetric,
      ...this.props.title,
    });
    this.props.onClose();
  }

  onColumnChange(column) {
    this.setState(prevState => ({
      adhocMetric: prevState.adhocMetric.duplicateWith({
        column,
        expressionType: EXPRESSION_TYPES.SIMPLE,
      }),
    }));
  }

  onAggregateChange(aggregate) {
    // we construct this object explicitly to overwrite the value in the case aggregate is null
    this.setState(prevState => ({
      adhocMetric: prevState.adhocMetric.duplicateWith({
        aggregate,
        expressionType: EXPRESSION_TYPES.SIMPLE,
      }),
    }));
  }

  onSqlExpressionChange(sqlExpression) {
    this.setState(prevState => ({
      adhocMetric: prevState.adhocMetric.duplicateWith({
        sqlExpression,
        expressionType: EXPRESSION_TYPES.SQL,
      }),
    }));
  }

  onDragDown(e) {
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.dragStartWidth = this.state.width;
    this.dragStartHeight = this.state.height;
    document.addEventListener('mousemove', this.onMouseMove);
  }

  onMouseMove(e) {
    this.props.onResize();
    this.setState({
      width: Math.max(
        this.dragStartWidth + (e.clientX - this.dragStartX),
        startingWidth,
      ),
      height: Math.max(
        this.dragStartHeight + (e.clientY - this.dragStartY) * 2,
        startingHeight,
      ),
    });
  }

  onMouseUp() {
    document.removeEventListener('mousemove', this.onMouseMove);
  }

  handleAceEditorRef(ref) {
    if (ref) {
      this.aceEditorRef = ref;
    }
  }

  refreshAceEditor() {
    setTimeout(() => {
      if (this.aceEditorRef) {
        this.aceEditorRef.editor.resize();
      }
    }, 0);
  }

  renderColumnOption(option) {
    return <ColumnOption column={option} showType />;
  }

  render() {
    const {
      adhocMetric: propsAdhocMetric,
      columns,
      onChange,
      onClose,
      onResize,
      datasourceType,
      ...popoverProps
    } = this.props;

    const { adhocMetric } = this.state;
    const keywords = sqlKeywords.concat(
      columns.map(column => ({
        name: column.column_name,
        value: column.column_name,
        score: 50,
        meta: 'column',
      })),
    );

    const columnSelectProps = {
      placeholder: t('%s column(s)', columns.length),
      options: columns,
      value:
        (adhocMetric.column && adhocMetric.column.column_name) ||
        adhocMetric.inferSqlExpressionColumn(),
      onChange: this.onColumnChange,
      optionRenderer: this.renderColumnOption,
      valueKey: 'column_name',
    };

    const aggregateSelectProps = {
      placeholder: t('%s aggregates(s)', AGGREGATES_OPTIONS.length),
      options: AGGREGATES_OPTIONS,
      value: adhocMetric.aggregate || adhocMetric.inferSqlExpressionAggregate(),
      onChange: this.onAggregateChange,
    };

    if (this.props.datasourceType === 'druid') {
      aggregateSelectProps.options = aggregateSelectProps.options.filter(
        aggregate => aggregate !== 'AVG',
      );
    }

    const stateIsValid = adhocMetric.isValid();
    const hasUnsavedChanges = !adhocMetric.equals(propsAdhocMetric);
    return (
      <div
        id="metrics-edit-popover"
        data-test="metrics-edit-popover"
        {...popoverProps}
      >
        <CardTabs
          id="adhoc-metric-edit-tabs"
          data-test="adhoc-metric-edit-tabs"
          defaultActiveKey={adhocMetric.expressionType}
          className="adhoc-metric-edit-tabs"
          style={{ height: this.state.height, width: this.state.width }}
          onChange={this.refreshAceEditor}
        >
          <CardTabs.TabPane
            className="adhoc-metric-edit-tab"
            key={EXPRESSION_TYPES.SIMPLE}
            tab="Simple"
          >
            <FormGroup>
              <FormLabel>
                <strong>column</strong>
              </FormLabel>
              <Select
                name="select-column"
                {...this.selectProps}
                {...columnSelectProps}
              />
            </FormGroup>
            <FormGroup>
              <FormLabel>
                <strong>aggregate</strong>
              </FormLabel>
              <Select
                name="select-aggregate"
                {...this.selectProps}
                {...aggregateSelectProps}
                autoFocus
              />
            </FormGroup>
          </CardTabs.TabPane>
          <CardTabs.TabPane
            className="adhoc-metric-edit-tab"
            key={EXPRESSION_TYPES.SQL}
            tab="Custom SQL"
            data-test="adhoc-metric-edit-tab#custom"
          >
            {this.props.datasourceType !== 'druid' ? (
              <FormGroup data-test="sql-editor">
                <SQLEditor
                  showLoadingForImport
                  ref={this.handleAceEditorRef}
                  keywords={keywords}
                  height={`${this.state.height - 43}px`}
                  onChange={this.onSqlExpressionChange}
                  width="100%"
                  showGutter={false}
                  value={
                    adhocMetric.sqlExpression || adhocMetric.translateToSql()
                  }
                  editorProps={{ $blockScrolling: true }}
                  enableLiveAutocompletion
                  className="adhoc-filter-sql-editor"
                  wrapEnabled
                />
              </FormGroup>
            ) : (
              <div className="custom-sql-disabled-message">
                Custom SQL Metrics are not available on druid datasources
              </div>
            )}
          </CardTabs.TabPane>
        </CardTabs>
        <div>
          <Button
            disabled={!stateIsValid}
            buttonStyle={
              hasUnsavedChanges && stateIsValid ? 'primary' : 'default'
            }
            buttonSize="small"
            className="m-r-5"
            data-test="AdhocMetricEdit#save"
            onClick={this.onSave}
            cta
          >
            Save
          </Button>
          <Button
            buttonSize="small"
            onClick={this.props.onClose}
            data-test="AdhocMetricEdit#cancel"
            cta
          >
            Close
          </Button>
          <i
            role="button"
            aria-label="Resize"
            tabIndex={0}
            onMouseDown={this.onDragDown}
            className="fa fa-expand edit-popover-resize text-muted"
          />
        </div>
      </div>
    );
  }
}
AdhocMetricEditPopover.propTypes = propTypes;
AdhocMetricEditPopover.defaultProps = defaultProps;
