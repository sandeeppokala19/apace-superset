import $ from 'jquery';
import React from 'react';
import PropTypes from 'prop-types';
import { Panel } from 'react-bootstrap';

import { chartPropShape } from '../../dashboard/util/propShapes';
import ChartContainer from '../../chart/ChartContainer';
import ExploreChartHeader from './ExploreChartHeader';
import EditableTitle from '../../components/EditableTitle';

const propTypes = {
  actions: PropTypes.object.isRequired,
  addHistory: PropTypes.func,
  onQuery: PropTypes.func,
  onDismissRefreshOverlay: PropTypes.func,
  can_overwrite: PropTypes.bool.isRequired,
  can_download: PropTypes.bool.isRequired,
  datasource: PropTypes.object,
  column_formats: PropTypes.object,
  containerId: PropTypes.string.isRequired,
  height: PropTypes.string.isRequired,
  width: PropTypes.string.isRequired,
  isStarred: PropTypes.bool.isRequired,
  slice: PropTypes.object,
  table_name: PropTypes.string,
  vizType: PropTypes.string.isRequired,
  form_data: PropTypes.object,
  standalone: PropTypes.bool,
  timeout: PropTypes.number,
  refreshOverlayVisible: PropTypes.bool,
  chart: chartPropShape,
  errorMessage: PropTypes.node,
};

class ExploreChartPanel extends React.PureComponent {
  getHeight() {
    const headerHeight = this.props.standalone ? 0 : 100;
    return parseInt(this.props.height, 10) - headerHeight;
  }

  updateChartDescriptionOrSaveSlice(newDescription) {
    const isNewDescription = !this.props.slice;
    const params = {
      description: newDescription,
      action: isNewDescription ? 'saveas' : 'overwrite',
    };
    this.props.actions.saveSlice(this.props.form_data, params)
      .then((data) => {
        if (isNewDescription) {
          this.props.actions.createNewSlice(
            data.can_add, data.can_download, data.can_overwrite,
            data.slice, data.form_data);
        } else {
          this.props.actions.updateChartDescription(newDescription);
        }
      });
  }

  renderChart() {
    const { chart } = this.props;
    return (
      <ChartContainer
        chartId={chart.id}
        containerId={this.props.containerId}
        datasource={this.props.datasource}
        formData={this.props.form_data}
        height={this.getHeight()}
        slice={this.props.slice}
        setControlValue={this.props.actions.setControlValue}
        timeout={this.props.timeout}
        vizType={this.props.vizType}
        refreshOverlayVisible={this.props.refreshOverlayVisible}
        errorMessage={this.props.errorMessage}
        onQuery={this.props.onQuery}
        onDismissRefreshOverlay={this.props.onDismissRefreshOverlay}
        annotationData={chart.annotationData}
        chartAlert={chart.chartAlert}
        chartStatus={chart.chartStatus}
        chartUpdateEndTime={chart.chartUpdateEndTime}
        chartUpdateStartTime={chart.chartUpdateStartTime}
        latestQueryFormData={chart.latestQueryFormData}
        lastRendered={chart.lastRendered}
        queryResponse={chart.queryResponse}
        queryController={chart.queryController}
        triggerQuery={chart.triggerQuery}
      />
    );
  }

  renderChartDescription() {
    let description;
    if (this.props.slice) {
      description = this.props.slice.description;
    } else {
      description = t('%s - chart description', this.props.table_name);
    }
    return description;
  }

  render() {
    const isDescription = true;
    if (this.props.standalone) {
      // dom manipulation hack to get rid of the boostrap theme's body background
      $('body').addClass('background-transparent');
      return this.renderChart();
    }

    const header = (
      <ExploreChartHeader
        actions={this.props.actions}
        addHistory={this.props.addHistory}
        can_overwrite={this.props.can_overwrite}
        can_download={this.props.can_download}
        isStarred={this.props.isStarred}
        slice={this.props.slice}
        table_name={this.props.table_name}
        form_data={this.props.form_data}
        timeout={this.props.timeout}
        chart={this.props.chart}
      />);
    return (
      <div className="chart-container">
        <Panel
          style={{ height: this.props.height }}
          header={header}
        >
          {this.renderChart()}
          <EditableTitle
            style={{ color: "#00A699" }}
            title={this.renderChartDescription()}
            isDescription={isDescription}
            canEdit={!this.props.slice || this.props.can_overwrite}
            onSaveTitle={this.updateChartDescriptionOrSaveSlice.bind(this)}
          />
        </Panel>
      </div>
    );
  }
}

ExploreChartPanel.propTypes = propTypes;

export default ExploreChartPanel;
