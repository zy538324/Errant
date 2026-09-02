<?php

define('LARAVEL_START', microtime(true));

// Register the auto loader as early as possible, giving us
// access to the remainder of this file so we can actually
// get the application up and running.
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and get the application instance. If we catch an exception from
// attempting to get the application bootstrap there are a few possibilities -- it could
// have never been bootstrapped before, thus the request will be halted since there's
// not even a container or anything to handle any exceptions further processing.
$app = require_once __DIR__.'/../bootstrap/app.php';

// Handle the incoming request through the HTTP kernel and send the response
// back to the client. The kernel will pass the request to the router
// which will dispatch it to a matching route or controller.
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

$response->send();

$kernel->terminate($request, $response);
