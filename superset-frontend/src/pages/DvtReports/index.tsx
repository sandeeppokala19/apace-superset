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

import React, { useEffect, useState } from 'react';
import DvtTable from 'src/components/DvtTable';
import withToasts from 'src/components/MessageToasts/withToasts';

function ReportList() {
  const [apiData, setApiData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/v1/report/');
        const data = await response.json();

        const editedData = data.result
          .filter((item: any) => item.type === 'Report')
          .map((item: any) => ({
            name: item.name,
            type: item.type,
            crontab_humanized: item.crontab_humanized,
            date: new Date(item.created_on).toLocaleString('tr-TR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
            created_by: `${item.created_by.first_name} ${item.created_by.last_name}`,
            changed_by: `${item.changed_by.first_name} ${item.changed_by.last_name}`,
          }));

        setApiData(editedData);
      } catch (error) {}
    };

    fetchData();
  }, []);
  const modifiedData = {
    header: [
      { id: 1, title: 'Name', field: 'name', heartIcon: true },
      { id: 2, title: 'Visualization Type', field: 'type' },
      { id: 3, title: 'Dataset', field: 'crontab_humanized' },
      { id: 4, title: 'Modified date', field: 'date' },
      { id: 5, title: 'Modified by', field: 'changed_by' },
      { id: 6, title: 'Created by', field: 'created_by' },
      {
        id: 9,
        title: 'Action',
        clicks: [
          {
            icon: 'edit_alt',
            click: () => {},
            popperLabel: 'Edit',
          },
          {
            icon: 'share',
            click: () => {},
            popperLabel: 'Export',
          },
          {
            icon: 'trash',
            click: () => {},
            popperLabel: 'Delete',
          },
        ],
      },
    ],
  };

  return <DvtTable data={apiData} header={modifiedData.header} />;
}

export default withToasts(ReportList);
