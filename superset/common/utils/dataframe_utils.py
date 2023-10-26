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
from __future__ import annotations

import datetime
from typing import Any, TYPE_CHECKING

import numpy as np
import pandas as pd

from superset.utils.core import GenericDataType

if TYPE_CHECKING:
    from superset.common.query_object import QueryObject


def left_join_df(
    left_df: pd.DataFrame,
    right_df: pd.DataFrame,
    join_keys: list[str],
    lsuffix: str = "",
    rsuffix: str = "",
) -> pd.DataFrame:
    df = left_df.set_index(join_keys).join(
        right_df.set_index(join_keys), lsuffix=lsuffix, rsuffix=rsuffix
    )
    df.reset_index(inplace=True)
    return df


def delete_tz_from_df(d: dict) -> pd.DataFrame:
    coltypes = d.get('coltypes')
    if isinstance(d.get('data'), pd.DataFrame):
        data = d.get('data')
    elif isinstance(d.get('df'), pd.DataFrame):
        data = d.get('df')
    else:
        data = d.get('data') or d.get('df')
    df = pd.DataFrame(data)
    colnames = [colname for colname in df.columns]
    if GenericDataType.TEMPORAL in coltypes or GenericDataType.NUMERIC in coltypes:
        for k, type_col in enumerate(coltypes):
            if type_col == GenericDataType.TEMPORAL:
                name_col = colnames[k]
                df[name_col] = pd.to_datetime(df[name_col], utc=True)
                df[name_col] = df[name_col].dt.tz_localize(None)
            if type_col == GenericDataType.NUMERIC:
                name_col = colnames[k]
                df[name_col] = pd.to_numeric(df[name_col])

        return df
    return df


def df_metrics_to_num(df: pd.DataFrame, query_object: QueryObject) -> None:
    """Converting metrics to numeric when pandas.read_sql cannot"""
    for col, dtype in df.dtypes.items():
        if dtype.type == np.object_ and col in query_object.metric_names:
            # soft-convert a metric column to numeric
            # will stay as strings if conversion fails
            df[col] = df[col].infer_objects()


def is_datetime_series(series: Any) -> bool:
    if series is None or not isinstance(series, pd.Series):
        return False

    if series.isnull().all():
        return False

    return pd.api.types.is_datetime64_any_dtype(series) or (
        series.apply(lambda x: isinstance(x, datetime.date) or x is None).all()
    )
