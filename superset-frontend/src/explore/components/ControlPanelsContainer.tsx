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
/* eslint camelcase: 0 */
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { bindActionCreators } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import {
  ensureIsArray,
  t,
  styled,
  getChartControlPanelRegistry,
  QueryFormData,
  DatasourceType,
  css,
} from '@superset-ui/core';
import {
  ControlPanelSectionConfig,
  ControlState,
  CustomControlItem,
  DatasourceMeta,
  ExpandedControlItem,
  InfoTooltipWithTrigger,
  sections,
} from '@superset-ui/chart-controls';

import Collapse from 'src/components/Collapse';
import Tabs from 'src/components/Tabs';
import { PluginContext } from 'src/components/DynamicPlugins';
import Loading from 'src/components/Loading';

import { usePrevious } from 'src/hooks/usePrevious';
import { getSectionsToRender } from 'src/explore/controlUtils';
import {
  ExploreActions,
  exploreActions,
} from 'src/explore/actions/exploreActions';
import { ExplorePageState } from 'src/explore/reducers/getInitialState';
import { ChartState } from 'src/explore/types';

import ControlRow from './ControlRow';
import Control from './Control';
import { ControlPanelAlert } from './ControlPanelAlert';

export type ControlPanelsContainerProps = {
  actions: ExploreActions;
  datasource_type: DatasourceType;
  exploreState: ExplorePageState['explore'];
  chart: ChartState;
  controls: Record<string, ControlState>;
  form_data: QueryFormData;
  isDatasourceMetaLoading: boolean;
};

export type ExpandedControlPanelSectionConfig = Omit<
  ControlPanelSectionConfig,
  'controlSetRows'
> & {
  controlSetRows: ExpandedControlItem[][];
};

const Styles = styled.div`
  height: 100%;
  width: 100%;
  overflow: auto;
  overflow-x: visible;
  #controlSections {
    min-height: 100%;
    overflow: visible;
  }
  .nav-tabs {
    flex: 0 0 1;
  }
  .tab-content {
    overflow: auto;
    flex: 1 1 100%;
  }
  .Select__menu {
    max-width: 100%;
  }
  .type-label {
    margin-right: ${({ theme }) => theme.gridUnit * 3}px;
    width: ${({ theme }) => theme.gridUnit * 7}px;
    display: inline-block;
    text-align: center;
    font-weight: ${({ theme }) => theme.typography.weights.bold};
  }
`;

const ControlPanelsTabs = styled(Tabs)`
  .ant-tabs-nav-list {
    width: ${({ fullWidth }) => (fullWidth ? '100%' : '50%')};
  }
  .ant-tabs-content-holder {
    overflow: visible;
  }
  .ant-tabs-tabpane {
    height: 100%;
  }
`;

const isTimeSection = (section: ControlPanelSectionConfig): boolean =>
  !!section.label &&
  (sections.legacyRegularTime.label === section.label ||
    sections.legacyTimeseriesTime.label === section.label);

const hasTimeColumn = (datasource: DatasourceMeta): boolean =>
  datasource?.columns?.some(c => c.is_dttm) ||
  datasource.type === DatasourceType.Druid;

const sectionsToExpand = (
  sections: ControlPanelSectionConfig[],
  datasource: DatasourceMeta,
): string[] =>
  // avoid expanding time section if datasource doesn't include time column
  sections.reduce(
    (acc, section) =>
      section.expanded && (!isTimeSection(section) || hasTimeColumn(datasource))
        ? [...acc, String(section.label)]
        : acc,
    [] as string[],
  );

function getState(
  vizType: string,
  datasource: DatasourceMeta,
  datasourceType: DatasourceType,
) {
  const querySections: ControlPanelSectionConfig[] = [];
  const customizeSections: ControlPanelSectionConfig[] = [];

  getSectionsToRender(vizType, datasourceType).forEach(section => {
    // if at least one control in the section is not `renderTrigger`
    // or asks to be displayed at the Data tab
    if (
      section.tabOverride === 'data' ||
      section.controlSetRows.some(rows =>
        rows.some(
          control =>
            control &&
            typeof control === 'object' &&
            'config' in control &&
            control.config &&
            (!control.config.renderTrigger ||
              control.config.tabOverride === 'data'),
        ),
      )
    ) {
      querySections.push(section);
    } else {
      customizeSections.push(section);
    }
  });
  const expandedQuerySections: string[] = sectionsToExpand(
    querySections,
    datasource,
  );
  const expandedCustomizeSections: string[] = sectionsToExpand(
    customizeSections,
    datasource,
  );
  return {
    expandedQuerySections,
    expandedCustomizeSections,
    querySections,
    customizeSections,
  };
}

export const ControlPanelsContainer = (props: ControlPanelsContainerProps) => {
  const pluginContext = useContext(PluginContext);
  const dispatch = useDispatch();
  const actions = bindActionCreators(exploreActions, dispatch);
  const exploreState = useSelector<
    ExplorePageState,
    ExplorePageState['explore']
  >(state => state.explore);

  const prevDatasource = usePrevious(exploreState.datasource);

  const [expandedQuerySections, setExpandedQuerySections] = useState<string[]>(
    [],
  );
  const [expandedCustomizeSections, setExpandedCustomizeSections] = useState<
    string[]
  >([]);
  const [querySections, setQuerySections] = useState<
    ControlPanelSectionConfig[]
  >([]);
  const [customizeSections, setCustomizeSections] = useState<
    ControlPanelSectionConfig[]
  >([]);
  const [showDatasourceAlert, setShowDatasourceAlert] = useState(false);

  useEffect(() => {
    if (
      prevDatasource &&
      (exploreState.datasource?.id !== prevDatasource.id ||
        exploreState.datasource?.type !== prevDatasource.type)
    ) {
      setShowDatasourceAlert(true);
    }
  }, [exploreState.datasource, prevDatasource]);

  useEffect(() => {
    const {
      expandedQuerySections: newExpandedQuerySections,
      expandedCustomizeSections: newExpandedCustomizeSections,
      querySections: newQuerySections,
      customizeSections: newCustomizeSections,
    } = getState(
      props.form_data.viz_type,
      exploreState.datasource,
      props.datasource_type,
    );
    setExpandedQuerySections(newExpandedQuerySections);
    setExpandedCustomizeSections(newExpandedCustomizeSections);
    setQuerySections(newQuerySections);
    setCustomizeSections(newCustomizeSections);
  }, [props.form_data.datasource, props.form_data.viz_type]);

  const resetTransferredControls = useCallback(() => {
    ensureIsArray(exploreState.controlsTransferred).forEach(controlName =>
      actions.setControlValue(controlName, props.controls[controlName].default),
    );
  }, [actions, exploreState.controlsTransferred, props.controls]);

  const handleClearFormClick = useCallback(() => {
    resetTransferredControls();
    setShowDatasourceAlert(false);
  }, [resetTransferredControls]);

  const handleContinueClick = useCallback(() => {
    setShowDatasourceAlert(false);
  }, []);

  const renderControl = ({ name, config }: CustomControlItem) => {
    const { controls, chart } = props;
    const { visibility } = config;

    // If the control item is not an object, we have to look up the control data from
    // the centralized controls file.
    // When it is an object we read control data straight from `config` instead
    const controlData = {
      ...config,
      ...controls[name],
      // if `mapStateToProps` accept three arguments, it means it needs chart
      // state, too. Since it's may be expensive to run mapStateToProps for every
      // re-render, we only run this when the chart plugin explicitly ask for this.
      ...(config.mapStateToProps?.length === 3
        ? // @ts-ignore /* The typing accuses of having an extra parameter. I didn't remove it because I believe it could be an error in the types and not in the code */
          config.mapStateToProps(exploreState, controls[name], chart)
        : // for other controls, `mapStateToProps` is already run in
          // controlUtils/getControlState.ts
          undefined),
      name,
    };
    const { validationErrors, ...restProps } = controlData as ControlState & {
      validationErrors?: any[];
    };

    // if visibility check says the config is not visible, don't render it
    if (visibility && !visibility.call(config, props, controlData)) {
      return null;
    }
    return (
      <Control
        key={`control-${name}`}
        name={name}
        validationErrors={validationErrors}
        actions={actions}
        {...restProps}
      />
    );
  };

  const renderControlPanelSection = (
    section: ExpandedControlPanelSectionConfig,
  ) => {
    const { controls } = props;
    const { label, description } = section;

    // Section label can be a ReactNode but in some places we want to
    // have a string ID. Using forced type conversion for now,
    // should probably add a `id` field to sections in the future.
    const sectionId = String(label);

    const hasErrors = section.controlSetRows.some(rows =>
      rows.some(item => {
        const controlName =
          typeof item === 'string'
            ? item
            : item && 'name' in item
            ? item.name
            : null;
        return (
          controlName &&
          controlName in controls &&
          controls[controlName].validationErrors &&
          controls[controlName].validationErrors.length > 0
        );
      }),
    );
    const PanelHeader = () => (
      <span>
        <span>{label}</span>{' '}
        {description && (
          // label is only used in tooltip id (should probably call this prop `id`)
          <InfoTooltipWithTrigger label={sectionId} tooltip={description} />
        )}
        {hasErrors && (
          <InfoTooltipWithTrigger
            label="validation-errors"
            bsStyle="danger"
            tooltip="This section contains validation errors"
          />
        )}
      </span>
    );

    return (
      <Collapse.Panel
        data-test="collapsible-control-panel"
        css={theme => css`
          margin-bottom: 0;
          box-shadow: none;

          &:last-child {
            padding-bottom: ${theme.gridUnit * 10}px;
          }

          .panel-body {
            margin-left: ${theme.gridUnit * 4}px;
            padding-bottom: 0;
          }

          span.label {
            display: inline-block;
          }
        `}
        header={<PanelHeader />}
        key={sectionId}
      >
        {section.controlSetRows.map((controlSets, i) => {
          const renderedControls = controlSets
            .map(controlItem => {
              if (!controlItem) {
                // When the item is invalid
                return null;
              }
              if (React.isValidElement(controlItem)) {
                // When the item is a React element
                return controlItem;
              }
              if (
                controlItem.name &&
                controlItem.config &&
                controlItem.name !== 'datasource'
              ) {
                return renderControl(controlItem);
              }
              return null;
            })
            .filter(x => x !== null);
          // don't show the row if it is empty
          if (renderedControls.length === 0) {
            return null;
          }
          return (
            <ControlRow
              key={`controlsetrow-${i}`}
              controls={renderedControls}
            />
          );
        })}
      </Collapse.Panel>
    );
  };

  const hasControlsTransferred =
    ensureIsArray(exploreState.controlsTransferred).length > 0;

  const DatasourceAlert = useCallback(
    () =>
      hasControlsTransferred ? (
        <ControlPanelAlert
          title={t('Keep control settings?')}
          bodyText={t(
            "You've changed datasets. Any controls with data (columns, metrics) that match this new dataset have been retained.",
          )}
          primaryButtonAction={handleContinueClick}
          secondaryButtonAction={handleClearFormClick}
          primaryButtonText={t('Continue')}
          secondaryButtonText={t('Clear form')}
          type="info"
        />
      ) : (
        <ControlPanelAlert
          title={t('No form settings were maintained')}
          bodyText={t(
            'We were unable to carry over any controls when switching to this new dataset.',
          )}
          primaryButtonAction={handleContinueClick}
          primaryButtonText={t('Continue')}
          type="warning"
        />
      ),
    [handleClearFormClick, hasControlsTransferred],
  );

  const controlPanelRegistry = getChartControlPanelRegistry();
  if (
    !controlPanelRegistry.has(props.form_data.viz_type) &&
    pluginContext.loading
  ) {
    return <Loading />;
  }

  const showCustomizeTab = customizeSections.length > 0;

  return (
    <Styles>
      <ControlPanelsTabs
        id="controlSections"
        data-test="control-tabs"
        fullWidth={showCustomizeTab}
      >
        <Tabs.TabPane key="query" tab={t('Data')}>
          <Collapse
            bordered
            activeKey={expandedQuerySections}
            expandIconPosition="right"
            onChange={selection => {
              setExpandedQuerySections(ensureIsArray(selection));
            }}
            ghost
          >
            {showDatasourceAlert && <DatasourceAlert />}
            {querySections.map(renderControlPanelSection)}
          </Collapse>
        </Tabs.TabPane>
        {showCustomizeTab && (
          <Tabs.TabPane key="display" tab={t('Customize')}>
            <Collapse
              bordered
              activeKey={expandedCustomizeSections}
              expandIconPosition="right"
              onChange={selection => {
                setExpandedCustomizeSections(ensureIsArray(selection));
              }}
              ghost
            >
              {customizeSections.map(renderControlPanelSection)}
            </Collapse>
          </Tabs.TabPane>
        )}
      </ControlPanelsTabs>
    </Styles>
  );
};

export default ControlPanelsContainer;
