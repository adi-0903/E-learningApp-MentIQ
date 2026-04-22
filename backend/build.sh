#!/usr/bin/env bash
# exit on error
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt

# Set PYTHONPATH to current directory
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

python manage.py collectstatic --no-input
python manage.py migrate
