#!/usr/bin/env bash
#
# Licensed to the Apache Software Foundation (ASF) under one or more
# contributor license agreements.  See the NOTICE file distributed with
# this work for additional information regarding copyright ownership.
# The ASF licenses this file to You under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with
# the License.  You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
set -e

# zstd exe is required by simple-zstd package
apt-get update
apt-get install -y zstd

# Packages needed for puppeteer:
if [ "$PUPPETEER_SKIP_CHROMIUM_DOWNLOAD" = "false" ]; then
    apt install -y chromium
fi

if [ "$BUILD_SUPERSET_FRONTEND_IN_DOCKER" = "true" ]; then
    echo "Building Superset frontend in dev mode inside docker container"
    cd /app/superset-frontend
    if [[ ! -d node_modules ]] || [[ "$SUPERSET_FRONTEND_NPM_INSTALL_FORCE" = "true" ]]; then
        echo "Running 'npm install'"
        export NODE_OPTIONS=--max_old_space_size=8192
        npm install
    fi
    echo "Running frontend"
    npm run dev

else
    echo "Skipping frontend build steps - YOU NEED TO RUN IT MANUALLY ON THE HOST!"
    echo "https://superset.apache.org/docs/contributing/development/#webpack-dev-server"
fi
