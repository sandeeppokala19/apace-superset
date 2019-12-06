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
from flask_appbuilder.security.sqla import models as ab_models
from sqlalchemy import and_, or_

import superset.models.core as models
from superset import db, security_manager
from superset.views.base import BaseFilter

from ..base import get_user_roles


class DashboardFilter(BaseFilter):
    """
    List dashboards with the following criteria:
        1. Those which the user owns
        2. Those which the user has favorited
        3. Those which have been published (if they have access to at least one slice)

    If the user is an admin show them all dashboards.
    This means they do not get curation but can still sort by "published"
    if they wish to see those dashboards which are published first
    """

    def apply(self, query, func):
        dash = models.Dashboard
        user = ab_models.User
        slice = models.Slice
        favorites = models.FavStar

        user_roles = [role.name.lower() for role in list(get_user_roles())]
        if "admin" in user_roles:
            return query

        datasource_perms = security_manager.user_view_menu_names("datasource_access")
        schema_perms = security_manager.user_view_menu_names("schema_access")
        all_datasource_access = security_manager.all_datasource_access()
        published_dash_query = (
            db.session.query(dash.id)
            .join(dash.slices)
            .filter(
                and_(
                    dash.published == True,  # pylint: disable=singleton-comparison
                    or_(
                        slice.perm.in_(datasource_perms),
                        slice.schema_perm.in_(schema_perms),
                        all_datasource_access,
                    ),
                )
            )
        )

        users_favorite_dash_query = db.session.query(favorites.obj_id).filter(
            and_(
                favorites.user_id == user.get_user_id(),
                favorites.class_name == "Dashboard",
            )
        )
        owner_ids_query = (
            db.session.query(dash.id)
            .join(dash.owners)
            .filter(user.id == user.get_user_id())
        )

        query = query.filter(
            or_(
                dash.id.in_(owner_ids_query),
                dash.id.in_(published_dash_query),
                dash.id.in_(users_favorite_dash_query),
            )
        )

        return query
