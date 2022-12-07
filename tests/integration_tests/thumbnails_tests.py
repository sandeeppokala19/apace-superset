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
# from superset import db
# from superset.models.dashboard import Dashboard

import json
import urllib.request
from io import BytesIO
from unittest import skipUnless
from unittest.mock import ANY, call, patch

import pytest
from flask_testing import LiveServerTestCase
from sqlalchemy.sql import func

from superset import db, is_feature_enabled, security_manager
from superset.extensions import machine_auth_provider_factory
from superset.models.dashboard import Dashboard
from superset.models.slice import Slice
from superset.tasks.types import ExecutorType
from superset.utils.screenshots import ChartScreenshot, DashboardScreenshot
from superset.utils.urls import get_url_path
from superset.utils.webdriver import WebDriverProxy
from tests.integration_tests.conftest import with_feature_flags
from tests.integration_tests.fixtures.birth_names_dashboard import (
    load_birth_names_dashboard_with_slices,
    load_birth_names_data,
)
from tests.integration_tests.test_app import app

from .base_tests import SupersetTestCase


class TestThumbnailsSeleniumLive(LiveServerTestCase):
    def create_app(self):
        return app

    def url_open_auth(self, username: str, url: str):
        admin_user = security_manager.find_user(username=username)
        cookies = machine_auth_provider_factory.instance.get_auth_cookies(admin_user)
        opener = urllib.request.build_opener()
        opener.addheaders.append(("Cookie", f"session={cookies['session']}"))
        return opener.open(f"{self.get_server_url()}/{url}")

    @skipUnless((is_feature_enabled("THUMBNAILS")), "Thumbnails feature")
    def test_get_async_dashboard_screenshot(self):
        """
        Thumbnails: Simple get async dashboard screenshot
        """
        with patch("superset.dashboards.api.DashboardRestApi.get") as mock_get:
            rv = self.client.get("/api/v1/dashboard/")
            resp = json.loads(rv.data.decode("utf-8"))
            thumbnail_url = resp["result"][0]["thumbnail_url"]

            response = self.url_open_auth(
                "admin",
                thumbnail_url,
            )
            self.assertEqual(response.getcode(), 202)


class TestWebDriverProxy(SupersetTestCase):
    @patch("superset.utils.webdriver.WebDriverWait")
    @patch("superset.utils.webdriver.firefox")
    @patch("superset.utils.webdriver.sleep")
    def test_screenshot_selenium_headstart(
        self, mock_sleep, mock_webdriver, mock_webdriver_wait
    ):
        webdriver = WebDriverProxy("firefox")
        user = security_manager.get_user_by_username(
            app.config["THUMBNAIL_SELENIUM_USER"]
        )
        url = get_url_path("Superset.slice", slice_id=1, standalone="true")
        app.config["SCREENSHOT_SELENIUM_HEADSTART"] = 5
        webdriver.get_screenshot(url, "chart-container", user=user)
        assert mock_sleep.call_args_list[0] == call(5)

    @patch("superset.utils.webdriver.WebDriverWait")
    @patch("superset.utils.webdriver.firefox")
    def test_screenshot_selenium_locate_wait(self, mock_webdriver, mock_webdriver_wait):
        app.config["SCREENSHOT_LOCATE_WAIT"] = 15
        webdriver = WebDriverProxy("firefox")
        user = security_manager.get_user_by_username(
            app.config["THUMBNAIL_SELENIUM_USER"]
        )
        url = get_url_path("Superset.slice", slice_id=1, standalone="true")
        webdriver.get_screenshot(url, "chart-container", user=user)
        assert mock_webdriver_wait.call_args_list[0] == call(ANY, 15)

    @patch("superset.utils.webdriver.WebDriverWait")
    @patch("superset.utils.webdriver.firefox")
    def test_screenshot_selenium_load_wait(self, mock_webdriver, mock_webdriver_wait):
        app.config["SCREENSHOT_LOAD_WAIT"] = 15
        webdriver = WebDriverProxy("firefox")
        user = security_manager.get_user_by_username(
            app.config["THUMBNAIL_SELENIUM_USER"]
        )
        url = get_url_path("Superset.slice", slice_id=1, standalone="true")
        webdriver.get_screenshot(url, "chart-container", user=user)
        assert mock_webdriver_wait.call_args_list[1] == call(ANY, 15)

    @patch("superset.utils.webdriver.WebDriverWait")
    @patch("superset.utils.webdriver.firefox")
    @patch("superset.utils.webdriver.sleep")
    def test_screenshot_selenium_animation_wait(
        self, mock_sleep, mock_webdriver, mock_webdriver_wait
    ):
        webdriver = WebDriverProxy("firefox")
        user = security_manager.get_user_by_username(
            app.config["THUMBNAIL_SELENIUM_USER"]
        )
        url = get_url_path("Superset.slice", slice_id=1, standalone="true")
        app.config["SCREENSHOT_SELENIUM_ANIMATION_WAIT"] = 4
        webdriver.get_screenshot(url, "chart-container", user=user)
        assert mock_sleep.call_args_list[1] == call(4)


class TestThumbnails(SupersetTestCase):

    mock_image = b"bytes mock image"
    digest_return_value = "foo_bar"
    digest_hash = "5c7d96a3dd7a87850a2ef34087565a6e"

    def _get_thumbnail_url(self, url: str):
        rv = self.client.get(url)
        resp = json.loads(rv.data.decode("utf-8"))
        return resp["result"][0]["thumbnail_url"]

    @pytest.mark.usefixtures("load_birth_names_dashboard_with_slices")
    @with_feature_flags(THUMBNAILS=False)
    def test_dashboard_thumbnail_disabled(self):
        """
        Thumbnails: Dashboard thumbnail disabled
        """
        dashboard = db.session.query(Dashboard).all()[0]
        self.login(username="admin")
        uri = f"api/v1/dashboard/{dashboard.id}/thumbnail/{dashboard.digest}/"
        rv = self.client.get(uri)
        self.assertEqual(rv.status_code, 404)

    @pytest.mark.usefixtures("load_birth_names_dashboard_with_slices")
    @with_feature_flags(THUMBNAILS=False)
    def test_chart_thumbnail_disabled(self):
        """
        Thumbnails: Chart thumbnail disabled
        """
        chart = db.session.query(Slice).all()[0]
        self.login(username="admin")
        uri = f"api/v1/chart/{chart}/thumbnail/{chart.digest}/"
        rv = self.client.get(uri)
        self.assertEqual(rv.status_code, 404)

    @pytest.mark.usefixtures("load_birth_names_dashboard_with_slices")
    @with_feature_flags(THUMBNAILS=True)
    def test_get_async_dashboard_screenshot_as_selenium(self):
        """
        Thumbnails: Simple get async dashboard screenshot as selenium user
        """
        self.login(username="alpha")
        with patch(
            "superset.thumbnails.digest._adjust_string_for_executor"
        ) as mock_adjust_string:
            mock_adjust_string.return_value = self.digest_return_value
            thumbnail_url = self._get_thumbnail_url("/api/v1/dashboard/")
            assert self.digest_hash in thumbnail_url
            assert mock_adjust_string.call_args[0][1] == ExecutorType.SELENIUM
            assert mock_adjust_string.call_args[0][2] == "admin"

            rv = self.client.get(thumbnail_url)
            self.assertEqual(rv.status_code, 202)

    @pytest.mark.usefixtures("load_birth_names_dashboard_with_slices")
    @with_feature_flags(THUMBNAILS=True)
    def test_get_async_dashboard_screenshot_as_initiator(self):
        """
        Thumbnails: Simple get async dashboard screenshot as initiator
        """
        username = "alpha"
        self.login(username=username)
        with patch.dict(
            "superset.thumbnails.digest.current_app.config",
            {
                "THUMBNAIL_EXECUTE_AS": [ExecutorType.INITIATOR],
            },
        ), patch(
            "superset.thumbnails.digest._adjust_string_for_executor"
        ) as mock_adjust_string:
            mock_adjust_string.return_value = self.digest_return_value
            thumbnail_url = self._get_thumbnail_url("/api/v1/dashboard/")
            assert self.digest_hash in thumbnail_url
            assert mock_adjust_string.call_args[0][1] == ExecutorType.INITIATOR
            assert mock_adjust_string.call_args[0][2] == username

            rv = self.client.get(thumbnail_url)
            self.assertEqual(rv.status_code, 202)

    @pytest.mark.usefixtures("load_birth_names_dashboard_with_slices")
    @with_feature_flags(THUMBNAILS=True)
    def test_get_async_dashboard_notfound(self):
        """
        Thumbnails: Simple get async dashboard not found
        """
        max_id = db.session.query(func.max(Dashboard.id)).scalar()
        self.login(username="admin")
        uri = f"api/v1/dashboard/{max_id + 1}/thumbnail/1234/"
        rv = self.client.get(uri)
        self.assertEqual(rv.status_code, 404)

    @pytest.mark.usefixtures("load_birth_names_dashboard_with_slices")
    @skipUnless((is_feature_enabled("THUMBNAILS")), "Thumbnails feature")
    def test_get_async_dashboard_not_allowed(self):
        """
        Thumbnails: Simple get async dashboard not allowed
        """
        dashboard = db.session.query(Dashboard).all()[0]
        self.login(username="gamma")
        uri = f"api/v1/dashboard/{dashboard.id}/thumbnail/{dashboard.digest}/"
        rv = self.client.get(uri)
        self.assertEqual(rv.status_code, 404)

    @pytest.mark.usefixtures("load_birth_names_dashboard_with_slices")
    @with_feature_flags(THUMBNAILS=True)
    def test_get_async_chart_screenshot_as_selenium(self):
        """
        Thumbnails: Simple get async chart screenshot as selenium user
        """
        self.login(username="alpha")
        with patch(
            "superset.thumbnails.digest._adjust_string_for_executor"
        ) as mock_adjust_string:
            mock_adjust_string.return_value = self.digest_return_value
            thumbnail_url = self._get_thumbnail_url("/api/v1/chart/")
            assert self.digest_hash in thumbnail_url
            assert mock_adjust_string.call_args[0][1] == ExecutorType.SELENIUM
            assert mock_adjust_string.call_args[0][2] == "admin"

            rv = self.client.get(thumbnail_url)
            self.assertEqual(rv.status_code, 202)

    @pytest.mark.usefixtures("load_birth_names_dashboard_with_slices")
    @with_feature_flags(THUMBNAILS=True)
    def test_get_async_chart_screenshot_as_initiator(self):
        """
        Thumbnails: Simple get async chart screenshot as initiator
        """
        username = "alpha"
        self.login(username=username)
        with patch.dict(
            "superset.thumbnails.digest.current_app.config",
            {
                "THUMBNAIL_EXECUTE_AS": [ExecutorType.INITIATOR],
            },
        ), patch(
            "superset.thumbnails.digest._adjust_string_for_executor"
        ) as mock_adjust_string:
            mock_adjust_string.return_value = self.digest_return_value
            thumbnail_url = self._get_thumbnail_url("/api/v1/chart/")
            assert self.digest_hash in thumbnail_url
            assert mock_adjust_string.call_args[0][1] == ExecutorType.INITIATOR
            assert mock_adjust_string.call_args[0][2] == username

            rv = self.client.get(thumbnail_url)
            self.assertEqual(rv.status_code, 202)

    @pytest.mark.usefixtures("load_birth_names_dashboard_with_slices")
    @with_feature_flags(THUMBNAILS=True)
    def test_get_async_chart_notfound(self):
        """
        Thumbnails: Simple get async chart not found
        """
        max_id = db.session.query(func.max(Slice.id)).scalar()
        self.login(username="admin")
        uri = f"api/v1/chart/{max_id + 1}/thumbnail/1234/"
        rv = self.client.get(uri)
        self.assertEqual(rv.status_code, 404)

    @pytest.mark.usefixtures("load_birth_names_dashboard_with_slices")
    @with_feature_flags(THUMBNAILS=True)
    def test_get_cached_chart_wrong_digest(self):
        """
        Thumbnails: Simple get chart with wrong digest
        """
        chart = db.session.query(Slice).all()[0]
        with patch.object(
            ChartScreenshot, "get_from_cache", return_value=BytesIO(self.mock_image)
        ):
            self.login(username="admin")
            uri = f"api/v1/chart/{chart.id}/thumbnail/1234/"
            rv = self.client.get(uri)
            self.assertEqual(rv.status_code, 302)
            self.assertRedirects(
                rv, f"api/v1/chart/{chart.id}/thumbnail/{chart.digest}/"
            )

    @pytest.mark.usefixtures("load_birth_names_dashboard_with_slices")
    @with_feature_flags(THUMBNAILS=True)
    def test_get_cached_dashboard_screenshot(self):
        """
        Thumbnails: Simple get cached dashboard screenshot
        """
        dashboard = db.session.query(Dashboard).all()[0]
        with patch.object(
            DashboardScreenshot, "get_from_cache", return_value=BytesIO(self.mock_image)
        ):
            self.login(username="admin")
            uri = f"api/v1/dashboard/{dashboard.id}/thumbnail/{dashboard.digest}/"
            rv = self.client.get(uri)
            self.assertEqual(rv.status_code, 200)
            self.assertEqual(rv.data, self.mock_image)

    @pytest.mark.usefixtures("load_birth_names_dashboard_with_slices")
    @with_feature_flags(THUMBNAILS=True)
    def test_get_cached_chart_screenshot(self):
        """
        Thumbnails: Simple get cached chart screenshot
        """
        chart = db.session.query(Slice).all()[0]
        with patch.object(
            ChartScreenshot, "get_from_cache", return_value=BytesIO(self.mock_image)
        ):
            self.login(username="admin")
            uri = f"api/v1/chart/{chart.id}/thumbnail/{chart.digest}/"
            rv = self.client.get(uri)
            self.assertEqual(rv.status_code, 200)
            self.assertEqual(rv.data, self.mock_image)

    @pytest.mark.usefixtures("load_birth_names_dashboard_with_slices")
    @with_feature_flags(THUMBNAILS=True)
    def test_get_cached_dashboard_wrong_digest(self):
        """
        Thumbnails: Simple get dashboard with wrong digest
        """
        dashboard = db.session.query(Dashboard).all()[0]
        with patch.object(
            DashboardScreenshot, "get_from_cache", return_value=BytesIO(self.mock_image)
        ):
            self.login(username="admin")
            uri = f"api/v1/dashboard/{dashboard.id}/thumbnail/1234/"
            rv = self.client.get(uri)
            self.assertEqual(rv.status_code, 302)
            self.assertRedirects(
                rv, f"api/v1/dashboard/{dashboard.id}/thumbnail/{dashboard.digest}/"
            )
