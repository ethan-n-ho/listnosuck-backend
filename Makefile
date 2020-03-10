DOCKERHUB_ORG=enho
IMAGE_NAME=listnosuck-backend
IMAGE_TAG=test
GITREF=$(shell git rev-parse --short HEAD)
IMAGE=$(DOCKERHUB_ORG)/$(IMAGE_NAME):$(IMAGE_TAG)

####################################
# Sanity checks
####################################
PROGRAMS := git docker python jq
.PHONY: $(PROGRAMS)
.SILENT: $(PROGRAMS)

docker:
	docker info 1> /dev/null 2> /dev/null && \
	if [ ! $$? -eq 0 ]; then \
		echo "\n[ERROR] Could not communicate with docker daemon. You may need to run with sudo.\n"; \
		exit 1; \
	fi
python jq:
	$@ -h &> /dev/null; \
	if [ ! $$? -eq 0 ]; then \
		echo "[ERROR] $@ does not seem to be on your path. Please install $@"; \
		exit 1; \
	fi
git:
	$@ -h &> /dev/null; \
	if [ ! $$? -eq 129 ]; then \
		echo "[ERROR] $@ does not seem to be on your path. Please install $@"; \
		exit 1; \
	fi

####################################
# Build/test
####################################

.env:
	if [ ! -f $* ]; then \
		@echo "Touching file $@"
		echo "PORT=3000" > $@
	fi

image: Dockerfile .env | docker
	docker build --rm -t $(IMAGE) -f $< .

shell: image | docker
	docker run --rm -it -p 3000:3000 $(IMAGE) bash

node: image | docker
	docker run --rm -it --init -p 3000:3000 --env-file .env $(IMAGE) node src/server.js

node-hello: image | docker
	docker run --rm -it --init -p 3000:3000 --env-file .env $(IMAGE) node tests/hello.js
