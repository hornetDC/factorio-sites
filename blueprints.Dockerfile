FROM node:14-slim as builder

WORKDIR /usr/src/app

COPY package.json .
COPY yarn.lock .
COPY fbe-editor-v1.0.0.tgz .

RUN yarn

COPY . .

RUN yarn nx build blueprints

FROM node:14-slim

WORKDIR /usr/src/app

COPY apps/blueprints/prod.package.json ./package.json
COPY yarn.lock .
COPY fbe-editor-v1.0.0.tgz .

RUN yarn install --production

COPY --from=builder /usr/src/app/dist/apps/blueprints .

CMD ["yarn", "next", "start"]