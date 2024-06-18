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

# pylint: disable=invalid-name

from typing import Any
from uuid import UUID

import pytest
from freezegun import freeze_time
from sqlalchemy.orm import Session, sessionmaker

from superset.commands.key_value.get import GetKeyValueCommand
from superset.exceptions import CreateKeyValueDistributedLockFailedException
from superset.key_value.types import JsonKeyValueCodec, KeyValueResource
from superset.utils.lock import get_key, KeyValueDistributedLock

MAIN_KEY = get_key("ns", a=1, b=2)
OTHER_KEY = get_key("ns2", a=1, b=2)


def _get_lock(key: UUID, session: Session) -> Any:
    return GetKeyValueCommand(
        resource=KeyValueResource.LOCK,
        key=key,
        codec=JsonKeyValueCodec(),
        session=session,
    ).run()


def _get_session() -> Session:
    from superset import db

    bind = db.session.get_bind()
    SessionMaker = sessionmaker(bind=bind)
    return SessionMaker()


def test_key_value_distributed_lock_happy_path() -> None:
    """
    Test successfully acquiring and returning the distributed lock.
    """
    session = _get_session()

    with freeze_time("2021-01-01"):
        assert _get_lock(MAIN_KEY, session) is None
        with KeyValueDistributedLock("ns", a=1, b=2) as key:
            assert key == MAIN_KEY
            assert _get_lock(key, session) is True
            assert _get_lock(OTHER_KEY, session) is None
            with pytest.raises(CreateKeyValueDistributedLockFailedException):
                with KeyValueDistributedLock("ns", a=1, b=2):
                    pass

        assert _get_lock(MAIN_KEY, session) is None


def test_key_value_distributed_lock_expired() -> None:
    """
    Test expiration of the distributed lock
    """
    session = _get_session()

    with freeze_time("2021-01-01T"):
        assert _get_lock(MAIN_KEY, session) is None
        with KeyValueDistributedLock("ns", a=1, b=2):
            assert _get_lock(MAIN_KEY, session) is True
            with freeze_time("2022-01-01T"):
                assert _get_lock(MAIN_KEY, session) is None

        assert _get_lock(MAIN_KEY, session) is None
