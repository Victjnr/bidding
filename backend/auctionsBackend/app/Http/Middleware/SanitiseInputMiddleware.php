<?php

namespace App\Http\Middleware;

use Closure;
use HTMLPurifier;
use HTMLPurifier_Config;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SanitiseInputMiddleware
{
    /**
     * Fields that should use HTMLPurifier instead of strip_tags.
     * These fields allow a safe subset of HTML.
     */
    protected array $htmlPurifierFields = ['description'];

    protected ?HTMLPurifier $purifier = null;

    protected function getPurifier(): HTMLPurifier
    {
        if ($this->purifier === null) {
            $config = HTMLPurifier_Config::createDefault();
            $config->set('HTML.Allowed', 'p,br,strong,em,ul,ol,li,h3,h4,blockquote,a[href]');
            $config->set('HTML.ForbiddenElements', ['script', 'iframe', 'form', 'input', 'object', 'style']);
            $config->set('HTML.ForbiddenAttributes', ['on*']);
            $config->set('Attr.AllowedFrameTargets', ['_blank']);
            $config->set('URI.AllowedSchemes', ['http' => true, 'https' => true]);
            $config->set('Cache.SerializerPath', storage_path('app/purifier'));

            $this->purifier = new HTMLPurifier($config);
        }

        return $this->purifier;
    }

    public function handle(Request $request, Closure $next): Response
    {
        $input = $request->all();

        $sanitised = $this->sanitise($input);

        $request->merge($sanitised);

        return $next($request);
    }

    protected function sanitise(array $input, string $parentKey = ''): array
    {
        foreach ($input as $key => $value) {
            $fullKey = $parentKey ? "{$parentKey}.{$key}" : $key;

            if (is_array($value)) {
                $input[$key] = $this->sanitise($value, $fullKey);
            } elseif (is_string($value)) {
                if (in_array($key, $this->htmlPurifierFields)) {
                    // Use HTMLPurifier for rich-text fields
                    $input[$key] = $this->getPurifier()->purify($value);
                } else {
                    // Strip all HTML tags for everything else
                    $input[$key] = strip_tags($value);
                }
            }
        }

        return $input;
    }
}
