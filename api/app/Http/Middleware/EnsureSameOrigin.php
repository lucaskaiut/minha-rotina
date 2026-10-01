<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSameOrigin
{
    /**
     * Proteção CSRF para requisições autenticadas por cookie.
     * Requisições com Bearer explícito não usam cookie e ficam isentas.
     *
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true)) {
            return $next($request);
        }

        $cookieName = (string) config('rotina.token_cookie.name');
        $usesCookie = $request->cookies->has($cookieName);

        if (! $usesCookie) {
            return $next($request);
        }

        $origin = $request->headers->get('Origin') ?: $request->headers->get('Referer');

        // Ferramentas sem Origin (curl, testes) seguem livres; o navegador sempre envia Origin em POST cross-site.
        if (! $origin) {
            return $next($request);
        }

        $allowed = collect(array_merge(
            [(string) config('rotina.frontend_url')],
            (array) config('cors.allowed_origins', []),
        ))->filter()->unique();

        if (! $allowed->contains($this->normalize($origin))) {
            return response()->json(['message' => 'Origem não autorizada.'], 403);
        }

        return $next($request);
    }

    private function normalize(string $url): string
    {
        $scheme = parse_url($url, PHP_URL_SCHEME);
        $host = parse_url($url, PHP_URL_HOST);
        $port = parse_url($url, PHP_URL_PORT);

        if (! $scheme || ! $host) {
            return $url;
        }

        return $port ? "{$scheme}://{$host}:{$port}" : "{$scheme}://{$host}";
    }
}
