import { ChartProps, SqlaFormData, supersetTheme } from '@superset-ui/core';
import { EchartsBubbleChartProps } from 'plugins/plugin-chart-echarts/src/Bubble/types';

import transformProps, {
  formatBubbleLabel,
} from '../../src/Bubble/transformProps';

describe('Bubble transformProps', () => {
  const formData: SqlaFormData = {
    datasource: '1__table',
    viz_type: 'echarts_bubble',
    entity: 'customer_name',
    x: 'count',
    y: {
      aggregate: 'sum',
      column: {
        column_name: 'price_each',
      },
      expressionType: 'simple',
      label: 'SUM(price_each)',
    },
    size: {
      aggregate: 'sum',
      column: {
        column_name: 'sales',
      },
      expressionType: 'simple',
      label: 'SUM(sales)',
    },
    yAxisBounds: [null, null],
  };
  const chartProps = new ChartProps({
    formData,
    height: 800,
    width: 800,
    queriesData: [
      {
        data: [
          {
            customer_name: 'AV Stores, Co.',
            count: 10,
            'SUM(price_each)': 20,
            'SUM(sales)': 30,
          },
          {
            customer_name: 'Alpha Cognac',
            count: 40,
            'SUM(price_each)': 50,
            'SUM(sales)': 60,
          },
          {
            customer_name: 'Amica Models & Co.',
            count: 70,
            'SUM(price_each)': 80,
            'SUM(sales)': 90,
          },
        ],
      },
    ],
    theme: supersetTheme,
  });

  it('Should transform props for viz', () => {
    expect(transformProps(chartProps as EchartsBubbleChartProps)).toEqual(
      expect.objectContaining({
        width: 800,
        height: 800,
        echartOptions: expect.objectContaining({
          series: expect.arrayContaining([
            expect.objectContaining({
              data: expect.arrayContaining([
                [10, 20, 30, 'AV Stores, Co.', null],
              ]),
            }),
            expect.objectContaining({
              data: expect.arrayContaining([
                [40, 50, 60, 'Alpha Cognac', null],
              ]),
            }),
            expect.objectContaining({
              data: expect.arrayContaining([
                [70, 80, 90, 'Amica Models & Co.', null],
              ]),
            }),
          ]),
        }),
      }),
    );
  });
});

describe('Bubble formatBubbleLabel', () => {
  it('Should generate correct bubble label content with dimension', () => {
    const params = {
      data: [1, 2, 3, 'bubble title', 'bubble dimension'],
    };
    expect(
      formatBubbleLabel(params, 'x-axis-label', 'y-axis-label', 'size-label'),
    ).toEqual(
      `<p>bubble title <sub>(bubble dimension)</sub></p>
        x-axis-label: 1 <br/>
        y-axis-label: 2 <br/>
        size-label: 3`,
    );
  });
  it('Should generate correct bubble label content without dimension', () => {
    const params = {
      data: [1, 2, 3, 'bubble title', null],
    };
    expect(
      formatBubbleLabel(params, 'x-axis-label', 'y-axis-label', 'size-label'),
    ).toEqual(
      `<p>bubble title</p>
        x-axis-label: 1 <br/>
        y-axis-label: 2 <br/>
        size-label: 3`,
    );
  });
});
