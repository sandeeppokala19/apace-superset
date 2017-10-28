/* eslint camelcase: 0 */
import React from 'react';
import PropTypes from 'prop-types';
import Mustache from 'mustache';

import { d3format } from '../modules/utils';
import ChartBody from './ChartBody';
import StackTraceMessage from '../components/StackTraceMessage';
import visMap from '../../visualizations/main';

const propTypes = {
  actions: PropTypes.object,
  chartKey: PropTypes.string.isRequired,
  containerId: PropTypes.string.isRequired,
  datasource: PropTypes.object.isRequired,
  formData: PropTypes.object.isRequired,
  height: PropTypes.number,
  width: PropTypes.number,
  setControlValue: PropTypes.func,
  timeout: PropTypes.number,
  viz_type: PropTypes.string.isRequired,
  // state
  chartAlert: PropTypes.string,
  chartStatus: PropTypes.string,
  chartUpdateEndTime: PropTypes.number,
  chartUpdateStartTime: PropTypes.number,
  latestQueryFormData: PropTypes.object,
  queryRequest: PropTypes.object,
  queryResponse: PropTypes.object,
  triggerRender: PropTypes.bool,
  triggerQuery: PropTypes.bool,
  // dashboard callbacks
  addFilter: PropTypes.func,
  getFilters: PropTypes.func,
  clearFilter: PropTypes.func,
  removeFilter: PropTypes.func,
};

const defaultProps = {
  addFilter: () => {},
  getFilters: () => ({}),
  clearFilter: () => {},
  removeFilter: () => {},
};

class Chart extends React.PureComponent {
  constructor(props) {
    super(props);

    // these properties are used by visualizations
    this.containerId = props.containerId;
    this.selector = `#${this.containerId}`;
    this.formData = props.formData;
    this.datasource = props.datasource;
    this.addFilter = this.addFilter.bind(this);
    this.getFilters = this.getFilters.bind(this);
    this.clearFilter = this.clearFilter.bind(this);
    this.removeFilter = this.removeFilter.bind(this);
  }

  componentDidMount() {
    this.runQuery();
  }

  componentWillReceiveProps(nextProps) {
    this.containerId = nextProps.containerId;
    this.selector = `#${this.containerId}`;
    this.formData = nextProps.formData;
    this.datasource = nextProps.datasource;
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.queryResponse &&
      this.props.chartStatus === 'success' &&
      !this.props.queryResponse.error && (
      prevProps.queryResponse !== this.props.queryResponse ||
      prevProps.height !== this.props.height ||
      prevProps.width !== this.props.width ||
      this.props.triggerRender)
    ) {
      this.renderViz();
    }
  }

  getFilters() {
    return this.props.getFilters();
  }

  addFilter(col, vals, merge = true, refresh = true) {
    this.props.addFilter(col, vals, merge, refresh);
  }

  clearFilter() {
    this.props.clearFilter();
  }

  removeFilter(col, vals) {
    this.props.removeFilter(col, vals);
  }

  clearError() {
    this.setState({
      errorMsg: null,
    });
  }

  width() {
    return this.props.width ?
      this.props.width :
      this.container.el.offsetWidth;
  }

  height() {
    return this.props.height ?
      this.props.height :
      this.container.el.offsetHeight;
  }

  d3format(col, number) {
    const format =
      this.props.datasource.column_formats && this.props.datasource.column_formats[col] ?
      this.props.datasource.column_formats[col] : '0.3s';
    return d3format(format, number);
  }

  runQuery() {
    this.props.actions.runQuery(this.props.formData, true,
      this.props.timeout,
      this.props.chartKey,
    );
  }

  render_template(s) {
    const context = {
      width: this.width(),
      height: this.height(),
    };
    return Mustache.render(s, context);
  }

  renderViz() {
    this.props.actions.renderTriggered(this.props.chartKey);

    const viz = visMap[this.props.viz_type];
    try {
      viz(this, this.props.queryResponse, this.props.actions.setControlValue);
    } catch (e) {
      this.props.actions.chartRenderingFailed(e, this.props.chartKey);
    }
  }

  render() {
    const isLoading = this.props.chartStatus === 'loading';
    return (
      <div className={`token col-md-12 ${isLoading ? 'is-loading' : ''}`}>
        {isLoading && <img
          alt="loading"
          width="25"
          src="/static/assets/images/loading.gif"
          style={{ position: 'absolute' }}
        />}

        {this.props.chartAlert &&
        <StackTraceMessage
          message={this.props.chartAlert}
          queryResponse={this.props.queryResponse}
        />
        }

        {!this.props.chartAlert &&
        <ChartBody
          containerId={this.containerId}
          vizType={this.props.formData.viz_type}
          height={this.height.bind(this)}
          width={this.width.bind(this)}
          ref={(inner) => {
            this.container = inner;
          }}
        />
        }
      </div>
    );
  }
}

Chart.propTypes = propTypes;
Chart.defaultProps = defaultProps;

export default Chart;
