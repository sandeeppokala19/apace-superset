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
import logging
from abc import ABC

from sqlalchemy.exc import SQLAlchemyError

from superset.commands.base import BaseCommand
from superset.explore.form_data.commands.entry import Entry
from superset.explore.form_data.commands.parameters import CommandParameters
from superset.explore.form_data.utils import check_access
from superset.extensions import cache_manager
from superset.key_value.commands.exceptions import (
    KeyValueAccessDeniedError,
    KeyValueUpdateFailedError,
)
from superset.key_value.utils import cache_key

logger = logging.getLogger(__name__)


class UpdateFormDataCommand(BaseCommand, ABC):
    def __init__(
        self, cmd_params: CommandParameters,
    ):
        self._cmd_params = cmd_params

    def run(self) -> bool:
        try:
            dataset_id = self._cmd_params.dataset_id
            chart_id = self._cmd_params.chart_id
            actor = self._cmd_params.actor
            key = self._cmd_params.key
            value = self._cmd_params.value
            check_access(dataset_id, chart_id, actor)
            entry: Entry = cache_manager.explore_form_data_cache.get(key)
            if entry and value:
                user_id = actor.get_user_id()
                if entry["owner"] != user_id:
                    raise KeyValueAccessDeniedError()
                new_entry: Entry = {
                    "owner": actor.get_user_id(),
                    "dataset_id": dataset_id,
                    "chart_id": chart_id,
                    "value": value,
                }
                return cache_manager.explore_form_data_cache.set(key, new_entry)
            return False
        except SQLAlchemyError as ex:
            logger.exception("Error running update command")
            raise KeyValueUpdateFailedError() from ex

    def validate(self) -> None:
        pass
