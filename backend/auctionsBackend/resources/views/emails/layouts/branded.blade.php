@component('mail::layout')
    {{-- Header --}}
    @slot('header')
        @component('mail::header', ['url' => config('app.url')])
            <img src="{{ asset('images/logo.png') }}" class="logo" alt="Upload Technologies Logo" style="height: 50px;">
        @endcomponent
    @endslot

    {{-- Body --}}
    # {{ $header ?? 'Notification' }}

    {{ $body ?? '' }}

    @if(isset($actionText) && isset($actionUrl))
        @component('mail::button', ['url' => $actionUrl, 'color' => 'success'])
            {{ $actionText }}
        @endcomponent
    @endif

    {{-- Subcopy --}}
    @isset($subcopy)
        @slot('subcopy')
            @component('mail::subcopy')
                {{ $subcopy }}
            @endcomponent
        @endslot
    @endisset

    {{-- Footer --}}
    @slot('footer')
        @component('mail::footer')
            <hr style="border-top: 2px solid orange;">
            © {{ date('Y') }} Upload Technologies. All rights reserved.<br>
            123 Business Rd, Tech City, TX 75001<br>
            <br>
            If you no longer wish to receive these emails, you can <a href="{{ URL::signedRoute('unsubscribe', ['user' => $notifiable->id ?? 0]) }}">unsubscribe here</a>.
        @endcomponent
    @endslot
@endcomponent
