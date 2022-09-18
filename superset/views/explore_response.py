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
from uuid import uuid4
from typing import Any, Dict, List, Optional, cast

from flask import g
from superset import db
from superset.datasource.dao import DatasourceDAO
from superset.databases.dao import DatabaseDAO
from superset.connectors.base.models import BaseDatasource

from superset.views.multi_dataset import CreateMultiDatasetCommand
from superset.datasets.commands.update import UpdateDatasetCommand
from superset.exceptions import SupersetGenericDBErrorException


TMP_TABLE_NAME_PREFIX = 'tmp__'

SPECIAL_CHARACTERS = {
    '$': "",
    "-": "_"
}

SMALLCASE_A_ASCII_CODE = 97
SQL_POSTFIX_SCHEMA = 'WHERE 1=2'

class ExploreResponse():
    def __init__(self, form_data: Dict[str, Any]):
        self.form_data = form_data

    @staticmethod
    def get_datasources_data(datasources: List):
        """
        Returns Datasource IDs and Types in seperate Lists
        """
        datasource_ids: List[int] = []
        datasource_types: List[str] = []

        for datasource in datasources:
                datasource_id, datasource_type = datasource.split("__")
                datasource_ids.append(int(datasource_id))
                datasource_types.append(datasource_type)

        return datasource_ids, datasource_types

    @staticmethod
    def get_base_datasources(datasource_ids: List[int], datasource_types: List[str]) -> List[BaseDatasource]:
        """
        Gets a List of Datasets given ID's
        """
        datasources: Optional[List[BaseDatasource]] = []
        for index, value in enumerate(datasource_ids):
            new_datasource = DatasourceDAO.get_datasource(
                db.session, cast(str, datasource_types[index]), value
            )
            datasources.append(new_datasource)
        return datasources

    @staticmethod
    def get_table_name(datasources: List[BaseDatasource]) -> str:
        """
        Creates a Table name by combining all dataset names along with a Unique ID
        """
        TMP_TABLE_NAME = TMP_TABLE_NAME_PREFIX
        for datasource in datasources:
            table_name =  datasource.data["table_name"]
            TMP_TABLE_NAME += table_name + "__"
        TMP_TABLE_NAME += str(uuid4())[:4]
        return TMP_TABLE_NAME

    @staticmethod
    def replace_special_characters(column: str) -> str:
        for char, replaced_char in SPECIAL_CHARACTERS.items():
            column.replace(char, replaced_char )
        return column

    @staticmethod
    def get_calculated_column_expression(columns: List[Dict[str, Any]], column_expression: str, alias: str) -> str:
        changed_expression = column_expression
        for column in columns:
            column_name = column["column_name"]
            changed_expression = changed_expression.replace(column_name, "{}.{}".format(alias, column_name))
        return changed_expression

    @staticmethod
    def get_column_aliases(columns: List[Dict[str, Any]], alias: str) -> List[str]:
        """
        Returns a list of Column names as Aliases for a SELECT Query
        """
        renamed_columns = []
        column_expressions = {}
        for column in columns:
            column_name = column["column_name"]
            expression = column["expression"]
            if expression:
                column_name_exp = ExploreResponse.get_calculated_column_expression(columns, expression, alias)
                column_expressions[column_name] = column_name_exp
            else:
                column_name_exp = "{}.{}".format(alias, column_name)
            column_alias = "{}_{}".format(alias, ExploreResponse.replace_special_characters(column_name))
            renamed_columns.append("{} {}".format(column_name_exp, column_alias))
        return renamed_columns, column_expressions

    @staticmethod
    def map_and_get_column_names(datasources: List[BaseDatasource]) -> List[str]:
        """
        Iterates through Datasets and returns Column Aliases for each Dataset
        """
        table_column_expressions: Dict = {}
        mapped_columns: list[str] = []
        for index, datasource in enumerate(datasources):
            table_name = datasource.data["table_name"]
            columns: list[Dict[str, Any]] = datasource.data["columns"]
            renamed_columns, expression_columns  = ExploreResponse.get_column_aliases(
                columns, chr(SMALLCASE_A_ASCII_CODE + index)
            )
            column_aliases = ",".join(renamed_columns)
            mapped_columns.append(column_aliases)
            table_column_expressions[table_name] = expression_columns
        return mapped_columns, table_column_expressions

    @staticmethod
    def column_Join(table_expressions: Dict, column_join: str, table: str) -> str:
        return table_expressions[column_join] if column_join in table_expressions else "{}.{}".format(table, column_join)

    @staticmethod
    def get_single_column_join(first_table: str, second_table: str, column_joins: List,
        first_table_expressions: Dict, second_table_expressions:Dict
    ) -> str:
        join = column_joins.pop()
        first_column_join = join["first_column"]
        second_column_join = join["second_column"]
        left_join = ExploreResponse.column_Join(first_table_expressions, first_column_join, first_table)
        right_join = ExploreResponse.column_Join(second_table_expressions, second_column_join, second_table)
        return "{}={}".format(left_join, right_join)

    @staticmethod
    def get_multiple_column_join(first_table: str, second_table: str, column_joins: List,
        first_table_expressions: Dict, second_table_expressions:Dict) -> str:
        join_statement = ''
        last_join = column_joins.pop()
        last_join_first_column = last_join["first_column"]
        last_join_second_column = last_join["second_column"]
        last_left_join = ExploreResponse.column_Join(first_table_expressions, last_join_first_column, first_table)
        last_right_join = ExploreResponse.column_Join(second_table_expressions, last_join_second_column, second_table)

        for count, join in enumerate(column_joins):
            first_column_join = join["first_column"]
            second_column_join = join["second_column"]
            left_join = ExploreResponse.column_Join(first_table_expressions, first_column_join, first_table)
            right_join = ExploreResponse.column_Join(second_table_expressions, second_column_join, second_table)
            join_string = "{}={}".format(
                left_join, right_join
            ) if count == len(column_joins) - 1 else "{}={}, ".format(left_join, right_join)
            join_statement += join_string
        join_statement += ' AND ' + "{}={}".format(last_left_join, last_right_join)

        return join_statement

    @staticmethod
    def get_join_query(dataset_joins: List, joins: List,
        datasources: List[BaseDatasource], table_column_expressions: Dict) -> str:
        JOIN_STATEMENT = ""
        for index, column_joins in enumerate(dataset_joins):
            table_join = ''
            first_Dataset = datasources[index]
            second_dataset = datasources[index + 1]
            first_table_name_alias = chr(SMALLCASE_A_ASCII_CODE + index)
            second_table_name_alias = chr(SMALLCASE_A_ASCII_CODE + index + 1)
            first_table_expressions = table_column_expressions[datasources[index].data["table_name"]]
            second_table_expressions = table_column_expressions[datasources[index].data["table_name"]]
            if len(column_joins) == 1:
                table_join += ExploreResponse.get_single_column_join(first_table_name_alias,
                    second_table_name_alias, column_joins, first_table_expressions, second_table_expressions)
            else:
                table_join += ExploreResponse.get_multiple_column_join(first_table_name_alias,
                    second_table_name_alias, column_joins, first_table_expressions, second_table_expressions)
            if index == 0:
                JOIN_STATEMENT += "{} {} {} {} {} ON {} ".format(
                    first_Dataset.name, first_table_name_alias, joins[index],
                    second_dataset.name, second_table_name_alias, table_join
                )
            else:
                JOIN_STATEMENT += "{} {} {} ON {} ".format(
                    joins[index], second_dataset.name, second_table_name_alias, table_join
                )
        return JOIN_STATEMENT

    def multiple_dataset(self):
        joins:list = self.form_data.get("joins")
        dataset_joins:list = self.form_data.get("column_joins")
        first_datasource:str = self.form_data.get("first_datasource")
        additional_datasources:list = self.form_data.get("additional_datasources")

        additional_datasources.insert(0, first_datasource)
        datasource_ids, datasource_types  = self.get_datasources_data(additional_datasources)

        datasources = self.get_base_datasources(datasource_ids, datasource_types)

        table_name = self.get_table_name(datasources)
        mapped_columns, table_column_expressions = self.map_and_get_column_names(datasources)

        column_aliases = ",".join(mapped_columns)
        join_statement = self.get_join_query(dataset_joins, joins, datasources, table_column_expressions)

        sql_query = "SELECT {} FROM {} ".format(column_aliases, join_statement)

        presto_database = DatabaseDAO.get_database_by_name(datasources[0].data["database"]["name"])

        try:
            new_model = CreateMultiDatasetCommand(g.user, {
                "table_name": table_name,
                "database": presto_database,
                "database_id": presto_database.id,
                "sql": "{} {}".format(sql_query, SQL_POSTFIX_SCHEMA)
            }).run()
        except Exception as ex:
            raise SupersetGenericDBErrorException(message=ex.message)

        changed_model = UpdateDatasetCommand(new_model.id, {"sql": sql_query}).run()

        datasource = DatasourceDAO.get_datasource(
             db.session, cast(str, changed_model.type), changed_model.id
        )

        return datasource, datasource.name
