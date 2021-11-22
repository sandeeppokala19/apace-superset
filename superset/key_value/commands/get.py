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
from typing import Any

from flask import current_app as app
from flask_appbuilder.models.sqla import Model
from flask_appbuilder.security.sqla.models import User

from superset.commands.base import BaseCommand
from superset.dao.exceptions import DAOException
from superset.key_value.commands.exceptions import KeyValueGetFailedError

logger = logging.getLogger(__name__)


class GetKeyValueCommand(BaseCommand):
    def __init__(self, user: User, get_dao: Any, resource_id: int, key: str):
        self._actor = user
        self._get_dao = get_dao
        self._resource_id = resource_id
        self._key = key

    def run(self) -> Model:
        try:
            value = self._get_dao.find_by_id(self._resource_id, self._key)
            config = app.config["FILTERS_STATE_CACHE_CONFIG"]
            if config.get("REFRESH_TIMEOUT_ON_RETRIEVAL") == True:
                self._get_dao.update(self._resource_id, self._key, value)
            return value
        except DAOException as ex:
            logger.exception(ex.exception)
            raise KeyValueGetFailedError() from ex

    def validate(self) -> None:
        pass
