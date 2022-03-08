<?php

namespace App\Http\Controllers\General;

use App\Http\Controllers\Controller;
use App\Language;
use App\LanguageTranslation;
use App\Page;
use App\Setting;
use Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Schema;

class UpgradeAppController extends Controller
{

    /**
     *  Start maintenance mode
     */
    public function up()
    {
        $command = Artisan::call('up');

        if ($command === 0) {
            echo 'System is in production mode';
        }
    }

    /**
     *  End maintenance mode
     */
    public function down()
    {
        $command = Artisan::call('down');

        if ($command === 0) {
            echo 'System is in maintenance mode';
        }
    }

    public function translations_fix()
    {
        if (!Schema::hasTable('languages') && !Schema::hasTable('language_translations')) {
            $this->upgrade_database();
        }

        $setting = Setting::firstWhere('name', 'language');

        if (!$setting) {
            Setting::create([
                'name'  => 'language',
                'value' => 'en',
            ]);
        }

        $locale = Language::firstWhere('locale', 'en');

        if (!$locale) {
            DB::table('languages')
                ->insert([
                    'id'     => Str::uuid(),
                    'name'   => 'English',
                    'locale' => 'en'
                ]);
        }

        $translations = LanguageTranslation::firstWhere('key', 'alerts.error_confirm');

        if (!$translations) {
            $translations = [
                'extended' => collect([
                    config("language-translations.extended"),
                    config("language-translations.regular"),
                    config("custom-language-translations")
                ])->collapse(),
                'regular'  => collect([
                    config("language-translations.regular"),
                    config("custom-language-translations")
                ])->collapse(),
            ];

            $translations = $translations[strtolower(get_setting('license'))]
                ->map(function ($value, $key) {
                    return [
                        'lang'  => 'en',
                        'value' => $value,
                        'key'   => $key,
                    ];
                })->toArray();

            $chunks = array_chunk($translations, 100);

            foreach ($chunks as $chunk) {
                DB::table('language_translations')
                    ->insert($chunk);
            }
        }

        Artisan::call('cache:clear');
        Artisan::call('config:clear');
        Artisan::call('config:cache');
    }

    /**
     *  Upgrade database
     */
    public function upgrade()
    {
        /*
         * Upgrade languages
         *
         * @since v1.8.3
        */
        if (!Schema::hasTable('languages') && !Schema::hasTable('language_translations')) {

            $this->upgrade_database();

            Setting::create([
                'name'  => 'language',
                'value' => 'en',
            ]);

            DB::table('languages')
                ->insert([
                    'id'     => Str::uuid(),
                    'name'   => 'English',
                    'locale' => 'en'
                ]);

            $translations = [
                'extended' => collect([
                    config("language-translations.extended"),
                    config("language-translations.regular"),
                    config("custom-language-translations")
                ])->collapse(),
                'regular'  => collect([
                    config("language-translations.regular"),
                    config("custom-language-translations")
                ])->collapse(),
            ];

            $translations = $translations[strtolower(get_setting('license'))]
                ->map(function ($value, $key) {
                    return [
                        'lang'  => 'en',
                        'value' => $value,
                        'key'   => $key,
                    ];
                })->toArray();

            $chunks = array_chunk($translations, 100);

            foreach ($chunks as $chunk) {
                DB::table('language_translations')
                    ->insert($chunk);
            }

            Artisan::call('cache:clear');
            Artisan::call('config:clear');
            Artisan::call('config:cache');
        }

        /*
         * Upgrade user_settings & file_manager_folders table
         *
         * @since v1.8.1
        */
        if (!Schema::hasColumn('user_settings', 'timezone') && !Schema::hasColumn('file_manager_folders', 'icon_color')) {

            $this->upgrade_database();

            // Create legal pages and index content for regular license
            if (get_setting('license') === 'Regular') {

                $pages = collect(config('content.pages'));
                $content = collect(config('content.content_regular'));

                $content->each(function ($content) {
                    Setting::updateOrCreate($content);
                });

                $pages->each(function ($page) {
                    Page::updateOrCreate($page);
                });
            }
        }

        /*
         * Upgrade expire_in in shares table
         *
         * @since v1.8
        */
        if (!Schema::hasTable('traffic') && !Schema::hasTable('zips') && !Schema::hasTable('jobs')) {

            $this->upgrade_database();
        }
        /*
         * Upgrade expire_in in shares table
         *
         * @since v1.8
        */
        if (!Schema::hasTable('traffic') && !Schema::hasTable('zips') && !Schema::hasTable('jobs')) {

            $this->upgrade_database();
        }

        /*
         * Upgrade expire_in in shares table
         *
         * @since v1.7.9
        */
        if (!Schema::hasColumn('shares', 'expire_in')) {

            $this->upgrade_database();
        }

        /*
         * Upgrade expire_in in shares table
         *
         * @since v1.7.11
        */
        if (!Schema::hasColumn('file_manager_files', 'metadata')) {

            $this->upgrade_database();
        }
    }

    /**
     * @return int|mixed
     */
    private function upgrade_database()
    {
        $command = Artisan::call('migrate', [
            '--force' => true
        ]);

        if ($command === 0) {
            echo 'Operation was successful.';
        }

        if ($command === 1) {
            echo 'Operation failed.';
        }
        return $command;
    }
}
