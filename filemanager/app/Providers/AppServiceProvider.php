<?php

namespace App\Providers;

use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Laravel\Passport\Console\ClientCommand;
use Laravel\Passport\Console\InstallCommand;
use Laravel\Passport\Console\KeysCommand;

//hiCreo
use Illuminate\Routing\UrlGenerator;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        //
    }

    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    //hiCreo
    //public function boot()
    public function boot(UrlGenerator $url)
    {
        Schema::defaultStringLength(191);

        try {
            $app_language = get_setting('language') ?? 'en';
        } catch (\PDOException $exception) {
            $app_language = 'en';
        }

        //hiCreo
        if (env('APP_ENV') !== 'local') {
            $url->forceScheme('https');
        }
        
        // Set locale for application
        app()->setLocale($app_language);

        // Set locale for carbon dates
        setlocale(LC_TIME, $app_language . '_' . mb_strtoupper($app_language));

        // Install passport commands
        $this->commands([
            InstallCommand::class,
            ClientCommand::class,
            KeysCommand::class,
        ]);
    }
}
