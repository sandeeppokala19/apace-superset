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
from unittest.mock import patch

import pytest
from flask_appbuilder.security.sqla.models import User
from sqlalchemy.orm import Session

from superset.connectors.sqla.models import SqlaTable
from superset.explore.exceptions import DatasetAccessDeniedError
from superset.explore.form_data.commands.state import TemporaryExploreState
from superset.extensions import cache_manager
from superset.models.slice import Slice
from tests.integration_tests.base_tests import login
from tests.integration_tests.fixtures.client import client
from tests.integration_tests.fixtures.world_bank_dashboard import (
    load_world_bank_dashboard_with_slices,
    load_world_bank_data,
)
from tests.integration_tests.test_app import app

FORM_DATA_KEY = "form_data_key"
FORM_DATA = {"test": "test value"}


@pytest.fixture
def chart_id(load_world_bank_dashboard_with_slices) -> int:
    with app.app_context() as ctx:
        session: Session = ctx.app.appbuilder.get_session
        chart = session.query(Slice).filter_by(slice_name="World's Population").one()
        return chart.id


@pytest.fixture
def admin_id() -> int:
    with app.app_context() as ctx:
        session: Session = ctx.app.appbuilder.get_session
        admin = session.query(User).filter_by(username="admin").one()
        return admin.id


@pytest.fixture
def dataset() -> int:
    with app.app_context() as ctx:
        session: Session = ctx.app.appbuilder.get_session
        dataset = (
            session.query(SqlaTable)
            .filter_by(table_name="wb_health_population")
            .first()
        )
        return dataset


@pytest.fixture(autouse=True)
def cache(chart_id, admin_id, dataset):
    entry: TemporaryExploreState = {
        "owner": admin_id,
        "datasource_id": dataset.id,
        "datasource_type": dataset.type,
        "chart_id": chart_id,
        "form_data": json.dumps(FORM_DATA),
    }
    cache_manager.explore_form_data_cache.set(FORM_DATA_KEY, entry)


def test_no_params_provided(client):
    login(client, "admin")
    resp = client.get(f"api/v1/explore/")
    assert resp.status_code == 200
    data = json.loads(resp.data.decode("utf-8"))
    result = data.get("result")
    assert result["dataset"] != None
    assert result["form_data"] != None
    assert result["message"] == None
    assert result["slice"] == None


def test_get_from_cache(client, dataset):
    login(client, "admin")
    resp = client.get(
        f"api/v1/explore/?form_data_key={FORM_DATA_KEY}&dataset_id={dataset.id}&dataset_type={dataset.type}"
    )
    assert resp.status_code == 200
    data = json.loads(resp.data.decode("utf-8"))
    result = data.get("result")
    assert result["dataset"] != None
    assert result["form_data"]["test"] == "test value"
    assert result["message"] == None
    assert result["slice"] == None


def test_get_from_cache_unknown_key_chart_id(client, chart_id):
    login(client, "admin")
    unknown_key = "unknown_key"
    resp = client.get(
        f"api/v1/explore/?form_data_key={unknown_key}&slice_id={chart_id}"
    )
    assert resp.status_code == 200
    data = json.loads(resp.data.decode("utf-8"))
    result = data.get("result")
    assert result["dataset"] != None
    assert result["form_data"] != None
    assert (
        result["message"]
        == "Form data not found in cache, reverting to chart metadata."
    )
    assert result["slice"] != None
    assert result["slice"] != None


def test_get_from_cache_unknown_key_dataset(client, dataset):
    login(client, "admin")
    unknown_key = "unknown_key"
    resp = client.get(
        f"api/v1/explore/?form_data_key={unknown_key}&dataset_id={dataset.id}&dataset_type={dataset.type}"
    )
    assert resp.status_code == 200
    data = json.loads(resp.data.decode("utf-8"))
    result = data.get("result")
    assert result["dataset"] != None
    assert result["form_data"] != None
    assert (
        result["message"]
        == "Form data not found in cache, reverting to dataset metadata."
    )
    assert result["slice"] == None


def test_get_from_cache_unknown_key_no_extra_parameters(client):
    login(client, "admin")
    unknown_key = "unknown_key"
    resp = client.get(f"api/v1/explore/?form_data_key={unknown_key}")
    assert resp.status_code == 200
    data = json.loads(resp.data.decode("utf-8"))
    result = data.get("result")
    assert result["dataset"] != None
    assert result["form_data"] != None
    assert result["message"] == None
    assert result["slice"] == None


def test_get_from_permalink(client, chart_id, dataset):
    login(client, "admin")
    form_data = {
        "chart_id": chart_id,
        "datasource": f"{dataset.id}__{dataset.type}",
        **FORM_DATA,
    }
    resp = client.post(f"api/v1/explore/permalink", json={"formData": form_data})
    data = json.loads(resp.data.decode("utf-8"))
    permalink_key = data["key"]
    resp = client.get(f"api/v1/explore/?permalink_key={permalink_key}")
    assert resp.status_code == 200
    data = json.loads(resp.data.decode("utf-8"))
    result = data.get("result")
    assert result["dataset"] != None
    assert result["form_data"]["test"] == "test value"
    assert result["message"] == None
    assert result["slice"] == None


def test_get_from_permalink_unknown_key(client):
    login(client, "admin")
    unknown_key = "unknown_key"
    resp = client.get(f"api/v1/explore/?permalink_key={unknown_key}")
    assert resp.status_code == 404


@patch("superset.security.SupersetSecurityManager.can_access_datasource")
def test_get_dataset_access_denied(mock_can_access_datasource, client, dataset):
    message = "Dataset access denied"
    mock_can_access_datasource.side_effect = DatasetAccessDeniedError(
        message=message, dataset_id=dataset.id, dataset_type=dataset.type
    )
    login(client, "admin")
    resp = client.get(
        f"api/v1/explore/?form_data_key={FORM_DATA_KEY}&dataset_id={dataset.id}&dataset_type={dataset.type}"
    )
    data = json.loads(resp.data.decode("utf-8"))
    assert resp.status_code == 403
    assert data["dataset_id"] == dataset.id
    assert data["dataset_type"] == dataset.type
    assert data["message"] == message


@patch("superset.datasource.dao.DatasourceDAO.get_datasource")
def test_wrong_endpoint(mock_get_datasource, client, dataset):
    dataset.default_endpoint = "another_endpoint"
    mock_get_datasource.return_value = dataset
    login(client, "admin")
    resp = client.get(
        f"api/v1/explore/?dataset_id={dataset.id}&dataset_type={dataset.type}"
    )
    data = json.loads(resp.data.decode("utf-8"))
    assert resp.status_code == 302
    assert data["redirect"] == dataset.default_endpoint
