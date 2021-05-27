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
import shortid from 'shortid';
import { t, styled } from '@superset-ui/core';
import Button from 'src/components/Button';
import Icons from 'src/components/Icons';
import Fieldset from './Fieldset';
import { recurseReactClone } from './utils';
import './crud.less';

interface CRUDCollectionProps {
  allowAddItem?: boolean;
  allowDeletes?: boolean;
  collection: Array<object>;
  columnLabels?: object;
  emptyMessage?: ReactNode;
  expandFieldset?: ReactNode;
  extraButtons?: ReactNode;
  itemGenerator?: () => any;
  itemRenderers?: ((
    val: unknown,
    onChange: () => void,
    label: string,
    record: any,
  ) => ReactNode)[];
  onChange?: (arg0: any) => void;
  tableColumns: Array<any>;
  stickyHeader?: boolean;
}

interface CRUDCollectionState {
  collection: object;
  expandedColumns: object;
}
function createCollectionArray(collection: object)
{
  return Object.keys(collection).map(
    k => collection[k],
  );
}

function createKeyedCollection(arr: Array<object>) {
  const newArr = arr.map((o: any) => ({
    ...o,
    id: o.id || shortid.generate(),
  }));
  const map = {};
  newArr.forEach((o: any) => {
    map[o.id] = o;
  });
  return map;
}

const CrudTableWrapper = styled.div<{ stickyHeader?: boolean }>`
  ${({ stickyHeader }) =>
    stickyHeader &&
    `
      height: 350px;
      overflow: auto;

      thead th {
        background: #fff;
        position: sticky;
        top: 0;
        z-index: 9;
      }
    `}
`;

const CrudButtonWrapper = styled.div`
  text-align: right;
  ${({ theme }) => `margin-bottom: ${theme.gridUnit * 2}px`}
`;

export default class CRUDCollection extends React.PureComponent<
  CRUDCollectionProps,
  CRUDCollectionState
> {
  constructor(props: CRUDCollectionProps) {
    super(props);

    const collection = createKeyedCollection(props.collection);
    this.state = {
      expandedColumns: {},
      collection: collection,
      collectionArray: createCollectionArray(collection)
    };
    this.renderItem = this.renderItem.bind(this);
    this.onAddItem = this.onAddItem.bind(this);
    this.renderExpandableSection = this.renderExpandableSection.bind(this);
    this.getLabel = this.getLabel.bind(this);
    this.onFieldsetChange = this.onFieldsetChange.bind(this);
    this.renderTableBody = this.renderTableBody.bind(this);
    this.changeCollection = this.changeCollection.bind(this);
    this.sortColumn = this.sortColumn.bind(this);
  }

  UNSAFE_componentWillReceiveProps(nextProps: CRUDCollectionProps) {
    if (nextProps.collection !== this.props.collection) {
      const collection = createKeyedCollection(nextProps.collection);
      this.setState({
        collection: collection,
        collectionArray: createCollectionArray(collection)
      });
    }
  }

  onCellChange(id: number, col: string, val: boolean) {
    this.changeCollection({
      ...this.state.collection,
      [id]: {
        ...this.state.collection[id],
        [col]: val,
      },
    });
  }

  onAddItem() {
    if (this.props.itemGenerator) {
      let newItem = this.props.itemGenerator();
      if (!newItem.id) {
        newItem = { ...newItem, id: shortid.generate() };
      }
      this.changeCollection({
        ...this.state.collection,
        [newItem.id]: newItem,
      });
    }
  }

  onFieldsetChange(item: any) {
    this.changeCollection({
      ...this.state.collection,
      [item.id]: item,
    });
  }

  getLabel(col: any) {
    const { columnLabels } = this.props;
    let label = columnLabels && columnLabels[col] ? columnLabels[col] : col;
    if (label.startsWith('__')) {
      // special label-free columns (ie: caret for expand, delete cross)
      label = '';
    }
    return label;
  }

  changeCollection(collection: any) {
    this.setState({ collection });
    if (this.props.onChange) {
      this.props.onChange(Object.keys(collection).map(k => collection[k]));
    }
  }

  deleteItem(id: number) {
    const newColl = { ...this.state.collection };
    delete newColl[id];
    this.changeCollection(newColl);
  }

  effectiveTableColumns() {
    const { tableColumns, allowDeletes, expandFieldset } = this.props;
    const cols = allowDeletes
      ? tableColumns.concat(['__actions'])
      : tableColumns;
    return expandFieldset ? ['__expand'].concat(cols) : cols;
  }

  toggleExpand(id: any) {
    this.onCellChange(id, '__expanded', false);
    this.setState(prevState => ({
      expandedColumns: {
        ...prevState.expandedColumns,
        [id]: !prevState.expandedColumns[id],
      },
    }));
  }

  sortColumn(col, up){
    const { sortColumns } = this.props;
    return () => {
      if (sortColumns?.includes(col)) {
        const newCollection = this.state.collectionArray.sort((a,b)=>{
          const x = a[col];
          const y = b[col];
          if (up) {
            if(typeof x === "string") {
              return (x || "").localeCompare((y));
            } else {
              return x - y; 
            }
          } else {
            if(typeof x === "string") {
              return (y || "").localeCompare((x));
            } else {
              return y - x; 
            }
          }
        }).map(v=>v);
        this.setState({
          collectionArray: newCollection
        });
      }
    }
  }

  renderHeaderRow() {
    const cols = this.effectiveTableColumns();
    const { allowDeletes, expandFieldset, extraButtons, sortColumns} = this.props;
    return (
      <thead>
        <tr>
          {expandFieldset && <th aria-label="Expand" className="tiny-cell" />}
          {cols.map(col => (
            <th key={col}>
              {this.getLabel(col)}
              {sortColumns?.includes(col) && (
                <>
                  <button onClick={this.sortColumn(col, true)}> up</button>
                  <button onClick={this.sortColumn(col, false)}> down</button>
                </>
              )}
            </th>
          ))}
          {extraButtons}
          {allowDeletes && (
            <th key="delete-item" aria-label="Delete" className="tiny-cell" />
          )}
        </tr>
      </thead>
    );
  }

  renderExpandableSection(item: any) {
    const propsGenerator = () => ({ item, onChange: this.onFieldsetChange });
    return recurseReactClone(
      this.props.expandFieldset,
      Fieldset,
      propsGenerator,
    );
  }

  renderCell(record: any, col: any) {
    const renderer = this.props.itemRenderers && this.props.itemRenderers[col];
    const val = record[col];
    const onChange = this.onCellChange.bind(this, record.id, col);
    return renderer ? renderer(val, onChange, this.getLabel(col), record) : val;
  }

  renderItem(record: any) {
    const {
      allowAddItem,
      allowDeletes,
      expandFieldset,
      tableColumns,
    } = this.props;
    /* eslint-disable no-underscore-dangle */
    const isExpanded =
      !!this.state.expandedColumns[record.id] || record.__expanded;
    let tds = [];
    if (expandFieldset) {
      tds.push(
        <td key="__expand" className="expand">
          <i
            role="button"
            aria-label="Toggle expand"
            tabIndex={0}
            className={`fa fa-caret-${
              isExpanded ? 'down' : 'right'
            } text-primary pointer`}
            onClick={this.toggleExpand.bind(this, record.id)}
          />
        </td>,
      );
    }
    tds = tds.concat(
      tableColumns.map(col => (
        <td key={col}>{this.renderCell(record, col)}</td>
      )),
    );
    if (allowAddItem) {
      tds.push(<td key="add" />);
    }
    if (allowDeletes) {
      tds.push(
        <td
          key="__actions"
          data-test="crud-delete-option"
          className="text-primary"
        >
          <Icons.Trash
            aria-label="Delete item"
            className="pointer"
            data-test="crud-delete-icon"
            iconSize="m"
            role="button"
            tabIndex={0}
            onClick={this.deleteItem.bind(this, record.id)}
          />
        </td>,
      );
    }
    const trs = [
      <tr {...{ 'data-test': 'table-row' }} className="row" key={record.id}>
        {tds}
      </tr>,
    ];
    if (isExpanded) {
      trs.push(
        <tr className="exp" key={`exp__${record.id}`}>
          <td
            colSpan={this.effectiveTableColumns().length}
            className="expanded"
          >
            <div>{this.renderExpandableSection(record)}</div>
          </td>
        </tr>,
      );
    }
    return trs;
  }

  renderEmptyCell() {
    return (
      <tr>
        <td className="empty-collection">{this.props.emptyMessage}</td>
      </tr>
    );
  }

  renderTableBody() {
    const data = this.state.collectionArray; 
    console.log({ data});
    const content = data.length
      ? data.map(d => this.renderItem(d))
      : this.renderEmptyCell();
    return <tbody data-test="table-content-rows">{content}</tbody>;
  }

  render() {
    return (
      <>
        <CrudButtonWrapper>
          {this.props.allowAddItem && (
            <span className="m-t-10 m-r-10">
              <Button
                buttonSize="small"
                buttonStyle="primary"
                onClick={this.onAddItem}
                data-test="add-item-button"
              >
                <i data-test="crud-add-table-item" className="fa fa-plus" />{' '}
                {t('Add item')}
              </Button>
            </span>
          )}
        </CrudButtonWrapper>
        <CrudTableWrapper
          className="CRUD"
          stickyHeader={this.props.stickyHeader}
        >
          <table data-test="crud-table" className="table">
            {this.renderHeaderRow()}
            {this.renderTableBody()}
          </table>
        </CrudTableWrapper>
      </>
    );
  }
}
