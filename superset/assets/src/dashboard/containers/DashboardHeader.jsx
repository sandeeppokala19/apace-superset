import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import DashboardHeader from '../components/Header';

import {
  setEditMode,
  toggleBuilderPane,
  fetchFaveStar,
  saveFaveStar,
  fetchCharts,
  startPeriodicRender,
  updateCss,
  onChange,
  saveDashboardRequest,
  setMaxUndoHistoryExceeded,
  maxUndoHistoryToast,
} from '../actions/dashboardState';

import {
  undoLayoutAction,
  redoLayoutAction,
  updateDashboardTitle,
} from '../actions/dashboardLayout';

import { addSuccessToast, addDangerToast } from '../actions/messageToasts';

import { DASHBOARD_HEADER_ID } from '../util/constants';

function mapStateToProps({
  dashboardLayout: undoableLayout,
  dashboardState: dashboard,
  dashboardInfo,
  charts,
}) {
  return {
    dashboardInfo,
    undoLength: undoableLayout.past.length,
    redoLength: undoableLayout.future.length,
    layout: undoableLayout.present,
    filters: dashboard.filters,
    dashboardTitle: (
      (undoableLayout.present[DASHBOARD_HEADER_ID] || {}).meta || {}
    ).text,
    expandedSlices: dashboard.expandedSlices,
    css: dashboard.css,
    charts,
    userId: dashboardInfo.userId,
    isStarred: !!dashboard.isStarred,
    hasUnsavedChanges: !!dashboard.hasUnsavedChanges,
    maxUndoHistoryExceeded: !!dashboard.maxUndoHistoryExceeded,
    editMode: !!dashboard.editMode,
    showBuilderPane: !!dashboard.showBuilderPane,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      addSuccessToast,
      addDangerToast,
      onUndo: undoLayoutAction,
      onRedo: redoLayoutAction,
      setEditMode,
      toggleBuilderPane,
      fetchFaveStar,
      saveFaveStar,
      fetchCharts,
      startPeriodicRender,
      updateDashboardTitle,
      updateCss,
      onChange,
      onSave: saveDashboardRequest,
      setMaxUndoHistoryExceeded,
      maxUndoHistoryToast,
    },
    dispatch,
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(DashboardHeader);
