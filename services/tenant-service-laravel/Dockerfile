FROM php:8.3-cli-alpine

RUN apk add --no-cache pcre-dev ${PHPIZE_DEPS} \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && docker-php-ext-install pdo pdo_mysql bcmath \
    && apk del pcre-dev ${PHPIZE_DEPS}

WORKDIR /app

COPY . /app

RUN test -f /app/vendor/autoload.php \
    || (echo "Missing vendor/autoload.php. Run composer install locally in services/tenant-service-laravel." && exit 1)

EXPOSE 8080

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8080"]
