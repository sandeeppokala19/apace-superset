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
import {
  WORLD_HEALTH_DASHBOARD,
  WORLD_HEALTH_CHARTS,
  waitForChartLoad,
} from './dashboard.helper';

describe('nativefiler url param key', () => {
  // const urlParams = { param1: '123', param2: 'abc' };
  before(() => {
    cy.login();
    cy.visit(WORLD_HEALTH_DASHBOARD);
    WORLD_HEALTH_CHARTS.forEach(waitForChartLoad);
  });
  beforeEach(() => {
    cy.login();
  });
  let initialFilterKey: string;
  it('should have cachekey in in nativefilter param', () => {
    cy.location().then(loc => {
      initialFilterKey = loc.search.split('=')[1];
      expect(typeof initialFilterKey).eq('string');
    });
  });

  it('should have different key when pages reloads', () => {
    cy.location().then(loc => {
      const newFilterKey = loc.search.split('=');
      expect(newFilterKey).not.equal(initialFilterKey);
    });
  });
});
