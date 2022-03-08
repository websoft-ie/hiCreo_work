<?php
namespace App\Http\Controllers\Auth;

use App\Http\Requests\Auth\CheckAccountRequest;
use App\Setting;
use App\User;
use App\UserSettings;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;

session_start();

class AuthController extends Controller
{

    /**
     * Check if user account exist
     *
     * @param Request $request
     * @return mixed
     */
    public function check_account(CheckAccountRequest $request)
    {
        // Get User
        $user = User::where('email', $request->input('email'))->select(['name', 'avatar'])->first();

        // Return user info
        if ($user) return [
            'name'   => $user->name,
            'avatar' => $user->avatar,
        ];

        // Abort with 404, user not found
        return abort('404', __t('user_not_fount'));
    }

    /**
     * Login user
     *
     * @param Request $request
     * @return mixed
     */
    public function login(Request $request)
    {
        $response = Route::dispatch(self::make_login_request($request));

        if ($response->isSuccessful()) {

            $data = json_decode($response->content(), true);

            return response('Login Successfull!', 200)->cookie('access_token', $data['access_token'], 43200);
        }

        return $response;
    }

    /**
     * Register user
     *
     * @param Request $request
     * @return mixed
     */
    public function register(Request $request)
    {
        $settings = Setting::whereIn('name', ['storage_default', 'registration'])->pluck('value', 'name');

        // Check if account registration is enabled
        if (! intval($settings['registration'])) abort(401);

        //hiCreo
        // Validate request
        /* $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);
        */
        //hiCreo
        $hiCreo_name = 'hiCreo user';
        $hiCreo_password = 'hiCreoPassword2021!!';
        $hiCreo_userID = $_SESSION['hiCreoData'][0];
        // Create user
        $user = User::create([
            'name'     => $hiCreo_name,
            'email'    => $hiCreo_userID,
            'password' => Hash::make($hiCreo_password),
        ]);

        // Create settings
        UserSettings::forceCreate([
            'user_id'          => $user->id,
            'storage_capacity' => $settings['storage_default'],
        ]);

        //hiCreo
        $response = Route::dispatch(self::hiCreo_make_login_request($request));
        //$response = Route::dispatch(self::make_login_request($request));

        if ($response->isSuccessful()) {

            $data = json_decode($response->content(), true);

            return response('Register Successfull!', 200)->cookie('access_token', $data['access_token'], 43200);
        }

        return $response;
    }

    /**
     * Logout user entity
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout()
    {
        //hiCreo
        session_unset();
        
        // Demo preview
        if (is_demo(Auth::id())) {
            return response('Logout successfull', 204)
                ->cookie('access_token', '', -1);
        }

        // Get user tokens and remove it
        auth()->user()->tokens()->each(function ($token) {

            // Remove tokens
            $token->delete();
        });

        return response('Logout successful', 204)
            ->cookie('access_token', '', -1);
    }

    /**
     * Make login request for get access token
     *
     * @param Request $request
     * @return Request
     */
    private static function make_login_request($request)
    {
        $request->request->add([
            'grant_type'    => 'password',
            'client_id'     => config('services.passport.client_id'),
            'client_secret' => config('services.passport.client_secret'),
            'username'      => $request->email,
            'password'      => $request->password,
            'scope'         => 'master',
        ]);
        //print_r($request->all());
        //$request->all()
        //Array ( [email] => user1@user.com [password] => 123456 [grant_type] => password [client_id] => 18 [client_secret] => 2UkIKbBVJ9xVLVlmAyK6gd1pN62rGLXOePy6zrHP [username] => user1@user.com [scope] => master )
        
        return Request::create(url('/oauth/token'), 'POST', $request->all());
    }
    private static function hiCreo_make_login_request($request)
    {
        $hiCreo_userID = $_SESSION['hiCreoData'][0];
        $hiCreo_password = 'hiCreoPassword2021!!';        

        $request->request->add([
            'grant_type'    => 'password',
            'client_id'     => config('services.passport.client_id'),
            'client_secret' => config('services.passport.client_secret'),
            'username'      => $hiCreo_userID,
            'password'      => $hiCreo_password,
            'scope'         => 'master',
        ]);
        //print_r($request->all());
        //$request->all()
        //Array ( [email] => user1@user.com [password] => 123456 [grant_type] => password [client_id] => 18 [client_secret] => 2UkIKbBVJ9xVLVlmAyK6gd1pN62rGLXOePy6zrHP [username] => user1@user.com [scope] => master )
        
        return Request::create(url('/oauth/token'), 'POST', $request->all());
    }
    public function hiCreoLogin(Request $request)
    {
        if(!$_SESSION['hiCreoData']) die(json_encode(array( "status" => 'out', "message" => "missing post data" )));
        
        $response = Route::dispatch(self::hiCreo_make_login_request($request));
        /* echo $response->isSuccessful().'==============';
        print_r($_SESSION['hiCreoData']);
        die; */
        if ($response->isSuccessful()) {

            $data = json_decode($response->content(), true);
            return response($data, 200)->cookie('access_token', $data['access_token'], 43200);
        }

        return $response;
    }
}
