# Homework NestJS API

REST API на NestJS с JWT-аутентификацией (access/refresh токены), управлением пользователями, Prisma ORM и PostgreSQL.

## Требования

- Node.js 20+
- Docker (для локального PostgreSQL) либо уже запущенный сервер PostgreSQL

## Установка и настройка

1. Установить зависимости:

```bash
$ npm install
```

2. Поднять базу данных:

```bash
$ docker compose up -d
```

## Prisma

```bash
# сгенерировать Prisma Client (выполнять после каждого изменения схемы)
$ npx prisma generate

# применить существующие миграции и сгенерировать клиент (локальная разработка)
$ npx prisma migrate dev

# создать новую миграцию после правок в prisma/schema.prisma
$ npx prisma migrate dev --name <название_миграции>

# применить миграции без создания новых (production / CI)
$ npx prisma migrate deploy

# просмотр данных в браузере
$ npx prisma studio
```

## Хранилище файлов (MinIO)

Аватары хранятся в MinIO (S3-совместимое хранилище), который поднимается вместе с базой через `docker compose up -d`.

- Веб-консоль: `http://localhost:9001`
- S3 API: `http://localhost:9000`
- Логин: `minioadmin`
- Пароль: `minioadmin`

Имя бакета задаётся переменной `S3_BUCKET_NAME` в `.env`.

## Запуск проекта

```bash
# обычный запуск
$ npm run start

# режим отслеживания изменений
$ npm run start:dev

# режим отладки
$ npm run start:debug

# только сборка
$ npm run build

```

После запуска Swagger UI доступен по адресу `http://localhost:$PORT/docs`.

## Тесты

```bash
# юнит-тесты
$ npm run test

# режим отслеживания изменений
$ npm run test:watch

# покрытие тестами
$ npm run test:cov
```

## Линтер и форматирование

```bash
$ npm run lint
$ npm run format
```
