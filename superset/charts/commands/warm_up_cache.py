# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.


from typing import Any, Optional, Union

import simplejson as json
from flask import g

from superset.charts.commands.exceptions import WarmUpCacheChartNotFoundError
from superset.commands.base import BaseCommand
from superset.extensions import db
from superset.models.slice import Slice
from superset.utils.core import error_msg_from_exception
from superset.views.utils import get_dashboard_extra_filters, get_form_data, get_viz


class ChartWarmUpCacheCommand(BaseCommand):
    # pylint: disable=too-many-arguments
    def __init__(
        self,
        chart_or_id: Union[int, Slice],
        dashboard_id: Optional[int],
        extra_filters: Optional[str],
    ):
        self._chart_or_id = chart_or_id
        self._dashboard_id = dashboard_id
        self._extra_filters = extra_filters

    def run(self) -> dict[str, Any]:
        self.validate()
        chart: Slice = self._chart_or_id
        try:
            form_data = get_form_data(chart.id, use_slice_data=True)[0]
            if self._dashboard_id:
                form_data["extra_filters"] = (
                    json.loads(self._extra_filters)
                    if self._extra_filters
                    else get_dashboard_extra_filters(chart.id, self._dashboard_id)
                )

            if not chart.datasource:
                raise Exception("Chart's datasource does not exist")

            obj = get_viz(
                datasource_type=chart.datasource.type,
                datasource_id=chart.datasource.id,
                form_data=form_data,
                force=True,
            )

            # pylint: disable=assigning-non-slot
            g.form_data = form_data
            payload = obj.get_payload()
            delattr(g, "form_data")
            error = payload["errors"] or None
            status = payload["status"]
        except Exception as ex:  # pylint: disable=broad-except
            error = error_msg_from_exception(ex)
            status = None

        return {"chart_id": chart.id, "viz_error": error, "viz_status": status}

    def validate(self) -> None:
        if isinstance(self._chart_or_id, Slice):
            return
        chart = db.session.query(Slice).filter_by(id=self._chart_or_id).scalar()
        if not chart:
            raise WarmUpCacheChartNotFoundError()
        self._chart_or_id = chart
