<?php

declare(strict_types=1);

namespace App\Http\Requests\Store;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

final class StoreStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'code' => ['nullable', 'string', 'min:2', 'max:32', 'regex:/^[A-Za-z0-9 _-]+$/'],
            'tenant_id' => ['nullable', 'integer'],
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'error' => $validator->errors()->first(),
        ], 422));
    }
}
