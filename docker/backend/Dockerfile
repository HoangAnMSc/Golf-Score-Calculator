
FROM php:8.2-cli

RUN apt-get update && apt-get install -y \
  libzip-dev zip unzip git \
  && docker-php-ext-install pdo_mysql zip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

EXPOSE 9000

CMD sh -lc '\
  if [ ! -d vendor ]; then composer install --no-interaction --prefer-dist; fi && \
  php artisan key:generate --force || true && \
  php artisan migrate --force || true && \
  php artisan serve --host=0.0.0.0 --port=9000'
