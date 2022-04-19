/* eslint-disable camelcase */
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
 * specific language governing permissions and limitationsxw
 * under the License.
 */
import {
  PostProcessingRename,
  ensureIsArray,
  getMetricLabel,
} from '@superset-ui/core';
import { PostProcessingFactory } from './types';

export const renameOperator: PostProcessingFactory<PostProcessingRename> = (
  formData,
  queryObject,
) => {
  const metrics = ensureIsArray(queryObject.metrics);
  const columns = ensureIsArray(queryObject.columns);
  const { x_axis: xAxis } = formData;
  // remove metric name in the MultiIndex when
  // 1) only 1 metric
  // 2) exist dimentsion
  // 3) exist xAxis
  if (
    metrics.length === 1 &&
    columns.length > 0 &&
    (xAxis || queryObject.is_timeseries)
  ) {
    const mainQueryMetricName = getMetricLabel(metrics[0]);
    return {
      operation: 'rename',
      options: {
        columns: { [mainQueryMetricName]: null },
        level: 0,
        inplace: true,
      },
    };
  }

  return undefined;
};
