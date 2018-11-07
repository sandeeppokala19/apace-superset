import { t } from '@superset-ui/translation';
import * as sections from './sections';

export default {
  controlPanelSections: [
    sections.NVD3TimeSeries[0],
    {
      label: t('Time Series Options'),
      expanded: true,
      controlSetRows: [
        ['time_series_option'],
      ],
    },
    {
      label: t('Chart Options'),
      expanded: true,
      controlSetRows: [
        ['color_scheme'],
        ['number_format', 'date_time_format'],
        ['partition_limit', 'partition_threshold'],
        ['log_scale', 'equal_date_size'],
        ['rich_tooltip'],
      ],
    },
    sections.NVD3TimeSeries[1],
  ],
};
