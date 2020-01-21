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
import logging
import re

from flask import current_app, g, make_response, request
from flask_appbuilder.api import expose, protect, rison, safe
from flask_appbuilder.models.sqla.interface import SQLAInterface
from flask_babel import lazy_gettext as _, ngettext
from marshmallow import fields, post_load, pre_load, Schema, ValidationError
from marshmallow.validate import Length
from sqlalchemy.exc import SQLAlchemyError

from superset.exceptions import SupersetException, SupersetSecurityException
from superset.models.dashboard import Dashboard
from superset.utils import core as utils
from superset.views.base import (
    BaseSupersetModelRestApi,
    BaseSupersetSchema,
    check_ownership,
    check_ownership_and_item_exists,
    generate_download_headers,
)

from .mixin import DashboardMixin

logger = logging.getLogger(__name__)
get_delete_ids_schema = {"type": "array", "items": {"type": "integer"}}


class DashboardJSONMetadataSchema(Schema):
    timed_refresh_immune_slices = fields.List(fields.Integer())
    filter_scopes = fields.Dict()
    expanded_slices = fields.Dict()
    refresh_frequency = fields.Integer()
    default_filters = fields.Str()
    filter_immune_slice_fields = fields.Dict()
    stagger_refresh = fields.Boolean()
    stagger_time = fields.Integer()


def validate_json(value):
    try:
        utils.validate_json(value)
    except SupersetException:
        raise ValidationError("JSON not valid")


def validate_json_metadata(value):
    if not value:
        return
    try:
        value_obj = json.loads(value)
    except json.decoder.JSONDecodeError:
        raise ValidationError("JSON not valid")
    errors = DashboardJSONMetadataSchema(strict=True).validate(value_obj, partial=False)
    if errors:
        raise ValidationError(errors)


def validate_slug_uniqueness(value):
    # slug is not required but must be unique
    if value:
        item = (
            current_app.appbuilder.get_session.query(Dashboard.id)
            .filter_by(slug=value)
            .one_or_none()
        )
        if item:
            raise ValidationError("Must be unique")


def validate_owners(value):
    owner = (
        current_app.appbuilder.get_session.query(
            current_app.appbuilder.sm.user_model.id
        )
        .filter_by(id=value)
        .one_or_none()
    )
    if not owner:
        raise ValidationError(f"User {value} does not exist")


class BaseDashboardSchema(BaseSupersetSchema):
    @staticmethod
    def set_owners(instance, owners):
        owner_objs = list()
        if g.user.id not in owners:
            owners.append(g.user.id)
        for owner_id in owners:
            user = current_app.appbuilder.get_session.query(
                current_app.appbuilder.sm.user_model
            ).get(owner_id)
            owner_objs.append(user)
        instance.owners = owner_objs

    @pre_load
    def pre_load(self, data):  # pylint: disable=no-self-use
        data["slug"] = data.get("slug")
        data["owners"] = data.get("owners", [])
        if data["slug"]:
            data["slug"] = data["slug"].strip()
            data["slug"] = data["slug"].replace(" ", "-")
            data["slug"] = re.sub(r"[^\w\-]+", "", data["slug"])


class DashboardPostSchema(BaseDashboardSchema):
    dashboard_title = fields.String(allow_none=True, validate=Length(0, 500))
    slug = fields.String(
        allow_none=True, validate=[Length(1, 255), validate_slug_uniqueness]
    )
    owners = fields.List(fields.Integer(validate=validate_owners))
    position_json = fields.String(validate=validate_json)
    css = fields.String()
    json_metadata = fields.String(validate=validate_json_metadata)
    published = fields.Boolean()

    @post_load
    def make_object(self, data):  # pylint: disable=no-self-use
        instance = Dashboard()
        self.set_owners(instance, data["owners"])
        for field in data:
            if field == "owners":
                self.set_owners(instance, data["owners"])
            else:
                setattr(instance, field, data.get(field))
        return instance


class DashboardPutSchema(BaseDashboardSchema):
    dashboard_title = fields.String(allow_none=True, validate=Length(0, 500))
    slug = fields.String(allow_none=True, validate=Length(0, 255))
    owners = fields.List(fields.Integer(validate=validate_owners))
    position_json = fields.String(validate=validate_json)
    css = fields.String()
    json_metadata = fields.String(validate=validate_json_metadata)
    published = fields.Boolean()

    @post_load
    def make_object(self, data):  # pylint: disable=no-self-use
        if "owners" not in data and g.user not in self.instance.owners:
            self.instance.owners.append(g.user)
        for field in data:
            if field == "owners":
                self.set_owners(self.instance, data["owners"])
            else:
                setattr(self.instance, field, data.get(field))
        for slc in self.instance.slices:
            slc.owners = list(set(self.instance.owners) | set(slc.owners))
        return self.instance


get_export_ids_schema = {"type": "array", "items": {"type": "integer"}}


class DashboardRestApi(DashboardMixin, BaseSupersetModelRestApi):
    datamodel = SQLAInterface(Dashboard)

    resource_name = "dashboard"
    allow_browser_login = True

    class_permission_name = "DashboardModelView"
    method_permission_name = {
        "get_list": "list",
        "get": "show",
        "export": "mulexport",
        "post": "add",
        "put": "edit",
        "delete": "delete",
        "bulk_delete": "delete",
        "info": "list",
        "related": "list",
    }
    show_columns = [
        "dashboard_title",
        "slug",
        "owners.id",
        "owners.username",
        "position_json",
        "css",
        "json_metadata",
        "published",
        "table_names",
        "charts",
    ]
    order_columns = ["dashboard_title", "changed_on", "published", "changed_by_fk"]
    list_columns = [
        "id",
        "dashboard_title",
        "url",
        "published",
        "changed_by.username",
        "changed_by_name",
        "changed_by_url",
        "changed_on",
    ]

    add_model_schema = DashboardPostSchema()
    edit_model_schema = DashboardPutSchema()

    order_rel_fields = {
        "slices": ("slice_name", "asc"),
        "owners": ("first_name", "asc"),
    }
    filter_rel_fields_field = {"owners": "first_name", "slices": "slice_name"}

    @expose("/<pk>", methods=["PUT"])
    @protect()
    @check_ownership_and_item_exists
    @safe
    def put(self, item):  # pylint: disable=arguments-differ
        """Changes a dashboard
        ---
        put:
          parameters:
          - in: path
            schema:
              type: integer
            name: pk
          requestBody:
            description: Model schema
            required: true
            content:
              application/json:
                schema:
                  $ref: '#/components/schemas/{{self.__class__.__name__}}.put'
          responses:
            200:
              description: Item changed
              content:
                application/json:
                  schema:
                    type: object
                    properties:
                      result:
                        $ref: '#/components/schemas/{{self.__class__.__name__}}.put'
            400:
              $ref: '#/components/responses/400'
            401:
              $ref: '#/components/responses/401'
            403:
              $ref: '#/components/responses/401'
            404:
              $ref: '#/components/responses/404'
            422:
              $ref: '#/components/responses/422'
            500:
              $ref: '#/components/responses/500'
        """
        if not request.is_json:
            self.response_400(message="Request is not JSON")
        item = self.edit_model_schema.load(request.json, instance=item)
        if item.errors:
            return self.response_422(message=item.errors)
        try:
            self.datamodel.edit(item.data, raise_exception=True)
            return self.response(
                200, result=self.edit_model_schema.dump(item.data, many=False).data
            )
        except SQLAlchemyError as e:
            return self.response_422(message=str(e))

    @expose("/", methods=["POST"])
    @protect()
    @safe
    def post(self):
        """Creates a new dashboard
        ---
        post:
          requestBody:
            description: Model schema
            required: true
            content:
              application/json:
                schema:
                  $ref: '#/components/schemas/{{self.__class__.__name__}}.post'
          responses:
            201:
              description: Dashboard added
              content:
                application/json:
                  schema:
                    type: object
                    properties:
                      id:
                        type: string
                      result:
                        $ref: '#/components/schemas/{{self.__class__.__name__}}.post'
            400:
              $ref: '#/components/responses/400'
            401:
              $ref: '#/components/responses/401'
            422:
              $ref: '#/components/responses/422'
            500:
              $ref: '#/components/responses/500'
        """
        if not request.is_json:
            return self.response_400(message="Request is not JSON")
        item = self.add_model_schema.load(request.json)
        # This validates custom Schema with custom validations
        if item.errors:
            return self.response_422(message=item.errors)
        try:
            self.datamodel.add(item.data, raise_exception=True)
            return self.response(
                201,
                result=self.add_model_schema.dump(item.data, many=False).data,
                id=item.data.id,
            )
        except SQLAlchemyError as e:
            return self.response_422(message=str(e))

    @expose("/", methods=["DELETE"])
    @protect()
    @safe
    @rison(get_delete_ids_schema)
    def bulk_delete(self, **kwargs):  # pylint: disable=arguments-differ
        """Delete bulk Dashboards
        ---
        delete:
          parameters:
          - in: query
            name: q
            content:
              application/json:
                schema:
                  type: array
                  items:
                    type: integer
          responses:
            200:
              description: Dashboard bulk delete
              content:
                application/json:
                  schema:
                    type: object
                    properties:
                      message:
                        type: string
            401:
              $ref: '#/components/responses/401'
            403:
              $ref: '#/components/responses/401'
            404:
              $ref: '#/components/responses/404'
            422:
              $ref: '#/components/responses/422'
            500:
              $ref: '#/components/responses/500'
        """
        item_ids = kwargs["rison"]
        query = self.datamodel.session.query(Dashboard).filter(
            Dashboard.id.in_(item_ids)
        )
        items = self._base_filters.apply_all(query).all()
        if not items:
            return self.response_404()
        # Check user ownership over the items
        for item in items:
            try:
                check_ownership(item)
            except SupersetSecurityException as e:
                logger.warning(
                    f"Dashboard {item} was not deleted, "
                    f"because the user ({g.user}) does not own it"
                )
                return self.response(403, message=_("No dashboards deleted"))
            except SQLAlchemyError as e:
                logger.error(f"Error checking dashboard ownership {e}")
                return self.response_422(message=str(e))
        # bulk delete, first delete related data
        for item in items:
            try:
                item.slices = []
                item.owners = []
                self.datamodel.session.merge(item)
            except SQLAlchemyError as e:
                logger.error(f"Error bulk deleting related data on dashboards {e}")
                self.datamodel.session.rollback()
                return self.response_422(message=str(e))
        # bulk delete itself
        try:
            self.datamodel.session.query(Dashboard).filter(
                Dashboard.id.in_(item_ids)
            ).delete(synchronize_session="fetch")
        except SQLAlchemyError as e:
            logger.error(f"Error bulk deleting dashboards {e}")
            self.datamodel.session.rollback()
            return self.response_422(message=str(e))
        self.datamodel.session.commit()
        return self.response(
            200,
            message=ngettext(
                f"Deleted %(num)d dashboard",
                f"Deleted %(num)d dashboards",
                num=len(items),
            ),
        )

    @expose("/<pk>", methods=["DELETE"])
    @protect()
    @check_ownership_and_item_exists
    @safe
    def delete(self, item):  # pylint: disable=arguments-differ
        """Delete Dashboard
        ---
        delete:
          parameters:
          - in: path
            schema:
              type: integer
            name: pk
          responses:
            200:
              description: Dashboard delete
              content:
                application/json:
                  schema:
                    type: object
                    properties:
                      message:
                        type: string
            401:
              $ref: '#/components/responses/401'
            403:
              $ref: '#/components/responses/401'
            404:
              $ref: '#/components/responses/404'
            422:
              $ref: '#/components/responses/422'
            500:
              $ref: '#/components/responses/500'
        """
        try:
            self.datamodel.delete(item, raise_exception=True)
            return self.response(200, message="OK")
        except SQLAlchemyError as e:
            return self.response_422(message=str(e))

    @expose("/export/", methods=["GET"])
    @protect()
    @safe
    @rison(get_export_ids_schema)
    def export(self, **kwargs):
        """Export dashboards
        ---
        get:
          parameters:
          - in: query
            name: q
            content:
              application/json:
                schema:
                  type: array
                  items:
                    type: integer
          responses:
            200:
              description: Dashboard export
              content:
                text/plain:
                  schema:
                    type: string
            400:
              $ref: '#/components/responses/400'
            401:
              $ref: '#/components/responses/401'
            404:
              $ref: '#/components/responses/404'
            422:
              $ref: '#/components/responses/422'
            500:
              $ref: '#/components/responses/500'
        """
        query = self.datamodel.session.query(Dashboard).filter(
            Dashboard.id.in_(kwargs["rison"])
        )
        query = self._base_filters.apply_all(query)
        ids = [item.id for item in query.all()]
        if not ids:
            return self.response_404()
        export = Dashboard.export_dashboards(ids)
        resp = make_response(export, 200)
        resp.headers["Content-Disposition"] = generate_download_headers("json")[
            "Content-Disposition"
        ]
        return resp
