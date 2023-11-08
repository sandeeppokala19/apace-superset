FROM python:3.10-bullseye

RUN apt update --fix-missing && DEBIAN_FRONTEND="noninteractive" apt install -y build-essential libssl-dev libffi-dev python3-dev python3-pip libsasl2-dev libldap2-dev default-libmysqlclient-dev
RUN python3 -m pip install -r requirements/development.txt
RUN python3 -m pip install -r requirements-local.txt

RUN superset db upgrade

# Create an admin user in your metadata database (use `admin` as username to be able to load the examples)
ENV FLASK_APP=superset
RUN superset fab create-admin

# Create default roles and permissions
RUN superset init

# Build javascript assets
WORKDIR /srv/superset/superset-frontend
RUN npm ci
RUN npm run build

WORKDIR /srv/superset
RUN superset run -p 8088 --with-threads --reload --debugger
