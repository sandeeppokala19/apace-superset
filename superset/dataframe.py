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
# pylint: disable=C,R,W
""" Superset wrapper around pandas.DataFrame.

TODO(bkyryliuk): add support for the conventions like: *_dim or dim_*
                 dimensions, *_ts, ts_*, ds_*, *_ds - datetime, etc.
TODO(bkyryliuk): recognize integer encoded enums.

"""
import logging
from datetime import date, datetime

import numpy as np
import pandas as pd
from pandas.core.common import maybe_box_datetimelike
from pandas.core.dtypes.dtypes import ExtensionDtype

from superset.utils.core import JS_MAX_INTEGER

INFER_COL_TYPES_THRESHOLD = 95
INFER_COL_TYPES_SAMPLE_SIZE = 100

def is_numeric(dtype):
    if hasattr(dtype, "_is_numeric"):
        return dtype._is_numeric
    return np.issubdtype(dtype, np.number)


class SupersetDataFrame(object):
    # Mapping numpy dtype.char to generic database types
    type_map = {
        "b": "BOOL",  # boolean
        "i": "INT",  # (signed) integer
        "u": "INT",  # unsigned integer
        "l": "INT",  # 64bit integer
        "f": "FLOAT",  # floating-point
        "c": "FLOAT",  # complex-floating point
        "m": None,  # timedelta
        "M": "DATETIME",  # datetime
        "O": "OBJECT",  # (Python) objects
        "S": "BYTE",  # (byte-)string
        "U": "STRING",  # Unicode
        "V": None,  # raw data (void)
    }

    def __init__(self, table):
        self.df = table.to_pandas_df()
        self._type_dict = table.type_dict  # TODO: this data is currently lost on async query serialization

    @property
    def raw_df(self):
        return self.df

    @property
    def size(self):
        return len(self.df.index)

    @property
    def data(self):
        return self.format_data(self.df)

    @classmethod
    def format_data(cls, df):
        # work around for https://github.com/pandas-dev/pandas/issues/18372
        data = [
            dict(
                (k, maybe_box_datetimelike(v))
                for k, v in zip(df.columns, np.atleast_1d(row))
            )
            for row in df.values
        ]
        for d in data:
            for k, v in list(d.items()):
                # if an int is too big for Java Script to handle
                # convert it to a string
                if isinstance(v, int):
                    if abs(v) > JS_MAX_INTEGER:
                        d[k] = str(v)
        return data

    @classmethod
    def db_type(cls, dtype):
        """Given a numpy dtype, Returns a generic database type"""
        if isinstance(dtype, ExtensionDtype):
            return cls.type_map.get(dtype.kind)
        elif hasattr(dtype, "char"):
            return cls.type_map.get(dtype.char)

    @classmethod
    def datetime_conversion_rate(cls, data_series):
        success = 0
        total = 0
        for value in data_series:
            total += 1
            try:
                pd.to_datetime(value)
                success += 1
            except Exception:
                continue
        return 100 * success / total

    @staticmethod
    def is_date(np_dtype, db_type_str):
        def looks_daty(s):
            if isinstance(s, str):
                return any([s.lower().startswith(ss) for ss in ("time", "date")])
            return False

        if looks_daty(db_type_str):
            return True
        if np_dtype and np_dtype.name and looks_daty(np_dtype.name):
            return True
        return False

    @classmethod
    def is_dimension(cls, dtype, column_name):
        if cls.is_id(column_name):
            return False
        return dtype.name in ("object", "bool")

    @classmethod
    def is_id(cls, column_name):
        return column_name.startswith("id") or column_name.endswith("id")

    @property
    def columns(self):
        """Provides metadata about columns for data visualization.

        :return: array containing dicts with the fields name, type, is_date, is_dim.
        """
        if self.df.empty:
            return None

        columns = []
        sample_size = min(INFER_COL_TYPES_SAMPLE_SIZE, len(self.df.index))
        sample = self.df
        if sample_size:
            sample = self.df.sample(sample_size)
        for col in self.df.dtypes.keys():
            db_type_str = self._type_dict.get(col) or self.db_type(self.df.dtypes[col])
            column = {
                "name": col,
                "type": db_type_str,
                "is_date": self.is_date(self.df.dtypes[col], db_type_str),
                "is_dim": self.is_dimension(self.df.dtypes[col], col),
            }

            if not db_type_str or db_type_str.upper() == "OBJECT":
                v = sample[col].iloc[0] if not sample[col].empty else None
                if isinstance(v, str):
                    column["type"] = "STRING"
                elif isinstance(v, int):
                    column["type"] = "INT"
                elif isinstance(v, float):
                    column["type"] = "FLOAT"
                elif isinstance(v, (datetime, date)):
                    column["type"] = "DATETIME"
                    column["is_date"] = True
                    column["is_dim"] = False
                # check if encoded datetime
                if (
                    column["type"] == "STRING"
                    and self.datetime_conversion_rate(sample[col])
                    > INFER_COL_TYPES_THRESHOLD
                ):
                    column.update({"is_date": True, "is_dim": False})

            columns.append(column)
        return columns
