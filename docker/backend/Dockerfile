# docker/backend/Dockerfile
FROM php:8.2-cli

# 1) System packages + PHP extensions cần cho Laravel/MySQL
RUN apt-get update && apt-get install -y \
    libzip-dev zip unzip git \
 && docker-php-ext-install pdo_mysql zip

# 2) Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# ⚠️ Dev: KHÔNG copy code và KHÔNG chạy composer trong build,
# vì lúc chạy bạn sẽ bind mount ./backend vào /var/www

EXPOSE 9000

# 3) Khi container khởi động:
# - Nếu chưa có vendor/ thì composer install
# - Tạo APP_KEY nếu thiếu
# - (tuỳ) migrate DB
# - Chạy server dev
CMD sh -lc '\
  if [ ! -d vendor ]; then composer install --no-interaction --prefer-dist; fi && \
  php artisan key:generate --force || true && \
  php artisan migrate --force || true && \
  php artisan serve --host=0.0.0.0 --port=9000'
