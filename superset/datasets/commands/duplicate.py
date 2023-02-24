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
from typing import Any, Dict, List, Optional

from flask_appbuilder.models.sqla import Model
from marshmallow import ValidationError
from sqlalchemy.exc import SQLAlchemyError

from superset.commands.base import BaseCommand, CreateMixin
from superset.commands.exceptions import DatasourceTypeInvalidError
from superset.connectors.sqla.models import SqlaTable, SqlMetric, TableColumn
from superset.dao.exceptions import DAOCreateFailedError
from superset.databases.commands.exceptions import DatabaseNotFoundError
from superset.databases.dao import DatabaseDAO
from superset.datasets.commands.exceptions import (
    DatasetDuplicateFailedError,
    DatasetExistsValidationError,
    DatasetInvalidError,
    DatasetNotFoundError,
)
from superset.datasets.dao import DatasetDAO
from superset.extensions import db
from superset.models.core import Database
from superset.sql_parse import ParsedQuery

logger = logging.getLogger(__name__)


class DuplicateDatasetCommand(CreateMixin, BaseCommand):
    def __init__(self, data: Dict[str, Any]) -> None:
        self._base_model: Optional[SqlaTable] = None
        self._properties = data.copy()
        self._database: Optional[Database] = None

    def run(self) -> Model:
        self.validate()
        try:
            if self._base_model and self._database:
                table_name = self._properties["table_name"]
                owners = self._properties["owners"]
                table = SqlaTable(table_name=table_name, owners=owners)
                table.database = self._database
                table.schema = self._base_model.schema
                table.template_params = self._base_model.template_params
                table.is_sqllab_view = True
                table.sql = ParsedQuery(self._base_model.sql).stripped()
                db.session.add(table)
                cols = []
                for config_ in self._base_model.columns:
                    column_name = config_.column_name
                    col = TableColumn(
                        column_name=column_name,
                        verbose_name=config_.verbose_name,
                        expression=config_.expression,
                        filterable=config_.filterable,
                        groupby=config_.groupby,
                        is_dttm=config_.is_dttm,
                        type=config_.type,
                        description=config_.description,
                    )
                    cols.append(col)
                table.columns = cols
                mets = []
                for config_ in self._base_model.metrics:
                    metric_name = config_.metric_name
                    met = SqlMetric(
                        metric_name=metric_name,
                        verbose_name=config_.verbose_name,
                        expression=config_.expression,
                        metric_type=config_.metric_type,
                        description=config_.description,
                    )
                    mets.append(met)
                table.metrics = mets
                db.session.commit()
        except (SQLAlchemyError, DAOCreateFailedError) as ex:
            logger.warning(ex, exc_info=True)
            db.session.rollback()
            raise DatasetDuplicateFailedError() from ex
        return table

    def validate(self) -> None:
        exceptions: List[ValidationError] = []
        base_model_id = self._properties["base_model_id"]
        duplicate_name = self._properties["table_name"]

        self._base_model = DatasetDAO.find_by_id(base_model_id)
        if self._base_model:
            self._database = DatabaseDAO.find_by_id(self._base_model.database_id)
            if not self._database:
                exceptions.append(DatabaseNotFoundError())
        else:
            exceptions.append(DatasetNotFoundError())

        if self._base_model and self._base_model.kind != "virtual":
            exceptions.append(DatasourceTypeInvalidError())

        if DatasetDAO.find_one_or_none(table_name=duplicate_name):
            exceptions.append(DatasetExistsValidationError(table_name=duplicate_name))

        try:
            owners = self.populate_owners()
            self._properties["owners"] = owners
        except ValidationError as ex:
            exceptions.append(ex)

        if exceptions:
            exception = DatasetInvalidError()
            exception.add_list(exceptions)
            raise exception
