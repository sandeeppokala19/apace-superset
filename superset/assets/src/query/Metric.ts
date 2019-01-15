import Column from './Column';
import FormData from './FormData';

export const LABEL_MAX_LENGTH = 43;

// Note that the values of MetricKeys are lower_snake_case because they're
// used as keys of form data jsons.
export enum MetricKey {
  METRIC = 'metric',
  RIGHT_AXIS_METRIC = 'metric_2',
  SECONDARY_METRIC = 'secondary_metric',
  X = 'x',
  Y = 'y',
  SIZE = 'size',
}

export enum MetricsKey {
  METRICS = 'metrics',
  PERCENT_METRICS = 'percent_metrics',
}

export enum Aggregate {
  AVG = 'AVG',
  COUNT = 'COUNT ',
  COUNT_DISTINCT = 'COUNT_DISTINCT',
  MAX = 'MAX',
  MIN = 'MIN',
  SUM = 'SUM',
}

export enum ExpressionType {
  SIMPLE = 'SIMPLE',
  SQL = 'SQL',
}

interface AdhocMetricSimple {
  expressionType: ExpressionType.SIMPLE;
  column: Column;
  aggregate: Aggregate;
}

interface AdhocMetricSQL {
  expressionType: ExpressionType.SQL;
  sqlExpression: string;
}

export type AdhocMetric = {
  label?: string,
  optionName?: string,
} & (AdhocMetricSimple | AdhocMetricSQL);

type Metric = {
  label: string;
} & Partial<AdhocMetric>;

export default Metric;

export type RawMetric = AdhocMetric | string;

export class Metrics {
  // Use Array to maintain insertion order for metrics that are order sensitive
  private metrics: Metric[];

  constructor(formData: FormData) {
    this.metrics = [];
    for (const key of Object.keys(MetricKey)) {
      let metric = formData[MetricKey[key] as MetricKey];
      if (metric) {
        this.addMetricToList(metric);
      }
    }
    for (const key of Object.keys(MetricsKey)) {
      let metrics = formData[MetricsKey[key] as MetricsKey];
      if (metrics) {
        metrics.forEach((metric) => this.addMetricToList(metric));
      }
    }
  }

  protected addMetricToList(metric: RawMetric) {
    const convertedMetric = Metrics.convertMetric(metric);
    if (convertedMetric) {
      this.metrics.push(convertedMetric);
    }
  }

  static convertMetric(metric: RawMetric) {
    if (!metric) {
      return null;
    } if (typeof metric === 'string') {
      return {
        label: metric,
      };
    } else {
      // Note we further sanitize the metric label for BigQuery datasources
      // TODO: move this logic to the client once client has more info on the
      // the datasource
      const label = metric.label || this.getDefaultLabel(metric);
      return {
        ...metric,
        label,
      };
    }
  }

  public getMetrics() {
    return this.metrics;
  }

  public getLabels() {
    return this.metrics.map((m) => m.label);
  }

  static getDefaultLabel(metric: AdhocMetric) {
    let label: string;
    if (metric.expressionType === ExpressionType.SIMPLE) {
      label = `${metric.aggregate}(${(metric.column.columnName)})`;
    } else {
      label = metric.sqlExpression;
    }
    return label.length <= LABEL_MAX_LENGTH ? label :
      `${label.substring(0, LABEL_MAX_LENGTH - 3)}...`;
  }
}
