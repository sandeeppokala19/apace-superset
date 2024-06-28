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
import { List } from 'src/components';
import { connect } from 'react-redux';
import { PureComponent } from 'react';
import {
  HandlerFunction,
  JsonObject,
  Payload,
  SupersetTheme,
  t,
  withTheme,
} from '@superset-ui/core';
import { InfoTooltipWithTrigger } from '@superset-ui/chart-controls';
import AsyncEsmComponent from 'src/components/AsyncEsmComponent';
import { getChartKey } from 'src/explore/exploreUtils';
import { runAnnotationQuery } from 'src/components/Chart/chartAction';
import CustomListItem from 'src/explore/components/controls/CustomListItem';
import { ChartState, ExplorePageState } from 'src/explore/types';
import ControlPopover, {
  getSectionContainerElement,
} from '../ControlPopover/ControlPopover';

const AnnotationLayer = AsyncEsmComponent(
  () => import('./AnnotationLayer'),
  // size of overlay inner content
  () => <div style={{ width: 450, height: 368 }} />,
);

export interface Annotation {
  name: string;
  show?: boolean;
  annotation: string;
  timeout: Date;
  key: string;
  formData?: any;
  isDashboardRequest?: boolean;
  force?: boolean;
}

export interface Props {
  colorScheme: string;
  annotationError: Record<string, string>;
  annotationQuery: Record<string, AbortController>;
  vizType: string;
  validationErrors: JsonObject[];
  name: string;
  actions: {
    setControlValue: HandlerFunction;
  };
  value: Annotation[];
  onChange: (annotations: Annotation[]) => void;
  refreshAnnotationData: (payload: Payload) => void;
  theme: SupersetTheme;
}

export interface PopoverState {
  popoverVisible: Record<number | string, boolean>;
  addedAnnotationIndex: number | null;
}

const defaultProps = {
  vizType: '',
  value: [],
  annotationError: {},
  annotationQuery: {},
  onChange: () => {},
};
class AnnotationLayerControl extends PureComponent<Props, PopoverState> {
  static defaultProps = defaultProps;

  constructor(props: Props) {
    super(props);
    this.state = {
      popoverVisible: {},
      addedAnnotationIndex: null,
    };
    this.addAnnotationLayer = this.addAnnotationLayer.bind(this);
    this.removeAnnotationLayer = this.removeAnnotationLayer.bind(this);
    this.handleVisibleChange = this.handleVisibleChange.bind(this);
  }

  componentDidMount() {
    // preload the AnnotationLayer component and dependent libraries i.e. mathjs
    AnnotationLayer.preload();
  }

  UNSAFE_componentWillReceiveProps(nextProps: Props) {
    const { name, annotationError, validationErrors, value } = nextProps;
    if (Object.keys(annotationError).length && !validationErrors.length) {
      this.props.actions.setControlValue(
        name,
        value,
        Object.keys(annotationError),
      );
    }
    if (!Object.keys(annotationError).length && validationErrors.length) {
      this.props.actions.setControlValue(name, value, []);
    }
  }

  addAnnotationLayer = (
    originalAnnotation: Annotation,
    newAnnotation: Annotation,
  ) => {
    let annotations = this.props.value;
    if (annotations.includes(originalAnnotation)) {
      annotations = annotations.map(anno =>
        anno === originalAnnotation ? newAnnotation : anno,
      );
    } else {
      annotations = [...annotations, newAnnotation];
      this.setState({ addedAnnotationIndex: annotations.length - 1 });
    }

    this.props.refreshAnnotationData({
      annotation: newAnnotation,
      force: true,
    });

    this.props.onChange(annotations);
  };

  handleVisibleChange = (visible: boolean, popoverKey: number | string) => {
    this.setState(prevState => ({
      popoverVisible: { ...prevState.popoverVisible, [popoverKey]: visible },
    }));
  };

  removeAnnotationLayer(annotation: Annotation | undefined) {
    const annotations = this.props.value.filter(anno => anno !== annotation);
    // So scrollbar doesnt get stuck on hidden
    const element = getSectionContainerElement();
    if (element) {
      element.style.setProperty('overflow-y', 'auto', 'important');
    }
    this.props.onChange(annotations);
  }

  renderPopover = (
    popoverKey: number | string,
    annotation: Annotation,
    error: string,
  ) => {
    const id = annotation?.name || '_new';

    return (
      <div id={`annotation-pop-${id}`} data-test="popover-content">
        <AnnotationLayer
          {...(annotation || {})}
          error={error}
          colorScheme={this.props.colorScheme}
          vizType={this.props.vizType}
          addAnnotationLayer={(newAnnotation: Annotation) =>
            this.addAnnotationLayer(annotation, newAnnotation)
          }
          removeAnnotationLayer={() => this.removeAnnotationLayer(annotation)}
          close={() => {
            this.handleVisibleChange(false, popoverKey);
            this.setState({ addedAnnotationIndex: null });
          }}
        />
      </div>
    );
  };

  renderInfo(anno: Annotation) {
    const { annotationError, annotationQuery, theme } = this.props;
    if (annotationQuery[anno.name]) {
      return (
        <i
          className="fa fa-refresh"
          style={{ color: theme.colors.primary.base }}
          aria-hidden
        />
      );
    }
    if (annotationError[anno.name]) {
      return (
        <InfoTooltipWithTrigger
          label="validation-errors"
          bsStyle="danger"
          tooltip={annotationError[anno.name]}
        />
      );
    }
    if (!anno.show) {
      return <span style={{ color: theme.colors.error.base }}> Hidden </span>;
    }
    return '';
  }

  render() {
    const { addedAnnotationIndex } = this.state;
    const addedAnnotation = addedAnnotationIndex
      ? this.props.value[addedAnnotationIndex]
      : null;
    const annotations = this.props.value.map((anno, i) => (
      <ControlPopover
        key={i}
        trigger="click"
        title={t('Edit annotation layer')}
        css={theme => ({
          '&:hover': {
            cursor: 'pointer',
            backgroundColor: theme.colors.grayscale.light4,
          },
        })}
        content={this.renderPopover(
          i,
          anno,
          this.props.annotationError[anno.name],
        )}
        visible={this.state.popoverVisible[i]}
        onVisibleChange={visible => this.handleVisibleChange(visible, i)}
      >
        <CustomListItem selectable>
          <span>{anno.name}</span>
          <span style={{ float: 'right' }}>{this.renderInfo(anno)}</span>
        </CustomListItem>
      </ControlPopover>
    ));
    const addLayerPopoverKey = 'add';
    return (
      <div>
        <List bordered css={theme => ({ borderRadius: theme.gridUnit })}>
          {annotations}
          {addedAnnotation && (
            <ControlPopover
              trigger="click"
              content={this.renderPopover(
                addLayerPopoverKey,
                addedAnnotation,
                '',
              )}
              title={t('Add annotation layer')}
              visible={this.state.popoverVisible[addLayerPopoverKey]}
              destroyTooltipOnHide
              onVisibleChange={visible =>
                this.handleVisibleChange(visible, addLayerPopoverKey)
              }
            >
              <CustomListItem selectable>
                <i
                  data-test="add-annotation-layer-button"
                  className="fa fa-plus"
                />{' '}
                &nbsp; {t('Add annotation layer')}
              </CustomListItem>
            </ControlPopover>
          )}
        </List>
      </div>
    );
  }
}

// Tried to hook this up through stores/control.jsx instead of using redux
// directly, could not figure out how to get access to the color_scheme
function mapStateToProps({
  charts,
  explore,
}: Pick<ExplorePageState, 'charts' | 'explore'>) {
  const chartKey = getChartKey(explore);

  const defaultChartState: Partial<ChartState> = {
    annotationError: {},
    annotationQuery: {},
  };

  const chart =
    chartKey && charts[chartKey] ? charts[chartKey] : defaultChartState;

  return {
    colorScheme: explore.controls?.color_scheme?.value,
    annotationError: chart.annotationError ?? {},
    annotationQuery: chart.annotationQuery ?? {},
    vizType: explore.controls?.viz_type.value,
  };
}

function mapDispatchToProps(dispatch: any) {
  return {
    refreshAnnotationData: (annotationObj: Annotation) =>
      dispatch(runAnnotationQuery(annotationObj)),
  };
}

const themedAnnotationLayerControl = withTheme(AnnotationLayerControl);

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(themedAnnotationLayerControl);
