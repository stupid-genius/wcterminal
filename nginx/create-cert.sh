#!/bin/bash

openssl req -new -x509 -newkey rsa:2048 -keyout key.pem -nodes -out cert.pem
