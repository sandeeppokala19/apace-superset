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
from typing import List, Optional, TypedDict, Union

from flask_appbuilder.security.sqla.models import Role
from flask_login import AnonymousUserMixin


class GuestTokenUser(TypedDict, total=False):
    username: str
    first_name: str
    last_name: str


class GuestTokenResource(TypedDict):
    type: str
    id: Union[str, int]
    rls: Optional[str]


class GuestToken(TypedDict):
    iat: float
    exp: float
    user: GuestTokenUser
    resources: List[GuestTokenResource]


class GuestUser(AnonymousUserMixin):
    """
    Used as the "anonymous" user in case of guest authentication (embedded)
    """

    is_guest_user = True

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    def __init__(self, token: GuestToken, roles: List[Role]):
        user = token["user"]
        self.guest_token = token
        self.username = user.get("username", "guest_user"),
        self.first_name = user.get("first_name", "Guest"),
        self.last_name = user.get("last_name", "User"),
        self.roles = roles,
        self.resources = token["resources"],
