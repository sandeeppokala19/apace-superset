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
import json

import pandas as pd
from sqlalchemy import BigInteger, Text

from superset import db
from .helpers import (
    get_example_data,
    get_sample_data_db,
    get_sample_data_schema,
    make_df_columns_compatible,
    make_dtype_columns_compatible,
    TBL,
)


def load_sf_population_polygons():
    tbl_name = 'sf_population_polygons'
    sample_db = get_sample_data_db()
    schema = get_sample_data_schema()
    data = get_example_data('sf_population.json.gz')
    df = pd.read_json(data)
    df['contour'] = df.contour.map(json.dumps)
    df = make_df_columns_compatible(df, sample_db.db_engine_spec)
    dtypes = make_dtype_columns_compatible({
        'zipcode': BigInteger(),
        'population': BigInteger(),
        'contour': Text(),
        'area': BigInteger(),
    }, sample_db.db_engine_spec)
    df.to_sql(
        name=tbl_name,
        con=sample_db.get_sqla_engine(),
        schema=schema,
        if_exists='replace',
        chunksize=500,
        dtype=dtypes,
        index=False)
    print('Creating table {} reference'.format(tbl_name))
    tbl = db.session.query(TBL).filter_by(table_name=tbl_name, database=sample_db,
                                          schema=schema).first()
    if not tbl:
        tbl = TBL(table_name=tbl_name, database=sample_db, schema=schema)
    tbl.description = 'Population density of San Francisco'
    db.session.merge(tbl)
    db.session.commit()
    tbl.fetch_metadata()
