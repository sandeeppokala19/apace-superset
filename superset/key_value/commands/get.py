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
from abc import ABC, abstractmethod
from typing import Optional

from flask import current_app as app
from flask_appbuilder.models.sqla import Model
from sqlalchemy.exc import SQLAlchemyError

from superset.commands.base import BaseCommand
from superset.key_value.commands.args import Args
from superset.key_value.commands.exceptions import KeyValueGetFailedError

logger = logging.getLogger(__name__)


class GetKeyValueCommand(BaseCommand, ABC):
    def __init__(self, args: Args):
        self._args = args

    def run(self) -> Model:
        try:
            config = app.config["FILTER_STATE_CACHE_CONFIG"]
            self._args["refresh_timeout"] = config.get("REFRESH_TIMEOUT_ON_RETRIEVAL")
            return self.get(self._args)
        except SQLAlchemyError as ex:
            logger.exception("Error running get command")
            raise KeyValueGetFailedError() from ex

    def validate(self) -> None:
        pass

    @abstractmethod
    def get(self, args: Args,) -> Optional[str]:
        ...
