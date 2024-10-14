/*
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

import { NumberFormatter, createTimeDurationFormatter } from '@superset-ui/core';

describe('createTimeDurationFormatter()', () => {
  it('creates an instance of NumberFormatter', () => {
    const formatter = createTimeDurationFormatter();
    expect(formatter).toBeInstanceOf(NumberFormatter);
  });
  it('format seconds in human readable format with default options', () => {
    const formatter = createTimeDurationFormatter();
    expect(formatter(0)).toBe('0:00');
    expect(formatter(1)).toBe('0:01');
    expect(formatter(59)).toBe('0:59');
    expect(formatter(59.4)).toBe('0:59');
    expect(formatter(59.5)).toBe('1:00');
    expect(formatter(61)).toBe('1:01');
  });
});
