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
import logging
from typing import Any, Dict

from superset.dao.base import BaseDAO
from superset.dao.exceptions import DAOCreateFailedError
from superset.extensions import db
from superset.tags.models import ObjectTypes, Tag, TaggedObject, TagTypes

logger = logging.getLogger(__name__)


class TagDAO(BaseDAO):
    model_cls = Tag
    # base_filter = TagAccessFilter
    @staticmethod
    def validate_tag_name(tag_name: str) -> bool:
        if ":" in tag_name:
            return False
        return True

    @staticmethod
    def create_custom_tagged_objects(
        object_type: ObjectTypes, object_id: int, properties: Dict[str, Any]
    ) -> None:
        tag_names = properties["tags"]

        tagged_objects = []
        for name in tag_names:
            if not TagDAO.validate_tag_name(name):
                raise DAOCreateFailedError(
                    message="Invalid Tag Name (cannot contain ':')"
                )
            type_ = TagTypes.custom
            tag_name = name.strip()
            tag = TagDAO.get_by_name(tag_name, type_)
            tagged_objects.append(
                TaggedObject(object_id=object_id, object_type=object_type, tag=tag)
            )

        db.session.add_all(tagged_objects)
        db.session.commit()

    @staticmethod
    def get_by_name(name: str, type_: TagTypes) -> Tag:
        tag = db.session.query(Tag).filter(Tag.name == name, Tag.type == type_).first()
        if not tag:
            tag = Tag(name=name, type=type_)
        return tag
