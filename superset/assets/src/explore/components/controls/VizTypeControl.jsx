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
import {
  Label, Row, Col, FormControl, Modal, OverlayTrigger,
  Tooltip } from 'react-bootstrap';
import { t } from '@superset-ui/translation';
import { getChartMetadataRegistry } from '@superset-ui/chart';

import ControlHeader from '../ControlHeader';
import './VizTypeControl.css';

const propTypes = {
  description: PropTypes.string,
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  value: PropTypes.string.isRequired,
};

const defaultProps = {
  onChange: () => {},
};

export default class VizTypeControl extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      filter: '',
      vizTypeStats: '',
    };
    this.toggleModal = this.toggleModal.bind(this);
    this.changeSearch = this.changeSearch.bind(this);
    this.setSearchRef = this.setSearchRef.bind(this);
    this.focusSearch = this.focusSearch.bind(this);
  }
  onChange(vizType) {
    this.props.onChange(vizType);
    this.setState({ showModal: false });
  }
  setSearchRef(searchRef) {
    this.searchRef = searchRef;
  }
  toggleModal() {
    this.setState({ showModal: !this.state.showModal });
  }
  changeSearch(event) {
    this.setState({ filter: event.target.value });
  }
  focusSearch() {
    if (this.searchRef) {
      this.searchRef.focus();
    }
  }
  componentDidMount() {
    $.get("/superset/viz_type_stats", (data) => {
      this.setState({ vizTypeStats: data.this_user.concat(data.overall) });
      this.forceUpdate();
    });
  }
  renderItem(entry) {
    const { value } = this.props;
    const { key, value: type } = entry;
    const isSelected = key === value;
    return (
      <div
        className={`viztype-selector-container ${isSelected ? 'selected' : ''}`}
        onClick={this.onChange.bind(this, key)}
      >
        <img
          alt={type.name}
          width="100%"
          className={`viztype-selector ${isSelected ? 'selected' : ''}`}
          src={type.thumbnail}
        />
        <div className="viztype-label">
          {type.name}
        </div>
      </div>);
  }
  getVizTypeByKey(types, key) {
    for (var i = 0; i < types.length; i++) {
      if (types[i].key == key) return types[i];
    }
  }
  sortVizTypes(types) {
    var sorted = [];
    var loaded_keys = new Set();
    // Sort based on existing visualization type usages statistics
    for (var i = 0; i < this.state.vizTypeStats.length; i++) {
      var key = this.state.vizTypeStats[i].viz_type;
      if (loaded_keys.has(key)) continue;
      var t = this.getVizTypeByKey(types, key);
      if (typeof t !== 'undefined') {
        sorted.push(t);
        loaded_keys.add(key);
      }
    }
    // For visualization types that do not have any statistics, apply the
    // original order
    for (var i = 0; i < types.length; i++) {
      var t = types[i];
      var key = t['key'];
      if (! loaded_keys.has(key)) {
        sorted.push(t);
        loaded_keys.add(key);
      }
    }
    return sorted;
  }
  render() {
    const { filter, showModal } = this.state;
    const { value } = this.props;

    const registry = getChartMetadataRegistry();
    const types = this.sortVizTypes(registry.entries());
    const filteredTypes = filter.length > 0
      ? types.filter(type => type.value.name.toLowerCase().includes(filter))
      : types;

    const selectedType = registry.get(value);

    const imgPerRow = 6;
    const rows = [];
    for (let i = 0; i <= filteredTypes.length; i += imgPerRow) {
      rows.push(
        <Row key={`row-${i}`}>
          {filteredTypes.slice(i, i + imgPerRow).map(entry => (
            <Col md={12 / imgPerRow} key={`grid-col-${entry.key}`}>
              {this.renderItem(entry)}
            </Col>
          ))}
        </Row>);
    }
    return (
      <div>
        <ControlHeader
          {...this.props}
        />
        <OverlayTrigger
          placement="right"
          overlay={
            <Tooltip id={'error-tooltip'}>{t('Click to change visualization type')}</Tooltip>
          }
        >
          <Label onClick={this.toggleModal} style={{ cursor: 'pointer' }}>
            {selectedType.name}
          </Label>
        </OverlayTrigger>
        <Modal
          show={showModal}
          onHide={this.toggleModal}
          onEnter={this.focusSearch}
          onExit={this.setSearchRef}
          bsSize="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>{t('Select a visualization type')}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="viztype-control-search-box">
              <FormControl
                inputRef={this.setSearchRef}
                type="text"
                value={filter}
                placeholder={t('Search')}
                onChange={this.changeSearch}
              />
            </div>
            {rows}
          </Modal.Body>
        </Modal>
      </div>
    );
  }
}

VizTypeControl.propTypes = propTypes;
VizTypeControl.defaultProps = defaultProps;
