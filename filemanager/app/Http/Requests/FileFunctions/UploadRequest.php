<?php

namespace App\Http\Requests\FileFunctions;

use App\Rules\MimetypeBlacklistValidation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UploadRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'filename'  => 'required|string',
            'parent_id' => 'required|integer',
            'file'      => ['required', 'file', new MimetypeBlacklistValidation]
        ];
    }
}
